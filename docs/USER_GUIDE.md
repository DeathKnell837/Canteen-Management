# User Guide

## Overview

This guide explains how to use the Canteen Management System for both customer and admin/staff roles.

## Login

1. Open the app at `http://localhost:3000`.
2. Enter email and password.
3. You will be redirected based on role:
- Customer: menu flow
- Admin/Staff: admin dashboard

## Customer Workflow

### 1. Browse and Order
1. Go to Menu.
2. Search items or filter by category.
3. Add items to cart.
4. Open Cart and review quantity and totals.
5. Choose payment method and place order.

### 2. Track Orders
1. Open My Orders.
2. View current and past order status.
3. Open order details and receipt when available.

### 3. Wallet and Transactions
1. Open Wallet to view current balance.
2. Open Transactions to view wallet activity.
3. Top-up is processed by admin/staff at the counter.

### 4. Settings
1. Open Settings.
2. Update profile details (name, phone, email).
3. Change account password.
4. Set or update wallet PIN.
5. Upload or update profile picture.

## Admin/Staff Workflow

### 1. Dashboard
1. Open Dashboard.
2. Review order counts, revenue, and other summaries.

### 2. Menu Management
1. Open Menu Mgmt.
2. Use category tabs to filter items.
3. Create/edit/delete menu items.
4. Manage categories via category management controls.

### 3. Order Management
1. Open Orders.
2. Filter by status and date range.
3. Update order status through preparation lifecycle.
4. Review period summary cards (orders and revenue).

### 4. Inventory
1. Open Inventory.
2. Check available quantity and low-stock items.
3. Perform stock-in/stock-out updates with reasons.

### 5. Wallet Top-Up (Counter Cash)
1. Open Wallet Top-Up.
2. Search customer by name or email.
3. Select customer and verify balance.
4. Enter cash amount received and submit top-up.
5. Review top-up history list.

### 6. Reports
1. Open Reports.
2. Select report tab:
- Sales
- Inventory
- Transactions
- Menu Performance
- Customers
- Order Analytics
- Cash Collection
3. Set date filter (preset or custom).
4. Use Print and CSV export options.

### 7. Admin Settings (Admin Role)
1. Open Settings.
2. Use admin management section to:
- Create admin or staff account
- Activate/deactivate admin/staff account

## Validation and Error Handling

- Inputs are validated before request processing.
- Invalid values show user-friendly errors.
- Common rules include positive IDs, positive amounts, valid email format, strong passwords, and valid date ranges.

## Troubleshooting

### Cannot log in
- Verify credentials.
- Check backend is running on port 5000.

### No data appears
- Confirm database container is running.
- Confirm migrations and seed data were executed.

### Image upload fails
- Ensure file is an image.
- Check backend upload folder permissions.

## Support Notes for Demo/Presentation

- Demonstrate both customer and admin flows.
- Highlight counter-based wallet top-up process.
- Show date-filtered order management and reports.
- Show profile and admin account management in settings.
