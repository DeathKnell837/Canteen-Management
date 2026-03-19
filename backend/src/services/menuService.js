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
    
    // Ensure every menu item has an inventory row so stock status can be shown.
    await Inventory.updateQuantity(item.item_id, 0);

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

  async createCategory(name, description, displayOrder = 0) {
    const { pool } = require('../config/database');
    const result = await pool.query(
      `INSERT INTO menu_categories (name, description, display_order)
       VALUES ($1, $2, $3) RETURNING *`,
      [name, description, displayOrder]
    );
    return result.rows[0];
  }

  async updateCategory(categoryId, updates) {
    const { pool } = require('../config/database');
    const fields = [];
    const values = [];
    let idx = 1;

    if (updates.name !== undefined) { fields.push(`name = $${idx++}`); values.push(updates.name); }
    if (updates.description !== undefined) { fields.push(`description = $${idx++}`); values.push(updates.description); }
    if (updates.display_order !== undefined) { fields.push(`display_order = $${idx++}`); values.push(updates.display_order); }
    if (updates.is_active !== undefined) { fields.push(`is_active = $${idx++}`); values.push(updates.is_active); }

    if (fields.length === 0) throw new AppError('No valid updates', 400);

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(categoryId);

    const result = await pool.query(
      `UPDATE menu_categories SET ${fields.join(', ')} WHERE category_id = $${idx} RETURNING *`,
      values
    );
    if (!result.rows[0]) throw new AppError('Category not found', 404);
    return result.rows[0];
  }

  async deleteCategory(categoryId) {
    const { pool } = require('../config/database');
    // Check if category has active items
    const items = await pool.query(
      'SELECT COUNT(*) FROM menu_items WHERE category_id = $1 AND is_active = true',
      [categoryId]
    );
    if (parseInt(items.rows[0].count) > 0) {
      throw new AppError('Cannot delete category with active items. Remove or move items first.', 400);
    }
    await pool.query('DELETE FROM menu_categories WHERE category_id = $1', [categoryId]);
  }
}

module.exports = new MenuService();
