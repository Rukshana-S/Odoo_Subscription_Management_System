-- 005_create_subscriptions.sql
CREATE TABLE IF NOT EXISTS subscriptions (
  id VARCHAR(64) PRIMARY KEY,
  customer_id VARCHAR(64) NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  plan_id VARCHAR(64) REFERENCES plans(id) ON DELETE SET NULL,
  product_id VARCHAR(64) REFERENCES products(id) ON DELETE SET NULL,
  plan_name VARCHAR(150),
  customer_name VARCHAR(150),
  status VARCHAR(32) NOT NULL DEFAULT 'Active' CHECK (status IN ('Draft', 'Active', 'Paused', 'Cancelled', 'Expired')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  next_billing_date DATE NOT NULL,
  billing_interval VARCHAR(32) NOT NULL DEFAULT 'Monthly',
  quantity INT NOT NULL DEFAULT 1,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 18.00,
  history JSONB DEFAULT '[]'::jsonb,
  converted_from_quotation_id VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_customer ON subscriptions (customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions (status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing ON subscriptions (next_billing_date);

