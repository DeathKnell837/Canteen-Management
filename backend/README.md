# Canteen Management System - Backend

RESTful API backend built with Node.js and Express for the Canteen Management System.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- PostgreSQL 13+
- Docker (optional, for PostgreSQL)

### Installation

1. **Clone and Setup**
```bash
cd backend
npm install
```

2. **Configure Environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Setup Database**
```bash
# Using Docker (recommended)
docker-compose -f ../docker/docker-compose.yml up -d

# Or install PostgreSQL locally and create database
createdb canteen_db
```

4. **Run Migrations**
```bash
npm run migrate
npm run seed  # Optional: add sample data
```

5. **Start Development Server**
```bash
npm run dev
```

Server runs on `http://localhost:5000`

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/       # Request handlers
│   ├── database/         # Database setup & migrations
│   ├── middleware/       # Express middleware
│   ├── models/           # Database models/queries
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── utils/            # Helper functions
│   ├── validators/       # Input validation schemas
│   └── index.js          # Entry point
├── tests/                # Test files
├── .env.example          # Environment variables template
├── .eslintrc.json        # ESLint configuration
├── .gitignore            # Git ignore rules
├── package.json          # Dependencies
└── README.md             # This file
```

## 🔑 Key Features

### Authentication & Security
- JWT-based authentication
- Bcrypt password hashing
- Role-based access control (RBAC)
- Rate limiting
- CORS protection

### Core Modules
- User Management (Registration, Login, Profiles)
- Menu Management (Items, Categories, Customizations)
- Order Management (Create, Track, Cancel)
- Payment Processing (Stripe integration)
- Inventory Management (Stock tracking)

### API Endpoints
See `/docs/API_ENDPOINTS.md` for complete endpoint documentation.

### Error Handling
Comprehensive error handling with custom error classes and standardized responses.

### Logging
Morgan HTTP logger with structured logging for debugging.

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm test:watch

# With coverage
npm test -- --coverage
```

## 📝 Code Standards

### ESLint & Formatting
```bash
# Check for issues
npm run lint

# Auto-fix issues
npm run lint:fix
```

### Commit Message Format
```
[TYPE] Short description

Optional longer description explaining changes

Fixes #123
```

Types: feat, fix, docs, style, refactor, perf, test, chore

## 🗄️ Database

### PostgreSQL Setup

**Using Docker (Recommended):**
```bash
# Start PostgreSQL container
docker-compose -f ../docker/docker-compose.yml up -d postgres

# Connect to database
psql -h localhost -U canteen_user -d canteen_db
```

**Local Installation:**
- Install PostgreSQL from https://www.postgresql.org/download/
- Create database and user
- Update .env file

### Migrations
```bash
# Run pending migrations
npm run migrate

# Seed sample data
npm run seed

# Reset database (careful!)
npm run db:reset
```

### Database Schema
See `DATABASE_DESIGN.md` in project root for complete schema overview.

## 🔐 Security Checklist

- [x] Environment variables for secrets
- [x] Password hashing with bcrypt
- [x] JWT token authentication
- [x] Input validation with Joi
- [x] CORS configuration
- [x] Rate limiting
- [x] SQL injection prevention (parameterized queries)
- [x] XSS protection (helmet)
- [ ] HTTPS in production
- [ ] Penetration testing
- [ ] Security audit

## 📊 Performance Tips

1. **Database Optimization**
   - Use indexes on frequently queried columns
   - Optimize queries with EXPLAIN ANALYZE
   - Implement connection pooling

2. **Caching**
   - Use Redis for session storage
   - Cache menu items and frequently accessed data
   - Implement cache invalidation strategy

3. **API Optimization**
   - Use pagination for large result sets
   - Implement data filtering and search
   - Compress responses with gzip

## 🆘 Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :5000
kill -9 <PID>
```

### Database Connection Error
1. Check PostgreSQL is running
2. Verify .env database credentials
3. Ensure database exists: `psql -l`

### Module Not Found
```bash
npm install
npm run migrate
```

## 📚 Documentation

- [API Endpoints](../docs/API_ENDPOINTS.md)
- [Database Design](../DATABASE_DESIGN.md)
- [System Plan](../SYSTEM_PLAN.md)
- [Architecture Decisions](./docs/ARCHITECTURE.md) *(to be created)*

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/feature-name`
2. Write tests for new features
3. Follow ESLint rules
4. Create pull request with description
5. Ensure all tests pass

## 📞 Support

- Technical Issues: Check docs and tests first
- Database Questions: See DATABASE_DESIGN.md
- API Questions: See API_ENDPOINTS.md
- General Help: Create GitHub issue

## 📄 License

MIT License - See LICENSE file for details

## 🎯 Next Steps

1. ✅ Backend project initialized
2. ⏳ Setup database (PostgreSQL with Docker)
3. ⏳ Create API routes
4. ⏳ Implement controllers & services
5. ⏳ Add authentication middleware
6. ⏳ Implement payment processing
7. ⏳ Add tests

Ready to build! 🚀
