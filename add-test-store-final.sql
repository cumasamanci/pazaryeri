-- Test mağazası ekle
INSERT INTO stores (
  name,
  seller_id,
  api_key,
  api_secret,
  marketplace,
  active,
  created_at,
  updated_at
) VALUES (
  'MonalureShop Test',
  '953720',
  'jwGpoSyOH28Sw2C1Vxai',
  '2EYQl5jRAlVLRV4ydqoY',
  'Trendyol',
  true,
  NOW(),
  NOW()
);
