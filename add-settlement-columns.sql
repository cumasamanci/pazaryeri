-- Settlement Transactions tablosuna eksik kolonları ekle

-- Önce mevcut tabloyu kontrol et
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'settlement_transactions' 
ORDER BY ordinal_position;

-- Eksik kolonları ekle (varsa hata vermesin diye IF NOT EXISTS kullanılabilir)
DO $$ 
BEGIN
    -- Currency kolonu ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'settlement_transactions' AND column_name = 'currency'
    ) THEN
        ALTER TABLE settlement_transactions ADD COLUMN currency VARCHAR(5) DEFAULT 'TRY';
    END IF;
    
    -- Status kolonu ekle  
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'settlement_transactions' AND column_name = 'status'
    ) THEN
        ALTER TABLE settlement_transactions ADD COLUMN status VARCHAR(50) DEFAULT 'COMPLETED';
    END IF;
    
    -- Total price kolonu ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'settlement_transactions' AND column_name = 'total_price'
    ) THEN
        ALTER TABLE settlement_transactions ADD COLUMN total_price DECIMAL(12,2) DEFAULT 0;
    END IF;
    
    -- Payment date kolonu ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'settlement_transactions' AND column_name = 'payment_date'
    ) THEN
        ALTER TABLE settlement_transactions ADD COLUMN payment_date TIMESTAMPTZ;
    END IF;

END $$;

-- Güncellenmiş tablo şemasını kontrol et
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'settlement_transactions' 
ORDER BY ordinal_position;
