# Canteen Management System API Documentation

## Base URL

`http://localhost:5000/api`

## Authentication

Protected endpoints require:

`Authorization: Bearer <jwt_token>`

## Standard Response Shape

Success:

```json
{
  "success": true,
  "message": "Optional message",
  "data": {}
}
```

Error:

```json
{
  "error": {
    "status": 400,
    "message": "Validation error: ..."
  }
}
```

---

## 1) Auth (`/auth`)

### `POST /auth/register`
Create customer account.

Request body:

```json
{
  "email": "user@example.com",
  "phone": "09123456789",
  "password": "password123",
  "fullName": "Juan Dela Cruz"
}
```

### `POST /auth/login`
Login and return token + user payload.

### `GET /auth/profile`
Get current authenticated user profile.

### `PUT /auth/profile`
Update profile basic fields.

### `POST /auth/logout`
Client-side logout acknowledgment endpoint.

---

## 2) Menu (`/menu`)

### Public
- `GET /menu/categories`
- `GET /menu/search?q=<term>`
- `GET /menu/items?categoryId=<id>`
- `GET /menu/items/:itemId`

### Admin/Staff
- `POST /menu/items`
- `PUT /menu/items/:itemId`
- `DELETE /menu/items/:itemId` (admin only)
- `POST /menu/items/:itemId/image` (multipart/form-data, field: `image`)

### Category Management
- `POST /menu/categories` (admin/staff)
- `PUT /menu/categories/:categoryId` (admin/staff)
- `DELETE /menu/categories/:categoryId` (admin only)

Category request body example:

```json
{
  "name": "Rice Meals",
  "description": "Heavy meals",
  "displayOrder": 1,
  "isActive": true
}
```

---

## 3) Orders (`/orders`)

### Customer
- `POST /orders` create order
- `GET /orders?limit=20&offset=0` user order list
- `GET /orders/:orderId` order detail
- `PUT /orders/:orderId/cancel` cancel own order

Create order body:

```json
{
  "items": [
    { "item_id": 1, "quantity": 2 },
    { "item_id": 3, "quantity": 1 }
  ],
  "deliveryType": "PICKUP",
  "specialInstructions": "No onions"
}
```

### Admin/Staff
- `PUT /orders/:orderId/status`
- `GET /orders/admin/all?limit=50&offset=0&status=ALL&startDate=2026-03-01&endDate=2026-03-19`
- `GET /orders/admin/reports/summary`

Status update body:

```json
{
  "status": "PREPARING"
}
```

---

## 4) Payments (`/payments`)

- `POST /payments/process`
- `GET /payments/status/:paymentId`
- `POST /payments/wallet/topup`
- `GET /payments/wallet/balance`
- `GET /payments/wallet/transactions?limit=50`
- `POST /payments/wallet/pin`
- `GET /payments/wallet/pin/status`

Wallet top-up body:

```json
{
  "amount": 200,
  "securityPin": "1234",
  "sourceMethod": "GCASH",
  "sourceName": "Optional name"
}
```

Process payment body:

```json
{
  "orderId": 10,
  "paymentMethod": "WALLET",
  "amount": 180
}
```

---

## 5) Inventory (`/inventory`)

Admin/Staff only.

- `GET /inventory`
- `GET /inventory/items/:itemId`
- `GET /inventory/low-stock`
- `POST /inventory/items/:itemId/stock-in`
- `POST /inventory/items/:itemId/stock-out`

Stock body:

```json
{
  "quantity": 25,
  "reason": "Supplier delivery"
}
```

---

## 6) Admin Wallet (`/admin/wallet`)

Admin/Staff only. Cash-based counter top-up flow.

- `GET /admin/wallet/customers/search?q=juan`
- `GET /admin/wallet/customers/:userId/wallet`
- `POST /admin/wallet/topup`
- `GET /admin/wallet/topup/history?limit=50&startDate=2026-03-01&endDate=2026-03-19`

Top-up body:

```json
{
  "userId": 15,
  "amount": 500,
  "note": "Cash received at counter"
}
```

---

## 7) Settings (`/settings`)

Authenticated users:

- `GET /settings/profile`
- `PUT /settings/profile`
- `PUT /settings/password`
- `PUT /settings/email`
- `POST /settings/profile/picture` (multipart/form-data, field: `picture`)

Admin only:

- `GET /settings/admins`
- `POST /settings/admins`
- `PUT /settings/admins/:userId/toggle`

Create admin body:

```json
{
  "email": "staff@canteen.local",
  "fullName": "Staff User",
  "password": "staff12345",
  "role": "STAFF"
}
```

---

## 8) Reports (`/reports`)

Admin/Staff only. Supports optional date filters: `startDate`, `endDate`.

- `GET /reports/sales`
- `GET /reports/inventory`
- `GET /reports/transactions`
- `GET /reports/menu-performance`
- `GET /reports/customers`
- `GET /reports/order-analytics`
- `GET /reports/cash-collection`

Example:

`GET /api/reports/sales?startDate=2026-03-01&endDate=2026-03-19`

---

## 9) Legacy User Routes (`/users`)

Authenticated routes kept for compatibility:

- `GET /users/profile`
- `PUT /users/profile`
- `GET /users/wallet/balance`
- `POST /users/wallet/topup`

Prefer using `/settings/*` and `/payments/*` for newer modules.

---

## Common Validation Rules

- IDs must be positive integers.
- Money values must be positive numbers.
- Password minimum length: 8.
- Email must be valid format.
- Phone format: 10-11 digits.
- Date filters use ISO format (e.g. `2026-03-19` or ISO datetime).

---

## Health Check

- `GET /health`

Response:

```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-03-19T12:00:00.000Z"
}
```
