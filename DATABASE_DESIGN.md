# Canteen Management System - Database Design Document

## DATABASE SCHEMA

### 1. USERS TABLE
```sql
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    profile_picture_url VARCHAR(500),
    role ENUM('ADMIN', 'STAFF', 'CUSTOMER', 'FINANCE') NOT NULL DEFAULT 'CUSTOMER',
    status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    wallet_balance DECIMAL(10, 2) DEFAULT 0.00,
    dietary_preferences TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_phone (phone),
    INDEX idx_role (role),
    INDEX idx_status (status)
);
```

---

### 2. USER_ADDRESSES TABLE
```sql
CREATE TABLE user_addresses (
    address_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL FOREIGN KEY REFERENCES users(user_id) ON DELETE CASCADE,
    type ENUM('HOME', 'OFFICE', 'OTHER') NOT NULL,
    building_number VARCHAR(100),
    street_name VARCHAR(255),
    area VARCHAR(255),
    city VARCHAR(100),
    postal_code VARCHAR(20),
    state VARCHAR(100),
    country VARCHAR(100),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_default (is_default)
);
```

---

### 3. MENU_CATEGORIES TABLE
```sql
CREATE TABLE menu_categories (
    category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    image_url VARCHAR(500),
    display_order INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_active (is_active),
    INDEX idx_order (display_order)
);
```

---

### 4. MENU_ITEMS TABLE
```sql
CREATE TABLE menu_items (
    item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL FOREIGN KEY REFERENCES menu_categories(category_id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    base_price DECIMAL(10, 2) NOT NULL,
    is_vegetarian BOOLEAN DEFAULT FALSE,
    allergens TEXT,
    nutritional_info JSON,
    prep_time_minutes INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category (category_id),
    INDEX idx_active (is_active),
    INDEX idx_name (name)
);
```

---

### 5. MENU_ITEM_CUSTOMIZATIONS TABLE
```sql
CREATE TABLE menu_item_customizations (
    customization_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL FOREIGN KEY REFERENCES menu_items(item_id) ON DELETE CASCADE,
    type ENUM('SIZE', 'ADD_ON', 'SPECIAL_REQUEST') NOT NULL,
    name VARCHAR(255) NOT NULL,
    additional_price DECIMAL(10, 2) DEFAULT 0.00,
    is_required BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_item_id (item_id),
    INDEX idx_type (type)
);
```

---

### 6. MENU_SCHEDULING TABLE
```sql
CREATE TABLE menu_scheduling (
    schedule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL FOREIGN KEY REFERENCES menu_items(item_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    available_quantity INT,
    status ENUM('AVAILABLE', 'SOLD_OUT', 'UNAVAILABLE') DEFAULT 'AVAILABLE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_item_date (item_id, date),
    INDEX idx_date (date)
);
```

---

### 7. ORDERS TABLE
```sql
CREATE TABLE orders (
    order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL FOREIGN KEY REFERENCES users(user_id),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status ENUM('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'PICKED_UP', 'DELIVERED', 'CANCELLED') DEFAULT 'PENDING',
    delivery_type ENUM('PICKUP', 'DELIVERY') NOT NULL,
    delivery_address_id UUID FOREIGN KEY REFERENCES user_addresses(address_id),
    subtotal DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) DEFAULT 0.00,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL,
    special_instructions TEXT,
    estimated_ready_time TIMESTAMP,
    estimated_delivery_time TIMESTAMP,
    actual_delivery_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_order_number (order_number),
    INDEX idx_delivery_type (delivery_type),
    INDEX idx_created_at (created_at)
);
```

---

### 8. ORDER_ITEMS TABLE
```sql
CREATE TABLE order_items (
    order_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL FOREIGN KEY REFERENCES orders(order_id) ON DELETE CASCADE,
    item_id UUID NOT NULL FOREIGN KEY REFERENCES menu_items(item_id),
    quantity INT NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL,
    customizations JSON,
    customization_charges DECIMAL(10, 2) DEFAULT 0.00,
    subtotal DECIMAL(10, 2) NOT NULL,
    special_instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_order_id (order_id),
    INDEX idx_item_id (item_id)
);
```

---

### 9. PAYMENTS TABLE
```sql
CREATE TABLE payments (
    payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL FOREIGN KEY REFERENCES orders(order_id),
    user_id UUID NOT NULL FOREIGN KEY REFERENCES users(user_id),
    payment_method ENUM('WALLET', 'CARD', 'MOBILE_PAYMENT', 'QR_CODE', 'CASH') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status ENUM('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED') DEFAULT 'PENDING',
    transaction_id VARCHAR(255) UNIQUE,
    gateway_response JSON,
    receipt_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_order_id (order_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_transaction_id (transaction_id)
);
```

---

### 10. WALLET_TRANSACTIONS TABLE
```sql
CREATE TABLE wallet_transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL FOREIGN KEY REFERENCES users(user_id),
    amount DECIMAL(10, 2) NOT NULL,
    transaction_type ENUM('CREDIT', 'DEBIT', 'REFUND') NOT NULL,
    reference_id VARCHAR(255),
    description TEXT,
    balance_after DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_type (transaction_type),
    INDEX idx_created_at (created_at)
);
```

