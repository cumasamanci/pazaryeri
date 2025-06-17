-- Ödemeler sistemi için gerekli tabloları oluştur
-- Bu SQL kodunu Supabase SQL Editor'de çalıştırın

-- 1. Settlements tablosu (Satış, İade, İndirim, Kupon, Provizyon işlemleri)
CREATE TABLE IF NOT EXISTS settlements (
  id SERIAL PRIMARY KEY,
  store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
  transaction_id VARCHAR(255) UNIQUE NOT NULL,
  transaction_date TIMESTAMPTZ NOT NULL,
  barcode VARCHAR(255),
  transaction_type VARCHAR(50) NOT NULL, -- Sale, Return, Discount, etc.
  receipt_id BIGINT,
  description TEXT,
  debt DECIMAL(12,2) DEFAULT 0,
  credit DECIMAL(12,2) DEFAULT 0,
  payment_period INTEGER,
  commission_rate DECIMAL(5,2),
  commission_amount DECIMAL(12,2),
  commission_invoice_serial_number VARCHAR(255),
  seller_revenue DECIMAL(12,2),
  order_number VARCHAR(255),
  payment_order_id BIGINT,
  payment_date TIMESTAMPTZ,
  seller_id BIGINT NOT NULL,
  store_name VARCHAR(255),
  store_address TEXT,
  country VARCHAR(100) DEFAULT 'Türkiye',
  order_date TIMESTAMPTZ,
  affiliate VARCHAR(50),
  shipment_package_id BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Other Financials tablosu (Diğer finansal işlemler)
CREATE TABLE IF NOT EXISTS other_financials (
  id SERIAL PRIMARY KEY,
  store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
  transaction_id VARCHAR(255) UNIQUE NOT NULL,
  transaction_date TIMESTAMPTZ NOT NULL,
  barcode VARCHAR(255),
  transaction_type VARCHAR(50) NOT NULL, -- Stoppage, CashAdvance, WireTransfer, etc.
  receipt_id BIGINT,
  description TEXT,
  debt DECIMAL(12,2) DEFAULT 0,
  credit DECIMAL(12,2) DEFAULT 0,
  payment_period INTEGER,
  commission_rate DECIMAL(5,2),
  commission_amount DECIMAL(12,2),
  commission_invoice_serial_number VARCHAR(255),
  seller_revenue DECIMAL(12,2),
  order_number VARCHAR(255),
  payment_order_id BIGINT,
  payment_date TIMESTAMPTZ,
  seller_id BIGINT NOT NULL,
  store_name VARCHAR(255),
  store_address TEXT,
  country VARCHAR(100) DEFAULT 'Türkiye',
  order_date TIMESTAMPTZ,
  affiliate VARCHAR(50),
  shipment_package_id BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Automation Jobs tablosu (Otomasyon işlerini takip etmek için)
CREATE TABLE IF NOT EXISTS automation_jobs (
  id SERIAL PRIMARY KEY,
  store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  job_name VARCHAR(255) NOT NULL,
  api_type VARCHAR(50) NOT NULL, -- 'settlements' or 'otherfinancials'
  transaction_types TEXT[] NOT NULL, -- Seçilen işlem tipleri
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, running, completed, failed
  total_periods INTEGER DEFAULT 0, -- Kaç dönem işlenecek
  completed_periods INTEGER DEFAULT 0, -- Kaç dönem tamamlandı
  total_records INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. İndeksler oluştur
CREATE INDEX IF NOT EXISTS idx_settlements_store_id ON settlements(store_id);
CREATE INDEX IF NOT EXISTS idx_settlements_transaction_date ON settlements(transaction_date);
CREATE INDEX IF NOT EXISTS idx_settlements_transaction_type ON settlements(transaction_type);
CREATE INDEX IF NOT EXISTS idx_settlements_seller_id ON settlements(seller_id);
CREATE INDEX IF NOT EXISTS idx_settlements_payment_date ON settlements(payment_date);

CREATE INDEX IF NOT EXISTS idx_other_financials_store_id ON other_financials(store_id);
CREATE INDEX IF NOT EXISTS idx_other_financials_transaction_date ON other_financials(transaction_date);
CREATE INDEX IF NOT EXISTS idx_other_financials_transaction_type ON other_financials(transaction_type);
CREATE INDEX IF NOT EXISTS idx_other_financials_seller_id ON other_financials(seller_id);

CREATE INDEX IF NOT EXISTS idx_automation_jobs_store_id ON automation_jobs(store_id);
CREATE INDEX IF NOT EXISTS idx_automation_jobs_status ON automation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_automation_jobs_user_id ON automation_jobs(user_id);

-- 5. RLS (Row Level Security) politikaları
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE other_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_jobs ENABLE ROW LEVEL SECURITY;

-- Settlements politikaları
CREATE POLICY "Users can view own settlements" ON settlements
  FOR SELECT USING (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own settlements" ON settlements
  FOR INSERT WITH CHECK (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update own settlements" ON settlements
  FOR UPDATE USING (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete own settlements" ON settlements
  FOR DELETE USING (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
  );

-- Other Financials politikaları
CREATE POLICY "Users can view own other_financials" ON other_financials
  FOR SELECT USING (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own other_financials" ON other_financials
  FOR INSERT WITH CHECK (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update own other_financials" ON other_financials
  FOR UPDATE USING (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete own other_financials" ON other_financials
  FOR DELETE USING (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
  );

-- Automation Jobs politikaları
CREATE POLICY "Users can view own automation_jobs" ON automation_jobs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own automation_jobs" ON automation_jobs
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own automation_jobs" ON automation_jobs
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own automation_jobs" ON automation_jobs
  FOR DELETE USING (user_id = auth.uid());

-- Kontrol sorguları
SELECT 'settlements' as table_name, count(*) as record_count FROM settlements
UNION ALL
SELECT 'other_financials' as table_name, count(*) as record_count FROM other_financials
UNION ALL
SELECT 'automation_jobs' as table_name, count(*) as record_count FROM automation_jobs;
