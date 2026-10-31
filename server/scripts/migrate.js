import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPool, closePool } from '../db/pool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, '..', 'migrations');

export const runMigrations = async () => {
  const pool = getPool();
  const client = await pool.connect();

  try {
    console.log('[MIGRATIONS] Starting PostgreSQL schema migration...');

    // Create migrations tracking table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const { rows } = await client.query('SELECT 1 FROM schema_migrations WHERE filename = $1', [file]);
      if (rows.length === 0) {
        console.log(`[MIGRATION RUN] Applying: ${file}...`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');

        console.log(`[MIGRATION DONE] Applied: ${file}`);
      } else {
        console.log(`[MIGRATION SKIP] Already executed: ${file}`);
      }
    }

    console.log('[MIGRATIONS] All PostgreSQL schema migrations successfully applied.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[MIGRATION ERROR] Failed executing migration:', err.message);
    throw err;
  } finally {
    client.release();
  }
};

// Direct script execution
if (process.argv[1] && process.argv[1].endsWith('migrate.js')) {
  runMigrations()
    .then(async () => {
      await closePool();
      process.exit(0);
    })
    .catch(async (err) => {
      await closePool();
      process.exit(1);
    });
}

