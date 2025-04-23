const express = require('express');
const axios = require('axios');
const router = express.Router();

const validateInitialize = (req, res, next) => {
  console.log('Received request body:', req.body);
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

router.post('/', validateInitialize, async (req, res) => {
  const { email, amount, subaccountCode, eventId } = req.body;
  try {
    console.log('Processing initialize:', { email, amount, subaccountCode, eventId });
    if (!process.env.PAYSTACK_SECRET_KEY) {
      throw new Error('PAYSTACK_SECRET_KEY is not defined');
    }
    const paystackPayload = {
      email,
      amount: amount * 100,
      subaccount: subaccountCode,
      bearer: 'subaccount',
      reference: `TICKET-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
      metadata: { eventId },
    };
    console.log('Paystack payload:', paystackPayload);
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      paystackPayload,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('Paystack response:', response.data);
    res.json({
      success: true,
      message: 'Payment initialized',
      data: response.data.data,
    });
  } catch (error) {
    console.error('Initialize error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      stack: error.stack,
    });
    if (error.response?.data?.message === 'Invalid Subaccount.') {
      return res.status(400).json({
        success: false,
        error: 'Invalid subaccount code. Please check the event configuration.',
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to initialize payment',
      details: error.message,
    });
  }
});

module.exports = router;
