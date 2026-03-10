# 🚀 QUICK START GUIDE - Canteen Management System

## What's Been Created

✅ **Complete Project Structure**
- Backend (Node.js + Express)
- Frontend directory (ready for React)
- Documentation
- Docker setup with PostgreSQL + Redis
- Configuration files

✅ **Backend Skeleton**
- Main Express app with all middleware
- 6 API route groups (Auth, Users, Menu, Orders, Payments, Inventory)
- Database connection setup
- Error handling and validation
- Authentication & authorization middleware
- ESLint configuration

✅ **Docker Environment**
- PostgreSQL 16 (Free database)
- Redis 7 (Caching)
- pgAdmin (Database UI)
- Auto-initialization scripts

---

## 📋 NEXT STEPS - DO THIS NOW

### Step 1: Install Node.js & npm (5 minutes)
If not already installed:
- Download from: https://nodejs.org/
- Choose LTS version (18+)
- Verify installation:
```bash
node --version
npm --version
```

### Step 2: Install Docker (10 minutes) - Optional but Recommended
- Download from: https://www.docker.com/products/docker-desktop
- For Windows: Use Docker Desktop
- Or install PostgreSQL locally if you prefer

### Step 3: Setup Backend (Start here!)

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Copy environment file
copy .env.example .env
# Edit .env file with your settings (or use defaults)

# Start database (if using Docker)
cd ../docker
docker-compose up -d
cd ../backend

# Run migrations (when database is ready)
npm run migrate

# Start development server
npm run dev
```

You should see:
```
╔═══════════════════════════════════════════╗
║  Canteen Management System - API Server   ║
║  Running on port 5000                     ║
║  Environment: development                 ║
╚═══════════════════════════════════════════╝
```

### Step 4: Test the Server

In another terminal/browser:
```bash
# Test API health
curl http://localhost:5000/health

# Or visit in browser
http://localhost:5000/api
```

You should see:
```json
{
  "message": "Canteen Management System API",
  "version": "1.0.0",
  "endpoints": { ... }
}
```

### Step 5: Database Check (Optional)

If using Docker with pgAdmin:
- Open: http://localhost:5050
- Email: `admin@canteen.local`
- Password: `admin`
- Add server with host: `postgres`, user: `canteen_user`, password: `canteen_password_dev`

---

## 🎯 WHAT YOU NEED TO DO NEXT (In Order)

### Phase 1: User Authentication (Week 1-2)
1. Create Users table migration
2. Implement Register endpoint
3. Implement Login endpoint
4. Generate JWT tokens
5. Test auth endpoints

**Files to work on:**
- `backend/src/database/migrations/001_create_users_table.js`
- `backend/src/controllers/authController.js`
- `backend/src/services/authService.js`

### Phase 2: Menu Management (Week 3-4)
1. Create Menu tables (categories, items, customizations)
2. Implement CRUD endpoints for menu
3. Add filtering and search
4. Test menu endpoints

**Files to work on:**
- `backend/src/database/migrations/002_create_menu_tables.js`
- `backend/src/controllers/menuController.js`
- `backend/src/services/menuService.js`

### Phase 3: Orders System (Week 5-6)
1. Create Orders tables
2. Implement order creation
3. Implement order tracking
4. Add inventory reservation

**Files to work on:**
- `backend/src/database/migrations/003_create_orders_tables.js`
- `backend/src/controllers/orderController.js`
- `backend/src/services/orderService.js`

### Phase 4: Payments (Week 7-8)
1. Create Payments table
2. Integrate Stripe (or skip for now)
3. Implement payment processing
4. Add wallet system

**Files to work on:**
- `backend/src/database/migrations/004_create_payments_table.js`
- `backend/src/controllers/paymentController.js`
- `backend/src/services/paymentService.js`

### Phase 5: Inventory (Week 9-10)
1. Create Inventory tables
2. Implement stock tracking
3. Add stock alerts
4. Track movements

**Files to work on:**
- `backend/src/database/migrations/005_create_inventory_tables.js`
- `backend/src/models/Inventory.js`

---

## 📁 Current Folder Structure

```
Canteen Management/
├── SYSTEM_PLAN.md                # Comprehensive plan (READ THIS!)
├── PROJECT_CHECKLIST.md          # Detailed checklist
├── DATABASE_DESIGN.md            # Database schemas
├── COST_ESTIMATION.md            # Budget info
├── RISK_MANAGEMENT.md            # Risk register
├── QUICK_REFERENCE.md            # Quick lookup
│
├── backend/                      # Node.js + Express API
│   ├── src/
│   │   ├── config/              # Configuration
│   │   ├── controllers/         # Request handlers (TO BUILD)
│   │   ├── database/            # DB connections
│   │   │   └── migrations/      # SQL migrations (TO BUILD)
│   │   ├── middleware/          # Auth, validation
│   │   ├── models/              # Database queries (TO BUILD)
│   │   ├── routes/              # API endpoints
│   │   ├── services/            # Business logic (TO BUILD)
│   │   ├── utils/               # Helpers
│   │   └── validators/          # Validation schemas
│   ├── tests/                   # Unit & integration tests (TO BUILD)
│   ├── package.json             # Dependencies
│   ├── .env.example             # Config template
│   └── README.md                # Backend docs
│
├── frontend/                    # React app (NEXT PHASE)
│   └── (Will be initialized later)
│
├── docker/                      # Docker configs
│   ├── docker-compose.yml       # PostgreSQL + Redis
│   └── init.sql                 # Database initialization
│
└── docs/                        # Documentation (TO BUILD)
```

---

## ✅ QUICK CHECKLIST - Your First 24 Hours

### Today
- [ ] Install Node.js
- [ ] Install Docker (optional but recommended)
- [ ] Read SYSTEM_PLAN.md (understand the project)
- [ ] Navigate to backend folder
- [ ] Run `npm install`
- [ ] Copy and edit `.env` file
- [ ] Start Docker: `docker-compose up -d`
- [ ] Run development server: `npm run dev`
- [ ] Test API at http://localhost:5000/api

### Tomorrow
- [ ] Create first migration (users table)
- [ ] Implement register endpoint
- [ ] Implement login endpoint
- [ ] Test with Postman/curl

### This Week
- [ ] Complete user authentication
- [ ] Start menu management
- [ ] Setup frontend React project

---

## 🆘 COMMON ISSUES & SOLUTIONS

### "npm: command not found"
→ Node.js not installed. Download from https://nodejs.org/

### "Cannot connect to database"
→ Ensure Docker is running: `docker-compose ps`
→ Or install PostgreSQL locally and update .env

### "Port 5000 already in use"
→ Kill process on port 5000 or change PORT in .env

### "Module not found"
→ Run `npm install` again
→ Delete node_modules and package-lock.json, then `npm install`

### Node version mismatch
→ Need Node 18+: `node --version`
→ Download LTS from https://nodejs.org/

---

## 📚 HELPFUL COMMANDS

```bash
# Backend development
npm run dev                 # Start with hot reload
npm test                    # Run tests
npm run lint                # Check code style
npm run lint:fix            # Auto-fix style issues
npm run migrate             # Run database migrations
npm run seed                # Add sample data

