const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const path = require('path');

dotenv.config();

const app = express();

app.use(cors({
  origin: 'https://loudbox.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // If you use cookies or auth headers
}));

app.options('*', cors()); // Allow preflight for all routes

app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Notebook ready!'))
    .catch((err) => console.log('Notebook not working!', err));

app.use('/api', authRoutes);

app.get('/', (req, res) => {
    res.send('Welcome to the API!');
});

module.exports = app;
