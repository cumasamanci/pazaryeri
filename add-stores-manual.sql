-- Supabase'de stores tablosuna manuel veri ekleme
-- Bu komutları Supabase Dashboard > SQL Editor'de çalıştırın

-- 1. Önce RLS'yi geçici olarak kapat
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;

-- 2. Mağaza verilerini ekle
INSERT INTO stores (name, seller_id, api_key, api_secret, marketplace, active, settings) VALUES 
('MonalureShop', '953720', 'jwGpoSyOH286w2CtVxaI', '2EYQlGlRAIVLRV4gydqoY', 'trendyol', true, '{}'),
('ElektronikDünyası', '123456', 'test_api_key_elektronik', 'test_secret_elektronik_2024', 'trendyol', true, '{}'),
('ModaBoutique', '789012', 'test_api_key_moda', 'test_secret_moda_2024', 'trendyol', true, '{}'),
('SpordaKalite', '345678', 'test_api_key_spor', 'test_secret_spor_2024', 'trendyol', true, '{}')
ON CONFLICT (seller_id) DO NOTHING;

-- 3. Eklenen verileri kontrol et
SELECT id, name, seller_id, marketplace, active, created_at FROM stores ORDER BY id;

-- 4. RLS'yi tekrar aktif et (opsiyonel)
-- ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- 5. Basit RLS politikası oluştur (herkese okuma izni)
-- CREATE POLICY "Allow read access for all users" ON stores FOR SELECT USING (true);
-- CREATE POLICY "Allow insert for authenticated users" ON stores FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
