-- 006_create_quotations.sql
CREATE TABLE IF NOT EXISTS quotations (
  id VARCHAR(64) PRIMARY KEY,
  quotation_number VARCHAR(64) UNIQUE NOT NULL,
  customer_id VARCHAR(64) NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  customer_name VARCHAR(150),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  discount_code VARCHAR(64),
  discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  taxable NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  gst_rate NUMERIC(5, 2) NOT NULL DEFAULT 18.00,
  gst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  status VARCHAR(32) NOT NULL DEFAULT 'Sent' CHECK (status IN ('Draft', 'Sent', 'Approved', 'Rejected', 'Converted')),
  valid_until DATE NOT NULL,
  converted_subscription_id VARCHAR(64),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotations_customer ON quotations (customer_id);
CREATE INDEX IF NOT EXISTS idx_quotations_number ON quotations (quotation_number);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations (status);

