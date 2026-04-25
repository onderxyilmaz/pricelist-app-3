-- Mevcut veritabanına uygulayın: psql -U postgres -d pricelist_app_3 -f migrations/add_pricelist_section_columns.sql
ALTER TABLE pricelist_items
  ADD COLUMN IF NOT EXISTS section_l1_tr TEXT,
  ADD COLUMN IF NOT EXISTS section_l1_en TEXT,
  ADD COLUMN IF NOT EXISTS section_l2_tr TEXT,
  ADD COLUMN IF NOT EXISTS section_l2_en TEXT;

ALTER TABLE offer_items
  ADD COLUMN IF NOT EXISTS section_l1_tr TEXT,
  ADD COLUMN IF NOT EXISTS section_l1_en TEXT,
  ADD COLUMN IF NOT EXISTS section_l2_tr TEXT,
  ADD COLUMN IF NOT EXISTS section_l2_en TEXT;
