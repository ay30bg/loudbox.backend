const express = require('express');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Transaction = require('../../models/Transaction');
const router = express.Router();

// Webhook Handler
router.post('/', async (req, res) => {
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
    const { eventId } = metadata || {};

    try {
      await Transaction.findOneAndUpdate(
        { reference },
        {
          reference,
          amount: amount / 100,
          subaccount: subaccount?.subaccount_code,
          status: 'success',
          userId: null, // No userId for guests
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
