// backend/routes/initializeTransaction.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

// Environment variables
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_test_xxxxxxxxxx';

// POST /api/initialize-transaction
router.post('/', async (req, res) => {
  const {
    email,
    amount,
    eventId,
    eventTitle,
    ticketQuantity,
    customerName,
    isGift,
    recipientName,
    recipientEmail,
    subaccountCode,
  } = req.body;

  // Validate request body
  if (!email || !amount || !eventId) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing email, amount, or eventId in request body.',
    });
  }

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid email format.',
    });
  }

  // Validate amount
  const paymentAmount = Number(amount) * 100; // Convert to kobo
  if (!Number.isInteger(paymentAmount) || paymentAmount <= 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid amount. Must be a positive number.',
    });
  }

  try {
    // Initialize transaction with Paystack
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount: paymentAmount,
        currency: 'NGN',
        reference: `TICKET-${Math.floor(Math.random() * 1000000)}-${Date.now()}`,
        subaccount: subaccountCode || undefined,
        bearer: subaccountCode ? 'subaccount' : 'account',
        metadata: {
          custom_fields: [
            {
              display_name: 'Event ID',
              variable_name: 'event_id',
              value: eventId,
            },
            {
              display_name: 'Event Title',
              variable_name: 'event_title',
              value: eventTitle || 'Unknown Event',
            },
            {
              display_name: 'Ticket Quantity',
              variable_name: 'ticket_quantity',
              value: ticketQuantity || 1,
            },
            {
              display_name: 'Customer Name',
              variable_name: 'customer_name',
              value: customerName || 'Guest',
            },
            {
              display_name: 'Is Gift',
              variable_name: 'is_gift',
              value: isGift ? 'Yes' : 'No',
            },
            ...(isGift
              ? [
                  {
                    display_name: 'Recipient Name',
                    variable_name: 'recipient_name',
                    value: recipientName || 'Not provided',
                  },
                  {
                    display_name: 'Recipient Email',
                    variable_name: 'recipient_email',
                    value: recipientEmail || 'Not provided',
                  },
                ]
              : []),
            {
              display_name: 'Subaccount Code',
              variable_name: 'subaccount_code',
              value: subaccountCode || 'None',
            },
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.data.status) {
      return res.status(400).json({
        status: 'error',
        message: response.data.message || 'Failed to initialize transaction.',
      });
    }

    // Return access_code to frontend
    res.json({
      status: 'success',
      access_code: response.data.data.access_code,
      reference: response.data.data.reference,
    });
  } catch (err) {
    console.error('Initialization error:', err.response?.data || err.message);
    res.status(500).json({
      status: 'error',
      message: `Server error during transaction initialization: ${err.message}`,
    });
  }
});

module.exports = router;
