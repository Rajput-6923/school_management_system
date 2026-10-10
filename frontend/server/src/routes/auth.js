import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { getJwtSecret } from '../config.js';
import { requireAuth, SESSION_COOKIE, cookieOptions } from '../auth.js';
import { loginSchema, parseBody } from '../schemas.js';

const router = Router();

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = parseBody(loginSchema, req.body);
    const { rows } = await pool.query(
      'SELECT id, email, password_hash, full_name, role, is_active FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );
    const user = rows[0];
    if (!user || !user.is_active || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    }
    const token = jwt.sign({ sub: user.id }, getJwtSecret(), {
      expiresIn: '8h', issuer: 'eduflow-api', audience: 'eduflow-app',
    });
    await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);
    res.cookie(SESSION_COOKIE, token, cookieOptions());
    res.json({ user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role } });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', (_req, res) => {
  res.clearCookie(SESSION_COOKIE, { ...cookieOptions(), maxAge: undefined });
  res.status(204).end();
});

router.get('/me', requireAuth, (req, res) => res.json({ user: req.user }));

export default router;
