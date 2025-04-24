const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Route imports
const authRoutes = require('./routes/auth');
const ticketRoutes = require('./routes/tickets');
const verifyRoutes = require('./routes/verify');
const verifyPaymentRoutes = require('./routes/verifyPayment');
// const initializeTransactionRoutes = require('./routes/initializeTransaction');

const app = express();

// ---- CORS MIDDLEWARE: MUST come BEFORE any routes ----
const allowedOrigins = ['http://localhost:3000', 'https://loudbox.vercel.app'];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin like mobile apps or curl
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept'],
  credentials: true,
}));

// Optional: Explicit handling of preflight OPTIONS requests
app.options('*', cors());

// JSON body parsing
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// ---- ROUTES ----
app.use('/api/', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/verify', verifyRoutes);
app.use('/api/verify-payment', verifyPaymentRoutes);
// app.use('/api/initialize-transaction', initializeTransactionRoutes);

// Root test route
app.get('/', (req, res) => {
  res.json({ message: 'Loudbox API' });
});

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Unexpected error:', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Export app for Vercel serverless
module.exports = app;
