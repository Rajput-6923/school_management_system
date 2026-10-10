import { Router } from 'express';
import { pool, withTransaction } from '../db.js';
import { requireAuth, requireRoles } from '../auth.js';
import { attendanceSchema, examSchema, parseBody, resultSchema, timetableSchema } from '../schemas.js';

const router = Router();
router.use(requireAuth);

async function getExams(client = pool) {
  const { rows } = await client.query(`SELECT e.id,e.title,e.academic_term AS "academicTerm",to_char(e.start_date,'YYYY-MM-DD') AS "startDate",
    to_char(e.end_date,'YYYY-MM-DD') AS "endDate",e.status,e.description,
    COALESCE((SELECT json_agg(ec.class_id ORDER BY ec.class_id) FROM exam_classes ec WHERE ec.exam_id=e.id),'[]'::json) AS classes
    FROM exams e ORDER BY e.start_date DESC`);
  return rows;
}
async function getAttendance(client = pool) {
  const { rows } = await client.query(`SELECT a.id,to_char(a.attendance_date,'YYYY-MM-DD') AS date,a.class_id AS "classId",a.marked_at AS "markedAt",a.marked_by AS "markedBy",
    COALESCE((SELECT json_agg(json_build_object('studentId',r.student_id,'studentName',r.student_name,'rollNo',r.roll_no,'status',r.status,'remarks',r.remarks) ORDER BY r.roll_no)
      FROM attendance_records r WHERE r.attendance_id=a.id),'[]'::json) AS records
    FROM attendance a ORDER BY a.attendance_date DESC,a.class_id`);
  return rows;
}
async function getTimetable(client = pool) {
  const { rows } = await client.query(`SELECT id,class_id AS "classId",day,period_number AS "periodNumber",to_char(start_time,'HH24:MI') AS "startTime",
    to_char(end_time,'HH24:MI') AS "endTime",subject_name AS "subjectName",subject_code AS "subjectCode",teacher_name AS "teacherName",room_number AS "roomNumber"
    FROM timetable_slots ORDER BY class_id,day,period_number`);
  return rows;
}

router.get('/attendance', requireRoles('Admin', 'Teacher'), async (_req, res, next) => {
  try { res.json(await getAttendance()); } catch (error) { next(error); }
});
router.put('/attendance', requireRoles('Admin', 'Teacher'), async (req, res, next) => {
  try {
    const x = parseBody(attendanceSchema, req.body);
    const studentIds = x.records.map((record) => record.studentId);
    if (new Set(studentIds).size !== studentIds.length) return res.status(400).json({ error: 'Attendance contains duplicate student IDs.' });
    const result = await withTransaction(async (client) => {
      const { rows: students } = await client.query('SELECT id FROM students WHERE class_id=$1 AND id=ANY($2::text[])', [x.classId, studentIds]);
      if (students.length !== studentIds.length) {
        const error = new Error('Every attendance record must belong to a student in the selected class.'); error.status = 400; throw error;
      }
      const markedAt = new Date(x.markedAt);
      const stamp = Number.isNaN(markedAt.getTime()) ? new Date() : markedAt;
      const { rows } = await client.query(
        `INSERT INTO attendance (id,class_id,attendance_date,marked_at,marked_by) VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (class_id,attendance_date) DO UPDATE SET marked_at=EXCLUDED.marked_at,marked_by=EXCLUDED.marked_by RETURNING id`,
        [x.id, x.classId, x.date, stamp, x.markedBy]
      );
      const attendanceId = rows[0].id;
      await client.query('DELETE FROM attendance_records WHERE attendance_id=$1', [attendanceId]);
      for (const record of x.records) {
        await client.query(
          'INSERT INTO attendance_records (attendance_id,student_id,student_name,roll_no,status,remarks) VALUES ($1,$2,$3,$4,$5,$6)',
          [attendanceId, record.studentId, record.studentName, record.rollNo, record.status, record.remarks || null]
        );
      }
      return (await getAttendance(client)).find((item) => item.id === attendanceId);
    });
    res.json(result);
  } catch (error) { next(error); }
});

router.get('/exams', requireRoles('Admin', 'Teacher'), async (_req, res, next) => {
  try { res.json(await getExams()); } catch (error) { next(error); }
});
router.post('/exams', requireRoles('Admin', 'Teacher'), async (req, res, next) => {
  try {
    const x = parseBody(examSchema, req.body);
    const row = await withTransaction(async (client) => {
      const { rows } = await client.query(
        'INSERT INTO exams (id,title,academic_term,start_date,end_date,status,description) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',
        [x.id, x.title, x.academicTerm, x.startDate, x.endDate, x.status, x.description || null]
      );
      for (const classId of x.classes) await client.query('INSERT INTO exam_classes (exam_id,class_id) VALUES ($1,$2)', [rows[0].id, classId]);
      return (await getExams(client)).find((exam) => exam.id === rows[0].id);
    });
    res.status(201).json(row);
  } catch (error) { next(error); }
});
router.put('/exams/:id', requireRoles('Admin', 'Teacher'), async (req, res, next) => {
  try {
    const x = parseBody(examSchema, req.body);
    const result = await withTransaction(async (client) => {
      const { rowCount } = await client.query(
        'UPDATE exams SET title=$2,academic_term=$3,start_date=$4,end_date=$5,status=$6,description=$7 WHERE id=$1',
        [req.params.id, x.title, x.academicTerm, x.startDate, x.endDate, x.status, x.description || null]
      );
      if (!rowCount) return null;
      await client.query('DELETE FROM exam_classes WHERE exam_id=$1', [req.params.id]);
      for (const classId of x.classes) await client.query('INSERT INTO exam_classes (exam_id,class_id) VALUES ($1,$2)', [req.params.id, classId]);
      return (await getExams(client)).find((exam) => exam.id === req.params.id);
    });
    if (!result) return res.status(404).json({ error: 'Exam not found.' });
    res.json(result);
  } catch (error) { next(error); }
});
router.delete('/exams/:id', requireRoles('Admin'), async (req, res, next) => {
  try { const { rowCount } = await pool.query('DELETE FROM exams WHERE id=$1', [req.params.id]); if (!rowCount) return res.status(404).json({ error: 'Exam not found.' }); res.status(204).end(); }
  catch (error) { next(error); }
});

