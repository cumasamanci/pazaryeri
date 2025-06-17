-- ADIM 1: Stores tablosunun mevcut yapısını kontrol et
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'stores' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ADIM 2: Eksik kolonları tek tek ekle
-- seller_id kolonu ekle
ALTER TABLE stores ADD COLUMN IF NOT EXISTS seller_id BIGINT;

-- environment kolonu ekle  
ALTER TABLE stores ADD COLUMN IF NOT EXISTS environment VARCHAR(20) DEFAULT 'production';

-- description kolonu ekle
ALTER TABLE stores ADD COLUMN IF NOT EXISTS description TEXT;

-- api_connection_status kolonu ekle
ALTER TABLE stores ADD COLUMN IF NOT EXISTS api_connection_status VARCHAR(20) DEFAULT 'unknown';

-- last_sync_at kolonu ekle
ALTER TABLE stores ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ;

-- sync_settings kolonu ekle
ALTER TABLE stores ADD COLUMN IF NOT EXISTS sync_settings JSONB DEFAULT '{}';

-- ADIM 3: İndeksler ekle
CREATE INDEX IF NOT EXISTS idx_stores_seller_id ON stores(seller_id);
CREATE INDEX IF NOT EXISTS idx_stores_environment ON stores(environment);
CREATE INDEX IF NOT EXISTS idx_stores_user_id ON stores(user_id);

-- ADIM 4: Sonuç olarak güncellenmiş tablo yapısını kontrol et
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'stores' 
AND table_schema = 'public'
ORDER BY ordinal_position;
