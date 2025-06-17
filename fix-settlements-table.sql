-- Settlements tablosunu düzelt veya yeniden oluştur

-- Önce mevcut tabloyu sil (eğer varsa)
DROP TABLE IF EXISTS settlements CASCADE;

-- Yeniden oluştur
CREATE TABLE settlements (
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

-- Index oluştur
CREATE INDEX idx_settlements_store_id ON settlements(store_id);
CREATE INDEX idx_settlements_transaction_date ON settlements(transaction_date);
CREATE INDEX idx_settlements_transaction_type ON settlements(transaction_type);

-- RLS politikası
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access for all users" ON settlements FOR SELECT USING (true);
CREATE POLICY "Allow insert for authenticated users" ON settlements FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
