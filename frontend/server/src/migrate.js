import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { pool } from './db.js';

try {
  const migrationPath = new URL('../migrations/001_initial_schema.sql', import.meta.url);
  const sql = await readFile(fileURLToPath(migrationPath), 'utf8');
  await pool.query(sql);
  console.log('Database migration applied successfully.');
} catch (error) {
  console.error(`Database migration failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
