import { Router } from 'express';
import { z } from 'zod';
import { pool, withTransaction } from '../db.js';
import { requireAuth, requireRoles } from '../auth.js';
import { attendanceSchema, classSchema, examSchema, invoiceSchema, noticeSchema, parseBody, paymentSchema, resultSchema, settingsSchema, studentSchema, subjectSchema, teacherSchema, timetableSchema } from '../schemas.js';
import { getAttendance, getExams, getTimetable } from './academic.js';
import { getInvoices, getNotices, getSettings } from './finance.js';

const router = Router();
router.use(requireAuth);

const snapshotSchema = z.object({
  students: z.array(studentSchema).max(5000).optional(), teachers: z.array(teacherSchema).max(1000).optional(),
  classes: z.array(classSchema).max(1000).optional(), subjects: z.array(subjectSchema).max(2000).optional(),
  attendance: z.array(attendanceSchema).max(20000).optional(), exams: z.array(examSchema).max(1000).optional(),
  results: z.array(resultSchema).max(20000).optional(), invoices: z.array(invoiceSchema).max(20000).optional(),
  timetableSlots: z.array(timetableSchema).max(20000).optional(), notices: z.array(noticeSchema).max(5000).optional(),
  settings: settingsSchema.optional(),
}).passthrough();

async function snapshot(client = pool, user = null) {
  const [students, teachers, classes, subjects, attendance, exams, results, invoices, timetableSlots, notices, settings] = await Promise.all([
    client.query(`SELECT s.id,s.admission_no AS "admissionNo",s.roll_no AS "rollNo",s.first_name AS "firstName",s.last_name AS "lastName",s.gender,to_char(s.dob,'YYYY-MM-DD') AS dob,
      s.class_id AS "classId",c.name AS "className",c.section,to_char(s.enrollment_date,'YYYY-MM-DD') AS "enrollmentDate",s.status,s.blood_group AS "bloodGroup",s.email,s.phone,s.address,
      s.guardian_name AS "guardianName",s.guardian_relation AS "guardianRelation",s.guardian_phone AS "guardianPhone",s.guardian_email AS "guardianEmail",s.avatar_url AS "avatarUrl"
      FROM students s JOIN school_classes c ON c.id=s.class_id ORDER BY s.last_name,s.first_name`),
    client.query(`SELECT id,employee_id AS "employeeId",first_name AS "firstName",last_name AS "lastName",email,phone,gender,qualification,department,designation,
      to_char(joining_date,'YYYY-MM-DD') AS "joiningDate",address,subjects,assigned_class AS "assignedClass",experience_years AS "experienceYears" FROM teachers ORDER BY last_name,first_name`),
    client.query(`SELECT c.id,c.name,c.grade_level AS "gradeLevel",c.section,COALESCE(c.class_teacher_id,'') AS "classTeacherId",COALESCE(NULLIF(CONCAT_WS(' ',t.first_name,t.last_name),''),'Unassigned') AS "classTeacherName",
      c.room_number AS "roomNumber",c.capacity,(SELECT COUNT(*)::int FROM students s WHERE s.class_id=c.id) AS "enrolledCount",
      (SELECT COUNT(*)::int FROM subjects su WHERE su.grade_level=c.grade_level) AS "subjectsCount" FROM school_classes c LEFT JOIN teachers t ON t.id=c.class_teacher_id ORDER BY c.grade_level,c.section`),
    client.query(`SELECT s.id,s.code,s.name,s.department,s.grade_level AS "gradeLevel",COALESCE(s.teacher_id,'') AS "teacherId",COALESCE(NULLIF(CONCAT_WS(' ',t.first_name,t.last_name),''),s.teacher_name,'Unassigned') AS "teacherName",
      s.credits,s.hours_per_week AS "hoursPerWeek",s.subject_type AS type FROM subjects s LEFT JOIN teachers t ON t.id=s.teacher_id ORDER BY s.grade_level,s.name`),
    getAttendance(client), getExams(client),
    client.query(`SELECT id,exam_id AS "examId",student_id AS "studentId",class_id AS "classId",marks,total_marks_obtained AS "totalMarksObtained",total_max_marks AS "totalMaxMarks",percentage,gpa,
      overall_grade AS "overallGrade",class_rank AS "classRank",teacher_remarks AS "teacherRemarks" FROM exam_results ORDER BY updated_at DESC`),
    getInvoices(client), getTimetable(client), getNotices(client), getSettings(client),
  ]);
  const data = {
    students: students.rows, teachers: teachers.rows, classes: classes.rows, subjects: subjects.rows,
    attendance, exams, results: results.rows.map((row) => ({ ...row, totalMarksObtained: Number(row.totalMarksObtained), totalMaxMarks: Number(row.totalMaxMarks), percentage: Number(row.percentage), gpa: Number(row.gpa) })),
    invoices, timetableSlots, notices, settings,
  };
  if (user?.role === 'Student') {
    data.students = data.students.filter((student) => student.id === user.studentId);
    const classIds = new Set(data.students.map((student) => student.classId));
    data.classes = data.classes.filter((schoolClass) => classIds.has(schoolClass.id));
    data.teachers = [];
    data.subjects = data.subjects.filter((subject) => data.classes.some((schoolClass) => schoolClass.gradeLevel === subject.gradeLevel));
    data.attendance = data.attendance.filter((entry) => classIds.has(entry.classId)).map((entry) => ({
      ...entry, records: entry.records.filter((record) => record.studentId === user.studentId),
    }));
    data.exams = data.exams.filter((exam) => exam.classes.some((classId) => classIds.has(classId)));
    data.results = data.results.filter((result) => result.studentId === user.studentId);
    data.invoices = data.invoices.filter((invoice) => invoice.studentId === user.studentId);
    data.timetableSlots = data.timetableSlots.filter((slot) => classIds.has(slot.classId));
  } else if (user?.role === 'Bursar') {
    data.teachers = [];
    data.subjects = [];
    data.attendance = [];
    data.exams = [];
    data.results = [];
    data.timetableSlots = [];
  } else if (user?.role === 'Teacher') {
    data.invoices = [];
  }
  return data;
}

