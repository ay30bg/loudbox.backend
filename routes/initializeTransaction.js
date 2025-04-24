const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
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

    // Validate required fields
    if (!email || !amount || !eventId) {
      console.log('Missing required fields:', req.body);
      return res.status(400).json({
        status: 'error',
        message: 'Email, amount, and eventId are required',
      });
    }

    // Validate PAYSTACK_SECRET_KEY
    if (!process.env.PAYSTACK_SECRET_KEY) {
      console.error('PAYSTACK_SECRET_KEY is not set');
      return res.status(500).json({
        status: 'error',
        message: 'Server configuration error',
      });
    }

    // Prepare Paystack payload
    const paystackPayload = {
      email,
      amount: amount * 100, // Convert to kobo
      callback_url: 'https://loudbox.vercel.app/thank-you',
      metadata: {
        eventId,
        eventTitle: eventTitle || 'Unknown Event',
        ticketQuantity: ticketQuantity || 1,
        customerName: customerName || 'Guest',
        isGift: !!isGift,
        recipientName: isGift ? recipientName : null,
        recipientEmail: isGift ? recipientEmail : null,
        subaccountCode: subaccountCode || null,
      },
    };

    console.log('Initializing Paystack transaction:', paystackPayload);

    // Call Paystack API
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

    const { authorization_url, access_code, reference } = response.data.data;

    res.json({
      status: 'success',
      data: {
        authorizationUrl: authorization_url,
        accessCode: access_code,
        reference,
      },
    });
  } catch (error) {
    console.error('Error initializing transaction:', error.message, error.stack);
    const errorMessage = error.response?.data?.message || error.message;
    res.status(500).json({
      status: 'error',
      message: 'Failed to initialize transaction',
      details: errorMessage,
    });
  }
});

module.exports = router;
