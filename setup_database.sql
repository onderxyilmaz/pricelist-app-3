-- Pricelist App 3 - Complete Database Setup
-- Run this file once to create all tables and set up the database
-- 
-- Usage:
--   1. Create database: createdb pricelist-app-3
--   2. Run this file: psql -d pricelist-app-3 -f setup_database.sql

-- =============================================================================
-- USERS TABLE
-- =============================================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    avatar_filename VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('super_admin', 'admin', 'user')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- PRICELISTS TABLE
-- =============================================================================
CREATE TABLE pricelists (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    currency VARCHAR(10) DEFAULT 'TL',
    color VARCHAR(7) DEFAULT '#1890ff',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- PRICELIST ITEMS TABLE
-- =============================================================================
CREATE TABLE pricelist_items (
    id SERIAL PRIMARY KEY,
    pricelist_id INTEGER REFERENCES pricelists(id) ON DELETE CASCADE,
    product_id VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock INTEGER DEFAULT 0,
    unit VARCHAR(50) DEFAULT 'adet',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX idx_pricelist_items_pricelist_id ON pricelist_items(pricelist_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_pricelist_items_product_id ON pricelist_items(product_id);

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================
\echo 'Database setup completed successfully!'
\echo 'Database is ready with empty tables.'
\echo 'When you first run the app, register page will appear for the first user.'
\echo 'The first registered user will automatically become Super Admin.'
