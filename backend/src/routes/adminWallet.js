const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const adminWalletController = require('../controllers/adminWalletController');
const {
	validateUserIdParam,
	validateAdminWalletTopup,
	validateAdminWalletSearchQuery,
	validateTopupHistoryQuery
} = require('../validators');
const router = express.Router();

router.use(authenticate);
router.use(authorize('ADMIN', 'STAFF'));

// Search customers
router.get('/customers/search', validateAdminWalletSearchQuery, adminWalletController.searchCustomers);

// Get customer wallet info
router.get('/customers/:userId/wallet', validateUserIdParam, adminWalletController.getCustomerWallet);

// Admin top-up (cash received)
router.post('/topup', validateAdminWalletTopup, adminWalletController.topupCustomerWallet);

// Top-up history
router.get('/topup/history', validateTopupHistoryQuery, adminWalletController.getTopupHistory);

module.exports = router;
