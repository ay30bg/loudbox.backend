// backend/index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const ticketRoutes = require('./routes/tickets');
const path = require('path');

dotenv.config();

const app = express();

app.use((req, res, next) => {
  // Add the Access-Control-Allow-Origin header to allow requests from 'https://loudbox.vercel.app'
  res.setHeader('Access-Control-Allow-Origin', 'https://loudbox.vercel.app');
  // If your API requires other headers, you can also set them here:
  // res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  // res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});



// Configure CORS
const allowedOrigins = [
  'http://localhost:3000',  'https://loudbox.vercel.app',
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
