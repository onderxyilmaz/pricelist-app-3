-- ====================================
-- PRICELIST APP v3 - DATABASE SETUP
-- ====================================
-- Bu dosya tüm veritabanı yapısını oluşturur
-- Kullanım: psql -U postgres -d pricelist-app-3 -f setup_database.sql

-- 1. TEMEL TABLOLAR (database_schema.sql)
-- ====================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_filename VARCHAR(255),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('super_admin', 'admin', 'user')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pricelists table
CREATE TABLE IF NOT EXISTS pricelists (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    currency VARCHAR(10) DEFAULT 'EUR',
    description TEXT,
    color VARCHAR(20) DEFAULT '#1890ff',
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pricelist items table
CREATE TABLE IF NOT EXISTS pricelist_items (
    id SERIAL PRIMARY KEY,
    pricelist_id INTEGER REFERENCES pricelists(id) ON DELETE CASCADE,
    product_id VARCHAR(50) NOT NULL,
    name VARCHAR(200), -- Legacy field, kept for backward compatibility
    name_tr VARCHAR(200),
    name_en VARCHAR(200),
    description_tr TEXT,
    description_en TEXT,
    price DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20) DEFAULT 'adet',
    stock INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pricelist_items_pricelist_id ON pricelist_items(pricelist_id);
CREATE INDEX IF NOT EXISTS idx_pricelist_items_product_id ON pricelist_items(product_id);

-- Trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE OR REPLACE TRIGGER update_users_modtime 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE OR REPLACE TRIGGER update_pricelists_modtime 
    BEFORE UPDATE ON pricelists 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE OR REPLACE TRIGGER update_pricelist_items_modtime 
    BEFORE UPDATE ON pricelist_items 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- 2. ÜRÜN KOLONLARI (add_product_columns.sql)
-- ==========================================

-- Add stock column to pricelist_items
ALTER TABLE pricelist_items 
ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;

-- 3. RENK KOLONU (add_color_column_fix.sql)
-- =========================================

-- Add color column to pricelists
ALTER TABLE pricelists 
ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#1890ff';

-- 4. AVATAR KOLONU (add_avatar_column.sql)
-- ========================================

-- Add avatar column to users (already in CREATE TABLE above, but keep for backward compatibility)
-- ALTER TABLE users
-- ADD COLUMN IF NOT EXISTS avatar_filename VARCHAR(255);

-- 5. MÜŞTERİLER TABLOSU (add_customers_table.sql)
-- =============================================

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);

-- Create trigger
CREATE OR REPLACE TRIGGER update_customers_modtime 
    BEFORE UPDATE ON customers 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- 6. TEKLİFLER TABLOSU (add_offers_table.sql)
-- ===========================================

