const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const path = require('path');

dotenv.config();

const app = express();

// Allow multiple origins for development and production
const allowedOrigins = ['https://loudbox.vercel.app', 'http://localhost:3000'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Notebook ready!'))
    .catch((err) => console.log('Notebook not working!', err));

app.use('/api', authRoutes);

app.get('/', (req, res) => {
    res.send('Welcome to the API!');
});

module.exports = app;
