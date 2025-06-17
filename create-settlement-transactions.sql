-- Transaction detayları için yeni tablo
CREATE TABLE IF NOT EXISTS settlement_transactions (
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
  barcode VARCHAR(255),
  receipt_id BIGINT,
  description TEXT,
  payment_order_id BIGINT,
  payment_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index oluştur
CREATE INDEX IF NOT EXISTS idx_settlement_transactions_store_id ON settlement_transactions(store_id);
CREATE INDEX IF NOT EXISTS idx_settlement_transactions_date ON settlement_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_settlement_transactions_type ON settlement_transactions(transaction_type);

-- RLS politikası
ALTER TABLE settlement_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access for all users" ON settlement_transactions FOR SELECT USING (true);
CREATE POLICY "Allow insert for authenticated users" ON settlement_transactions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
