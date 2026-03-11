# Canteen Management System

A full-stack canteen management system with React frontend and Node.js/Express backend, using PostgreSQL for data storage.

## Features

### Customer
- Browse menu with category filtering and search
- Add items to cart and place orders
- Wallet-based payments with top-up
- Order history with status tracking (Pending, Paid, Preparing, Ready, Completed)
- View and print receipt for any paid order
- Dark mode support

### Admin
- Dashboard with order/revenue/inventory stats
- Menu item management (create, edit, delete, image upload)
- Order management with action buttons — Start Preparing, Mark Ready, Mark Completed
- Cancel orders (Pending or Paid)
- View and print receipts per order
- Inventory tracking with stock-in/stock-out
- Dark mode support

## Tech Stack

| Layer    | Technology                                        |
|----------|---------------------------------------------------|
| Frontend | React 18, Vite, Tailwind CSS, Lucide Icons        |
| Backend  | Node.js, Express.js, JWT Auth, Multer (uploads)   |
| Database | PostgreSQL 16 (Docker)                            |

## Quick Start

### Prerequisites
- Node.js 18+
- Docker Desktop

### One-command start (recommended)

```bash
npm start
```

This will automatically:
1. Start the PostgreSQL Docker container
2. Start the backend server (port 5000)
3. Start the frontend dev server (port 3000)
4. Open http://localhost:3000 in Chrome

### Manual setup (first time only)

```bash
# 1. Start the database
docker compose -f docker/docker-compose.yml up -d

# 2. Setup backend
cd backend
npm install
node src/database/migrate.js
node src/database/seed.js

# 3. Setup frontend
cd ../frontend
npm install
```

After first-time setup, use `npm start` from the project root.

### URLs

| Service  | URL                    |
|----------|------------------------|
| Frontend | http://localhost:3000  |
| Backend  | http://localhost:5000  |

### Test Credentials

| Role     | Email               | Password |
|----------|---------------------|----------|
| Admin    | admin@canteen.local | admin123 |
| Customer | user1@example.com   | user123  |
