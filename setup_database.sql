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
-- SAMPLE DATA (Optional)
-- =============================================================================

-- Create sample admin user (password: admin123)
-- You can remove this section if you don't want sample data
INSERT INTO users (first_name, last_name, email, password, role) VALUES 
('Admin', 'User', 'admin@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye0ZaYBpJp9.2Z2PUYq.V8L8VZZ6EW.Ky', 'super_admin');

-- Create sample pricelist
INSERT INTO pricelists (name, description, currency, color) VALUES 
('Sample Price List', 'Example price list for testing', 'EUR', '#1890ff');

-- Create sample products
INSERT INTO pricelist_items (pricelist_id, product_id, name, description, price, stock, unit) VALUES 
(1, 'SAMPLE-001', 'Sample Product 1', 'This is a sample product', 99.99, 10, 'adet'),
(1, 'SAMPLE-002', 'Sample Product 2', 'Another sample product', 149.50, 5, 'adet');

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================
\echo 'Database setup completed successfully!'
\echo 'Sample admin user: admin@example.com (password: admin123)'
\echo 'You can now start the backend server.'
