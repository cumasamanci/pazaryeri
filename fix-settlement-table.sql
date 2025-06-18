-- Settlement Transactions tablosuna eksik kolonları ekle
-- Bu script'i Supabase SQL Editor'da çalıştırın

-- RLS policy düzeltmesi
DO $$
BEGIN
    -- Önce tabloyu RLS'den muaf tut
    ALTER TABLE settlement_transactions DISABLE ROW LEVEL SECURITY;
    
    -- Mevcut geçici policy varsa sil
    DROP POLICY IF EXISTS "temp_allow_all_settlement_transactions" ON settlement_transactions;
    
    -- Yeni geçici policy oluştur
    CREATE POLICY "temp_allow_all_settlement_transactions" 
    ON settlement_transactions 
    FOR ALL 
    TO authenticated, anon 
    USING (true) 
    WITH CHECK (true);
    
    -- RLS'i tekrar aktifleştir
    ALTER TABLE settlement_transactions ENABLE ROW LEVEL SECURITY;
    
    RAISE NOTICE 'RLS policy düzeltildi';
END $$;

-- Eksik kolonları ekle
DO $$ 
BEGIN
    -- Status kolonu ekle  
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'settlement_transactions' AND column_name = 'status'
    ) THEN
        ALTER TABLE settlement_transactions ADD COLUMN status VARCHAR(50) DEFAULT 'COMPLETED';
        RAISE NOTICE 'Status kolonu eklendi';
    ELSE
        RAISE NOTICE 'Status kolonu zaten mevcut';
    END IF;
    
    -- Total price kolonu ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'settlement_transactions' AND column_name = 'total_price'
    ) THEN
        ALTER TABLE settlement_transactions ADD COLUMN total_price DECIMAL(12,2) DEFAULT 0;
        RAISE NOTICE 'Total_price kolonu eklendi';
    ELSE
        RAISE NOTICE 'Total_price kolonu zaten mevcut';
    END IF;
    
    -- Payment date kolonu ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'settlement_transactions' AND column_name = 'payment_date'
    ) THEN
        ALTER TABLE settlement_transactions ADD COLUMN payment_date TIMESTAMPTZ;
        RAISE NOTICE 'Payment_date kolonu eklendi';
    ELSE
        RAISE NOTICE 'Payment_date kolonu zaten mevcut';
    END IF;
    
END $$;

-- Settlement tablosunun güncel şemasını kontrol et
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'settlement_transactions' 
ORDER BY ordinal_position;
