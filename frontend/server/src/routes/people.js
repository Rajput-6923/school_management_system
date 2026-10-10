import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireRoles } from '../auth.js';
import { classSchema, parseBody, studentSchema, subjectSchema, teacherSchema } from '../schemas.js';

const router = Router();
router.use(requireAuth);

const studentSelect = `SELECT s.id, s.admission_no AS "admissionNo", s.roll_no AS "rollNo", s.first_name AS "firstName", s.last_name AS "lastName",
 s.gender, to_char(s.dob, 'YYYY-MM-DD') AS dob, s.class_id AS "classId", c.name AS "className", c.section,
 to_char(s.enrollment_date, 'YYYY-MM-DD') AS "enrollmentDate", s.status, s.blood_group AS "bloodGroup", s.email, s.phone,
 s.address, s.guardian_name AS "guardianName", s.guardian_relation AS "guardianRelation", s.guardian_phone AS "guardianPhone",
 s.guardian_email AS "guardianEmail", s.avatar_url AS "avatarUrl"
 FROM students s JOIN school_classes c ON c.id = s.class_id`;
const teacherSelect = `SELECT id, employee_id AS "employeeId", first_name AS "firstName", last_name AS "lastName", email, phone, gender,
 qualification, department, designation, to_char(joining_date, 'YYYY-MM-DD') AS "joiningDate", address, subjects,
 assigned_class AS "assignedClass", experience_years AS "experienceYears" FROM teachers`;
const classSelect = `SELECT c.id, c.name, c.grade_level AS "gradeLevel", c.section, COALESCE(c.class_teacher_id, '') AS "classTeacherId",
 COALESCE(NULLIF(CONCAT_WS(' ', t.first_name, t.last_name), ''), 'Unassigned') AS "classTeacherName", c.room_number AS "roomNumber",
 c.capacity, (SELECT COUNT(*)::int FROM students s WHERE s.class_id = c.id) AS "enrolledCount",
 (SELECT COUNT(*)::int FROM subjects su WHERE su.grade_level = c.grade_level) AS "subjectsCount"
 FROM school_classes c LEFT JOIN teachers t ON t.id = c.class_teacher_id`;
const subjectSelect = `SELECT s.id, s.code, s.name, s.department, s.grade_level AS "gradeLevel", COALESCE(s.teacher_id, '') AS "teacherId",
 COALESCE(NULLIF(CONCAT_WS(' ', t.first_name, t.last_name), ''), s.teacher_name, 'Unassigned') AS "teacherName",
 s.credits, s.hours_per_week AS "hoursPerWeek", s.subject_type AS type FROM subjects s LEFT JOIN teachers t ON t.id = s.teacher_id`;

