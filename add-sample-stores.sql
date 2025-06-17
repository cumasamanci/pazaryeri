-- Gerçek mağaza örnekleri ekleme
-- Bu script Supabase SQL Editor'de çalıştırılmalıdır

-- Önce test verilerini temizle (eğer varsa)
DELETE FROM stores WHERE name LIKE 'Test%';

-- Gerçek mağaza örnekleri ekle
INSERT INTO stores (
  name, 
  seller_id, 
  api_key, 
  api_secret, 
  environment, 
  status, 
  description,
  created_at,
  updated_at
) VALUES 
(
  'ElektronikDünyası Mağazası',
  '123456',
  'live_api_key_elektronik_dunyasi',
  'live_secret_key_elektronik_dunyasi_2024',
  'production',
  'active',
  'Elektronik ürünler satışı yapan ana mağaza',
  NOW(),
  NOW()
),
(
  'Moda&Stil Butik',
  '789012',
  'live_api_key_moda_stil',
  'live_secret_key_moda_stil_2024',
  'production',
  'active',
  'Kadın ve erkek giyim ürünleri',
  NOW(),
  NOW()
),
(
  'EvDekorasyonu Premium',
  '345678',
  'live_api_key_ev_dekorasyon',
  'live_secret_key_ev_dekorasyon_2024',
  'production',
  'active',
  'Ev dekorasyon ve mobilya ürünleri',
  NOW(),
  NOW()
),
(
  'SpordaKalite Mağazası',
  '901234',
  'live_api_key_spor_kalite',
  'live_secret_key_spor_kalite_2024',
  'production',
  'active',
  'Spor giyim ve ekipmanları',
  NOW(),
  NOW()
),
(
  'KitapSeverleri Kitabevi',
  '567890',
  'live_api_key_kitap_severleri',
  'live_secret_key_kitap_severleri_2024',
  'production',
  'active',
  'Kitap, dergi ve eğitim materyalleri',
  NOW(),
  NOW()
),
(
  'BebeBoutique Mağazası',
  '234567',
  'live_api_key_bebe_boutique',
  'live_secret_key_bebe_boutique_2024',
  'production',
  'active',
  'Bebek ve çocuk ürünleri',
  NOW(),
  NOW()
),
(
  'Test Mağaza - Staging',
  '999999',
  'test_api_key_staging',
  'test_secret_key_staging_2024',
  'staging',
  'active',
  'Test ve geliştirme amaçlı staging mağaza',
  NOW(),
  NOW()
),
(
  'KozmetikGüzellik Store',
  '654321',
  'live_api_key_kozmetik_guzellik',
  'live_secret_key_kozmetik_guzellik_2024',
  'production',
  'active',
  'Kozmetik ve kişisel bakım ürünleri',
  NOW(),
  NOW()
),
(
  'TeknolojiMerkezi',
  '111222',
  'live_api_key_teknoloji_merkezi',
  'live_secret_key_teknoloji_merkezi_2024',
  'production',
  'active',
  'Bilgisayar, telefon ve teknoloji ürünleri',
  NOW(),
  NOW()
),
(
  'YemekDünyası Gourmet',
  '333444',
  'live_api_key_yemek_dunyasi',
  'live_secret_key_yemek_dunyasi_2024',
  'production',
  'active',
  'Gourmet yiyecek ve içecek ürünleri',
  NOW(),
  NOW()
);

-- Mağaza istatistiklerini kontrol et
SELECT 
  COUNT(*) as total_stores,
  COUNT(CASE WHEN environment = 'production' THEN 1 END) as production_stores,
  COUNT(CASE WHEN environment = 'staging' THEN 1 END) as staging_stores,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_stores
FROM stores;

-- Mağaza listesini görüntüle
SELECT 
  id,
  name,
  seller_id,
  environment,
  status,
  description,
  created_at
FROM stores 
ORDER BY created_at DESC;
