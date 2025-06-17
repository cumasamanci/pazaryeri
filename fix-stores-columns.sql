-- Stores tablosuna eksik kolonları ekleme
-- Bu dosyayı Supabase SQL Editor'de çalıştırın

-- Önce stores tablosunun mevcut yapısını kontrol et
\d stores;

-- Eksik kolonları ekle
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS environment VARCHAR(50) DEFAULT 'production',
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ;

-- Varolan kayıtları güncelle (eğer varsa)
UPDATE stores SET 
  environment = 'production',
  status = 'active',
  description = COALESCE(description, 'Mağaza açıklaması')
WHERE environment IS NULL OR status IS NULL;

-- Tabloyu kontrol et
SELECT * FROM stores;

-- RLS politikalarını kontrol et ve gerekirse düzelt
DROP POLICY IF EXISTS "Users can view own stores" ON stores;
DROP POLICY IF EXISTS "Users can insert own stores" ON stores;
DROP POLICY IF EXISTS "Users can update own stores" ON stores;
DROP POLICY IF EXISTS "Users can delete own stores" ON stores;

-- Geçici olarak RLS'yi kapat (test için)
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;

-- Veya daha esnek RLS politikaları oluştur
-- ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all operations for authenticated users" ON stores FOR ALL TO authenticated USING (true);
