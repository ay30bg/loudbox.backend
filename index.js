// backend/index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const ticketRoutes = require('./routes/tickets');
const paystackRoutes = require('./routes/paystack')

dotenv.config();

const app = express();

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'https://loudbox.vercel.app'],
  methods: 'GET,POST,PUT,DELETE',
  credentials: true,
}));

app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.use('/api/', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/paystack', paystackRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Loudbox API' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app;
