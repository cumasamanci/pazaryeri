-- Tüm kullanıcıların e-posta doğrulama durumunu aktif yap
-- Bu scripti Supabase SQL Editor'de çalıştırın

-- Mevcut kullanıcıların e-posta doğrulama durumunu güncelle
UPDATE auth.users 
SET email_confirmed_at = now(), 
    confirmed_at = now()
WHERE email_confirmed_at IS NULL;

-- Belirli bir kullanıcı için (ihtiyaç halinde)
-- UPDATE auth.users 
-- SET email_confirmed_at = now(), 
--     confirmed_at = now()
-- WHERE email = 'kullanici@email.com';

-- Tüm kullanıcıları listele ve durumlarını kontrol et
SELECT 
    id,
    email,
    email_confirmed_at,
    confirmed_at,
    created_at
FROM auth.users
ORDER BY created_at DESC;
