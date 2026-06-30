import fs from 'fs';
import path from 'path';
import pool from './pool';

async function migrate(): Promise<void> {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  try {
    await pool.query(sql);
    console.log('✅ Database migration completed successfully.');
  } catch (err) {
    console.error('❌ Migration failed:', (err as Error).message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
