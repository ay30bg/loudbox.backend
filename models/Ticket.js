// backend/models/Ticket.js
const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  ticketId: { type: String, required: true, unique: true },
  transactionReference: { type: String, required: true, unique: true },
  eventId: { type: String, required: true },
  eventTitle: { type: String, required: true },
  ticketHolder: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
  },
  isGift: { type: Boolean, default: false },
  recipient: {
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String },
  },
  status: {
  type: String,
  enum: ['unused', 'used', 'expired', 'canceled'],
  default: 'unused',
},
  createdAt: { type: Date, default: Date.now },
  ticketQuantity: { type: Number, default: 1 },
  totalPrice: { type: Number, default: 0 },
  eventDate: { type: Date, required: true },
});

module.exports = mongoose.model('Ticket', ticketSchema);
