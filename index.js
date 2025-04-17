const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const serverless = require('serverless-http'); // Add serverless-http
const authRoutes = require('./routes/auth');
const path = require('path');

dotenv.config();

const app = express();

// Configure CORS for frontend
app.use(cors({
  origin: [
    'http://localhost:3000', // Local development
    'https://loudbox.vercel.app', // Your frontend URL
    process.env.FRONTEND_URL // Allow dynamic frontend URL from environment
  ],
  credentials: true // If using cookies or auth headers
}));

app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Notebook ready!'))
  .catch((err) => console.log('Notebook not working!', err));

// API routes
app.use('/api', authRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.send('Welcome to the API!');
});

// Export as serverless function
module.exports.handler = serverless(app);
