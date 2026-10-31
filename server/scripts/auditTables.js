import { getPool, closePool } from '../db/pool.js';

async function auditAll14Tables() {
  const pool = getPool();
  try {
    const tableListQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    const { rows } = await pool.query(tableListQuery);
    console.log(`\n======================================================`);
    console.log(`[POSTGRESQL AUDIT] Found ${rows.length} Tables in public schema:`);
    console.log(`======================================================`);

    for (const r of rows) {
      const countRes = await pool.query(`SELECT COUNT(*) as cnt FROM "${r.table_name}"`);
      console.log(`- ${r.table_name.padEnd(30)} : ${countRes.rows[0].cnt.padStart(4)} rows`);
    }
    console.log(`======================================================\n`);
  } catch (err) {
    console.error('Error auditing tables:', err.message);
  } finally {
    await closePool();
  }
}

auditAll14Tables();

