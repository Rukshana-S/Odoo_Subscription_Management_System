-- 008_create_payments.sql
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(64) PRIMARY KEY,
  receipt_number VARCHAR(64) UNIQUE NOT NULL,
  invoice_id VARCHAR(64) NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  invoice_number VARCHAR(64),
  customer_id VARCHAR(64) NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  customer_name VARCHAR(150),
  payment_method VARCHAR(32) NOT NULL DEFAULT 'UPI' CHECK (payment_method IN ('UPI', 'Bank Transfer', 'Credit Card', 'Net Banking', 'Cash', 'Card')),
  amount NUMERIC(12, 2) NOT NULL,
  transaction_reference VARCHAR(128) UNIQUE NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(32) NOT NULL DEFAULT 'Success' CHECK (status IN ('Success', 'Pending', 'Failed', 'Refunded')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments (invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments (customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments (transaction_reference);

