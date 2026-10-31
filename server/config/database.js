import dotenv from 'dotenv';
dotenv.config();

export const dbConfig = {
  connectionString: process.env.NODE_ENV === 'test' 
    ? (process.env.TEST_DATABASE_URL || process.env.DATABASE_URL)
    : process.env.DATABASE_URL,
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD,
  database: process.env.NODE_ENV === 'test' 
    ? (process.env.PGTESTDATABASE || 'brightloop_test_db') 
    : (process.env.PGDATABASE || 'brightloop_db'),
  max: parseInt(process.env.PG_POOL_MAX || '20', 10), // Maximum pool connections
  idleTimeoutMillis: parseInt(process.env.PG_IDLE_TIMEOUT || '30000', 10),
  connectionTimeoutMillis: parseInt(process.env.PG_CONN_TIMEOUT || '5000', 10),
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false
};

