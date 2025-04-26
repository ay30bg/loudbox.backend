// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const dotenv = require('dotenv');

// dotenv.config();

// const authRoutes = require('./routes/auth');
// const ticketRoutes = require('./routes/tickets');
// const initializeTransactionRoutes = require('./routes/initializeTransaction');
// console.log('initializeTransactionRoutes loaded:', initializeTransactionRoutes);
// const verifyRoutes = require('./routes/verify');
// const verifyPaymentRoutes = require('./routes/verifyPayment');

// const app = express();

// // CORS configuration
// app.use(cors({
//   origin: ['http://localhost:3000', 'https://loudbox.vercel.app'],
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   credentials: true,
// }));

// // app.options('.*', cors());

// app.use(express.json());

// // Connect to MongoDB
// mongoose.connect(process.env.MONGO_URI)
//   .then(() => console.log('MongoDB connected'))
//   .catch((err) => {
//     console.error('MongoDB connection error:', err);
//     process.exit(1);
//   });

// // Routes
// app.use('/api/', authRoutes);
// app.use('/api/tickets', ticketRoutes);
// app.use('/api/verify', verifyRoutes);
// app.use('/api/verify-transaction', verifyPaymentRoutes);
// app.use('/api/initialize-transaction', initializeTransactionRoutes);

// app.get('/', (req, res) => {
//   res.json({ message: 'Loudbox API' });
// });

// // 404 handler
// app.use((req, res) => {
//   console.log(`404: Route not found: ${req.method} ${req.url}`);
//   res.status(404).json({ error: 'Route not found' });
// });

// // Error handler
// app.use((err, req, res, next) => {
//   console.error('Server error:', err.stack);
//   res.status(500).json({ error: 'Internal server error', details: err.message });
// });

// module.exports = app;

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

const app = express();

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'https://loudbox.vercel.app'],
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
app.use('/api/verify-payment', verifyPaymentRoutes);
app.use('/api/initialize-transaction', initializeTransactionRoutes);

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
