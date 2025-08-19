-- Firmalar tablosu oluşturma
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indeks
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER companies_updated_at_trigger
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_companies_updated_at();

-- Mevcut offers tablosundaki benzersiz firmaları companies tablosuna taşı
INSERT INTO companies (name)
SELECT DISTINCT company 
FROM offers 
WHERE company IS NOT NULL AND company != ''
ON CONFLICT (name) DO NOTHING;

\echo 'Companies table created successfully!';
\echo 'Existing companies from offers table migrated!';
