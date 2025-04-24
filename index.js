const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');

dotenv.config();

const authRoutes = require('./routes/auth');
const ticketRoutes = require('./routes/tickets');
const verifyRoutes = require('./routes/verify');
const verifyPaymentRoutes = require('./routes/verifyPayment');
const initializeTransactionRoutes = require('./routes/initializeTransaction');

const app = express();

// Validate 1. Validate environment variables
if (!process.env.MONGO_URI) {
  console.error('MONGO_URI is not defined in .env file');
  process.exit(1);
}

// 2. Middleware
app.use(helmet());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:3000', 'https://loudbox.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use(express.json());

// 3. MongoDB connection with retry
const connectWithRetry = () => {
  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
    .then(() => console.log('MongoDB connected'))
    .catch((err) => {
      console.error('MongoDB connection error:', err);
      setTimeout(connectWithRetry, 5000);
    });
};
connectWithRetry();

// 4. Routes
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/verify', verifyRoutes);
app.use('/api/verify-payment', verifyPaymentRoutes);
app.use('/api/initialize-transaction', initializeTransactionRoutes);

// 5. Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Loudbox API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// 6. 404 handler
app.use((req, res) => {
  console.log(`404: Route not found: ${req.method} ${req.url}`);
  res.status(404).json({
    error: 'Route not found',
    method: req.method,
    path: req.url,
  });
});

// 7. Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(500).json({
    error: 'Internal server error',
    details: isProduction ? 'An unexpected error occurred' : err.message,
  });
});

// 8. Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