-- Offers table
CREATE TABLE IF NOT EXISTS offers (
    id SERIAL PRIMARY KEY,
    offer_no VARCHAR(20) UNIQUE NOT NULL,
    revision_no INTEGER DEFAULT 0,
    parent_offer_id INTEGER REFERENCES offers(id) ON DELETE CASCADE,
    customer VARCHAR(255),
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent')),
    customer_response VARCHAR(20) DEFAULT NULL CHECK (customer_response IN ('accepted', 'rejected', NULL)),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revised_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_offers_offer_no ON offers(offer_no);
CREATE INDEX IF NOT EXISTS idx_offers_customer_id ON offers(customer_id);
CREATE INDEX IF NOT EXISTS idx_offers_created_by ON offers(created_by);
CREATE INDEX IF NOT EXISTS idx_offers_parent_offer_id ON offers(parent_offer_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status);

-- Create trigger for revised_at
CREATE OR REPLACE TRIGGER update_offers_revised_at 
    BEFORE UPDATE ON offers 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Update trigger to use revised_at instead of updated_at
CREATE OR REPLACE FUNCTION update_revised_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.revised_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_offers_revised_at ON offers;
CREATE TRIGGER update_offers_revised_at 
    BEFORE UPDATE ON offers 
    FOR EACH ROW EXECUTE FUNCTION update_revised_column();

-- 7. TEKLİF ÜRÜNLERİ TABLOSU (add_offer_items_table.sql)
-- ======================================================

-- Offer items table
CREATE TABLE IF NOT EXISTS offer_items (
    id SERIAL PRIMARY KEY,
    offer_id INTEGER REFERENCES offers(id) ON DELETE CASCADE,
    pricelist_item_id INTEGER REFERENCES pricelist_items(id) ON DELETE SET NULL,
    product_id VARCHAR(50) NOT NULL,
    product_name VARCHAR(200), -- Legacy field, kept for backward compatibility
    product_name_tr VARCHAR(200),
    product_name_en VARCHAR(200),
    description TEXT,
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20) DEFAULT 'adet',
    currency VARCHAR(10) DEFAULT 'EUR',
    pricelist_id INTEGER REFERENCES pricelists(id),
    original_price NUMERIC(10, 2),
    item_discount_rate NUMERIC(5, 2) DEFAULT 0,
    item_note TEXT,
    list_discounts JSONB DEFAULT '[]',
    list_profits JSONB DEFAULT '[]',
    manual_price JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_offer_items_offer_id ON offer_items(offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_items_pricelist_item_id ON offer_items(pricelist_item_id);
CREATE INDEX IF NOT EXISTS idx_offer_items_pricelist_id ON offer_items(pricelist_id);

-- 8. DUAL LANGUAGE SUPPORT (add_dual_language_names.sql)
-- ======================================================

-- Add dual language name columns to pricelist_items if they don't exist
ALTER TABLE pricelist_items 
ADD COLUMN IF NOT EXISTS name_tr VARCHAR(200),
ADD COLUMN IF NOT EXISTS name_en VARCHAR(200);

-- Migrate existing name data to name_tr (assuming it's Turkish by default)
UPDATE pricelist_items 
SET name_tr = name 
WHERE name_tr IS NULL AND name IS NOT NULL;

-- Add dual language name columns to offer_items if they don't exist
ALTER TABLE offer_items 
ADD COLUMN IF NOT EXISTS product_name_tr VARCHAR(200),
ADD COLUMN IF NOT EXISTS product_name_en VARCHAR(200);

-- Migrate existing product_name data to product_name_tr
UPDATE offer_items 
SET product_name_tr = product_name 
WHERE product_name_tr IS NULL AND product_name IS NOT NULL;

-- 9. TEKLİF TEMPLATES TABLOSU (add_offer_templates.sql)
-- ======================================================

-- Offer templates table
CREATE TABLE IF NOT EXISTS offer_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by INTEGER REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Offer template items table
CREATE TABLE IF NOT EXISTS offer_template_items (
    id SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES offer_templates(id) ON DELETE CASCADE,
    product_id VARCHAR(50) NOT NULL,
    pricelist_id INTEGER REFERENCES pricelists(id),
    name_tr VARCHAR(200),
    name_en VARCHAR(200),
    description_tr TEXT,
    description_en TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'EUR',
    unit VARCHAR(20) DEFAULT 'adet',
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for offer templates
CREATE INDEX IF NOT EXISTS idx_offer_templates_created_by ON offer_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_offer_templates_updated_by ON offer_templates(updated_by);
CREATE INDEX IF NOT EXISTS idx_offer_template_items_template_id ON offer_template_items(template_id);
CREATE INDEX IF NOT EXISTS idx_offer_template_items_pricelist_id ON offer_template_items(pricelist_id);

-- Create triggers for offer templates
CREATE OR REPLACE TRIGGER update_offer_templates_modtime 
    BEFORE UPDATE ON offer_templates 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- 10. FİRMALAR TABLOSU (add_companies_table.sql)
-- ============================================

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) UNIQUE NOT NULL,
    logo_filename VARCHAR(255),
    logo_width NUMERIC(10, 1) DEFAULT NULL, -- Logo width in cm (supports decimal values like 3.5, 2.5)
    logo_height NUMERIC(10, 1) DEFAULT NULL, -- Logo height in cm (supports decimal values like 3.5, 2.5)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(company_name);

-- Create trigger
CREATE OR REPLACE TRIGGER update_companies_modtime 
    BEFORE UPDATE ON companies 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Ensure logo_width and logo_height are NUMERIC (not INTEGER) for decimal values
-- This handles cases where columns might have been created as INTEGER
-- NUMERIC(10, 1) allows decimal values like 3.5, 2.5, 10.0, etc.
DO $$
BEGIN
    -- Alter logo_width column if it exists and is INTEGER
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'companies' 
        AND column_name = 'logo_width'
        AND data_type = 'integer'
    ) THEN
        ALTER TABLE companies 
        ALTER COLUMN logo_width TYPE NUMERIC(10, 1) USING logo_width::NUMERIC(10, 1);
    END IF;

    -- Alter logo_height column if it exists and is INTEGER
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'companies' 
        AND column_name = 'logo_height'
        AND data_type = 'integer'
    ) THEN
        ALTER TABLE companies 
        ALTER COLUMN logo_height TYPE NUMERIC(10, 1) USING logo_height::NUMERIC(10, 1);
    END IF;
END $$;

-- Add company_id to offers table
ALTER TABLE offers 
ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id);

-- Create index for company_id in offers
CREATE INDEX IF NOT EXISTS idx_offers_company_id ON offers(company_id);

-- Insert some sample companies
INSERT INTO companies (company_name) VALUES 
('Firma 1'),
('Firma 2'), 
('Firma 3')
ON CONFLICT (company_name) DO NOTHING;

-- 11. REFRESH TOKENS TABLOSU (create_refresh_tokens_table.sql)
-- ============================================================

-- Refresh tokens table for Access Token + Refresh Token authentication
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, token_hash)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- ====================================
-- KURULUM TAMAMLANDI!
-- ====================================

-- Kurulum özeti
