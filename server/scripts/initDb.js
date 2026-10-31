import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

async function initDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not set in .env');
    process.exit(1);
  }

  const defaultDbUrl = url.replace(/\/brightloop_db(\?.*)?$/, '/postgres$1');
  const clientDefault = new Client({ connectionString: defaultDbUrl });

  try {
    await clientDefault.connect();
    console.log('[PG VERIFY]: Connected successfully to PostgreSQL server!');

    const res = await clientDefault.query("SELECT 1 FROM pg_database WHERE datname = 'brightloop_db'");
    if (res.rows.length === 0) {
      console.log("[PG VERIFY]: Creating database 'brightloop_db'...");
      await clientDefault.query('CREATE DATABASE brightloop_db');
      console.log("[PG VERIFY]: Database 'brightloop_db' created successfully!");
    } else {
      console.log("[PG VERIFY]: Database 'brightloop_db' already exists.");
    }
    await clientDefault.end();

    const clientApp = new Client({ connectionString: url });
    await clientApp.connect();
    console.log('[PG VERIFY]: Connected successfully to brightloop_db!');
    await clientApp.end();
  } catch (err) {
    console.error('[PG VERIFY ERROR]:', err.message);
    process.exit(1);
  }
}

initDb();

