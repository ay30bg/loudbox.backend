const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const ticketRoutes = require('./routes/tickets');

dotenv.config();

const app = express();

// Validate environment variables
const requiredEnvVars = ['MONGO_URI', 'FRONTEND_URL'];
requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`Error: ${varName} environment variable is required`);
    process.exit(1);
  }
});

// Configure CORS
const allowedOrigins = ['http://localhost:3000', process.env.FRONTEND_URL].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`CORS rejected origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204, // Handle preflight OPTIONS requests
};

app.use(cors(corsOptions));
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected to:', process.env.MONGO_URI))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

app.use('/api/', authRoutes);
app.use('/api/tickets', ticketRoutes);

app.get('/', (req, res) => {
  res.send('Welcome to the API!');
});

// Handle 404 for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
