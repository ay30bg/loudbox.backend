// const express = require('express');
// const router = express.Router();
// const Ticket = require('../models/Ticket');

// router.get('/', async (req, res) => {
//   console.log('Received /api/verify request:', req.query); // Debug log
//   const { ticketId, code, eventTitle, firstName, eventDate } = req.query;

//   if (!ticketId || !code) {
//     console.log('Missing ticketId or code:', { ticketId, code });
//     return res.status(400).json({ success: false, error: 'Missing ticketId or code' });
//   }

//   try {
//     const ticket = await Ticket.findOne({ ticketId, transactionReference: code });
//     if (!ticket) {
//       console.log('Ticket not found:', { ticketId, code });
//       return res.status(404).json({ success: false, error: 'Ticket not found' });
//     }

//     // Optional: Validate additional QR code fields
//     if (eventTitle && decodeURIComponent(eventTitle) !== ticket.eventTitle) {
//       console.log('Event title mismatch:', { provided: eventTitle, expected: ticket.eventTitle });
//       return res.status(400).json({ success: false, error: 'Event title mismatch' });
//     }
//     if (firstName && decodeURIComponent(firstName) !== ticket.ticketHolder.firstName) {
//       console.log('First name mismatch:', { provided: firstName, expected: ticket.ticketHolder.firstName });
//       return res.status(400).json({ success: false, error: 'Ticket holder name mismatch' });
//     }
//     if (eventDate && decodeURIComponent(eventDate) !== ticket.eventDate) {
//       console.log('Event date mismatch:', { provided: eventDate, expected: ticket.eventDate });
//       return res.status(400).json({ success: false, error: 'Event date mismatch' });
//     }

//     // Browser-friendly HTML response
//     const acceptsHtml = req.accepts('html');
//     if (acceptsHtml) {
//       res.send(`
//         <!DOCTYPE html>
//         <html>
//           <head>
//             <title>Ticket Verification</title>
//             <style>
//               body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
//               .success { color: green; }
//               .error { color: red; }
//             </style>
//           </head>
//           <body>
//             <h1>Ticket Verification</h1>
//             <p class="success">Ticket Verified Successfully!</p>
//             <p><strong>Ticket ID:</strong> ${ticket.ticketId}</p>
//             <p><strong>Event:</strong> ${ticket.eventTitle}</p>
//             <p><strong>Ticket Holder:</strong> ${ticket.ticketHolder.firstName}</p>
//             <p><strong>Event Date:</strong> ${ticket.eventDate || 'N/A'}</p>
//             <p><a href="https://loudbox.vercel.app">Back to Loudbox</a></p>
//           </body>
//         </html>
//       `);
//     } else {
//       res.json({
//         success: true,
//         verified: true,
//         ticket: {
//           ticketId: ticket.ticketId,
//           transactionReference: ticket.transactionReference,
//           eventTitle: ticket.eventTitle,
//           firstName: ticket.ticketHolder.firstName,
//           eventDate: ticket.eventDate || 'N/A',
//         },
//       });
//     }
//   } catch (error) {
//     console.error('Error verifying ticket:', error);
//     res.status(500).json({ success: false, error: 'Internal server error', details: error.message });
//   }
// });

// module.exports = router;


const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');

router.get('/', async (req, res) => {
  console.log('Received /api/verify request:', req.query);
  const { ticketId, code, eventTitle, firstName, eventDate } = req.query;

  // Input validation
  if (!ticketId || !code) {
    console.log('Missing ticketId or code:', { ticketId, code });
    return res.status(400).json({ success: false, error: 'Missing ticketId or code' });
  }

  try {
    // Find ticket
    const ticket = await Ticket.findOne({ ticketId, transactionReference: code });
    if (!ticket) {
      console.log('Ticket not found:', { ticketId, code });
      if (req.accepts('html')) {
        return res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Ticket Verification</title>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
                .error { color: red; }
              </style>
            </head>
            <body>
              <h1>Ticket Verification</h1>
              <p class="error">Error: Ticket not found</p>
              <p><a href="https://loudbox.vercel.app">Back to Loudbox</a></p>
            </body>
          </html>
        `);
      }
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    // Check status
    if (ticket.status !== 'unused') {
      console.log('Ticket not usable:', { ticketId, status: ticket.status });
      if (req.accepts('html')) {
        return res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Ticket Verification</title>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
                .error { color: red; }
              </style>
            </head>
            <body>
              <h1>Ticket Verification</h1>
              <p class="error">Error: Ticket is ${ticket.status}</p>
              <p><a href="https://loudbox.vercel.app">Back to Loudbox</a></p>
            </body>
          </html>
        `);
      }
      return res.status(403).json({ success: false, error: `Ticket is ${ticket.status}` });
    }

    // Check event date
    if (new Date(ticket.eventDate) < new Date()) {
      ticket.status = 'expired';
      await ticket.save();
      console.log('Event date expired:', { ticketId, eventDate: ticket.eventDate });
      if (req.accepts('html')) {
        return res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Ticket Verification</title>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
                .error { color: red; }
              </style>
            </head>
            <body>
              <h1>Ticket Verification</h1>
              <p class="error">Error: Ticket expired</p>
              <p><a href="https://loudbox.vercel.app">Back to Loudbox</a></p>
            </body>
          </html>
        `);
      }
      return res.status(403).json({ success: false, error: 'Ticket expired' });
    }

    // Validate optional QR code fields
    if (eventTitle && decodeURIComponent(eventTitle) !== ticket.eventTitle) {
      console.log('Event title mismatch:', { provided: eventTitle, expected: ticket.eventTitle });
      return res.status(400).json({ success: false, error: 'Event title mismatch' });
    }
    if (firstName && decodeURIComponent(firstName) !== ticket.ticketHolder.firstName) {
      console.log('First name mismatch:', { provided: firstName, expected: ticket.ticketHolder.firstName });
      return res.status(400).json({ success: false, error: 'Ticket holder name mismatch' });
    }
    if (eventDate && decodeURIComponent(eventDate) !== ticket.eventDate.toISOString()) {
      console.log('Event date mismatch:', { provided: eventDate, expected: ticket.eventDate });
      return res.status(400).json({ success: false, error: 'Event date mismatch' });
    }

    // Mark ticket as used
    ticket.status = 'used';
    await ticket.save();
    console.log('Ticket verified:', { ticketId, code, timestamp: new Date() });

    // Respond based on client
    const acceptsHtml = req.accepts('html');
    if (acceptsHtml) {
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Ticket Verification</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
              .success { color: green; }
            </style>
          </head>
          <body>
            <h1>Ticket Verification</h1>
            <p class="success">Ticket Verified Successfully!</p>
            <p><strong>Ticket ID:</strong> ${ticket.ticketId}</p>
            <p><strong>Event:</strong> ${ticket.eventTitle}</p>
            <p><strong>Ticket Holder:</strong> ${ticket.ticketHolder.firstName}</p>
            <p><strong>Event Date:</strong> ${new Date(ticket.eventDate).toLocaleString()}</p>
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
          eventDate: ticket.eventDate.toISOString(),
        },
      });
    }
  } catch (error) {
    console.error('Error verifying ticket:', error);
    res.status(500).json({ success: false, error: 'Internal server error', details: error.message });
  }
});

module.exports = router;
