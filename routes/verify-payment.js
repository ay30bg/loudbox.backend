// backend/routes/verifyPayment.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

// Environment variables
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_test_xxxxxxxxxx';

// POST /api/verify-payment
router.post('/', async (req, res) => {
  const { reference, eventId } = req.body;

  // Validate request body
  if (!reference || !eventId) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing reference or eventId in request body.',
    });
  }

  try {
    // Verify transaction with Paystack
    const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.data.status || response.data.data.status !== 'success') {
      return res.status(400).json({
        status: 'error',
        message: 'Payment verification failed.',
      });
    }

    // Extract transaction details
    const { amount, customer, metadata, split } = response.data.data;
    const customFields = metadata?.custom_fields?.reduce(
      (acc, field) => ({ ...acc, [field.variable_name]: field.value }),
      {}
    ) || {};

    const {
      event_id,
      event_title,
      ticket_quantity,
      customer_name,
      is_gift,
      recipient_name,
      recipient_email,
      subaccount_code,
    } = customFields;

    // Validate eventId
    if (event_id !== eventId) {
      return res.status(400).json({
        status: 'error',
        message: 'Event ID mismatch.',
      });
    }

    // Prepare ticket data
    const ticketData = {
      ticketId: `TICKET-${Date.now()}`,
      transactionReference: reference,
      eventId: event_id,
      eventTitle: event_title || 'Unknown Event',
      ticketQuantity: parseInt(ticket_quantity, 10) || 1,
      totalPrice: amount / 100, // Convert kobo to naira
      firstName: customer_name?.split(' ')[0] || 'Guest',
      lastName: customer_name?.split(' ').slice(1).join(' ') || '',
      email: customer.email || 'No email provided',
      isGift: is_gift === 'Yes',
      recipientName: recipient_name || null,
      recipientEmail: recipient_email || null,
      subaccountCode: subaccount_code || null,
    };

    // Note: Ticket is saved by frontend via /api/tickets
    res.json({
      status: 'success',
      data: ticketData,
      split: split || null, // Include split details for subaccount verification
    });
  } catch (err) {
    console.error('Verification error:', err.response?.data || err.message);
    res.status(500).json({
      status: 'error',
      message: `Server error during verification: ${err.message}`,
    });
  }
});

module.exports = router;
