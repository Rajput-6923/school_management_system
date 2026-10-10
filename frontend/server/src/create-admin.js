import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { pool } from './db.js';

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const fullName = process.env.ADMIN_NAME?.trim() || 'School Administrator';

try {
  if (!email || !password || password.length < 12) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 12 characters) in .env before creating the administrator.');
  }
  const hash = await bcrypt.hash(password, 12);
  await pool.query(
    'INSERT INTO users (id,email,password_hash,full_name,role) VALUES ($1,$2,$3,$4,$5)',
    [randomUUID(), email, hash, fullName, 'Admin']
  );
  console.log(`Administrator ${email} created. Remove ADMIN_PASSWORD from .env after use.`);
} catch (error) {
  console.error(`Could not create administrator: ${error.message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
