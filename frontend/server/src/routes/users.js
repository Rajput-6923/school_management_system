import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { pool, withTransaction } from '../db.js';
import { requireAuth, requireRoles } from '../auth.js';
import { parseBody } from '../schemas.js';
import { z } from 'zod';

const router = Router();
const roles = ['Admin', 'Teacher', 'Student', 'Bursar'];
const createSchema = z.object({
  email: z.email().max(254), password: z.string().min(12).max(200), fullName: z.string().trim().min(1).max(200),
  role: z.enum(roles), teacherId: z.string().max(100).nullable().optional(), studentId: z.string().max(100).nullable().optional(),
}).superRefine((user, context) => {
  if (user.role === 'Teacher' && !user.teacherId) context.addIssue({ code: 'custom', path: ['teacherId'], message: 'Teacher accounts must be linked to a teacher record.' });
  if (user.role === 'Student' && !user.studentId) context.addIssue({ code: 'custom', path: ['studentId'], message: 'Student accounts must be linked to a student record.' });
  if (['Admin', 'Bursar'].includes(user.role) && (user.teacherId || user.studentId)) context.addIssue({ code: 'custom', path: ['role'], message: 'Admin and Bursar accounts cannot be linked to a student or teacher.' });
  if (user.teacherId && user.studentId) context.addIssue({ code: 'custom', path: ['teacherId'], message: 'A user may be linked to a teacher or student, not both.' });
});
const updateSchema = z.object({
  email: z.email().max(254).optional(), password: z.string().min(12).max(200).optional(),
  fullName: z.string().trim().min(1).max(200).optional(), role: z.enum(roles).optional(),
  teacherId: z.string().max(100).nullable().optional(), studentId: z.string().max(100).nullable().optional(),
  isActive: z.boolean().optional(),
});
const publicColumns = 'id, email, full_name AS "fullName", role, teacher_id AS "teacherId", student_id AS "studentId", is_active AS "isActive", last_login_at AS "lastLoginAt", created_at AS "createdAt"';

router.use(requireAuth, requireRoles('Admin'));
router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(`SELECT ${publicColumns} FROM users ORDER BY created_at DESC`);
    res.json(rows);
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const input = parseBody(createSchema, req.body);
    if (input.teacherId && input.studentId) return res.status(400).json({ error: 'A user may be linked to a teacher or student, not both.' });
    const hash = await bcrypt.hash(input.password, 12);
    const { rows } = await pool.query(
      `INSERT INTO users (id, email, password_hash, full_name, role, teacher_id, student_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING ${publicColumns}`,
      [randomUUID(), input.email.trim().toLowerCase(), hash, input.fullName, input.role, input.teacherId || null, input.studentId || null]
    );
    res.status(201).json(rows[0]);
  } catch (error) { next(error); }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const input = parseBody(updateSchema, req.body);
    if (input.teacherId && input.studentId) return res.status(400).json({ error: 'A user may be linked to a teacher or student, not both.' });
    if (req.params.id === req.user.id && input.isActive === false) return res.status(400).json({ error: 'You cannot deactivate your own account.' });
    const fields = { email: 'email', fullName: 'full_name', role: 'role', teacherId: 'teacher_id', studentId: 'student_id', isActive: 'is_active' };
    const passwordHash = input.password ? await bcrypt.hash(input.password, 12) : null;
    const updated = await withTransaction(async (client) => {
      await client.query('SELECT id FROM users WHERE role=$1 AND is_active=TRUE ORDER BY id FOR UPDATE', ['Admin']);
      const { rows: currentRows } = await client.query('SELECT role,teacher_id,student_id,is_active FROM users WHERE id=$1 FOR UPDATE', [req.params.id]);
      const current = currentRows[0];
      if (!current) return null;
      const nextRole = input.role || current.role;
      const nextActive = input.isActive ?? current.is_active;
      const nextTeacher = Object.hasOwn(input, 'teacherId') ? input.teacherId : current.teacher_id;
      const nextStudent = Object.hasOwn(input, 'studentId') ? input.studentId : current.student_id;
      if ((nextRole === 'Teacher' && !nextTeacher) || (nextRole === 'Student' && !nextStudent) ||
        (['Admin', 'Bursar'].includes(nextRole) && (nextTeacher || nextStudent)) || (nextTeacher && nextStudent)) {
        const error = new Error('The selected role requires a matching linked record.'); error.status = 400; throw error;
      }
      if (current.role === 'Admin' && current.is_active && (nextRole !== 'Admin' || !nextActive)) {
        const { rows: count } = await client.query('SELECT COUNT(*)::int AS count FROM users WHERE role=$1 AND is_active=TRUE', ['Admin']);
        if (count[0].count <= 1) {
          const error = new Error('The last active administrator cannot be deactivated or reassigned.'); error.status = 409; throw error;
        }
      }
      const assignments = [];
      const values = [];
      for (const [key, column] of Object.entries(fields)) {
        if (Object.hasOwn(input, key)) {
          values.push(key === 'email' ? input[key].trim().toLowerCase() : input[key]);
          assignments.push(`${column}=$${values.length}`);
        }
      }
      if (passwordHash) { values.push(passwordHash); assignments.push(`password_hash=$${values.length}`); }
      if (!assignments.length) return undefined;
      values.push(req.params.id);
      const { rows } = await client.query(`UPDATE users SET ${assignments.join(',')} WHERE id=$${values.length} RETURNING ${publicColumns}`, values);
      return rows[0];
    });
    if (updated === null) return res.status(404).json({ error: 'User not found.' });
    if (!updated) return res.status(400).json({ error: 'No fields to update.' });
    res.json(updated);
  } catch (error) { next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ error: 'You cannot delete your own account.' });
    const deleted = await withTransaction(async (client) => {
      await client.query('SELECT id FROM users WHERE role = $1 AND is_active = TRUE FOR UPDATE', ['Admin']);
      const { rows: target } = await client.query('SELECT role FROM users WHERE id = $1 FOR UPDATE', [req.params.id]);
      if (!target[0]) return false;
      if (target[0].role === 'Admin') {
        const { rows: count } = await client.query('SELECT COUNT(*)::int AS count FROM users WHERE role = $1 AND is_active = TRUE', ['Admin']);
        if (count[0].count <= 1) {
          const error = new Error('The last active administrator cannot be deleted.');
          error.status = 409;
          throw error;
        }
      }
      await client.query('DELETE FROM users WHERE id = $1', [req.params.id]);
      return true;
    });
    if (!deleted) return res.status(404).json({ error: 'User not found.' });
    res.status(204).end();
  } catch (error) { next(error); }
});

export default router;
