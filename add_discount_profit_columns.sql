-- Add discount and profit columns to offer_items table
-- Bu script teklif ürünlerine indirim ve kar oranı bilgilerini kaydetmek için gerekli alanları ekler

-- Ürün bazında indirim oranı
ALTER TABLE offer_items 
ADD COLUMN IF NOT EXISTS item_discount_rate DECIMAL(5,2) DEFAULT 0;

-- Ürün bazında açıklama/not
ALTER TABLE offer_items 
ADD COLUMN IF NOT EXISTS item_note TEXT;

-- Liste bazında indirimler (JSON array: [{rate: 10, description: 'İndirim 1'}, ...])
ALTER TABLE offer_items 
ADD COLUMN IF NOT EXISTS list_discounts JSONB DEFAULT '[]'::jsonb;

-- Liste bazında kar oranları (JSON array: [{rate: 30, description: 'Kar 1'}, ...])
ALTER TABLE offer_items 
ADD COLUMN IF NOT EXISTS list_profits JSONB DEFAULT '[]'::jsonb;

-- Manuel fiyat bilgisi (JSON: {enabled: true, price: 100.50})
ALTER TABLE offer_items 
ADD COLUMN IF NOT EXISTS manual_price JSONB DEFAULT NULL;

-- Orijinal liste fiyatı (indirimsiz, karsız)
ALTER TABLE offer_items 
ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2);

-- Yorumlar
COMMENT ON COLUMN offer_items.item_discount_rate IS 'Ürün bazında indirim oranı (%)';
COMMENT ON COLUMN offer_items.item_note IS 'Ürün bazında özel not/açıklama';
COMMENT ON COLUMN offer_items.list_discounts IS 'Liste bazında indirim oranları ve açıklamaları (JSON array)';
COMMENT ON COLUMN offer_items.list_profits IS 'Liste bazında kar oranları ve açıklamaları (JSON array)';
COMMENT ON COLUMN offer_items.manual_price IS 'Manuel fiyat bilgisi {enabled: boolean, price: number}';
COMMENT ON COLUMN offer_items.original_price IS 'Orijinal liste fiyatı (indirim ve kar öncesi)';

