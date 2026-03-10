const { Menu, Inventory } = require('../models');
const { AppError } = require('../utils/errorHandler');

class MenuService {
  async getCategories() {
    return await Menu.getCategories();
  }

  async getItems(categoryId = null) {
    return await Menu.getItems(categoryId);
  }

  async getItemById(itemId) {
    const item = await Menu.getItemById(itemId);
    if (!item) {
      throw new AppError('Item not found', 404);
    }
    return item;
  }

  async searchItems(searchTerm) {
    if (!searchTerm || searchTerm.trim().length === 0) {
      throw new AppError('Search term required', 400);
    }
    return await Menu.searchItems(searchTerm);
  }

  async createItem(categoryId, name, description, price, isVegetarian = false, prepTime = 15) {
    if (!name || !description || !price) {
      throw new AppError('Missing required fields', 400);
    }

    const item = await Menu.createItem(categoryId, name, description, price, isVegetarian, prepTime);
    
    // Add default inventory
    await Inventory.updateQuantity(item.item_id, 50);

    return item;
  }

  async updateItem(itemId, updates) {
    const item = await Menu.getItemById(itemId);
    if (!item) {
      throw new AppError('Item not found', 404);
    }

    return await Menu.updateItem(itemId, updates);
  }

  async deleteItem(itemId) {
    const item = await Menu.getItemById(itemId);
    if (!item) {
      throw new AppError('Item not found', 404);
    }

    return await Menu.updateItem(itemId, { is_active: false });
  }
}

module.exports = new MenuService();
