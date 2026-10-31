-- 002_create_customers.sql
CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  customer_code VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(32) NOT NULL,
  company_name VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100) DEFAULT 'Tamil Nadu',
  pincode VARCHAR(16),
  status VARCHAR(32) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers (user_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers (email);
CREATE INDEX IF NOT EXISTS idx_customers_code ON customers (customer_code);

