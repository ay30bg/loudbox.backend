// backend/index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const ticketRoutes = require('./routes/tickets'); // Add this
const path = require('path');

dotenv.config();

const app = express();

app.use((req, res, next) => {
  // Set the Access-Control-Allow-Origin header.
  res.setHeader('Access-Control-Allow-Origin', 'https://loudbox.vercel.app');
  // Or use '*' to allow any origin:
  // res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Optionally, you can set other CORS-related headers here, for example:
  // res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  // res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Configure CORS
const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL || 'https://loudbox.vercel.app',
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Notebook ready!'))
  .catch((err) => console.log('Notebook not working!', err));

app.use('/api/', authRoutes);
app.use('/api/tickets', ticketRoutes); // Add this

app.get('/', (req, res) => {
  res.send('Welcome to the API!');
});

// Handle 404 for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});


module.exports = app;
