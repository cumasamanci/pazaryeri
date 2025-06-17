# Netlify'da Supabase Entegrasyonu

Netlify'da aşağıdaki environment değişkenlerini ayarlamanız gerekmektedir:

```
SUPABASE_URL=https://kbbpoywbqrmucjrrefcq.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiYnBveXdicXJtdWNqcnJlZmNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNTUzNDMsImV4cCI6MjA2NTYzMTM0M30.fN9-h7ouV6YJir_hAEauGA97tLH3m78svw86ET4OGZE
NEXT_PUBLIC_SUPABASE_URL=https://kbbpoywbqrmucjrrefcq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiYnBveXdicXJtdWNqcnJlZmNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNTUzNDMsImV4cCI6MjA2NTYzMTM0M30.fN9-h7ouV6YJir_hAEauGA97tLH3m78svw86ET4OGZE
TRENDYOL_API_KEY=jwGpoSyOH28Sw2C1Vxai
TRENDYOL_API_SECRET=2EYQl5jRAlVLRV4ydqoY
```

## Netlify Setup Adımları:

1. Netlify hesabınızda oturum açın veya kaydolun: https://app.netlify.com/
2. "New site from Git" butonuna tıklayın
3. GitHub hesabınızı seçin ve "pazaryeri" repository'sini seçin
4. Build komutunu `npm run build` olarak ayarlayın
5. Publish directory'yi `public` olarak ayarlayın
6. "Advanced build settings" bölümünden yukarıdaki çevre değişkenlerini ekleyin
7. "Deploy site" butonuna tıklayın

## Netlify Functions Kontrol

Netlify Functions çalışır durumda ve API endpoint'inizi şu adreste kullanabilirsiniz:
```
https://[your-site-name].netlify.app/.netlify/functions/api
```

## Supabase Tabloları:

Supabase'de aşağıdaki tabloları oluşturun:

1. **stores**:
   - id (uuid, primary key)
   - name (text)
   - seller_id (text)
   - api_key (text)
   - api_secret (text)
   - active (boolean)
   - created_at (timestamp with time zone)
   - updated_at (timestamp with time zone)

2. **users** (Auth tarafından otomatik oluşturulur)

3. **settlements**:
   - id (uuid, primary key)
   - store_id (uuid, foreign key -> stores.id)
   - transaction_id (text)
   - transaction_date (timestamp with time zone)
   - amount (numeric)
   - commission (numeric)
   - created_at (timestamp with time zone)

4. **payments**:
   - id (uuid, primary key)
   - store_id (uuid, foreign key -> stores.id)
   - payment_id (text)
   - payment_date (timestamp with time zone)
   - amount (numeric)
   - status (text)
   - created_at (timestamp with time zone)

Bu tabloları Supabase arayüzünden "Table Editor" bölümünden kolayca oluşturabilirsiniz.