---

### 11. INVENTORY TABLE
```sql
CREATE TABLE inventory (
    inventory_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL FOREIGN KEY REFERENCES menu_items(item_id),
    quantity_available INT NOT NULL DEFAULT 0,
    quantity_reserved INT DEFAULT 0,
    reorder_level INT DEFAULT 10,
    expiry_date DATE,
    unit_cost DECIMAL(10, 2),
    last_stock_check TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(item_id),
    INDEX idx_item_id (item_id),
    INDEX idx_quantity (quantity_available)
);
```

---

### 12. INVENTORY_MOVEMENTS TABLE
```sql
CREATE TABLE inventory_movements (
    movement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_id UUID NOT NULL FOREIGN KEY REFERENCES inventory(inventory_id),
    movement_type ENUM('STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'WASTE', 'RESERVATION', 'RELEASE') NOT NULL,
    quantity INT NOT NULL,
    reason TEXT,
    reference_id VARCHAR(255),
    created_by UUID FOREIGN KEY REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_inventory_id (inventory_id),
    INDEX idx_type (movement_type),
    INDEX idx_created_at (created_at)
);
```

---

### 13. SUPPLIERS TABLE
```sql
CREATE TABLE suppliers (
    supplier_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    payment_terms TEXT,
    status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_status (status)
);
```

---

### 14. PURCHASE_ORDERS TABLE
```sql
CREATE TABLE purchase_orders (
    po_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id UUID NOT NULL FOREIGN KEY REFERENCES suppliers(supplier_id),
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    subtotal DECIMAL(10, 2),
    tax_amount DECIMAL(10, 2),
    total_amount DECIMAL(10, 2),
    status ENUM('DRAFT', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED') DEFAULT 'DRAFT',
    notes TEXT,
    created_by UUID FOREIGN KEY REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_supplier_id (supplier_id),
    INDEX idx_status (status),
    INDEX idx_order_date (order_date)
);
```

---

### 15. PURCHASE_ORDER_ITEMS TABLE
```sql
CREATE TABLE purchase_order_items (
    po_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_id UUID NOT NULL FOREIGN KEY REFERENCES purchase_orders(po_id) ON DELETE CASCADE,
    item_id UUID NOT NULL FOREIGN KEY REFERENCES menu_items(item_id),
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2),
    received_quantity INT DEFAULT 0,
    INDEX idx_po_id (po_id),
    INDEX idx_item_id (item_id)
);
```

---

### 16. FEEDBACK TABLE
```sql
CREATE TABLE feedback (
    feedback_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID FOREIGN KEY REFERENCES orders(order_id),
    user_id UUID NOT NULL FOREIGN KEY REFERENCES users(user_id),
    item_id UUID FOREIGN KEY REFERENCES menu_items(item_id),
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    feedback_type ENUM('COMPLIMENT', 'SUGGESTION', 'COMPLAINT', 'ISSUE') DEFAULT 'FEEDBACK',
    response TEXT,
    responded_by UUID FOREIGN KEY REFERENCES users(user_id),
    responded_at TIMESTAMP,
    status ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED') DEFAULT 'OPEN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_order_id (order_id),
    INDEX idx_status (status),
    INDEX idx_rating (rating)
);
```

---

### 17. COUPONS TABLE
```sql
CREATE TABLE coupons (
    coupon_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type ENUM('PERCENTAGE', 'FIXED_AMOUNT') NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL,
    maximum_discount DECIMAL(10, 2),
    minimum_order_amount DECIMAL(10, 2),
    usage_limit INT,
    usage_count INT DEFAULT 0,
    applicable_categories JSON,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_active (is_active),
    INDEX idx_end_date (end_date)
);
```

---

### 18. COUPON_USAGE TABLE
```sql
CREATE TABLE coupon_usage (
    usage_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL FOREIGN KEY REFERENCES coupons(coupon_id),
    user_id UUID NOT NULL FOREIGN KEY REFERENCES users(user_id),
    order_id UUID NOT NULL FOREIGN KEY REFERENCES orders(order_id),
    discount_applied DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_coupon_id (coupon_id),
    INDEX idx_user_id (user_id)
);
```

---

### 19. AUDIT_LOGS TABLE
```sql
CREATE TABLE audit_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID FOREIGN KEY REFERENCES users(user_id),
    action VARCHAR(255) NOT NULL,
    table_name VARCHAR(100),
    record_id VARCHAR(255),
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(50),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_timestamp (timestamp)
);
```

---

### 20. NOTIFICATIONS TABLE
```sql
CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL FOREIGN KEY REFERENCES users(user_id),
    type ENUM('ORDER_STATUS', 'PAYMENT', 'PROMOTION', 'ALERT', 'OTHER') NOT NULL,
    title VARCHAR(255),
    message TEXT,
    related_order_id UUID FOREIGN KEY REFERENCES orders(order_id),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_type (type)
);
```

