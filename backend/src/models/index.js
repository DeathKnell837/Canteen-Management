const { pool } = require('../config/database');

// User Model
const User = {
  async findById(userId) {
    const result = await pool.query(
      'SELECT user_id, email, full_name, role, status, wallet_balance, created_at FROM users WHERE user_id = $1',
      [userId]
    );
    return result.rows[0];
  },

  async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  },

  async create(email, phone, passwordHash, fullName, role = 'CUSTOMER') {
    const result = await pool.query(
      `INSERT INTO users (email, phone, password_hash, full_name, role, status, wallet_balance)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING user_id, email, full_name, role`,
      [email, phone, passwordHash, fullName, role, 'ACTIVE', 0]
    );
    return result.rows[0];
  },

  async updateProfile(userId, updates) {
    const fields = [];
    const values = [];
    let index = 1;

    if (updates.full_name) {
      fields.push(`full_name = $${index++}`);
      values.push(updates.full_name);
    }
    if (updates.phone) {
      fields.push(`phone = $${index++}`);
      values.push(updates.phone);
    }

    if (fields.length === 0) return null;

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    const result = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE user_id = $${index} RETURNING *`,
      values
    );
    return result.rows[0];
  },

  async updateWalletBalance(userId, amount) {
    const result = await pool.query(
      'UPDATE users SET wallet_balance = wallet_balance + $1 WHERE user_id = $2 RETURNING wallet_balance',
      [amount, userId]
    );
    return result.rows[0];
  }
};

// Menu Model
const Menu = {
  async getCategories() {
    const result = await pool.query(
      'SELECT category_id, name, description FROM menu_categories WHERE is_active = true ORDER BY display_order'
    );
    return result.rows;
  },

  async getItems(categoryId = null) {
    let query = `SELECT m.item_id, m.name, m.description, m.base_price, m.is_vegetarian, m.prep_time_minutes, m.category_id,
                        c.name as category_name, i.quantity_available
                 FROM menu_items m
                 JOIN menu_categories c ON m.category_id = c.category_id
                 LEFT JOIN inventory i ON m.item_id = i.item_id
                 WHERE m.is_active = true`;
    const params = [];

    if (categoryId) {
      query += ' AND m.category_id = $1';
      params.push(categoryId);
    }

    query += ' ORDER BY m.name';

    const result = await pool.query(query, params);
    return result.rows;
  },

  async getItemById(itemId) {
    const result = await pool.query(
      `SELECT m.item_id, m.name, m.description, m.base_price, m.is_vegetarian, m.prep_time_minutes, m.category_id,
              c.name as category_name, i.quantity_available
       FROM menu_items m
       JOIN menu_categories c ON m.category_id = c.category_id
       LEFT JOIN inventory i ON m.item_id = i.item_id
       WHERE m.item_id = $1 AND m.is_active = true`,
      [itemId]
    );
    return result.rows[0];
  },

  async searchItems(searchTerm) {
    const result = await pool.query(
      `SELECT m.item_id, m.name, m.description, m.base_price, m.is_vegetarian, m.prep_time_minutes, m.category_id,
              c.name as category_name, i.quantity_available
       FROM menu_items m
       JOIN menu_categories c ON m.category_id = c.category_id
       LEFT JOIN inventory i ON m.item_id = i.item_id
       WHERE m.is_active = true AND (m.name ILIKE $1 OR m.description ILIKE $1)
       ORDER BY m.name`,
      [`%${searchTerm}%`]
    );
    return result.rows;
  },

  async createItem(categoryId, name, description, price, isVegetarian, prepTime) {
    const result = await pool.query(
      `INSERT INTO menu_items (category_id, name, description, base_price, is_vegetarian, prep_time_minutes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [categoryId, name, description, price, isVegetarian, prepTime]
    );
    return result.rows[0];
  },

  async updateItem(itemId, updates) {
    const fields = [];
    const values = [];
    let index = 1;

    if (updates.name) {
      fields.push(`name = $${index++}`);
      values.push(updates.name);
    }
    if (updates.description) {
      fields.push(`description = $${index++}`);
      values.push(updates.description);
    }
    if (updates.base_price !== undefined) {
      fields.push(`base_price = $${index++}`);
      values.push(updates.base_price);
    }
    if (updates.is_active !== undefined) {
      fields.push(`is_active = $${index++}`);
      values.push(updates.is_active);
    }

    if (fields.length === 0) return null;
    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(itemId);

    const result = await pool.query(
      `UPDATE menu_items SET ${fields.join(', ')} WHERE item_id = $${index} RETURNING *`,
      values
    );
    return result.rows[0];
  }
};

