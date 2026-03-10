# Canteen Management System - Quick Start Guide

## Prerequisites

✅ Node.js (v18 or higher) - Already installed
✅ npm (v9 or higher) - Comes with Node.js
✅ Docker (optional, for PostgreSQL)
✅ PostgreSQL (optional, if not using Docker)

---

## Step 1: Database Setup

### Option A: Using Docker Compose (Recommended)

1. Install Docker Desktop from https://www.docker.com/products/docker-desktop

2. Navigate to backend directory:
```bash
cd "Canteen Management/backend"
```

3. Start PostgreSQL using Docker Compose:
```bash
docker-compose up -d
```

4. Verify PostgreSQL is running:
```bash
docker-compose ps
```

### Option B: Using Local PostgreSQL

1. Install PostgreSQL from https://www.postgresql.org/download/

2. Create a database:
```bash
createdb canteen_management
```

3. Update `.env` file with your PostgreSQL credentials:
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=canteen_management
```

---

## Step 2: Backend Setup

1. Install dependencies:
```bash
cd "Canteen Management/backend"
npm install --legacy-peer-deps
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration:
```env
# Server
PORT=5000
NODE_ENV=development

# Database (Docker)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=canteen_management

# JWT
JWT_SECRET=your-secret-key-change-this
JWT_EXPIRE=7d

# Redis (optional for caching)
REDIS_HOST=localhost
REDIS_PORT=6379
```

4. Create database schema (run migrations):
```bash
npm run migrate
```

Expected output:
```
Migration 1: Creating ENUM types...
Migration 2: Creating users table...
Migration 3: Creating menu_categories table...
...
All migrations completed successfully!
```

5. Seed database with test data:
```bash
npm run seed
```

Expected output:
```
Database seeding started...
Created admin user: admin@canteen.local
Created 3 customer users
Created 5 menu categories with 15 items
Created sample orders
Seeding completed successfully!
```

---

## Step 3: Start the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm run start
```

Expected output:
```
Server running on port 5000
Database connection established
```

---

## Step 4: Test the System

### Quick Test (Windows)
```bash
test-api.bat
```

### Detailed Testing with curl

#### Test 1: Admin Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@canteen.local", "password": "admin123"}'
```

Expected response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "user_id": 1,
      "email": "admin@canteen.local",
      "full_name": "Admin User",
      "role": "ADMIN",
      "wallet_balance": 1000
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### Test 2: Get Menu Items
```bash
curl http://localhost:5000/api/menu/items
```

#### Test 3: Customer Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user1@example.com", "password": "user123"}'
```

#### Test 4: Create Order (requires token from customer login)
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"item_id": 1, "quantity": 2}
    ],
    "deliveryType": "PICKUP",
    "specialInstructions": "Extra spicy"
  }'
```

---

## Available Test Credentials

| Role | Email | Password | Wallet |
|------|-------|----------|--------|
| Admin | admin@canteen.local | admin123 | ₹1000 |
| Customer | user1@example.com | user123 | ₹500 |
| Customer | user2@example.com | user123 | ₹500 |
| Customer | user3@example.com | user123 | ₹500 |

---

## Troubleshooting

### Port 5000 Already in Use
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or change port in .env
PORT=5001
```

### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

Solution:
- Check if PostgreSQL is running
- Check DB_HOST, DB_PORT, DB_USER, DB_PASSWORD in .env
- Run migrations: `npm run migrate`

### npm install Issues
```bash
# Clear npm cache
npm cache clean --force

# Reinstall with legacy peer deps
npm install --legacy-peer-deps
```

### Migration Fails
```bash
# Check database connection
npm run migrate

