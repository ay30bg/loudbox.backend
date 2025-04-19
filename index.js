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
app.use('/api/ticket', ticketRoutes); // Add this

app.get('/', (req, res) => {
  res.send('Welcome to the API!');
});

module.exports = app;