router.get('/results', requireRoles('Admin', 'Teacher'), async (_req, res, next) => {
  try {
    const { rows } = await pool.query(`SELECT id,exam_id AS "examId",student_id AS "studentId",class_id AS "classId",marks,
      total_marks_obtained AS "totalMarksObtained",total_max_marks AS "totalMaxMarks",percentage,gpa,overall_grade AS "overallGrade",
      class_rank AS "classRank",teacher_remarks AS "teacherRemarks" FROM exam_results ORDER BY updated_at DESC`);
    res.json(rows.map((row) => ({ ...row, totalMarksObtained: Number(row.totalMarksObtained), totalMaxMarks: Number(row.totalMaxMarks), percentage: Number(row.percentage), gpa: Number(row.gpa) })));
  } catch (error) { next(error); }
});
router.put('/results', requireRoles('Admin', 'Teacher'), async (req, res, next) => {
  try {
    const x = parseBody(resultSchema, req.body);
    const { rows } = await pool.query(
      `INSERT INTO exam_results (id,exam_id,student_id,class_id,marks,total_marks_obtained,total_max_marks,percentage,gpa,overall_grade,class_rank,teacher_remarks)
       VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (exam_id,student_id) DO UPDATE SET class_id=EXCLUDED.class_id,marks=EXCLUDED.marks,total_marks_obtained=EXCLUDED.total_marks_obtained,
       total_max_marks=EXCLUDED.total_max_marks,percentage=EXCLUDED.percentage,gpa=EXCLUDED.gpa,overall_grade=EXCLUDED.overall_grade,class_rank=EXCLUDED.class_rank,
       teacher_remarks=EXCLUDED.teacher_remarks RETURNING id,exam_id AS "examId",student_id AS "studentId",class_id AS "classId",marks,
       total_marks_obtained AS "totalMarksObtained",total_max_marks AS "totalMaxMarks",percentage,gpa,overall_grade AS "overallGrade",class_rank AS "classRank",teacher_remarks AS "teacherRemarks"`,
      [x.id, x.examId, x.studentId, x.classId, JSON.stringify(x.marks), x.totalMarksObtained, x.totalMaxMarks, x.percentage, x.gpa, x.overallGrade, x.classRank || null, x.teacherRemarks || null]
    );
    const row = rows[0];
    res.json({ ...row, totalMarksObtained: Number(row.totalMarksObtained), totalMaxMarks: Number(row.totalMaxMarks), percentage: Number(row.percentage), gpa: Number(row.gpa) });
  } catch (error) { next(error); }
});

router.get('/timetable', requireRoles('Admin', 'Teacher'), async (_req, res, next) => {
  try { res.json(await getTimetable()); } catch (error) { next(error); }
});
router.post('/timetable', requireRoles('Admin', 'Teacher'), async (req, res, next) => {
  try {
    const x = parseBody(timetableSchema, req.body);
    const { rows } = await pool.query(
      `INSERT INTO timetable_slots (id,class_id,day,period_number,start_time,end_time,subject_name,subject_code,teacher_name,room_number)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [x.id, x.classId, x.day, x.periodNumber, x.startTime, x.endTime, x.subjectName, x.subjectCode, x.teacherName, x.roomNumber]
    );
    res.status(201).json((await getTimetable()).find((slot) => slot.id === rows[0].id));
  } catch (error) { next(error); }
});
router.put('/timetable/:id', requireRoles('Admin', 'Teacher'), async (req, res, next) => {
  try {
    const x = parseBody(timetableSchema, req.body);
    const { rowCount } = await pool.query(
      `UPDATE timetable_slots SET class_id=$2,day=$3,period_number=$4,start_time=$5,end_time=$6,subject_name=$7,subject_code=$8,teacher_name=$9,room_number=$10 WHERE id=$1`,
      [req.params.id, x.classId, x.day, x.periodNumber, x.startTime, x.endTime, x.subjectName, x.subjectCode, x.teacherName, x.roomNumber]
    );
    if (!rowCount) return res.status(404).json({ error: 'Timetable slot not found.' });
    res.json((await getTimetable()).find((slot) => slot.id === req.params.id));
  } catch (error) { next(error); }
});
router.delete('/timetable/:id', requireRoles('Admin', 'Teacher'), async (req, res, next) => {
  try { const { rowCount } = await pool.query('DELETE FROM timetable_slots WHERE id=$1', [req.params.id]); if (!rowCount) return res.status(404).json({ error: 'Timetable slot not found.' }); res.status(204).end(); }
  catch (error) { next(error); }
});

export { getAttendance, getExams, getTimetable };
export default router;
