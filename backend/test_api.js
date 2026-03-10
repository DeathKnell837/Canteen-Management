const http = require('http');

const BASE_URL = 'http://localhost:5000';
let adminToken = '';
let userToken = '';
let testOrderId = null;
let testPaymentId = null;
let firstItemId = null;
let secondItemId = null;
let thirdItemId = null;
let firstCategoryId = null;

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function test(name, fn) {
  try {
    const result = await fn();
    const icon = (result.status >= 200 && result.status < 300) ? '✅' : '❌';
    console.log(`${icon} ${name} [${result.status}]`);
    if (result.status >= 400) {
      console.log(`   Error: ${JSON.stringify(result.body).substring(0, 150)}`);
    }
    return result;
  } catch (err) {
    console.log(`❌ ${name} - Exception: ${err.message}`);
    return null;
  }
}

async function runTests() {
  console.log('\n🧪 Testing All API Endpoints...\n');
  console.log('=== HEALTH CHECK ===');
  await test('GET /health', () => request('GET', '/health'));

  console.log('\n=== AUTH ENDPOINTS ===');
  
  // Register
  await test('POST /api/auth/register', () => 
    request('POST', '/api/auth/register', {
      email: 'testuser@test.com',
      phone: '1234567890',
      password: 'password123',
      fullName: 'Test User'
    })
  );

  // Login as admin
  const adminLogin = await test('POST /api/auth/login (admin)', () => 
    request('POST', '/api/auth/login', {
      email: 'admin@canteen.local',
      password: 'admin123'
    })
  );
  if (adminLogin && adminLogin.body.data) {
    adminToken = adminLogin.body.data.token;
  }

  // Login as customer
  const userLogin = await test('POST /api/auth/login (user)', () => 
    request('POST', '/api/auth/login', {
      email: 'user1@example.com',
      password: 'user123'
    })
  );
  if (userLogin && userLogin.body.data) {
    userToken = userLogin.body.data.token;
  }

  // Profile
  await test('GET /api/auth/profile', () => request('GET', '/api/auth/profile', null, adminToken));
  await test('PUT /api/auth/profile', () => request('PUT', '/api/auth/profile', { fullName: 'Admin Updated' }, adminToken));

  console.log('\n=== MENU ENDPOINTS (Public) ===');
  const catResult = await test('GET /api/menu/categories', () => request('GET', '/api/menu/categories'));
  if (catResult && catResult.body.data && catResult.body.data.length > 0) {
    firstCategoryId = catResult.body.data[0].category_id;
  }

  const itemsResult = await test('GET /api/menu/items', () => request('GET', '/api/menu/items'));
  if (itemsResult && itemsResult.body.data && itemsResult.body.data.length >= 3) {
    firstItemId = itemsResult.body.data[0].item_id;
    secondItemId = itemsResult.body.data[1].item_id;
    thirdItemId = itemsResult.body.data[2].item_id;
  }

  await test('GET /api/menu/items?categoryId=...', () => request('GET', `/api/menu/items?categoryId=${firstCategoryId}`));
  await test('GET /api/menu/items/:id', () => request('GET', `/api/menu/items/${firstItemId}`));
  await test('GET /api/menu/search?q=coffee', () => request('GET', '/api/menu/search?q=coffee'));

  console.log('\n=== MENU ADMIN ENDPOINTS ===');
  await test('POST /api/menu/items (admin)', () => 
    request('POST', '/api/menu/items', {
      categoryId: firstCategoryId,
      name: 'Test Item',
      description: 'A test menu item',
      price: 99.99,
      isVegetarian: true,
      prepTime: 10
    }, adminToken)
  );

  console.log('\n=== ORDER ENDPOINTS ===');
  const orderResult = await test('POST /api/orders (create)', () => 
    request('POST', '/api/orders', {
      items: [
        { item_id: firstItemId, quantity: 2 },
        { item_id: secondItemId, quantity: 1 }
      ],
      deliveryType: 'PICKUP'
    }, userToken)
  );
  if (orderResult && orderResult.body.data) {
    testOrderId = orderResult.body.data.order_id;
  }

  await test('GET /api/orders (my orders)', () => request('GET', '/api/orders', null, userToken));
  
  if (testOrderId) {
    await test(`GET /api/orders/${testOrderId}`, () => request('GET', `/api/orders/${testOrderId}`, null, userToken));
  }

  // Admin: get all orders
  await test('GET /api/orders/admin/all', () => request('GET', '/api/orders/admin/all', null, adminToken));

  console.log('\n=== PAYMENT ENDPOINTS ===');
  // Top up wallet first to ensure sufficient balance
  await test('POST /api/payments/wallet/topup (prep)', () => 
    request('POST', '/api/payments/wallet/topup', { amount: 1000 }, userToken)
  );

  if (testOrderId) {
    // Get order to find total
    const orderDetail = await request('GET', `/api/orders/${testOrderId}`, null, userToken);
    const totalAmount = orderDetail.body.data ? parseFloat(orderDetail.body.data.total_amount) : 100;

    const payResult = await test('POST /api/payments/process (wallet)', () => 
      request('POST', '/api/payments/process', {
        orderId: testOrderId,
        paymentMethod: 'WALLET',
        amount: totalAmount
      }, userToken)
    );
    if (payResult && payResult.body.data) {
      testPaymentId = payResult.body.data.payment_id;
    }

    if (testPaymentId) {
      await test(`GET /api/payments/status/${testPaymentId}`, () => 
        request('GET', `/api/payments/status/${testPaymentId}`, null, userToken)
      );
    }
  }

  await test('GET /api/payments/wallet/balance', () => request('GET', '/api/payments/wallet/balance', null, userToken));
  await test('POST /api/payments/wallet/topup', () => 
    request('POST', '/api/payments/wallet/topup', { amount: 100 }, userToken)
  );

  console.log('\n=== USER ENDPOINTS ===');
  await test('GET /api/users/profile', () => request('GET', '/api/users/profile', null, userToken));
  await test('GET /api/users/wallet/balance', () => request('GET', '/api/users/wallet/balance', null, userToken));

  console.log('\n=== INVENTORY ENDPOINTS (Admin) ===');
  await test('GET /api/inventory', () => request('GET', '/api/inventory', null, adminToken));
  await test(`GET /api/inventory/items/${firstItemId}`, () => request('GET', `/api/inventory/items/${firstItemId}`, null, adminToken));
  await test('GET /api/inventory/low-stock', () => request('GET', '/api/inventory/low-stock', null, adminToken));
  await test(`POST /api/inventory/items/${firstItemId}/stock-in`, () => 
    request('POST', `/api/inventory/items/${firstItemId}/stock-in`, { quantity: 50, reason: 'restock' }, adminToken)
  );

  console.log('\n=== ORDER STATUS UPDATE (Admin) ===');
  if (testOrderId) {
    await test(`PUT /api/orders/${testOrderId}/status (PREPARING)`, () => 
      request('PUT', `/api/orders/${testOrderId}/status`, { status: 'PREPARING' }, adminToken)
    );
  }

  // Create a new order and cancel it
  const cancelOrderResult = await test('POST /api/orders (for cancel test)', () => 
    request('POST', '/api/orders', {
      items: [{ item_id: thirdItemId, quantity: 1 }],
      deliveryType: 'DELIVERY'
    }, userToken)
  );
  if (cancelOrderResult && cancelOrderResult.body.data) {
    const cancelId = cancelOrderResult.body.data.order_id;
    await test(`PUT /api/orders/${cancelId}/cancel`, () => 
      request('PUT', `/api/orders/${cancelId}/cancel`, null, userToken)
    );
  }

  console.log('\n=== ERROR HANDLING (expected failures) ===');
  await test('GET /api/nonexistent (expect 404)', () => request('GET', '/api/nonexistent'));
  await test('POST /api/auth/login wrong pw (expect 401)', () => 
    request('POST', '/api/auth/login', { email: 'admin@canteen.local', password: 'wrongpass' })
  );
  await test('GET /api/orders no auth (expect 401)', () => request('GET', '/api/orders'));

  console.log('\n✨ All endpoint tests complete!\n');
  process.exit(0);
}

runTests();
