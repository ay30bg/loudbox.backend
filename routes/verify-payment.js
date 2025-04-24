const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3002; // Use a different port to avoid conflicts with main backend
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_test_xxxxxxxxxx'; // Replace with your Paystack secret key

app.post('/api/verify-payment', async (req, res) => {
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

    // Note: Ticket is not saved here; the frontend's createTicket function handles saving to /api/tickets
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

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Verify-payment endpoint is running' });
});

app.listen(PORT, () => {
  console.log(`Verify-payment server running on port ${PORT}`);
});
