import { getPool, closePool } from '../db/pool.js';

export const checkDbStatus = async () => {
  const pool = getPool();
  try {
    const res = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as table_count,
        NOW() as current_time,
        current_database() as database_name,
        version() as pg_version;
    `);

    console.log('[DB STATUS] PostgreSQL Connection: ACTIVE');
    console.log(`[DB STATUS] Connected Database: ${res.rows[0].database_name}`);
    console.log(`[DB STATUS] Total Tables: ${res.rows[0].table_count}`);
    console.log(`[DB STATUS] PostgreSQL Version: ${res.rows[0].pg_version.split(',')[0]}`);

    // If tables exist, report row counts
    const tables = ['users', 'customers', 'products', 'plans', 'subscriptions', 'quotations', 'invoices', 'payments', 'discounts', 'audit_logs'];
    console.log('\n--- Table Record Counts ---');
    for (const t of tables) {
      try {
        const countRes = await pool.query(`SELECT COUNT(*) FROM ${t}`);
        console.log(`- ${t}: ${countRes.rows[0].count} rows`);
      } catch (e) {
        console.log(`- ${t}: table does not exist yet`);
      }
    }
  } catch (err) {
    console.error('[DB STATUS ERROR]: Could not connect to PostgreSQL:', err.message);
    throw err;
  }
};

if (process.argv[1] && process.argv[1].endsWith('status.js')) {
  checkDbStatus()
    .then(async () => {
      await closePool();
      process.exit(0);
    })
    .catch(async () => {
      await closePool();
      process.exit(1);
    });
}

