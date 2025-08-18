-- Add color column to pricelists table
ALTER TABLE pricelists ADD COLUMN color VARCHAR(7) DEFAULT '#1890ff';

-- Update existing pricelists with random colors if any exist
UPDATE pricelists SET color = (
    CASE (RANDOM() * 10)::INTEGER % 10
        WHEN 0 THEN '#1890ff'
        WHEN 1 THEN '#52c41a'
        WHEN 2 THEN '#faad14'
        WHEN 3 THEN '#f5222d'
        WHEN 4 THEN '#722ed1'
        WHEN 5 THEN '#13c2c2'
        WHEN 6 THEN '#eb2f96'
        WHEN 7 THEN '#fa8c16'
        WHEN 8 THEN '#a0d911'
        ELSE '#096dd9'
    END
) WHERE color IS NULL;
