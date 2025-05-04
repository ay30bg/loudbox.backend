// const express = require('express');
// const router = express.Router();
// const Ticket = require('../models/Ticket');
// const QRCode = require('qrcode');

// router.get('/:transactionReference', async (req, res) => {
//   try {
//     const { transactionReference } = req.params;
//     console.log('Fetching ticket:', transactionReference);
//     const ticket = await Ticket.findOne({ transactionReference });
//     if (!ticket) {
//       console.log('Ticket not found:', transactionReference);
//       return res.status(404).json({ error: 'Ticket not found' });
//     }
//     const qrCodeUrl = await QRCode.toDataURL(JSON.stringify({ ticketId: ticket.ticketId }));
//     res.json({
//       ticketId: ticket.ticketId,
//       eventTitle: ticket.eventTitle,
//       qrCode: qrCodeUrl,
//       transactionReference: ticket.transactionReference,
//       status: ticket.status,
//       ticketQuantity: ticket.ticketQuantity,
//       totalPrice: ticket.totalPrice,
//       eventId: ticket.eventId,
//       ticketHolder: ticket.ticketHolder, // Include ticketHolder
//       isGift: ticket.isGift,
//       recipient: ticket.recipient, // Include recipient (may be undefined if not a gift)
//     });
//   } catch (err) {
//     console.error('Error fetching ticket:', err);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// router.post('/', async (req, res) => {
//   try {
//     const {
//       ticketId, transactionReference, eventId, eventTitle, firstName, lastName, email,
//       isGift, recipientFirstName, recipientLastName, recipientEmail, ticketQuantity, totalPrice,
//     } = req.body;

//     const ticketData = {
//       ticketId: ticketId || `TICKET-${Date.now()}`,
//       transactionReference: transactionReference || `TICKET-${Math.floor(100000 + Math.random() * 900000)}-${Date.now()}`,
//       eventId,
//       eventTitle,
//       ticketHolder: { firstName, lastName, email },
//       isGift: !!isGift,
//       recipient: isGift ? { firstName: recipientFirstName, lastName: recipientLastName, email: recipientEmail } : undefined,
//       status: 'unused',
//       ticketQuantity,
//       totalPrice,
//     };

//     const ticket = new Ticket(ticketData);
//     await ticket.save();
//     res.status(201).json({
//       ticketId: ticket.ticketId,
//       transactionReference: ticket.transactionReference,
//       eventTitle: ticket.eventTitle,
//     });
//   } catch (err) {
//     console.error('Error creating ticket:', err);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// module.exports = router;

const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');

// Validation middleware for POST
const validateTicketData = (req, res, next) => {
  const {
    ticketId,
    transactionReference,
    eventId,
    eventTitle,
    eventDate,
    ticketHolder,
    ticketQuantity,
    totalPrice,
    status,
  } = req.body;

  // Required fields
  if (!ticketId || !transactionReference || !eventId || !eventTitle || !eventDate || !ticketHolder) {
    return res.status(400).json({ error: 'Missing required fields: ticketId, transactionReference, eventId, eventTitle, eventDate, ticketHolder' });
  }

  // Validate ticketHolder
  if (!ticketHolder.firstName || !ticketHolder.lastName || !ticketHolder.email) {
    return res.status(400).json({ error: 'ticketHolder must include firstName, lastName, and email' });
  }

  // Validate eventDate
  if (isNaN(new Date(eventDate).getTime())) {
    return res.status(400).json({ error: 'Invalid eventDate format' });
  }

  // Validate ticketQuantity and totalPrice
  if (ticketQuantity && (typeof ticketQuantity !== 'number' || ticketQuantity < 1)) {
    return res.status(400).json({ error: 'ticketQuantity must be a positive number' });
  }
  if (totalPrice && (typeof totalPrice !== 'number' || totalPrice < 0)) {
    return res.status(400).json({ error: 'totalPrice must be a non-negative number' });
  }

  // Validate status (if provided)
  if (status && !['unused', 'used', 'expired', 'canceled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  next();
};

// GET /:transactionReference
router.get('/:transactionReference', async (req, res) => {
  try {
    const { transactionReference } = req.params;
    console.log('Fetching ticket:', transactionReference);
    const ticket = await Ticket.findOne({ transactionReference });
    if (!ticket) {
      console.log('Ticket not found:', transactionReference);
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Generate QR code with verification URL (same as TicketDetailsPage)
    const qrCodeValue = `https://loudbox-backend.vercel.app/api/verify?ticketId=${encodeURIComponent(
      ticket.ticketId
    )}&code=${encodeURIComponent(ticket.transactionReference)}&eventTitle=${encodeURIComponent(
      ticket.eventTitle
    )}&firstName=${encodeURIComponent(ticket.ticketHolder.firstName)}&eventDate=${encodeURIComponent(
      ticket.eventDate.toISOString()
    )}&token=${encodeURIComponent(ticket.verificationToken || '')}`;
    const qrCodeUrl = await QRCode.toDataURL(qrCodeValue);

    res.json({
      ticketId: ticket.ticketId,
      transactionReference: ticket.transactionReference,
      eventId: ticket.eventId,
      eventTitle: ticket.eventTitle,
      eventDate: ticket.eventDate,
      ticketHolder: ticket.ticketHolder,
      isGift: ticket.isGift,
      recipient: ticket.recipient,
      status: ticket.status,
      ticketQuantity: ticket.ticketQuantity,
      totalPrice: ticket.totalPrice,
      qrCode: qrCodeUrl,
      verificationToken: ticket.verificationToken,
    });
  } catch (err) {
    console.error('Error fetching ticket:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// POST /
router.post('/', validateTicketData, async (req, res) => {
  try {
    const {
      ticketId,
      transactionReference,
      eventId,
      eventTitle,
      eventDate,
      ticketHolder,
      isGift,
      recipient,
      ticketQuantity,
      totalPrice,
      status,
    } = req.body;

    // Generate verification token
    const verificationToken = jwt.sign(
      { ticketId, transactionReference },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    const ticketData = {
      ticketId,
      transactionReference,
      eventId,
      eventTitle,
      eventDate: new Date(eventDate), // Convert to Date object
      ticketHolder,
      isGift: !!isGift,
      recipient: isGift && recipient && recipient.email ? recipient : undefined,
      status: status || 'unused', // Default to 'unused'
      ticketQuantity: ticketQuantity || 1,
      totalPrice: totalPrice || 0,
      verificationToken,
      tokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour expiry
    };

    const ticket = new Ticket(ticketData);
    await ticket.save();

    res.status(201).json({
      ticketId: ticket.ticketId,
      transactionReference: ticket.transactionReference,
      eventId: ticket.eventId,
      eventTitle: ticket.eventTitle,
      eventDate: ticket.eventDate,
      ticketHolder: ticket.ticketHolder,
      isGift: ticket.isGift,
      recipient: ticket.recipient,
      status: ticket.status,
      ticketQuantity: ticket.ticketQuantity,
      totalPrice: ticket.totalPrice,
      verificationToken: ticket.verificationToken,
    });
  } catch (err) {
    console.error('Error creating ticket:', err);
    if (err.code === 11000) {
      res.status(400).json({ error: 'Ticket ID or transaction reference already exists' });
    } else if (err.name === 'ValidationError') {
      res.status(400).json({ error: 'Invalid ticket data', details: err.message });
    } else {
      res.status(500).json({ error: 'Server error', details: err.message });
    }
  }
});

module.exports = router;
