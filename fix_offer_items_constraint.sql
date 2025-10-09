-- offer_items tablosundaki pricelist_item_id constraint'ini güncellemek için
-- Eski constraint'i kaldırıp ON DELETE SET NULL ile yenisini ekliyoruz

-- Önce mevcut constraint adını bul ve kaldır
DO $$
DECLARE
    constraint_name_var text;
BEGIN
    -- Constraint adını bul
    SELECT tc.constraint_name INTO constraint_name_var
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'offer_items' 
    AND kcu.column_name = 'pricelist_item_id'
    AND tc.constraint_type = 'FOREIGN KEY';
    
    -- Eğer constraint varsa kaldır
    IF constraint_name_var IS NOT NULL THEN
        EXECUTE 'ALTER TABLE offer_items DROP CONSTRAINT ' || constraint_name_var;
        RAISE NOTICE 'Dropped constraint: %', constraint_name_var;
    END IF;
    
    -- Yeni constraint ekle
    ALTER TABLE offer_items 
    ADD CONSTRAINT offer_items_pricelist_item_id_fkey 
    FOREIGN KEY (pricelist_item_id) REFERENCES pricelist_items(id) ON DELETE SET NULL;
    
    RAISE NOTICE 'Added new constraint with ON DELETE SET NULL';
END $$;