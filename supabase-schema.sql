-- Supabase Database Schema for Pazaryeri Entegrasyon
-- Bu dosyayı Supabase Dashboard'da SQL Editor'de çalıştırın

-- 1. Profiles tablosu (Kullanıcı profilleri)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  full_name VARCHAR(255),
  company_name VARCHAR(255),
  phone VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Stores tablosu (Mağazalar)
CREATE TABLE IF NOT EXISTS stores (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  seller_id VARCHAR(255) UNIQUE NOT NULL,
  api_key VARCHAR(500) NOT NULL,
  api_secret VARCHAR(500),
  marketplace VARCHAR(50) DEFAULT 'trendyol',
  active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Orders tablosu (Siparişler)
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
  order_id VARCHAR(255) NOT NULL,
  marketplace_order_id VARCHAR(255),
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  total_amount DECIMAL(10,2),
  commission_amount DECIMAL(10,2),
  net_amount DECIMAL(10,2),
  order_status VARCHAR(50),
  order_date TIMESTAMPTZ,
  shipping_date TIMESTAMPTZ,
  delivery_date TIMESTAMPTZ,
  marketplace_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Payments tablosu (Ödemeler)
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
  payment_id VARCHAR(255) NOT NULL,
  settlement_id VARCHAR(255),
  amount DECIMAL(10,2) NOT NULL,
  commission_amount DECIMAL(10,2),
  net_amount DECIMAL(10,2),
  payment_type VARCHAR(50),
  payment_status VARCHAR(50),
  payment_date TIMESTAMPTZ,
  settlement_date TIMESTAMPTZ,
  marketplace_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Settlements tablosu (Uzlaştırmalar)
CREATE TABLE IF NOT EXISTS settlements (
  id SERIAL PRIMARY KEY,
  store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
  settlement_id VARCHAR(255) NOT NULL,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  total_amount DECIMAL(10,2),
  commission_amount DECIMAL(10,2),
  net_amount DECIMAL(10,2),
  settlement_status VARCHAR(50),
  settlement_date TIMESTAMPTZ,
  marketplace_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Reconciliations tablosu (Mutabakatlar)
CREATE TABLE IF NOT EXISTS reconciliations (
  id SERIAL PRIMARY KEY,
  store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
  reconciliation_date DATE NOT NULL,
  marketplace_total DECIMAL(10,2),
  accounting_total DECIMAL(10,2),
  difference_amount DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Reports tablosu (Raporlar)
CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
  report_type VARCHAR(100) NOT NULL,
  report_name VARCHAR(255) NOT NULL,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  report_data JSONB DEFAULT '{}',
  file_path VARCHAR(500),
  status VARCHAR(50) DEFAULT 'generated',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Automation Jobs tablosu (Otomasyon İşleri)
CREATE TABLE IF NOT EXISTS automation_jobs (
  id SERIAL PRIMARY KEY,
  store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
  job_type VARCHAR(100) NOT NULL,
  job_name VARCHAR(255) NOT NULL,
  schedule_cron VARCHAR(100),
  last_run TIMESTAMPTZ,
  next_run TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'active',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Fetch Logs tablosu (API Çekme Logları)
CREATE TABLE IF NOT EXISTS fetch_logs (
  id SERIAL PRIMARY KEY,
  store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
  fetch_type VARCHAR(100) NOT NULL,
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'running',
  records_fetched INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Finance Models tablosu (Mali Modeller)
CREATE TABLE IF NOT EXISTS finance_models (
  id SERIAL PRIMARY KEY,
  store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
  model_name VARCHAR(255) NOT NULL,
  model_type VARCHAR(100) NOT NULL,
  formula JSONB DEFAULT '{}',
  parameters JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_stores_user_id ON stores(user_id);
CREATE INDEX IF NOT EXISTS idx_stores_seller_id ON stores(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_payments_store_id ON payments(store_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_settlements_store_id ON settlements(store_id);
CREATE INDEX IF NOT EXISTS idx_reconciliations_store_id ON reconciliations(store_id);
CREATE INDEX IF NOT EXISTS idx_reports_store_id ON reports(store_id);
CREATE INDEX IF NOT EXISTS idx_automation_jobs_store_id ON automation_jobs(store_id);
CREATE INDEX IF NOT EXISTS idx_fetch_logs_store_id ON fetch_logs(store_id);
CREATE INDEX IF NOT EXISTS idx_finance_models_store_id ON finance_models(store_id);

-- RLS (Row Level Security) Politikaları
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fetch_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_models ENABLE ROW LEVEL SECURITY;

-- RLS Politika Tanımları
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own stores" ON stores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own stores" ON stores FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view orders from their stores" ON orders FOR SELECT USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = orders.store_id AND stores.user_id = auth.uid()));
CREATE POLICY "Users can manage orders from their stores" ON orders FOR ALL USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = orders.store_id AND stores.user_id = auth.uid()));

-- Diğer tablolar için benzer politikalar...
CREATE POLICY "Users can access their store payments" ON payments FOR ALL USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = payments.store_id AND stores.user_id = auth.uid()));
CREATE POLICY "Users can access their store settlements" ON settlements FOR ALL USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = settlements.store_id AND stores.user_id = auth.uid()));
CREATE POLICY "Users can access their store reconciliations" ON reconciliations FOR ALL USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = reconciliations.store_id AND stores.user_id = auth.uid()));
CREATE POLICY "Users can access their store reports" ON reports FOR ALL USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = reports.store_id AND stores.user_id = auth.uid()));
CREATE POLICY "Users can access their store automation jobs" ON automation_jobs FOR ALL USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = automation_jobs.store_id AND stores.user_id = auth.uid()));
CREATE POLICY "Users can access their store fetch logs" ON fetch_logs FOR ALL USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = fetch_logs.store_id AND stores.user_id = auth.uid()));
CREATE POLICY "Users can access their store finance models" ON finance_models FOR ALL USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = finance_models.store_id AND stores.user_id = auth.uid()));

-- Örnek test verisi (opsiyonel)
-- INSERT INTO stores (user_id, name, seller_id, api_key) 
-- VALUES (auth.uid(), 'Test Mağazası', 'test123', 'test-api-key') 
-- WHERE auth.uid() IS NOT NULL;
