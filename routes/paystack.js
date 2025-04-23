const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const router = express.Router();

// JWT authentication middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Expect "Bearer <token>"
  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach userId and email
    next();
  } catch (error) {
    console.error('JWT error:', error);
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
};

// Input validation middleware
const validateInitialize = (req, res, next) => {
  const { email, amount, subaccountCode, eventId } = req.body;
  if (!email || !amount || !subaccountCode || !eventId) {
    return res.status(400).json({ success: false, error: 'Email, amount, subaccountCode, and eventId are required' });
  }
  if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
    return res.status(400).json({ success: false, error: 'Invalid email format' });
  }
  if (isNaN(amount) || amount <= 0) {
    return res.status(400).json({ success: false, error: 'Amount must be a positive number' });
  }
  next();
};

// Initialize Transaction
router.post('/initialize', authMiddleware, validateInitialize, async (req, res) => {
  const { email, amount, subaccountCode, eventId } = req.body;
  const { userId } = req.user;

  try {
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount: amount * 100, // Convert NGN to kobo
        subaccount: subaccountCode, // Event owner's subaccount
        bearer: 'subaccount', // Subaccount bears fees
        reference: `TICKET-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
        metadata: { userId, eventId },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json({
      success: true,
      message: 'Payment initialized',
      data: response.data.data, // { authorization_url, access_code, reference }
    });
  } catch (error) {
    console.error('Initialize error:', error.response?.data || error.message);
    res.status(500).json({ success: false, error: 'Failed to initialize payment' });
  }
});

// Verify Transaction
router.get('/verify/:reference', authMiddleware, async (req, res) => {
  const { reference } = req.params;
  const { userId } = req.user;

  if (!reference) {
    return res.status(400).json({ success: false, error: 'Reference is required' });
  }

  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const { userId: transactionUserId, eventId } = response.data.data.metadata || {};
    if (transactionUserId !== userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized access to transaction' });
    }

    // Save transaction to MongoDB
    await Transaction.create({
      reference,
      amount: response.data.data.amount / 100,
      subaccount: response.data.data.subaccount?.subaccount_code,
      status: response.data.data.status,
      userId,
      eventId,
      createdAt: new Date(),
    });

    res.json({
      success: true,
      message: 'Transaction verified',
      data: response.data.data,
    });
  } catch (error) {
    console.error('Verify error:', error.response?.data || error.message);
    res.status(500).json({ success: false, error: 'Failed to verify transaction' });
  }
});

// Webhook Handler
router.post('/webhook', async (req, res) => {
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (hash !== req.headers['x-paystack-signature']) {
    console.error('Invalid webhook signature');
    return res.sendStatus(400);
  }

  const event = req.body;

  if (event.event === 'charge.success') {
    const { reference, amount, subaccount, metadata } = event.data;
    const { userId, eventId } = metadata || {};

    try {
      await Transaction.findOneAndUpdate(
        { reference },
        {
          reference,
          amount: amount / 100,
          subaccount: subaccount?.subaccount_code,
          status: 'success',
          userId,
          eventId,
          createdAt: new Date(),
        },
        { upsert: true }
      );
      console.log(`Transaction saved - Reference: ${reference}, Amount: ${amount / 100} NGN, Subaccount: ${subaccount?.subaccount_code}`);
    } catch (error) {
      console.error('Webhook save error:', error);
    }
  }

  res.sendStatus(200);
});

module.exports = router;
