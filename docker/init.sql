-- Initialize Canteen Management System Database
-- This script runs automatically when PostgreSQL container starts

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('ADMIN', 'STAFF', 'CUSTOMER', 'FINANCE');
CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
CREATE TYPE order_status AS ENUM ('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'PICKED_UP', 'DELIVERED', 'CANCELLED');
CREATE TYPE delivery_type AS ENUM ('PICKUP', 'DELIVERY');
CREATE TYPE payment_method AS ENUM ('WALLET', 'CARD', 'MOBILE_PAYMENT', 'QR_CODE', 'CASH');
CREATE TYPE payment_status AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');

-- All tables will be created by migrations (src/database/migrations/)
-- This script just sets up the schema and types

GRANT ALL PRIVILEGES ON SCHEMA public TO canteen_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO canteen_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO canteen_user;
