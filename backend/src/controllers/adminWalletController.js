const { User } = require('../models');
const { pool } = require('../config/database');
const paymentService = require('../services/paymentService');
const { asyncHandler, AppError } = require('../utils/errorHandler');

const adminWalletController = {
  // Search customers by name or email
  searchCustomers: asyncHandler(async (req, res) => {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(200).json({ success: true, data: [] });
    }

    const result = await pool.query(
      `SELECT user_id, email, full_name, wallet_balance, status
       FROM users
       WHERE role = 'CUSTOMER' AND status = 'ACTIVE'
         AND (full_name ILIKE $1 OR email ILIKE $1)
       ORDER BY full_name
       LIMIT 20`,
      [`%${q.trim()}%`]
    );

    res.status(200).json({ success: true, data: result.rows });
  }),

  // Get a single customer's wallet info
  getCustomerWallet: asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const user = await User.findById(parseInt(userId));
    if (!user) throw new AppError('Customer not found', 404);

    res.status(200).json({
      success: true,
      data: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        wallet_balance: user.wallet_balance
      }
    });
  }),

  // Admin credits a customer's wallet (cash received)
  topupCustomerWallet: asyncHandler(async (req, res) => {
    const adminId = req.user.id;
    const { userId, amount, note } = req.body;

    if (!userId || !amount || amount <= 0) {
      throw new AppError('Valid customer ID and amount are required', 400);
    }

    const customer = await User.findById(parseInt(userId));
    if (!customer) throw new AppError('Customer not found', 404);
    if (customer.role !== 'CUSTOMER') throw new AppError('Can only top-up customer wallets', 400);

    // Credit the customer's wallet
    const result = await User.updateWalletBalance(parseInt(userId), parseFloat(amount));

    // Record the wallet transaction
    const description = note
      ? `Cash top-up by admin (${note})`
      : 'Cash top-up by admin';

    await paymentService.recordWalletTransaction(
      parseInt(userId),
      Math.abs(parseFloat(amount)),
      'TOPUP',
      `ADMIN-TOPUP-${Date.now()}`,
      description,
      result.wallet_balance
    );

    // Record in admin top-up log
    await pool.query(
      `INSERT INTO admin_topup_log (admin_id, customer_id, amount, note)
       VALUES ($1, $2, $3, $4)`,
      [adminId, parseInt(userId), parseFloat(amount), note || null]
    );

    res.status(200).json({
      success: true,
      message: `₱${parseFloat(amount).toFixed(2)} credited to ${customer.full_name}'s wallet`,
      data: {
        customer_name: customer.full_name,
        amount_added: parseFloat(amount),
        new_balance: parseFloat(result.wallet_balance)
      }
    });
  }),

  // Get admin top-up history
  getTopupHistory: asyncHandler(async (req, res) => {
    const { limit = 50, startDate, endDate } = req.query;
    const parsedLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 200);

    let query = `
      SELECT atl.topup_id, atl.amount, atl.note, atl.created_at,
             c.full_name AS customer_name, c.email AS customer_email,
             a.full_name AS admin_name
      FROM admin_topup_log atl
      JOIN users c ON atl.customer_id = c.user_id
      JOIN users a ON atl.admin_id = a.user_id`;

    const params = [];
    const conditions = [];

    if (startDate) {
      params.push(startDate);
      conditions.push(`atl.created_at >= $${params.length}`);
    }
    if (endDate) {
      params.push(endDate);
      conditions.push(`atl.created_at <= $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    params.push(parsedLimit);
    query += ` ORDER BY atl.created_at DESC LIMIT $${params.length}`;

    const result = await pool.query(query, params);

    // Also get total cash collected
    let totalQuery = `SELECT COALESCE(SUM(amount), 0) AS total FROM admin_topup_log`;
    const totalParams = [];
    const totalConditions = [];

    if (startDate) {
      totalParams.push(startDate);
      totalConditions.push(`created_at >= $${totalParams.length}`);
    }
    if (endDate) {
      totalParams.push(endDate);
      totalConditions.push(`created_at <= $${totalParams.length}`);
    }
    if (totalConditions.length > 0) {
      totalQuery += ' WHERE ' + totalConditions.join(' AND ');
    }

    const totalResult = await pool.query(totalQuery, totalParams);

    res.status(200).json({
      success: true,
      data: {
        topups: result.rows,
        total_collected: parseFloat(totalResult.rows[0].total)
      }
    });
  })
};

module.exports = adminWalletController;
