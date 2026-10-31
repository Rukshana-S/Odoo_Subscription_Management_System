-- 007_create_invoices.sql
CREATE TABLE IF NOT EXISTS invoices (
  id VARCHAR(64) PRIMARY KEY,
  invoice_number VARCHAR(64) UNIQUE NOT NULL,
  customer_id VARCHAR(64) NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  subscription_id VARCHAR(64) REFERENCES subscriptions(id) ON DELETE SET NULL,
  customer_name VARCHAR(150),
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  discount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  taxable NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  gst_rate NUMERIC(5, 2) NOT NULL DEFAULT 18.00,
  gst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'Unpaid' CHECK (status IN ('Draft', 'Unpaid', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices (customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription ON invoices (subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices (invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices (status);

