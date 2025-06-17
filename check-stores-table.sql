-- Önce mevcut stores tablosunun yapısını kontrol edelim
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'stores' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Mevcut stores verilerini görelim
SELECT * FROM stores LIMIT 5;
