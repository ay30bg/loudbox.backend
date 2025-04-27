// // routes/verify.js
// const express = require('express');
// const router = express.Router();
// const Ticket = require('../models/Ticket'); // Adjust based on your model

// router.get('/', async (req, res) => {
//   const { ticketId, code } = req.query;
//   try {
//     const ticket = await Ticket.findOne({ ticketId, transactionReference: code });
//     if (!ticket) {
//       return res.status(404).json({ error: 'Ticket not found' });
//     }
//     res.json({ ticket, verified: true });
//   } catch (error) {
//     console.error('Error verifying ticket:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// module.exports = router;


const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');

router.get('/', async (req, res) => {
  console.log('Received /api/verify request:', req.query); // Debug log
  const { ticketId, code, eventTitle, firstName, eventDate } = req.query;

  if (!ticketId || !code) {
    console.log('Missing ticketId or code:', { ticketId, code });
    return res.status(400).json({ success: false, error: 'Missing ticketId or code' });
  }

  try {
    const ticket = await Ticket.findOne({ ticketId, transactionReference: code });
    if (!ticket) {
      console.log('Ticket not found:', { ticketId, code });
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    // Optional: Validate additional QR code fields
    if (eventTitle && decodeURIComponent(eventTitle) !== ticket.eventTitle) {
      console.log('Event title mismatch:', { provided: eventTitle, expected: ticket.eventTitle });
      return res.status(400).json({ success: false, error: 'Event title mismatch' });
    }
    if (firstName && decodeURIComponent(firstName) !== ticket.ticketHolder.firstName) {
      console.log('First name mismatch:', { provided: firstName, expected: ticket.ticketHolder.firstName });
      return res.status(400).json({ success: false, error: 'Ticket holder name mismatch' });
    }
    if (eventDate && decodeURIComponent(eventDate) !== ticket.eventDate) {
      console.log('Event date mismatch:', { provided: eventDate, expected: ticket.eventDate });
      return res.status(400).json({ success: false, error: 'Event date mismatch' });
    }

    // Browser-friendly HTML response
    const acceptsHtml = req.accepts('html');
    if (acceptsHtml) {
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Ticket Verification</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
              .success { color: green; }
              .error { color: red; }
            </style>
          </head>
          <body>
            <h1>Ticket Verification</h1>
            <p class="success">Ticket Verified Successfully!</p>
            <p><strong>Ticket ID:</strong> ${ticket.ticketId}</p>
            <p><strong>Event:</strong> ${ticket.eventTitle}</p>
            <p><strong>Ticket Holder:</strong> ${ticket.ticketHolder.firstName}</p>
            <p><strong>Event Date:</strong> ${ticket.eventDate || 'N/A'}</p>
            <p><a href="https://loudbox.vercel.app">Back to Loudbox</a></p>
          </body>
        </html>
      `);
    } else {
      res.json({
        success: true,
        verified: true,
        ticket: {
          ticketId: ticket.ticketId,
          transactionReference: ticket.transactionReference,
          eventTitle: ticket.eventTitle,
          firstName: ticket.ticketHolder.firstName,
          eventDate: ticket.eventDate || 'N/A',
        },
      });
    }
  } catch (error) {
    console.error('Error verifying ticket:', error);
    res.status(500).json({ success: false, error: 'Internal server error', details: error.message });
  }
});

module.exports = router;
