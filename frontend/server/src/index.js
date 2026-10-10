import { config, getJwtSecret } from './config.js';

let pool;

function startupError(error) {
  if (error.code === 'ECONNREFUSED') return 'PostgreSQL refused the connection. Start PostgreSQL and verify DATABASE_URL host and port.';
  if (error.code === '28P01') return 'PostgreSQL rejected the configured username or password. Check DATABASE_URL in server/.env.';
  if (error.code === '3D000') return 'The PostgreSQL database in DATABASE_URL does not exist. Create it, then rerun npm run db:migrate.';
  if (error.code === 'ENOTFOUND') return 'The PostgreSQL host in DATABASE_URL could not be resolved. Check the configured host.';
  if (error.code === 'ETIMEDOUT') return 'PostgreSQL connection timed out. Check that the configured host and port are reachable.';
  if (error.message?.startsWith('Set DATABASE_URL') || error.message?.startsWith('JWT_SECRET')) return error.message;
  return `PostgreSQL connection failed${error.code ? ` (${error.code})` : ''}. Verify DATABASE_URL format and database permissions.`;
}

try {
  const missingConfig = [];
  if (!config.databaseUrl) missingConfig.push('DATABASE_URL (your PostgreSQL connection URL)');
  if (!config.jwtSecret || config.jwtSecret.length < 32) missingConfig.push('JWT_SECRET (a random secret of at least 32 characters)');
  if (missingConfig.length) {
    throw new Error(`Set ${missingConfig.join(' and ')} in server/.env. Copy server/.env.example to get started.`);
  }
  getJwtSecret();

  const [{ app }, database] = await Promise.all([
    import('./app.js'),
    import('./db.js'),
  ]);
  pool = database.pool;
  await pool.query('SELECT 1');

  const server = app.listen(config.port, () => {
    console.log(`EduFlow API ready at http://localhost:${config.port} (PostgreSQL connected)`);
  });

  async function shutdown() {
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
} catch (error) {
  console.error(`EduFlow API startup failed: ${startupError(error)}`);
  if (pool) await pool.end().catch(() => {});
  process.exitCode = 1;
}
