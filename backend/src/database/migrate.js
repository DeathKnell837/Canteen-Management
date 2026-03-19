const { pool } = require('../config/database');

/**
 * Create all tables for the Canteen Management System
 * Run in order: USERS -> MENU -> ORDERS -> PAYMENTS -> INVENTORY
 */

const migrations = [
  // MIGRATION 1: Create ENUM types
  {
    name: '001_create_enums',
    up: async () => {
      try {
        await pool.query(`
          DO $$
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
              CREATE TYPE user_role AS ENUM ('ADMIN', 'STAFF', 'CUSTOMER', 'FINANCE');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
              CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
              CREATE TYPE order_status AS ENUM ('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'PICKED_UP', 'DELIVERED', 'CANCELLED');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'delivery_type') THEN
              CREATE TYPE delivery_type AS ENUM ('PICKUP', 'DELIVERY');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
              CREATE TYPE payment_method AS ENUM ('WALLET', 'CARD', 'MOBILE_PAYMENT', 'QR_CODE', 'CASH');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
              CREATE TYPE payment_status AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');
            END IF;
          END
          $$;
        `);
        console.log('✅ ENUMs created');
      } catch (error) {
        console.log('⚠️ ENUMs already exist or error:', error.message);
      }
    }
  },

  // MIGRATION 2: Users Table
  {
    name: '002_create_users_table',
    up: async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          user_id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          phone VARCHAR(20),
          password_hash VARCHAR(255) NOT NULL,
          full_name VARCHAR(255) NOT NULL,
          role user_role DEFAULT 'CUSTOMER',
          status user_status DEFAULT 'ACTIVE',
          email_verified BOOLEAN DEFAULT FALSE,
          wallet_balance DECIMAL(10, 2) DEFAULT 0.00,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      `);
      console.log('✅ Users table created');
    }
  },

  // MIGRATION 3: Menu Categories
  {
    name: '003_create_menu_categories',
    up: async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS menu_categories (
          category_id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL UNIQUE,
          description TEXT,
          display_order INT DEFAULT 0,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_categories_active ON menu_categories(is_active);
      `);
      console.log('✅ Menu categories table created');
    }
  },

  // MIGRATION 4: Menu Items
  {
    name: '004_create_menu_items',
    up: async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS menu_items (
          item_id SERIAL PRIMARY KEY,
          category_id INT NOT NULL REFERENCES menu_categories(category_id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          base_price DECIMAL(10, 2) NOT NULL,
          is_vegetarian BOOLEAN DEFAULT FALSE,
          prep_time_minutes INT DEFAULT 15,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_items_category ON menu_items(category_id);
        CREATE INDEX IF NOT EXISTS idx_items_active ON menu_items(is_active);
      `);
      console.log('✅ Menu items table created');
    }
  },

  // MIGRATION 5: Orders
  {
    name: '005_create_orders_table',
    up: async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS orders (
          order_id SERIAL PRIMARY KEY,
          user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
          order_number VARCHAR(50) UNIQUE NOT NULL,
          status order_status DEFAULT 'PENDING',
          delivery_type delivery_type NOT NULL,
          subtotal DECIMAL(10, 2) NOT NULL,
          tax_amount DECIMAL(10, 2) DEFAULT 0.00,
          discount_amount DECIMAL(10, 2) DEFAULT 0.00,
          total_amount DECIMAL(10, 2) NOT NULL,
          special_instructions TEXT,
          estimated_ready_time TIMESTAMP,
          actual_delivery_time TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
        CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
        CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
      `);
      console.log('✅ Orders table created');
    }
  },

  // MIGRATION 6: Order Items
  {
    name: '006_create_order_items',
    up: async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS order_items (
          order_item_id SERIAL PRIMARY KEY,
          order_id INT NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
          item_id INT NOT NULL REFERENCES menu_items(item_id) ON DELETE RESTRICT,
          quantity INT NOT NULL,
          base_price DECIMAL(10, 2) NOT NULL,
          subtotal DECIMAL(10, 2) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id)
      `);
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_order_items_item ON order_items(item_id)
      `);
      console.log('✅ Order items table created');
    }
  },

  // MIGRATION 7: Payments
  {
    name: '007_create_payments_table',
    up: async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS payments (
          payment_id SERIAL PRIMARY KEY,
          order_id INT NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
          user_id INT NOT NULL REFERENCES users(user_id),
          payment_method payment_method NOT NULL,
          amount DECIMAL(10, 2) NOT NULL,
          status payment_status DEFAULT 'PENDING',
          transaction_id VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
        CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
        CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
      `);
      console.log('✅ Payments table created');
    }
  },

  // MIGRATION 8: Inventory
  {
    name: '008_create_inventory_table',
    up: async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS inventory (
          inventory_id SERIAL PRIMARY KEY,
          item_id INT NOT NULL UNIQUE REFERENCES menu_items(item_id) ON DELETE RESTRICT,
          quantity_available INT NOT NULL DEFAULT 0,
          reorder_level INT DEFAULT 10,
          unit_cost DECIMAL(10, 2),
          last_stock_check TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_inventory_item ON inventory(item_id);
        CREATE INDEX IF NOT EXISTS idx_inventory_quantity ON inventory(quantity_available);
      `);
      console.log('✅ Inventory table created');
    }
  },

  // MIGRATION 9: Wallet Transactions
  {
    name: '009_create_wallet_transactions',
    up: async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS wallet_transactions (
          transaction_id SERIAL PRIMARY KEY,
          user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
          amount DECIMAL(10, 2) NOT NULL,
          transaction_type VARCHAR(50) NOT NULL,
          reference_id VARCHAR(255),
          description TEXT,
          balance_after DECIMAL(10, 2),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_wallet_user ON wallet_transactions(user_id);
        CREATE INDEX IF NOT EXISTS idx_wallet_created ON wallet_transactions(created_at);
      `);
      console.log('✅ Wallet transactions table created');
    }
  },

  // MIGRATION 10: Feedback
  {
    name: '010_create_feedback',
    up: async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS feedback (
          feedback_id SERIAL PRIMARY KEY,
          order_id INT REFERENCES orders(order_id),
          user_id INT NOT NULL REFERENCES users(user_id),
          rating INT CHECK (rating >= 1 AND rating <= 5),
          comment TEXT,
          feedback_type VARCHAR(50) DEFAULT 'FEEDBACK',
          status VARCHAR(50) DEFAULT 'OPEN',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_feedback_user ON feedback(user_id);
        CREATE INDEX IF NOT EXISTS idx_feedback_order ON feedback(order_id);
      `);
      console.log('✅ Feedback table created');
    }
  },

  // MIGRATION: Add image_url to menu_items
  {
    name: '011_add_menu_item_image',
    up: async () => {
      await pool.query(`
        ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS image_url VARCHAR(500) DEFAULT NULL;
      `);
      console.log('✅ image_url column added to menu_items');
    }
  },

  // MIGRATION: Add wallet pin hash to users
  {
    name: '012_add_wallet_pin_hash',
    up: async () => {
      await pool.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_pin_hash VARCHAR(255) DEFAULT NULL;
      `);
      console.log('✅ wallet_pin_hash column added to users');
    }
  },

  // MIGRATION: Ensure all menu items exist in inventory
  {
    name: '013_backfill_inventory_rows',
    up: async () => {
      await pool.query(`
        INSERT INTO inventory (item_id, quantity_available)
        SELECT m.item_id, 0
        FROM menu_items m
        LEFT JOIN inventory i ON i.item_id = m.item_id
        WHERE i.item_id IS NULL;
      `);
      console.log('✅ Missing inventory rows backfilled');
    }
  },

  // MIGRATION 14: Admin top-up log
  {
    name: '014_create_admin_topup_log',
    up: async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS admin_topup_log (
          topup_id SERIAL PRIMARY KEY,
          admin_id INT NOT NULL REFERENCES users(user_id),
          customer_id INT NOT NULL REFERENCES users(user_id),
          amount DECIMAL(10, 2) NOT NULL,
          note TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_admin_topup_admin ON admin_topup_log(admin_id);
        CREATE INDEX IF NOT EXISTS idx_admin_topup_customer ON admin_topup_log(customer_id);
        CREATE INDEX IF NOT EXISTS idx_admin_topup_created ON admin_topup_log(created_at);
      `);
      console.log('✅ Admin top-up log table created');
    }
  },

  // MIGRATION 15: Add profile picture URL to users
  {
    name: '015_add_profile_picture_url',
    up: async () => {
      await pool.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_url VARCHAR(500) DEFAULT NULL;
      `);
      console.log('✅ profile_picture_url column added to users');
    }
  }
];

// Run all migrations
async function runMigrations() {
  console.log('\n📦 Starting Database Migrations...\n');
  
  try {
    for (const migration of migrations) {
      try {
        await migration.up();
      } catch (error) {
        console.error(`❌ Migration ${migration.name} failed:`, error.message);
      }
    }
    
    console.log('\n✅ All migrations completed!\n');
    process.exit(0);
  } catch (error) {
    console.error('Fatal migration error:', error);
    process.exit(1);
  }
}

// Check if running directly
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
