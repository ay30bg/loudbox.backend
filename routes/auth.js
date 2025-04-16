const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

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

module.exports = router;