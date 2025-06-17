-- ADIM 1: Profiles tablosu
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

-- ADIM 2: Stores tablosu  
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

-- ADIM 3: Orders tablosu
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

-- ADIM 4: Payments tablosu
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

-- ADIM 5: Settlements tablosu
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

-- ADIM 6: İndeksler
CREATE INDEX IF NOT EXISTS idx_stores_user_id ON stores(user_id);
CREATE INDEX IF NOT EXISTS idx_stores_seller_id ON stores(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_payments_store_id ON payments(store_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_settlements_store_id ON settlements(store_id);

-- ADIM 7: RLS (Row Level Security) Politikaları
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

-- ADIM 8: Güvenlik Politikaları
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own stores" ON stores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own stores" ON stores FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view orders from their stores" ON orders FOR SELECT USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = orders.store_id AND stores.user_id = auth.uid()));
CREATE POLICY "Users can manage orders from their stores" ON orders FOR ALL USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = orders.store_id AND stores.user_id = auth.uid()));

CREATE POLICY "Users can access their store payments" ON payments FOR ALL USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = payments.store_id AND stores.user_id = auth.uid()));
CREATE POLICY "Users can access their store settlements" ON settlements FOR ALL USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = settlements.store_id AND stores.user_id = auth.uid()));
