const paymentService = require('../services/paymentService');
const { asyncHandler } = require('../utils/errorHandler');

const paymentController = {
  processPayment: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { orderId, paymentMethod, amount } = req.body;

    const payment = await paymentService.processPayment(
      orderId,
      userId,
      paymentMethod,
      amount
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
    const { amount } = req.body;

    const result = await paymentService.topupWallet(userId, amount);

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
  })
};

module.exports = paymentController;
