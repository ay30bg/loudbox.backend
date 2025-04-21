const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/initialize-transaction', async (req, res) => {
  const { email, amount, eventId, ticketQuantity } = req.body;

  // Fetch event data (replace with database query if using a DB)
  const event = mockEvents.find((e) => e.id === eventId);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }

  // Define split configuration
  const split = {
    type: 'percentage',
    bearer_type: 'all', // Fees split proportionally
    subaccounts: [
      {
        subaccount: event.subaccount_code,
        share: 80, // Vendor gets 80%
      },
    ],
  };

  try {
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: email || 'guest@example.com',
        amount: amount * 100, // Convert to kobo
        split,
        callback_url: 'https://yourwebsite.com/thank-you', // Update with your thank-you page
        metadata: {
          eventId,
          ticketQuantity,
          eventTitle: event.title,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    res.json({
      authorization_url: response.data.data.authorization_url,
      reference: response.data.data.reference,
    });
  } catch (error) {
    console.error('Error initializing transaction:', error.response?.data);
    res.status(500).json({ error: 'Failed to initialize transaction' });
  }
});

module.exports = router;
