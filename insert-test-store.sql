-- Test için mağaza ekleme
INSERT INTO stores (
  name,
  seller_id,
  api_key,
  api_secret,
  marketplace_integration,
  is_active,
  created_at,
  updated_at
) VALUES (
  'Test Mağaza',
  '12345',
  'test-api-key',
  'test-api-secret',
  'trendyol',
  true,
  NOW(),
  NOW()
) ON CONFLICT (seller_id) DO UPDATE SET
  name = EXCLUDED.name,
  api_key = EXCLUDED.api_key,
  api_secret = EXCLUDED.api_secret,
  updated_at = NOW();
