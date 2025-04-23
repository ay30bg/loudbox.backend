const express = require('express');
const axios = require('axios');
const router = express.Router();

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
router.post('/', validateInitialize, async (req, res) => {
  const { email, amount, subaccountCode, eventId } = req.body;

  try {
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount: amount * 100, // Convert NGN to kobo
        subaccount: subaccountCode, // Event owner's subaccount
        bearer: 'subaccount', // Subaccount bears fees
        reference: `TICKET-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
        metadata: { eventId }, // Store eventId
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

module.exports = router;
