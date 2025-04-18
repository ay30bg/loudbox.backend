const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        minlength: 3,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: false, // Optional for Google users
        minlength: 6,
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true, // Allows null values while enforcing uniqueness
    },
    picture: {
        type: String, // For Google profile picture
        required: false,
    },
});

module.exports = mongoose.model('User', userSchema);
