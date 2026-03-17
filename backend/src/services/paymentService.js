const { Payment, Order, User } = require('../models');
const { pool } = require('../config/database');
const { AppError } = require('../utils/errorHandler');

class PaymentService {
  async processPayment(orderId, userId, paymentMethod, amount) {
    // Verify order exists
    const order = await Order.getById(orderId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.user_id !== parseInt(userId)) {
      throw new AppError('Unauthorized', 403);
    }

    if (parseFloat(amount) !== parseFloat(order.total_amount)) {
      throw new AppError('Payment amount mismatch', 400);
    }

    // Create payment record
    const payment = await Payment.create(orderId, userId, paymentMethod, amount);

    // Process based on payment method
    let isSuccessful = false;

    switch (paymentMethod) {
      case 'WALLET':
        isSuccessful = await this.processWalletPayment(userId, amount, orderId);
        break;
      case 'CASH':
        isSuccessful = true; // Cash payment marked as success (will be verified at counter)
        break;
      case 'CARD':
        isSuccessful = await this.processCardPayment(amount);
        break;
      default:
        throw new AppError('Payment method not supported', 400);
    }

    if (!isSuccessful) {
      await Payment.updateStatus(payment.payment_id, 'FAILED');
      throw new AppError('Payment failed', 400);
    }

    // Mark payment as successful
    const updatedPayment = await Payment.updateStatus(
      payment.payment_id,
      'SUCCESS',
      `TXN-${Date.now()}`
    );

    // Update order status to confirmed
    await Order.updateStatus(orderId, 'CONFIRMED');

    return updatedPayment;
  }

  async processWalletPayment(userId, amount, orderId = null) {
    const user = await User.findById(userId);
    if (!user || parseFloat(user.wallet_balance) < parseFloat(amount)) {
      return false;
    }

    // Deduct from wallet
    const updatedWallet = await User.updateWalletBalance(userId, -amount);
    await this.recordWalletTransaction(
      userId,
      -Math.abs(parseFloat(amount)),
      'PURCHASE',
      orderId ? String(orderId) : null,
      orderId ? `Wallet payment for order #${orderId}` : 'Wallet purchase payment',
      updatedWallet.wallet_balance
    );
    return true;
  }

  async processCardPayment(amount) {
    // Simulate card payment processing
    // In real application, integrate with Stripe API
    if (amount > 0) {
      return true; // Simulated success
    }
    return false;
  }

  async getPaymentStatus(paymentId) {
    const payment = await Payment.getById(paymentId);
    if (!payment) {
      throw new AppError('Payment not found', 404);
    }
    return payment;
  }

  async topupWallet(userId, amount) {
    if (amount <= 0) {
      throw new AppError('Amount must be greater than 0', 400);
    }

    // Process payment (simulated)
    const success = await this.processCardPayment(amount);
    if (!success) {
      throw new AppError('Top-up failed', 400);
    }

    // Add to wallet
    const result = await User.updateWalletBalance(userId, amount);
    await this.recordWalletTransaction(
      userId,
      Math.abs(parseFloat(amount)),
      'TOPUP',
      `TOPUP-${Date.now()}`,
      'Wallet top-up via GCash flow',
      result.wallet_balance
    );
    return {
      wallet_balance: result.wallet_balance,
      amount_added: amount
    };
  }

  async getWalletTransactions(userId, limit = 50) {
    const parsedLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 200);
    const result = await pool.query(
      `SELECT transaction_id, amount, transaction_type, reference_id, description, balance_after, created_at
       FROM wallet_transactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, parsedLimit]
    );

    return result.rows;
  }

  async recordWalletTransaction(userId, amount, transactionType, referenceId, description, balanceAfter) {
    await pool.query(
      `INSERT INTO wallet_transactions (user_id, amount, transaction_type, reference_id, description, balance_after)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, amount, transactionType, referenceId, description, balanceAfter]
    );
  }
}

module.exports = new PaymentService();
