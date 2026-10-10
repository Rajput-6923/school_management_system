import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { config } from './config.js';
import authRoutes from './routes/auth.js';
import peopleRoutes from './routes/people.js';
import academicRoutes from './routes/academic.js';
import financeRoutes from './routes/finance.js';
import dataRoutes from './routes/data.js';
import userRoutes from './routes/users.js';

export const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || config.clientOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS.'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json({ limit: '8mb' }));
app.use(cookieParser());

app.get('/api/health', async (_req, res, next) => {
  try {
    const { pool } = await import('./db.js');
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    next(error);
  }
});

app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false }));
app.use('/api/auth', authRoutes);
app.use('/api/people', peopleRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/users', userRoutes);

app.use((req, res) => res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` }));
app.use((error, _req, res, _next) => {
  if (res.headersSent) return;
  if (error.code === '23505') return res.status(409).json({ error: 'A record with this identifier already exists.' });
  if (error.code === '23503' || error.code === '23514' || error.code === '23502') {
    return res.status(409).json({ error: 'The record conflicts with related data or a database constraint.' });
  }
  if (error.status && error.status < 500) return res.status(error.status).json({ error: error.message });
  console.error(error);
  res.status(500).json({ error: 'An unexpected server error occurred.' });
});
