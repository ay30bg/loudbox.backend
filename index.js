const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const ticketRoutes = require('./routes/tickets');
const verifyRoutes = require('./routes/verify');
const verifyPaymentRoutes = require('./routes/verifyPayment');
const initializeTransactionRoutes = require('./routes/initializeTransaction');

dotenv.config();

const app = express();

// CORS configuration using cors middleware (preferred over manual headers)
app.use(cors({
  origin: ['http://localhost:3000', 'https://loudbox.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept'],
  credentials: true,
}));

// Handle preflight requests explicitly (optional, for robustness)
app.options('*', cors({
  origin: ['http://localhost:3000', 'https://loudbox.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept'],
  credentials: true,
}));

// Manual CORS headers (optional, only if cors middleware fails)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://loudbox.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, X-Requested-With, Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});

app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.use('/api/', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/verify', verifyRoutes);
app.use('/api/verify-payment', verifyPaymentRoutes);
app.use('/api/initialize-transaction', initializeTransactionRoutes);

// Example route for testing
app.get('/api/initialize-transaction', (req, res) => {
  res.json({ message: 'Transaction initialized' });
});

app.get('/', (req, res) => {
  res.json({ message: 'Loudbox API' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Export for Vercel serverless
module.exports = app; is this code correct
