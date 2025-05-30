const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/auth');
const ticketRoutes = require('./routes/tickets');
const verifyRoutes = require('./routes/verify');
const verifyPaymentRoutes = require('./routes/verifyPayment');
const initializeTransactionRoutes = require('./routes/initializeTransaction');
const emailRoutes = require('./routes/ticketRoutes');
const supportTicketRoutes = require('./routes/support-tickets'); 

const app = express();

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'https://loudbox.vercel.app', 'https://www.loudbox.xyz'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000,
})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    // Don't exit, allow server to run for non-MongoDB routes
  });

// Routes
app.use('/api/', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/verify', verifyRoutes);
app.use('/api/verify-transaction', verifyPaymentRoutes);
app.use('/api/initialize-transaction', initializeTransactionRoutes);
app.use('/api/email', emailRoutes); 
app.use('/api/support-tickets', supportTicketRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Loudbox API' });
});

// 404 handler
app.use((req, res) => {
  console.log(`404: Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

module.exports = app;
