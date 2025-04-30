// routes/support-tickets.js
const express = require('express');
const router = express.Router();
const SupportTicket = require('../models/SupportTicket');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Email Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail', // Or your email provider
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Use App Password for Gmail
    },
});

// Create a Support Ticket
router.post('/', async (req, res) => {
    try {
        const { subject, description, category, eventId, email, userId } = req.body;

        // Server-side validation
        if (!subject || subject.length < 5) {
            return res.status(400).json({ message: 'Subject must be at least 5 characters.' });
        }
        if (!description || description.length < 10) {
            return res.status(400).json({ message: 'Description must be at least 10 characters.' });
        }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ message: 'Please provide a valid email address.' });
        }

        const ticket = new SupportTicket({
            subject,
            description,
            category,
            eventId,
            email,
            userId: userId || 'guest',
        });

        await ticket.save();

        // Send email to user
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: `Support Ticket Created: ${subject}`,
            text: `Thank you for submitting a support ticket!\n\nSubject: ${subject}\nCategory: ${category}\nDescription: ${description}\nEvent ID: ${eventId || 'N/A'}\n\nWe'll respond soon.`,
        });

        // Send email to support team
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.SUPPORT_EMAIL,
            subject: `New Support Ticket: ${subject}`,
            text: `A new support ticket has been submitted.\n\nSubject: ${subject}\nCategory: ${category}\nDescription: ${description}\nEvent ID: ${eventId || 'N/A'}\nUser Email: ${email}`,
        });

        res.status(201).json({ message: 'Ticket created successfully', ticket });
    } catch (error) {
        console.error('Error creating support ticket:', error);
        res.status(500).json({ message: 'Failed to create ticket', error: error.message });
    }
});

// Fetch Events (for dropdown)

router.get('/events', async (req, res) => {
    try {
        res.json([
            { id: '1', name: 'Davido Live In Concert' },
            { id: '2', name: 'Lungu Boy Tour' },
            { id: '3', name: 'Alakada Bad and Boujee' },
            { id: '4', name: 'Hellfest' },
            { id: '5', name: 'Burna & Friends Concert' },
            { id: '6', name: 'Afrobeats Festival' },
            { id: '7', name: 'Ravage Uprising' },
            { id: '8', name: 'Sabi Girl Concert' },
            { id: '9', name: 'Local Rappers' },
        ]);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ message: 'Failed to fetch events', error: error.message });
    }
});

module.exports = router;
