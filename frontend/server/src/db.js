import pg from 'pg';
import { config } from './config.js';

const { Pool } = pg;

if (!config.databaseUrl) {
  throw new Error('DATABASE_URL is missing. Set it in server/.env using server/.env.example.');
}

export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.isProduction ? { rejectUnauthorized: false } : undefined,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

export async function withTransaction(operation) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await operation(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
