-- Supabase SQL Editor'de çalıştırın
-- Test kullanıcısı oluşturma (Authentication bypass)

-- 1. Önce auth.users tablosuna kullanıcı ekleyelim
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'test@example.com',
  crypt('test123456', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- 2. Sonra profiles tablosuna profil ekleyelim
INSERT INTO profiles (
  user_id,
  email,
  full_name,
  company_name
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'test@example.com'),
  'test@example.com',
  'Test Kullanıcı',
  'Test Şirket'
);
