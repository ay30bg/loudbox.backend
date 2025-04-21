const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');

router.get('/', async (req, res) => {
  try {
    const { ticketId, code: transactionReference } = req.query;
    console.log('Verify route - Querying tickets collection for:', { ticketId, transactionReference });
    console.log('Verify route - Database name:', mongoose.connection.db.databaseName);
    console.log('Verify route - Collection name:', Ticket.collection.collectionName);
    if (!ticketId || !transactionReference) {
      return res.status(400).json({
        status: 'invalid',
        message: 'Missing ticketId or transactionReference',
      });
    }
    const ticket = await Ticket.findOne({
      ticketId,
      transactionReference,
    });
    if (!ticket) {
      console.log('Verify route - No ticket found for:', { ticketId, transactionReference });
      return res.status(404).json({
        status: 'invalid',
        message: 'Ticket not found or invalid',
      });
    }
    if (ticket.status !== 'unused') {
      return res.status(403).json({
        status: 'invalid',
        message: `Ticket is ${ticket.status}`,
      });
    }
    res.json({
      status: 'valid',
      message: 'Ticket verified successfully',
      ticket: {
        ticketId: ticket.ticketId,
        transactionReference: ticket.transactionReference,
        eventTitle: ticket.eventTitle,
        eventId: ticket.eventId,
        ticketQuantity: ticket.ticketQuantity,
        totalPrice: ticket.totalPrice,
        ticketHolder: ticket.ticketHolder,
        isGift: ticket.isGift,
        recipient: ticket.recipient,
      },
    });
  } catch (error) {
    console.error('Verify route - Error verifying ticket:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during verification',
    });
  }
});

module.exports = router;
