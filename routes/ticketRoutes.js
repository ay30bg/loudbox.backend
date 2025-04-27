const express = require('express');
const nodemailer = require('nodemailer');
const { createCanvas } = require('canvas');
const QRCode = require('qrcode');

const router = express.Router();

// POST /api/email/send-ticket-email
router.post('/send-ticket-email', async (req, res) => {
  const { ticketData, email } = req.body;

  // Validate request body
  if (!ticketData || !email) {
    return res.status(400).json({ error: 'Missing ticketData or email' });
  }

  try {
    // Generate QR code
    const qrCodeValue = `https://loudbox-backend.vercel.app/api/verify?ticketId=${encodeURIComponent(
      ticketData.ticketId
    )}&code=${encodeURIComponent(ticketData.transactionReference || 'N/A')}`;
    const canvas = createCanvas(200, 200);
    await QRCode.toCanvas(canvas, qrCodeValue);

    // Email configuration
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Your Ticket for ${ticketData.eventTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #333;">Your Ticket for ${ticketData.eventTitle}</h2>
          <p>Dear ${ticketData.ticketHolder.firstName},</p>
          <p>Attached is your ticket. Please present it at the event.</p>
          <p><strong>Ticket ID:</strong> ${ticketData.ticketId}</p>
          <p><strong>Transaction Reference:</strong> ${ticketData.transactionReference}</p>
          <p>Access your ticket online: <a href="https://loudbox.vercel.app/tickets/${ticketData.transactionReference}" style="color: #007bff;">View Ticket</a></p>
        </div>
      `,
      attachments: [
        {
          filename: `ticket-${ticketData.ticketId}.png`,
          content: canvas.toBuffer('image/png'),
        },
      ],
    };

    // Send email
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Ticket emailed successfully' });
  } catch (error) {
    console.error('Error sending ticket email:', error);
    res.status(500).json({ error: 'Failed to send ticket email' });
  }
});

module.exports = router;
