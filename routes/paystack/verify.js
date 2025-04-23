const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const Transaction = require('../../models/Transaction');
const router = express.Router();

// Verify Transaction
router.get('/:reference', async (req, res) => {
  const { reference } = req.params;

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

    const { eventId } = response.data.data.metadata || {};

    // Save transaction to MongoDB
    await Transaction.create({
      reference,
      amount: response.data.data.amount / 100,
      subaccount: response.data.data.subaccount?.subaccount_code,
      status: response.data.data.status,
      userId: null, // No userId for guests
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

module.exports = router;
