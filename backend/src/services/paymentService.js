const { Payment, Order, User } = require('../models');
const { pool } = require('../config/database');
const { AppError } = require('../utils/errorHandler');

class PaymentService {
  async processPayment(orderId, userId, paymentMethod, amount, walletPin = null) {
    const methodMap = {
      ONLINE_PAYMENT: 'WALLET',
      ONLINE_TRANSACTION: 'WALLET',
      DIRECT_CASH: 'CASH'
    };
    const normalizedMethod = methodMap[paymentMethod] || paymentMethod;

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

    // Verify wallet PIN if user has one set and paying with wallet
    if (normalizedMethod === 'WALLET') {
      const hasPin = await User.hasWalletPin(userId);
      if (hasPin) {
        if (!walletPin) {
          throw new AppError('Wallet PIN is required', 400);
        }
        const pinValid = await User.verifyWalletPin(userId, walletPin);
        if (!pinValid) {
          throw new AppError('Invalid wallet PIN', 400);
        }
      }
    }

    // Create payment record
    const payment = await Payment.create(orderId, userId, normalizedMethod, amount);

    // Direct cash should stay pending until admin confirms payment at counter.
    if (normalizedMethod === 'CASH') {
      return await Payment.getById(payment.payment_id);
    }

    // Process based on payment method
    let isSuccessful = false;

    switch (normalizedMethod) {
      case 'WALLET':
        isSuccessful = await this.processWalletPayment(userId, amount, orderId);
        break;
      case 'CARD':
      case 'MOBILE_PAYMENT':
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

  async topupWallet(userId, amount, securityPin, sourceMethod = 'GCASH', sourceName = '') {
    if (amount <= 0) {
      throw new AppError('Amount must be greater than 0', 400);
    }

    if (!/^[0-9]{4,6}$/.test(String(securityPin || ''))) {
      throw new AppError('Wallet PIN must be 4 to 6 digits', 400);
    }

    const hasPin = await User.hasWalletPin(userId);
    if (!hasPin) {
      throw new AppError('Set your wallet PIN first before top-up', 400);
    }

    const isVerified = await User.verifyWalletPin(userId, securityPin || '');
    if (!isVerified) {
      throw new AppError('Invalid wallet PIN', 400);
    }

    const normalizedSource = String(sourceMethod || 'GCASH').toUpperCase();
    const sourceLabels = {
      GCASH: 'GCash',
      MAYA: 'Maya'
    };
    const allowedBanks = ['BPI', 'BDO', 'Metrobank', 'LandBank', 'UnionBank', 'PNB', 'RCBC'];
    let sourceLabel = sourceLabels[normalizedSource] || 'GCash';

    if (normalizedSource === 'BANK_TRANSFER') {
      const bankName = String(sourceName || '').trim();
      if (!allowedBanks.includes(bankName)) {
        throw new AppError('Invalid bank name for bank transfer', 400);
      }
      sourceLabel = `Bank Transfer (${bankName})`;
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
      `Wallet top-up via ${sourceLabel}`,
      result.wallet_balance
    );
    return {
      wallet_balance: result.wallet_balance,
      amount_added: amount,
      source: sourceLabel
    };
  }

  async getWalletTransactions(userId, limit = 50) {
    const parsedLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 200);
    const result = await pool.query(
      `SELECT transaction_id, amount, transaction_type, reference_id, description, balance_after, created_at
       FROM (
         SELECT
           CONCAT('WALLET-', wt.transaction_id) AS transaction_id,
           wt.amount,
           wt.transaction_type,
           wt.reference_id,
           wt.description,
           wt.balance_after,
           wt.created_at
         FROM wallet_transactions wt
         WHERE wt.user_id = $1

         UNION ALL

         SELECT
           CONCAT('PAYMENT-', p.payment_id) AS transaction_id,
           -ABS(p.amount)::DECIMAL(10,2) AS amount,
           'DIRECT_CASH' AS transaction_type,
           COALESCE(p.transaction_id, CONCAT('PAY-', p.payment_id)) AS reference_id,
           COALESCE(
             CONCAT('Direct cash payment for order ', o.order_number),
             CONCAT('Direct cash payment for order #', p.order_id)
           ) AS description,
           NULL::DECIMAL(10,2) AS balance_after,
           p.created_at
         FROM payments p
         LEFT JOIN orders o ON p.order_id = o.order_id
         WHERE p.user_id = $1
           AND p.payment_method = 'CASH'
           AND p.status IN ('PENDING', 'SUCCESS')
       ) tx
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

  async setWalletPin(userId, pin, accountPassword) {
    const passwordValid = await User.verifyPassword(userId, accountPassword || '');
    if (!passwordValid) {
      throw new AppError('Invalid account password', 400);
    }

    await User.setWalletPin(userId, pin);
  }

  async getWalletPinStatus(userId) {
    return User.hasWalletPin(userId);
  }

  async clearWalletPin(userId, accountPassword) {
    const passwordValid = await User.verifyPassword(userId, accountPassword || '');
    if (!passwordValid) {
      throw new AppError('Invalid account password', 400);
    }
    await User.clearWalletPin(userId);
  }
}

module.exports = new PaymentService();
