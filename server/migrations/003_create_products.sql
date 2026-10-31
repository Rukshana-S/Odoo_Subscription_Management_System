-- 003_create_products.sql
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL DEFAULT 'Software',
  price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  gst_rate NUMERIC(5, 2) NOT NULL DEFAULT 18.00,
  billing_interval VARCHAR(32) NOT NULL DEFAULT 'Monthly',
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products (is_active);

