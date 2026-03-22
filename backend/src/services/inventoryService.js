const { Inventory } = require('../models');
const { AppError } = require('../utils/errorHandler');

class InventoryService {
  async getInventoryStatus(itemId) {
    const inventory = await Inventory.getByItem(itemId);
    if (!inventory) {
      throw new AppError('Inventory not found', 404);
    }
    return inventory;
  }

  async getLowStockItems(threshold = 10) {
    return await Inventory.getLowStock(threshold);
  }

  async addStock(itemId, quantity, reason = 'STOCK_IN') {
    if (quantity <= 0) {
      throw new AppError('Quantity must be greater than 0', 400);
    }

    const inventory = await Inventory.getByItem(itemId);
    if (!inventory) {
      throw new AppError('Item not found', 404);
    }

    return await Inventory.addStock(itemId, quantity);
  }

  async removeStock(itemId, quantity, reason = 'STOCK_OUT') {
    if (quantity <= 0) {
      throw new AppError('Quantity must be greater than 0', 400);
    }

    const inventory = await Inventory.getByItem(itemId);
    if (!inventory) {
      throw new AppError('Item not found', 404);
    }

    if (inventory.quantity_available < quantity) {
      throw new AppError('Insufficient stock', 400);
    }

    return await Inventory.removeStock(itemId, quantity);
  }

  async getAllInventory() {
    return await Inventory.getAllActive();
  }

  async deleteInventoryItem(itemId) {
    const existing = await Inventory.getByItemAny(itemId);
    if (!existing) {
      throw new AppError('Inventory item not found', 404);
    }

    // Hide item from menu/inventory views immediately.
    await Inventory.deactivateMenuItem(itemId);

    // Best-effort cleanup of inventory row.
    await Inventory.deleteByItem(itemId);

    return { item_id: itemId };
  }
}

module.exports = new InventoryService();