router.get('/students', requireRoles('Admin', 'Teacher', 'Bursar'), async (_req, res, next) => {
  try { const { rows } = await pool.query(`${studentSelect} ORDER BY s.last_name, s.first_name`); res.json(rows); }
  catch (error) { next(error); }
});
router.post('/students', requireRoles('Admin'), async (req, res, next) => {
  try {
    const x = parseBody(studentSchema, req.body);
    const { rows } = await pool.query(
      `INSERT INTO students (id, admission_no, roll_no, first_name, last_name, gender, dob, class_id, enrollment_date, status, blood_group, email, phone, address, guardian_name, guardian_relation, guardian_phone, guardian_email, avatar_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING id`,
      [x.id, x.admissionNo, x.rollNo, x.firstName, x.lastName, x.gender, x.dob, x.classId, x.enrollmentDate, x.status, x.bloodGroup || null, x.email || null, x.phone || null, x.address, x.guardianName, x.guardianRelation, x.guardianPhone, x.guardianEmail, x.avatarUrl || null]
    );
    const result = await pool.query(`${studentSelect} WHERE s.id = $1`, [rows[0].id]);
    res.status(201).json(result.rows[0]);
  } catch (error) { next(error); }
});
router.put('/students/:id', requireRoles('Admin'), async (req, res, next) => {
  try {
    const x = parseBody(studentSchema, req.body);
    const { rowCount } = await pool.query(
      `UPDATE students SET admission_no=$2, roll_no=$3, first_name=$4, last_name=$5, gender=$6, dob=$7, class_id=$8, enrollment_date=$9,
       status=$10, blood_group=$11, email=$12, phone=$13, address=$14, guardian_name=$15, guardian_relation=$16, guardian_phone=$17,
       guardian_email=$18, avatar_url=$19 WHERE id=$1`,
      [req.params.id, x.admissionNo, x.rollNo, x.firstName, x.lastName, x.gender, x.dob, x.classId, x.enrollmentDate, x.status, x.bloodGroup || null, x.email || null, x.phone || null, x.address, x.guardianName, x.guardianRelation, x.guardianPhone, x.guardianEmail, x.avatarUrl || null]
    );
    if (!rowCount) return res.status(404).json({ error: 'Student not found.' });
    const result = await pool.query(`${studentSelect} WHERE s.id = $1`, [req.params.id]); res.json(result.rows[0]);
  } catch (error) { next(error); }
});
router.delete('/students/:id', requireRoles('Admin'), async (req, res, next) => {
  try { const { rowCount } = await pool.query('DELETE FROM students WHERE id=$1', [req.params.id]); if (!rowCount) return res.status(404).json({ error: 'Student not found.' }); res.status(204).end(); }
  catch (error) { next(error); }
});

router.get('/teachers', requireRoles('Admin', 'Teacher'), async (_req, res, next) => {
  try { const { rows } = await pool.query(`${teacherSelect} ORDER BY last_name, first_name`); res.json(rows); }
  catch (error) { next(error); }
});
router.post('/teachers', requireRoles('Admin'), async (req, res, next) => {
  try {
    const x = parseBody(teacherSchema, req.body);
    const { rows } = await pool.query(
      `INSERT INTO teachers (id, employee_id, first_name, last_name, email, phone, gender, qualification, department, designation, joining_date, address, subjects, assigned_class, experience_years)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id`,
      [x.id, x.employeeId, x.firstName, x.lastName, x.email, x.phone, x.gender, x.qualification, x.department, x.designation, x.joiningDate, x.address, x.subjects, x.assignedClass || null, x.experienceYears]
    );
    const result = await pool.query(`${teacherSelect} WHERE id=$1`, [rows[0].id]); res.status(201).json(result.rows[0]);
  } catch (error) { next(error); }
});
router.put('/teachers/:id', requireRoles('Admin'), async (req, res, next) => {
  try {
    const x = parseBody(teacherSchema, req.body);
    const { rowCount } = await pool.query(
      `UPDATE teachers SET employee_id=$2, first_name=$3, last_name=$4, email=$5, phone=$6, gender=$7, qualification=$8, department=$9, designation=$10,
       joining_date=$11, address=$12, subjects=$13, assigned_class=$14, experience_years=$15 WHERE id=$1`,
      [req.params.id, x.employeeId, x.firstName, x.lastName, x.email, x.phone, x.gender, x.qualification, x.department, x.designation, x.joiningDate, x.address, x.subjects, x.assignedClass || null, x.experienceYears]
    );
    if (!rowCount) return res.status(404).json({ error: 'Teacher not found.' });
    const result = await pool.query(`${teacherSelect} WHERE id=$1`, [req.params.id]); res.json(result.rows[0]);
  } catch (error) { next(error); }
});
router.delete('/teachers/:id', requireRoles('Admin'), async (req, res, next) => {
  try { const { rowCount } = await pool.query('DELETE FROM teachers WHERE id=$1', [req.params.id]); if (!rowCount) return res.status(404).json({ error: 'Teacher not found.' }); res.status(204).end(); }
  catch (error) { next(error); }
});

