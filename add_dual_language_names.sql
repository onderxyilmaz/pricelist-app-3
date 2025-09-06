-- ====================================
-- DUAL LANGUAGE PRODUCT NAMES
-- ====================================
-- Bu script ürün adları için Türkçe ve İngilizce alanları ekler

-- 1. Yeni name_tr ve name_en kolonlarını ekle
ALTER TABLE pricelist_items 
ADD COLUMN IF NOT EXISTS name_tr VARCHAR(200),
ADD COLUMN IF NOT EXISTS name_en VARCHAR(200);

-- 2. Mevcut name verilerini name_tr'ye kopyala (varsayılan olarak Türkçe kabul ediyoruz)
UPDATE pricelist_items 
SET name_tr = name 
WHERE name_tr IS NULL;

-- 3. Eski name kolonunu kaldır (dikkatli olun, önce backup alın!)
-- ALTER TABLE pricelist_items DROP COLUMN name;

-- 4. offer_items tablosunda da aynı değişiklikleri yap
ALTER TABLE offer_items 
ADD COLUMN IF NOT EXISTS product_name_tr VARCHAR(200),
ADD COLUMN IF NOT EXISTS product_name_en VARCHAR(200);

-- 5. Mevcut product_name verilerini product_name_tr'ye kopyala
UPDATE offer_items 
SET product_name_tr = product_name 
WHERE product_name_tr IS NULL;

-- 6. Eski product_name kolonunu kaldır (dikkatli olun!)
-- ALTER TABLE offer_items DROP COLUMN product_name;

-- ====================================
-- NOT: Bu script çalıştırıldıktan sonra
-- backend kodlarını güncellemek gerekecek
-- ====================================
