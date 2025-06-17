-- Test mağazası ekleme (gerçek Trendyol verisiyle)
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
  'Test Mağaza - MonalureShop',
  '953720',
  'jwGpoSyOH28Sw2C1Vxai',
  '2EYQl5jRAlVLRV4ydqoY',
  'trendyol',
  true,
  NOW(),
  NOW()
);