async function hasSchoolRecords(client) {
  const { rows } = await client.query(`SELECT EXISTS (
    SELECT 1 FROM students UNION ALL SELECT 1 FROM teachers UNION ALL SELECT 1 FROM school_classes UNION ALL SELECT 1 FROM subjects
    UNION ALL SELECT 1 FROM attendance UNION ALL SELECT 1 FROM exams UNION ALL SELECT 1 FROM exam_results UNION ALL SELECT 1 FROM fee_invoices
    UNION ALL SELECT 1 FROM timetable_slots UNION ALL SELECT 1 FROM notices
  ) AS present`);
  return rows[0].present;
}

async function importSnapshot(client, rawData) {
  const data = parseBody(snapshotSchema, rawData);
  const counts = {};
  const list = (key) => data[key] || [];
  for (const x of list('teachers')) {
    await client.query(`INSERT INTO teachers (id,employee_id,first_name,last_name,email,phone,gender,qualification,department,designation,joining_date,address,subjects,assigned_class,experience_years)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) ON CONFLICT DO NOTHING`,
      [x.id,x.employeeId,x.firstName,x.lastName,x.email,x.phone,x.gender,x.qualification,x.department,x.designation,x.joiningDate,x.address,x.subjects,x.assignedClass || null,x.experienceYears]);
  }
  counts.teachers = list('teachers').length;
  for (const x of list('classes')) {
    await client.query(`INSERT INTO school_classes (id,name,grade_level,section,class_teacher_id,room_number,capacity) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING`,
      [x.id,x.name,x.gradeLevel,x.section,x.classTeacherId || null,x.roomNumber,x.capacity]);
  }
  counts.classes = list('classes').length;
  for (const x of list('subjects')) {
    await client.query(`INSERT INTO subjects (id,code,name,department,grade_level,teacher_id,teacher_name,credits,hours_per_week,subject_type) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT DO NOTHING`,
      [x.id,x.code,x.name,x.department,x.gradeLevel,x.teacherId || null,x.teacherName,x.credits,x.hoursPerWeek,x.type]);
  }
  counts.subjects = list('subjects').length;
  for (const x of list('students')) {
    await client.query(`INSERT INTO students (id,admission_no,roll_no,first_name,last_name,gender,dob,class_id,enrollment_date,status,blood_group,email,phone,address,guardian_name,guardian_relation,guardian_phone,guardian_email,avatar_url)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) ON CONFLICT DO NOTHING`,
      [x.id,x.admissionNo,x.rollNo,x.firstName,x.lastName,x.gender,x.dob,x.classId,x.enrollmentDate,x.status,x.bloodGroup || null,x.email || null,x.phone || null,x.address,x.guardianName,x.guardianRelation,x.guardianPhone,x.guardianEmail,x.avatarUrl || null]);
  }
  counts.students = list('students').length;
  for (const x of list('attendance')) {
    const { rows } = await client.query(`INSERT INTO attendance (id,class_id,attendance_date,marked_at,marked_by) VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING RETURNING id`,
      [x.id,x.classId,x.date,new Date(x.markedAt).toString() === 'Invalid Date' ? new Date() : new Date(x.markedAt),x.markedBy]);
    if (!rows[0]) continue;
    for (const record of x.records) {
      await client.query('INSERT INTO attendance_records (attendance_id,student_id,student_name,roll_no,status,remarks) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING',
        [rows[0].id,record.studentId,record.studentName,record.rollNo,record.status,record.remarks || null]);
    }
  }
  counts.attendance = list('attendance').length;
  for (const x of list('exams')) {
    const { rows } = await client.query(`INSERT INTO exams (id,title,academic_term,start_date,end_date,status,description) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING RETURNING id`,
      [x.id,x.title,x.academicTerm,x.startDate,x.endDate,x.status,x.description || null]);
    if (!rows[0]) continue;
    for (const classId of x.classes) await client.query('INSERT INTO exam_classes (exam_id,class_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [x.id,classId]);
  }
  counts.exams = list('exams').length;
  for (const x of list('results')) {
    await client.query(`INSERT INTO exam_results (id,exam_id,student_id,class_id,marks,total_marks_obtained,total_max_marks,percentage,gpa,overall_grade,class_rank,teacher_remarks)
      VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT DO NOTHING`,
      [x.id,x.examId,x.studentId,x.classId,JSON.stringify(x.marks),x.totalMarksObtained,x.totalMaxMarks,x.percentage,x.gpa,x.overallGrade,x.classRank || null,x.teacherRemarks || null]);
  }
  counts.results = list('results').length;
  for (const x of list('invoices')) {
    const { rows } = await client.query(`INSERT INTO fee_invoices (id,invoice_no,student_id,student_name,class_id,class_name,fee_type,amount,due_date,status,academic_term,created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,COALESCE($12::date,CURRENT_DATE)) ON CONFLICT DO NOTHING RETURNING id`,
      [x.id,x.invoiceNo,x.studentId,x.studentName,x.classId,x.className,x.feeType,x.amount,x.dueDate,x.status,x.academicTerm,x.createdAt || null]);
    if (!rows[0]) continue;
    for (const payment of (x.payments || [])) {
      await client.query(`INSERT INTO fee_payments (id,invoice_id,amount,payment_date,payment_method,transaction_ref,notes) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING`,
        [payment.id,rows[0].id,payment.amount,payment.paymentDate,payment.paymentMethod,payment.transactionRef,payment.notes || null]);
    }
  }
  counts.invoices = list('invoices').length;
  for (const x of list('timetableSlots')) {
    await client.query(`INSERT INTO timetable_slots (id,class_id,day,period_number,start_time,end_time,subject_name,subject_code,teacher_name,room_number) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT DO NOTHING`,
      [x.id,x.classId,x.day,x.periodNumber,x.startTime,x.endTime,x.subjectName,x.subjectCode,x.teacherName,x.roomNumber]);
  }
  counts.timetableSlots = list('timetableSlots').length;
  for (const x of list('notices')) {
    await client.query(`INSERT INTO notices (id,title,content,category,priority,target_audience,published_date,expiry_date,is_pinned,author_name)
      VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7::date,CURRENT_DATE),$8,$9,$10) ON CONFLICT DO NOTHING`,
      [x.id,x.title,x.content,x.category,x.priority,x.targetAudience,x.publishedDate || null,x.expiryDate || null,x.isPinned,x.authorName]);
  }
  counts.notices = list('notices').length;
  if (data.settings) {
    const x = data.settings;
    await client.query(`INSERT INTO school_settings (id,school_name,motto,established_year,principal_name,email,phone,address,website,academic_year,currency_symbol,grading_scale)
      VALUES (TRUE,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb) ON CONFLICT (id) DO NOTHING`,
      [x.schoolName,x.motto,x.establishedYear,x.principalName,x.email,x.phone,x.address,x.website,x.academicYear,x.currencySymbol,JSON.stringify(x.gradingScale)]);
  }
  return counts;
}

router.get('/', async (_req, res, next) => {
  try { res.json(await snapshot(pool, _req.user)); } catch (error) { next(error); }
});
router.post('/import', requireRoles('Admin'), async (req, res, next) => {
  try {
    const counts = await withTransaction((client) => importSnapshot(client, req.body));
    res.json({ imported: counts, mode: 'additive' });
  } catch (error) { next(error); }
});
router.post('/migrate-local-storage', requireRoles('Admin'), async (req, res, next) => {
  try {
    const result = await withTransaction(async (client) => {
      if (await hasSchoolRecords(client)) {
        const error = new Error('The database already contains school records. Migration was not run.'); error.status = 409; throw error;
      }
      return importSnapshot(client, req.body);
    });
    res.json({ imported: result, mode: 'one-time-local-storage-migration' });
  } catch (error) { next(error); }
});

export default router;
