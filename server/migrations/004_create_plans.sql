-- 004_create_plans.sql
CREATE TABLE IF NOT EXISTS plans (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(64) UNIQUE NOT NULL,
  description TEXT,
  billing_interval VARCHAR(32) NOT NULL DEFAULT 'Monthly' CHECK (billing_interval IN ('Monthly', 'Quarterly', 'Half-Yearly', 'Yearly', 'Annual')),
  price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  min_quantity INT NOT NULL DEFAULT 1,
  popular BOOLEAN NOT NULL DEFAULT false,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plans_code ON plans (code);
CREATE INDEX IF NOT EXISTS idx_plans_interval ON plans (billing_interval);

