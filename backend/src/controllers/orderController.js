const orderService = require('../services/orderService');
const { asyncHandler } = require('../utils/errorHandler');

const orderController = {
  createOrder: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { items, deliveryType, specialInstructions } = req.body;

    const order = await orderService.createOrder(
      userId,
      items,
      deliveryType,
      specialInstructions
    );

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  }),

  getOrderDetail: asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await orderService.getOrderById(parseInt(orderId));

    // Verify ownership
    if (order.user_id !== parseInt(userId) && req.user.role !== 'ADMIN' && req.user.role !== 'STAFF') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  }),

  getUserOrders: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;

    const orders = await orderService.getUserOrders(
      userId,
      parseInt(limit),
      parseInt(offset)
    );

    res.status(200).json({
      success: true,
      data: orders
    });
  }),

  updateStatus: asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await orderService.updateStatus(parseInt(orderId), status);

    res.status(200).json({
      success: true,
      message: 'Order status updated',
      data: order
    });
  }),

  cancelOrder: asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await orderService.getOrderById(parseInt(orderId));

    // Verify ownership
    if (order.user_id !== parseInt(userId) && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    await orderService.cancelOrder(parseInt(orderId));

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully'
    });
  }),

  getAllOrders: asyncHandler(async (req, res) => {
    const { limit = 50, offset = 0, startDate, endDate, status } = req.query;
    const { pool } = require('../config/database');

    let query = `SELECT o.order_id, o.order_number, o.status, o.delivery_type, o.total_amount, o.created_at, o.user_id,
              u.full_name AS customer_name
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.user_id`;
    const params = [];
    const conditions = [];

    if (startDate) {
      params.push(startDate);
      conditions.push(`o.created_at >= $${params.length}`);
    }
    if (endDate) {
      params.push(endDate);
      conditions.push(`o.created_at <= $${params.length}`);
    }
    if (status && status !== 'ALL') {
      params.push(status);
      conditions.push(`o.status = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    params.push(parseInt(limit));
    query += ` ORDER BY o.created_at DESC LIMIT $${params.length}`;
    params.push(parseInt(offset));
    query += ` OFFSET $${params.length}`;

    const result = await pool.query(query, params);

    // Also get summary stats for the period
    let summaryQuery = `SELECT COUNT(*)::INT AS total_orders,
      COALESCE(SUM(total_amount) FILTER (WHERE status <> 'CANCELLED'), 0)::DECIMAL(10,2) AS total_revenue
      FROM orders`;
    const summaryParams = [];
    const summaryConditions = [];

    if (startDate) {
      summaryParams.push(startDate);
      summaryConditions.push(`created_at >= $${summaryParams.length}`);
    }
    if (endDate) {
      summaryParams.push(endDate);
      summaryConditions.push(`created_at <= $${summaryParams.length}`);
    }
    if (status && status !== 'ALL') {
      summaryParams.push(status);
      summaryConditions.push(`status = $${summaryParams.length}`);
    }
    if (summaryConditions.length > 0) {
      summaryQuery += ' WHERE ' + summaryConditions.join(' AND ');
    }

    const summaryResult = await pool.query(summaryQuery, summaryParams);

    res.status(200).json({
      success: true,
      data: result.rows,
      summary: summaryResult.rows[0]
    });
  }),

  getSalesReport: asyncHandler(async (req, res) => {
    const { pool } = require('../config/database');

    const [summaryRes, topItemsRes] = await Promise.all([
      pool.query(
        `SELECT
           COUNT(*)::INT AS total_orders,
           COUNT(*) FILTER (WHERE status <> 'CANCELLED')::INT AS successful_orders,
           COALESCE(SUM(total_amount) FILTER (WHERE status <> 'CANCELLED'), 0)::DECIMAL(10,2) AS total_revenue
         FROM orders`
      ),
      pool.query(
        `SELECT
           m.item_id,
           m.name,
           COALESCE(SUM(oi.quantity), 0)::INT AS units_sold,
           COALESCE(SUM(oi.subtotal), 0)::DECIMAL(10,2) AS sales
         FROM order_items oi
         JOIN orders o ON oi.order_id = o.order_id
         JOIN menu_items m ON oi.item_id = m.item_id
         WHERE o.status <> 'CANCELLED'
         GROUP BY m.item_id, m.name
         ORDER BY units_sold DESC, sales DESC
         LIMIT 10`
      )
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: summaryRes.rows[0],
        topSellingItems: topItemsRes.rows
      }
    });
  })
};

module.exports = orderController;
