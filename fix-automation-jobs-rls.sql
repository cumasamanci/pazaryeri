-- Automation Jobs tablosu için RLS politikası kontrol ve düzeltme

-- 1. Mevcut RLS durumunu kontrol et
SELECT schemaname, tablename, rowsecurity, hasrlspolicy 
FROM pg_tables t
LEFT JOIN pg_class c ON c.relname = t.tablename
LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE t.tablename = 'automation_jobs';

-- 2. Mevcut politikaları listele
SELECT * FROM pg_policies WHERE tablename = 'automation_jobs';

-- 3. RLS'yi geçici olarak devre dışı bırak (test için)
ALTER TABLE automation_jobs DISABLE ROW LEVEL SECURITY;

-- 4. Veya uygun politika oluştur
DROP POLICY IF EXISTS "Users can insert their own automation jobs" ON automation_jobs;
DROP POLICY IF EXISTS "Users can view their own automation jobs" ON automation_jobs;
DROP POLICY IF EXISTS "Users can update their own automation jobs" ON automation_jobs;

-- Kullanıcılar kendi automation job'larını ekleyebilir
CREATE POLICY "Users can insert their own automation jobs" 
ON automation_jobs FOR INSERT 
WITH CHECK (auth.uid() = user_id::uuid);

-- Kullanıcılar kendi automation job'larını görebilir
CREATE POLICY "Users can view their own automation jobs" 
ON automation_jobs FOR SELECT 
USING (auth.uid() = user_id::uuid);

-- Kullanıcılar kendi automation job'larını güncelleyebilir
CREATE POLICY "Users can update their own automation jobs" 
ON automation_jobs FOR UPDATE 
USING (auth.uid() = user_id::uuid);

-- RLS'yi tekrar aktif et
ALTER TABLE automation_jobs ENABLE ROW LEVEL SECURITY;
