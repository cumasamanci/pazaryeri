-- Mevcut tabloları ve kolonları kontrol et
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('stores', 'settlements', 'automation_jobs', 'other_financials')
ORDER BY table_name, ordinal_position;
