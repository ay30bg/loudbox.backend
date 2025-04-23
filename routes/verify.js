const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');

// Middleware for authentication
const verifyAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const apiKey = process.env.VERIFY_API_KEY; // Store in .env file
  if (!authHeader || authHeader !== `Bearer ${apiKey}`) {
    console.log('Unauthorized verification attempt:', req.query);
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing API key' });
  }
  next();
};

// PUT /api/verify - Verify a ticket and mark it as used
router.put('/', verifyAuth, async (req, res) => {
  try {
    const { ticketId, code } = req.query; // code is transactionReference
    console.log('Verifying ticket:', { ticketId, code });

    // Validate input
    if (!ticketId || !code) {
      console.log('Missing required parameters:', { ticketId, code });
      return res.status(400).json({ error: 'ticketId and code are required' });
    }

    // Find the ticket
    const ticket = await Ticket.findOne({ ticketId, transactionReference: code });
    if (!ticket) {
      console.log('Ticket not found:', { ticketId, code });
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Check if ticket is already used
    if (ticket.status === 'used') {
      console.log('Ticket already used:', ticketId);
      return res.status(400).json({ error: 'Ticket has already been used' });
    }

    // Optional: Restrict verification to event time window
    const eventTimeWindowStart = new Date('2025-04-23T00:00:00Z'); // Example: Replace with event start time
    const eventTimeWindowEnd = new Date('2025-04-24T00:00:00Z'); // Example: Replace with event end time
    const now = new Date();
    if (now < eventTimeWindowStart || now > eventTimeWindowEnd) {
      console.log('Verification attempt outside event time window:', { ticketId, now });
      return res.status(403).json({ error: 'Verification only allowed during event time' });
    }

    // Mark ticket as used
    ticket.status = 'used';
    ticket.usedAt = new Date();
    ticket.usedBy = req.user?.id || 'Staff'; // Replace with actual staff ID if available
    await ticket.save();
    console.log('Ticket marked as used:', { ticketId, usedAt: ticket.usedAt });

    // Respond with success
    res.json({
      message: 'Ticket verified successfully',
      ticketId: ticket.ticketId,
      transactionReference: ticket.transactionReference,
      status: ticket.status,
      usedAt: ticket.usedAt,
      usedBy: ticket.usedBy,
    });
  } catch (err) {
    console.error('Error verifying ticket:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
