# Canteen Management System

A full-stack canteen management system with React frontend and Node.js/Express backend, using PostgreSQL for data storage.

## Features

### Customer
- Browse menu with category filtering and search
- Add items to cart and place orders (dine-in / takeaway)
- Wallet-based payments with top-up
- Order history with status tracking

### Admin
- Dashboard with order/revenue/inventory stats
- Menu item management (create, edit, delete)
- Order status management
- Inventory tracking with stock-in/stock-out

## Tech Stack

| Layer    | Technology                                  |
|----------|---------------------------------------------|
| Frontend | React 18, Vite, Tailwind CSS, Lucide Icons  |
| Backend  | Node.js, Express.js, JWT Auth               |
| Database | PostgreSQL 16 (Docker)                      |

## Quick Start

### Prerequisites
- Node.js 18+
- Docker Desktop

### 1. Start the database
```bash
docker compose -f docker/docker-compose.yml up -d
```

### 2. Setup & run the backend
```bash
cd backend
npm install
node src/database/migrate.js
node src/database/seed.js
npm run dev
```

### 3. Run the frontend
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000** in your browser.

### Test Credentials

| Role     | Email               | Password |
|----------|---------------------|----------|
| Admin    | admin@canteen.local | admin123 |
| Customer | user1@example.com   | user123  |