# Database management
docker-compose up -d        # Start containers
docker-compose down         # Stop containers
docker-compose logs postgres # View logs

# Reset everything (WARNING: Deletes all data!)
docker-compose down -v
npm run migrate
npm run seed
npm run dev
```

---

## 🎓 LEARNING RESOURCES

**Node.js + Express**
- https://expressjs.com/
- https://nodejs.org/docs/

**PostgreSQL**
- https://postgresql.org/docs/
- https://www.postgresql.org/download/

**JWT Authentication**
- https://jwt.io/
- https://tools.ietf.org/html/rfc7519

**Testing**
- Jest: https://jestjs.io/
- Supertest: https://github.com/visionmedia/supertest

**API Tools**
- Postman: https://www.postman.com/
- Insomnia: https://insomnia.rest/

---

## 💬 HOW TO ASK FOR HELP

When you're stuck, provide:
1. **What you're trying to do** - Be specific
2. **What you tried** - Show the code/command
3. **What happened** - Show the error
4. **What you expected** - What should have happened

Example:
```
I'm trying to run npm install in the backend folder.
I ran: npm install
Error: npm: command not found
Expected: Dependencies to install
```

---

## 🎯 SUCCESS CRITERIA

By end of this week, you should have:
- ✅ Backend running on http://localhost:5000
- ✅ `/health` endpoint working
- ✅ `/api` endpoint returning API info
- ✅ Database connected via Docker
- ✅ Ready to build features

---

## 📞 QUICK REFERENCE

| Item | Location |
|------|----------|
| API Docs | Start server, visit http://localhost:5000/api |
| Database Schemas | DATABASE_DESIGN.md |
| System Overview | SYSTEM_PLAN.md |
| Task Checklist | PROJECT_CHECKLIST.md |
| Environment Setup | backend/.env.example |
| Docker Config | docker/docker-compose.yml |

---

**🚀 Ready to build? Start with Step 1 above!**

**Questions? Check the documentation files first - they have detailed answers!**
