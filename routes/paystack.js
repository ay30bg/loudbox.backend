// routes/paystack.js
const express = require('express');
const nodemailer = require('nodemailer');
const axios = require('axios');
const Transaction = require('../models/Transaction'); // Optional, for storing transactions
const router = express.Router();

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify Paystack Transaction
async function verifyTransaction(reference) {
  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Verification error:', error.response?.data || error.message);
    throw new Error('Transaction verification failed');
  }
}

// Send Ticket Email
async function sendTicketEmail({
  customerEmail,
  recipientEmail,
  eventTitle,
  ticketQuantity,
  totalPrice,
  firstName,
  lastName,
  isGift,
  transactionReference,
}) {
  const ticketDetails = `
    <h2 style="font-family: Poppins, sans-serif; color: #333;">Ticket Confirmation for ${eventTitle}</h2>
    <p style="font-family: Inter, sans-serif; color: #555;">Dear ${firstName} ${lastName},</p>
    <p style="font-family: Inter, sans-serif; color: #555;">Thank you for your purchase! Below are your ticket details:</p>
    <ul style="font-family: Inter, sans-serif; color: #555;">
      <li><strong>Event:</strong> ${eventTitle}</li>
      <li><strong>Tickets:</strong> ${ticketQuantity}</li>
      <li><strong>Total Paid:</strong> NGN ${totalPrice.toLocaleString()}</li>
      <li><strong>Transaction Reference:</strong> ${transactionReference}</li>
    </ul>
    <p style="font-family: Inter, sans-serif; color: #555;">Present this email at the venue for entry.</p>
    <p style="font-family: Inter, sans-serif; color: #555;">Enjoy the event!</p>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: customerEmail,
    subject: `Your ${eventTitle} Ticket Confirmation`,
    html: ticketDetails,
  });

  if (isGift && recipientEmail) {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: recipientEmail,
      subject: `Gift: Your ${eventTitle} Ticket`,
      html: `
        <h2 style="font-family: Poppins, sans-serif; color: #333;">Gift Ticket for ${eventTitle}</h2>
        <p style="font-family: Inter, sans-serif; color: #555;">You've received a gift ticket from ${firstName} ${lastName}!</p>
        ${ticketDetails}
      `,
    });
  }
}

// POST /api/paystack/send-ticket-email
router.post('/send-ticket-email', async (req, res) => {
  const {
    reference,
    customerEmail,
    recipientEmail,
    eventTitle,
    ticketQuantity,
    totalPrice,
    firstName,
    lastName,
    isGift,
  } = req.body;

  try {
    const verification = await verifyTransaction(reference);
    if (verification.data.status !== 'success') {
      return res.status(400).json({ error: 'Transaction not successful' });
    }

    // Optional: Save transaction to MongoDB
    await Transaction.create({
      reference,
      customerEmail,
      recipientEmail,
      eventTitle,
      ticketQuantity,
      totalPrice,
      firstName,
      lastName,
      isGift,
    });

    await sendTicketEmail({
      customerEmail,
      recipientEmail,
      eventTitle,
      ticketQuantity,
      totalPrice,
      firstName,
      lastName,
      isGift,
      transactionReference: reference,
    });

    res.json({ message: 'Ticket email sent successfully' });
  } catch (error) {
    console.error('Error sending ticket email:', error.message);
    res.status(500).json({ error: 'Failed to send ticket email' });
  }
});

module.exports = router;