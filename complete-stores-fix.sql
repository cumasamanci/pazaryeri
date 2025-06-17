-- STORES TABLOSU TAMAMI İÇİN SQL SCRIPT
-- Bu scripti Supabase SQL Editor'de çalıştırın

-- ADIM 1: Mevcut stores tablosunun yapısını kontrol et
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'stores' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ADIM 2: Mevcut verileri listele
SELECT * FROM stores;

-- ADIM 3: Eğer seller_id kolonu NOT NULL constraint'i varsa kaldır
ALTER TABLE stores ALTER COLUMN seller_id DROP NOT NULL;

-- ADIM 4: Eksik kolonları ekle (eğer yoksa)
ALTER TABLE stores ADD COLUMN IF NOT EXISTS seller_id BIGINT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS environment VARCHAR(20) DEFAULT 'production';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS api_connection_status VARCHAR(20) DEFAULT 'unknown';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS sync_settings JSONB DEFAULT '{}';

-- ADIM 5: seller_id kolonunu nullable yap (eğer NOT NULL ise)
ALTER TABLE stores ALTER COLUMN seller_id SET DEFAULT NULL;

-- ADIM 6: İndeksler ekle
CREATE INDEX IF NOT EXISTS idx_stores_seller_id ON stores(seller_id);
CREATE INDEX IF NOT EXISTS idx_stores_environment ON stores(environment);
CREATE INDEX IF NOT EXISTS idx_stores_user_id ON stores(user_id);

-- ADIM 7: RLS politikalarını kontrol et ve güncelle
DROP POLICY IF EXISTS "Users can view own stores" ON stores;
DROP POLICY IF EXISTS "Users can insert own stores" ON stores;
DROP POLICY IF EXISTS "Users can update own stores" ON stores;
DROP POLICY IF EXISTS "Users can delete own stores" ON stores;

CREATE POLICY "Users can view own stores" ON stores
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stores" ON stores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stores" ON stores
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own stores" ON stores
  FOR DELETE USING (auth.uid() = user_id);

-- ADIM 8: Son durumu kontrol et
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'stores' 
AND table_schema = 'public'
ORDER BY ordinal_position;
