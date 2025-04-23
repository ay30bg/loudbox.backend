// In your backend (e.g., index.js or routes/tickets.js)
const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket'); // Adjust based on your model

router.get('/api/verify', async (req, res) => {
  const { ticketId, code } = req.query;
  try {
    const ticket = await Ticket.findOne({ ticketId, transactionReference: code });
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    res.json({ ticket, verified: true });
  } catch (error) {
    console.error('Error verifying ticket:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
