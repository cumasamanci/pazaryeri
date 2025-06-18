-- Settlement Transactions tablosuna eksik kolonları ekle
-- Bu script'i Supabase SQL Editor'da çalıştırın

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
        ALTER TABLE settlement_transactions ADD COLUMN total_price NUMERIC(12,2) DEFAULT 0;
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
    
    -- Updated_at kolonu ekle (yoksa)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'settlement_transactions' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE settlement_transactions ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Updated_at kolonu eklendi';
    ELSE
        RAISE NOTICE 'Updated_at kolonu zaten mevcut';
    END IF;
    
END $$;

-- Güncellenmiş tablo şemasını kontrol et
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'settlement_transactions' 
ORDER BY ordinal_position;
