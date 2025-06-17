-- Other Financials tablosunu oluştur
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

-- Index oluştur
CREATE INDEX IF NOT EXISTS idx_other_financials_store_id ON other_financials(store_id);
CREATE INDEX IF NOT EXISTS idx_other_financials_transaction_date ON other_financials(transaction_date);
CREATE INDEX IF NOT EXISTS idx_other_financials_transaction_type ON other_financials(transaction_type);

-- RLS politikası
ALTER TABLE other_financials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access for all users" ON other_financials FOR SELECT USING (true);
CREATE POLICY "Allow insert for authenticated users" ON other_financials FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
