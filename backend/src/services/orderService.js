const { Order, Menu, Inventory, Payment } = require('../models');
const { AppError } = require('../utils/errorHandler');

class OrderService {
  async createOrder(userId, items, deliveryType, specialInstructions = null) {
    if (!items || items.length === 0) {
      throw new AppError('Order must contain items', 400);
    }

    // Create order
    const order = await Order.create(userId, deliveryType, specialInstructions);

    // Add items to order
    for (const item of items) {
      // Verify item exists
      const menuItem = await Menu.getItemById(item.item_id);
      if (!menuItem) {
        throw new AppError(`Item ${item.item_id} not found`, 404);
      }

      // Check inventory
      const inventory = await Inventory.getByItem(item.item_id);
      if (!inventory || inventory.quantity_available < item.quantity) {
        throw new AppError(`${menuItem.name} out of stock`, 400);
      }

      // Add item to order
      await Order.addItem(order.order_id, item.item_id, item.quantity);

      // Reduce inventory
      await Inventory.removeStock(item.item_id, item.quantity);
    }

    // Get full order details
    const fullOrder = await this.getOrderById(order.order_id);
    return fullOrder;
  }

  async getOrderById(orderId) {
    const order = await Order.getById(orderId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    const items = await Order.getItems(orderId);
    return {
      ...order,
      items
    };
  }

  async getUserOrders(userId, limit = 20, offset = 0) {
    return await Order.getByUser(userId, limit, offset);
  }

  async updateStatus(orderId, status) {
    const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'PICKED_UP', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      throw new AppError('Invalid status', 400);
    }

    const order = await Order.getById(orderId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // When admin confirms a direct-cash order, mark payment as successful as well.
    if (status === 'CONFIRMED') {
      const payment = await Payment.getByOrder(orderId);
      if (payment && payment.payment_method === 'CASH' && payment.status !== 'SUCCESS') {
        await Payment.updateStatus(
          payment.payment_id,
          'SUCCESS',
          payment.transaction_id || `CASH-${Date.now()}`
        );
      }
    }

    return await Order.updateStatus(orderId, status);
  }

  async cancelOrder(orderId) {
    const order = await Order.getById(orderId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      throw new AppError('Can only cancel pending or confirmed orders', 400);
    }

    // Return items to inventory
    const items = await Order.getItems(orderId);
    for (const item of items) {
      await Inventory.addStock(item.item_id, item.quantity);
    }

    return await Order.cancel(orderId);
  }
}

module.exports = new OrderService();
