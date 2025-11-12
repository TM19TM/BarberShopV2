// -_-_-_- /routes/auth.js -_-_-_-
// Define as URLs para login, registro, etc.

const express = require('express');
const router = express.Router();
const { register, login, forgotPassword, resetPassword } = require('../controllers/authController');

// /api/auth/register
router.post('/register', register);

// /api/auth/login
router.post('/login', login);

// /api/auth/forgot-password
router.post('/forgot-password', forgotPassword);

// /api/auth/reset-password
router.post('/reset-password', resetPassword);

module.exports = router;