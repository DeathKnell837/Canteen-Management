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
      { name: 'Rice Meals', description: 'Classic Filipino rice meals', order: 1 },
      { name: 'Merienda', description: 'Snacks and light meals', order: 2 },
      { name: 'Soup & Sabaw', description: 'Warm soups and stews', order: 3 },
      { name: 'Silog Meals', description: 'Breakfast silog combos', order: 4 },
      { name: 'Beverages', description: 'Drinks and refreshments', order: 5 }
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
      // Rice Meals
      { name: 'Chicken Adobo', desc: 'Braised chicken in soy sauce, vinegar, garlic, and bay leaves served with steamed rice', category: 'Rice Meals', price: 85, veg: false, prep: 15 },
      { name: 'Pork Sinigang', desc: 'Sour tamarind pork soup with vegetables served with rice', category: 'Rice Meals', price: 90, veg: false, prep: 20 },
      { name: 'Beef Caldereta', desc: 'Rich tomato-based beef stew with potatoes, carrots, and bell peppers', category: 'Rice Meals', price: 110, veg: false, prep: 25 },
      { name: 'Pinakbet', desc: 'Mixed vegetables with shrimp paste — squash, eggplant, okra, and bitter melon', category: 'Rice Meals', price: 65, veg: true, prep: 15 },
      { name: 'Ginataang Kalabasa', desc: 'Squash and string beans simmered in coconut milk', category: 'Rice Meals', price: 60, veg: true, prep: 15 },

      // Merienda
      { name: 'Lumpiang Shanghai', desc: 'Crispy fried spring rolls filled with ground pork and vegetables (6 pcs)', category: 'Merienda', price: 50, veg: false, prep: 10 },
      { name: 'Banana Cue', desc: 'Deep-fried saba banana coated in caramelized brown sugar (3 pcs)', category: 'Merienda', price: 25, veg: true, prep: 5 },
      { name: 'Turon', desc: 'Sweet banana and jackfruit spring roll (3 pcs)', category: 'Merienda', price: 30, veg: true, prep: 5 },
      { name: 'Puto', desc: 'Steamed rice cakes, soft and fluffy (4 pcs)', category: 'Merienda', price: 20, veg: true, prep: 5 },
      { name: 'Kwek-Kwek', desc: 'Deep-fried quail eggs in orange batter with vinegar dipping sauce (6 pcs)', category: 'Merienda', price: 30, veg: false, prep: 8 },

      // Soup & Sabaw
      { name: 'Bulalo', desc: 'Beef shank and bone marrow soup with corn and vegetables', category: 'Soup & Sabaw', price: 120, veg: false, prep: 30 },
      { name: 'Tinolang Manok', desc: 'Chicken ginger soup with green papaya and chili leaves', category: 'Soup & Sabaw', price: 85, veg: false, prep: 20 },
      { name: 'Munggo Soup', desc: 'Mung bean soup with spinach, tomato, and shrimp', category: 'Soup & Sabaw', price: 55, veg: false, prep: 20 },

      // Silog Meals
      { name: 'Tapsilog', desc: 'Beef tapa, sinangag (garlic fried rice), and itlog (fried egg)', category: 'Silog Meals', price: 80, veg: false, prep: 10 },
      { name: 'Longsilog', desc: 'Sweet longganisa sausage, garlic fried rice, and fried egg', category: 'Silog Meals', price: 70, veg: false, prep: 10 },
      { name: 'Bangsilog', desc: 'Fried bangus (milkfish), garlic fried rice, and fried egg', category: 'Silog Meals', price: 85, veg: false, prep: 12 },
      { name: 'Tocilog', desc: 'Sweet cured pork tocino, garlic fried rice, and fried egg', category: 'Silog Meals', price: 70, veg: false, prep: 10 },

      // Beverages
      { name: 'Sago\'t Gulaman', desc: 'Sweet brown sugar drink with tapioca pearls and agar jelly', category: 'Beverages', price: 25, veg: true, prep: 3 },
      { name: 'Calamansi Juice', desc: 'Fresh Philippine lime juice over ice', category: 'Beverages', price: 20, veg: true, prep: 3 },
      { name: 'Buko Juice', desc: 'Fresh young coconut water with coconut meat', category: 'Beverages', price: 30, veg: true, prep: 3 },
      { name: 'Iced Coffee', desc: 'Cold brewed coffee with milk and sugar', category: 'Beverages', price: 35, veg: true, prep: 3 },
      { name: 'Royal (Orange)', desc: 'Chilled Royal orange soda 330ml', category: 'Beverages', price: 20, veg: true, prep: 1 }
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
          item.desc,
          item.price,
          item.veg,
          item.prep
        ]
      );
      items.push(result.rows[0].item_id);
    }
    console.log(`✅ Created ${itemsData.length} menu items`);

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
