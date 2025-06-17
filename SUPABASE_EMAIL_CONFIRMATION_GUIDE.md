# Supabase Email Confirmation Devre Dışı Bırakma Rehberi

## 1. Supabase Dashboard'a Git
- https://supabase.com/dashboard/project/kbbpoywbqrmucjrrefcq/auth/users adresine git

## 2. Authentication Settings
- Sol menüden "Authentication" > "Settings" seçin
- Veya direkt: https://supabase.com/dashboard/project/kbbpoywbqrmucjrrefcq/auth/settings

## 3. Email Confirmation Ayarları
### Auth Settings bölümünde:
- "Enable email confirmations" seçeneğini KAPATIN (disable)
- "Enable phone confirmations" seçeneğini de KAPATIN (disable)

### Email Templates bölümünde:
- "Confirm signup" template'ini devre dışı bırakın

## 4. Mevcut Kullanıcıları Onayla
SQL Editor'de şu kodu çalıştırın:
```sql
UPDATE auth.users 
SET email_confirmed_at = now(), 
    confirmed_at = now()
WHERE email_confirmed_at IS NULL;
```

## 5. Test Et
- Yeni kullanıcı kayıt edin
- E-posta onayı beklemeden direkt giriş yapabilmeli

## 6. Eğer Hala Sorun Varsa
RLS (Row Level Security) politikalarını kontrol edin:
```sql
-- Users tablosu için politikaları kontrol et
SELECT * FROM pg_policies WHERE tablename = 'users';

-- Gerekirse yeni politika ekle
CREATE POLICY "Allow authenticated users" ON public.users
FOR ALL USING (auth.role() = 'authenticated');
```

## Test URL'leri
- Ana site: https://jpg.com.tr
- Auth test: file:///c:/Users/PC/Desktop/pazaryerideneme/supabase-auth-test.html
- Supabase test: file:///c:/Users/PC/Desktop/pazaryerideneme/supabase-test.html
