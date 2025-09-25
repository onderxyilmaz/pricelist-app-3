-- ====================================
-- OFFER TEMPLATES - ADD USER TRACKING
-- ====================================
-- Bu dosya template tablosuna kullanıcı takibi ekler

-- Add columns for tracking who created and last updated templates
ALTER TABLE offer_templates 
ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id);

-- Note: created_by column already exists from previous schema