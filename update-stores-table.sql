-- Stores tablosuna yeni kolonlar ekleme
-- Bu SQL kodunu Supabase SQL Editor'de çalıştırın

-- Mevcut stores tablosuna yeni kolonlar ekle
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS seller_id BIGINT,
ADD COLUMN IF NOT EXISTS environment VARCHAR(20) DEFAULT 'production',
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS api_connection_status VARCHAR(20) DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sync_settings JSONB DEFAULT '{}';

-- Indexes ekle
CREATE INDEX IF NOT EXISTS idx_stores_seller_id ON stores(seller_id);
CREATE INDEX IF NOT EXISTS idx_stores_environment ON stores(environment);
CREATE INDEX IF NOT EXISTS idx_stores_user_id ON stores(user_id);

-- RLS politikalarını güncelle
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

-- Mevcut verilerin kontrolü
SELECT 
  id,
  name,
  seller_id,
  environment,
  api_connection_status,
  active,
  created_at
FROM stores
ORDER BY created_at DESC;
