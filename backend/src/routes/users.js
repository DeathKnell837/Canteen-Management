const express = require('express');
const { authenticate } = require('../middleware/auth');
const authController = require('../controllers/authController');
const paymentController = require('../controllers/paymentController');
const router = express.Router();

// All user routes require authentication
router.use(authenticate);

// Profile management
router.get('/profile', authController.getProfile);
router.put('/profile', authController.updateProfile);

// Wallet management
router.get('/wallet/balance', paymentController.getWalletBalance);
router.post('/wallet/topup', paymentController.topupWallet);

module.exports = router;