# If it fails, manually check:
# 1. PostgreSQL is running
# 2. Database exists
# 3. Database user has permissions
```

---

## Project Structure

```
Canteen Management/
├── backend/
│   ├── src/
│   │   ├── index.js                 # Main Express app
│   │   ├── config/
│   │   │   ├── database.js          # Database connection
│   │   │   └── errorHandler.js      # Error handling
│   │   ├── database/
│   │   │   ├── migrate.js           # Schema migrations
│   │   │   └── seed.js              # Test data seeding
│   │   ├── models/
│   │   │   └── index.js             # Data access layer
│   │   ├── services/
│   │   │   ├── authService.js       # Auth business logic
│   │   │   ├── menuService.js       # Menu business logic
│   │   │   ├── orderService.js      # Order business logic
│   │   │   ├── paymentService.js    # Payment business logic
│   │   │   └── inventoryService.js  # Inventory business logic
│   │   ├── controllers/
│   │   │   ├── authController.js    # Auth HTTP handlers
│   │   │   ├── menuController.js    # Menu HTTP handlers
│   │   │   ├── orderController.js   # Order HTTP handlers
│   │   │   ├── paymentController.js # Payment HTTP handlers
│   │   │   └── inventoryController.js # Inventory HTTP handlers
│   │   ├── routes/
│   │   │   ├── auth.js              # Auth endpoints
│   │   │   ├── menu.js              # Menu endpoints
│   │   │   ├── orders.js            # Order endpoints
│   │   │   ├── payments.js          # Payment endpoints
│   │   │   ├── inventory.js         # Inventory endpoints
│   │   │   └── users.js             # User endpoints
│   │   ├── middleware/
│   │   │   └── auth.js              # JWT & RBAC middleware
│   │   ├── utils/
│   │   │   └── errorHandler.js      # Error handling utilities
│   │   └── validators/
│   │       └── index.js             # Input validation schemas
│   ├── package.json                 # Dependencies
│   ├── .env.example                 # Environment template
│   ├── docker-compose.yml           # Docker PostgreSQL setup
│   └── init.sql                     # Database initialization
├── API_DOCUMENTATION.md              # Complete API reference
├── test-api.sh                       # Linux/Mac test script
├── test-api.bat                      # Windows test script
└── [Planning Documents]              # System design documents
```

---

## APIs Overview

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile

### Menu Management
- `GET /api/menu/categories` - Get all categories
- `GET /api/menu/items` - Get menu items
- `GET /api/menu/items/:id` - Get item details
- `GET /api/menu/search?q=...` - Search items
- `POST /api/menu/items` - Create menu item (Admin)
- `PUT /api/menu/items/:id` - Update menu item (Admin)
- `DELETE /api/menu/items/:id` - Delete menu item (Admin)

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/status` - Update status (Admin)
- `PUT /api/orders/:id/cancel` - Cancel order

### Payments
- `POST /api/payments/process` - Process payment
- `GET /api/payments/status/:id` - Get payment status
- `POST /api/payments/wallet/topup` - Top-up wallet
- `GET /api/payments/wallet/balance` - Get wallet balance

### Inventory
- `GET /api/inventory` - Get all inventory
- `GET /api/inventory/items/:id` - Get item inventory
- `GET /api/inventory/low-stock` - Get low stock items
- `POST /api/inventory/items/:id/stock-in` - Add stock
- `POST /api/inventory/items/:id/stock-out` - Remove stock

### Users
- `GET /api/users/profile` - Get profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/wallet/balance` - Get wallet balance
- `POST /api/users/wallet/topup` - Top-up wallet

---

## What's Implemented

### Phase 1: Foundation ✅
- ✅ Project structure and setup
- ✅ Database schema (10 tables with proper relationships)
- ✅ Authentication system (JWT + Password hashing)
- ✅ Data models (5 models with 25+ methods)
- ✅ Business logic (5 services)
- ✅ HTTP handlers (5 controllers)
- ✅ API routes (6 route groups, 25+ endpoints)
- ✅ Input validation (Joi schemas)
- ✅ Error handling (centralized)
- ✅ Middleware (auth + RBAC)

### Phase 2: Testing (Next)
- Testing all endpoints
- Integration tests
- Load testing (optional)

### Phase 3: Frontend (Later)
- React.js UI
- User dashboard
- Admin panel
- Order tracking

---

## Performance Notes

- Database connection pooling: 20 max connections
- All queries use parameterized statements (SQL injection safe)
- Proper indexing on all tables
- JWT tokens expire in 7 days
- Password hashing with bcryptjs (10 salt rounds)

---

## Security Features

✅ JWT-based authentication
✅ Role-based access control (RBAC)
✅ Password hashing with bcryptjs
✅ SQL injection prevention (parameterized queries)
✅ CORS enabled
✅ Rate limiting ready (to be implemented)
✅ Request validation with Joi
✅ Error handling without exposing internals

---

## What's Ready to Test

1. **User Registration & Login** - Full authentication flow
2. **Menu Management** - View, search, create (admin), update, delete
3. **Order Management** - Create, view, cancel, status updates
4. **Payment Processing** - Wallet payment, card payment, top-ups
5. **Inventory Management** - Stock tracking, low stock alerts, adjustments

---

## Next Steps

1. ✅ Backend setup complete
2. ✅ Database schema created
3. ✅ API endpoints implemented
4. 🔄 Test all endpoints (do this first)
5. Review and fix any issues
6. Frontend development
7. Deployment

---

## Support Files

- `API_DOCUMENTATION.md` - Complete API reference
- `test-api.bat` - Automated Windows tests
- `test-api.sh` - Automated Linux/Mac tests
- `[SYSTEM_PLAN.md]` - System architecture overview
- `[DATABASE_SCHEMA.md]` - Schema details

---

## Getting Help

1. Check API_DOCUMENTATION.md for endpoint details
2. Review error messages in console
3. Check database.js for connection issues
4. Verify .env file has correct values
5. Check migrations ran successfully with: `npm run migrate`

---

## Quick Commands Reference

```bash
# Install dependencies
npm install --legacy-peer-deps

# Run migrations
npm run migrate

# Seed database
npm run seed

# Start development server
npm run dev

# Start production server
npm run start

# Run linter
npm run lint

# Run tests (when available)
npm run test
```

---

**System Status**: Ready for testing ✅

All backend components are implemented and ready for testing. Follow the Quick Start Guide above to set up and run the system.
