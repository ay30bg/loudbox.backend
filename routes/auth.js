const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const router = express.Router();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Middleware to verify JWT
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Expecting "Bearer <token>"
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Signup endpoint (unchanged)
router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const oldFriend = await User.findOne({ $or: [{ email }, { username }] });
    if (oldFriend) {
      return res.status(400).json({
        success: false,
        message: 'That name or email is already used!',
      });
    }
    const scrambledPassword = await bcrypt.hash(password, 10);
    const newFriend = new User({
      username,
      email,
      password: scrambledPassword,
    });
    await newFriend.save();
    res.json({
      success: true,
      message: 'New friend joined!',
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Oops, something broke!',
    });
  }
});

// Login endpoint (unchanged)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const friend = await User.findOne({ email });
    if (!friend) {
      return res.status(400).json({
        success: false,
        message: 'Wrong email or password!',
      });
    }
    const isCorrect = await bcrypt.compare(password, friend.password);
    if (!isCorrect) {
      return res.status(400).json({
        success: false,
        message: 'Wrong email or password!',
      });
    }
    const key = jwt.sign(
      { userId: friend._id, email: friend.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({
      success: true,
      key,
      friend: {
        id: friend._id,
        username: friend.username,
        email: friend.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Oops, something broke!',
    });
  }
});

// Google Sign-In endpoint (unchanged)
router.post('/google-login', async (req, res) => {
  const { idToken } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let friend = await User.findOne({ googleId });
    if (!friend) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'This email is already associated with another account!',
        });
      }
      friend = new User({
        googleId,
        email,
        username: name || email.split('@')[0],
        picture,
      });
      await friend.save();
    }

    const key = jwt.sign(
      { userId: friend._id, email: friend.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      success: true,
      key,
      friend: {
        id: friend._id,
        username: friend.username,
        email: friend.email,
        picture: friend.picture,
      },
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid Google token or server error!',
    });
  }
});

// Verify JWT endpoint
router.get('/verify', authMiddleware, (req, res) => {
  res.json({
    success: true,
    isAuthenticated: true,
    user: {
      id: req.user.userId,
      email: req.user.email,
    },
  });
});

module.exports = router;
