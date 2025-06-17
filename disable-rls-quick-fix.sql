-- Automation Jobs tablosu için hızlı RLS düzeltmesi

-- RLS'yi devre dışı bırak (geçici çözüm)
ALTER TABLE automation_jobs DISABLE ROW LEVEL SECURITY;

-- Tabloyu kontrol et
SELECT * FROM automation_jobs LIMIT 5;
