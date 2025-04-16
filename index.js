const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const path = require('path');

dotenv.config();

const app = express();

app.use(cors({ origin: 'https://loudbox.vercel.app',
          methods: ['GET', 'POST', 'PUT', 'DELETE'],   
}));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Notebook ready!'))
    .catch((err) => console.log('Notebook not working!', err));

app.use('/api', authRoutes);

app.get('/', (req, res) => {
    res.send('Welcome to the API!');
});

module.exports = app;
