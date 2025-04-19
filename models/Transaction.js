// models/Transaction.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  reference: { type: String, required: true, unique: true },
  customerEmail: { type: String, required: true },
  recipientEmail: String,
  eventTitle: { type: String, required: true },
  ticketQuantity: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  firstName: String,
  lastName: String,
  isGift: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Transaction', transactionSchema);