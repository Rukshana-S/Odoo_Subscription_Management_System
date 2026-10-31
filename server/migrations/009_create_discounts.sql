-- 009_create_discounts.sql
CREATE TABLE IF NOT EXISTS discounts (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(64) UNIQUE NOT NULL,
  description TEXT,
  discount_type VARCHAR(32) NOT NULL DEFAULT 'Percentage' CHECK (discount_type IN ('Percentage', 'Fixed')),
  discount_value NUMERIC(12, 2) NOT NULL,
  max_uses INT NOT NULL DEFAULT 100,
  used_count INT NOT NULL DEFAULT 0,
  valid_until DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discounts_code ON discounts (code);
CREATE INDEX IF NOT EXISTS idx_discounts_active ON discounts (is_active);

