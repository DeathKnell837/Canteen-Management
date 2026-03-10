# Canteen Management System - API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected endpoints require the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

---

## 1. AUTH ENDPOINTS (`/api/auth`)

### Register User
**POST** `/auth/register`
- **Access**: Public
- **Request Body**:
```json
{
  "email": "user@example.com",
  "phone": "9876543210",
  "password": "password123",
  "fullName": "John Doe"
}
```
- **Response**: 201
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "user_id": 1,
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "CUSTOMER"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Login
**POST** `/auth/login`
- **Access**: Public
- **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
- **Response**: 200
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "user_id": 1,
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "CUSTOMER",
      "wallet_balance": 500
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Get Profile
**GET** `/auth/profile`
- **Access**: Protected (all roles)
- **Response**: 200
```json
{
  "success": true,
  "data": {
    "user_id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "phone": "9876543210",
    "role": "CUSTOMER",
    "wallet_balance": 500,
    "status": "ACTIVE"
  }
}
```

### Update Profile
**PUT** `/auth/profile`
- **Access**: Protected (all roles)
- **Request Body**:
```json
{
  "fullName": "Jane Doe",
  "phone": "9876543211"
}
```
- **Response**: 200
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { /* updated user data */ }
}
```

### Logout
**POST** `/auth/logout`
- **Access**: Protected (all roles)
- **Response**: 200
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 2. MENU ENDPOINTS (`/api/menu`)

### Get All Categories
**GET** `/menu/categories`
- **Access**: Public
- **Response**: 200
```json
{
  "success": true,
  "data": [
    {
      "category_id": 1,
      "name": "Breakfast",
      "description": "Morning dishes"
    },
    {
      "category_id": 2,
      "name": "Lunch",
      "description": "Lunch items"
    }
  ]
}
```

### Get Menu Items
**GET** `/menu/items`
- **Access**: Public
- **Query Parameters**:
  - `categoryId` (optional): Filter by category
- **Response**: 200
```json
{
  "success": true,
  "data": [
    {
      "item_id": 1,
      "category_id": 1,
      "name": "Idli Sambar",
      "description": "South Indian breakfast",
      "price": 80,
      "is_vegetarian": true,
      "prep_time": 10,
      "is_active": true
    }
  ]
}
```

### Get Item Detail
**GET** `/menu/items/:itemId`
- **Access**: Public
- **Response**: 200
```json
{
  "success": true,
  "data": {
    "item_id": 1,
    "category_id": 1,
    "name": "Idli Sambar",
    "description": "South Indian breakfast",
    "price": 80,
    "is_vegetarian": true,
    "prep_time": 10,
    "is_active": true
  }
}
```

### Search Items
**GET** `/menu/search`
- **Access**: Public
- **Query Parameters**:
  - `q` (required): Search term
- **Response**: 200
```json
{
  "success": true,
  "data": [ /* matching items */ ]
}
```

### Create Menu Item
**POST** `/menu/items`
- **Access**: Protected (ADMIN, STAFF)
- **Request Body**:
```json
{
  "categoryId": 1,
  "name": "Dosa",
  "description": "Crispy crepe",
  "price": 100,
  "isVegetarian": true,
  "prepTime": 15
}
```
- **Response**: 201
```json
{
  "success": true,
  "message": "Item created successfully",
  "data": { /* created item */ }
}
```

### Update Menu Item
**PUT** `/menu/items/:itemId`
- **Access**: Protected (ADMIN, STAFF)
- **Request Body**: Same as create, partial updates allowed
- **Response**: 200
```json
{
  "success": true,
  "message": "Item updated successfully",
  "data": { /* updated item */ }
}
```

### Delete Menu Item
**DELETE** `/menu/items/:itemId`
- **Access**: Protected (ADMIN)
- **Response**: 200
```json
{
  "success": true,
  "message": "Item deleted successfully"
}
```

---

## 3. ORDERS ENDPOINTS (`/api/orders`)

### Create Order
**POST** `/orders`
- **Access**: Protected (CUSTOMER, ADMIN)
- **Request Body**:
```json
{
  "items": [
    {
      "item_id": 1,
      "quantity": 2
    },
    {
      "item_id": 3,
      "quantity": 1
    }
  ],
  "deliveryType": "PICKUP",
  "specialInstructions": "Extra spicy"
}
```
- **Response**: 201
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "order_id": 5,
    "user_id": 1,
    "delivery_type": "PICKUP",
    "total_amount": 280,
    "status": "PENDING",
    "items": [
      {
        "order_item_id": 1,
        "item_id": 1,
        "item_name": "Idli Sambar",
        "quantity": 2,
        "unit_price": 80,
        "subtotal": 160
      }
    ]
  }
}
```

