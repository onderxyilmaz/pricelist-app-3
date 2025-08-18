-- Teklifler tablosu oluşturma
CREATE TABLE IF NOT EXISTS offers (
    id SERIAL PRIMARY KEY,
    offer_no VARCHAR(100) NOT NULL UNIQUE,
    revision_no INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revised_at TIMESTAMP,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    company VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' -- draft, sent, approved, rejected
);

-- Indeksler
CREATE INDEX IF NOT EXISTS idx_offers_offer_no ON offers(offer_no);
CREATE INDEX IF NOT EXISTS idx_offers_created_by ON offers(created_by);
CREATE INDEX IF NOT EXISTS idx_offers_company ON offers(company);

\echo 'Offers table created successfully!';
