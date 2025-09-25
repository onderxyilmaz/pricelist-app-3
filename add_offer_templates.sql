-- ====================================
-- OFFER TEMPLATES - DATABASE SCHEMA
-- ====================================
-- Bu dosya teklif template tabloları oluşturur
-- Kullanım: psql -U postgres -d pricelist-app-3 -f add_offer_templates.sql

-- Offer templates table
CREATE TABLE IF NOT EXISTS offer_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    created_by INTEGER REFERENCES users(id),
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
    currency VARCHAR(10) NOT NULL,
    unit VARCHAR(20) DEFAULT 'adet',
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_offer_template_items_template_id ON offer_template_items(template_id);
CREATE INDEX IF NOT EXISTS idx_offer_template_items_product_id ON offer_template_items(product_id);
CREATE INDEX IF NOT EXISTS idx_offer_template_items_pricelist_id ON offer_template_items(pricelist_id);

-- Apply triggers for updated_at
CREATE OR REPLACE TRIGGER update_offer_templates_modtime 
    BEFORE UPDATE ON offer_templates 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE OR REPLACE TRIGGER update_offer_template_items_modtime 
    BEFORE UPDATE ON offer_template_items 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Add some sample data for testing (optional)
-- INSERT INTO offer_templates (name, description, created_by) 
-- VALUES ('Sample Template', 'Test template for development', 1);