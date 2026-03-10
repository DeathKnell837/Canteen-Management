const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
  console.log('\n🌱 seeding Database...\n');

  try {
    // Clear existing data
    await pool.query('TRUNCATE TABLE feedback, wallet_transactions, inventory, order_items, payments, orders, menu_items, menu_categories, users CASCADE');
    console.log('✅ Cleared existing data');

    // 1. Create Admin User
    const adminPassword = await bcrypt.hash('admin123', 10);
    const adminResult = await pool.query(
      `INSERT INTO users (email, phone, password_hash, full_name, role, email_verified, wallet_balance)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING user_id, email`,
      ['admin@canteen.local', '9999999999', adminPassword, 'Admin User', 'ADMIN', true, 1000]
    );
    const adminId = adminResult.rows[0].user_id;
    console.log('✅ Admin user created:', adminResult.rows[0].email);

    // 2. Create Sample Customers
    const customerPassword = await bcrypt.hash('user123', 10);
    const customers = [];
    
    for (let i = 1; i <= 3; i++) {
      const result = await pool.query(
        `INSERT INTO users (email, phone, password_hash, full_name, role, email_verified, wallet_balance)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING user_id, email`,
        [
          `user${i}@example.com`,
          `${9000000000 + i}`,
          customerPassword,
          `User ${i}`,
          'CUSTOMER',
          true,
          500
        ]
      );
      customers.push(result.rows[0].user_id);
    }
    console.log('✅ Created 3 sample customers');

    // 3. Create Menu Categories
    const categoriesData = [
      { name: 'Breakfast', description: 'Morning items', order: 1 },
      { name: 'Lunch', description: 'Lunch items', order: 2 },
      { name: 'Dinner', description: 'Dinner items', order: 3 },
      { name: 'Snacks', description: 'Light snacks', order: 4 },
      { name: 'Beverages', description: 'Drinks', order: 5 }
    ];

    const categories = {};
    for (const cat of categoriesData) {
      const result = await pool.query(
        `INSERT INTO menu_categories (name, description, display_order)
         VALUES ($1, $2, $3)
         RETURNING category_id, name`,
        [cat.name, cat.description, cat.order]
      );
      categories[cat.name] = result.rows[0].category_id;
    }
    console.log('✅ Created 5 menu categories');

    // 4. Create Menu Items
    const itemsData = [
      // Breakfast
      { name: 'Pancakes', category: 'Breakfast', price: 150, veg: true, prep: 10 },
      { name: 'Omelette', category: 'Breakfast', price: 120, veg: false, prep: 8 },
      { name: 'Toast & Butter', category: 'Breakfast', price: 50, veg: true, prep: 5 },
      
      // Lunch
      { name: 'Chicken Biryani', category: 'Lunch', price: 250, veg: false, prep: 20 },
      { name: 'Vegetable Pulao', category: 'Lunch', price: 180, veg: true, prep: 15 },
      { name: 'Dal Rice', category: 'Lunch', price: 120, veg: true, prep: 10 },
      
      // Dinner
      { name: 'Grilled Fish', category: 'Dinner', price: 300, veg: false, prep: 25 },
      { name: 'Paneer Curry', category: 'Dinner', price: 220, veg: true, prep: 15 },
      { name: 'Vegetable Stir Fry', category: 'Dinner', price: 150, veg: true, prep: 12 },
      
      // Snacks
      { name: 'Samosa', category: 'Snacks', price: 30, veg: true, prep: 5 },
      { name: 'Spring Roll', category: 'Snacks', price: 50, veg: false, prep: 5 },
      { name: 'Sandwich', category: 'Snacks', price: 80, veg: true, prep: 8 },
      
      // Beverages
      { name: 'Coffee', category: 'Beverages', price: 40, veg: true, prep: 3 },
      { name: 'Tea', category: 'Beverages', price: 30, veg: true, prep: 3 },
      { name: 'Fresh Juice', category: 'Beverages', price: 60, veg: true, prep: 5 }
    ];

    const items = [];
    for (const item of itemsData) {
      const result = await pool.query(
        `INSERT INTO menu_items (category_id, name, description, base_price, is_vegetarian, prep_time_minutes)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING item_id, name`,
        [
          categories[item.category],
          item.name,
          `Delicious ${item.name}`,
          item.price,
          item.veg,
          item.prep
        ]
      );
      items.push(result.rows[0].item_id);
    }
    console.log('✅ Created 15 menu items');

    // 5. Add Inventory
    const inventoryResult = await pool.query(`
      SELECT item_id FROM menu_items
    `);

    for (const row of inventoryResult.rows) {
      const quantity = Math.floor(Math.random() * 100) + 20;
      const cost = Math.floor(Math.random() * 150) + 50;
      
      await pool.query(
        `INSERT INTO inventory (item_id, quantity_available, reorder_level, unit_cost)
         VALUES ($1, $2, $3, $4)`,
        [row.item_id, quantity, 10, cost]
      );
    }
    console.log('✅ Added inventory for all items');

    // 6. Create Sample Orders
    const ordersToCreate = 5;
    for (let i = 0; i < ordersToCreate; i++) {
      const userId = customers[i % customers.length];
      
      const orderResult = await pool.query(
        `INSERT INTO orders (user_id, order_number, status, delivery_type, subtotal, tax_amount, total_amount)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING order_id`,
        [
          userId,
          `ORD-${Date.now()}-${i}`,
          ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'][Math.floor(Math.random() * 4)],
          Math.random() > 0.5 ? 'DELIVERY' : 'PICKUP',
          500,
          25,
          525
        ]
      );

      // Add items to order
      const itemsResult = await pool.query(`SELECT item_id, base_price FROM menu_items LIMIT 3`);
      for (const item of itemsResult.rows) {
        const qty = Math.floor(Math.random() * 3) + 1;
        await pool.query(
          `INSERT INTO order_items (order_id, item_id, quantity, base_price, subtotal)
           VALUES ($1, $2, $3, $4, $5)`,
          [orderResult.rows[0].order_id, item.item_id, qty, item.base_price, item.base_price * qty]
        );
      }
    }
    console.log('✅ Created 5 sample orders');

    console.log('\n✨ Database seeded successfully!\n');
    console.log('Test Credentials:');
    console.log('  Admin - Email: admin@canteen.local, Password: admin123');
    console.log('  User  - Email: user1@example.com, Password: user123');
    console.log('');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
