const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const nodemailer = require('nodemailer'); // Add nodemailer
const User = require('../models/User');
const router = express.Router();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Configure Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail', // Or your email service (e.g., SendGrid)
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

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

// Verify JWT endpoint (unchanged)
router.get('/verify-token', authMiddleware, (req, res) => {
    res.json({
        success: true,
        isAuthenticated: true,
        user: {
            id: req.user.userId,
            email: req.user.email,
        },
    });
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        // Check if user has a password (exclude Google-only users)
        if (!user.password) {
            return res.status(400).json({
                success: false,
                message: 'This account uses Google Sign-In. Please use Google to log in.',
            });
        }

        // Generate reset token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });

        // Save token and expiry
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        // Send email
        const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset Request',
            html: `
                <h2>Password Reset</h2>
                <p>You requested a password reset. Click the link below to reset your password:</p>
                <a href="${resetLink}">Reset Password</a>
                <p>This link will expire in 1 hour.</p>
                <p>If you did not request this, please ignore this email.</p>
            `,
        };

        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: 'Password reset link sent.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// Reset Password
router.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({
            _id: decoded.userId,
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired token.' });
        }

        // Hash new password
        const scrambledPassword = await bcrypt.hash(password, 10);
        user.password = scrambledPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ success: true, message: 'Password reset successful.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

module.exports = router;
