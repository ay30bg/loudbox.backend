// backend/api/tickets/[transactionReference].js
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const Ticket = require('../../models/Ticket');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected for API route'))
  .catch((err) => console.error('MongoDB connection error:', err));

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { transactionReference } = req.query;
    console.log('Backend request for:', transactionReference);

    const ticket = await Ticket.findOne({ transactionReference });
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const qrCodeData = JSON.stringify({ ticketId: ticket.ticketId });
    const qrCodeUrl = await QRCode.toDataURL(qrCodeData);

    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({
      ticketId: ticket.ticketId,
      eventTitle: ticket.eventTitle,
      qrCode: qrCodeUrl,
      transactionReference: ticket.transactionReference,
      status: ticket.status,
    });
  } catch (err) {
    console.error('Error fetching ticket:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
