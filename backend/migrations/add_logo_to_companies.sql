-- Migration: Add logo_filename column to companies table
-- Date: 2024
-- Description: Adds logo_filename column to companies table for company logo support

-- Add logo_filename column to companies table
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS logo_filename VARCHAR(255);

-- ====================================
-- Migration completed successfully!
-- ====================================

