-- Ödemeler tablolarının mevcut durumunu kontrol et
-- Bu SQL kodunu Supabase SQL Editor'de çalıştırın

-- 1. Mevcut tabloları kontrol et
SELECT 
  table_name,
  table_schema
FROM information_schema.tables 
WHERE table_name IN ('settlements', 'other_financials', 'automation_jobs')
AND table_schema = 'public';

-- 2. Settlements tablosu kolonlarını kontrol et
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'settlements'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Other_financials tablosu kolonlarını kontrol et
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'other_financials'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Automation_jobs tablosu kolonlarını kontrol et
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'automation_jobs'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. İndeksleri kontrol et
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes
WHERE tablename IN ('settlements', 'other_financials', 'automation_jobs')
AND schemaname = 'public';

-- 6. RLS politikalarını kontrol et
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('settlements', 'other_financials', 'automation_jobs');
