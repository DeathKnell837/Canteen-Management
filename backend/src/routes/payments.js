const express = require('express');
const { authenticate } = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');
const { validatePayment, validateTopup } = require('../validators');
const router = express.Router();

router.use(authenticate);

// Process payment for order
router.post('/process', validatePayment, paymentController.processPayment);

// Get payment status
router.get('/status/:paymentId', paymentController.getPaymentStatus);

// Wallet top-up
router.post('/wallet/topup', validateTopup, paymentController.topupWallet);

// Get wallet balance
router.get('/wallet/balance', paymentController.getWalletBalance);

// Get wallet transaction history
router.get('/wallet/transactions', paymentController.getWalletTransactions);

module.exports = router;
