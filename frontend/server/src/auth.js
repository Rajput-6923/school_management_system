import jwt from 'jsonwebtoken';
import { pool } from './db.js';
import { getJwtSecret } from './config.js';

export const SESSION_COOKIE = 'eduflow_session';

export function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 8 * 60 * 60 * 1000,
  };
}

export function requireAuth(req, res, next) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return res.status(401).json({ error: 'Authentication required.' });
  try {
    const claims = jwt.verify(token, getJwtSecret());
    pool.query('SELECT id, email, full_name, role, teacher_id, student_id, is_active FROM users WHERE id = $1', [claims.sub])
      .then(({ rows }) => {
        const user = rows[0];
        if (!user || !user.is_active) return res.status(401).json({ error: 'Session is no longer valid.' });
        req.user = { id: user.id, email: user.email, fullName: user.full_name, role: user.role,
          teacherId: user.teacher_id, studentId: user.student_id };
        next();
      })
      .catch(next);
  } catch {
    return res.status(401).json({ error: 'Session is invalid or expired.' });
  }
}

export function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Your account does not have permission to perform this action.' });
    }
    next();
  };
}