// Order Model
const Order = {
  async create(userId, deliveryType, specialInstructions = null) {
    const orderNumber = `ORD-${Date.now()}`;
    const result = await pool.query(
      `INSERT INTO orders (user_id, order_number, delivery_type, subtotal, tax_amount, discount_amount, total_amount, special_instructions)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING order_id, order_number, status, created_at`,
      [userId, orderNumber, deliveryType, 0, 0, 0, 0, specialInstructions]
    );
    return result.rows[0];
  },

  async addItem(orderId, itemId, quantity) {
    // Get item price
    const itemResult = await pool.query(
      'SELECT base_price FROM menu_items WHERE item_id = $1',
      [itemId]
    );

    if (!itemResult.rows[0]) throw new Error('Item not found');

    const basePrice = itemResult.rows[0].base_price;
    const subtotal = basePrice * quantity;

    const result = await pool.query(
      `INSERT INTO order_items (order_id, item_id, quantity, base_price, subtotal)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING order_item_id`,
      [orderId, itemId, quantity, basePrice, subtotal]
    );

    // Update order total
    await this.updateTotal(orderId);

    return result.rows[0];
  },

  async updateTotal(orderId) {
    // Calculate subtotal
    const subtotalResult = await pool.query(
      'SELECT SUM(subtotal) as total FROM order_items WHERE order_id = $1',
      [orderId]
    );
    const subtotal = parseFloat(subtotalResult.rows[0].total) || 0;
    const tax = parseFloat((subtotal * 0.05).toFixed(2));
    const total = parseFloat((subtotal + tax).toFixed(2));

    await pool.query(
      'UPDATE orders SET subtotal = $1, tax_amount = $2, total_amount = $3, updated_at = CURRENT_TIMESTAMP WHERE order_id = $4',
      [subtotal, tax, total, orderId]
    );
  },

  async getById(orderId) {
    const result = await pool.query(
      `SELECT o.*, u.full_name, u.email
       FROM orders o
       JOIN users u ON o.user_id = u.user_id
       WHERE o.order_id = $1`,
      [orderId]
    );
    return result.rows[0];
  },

  async getByUser(userId, limit = 20, offset = 0) {
    const result = await pool.query(
      `SELECT order_id, order_number, status, delivery_type, total_amount, created_at
       FROM orders
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  },

  async getItems(orderId) {
    const result = await pool.query(
      `SELECT oi.order_item_id, oi.item_id, oi.quantity, oi.base_price, oi.subtotal, m.name as item_name
       FROM order_items oi
       JOIN menu_items m ON oi.item_id = m.item_id
       WHERE oi.order_id = $1`,
      [orderId]
    );
    return result.rows;
  },

  async updateStatus(orderId, status) {
    const result = await pool.query(
      'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE order_id = $2 RETURNING *',
      [status, orderId]
    );
    return result.rows[0];
  },

  async cancel(orderId) {
    const result = await pool.query(
      'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE order_id = $2 RETURNING *',
      ['CANCELLED', orderId]
    );
    return result.rows[0];
  }
};

// Payment Model
const Payment = {
  async create(orderId, userId, paymentMethod, amount) {
    const result = await pool.query(
      `INSERT INTO payments (order_id, user_id, payment_method, amount, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING payment_id, status`,
      [orderId, userId, paymentMethod, amount, 'PENDING']
    );
    return result.rows[0];
  },

  async getById(paymentId) {
    const result = await pool.query(
      'SELECT * FROM payments WHERE payment_id = $1',
      [paymentId]
    );
    return result.rows[0];
  },

  async updateStatus(paymentId, status, transactionId = null) {
    const result = await pool.query(
      'UPDATE payments SET status = $1, transaction_id = $2, updated_at = CURRENT_TIMESTAMP WHERE payment_id = $3 RETURNING *',
      [status, transactionId, paymentId]
    );
    return result.rows[0];
  },

  async getByOrder(orderId) {
    const result = await pool.query(
      'SELECT * FROM payments WHERE order_id = $1',
      [orderId]
    );
    return result.rows[0];
  }
};

// Inventory Model
const Inventory = {
  async getByItem(itemId) {
    const result = await pool.query(
      'SELECT * FROM inventory WHERE item_id = $1',
      [itemId]
    );
    return result.rows[0];
  },

  async getLowStock(threshold = 10) {
    const result = await pool.query(
      `SELECT i.inventory_id, i.item_id, m.name, i.quantity_available, i.reorder_level
       FROM inventory i
       JOIN menu_items m ON i.item_id = m.item_id
       WHERE i.quantity_available <= $1
       ORDER BY i.quantity_available`,
      [threshold]
    );
    return result.rows;
  },

  async updateQuantity(itemId, quantity) {
    const result = await pool.query(
      'UPDATE inventory SET quantity_available = $1, updated_at = CURRENT_TIMESTAMP WHERE item_id = $2 RETURNING *',
      [quantity, itemId]
    );
    return result.rows[0];
  },

  async addStock(itemId, quantity) {
    const result = await pool.query(
      'UPDATE inventory SET quantity_available = quantity_available + $1, updated_at = CURRENT_TIMESTAMP WHERE item_id = $2 RETURNING *',
      [quantity, itemId]
    );
    return result.rows[0];
  },

  async removeStock(itemId, quantity) {
    const result = await pool.query(
      'UPDATE inventory SET quantity_available = quantity_available - $1, updated_at = CURRENT_TIMESTAMP WHERE item_id = $2 RETURNING *',
      [quantity, itemId]
    );
    return result.rows[0];
  }
};

module.exports = {
  User,
  Menu,
  Order,
  Payment,
  Inventory
};