### Get User Orders
**GET** `/orders`
- **Access**: Protected (CUSTOMER, ADMIN)
- **Query Parameters**:
  - `limit` (optional, default: 20)
  - `offset` (optional, default: 0)
- **Response**: 200
```json
{
  "success": true,
  "data": [ /* list of orders */ ]
}
```

### Get Order Detail
**GET** `/orders/:orderId`
- **Access**: Protected (CUSTOMER, ADMIN, STAFF)
- **Response**: 200
```json
{
  "success": true,
  "data": { /* complete order with items */ }
}
```

### Update Order Status
**PUT** `/orders/:orderId/status`
- **Access**: Protected (ADMIN, STAFF)
- **Request Body**:
```json
{
  "status": "CONFIRMED"
}
```
- **Status Values**: PENDING, CONFIRMED, PREPARING, READY, PICKED_UP, DELIVERED, CANCELLED
- **Response**: 200
```json
{
  "success": true,
  "message": "Order status updated",
  "data": { /* updated order */ }
}
```

### Cancel Order
**PUT** `/orders/:orderId/cancel`
- **Access**: Protected (CUSTOMER, ADMIN)
- **Response**: 200
```json
{
  "success": true,
  "message": "Order cancelled successfully"
}
```

### Get All Orders
**GET** `/orders/admin/all`
- **Access**: Protected (ADMIN, STAFF)
- **Query Parameters**:
  - `limit` (optional, default: 50)
  - `offset` (optional, default: 0)
- **Response**: 200
```json
{
  "success": true,
  "data": [ /* all orders */ ]
}
```

---

## 4. PAYMENT ENDPOINTS (`/api/payments`)

### Process Payment
**POST** `/payments/process`
- **Access**: Protected (CUSTOMER, ADMIN)
- **Request Body**:
```json
{
  "orderId": 5,
  "paymentMethod": "WALLET",
  "amount": 280
}
```
- **Payment Methods**: WALLET, CARD, CASH
- **Response**: 200
```json
{
  "success": true,
  "message": "Payment processed successfully",
  "data": {
    "payment_id": 10,
    "order_id": 5,
    "amount": 280,
    "payment_method": "WALLET",
    "status": "SUCCESS",
    "transaction_id": "TXN-1234567890"
  }
}
```

### Get Payment Status
**GET** `/payments/status/:paymentId`
- **Access**: Protected (CUSTOMER, ADMIN)
- **Response**: 200
```json
{
  "success": true,
  "data": { /* payment details */ }
}
```

### Wallet Top-up
**POST** `/payments/wallet/topup`
- **Access**: Protected (CUSTOMER, ADMIN)
- **Request Body**:
```json
{
  "amount": 500
}
```
- **Response**: 200
```json
{
  "success": true,
  "message": "Wallet topped up successfully",
  "data": {
    "wallet_balance": 1000,
    "amount_added": 500
  }
}
```

### Get Wallet Balance
**GET** `/payments/wallet/balance`
- **Access**: Protected (CUSTOMER, ADMIN)
- **Response**: 200
```json
{
  "success": true,
  "data": {
    "wallet_balance": 1000
  }
}
```

---

## 5. INVENTORY ENDPOINTS (`/api/inventory`)

### Get All Inventory
**GET** `/inventory`
- **Access**: Protected (ADMIN, STAFF)
- **Response**: 200
```json
{
  "success": true,
  "data": [
    {
      "item_id": 1,
      "quantity_available": 45,
      "quantity_reserved": 5,
      "last_updated": "2024-01-10T10:30:00Z"
    }
  ]
}
```

### Get Item Inventory
**GET** `/inventory/items/:itemId`
- **Access**: Protected (ADMIN, STAFF)
- **Response**: 200
```json
{
  "success": true,
  "data": {
    "item_id": 1,
    "quantity_available": 45,
    "quantity_reserved": 5,
    "last_updated": "2024-01-10T10:30:00Z"
  }
}
```