router.get('/classes', requireRoles('Admin', 'Teacher', 'Bursar'), async (_req, res, next) => {
  try { const { rows } = await pool.query(`${classSelect} ORDER BY c.grade_level, c.section`); res.json(rows); }
  catch (error) { next(error); }
});
router.post('/classes', requireRoles('Admin'), async (req, res, next) => {
  try {
    const x = parseBody(classSchema, req.body);
    const { rows } = await pool.query(
      'INSERT INTO school_classes (id,name,grade_level,section,class_teacher_id,room_number,capacity) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',
      [x.id, x.name, x.gradeLevel, x.section, x.classTeacherId || null, x.roomNumber, x.capacity]
    );
    const result = await pool.query(`${classSelect} WHERE c.id=$1`, [rows[0].id]); res.status(201).json(result.rows[0]);
  } catch (error) { next(error); }
});
router.put('/classes/:id', requireRoles('Admin'), async (req, res, next) => {
  try {
    const x = parseBody(classSchema, req.body);
    const { rowCount } = await pool.query(
      'UPDATE school_classes SET name=$2,grade_level=$3,section=$4,class_teacher_id=$5,room_number=$6,capacity=$7 WHERE id=$1',
      [req.params.id, x.name, x.gradeLevel, x.section, x.classTeacherId || null, x.roomNumber, x.capacity]
    );
    if (!rowCount) return res.status(404).json({ error: 'Class not found.' });
    const result = await pool.query(`${classSelect} WHERE c.id=$1`, [req.params.id]); res.json(result.rows[0]);
  } catch (error) { next(error); }
});
router.delete('/classes/:id', requireRoles('Admin'), async (req, res, next) => {
  try { const { rowCount } = await pool.query('DELETE FROM school_classes WHERE id=$1', [req.params.id]); if (!rowCount) return res.status(404).json({ error: 'Class not found.' }); res.status(204).end(); }
  catch (error) { next(error); }
});

router.get('/subjects', requireRoles('Admin', 'Teacher'), async (_req, res, next) => {
  try { const { rows } = await pool.query(`${subjectSelect} ORDER BY s.grade_level,s.name`); res.json(rows); }
  catch (error) { next(error); }
});
router.post('/subjects', requireRoles('Admin'), async (req, res, next) => {
  try {
    const x = parseBody(subjectSchema, req.body);
    const { rows } = await pool.query(
      `INSERT INTO subjects (id,code,name,department,grade_level,teacher_id,teacher_name,credits,hours_per_week,subject_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [x.id, x.code, x.name, x.department, x.gradeLevel, x.teacherId || null, x.teacherName, x.credits, x.hoursPerWeek, x.type]
    );
    const result = await pool.query(`${subjectSelect} WHERE s.id=$1`, [rows[0].id]); res.status(201).json(result.rows[0]);
  } catch (error) { next(error); }
});
router.put('/subjects/:id', requireRoles('Admin'), async (req, res, next) => {
  try {
    const x = parseBody(subjectSchema, req.body);
    const { rowCount } = await pool.query(
      `UPDATE subjects SET code=$2,name=$3,department=$4,grade_level=$5,teacher_id=$6,teacher_name=$7,credits=$8,hours_per_week=$9,subject_type=$10 WHERE id=$1`,
      [req.params.id, x.code, x.name, x.department, x.gradeLevel, x.teacherId || null, x.teacherName, x.credits, x.hoursPerWeek, x.type]
    );
    if (!rowCount) return res.status(404).json({ error: 'Subject not found.' });
    const result = await pool.query(`${subjectSelect} WHERE s.id=$1`, [req.params.id]); res.json(result.rows[0]);
  } catch (error) { next(error); }
});
router.delete('/subjects/:id', requireRoles('Admin'), async (req, res, next) => {
  try { const { rowCount } = await pool.query('DELETE FROM subjects WHERE id=$1', [req.params.id]); if (!rowCount) return res.status(404).json({ error: 'Subject not found.' }); res.status(204).end(); }
  catch (error) { next(error); }
});

export default router;
