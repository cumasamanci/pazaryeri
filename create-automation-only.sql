-- Automation Jobs tablosunu oluştur
CREATE TABLE IF NOT EXISTS automation_jobs (
  id SERIAL PRIMARY KEY,
  user_id UUID,
  store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
  job_name VARCHAR(255) NOT NULL,
  api_type VARCHAR(50) NOT NULL,
  transaction_types TEXT[],
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  total_periods INTEGER DEFAULT 0,
  completed_periods INTEGER DEFAULT 0,
  total_records INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index oluştur
CREATE INDEX IF NOT EXISTS idx_automation_jobs_store_id ON automation_jobs(store_id);
CREATE INDEX IF NOT EXISTS idx_automation_jobs_status ON automation_jobs(status);

-- RLS politikası
ALTER TABLE automation_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access for all users" ON automation_jobs FOR SELECT USING (true);
CREATE POLICY "Allow insert for authenticated users" ON automation_jobs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
