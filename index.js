const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const path = require('path');

dotenv.config();

const app = express();

app.use((req, res, next) => {
  // Specify which origins are allowed to access your resources
  res.setHeader('Access-Control-Allow-Origin', 'https://loudbox.vercel.app');
  // Allow specific HTTP methods
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  // Allow specific headers
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  // Allow credentials like cookies
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next(); // Pass control to the next middleware function
});

// Configure CORS
const allowedOrigins = [
  'http://localhost:3000', 'https://loudbox.vercel.app',
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

app.use('/api', authRoutes);

app.get('/', (req, res) => {
  res.send('Welcome to the API!');
});

module.exports = app;
