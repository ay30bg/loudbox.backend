const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const path = require('path');

dotenv.config();

const app = express();

// Configure CORS to allow requests from https://loudbox.vercel.app
const corsOptions = {
  origin: 'https://loudbox.vercel.app', // Allow only this origin
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allowed HTTP methods
  credentials: true, // Allow cookies to be sent
};

// Enable CORS with the specified options
app.use(cors(corsOptions)); // Use the cors middleware

// app.use(cors({ origin: ['http://localhost:3000', 'https://loudbox.vercel.app']}));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Notebook ready!'))
    .catch((err) => console.log('Notebook not working!', err));

app.use('/api', authRoutes);

app.get('/', (req, res) => {
    res.send('Welcome to the API!');
});

module.exports = app;
