const express = require('express');
const { authenticate } = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');
const {
	validatePayment,
	validateTopup,
	validateSetWalletPin,
	validatePaymentIdParam,
	validateUserOrdersQuery
} = require('../validators');
const router = express.Router();

router.use(authenticate);

// Process payment for order
router.post('/process', validatePayment, paymentController.processPayment);

// Get payment status
router.get('/status/:paymentId', validatePaymentIdParam, paymentController.getPaymentStatus);

// Wallet top-up
router.post('/wallet/topup', validateTopup, paymentController.topupWallet);

// Get wallet balance
router.get('/wallet/balance', paymentController.getWalletBalance);

// Get wallet transaction history
router.get('/wallet/transactions', validateUserOrdersQuery, paymentController.getWalletTransactions);

// Set wallet PIN
router.post('/wallet/pin', validateSetWalletPin, paymentController.setWalletPin);

// Get wallet PIN status
router.get('/wallet/pin/status', paymentController.getWalletPinStatus);

module.exports = router;
