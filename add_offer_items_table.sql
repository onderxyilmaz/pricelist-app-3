-- Teklif kalemleri tablosu oluşturma
CREATE TABLE IF NOT EXISTS offer_items (
    id SERIAL PRIMARY KEY,
    offer_id INTEGER REFERENCES offers(id) ON DELETE CASCADE,
    pricelist_id INTEGER REFERENCES pricelists(id) ON DELETE SET NULL,
    pricelist_item_id INTEGER REFERENCES pricelist_items(id) ON DELETE SET NULL,
    product_id VARCHAR(100),
    product_name VARCHAR(255),
    description TEXT,
    unit VARCHAR(50),
    price DECIMAL(10,2),
    currency VARCHAR(10),
    quantity INTEGER NOT NULL DEFAULT 1,
    total_price DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indeksler
CREATE INDEX IF NOT EXISTS idx_offer_items_offer_id ON offer_items(offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_items_pricelist_id ON offer_items(pricelist_id);
CREATE INDEX IF NOT EXISTS idx_offer_items_product_id ON offer_items(product_id);

\echo 'Offer items table created successfully!';
