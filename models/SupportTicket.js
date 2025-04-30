// models/SupportTicket.js
const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
    subject: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    eventId: { type: String }, // Optional, references an event
    email: { type: String, required: true }, // For notifications
    userId: { type: String }, // For authenticated users
    status: { type: String, default: 'Open' },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