---

### 21. SYSTEM_SETTINGS TABLE
```sql
CREATE TABLE system_settings (
    setting_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_key (setting_key)
);
```

---

### 22. SHIFTS TABLE
```sql
CREATE TABLE shifts (
    shift_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name)
);
```

---

### 23. STAFF_SHIFTS TABLE
```sql
CREATE TABLE staff_shifts (
    staff_shift_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL FOREIGN KEY REFERENCES users(user_id),
    shift_id UUID NOT NULL FOREIGN KEY REFERENCES shifts(shift_id),
    date DATE NOT NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_date (date)
);
```

---

## DATABASE INDEXES STRATEGY

### High-Priority Indexes (Query Optimization)
- `orders` table: user_id, status, created_at, delivery_type
- `menu_items` table: category_id, is_active, name
- `order_items` table: order_id, item_id
- `inventory` table: item_id, quantity_available
- `payments` table: order_id, status, user_id
- `users` table: email, phone, status, role

### Composite Indexes (Multi-column queries)
- `orders(user_id, created_at)`
- `order_items(order_id, item_id)`
- `inventory_movements(inventory_id, created_at)`
- `menu_scheduling(item_id, date)`

---

## QUERY PATTERNS & OPTIMIZATION

### Common Queries to Optimize
1. **Get user's order history**
   - Query: `SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`
   - Index: `idx_user_id_created_at` on orders

2. **Get active menu items by category**
   - Query: `SELECT * FROM menu_items WHERE category_id = ? AND is_active = true`
   - Index: `idx_category_active` on menu_items

3. **Get pending orders**
   - Query: `SELECT * FROM orders WHERE status IN (PENDING, CONFIRMED, PREPARING)`
   - Index: `idx_status` on orders

4. **Get order items with menu details**
   - Query: Join order_items with menu_items
   - Ensure foreign key indexes

5. **Get inventory levels**
   - Query: `SELECT * FROM inventory WHERE quantity_available < reorder_level`
   - Index: `idx_quantity` on inventory

---

## DENORMALIZATION STRATEGY

For performance optimization, consider denormalizing:

1. **Orders table** - Cache:
   - Customer name (from users)
   - Total item count
   - Payment status

2. **Menu items** - Cache:
   - Category name
   - Current inventory level
   - Average rating

3. **Inventory** - Track:
   - Last 30-day movement summary

---

## BACKUP & ARCHIVAL STRATEGY

### Backup Schedule
- **Daily**: Full backup
- **Hourly**: Transaction log backups
- **Retention**: 30 days

### Archival Strategy
- Archive orders older than 1 year to archive database
- Keep analytics data for 3 years
- Retain audit logs for 2 years minimum

---

## DATA PRIVACY & SECURITY

### PII Fields (Personally Identifiable Information)
- Encrypt: email, phone, password_hash via encryption at rest
- Mask in logs: email, phone, payment details
- No PII in error messages

### Compliance
- GDPR: Right to deletion, data portability
- PCI DSS: Payment card details tokenized only
- CCPA: Audit trail for all data access

---

## ER DIAGRAM RELATIONSHIPS

```
Users (1) -----> (∞) Orders
Users (1) -----> (∞) Feedback
Users (1) -----> (∞) Wallet_Transactions
Users (1) -----> (∞) User_Addresses
Users (1) -----> (∞) Audit_Logs

Orders (1) -----> (∞) Order_Items
Orders (1) -----> (∞) Payments
Orders (1) -----> (∞) Feedback
Orders (1) -----> (∞) Coupon_Usage

Menu_Items (1) -----> (∞) Menu_Item_Customizations
Menu_Items (1) -----> (∞) Inventory
Menu_Items (1) -----> (∞) Order_Items
Menu_Items (1) -----> (∞) Feedback
Menu_Items (1) -----> (∞) Menu_Scheduling

Menu_Categories (1) -----> (∞) Menu_Items

Inventory (1) -----> (∞) Inventory_Movements

Suppliers (1) -----> (∞) Purchase_Orders

Purchase_Orders (1) -----> (∞) Purchase_Order_Items

Coupons (1) -----> (∞) Coupon_Usage

Shifts (1) -----> (∞) Staff_Shifts

User_Addresses (1) <----- (∞) Orders
```

---

## MIGRATION STRATEGY

### Before Going Live
1. Create all tables in production database
2. Create all indexes
3. Set up replication to backup database
4. Test backup and restore procedures
5. Seed initial system data (categories, shifts, settings)

### Migration Tools
- Flyway / Liquibase (for structured migrations)
- Custom migration scripts (for data transformations)

---

## MONITORING & MAINTENANCE

### Database Health Checks
- Query performance (slow query logs)
- Index usage (unused index removal)
- Table fragmentation (defragmentation)
- Disk space utilization
- Connection pool status

### Maintenance Windows
- Weekly: Index fragmentation analysis
- Monthly: Statistics update, query plan analysis
- Quarterly: Archival of old data, full VACUUM