### Get Low Stock Items
**GET** `/inventory/low-stock`
- **Access**: Protected (ADMIN, STAFF)
- **Query Parameters**:
  - `threshold` (optional, default: 10)
- **Response**: 200
```json
{
  "success": true,
  "data": [
    {
      "item_id": 5,
      "item_name": "Special Thali",
      "quantity_available": 3
    }
  ]
}
```

### Add Stock
**POST** `/inventory/items/:itemId/stock-in`
- **Access**: Protected (ADMIN, STAFF)
- **Request Body**:
```json
{
  "quantity": 50,
  "reason": "New delivery"
}
```
- **Response**: 200
```json
{
  "success": true,
  "message": "Stock added successfully",
  "data": {
    "item_id": 1,
    "quantity_available": 95,
    "quantity_reserved": 5
  }
}
```

### Remove Stock
**POST** `/inventory/items/:itemId/stock-out`
- **Access**: Protected (ADMIN, STAFF)
- **Request Body**:
```json
{
  "quantity": 10,
  "reason": "Damaged items"
}
```
- **Response**: 200
```json
{
  "success": true,
  "message": "Stock removed successfully",
  "data": {
    "item_id": 1,
    "quantity_available": 85,
    "quantity_reserved": 5
  }
}
```

---

## 6. USERS ENDPOINTS (`/api/users`)

### Get Profile
**GET** `/users/profile`
- **Access**: Protected (CUSTOMER, ADMIN, STAFF)
- **Response**: 200
```json
{
  "success": true,
  "data": { /* user profile */ }
}
```

### Update Profile
**PUT** `/users/profile`
- **Access**: Protected (CUSTOMER, ADMIN, STAFF)
- **Request Body**:
```json
{
  "fullName": "Jane Doe",
  "phone": "9876543211"
}
```
- **Response**: 200
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { /* updated profile */ }
}
```

### Get Wallet Balance
**GET** `/users/wallet/balance`
- **Access**: Protected (CUSTOMER, ADMIN)
- **Response**: 200
```json
{
  "success": true,
  "data": { /* wallet balance */ }
}
```

### Top-up Wallet
**POST** `/users/wallet/topup`
- **Access**: Protected (CUSTOMER, ADMIN)
- **Request Body**:
```json
{
  "amount": 500
}
```
- **Response**: 200
```json
{
  "success": true,
  "message": "Wallet topped up successfully",
  "data": { /* updated balance */ }
}
```

---

## Test Credentials

### Admin User
```
Email: admin@canteen.local
Password: admin123
Role: ADMIN
Wallet: 1000
```

### Customer Users
```
Email: user1@example.com
Password: user123
Role: CUSTOMER
Wallet: 500

Email: user2@example.com
Password: user123
Role: CUSTOMER
Wallet: 500

Email: user3@example.com
Password: user123
Role: CUSTOMER
Wallet: 500
```

---

## Response Format

All responses follow a standard format:

### Success Response (2xx)
```json
{
  "success": true,
  "message": "Optional message",
  "data": { /* response data */ }
}
```

### Error Response (4xx, 5xx)
```json
{
  "success": false,
  "message": "Error message",
  "error": "Error details"
}
```

---

## Error Codes
- `400`: Bad Request - Invalid input
- `401`: Unauthorized - Invalid or missing token
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource not found
- `500`: Internal Server Error - Server error

---

## How to Test Endpoints

### Using cURL

#### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "phone": "1234567890",
    "password": "password123",
    "fullName": "Test User"
  }'
```

#### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@canteen.local",
    "password": "admin123"
  }'
```

#### Get Menu Items
```bash
curl http://localhost:5000/api/menu/items
```

#### Create Order (with token)
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"item_id": 1, "quantity": 2}],
    "deliveryType": "PICKUP",
    "specialInstructions": "Extra spicy"
  }'
```

### Using Postman
1. Create new collection "Canteen Management System"
2. Create requests for each endpoint
3. Set Authorization header in each request
4. Organize into folders by topic (Auth, Menu, Orders, etc.)
5. Save example requests with test data

---

## Rate Limiting
Currently not implemented. Will be added in phase 3.

## Pagination
- `limit`: Number of records to return (default: 20-50)
- `offset`: Number of records to skip (default: 0)

Example: `/api/orders?limit=10&offset=20`

---
