import pkg from 'pg';
const { Pool } = pkg;
import { dbConfig } from '../config/database.js';

let pool;

export const getPool = () => {
  if (!pool) {
    if (dbConfig.connectionString) {
      pool = new Pool({
        connectionString: dbConfig.connectionString,
        max: dbConfig.max,
        idleTimeoutMillis: dbConfig.idleTimeoutMillis,
        connectionTimeoutMillis: dbConfig.connectionTimeoutMillis,
        ssl: dbConfig.ssl
      });
    } else {
      pool = new Pool({
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        password: dbConfig.password,
        database: dbConfig.database,
        max: dbConfig.max,
        idleTimeoutMillis: dbConfig.idleTimeoutMillis,
        connectionTimeoutMillis: dbConfig.connectionTimeoutMillis,
        ssl: dbConfig.ssl
      });
    }

    pool.on('error', (err) => {
      console.error('[POSTGRESQL POOL ERROR]: Unexpected idle client error:', err.message);
    });
  }
  return pool;
};

/**
 * Execute a parameterized SQL query safely
 * @param {string} text - SQL Query text with $1, $2 placeholders
 * @param {Array} params - Parameter array
 */
export const query = async (text, params) => {
  const start = Date.now();
  const currentPool = getPool();
  try {
    const res = await currentPool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development' && process.env.DEBUG_SQL === 'true') {
      console.log(`[SQL EXEC] executed query in ${duration}ms, rows: ${res.rowCount}`);
    }
    return res;
  } catch (error) {
    console.error(`[SQL ERROR]: Query execution failed:`, error.message);
    throw error;
  }
};

/**
 * Helper to obtain a client for multi-statement ACID transactions
 */
export const getClient = async () => {
  const currentPool = getPool();
  return await currentPool.connect();
};

/**
 * Graceful database shutdown handler
 */
export const closePool = async () => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};

