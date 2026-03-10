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
    const { limit = 50, offset = 0 } = req.query;
    const { pool } = require('../config/database');

    const result = await pool.query(
      `SELECT order_id, order_number, status, delivery_type, total_amount, created_at
       FROM orders
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [parseInt(limit), parseInt(offset)]
    );

    res.status(200).json({
      success: true,
      data: result.rows
    });
  })
};

module.exports = orderController;
