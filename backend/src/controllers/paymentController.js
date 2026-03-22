const paymentService = require('../services/paymentService');
const { asyncHandler } = require('../utils/errorHandler');

const paymentController = {
  processPayment: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { orderId, paymentMethod, amount, walletPin } = req.body;

    const payment = await paymentService.processPayment(
      orderId,
      userId,
      paymentMethod,
      amount,
      walletPin
    );

    res.status(200).json({
      success: true,
      message: 'Payment processed successfully',
      data: payment
    });
  }),

  getPaymentStatus: asyncHandler(async (req, res) => {
    const { paymentId } = req.params;

    const payment = await paymentService.getPaymentStatus(parseInt(paymentId));

    res.status(200).json({
      success: true,
      data: payment
    });
  }),

  topupWallet: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { amount, securityPin, sourceMethod, sourceName } = req.body;

    const result = await paymentService.topupWallet(userId, amount, securityPin, sourceMethod, sourceName);

    res.status(200).json({
      success: true,
      message: 'Wallet topped up successfully',
      data: result
    });
  }),

  getWalletBalance: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { User } = require('../models');

    const user = await User.findById(userId);

    res.status(200).json({
      success: true,
      data: {
        wallet_balance: user.wallet_balance
      }
    });
  }),

  getWalletTransactions: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { limit = 50 } = req.query;

    const data = await paymentService.getWalletTransactions(userId, limit);

    res.status(200).json({
      success: true,
      data
    });
  }),

  setWalletPin: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { pin, accountPassword } = req.body;

    await paymentService.setWalletPin(userId, pin, accountPassword);

    res.status(200).json({
      success: true,
      message: 'Wallet PIN set successfully'
    });
  }),

  getWalletPinStatus: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const hasPin = await paymentService.getWalletPinStatus(userId);

    res.status(200).json({
      success: true,
      data: { hasPin }
    });
  }),

  clearWalletPin: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { accountPassword } = req.body;

    await paymentService.clearWalletPin(userId, accountPassword);

    res.status(200).json({
      success: true,
      message: 'Wallet PIN disabled successfully'
    });
  })
};

module.exports = paymentController;
