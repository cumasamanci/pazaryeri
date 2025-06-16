const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// User registration route
router.post('/register', authController.register);

// User login route
router.post('/login', authController.login);

// Password reset route
router.post('/reset-password', authController.resetPassword);

// User profile route (authentication required)
router.get('/profile', authController.authenticate, authController.getProfile);

module.exports = router;