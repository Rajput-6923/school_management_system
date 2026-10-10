import dotenv from 'dotenv';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const serverEnvPath = fileURLToPath(new URL('../.env', import.meta.url));
const rootEnvPath = path.resolve(process.cwd(), '.env');
const envPath = existsSync(serverEnvPath) ? serverEnvPath : rootEnvPath;

if (existsSync(envPath)) dotenv.config({ path: envPath });

export const config = {
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  isProduction: process.env.NODE_ENV === 'production',
};

export function getJwtSecret() {
  if (!config.jwtSecret || config.jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters.');
  }
  return config.jwtSecret;
}
