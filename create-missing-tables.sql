-- Eksik tabloları oluştur (Kısa versiyon)

-- 1. Automation Jobs tablosu
CREATE TABLE IF NOT EXISTS automation_jobs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
  job_name VARCHAR(255) NOT NULL,
  api_type VARCHAR(50) NOT NULL, -- settlements, otherfinancials
  transaction_types TEXT[], -- Array of transaction types
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, running, completed, failed
  total_periods INTEGER DEFAULT 0,
  completed_periods INTEGER DEFAULT 0,
  total_records INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Settlements tablosu (basit versiyon)
CREATE TABLE IF NOT EXISTS settlements (
  id SERIAL PRIMARY KEY,
  store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
  transaction_id VARCHAR(255) UNIQUE NOT NULL,
  transaction_date TIMESTAMPTZ NOT NULL,
  transaction_type VARCHAR(50) NOT NULL,
  debt DECIMAL(12,2) DEFAULT 0,
  credit DECIMAL(12,2) DEFAULT 0,
  seller_revenue DECIMAL(12,2),
  commission_amount DECIMAL(12,2),
  order_number VARCHAR(255),
  seller_id BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Other Financials tablosu (basit versiyon)
CREATE TABLE IF NOT EXISTS other_financials (
  id SERIAL PRIMARY KEY,
  store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
  transaction_id VARCHAR(255) UNIQUE NOT NULL,
  transaction_date TIMESTAMPTZ NOT NULL,
  transaction_type VARCHAR(50) NOT NULL,
  debt DECIMAL(12,2) DEFAULT 0,
  credit DECIMAL(12,2) DEFAULT 0,
  seller_revenue DECIMAL(12,2),
  commission_amount DECIMAL(12,2),
  seller_id BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index'ler ekle
CREATE INDEX IF NOT EXISTS idx_settlements_store_id ON settlements(store_id);
CREATE INDEX IF NOT EXISTS idx_settlements_transaction_date ON settlements(transaction_date);
CREATE INDEX IF NOT EXISTS idx_settlements_transaction_type ON settlements(transaction_type);

CREATE INDEX IF NOT EXISTS idx_other_financials_store_id ON other_financials(store_id);
CREATE INDEX IF NOT EXISTS idx_other_financials_transaction_date ON other_financials(transaction_date);

CREATE INDEX IF NOT EXISTS idx_automation_jobs_store_id ON automation_jobs(store_id);
CREATE INDEX IF NOT EXISTS idx_automation_jobs_status ON automation_jobs(status);

-- RLS politikaları (basit)
ALTER TABLE automation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE other_financials ENABLE ROW LEVEL SECURITY;

-- Herkese okuma izni ver (geliştirme için)
CREATE POLICY "Allow read access for all users" ON automation_jobs FOR SELECT USING (true);
CREATE POLICY "Allow insert for authenticated users" ON automation_jobs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow read access for all users" ON settlements FOR SELECT USING (true);
CREATE POLICY "Allow insert for authenticated users" ON settlements FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow read access for all users" ON other_financials FOR SELECT USING (true);
CREATE POLICY "Allow insert for authenticated users" ON other_financials FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
