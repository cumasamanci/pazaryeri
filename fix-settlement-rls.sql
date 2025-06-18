-- Settlement Transactions için RLS'i geçici olarak devre dışı bırak

-- RLS'i kapat
ALTER TABLE settlement_transactions DISABLE ROW LEVEL SECURITY;

-- Tüm kullanıcılar için geçici okuma/yazma izni ver
CREATE POLICY IF NOT EXISTS "temp_allow_all_settlement_transactions" 
ON settlement_transactions 
FOR ALL 
TO authenticated, anon 
USING (true) 
WITH CHECK (true);

-- RLS'i tekrar aç
ALTER TABLE settlement_transactions ENABLE ROW LEVEL SECURITY;
