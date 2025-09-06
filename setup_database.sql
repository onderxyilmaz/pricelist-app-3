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
    name VARCHAR(200) NOT NULL,
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

-- Add avatar column to users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS avatar VARCHAR(255);

-- 5. TEKLİFLER TABLOSU (add_offers_table.sql)
-- ===========================================

-- Offers table
CREATE TABLE IF NOT EXISTS offers (
    id SERIAL PRIMARY KEY,
    offer_no VARCHAR(20) UNIQUE NOT NULL,
    revision_no INTEGER DEFAULT 0,
    parent_offer_id INTEGER REFERENCES offers(id) ON DELETE CASCADE,
    company VARCHAR(255),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent')),
    customer_response VARCHAR(20) DEFAULT NULL CHECK (customer_response IN ('accepted', 'rejected', NULL)),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revised_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_offers_offer_no ON offers(offer_no);
CREATE INDEX IF NOT EXISTS idx_offers_company ON offers(company);
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

-- 6. FİRMALAR TABLOSU (add_companies_table.sql)
-- =============================================

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);

-- Create trigger
CREATE OR REPLACE TRIGGER update_companies_modtime 
    BEFORE UPDATE ON companies 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Migrate existing company data from offers
INSERT INTO companies (name) 
SELECT DISTINCT company 
FROM offers 
WHERE company IS NOT NULL 
ON CONFLICT (name) DO NOTHING;

-- 7. TEKLİF ÜRÜNLERİ TABLOSU (add_offer_items_table.sql)
-- ======================================================

-- Offer items table
CREATE TABLE IF NOT EXISTS offer_items (
    id SERIAL PRIMARY KEY,
    offer_id INTEGER REFERENCES offers(id) ON DELETE CASCADE,
    pricelist_item_id INTEGER REFERENCES pricelist_items(id),
    product_id VARCHAR(50) NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20) DEFAULT 'adet',
    currency VARCHAR(10) DEFAULT 'EUR',
    pricelist_id INTEGER REFERENCES pricelists(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_offer_items_offer_id ON offer_items(offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_items_pricelist_item_id ON offer_items(pricelist_item_id);
CREATE INDEX IF NOT EXISTS idx_offer_items_pricelist_id ON offer_items(pricelist_id);

-- 8. FİRMA NULLABLE (fix_company_nullable.sql)
-- ============================================

-- Make company column nullable in offers table
ALTER TABLE offers ALTER COLUMN company DROP NOT NULL;

-- Add customer_response column to offers table
ALTER TABLE offers 
ADD COLUMN IF NOT EXISTS customer_response VARCHAR(20) DEFAULT NULL 
CHECK (customer_response IN ('accepted', 'rejected', NULL));

-- ====================================
-- KURULUM TAMAMLANDI!
-- ====================================

-- Kurulum özeti
