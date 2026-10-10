import test from 'node:test';
import assert from 'node:assert/strict';
import { attendanceSchema, loginSchema, parseBody, paymentSchema, resultSchema, studentSchema } from '../src/schemas.js';

const student = {
  id: 'stu-1', admissionNo: 'ADM-1', rollNo: '1', firstName: 'Sam', lastName: 'Lee', gender: 'Other', dob: '2010-04-03',
  classId: 'class-1', className: 'Grade 1', section: 'A', enrollmentDate: '2024-08-01', status: 'Active', address: '',
  guardianName: 'Pat Lee', guardianRelation: 'Parent', guardianPhone: '555-0100', guardianEmail: '',
};

test('login schema only accepts syntactically valid credentials', () => {
  assert.equal(loginSchema.safeParse({ email: 'admin@example.com', password: 'private' }).success, true);
  assert.equal(loginSchema.safeParse({ email: 'not-an-email', password: 'private' }).success, false);
});

test('student schema rejects invalid dates and enum values', () => {
  assert.equal(studentSchema.safeParse(student).success, true);
  assert.equal(studentSchema.safeParse({ ...student, dob: 'not-a-date' }).success, false);
  assert.equal(studentSchema.safeParse({ ...student, gender: 'Admin' }).success, false);
});

test('attendance schema validates status and bounded record fields', () => {
  const record = { id: 'att-1', date: '2025-04-03', classId: 'class-1', markedAt: '2025-04-03T08:00:00Z', markedBy: 'Teacher',
    records: [{ studentId: 'stu-1', studentName: 'Sam Lee', rollNo: '1', status: 'Present' }] };
  assert.equal(attendanceSchema.safeParse(record).success, true);
  assert.equal(attendanceSchema.safeParse({ ...record, records: [{ ...record.records[0], status: 'Unknown' }] }).success, false);
});

test('payment validation rejects zero and unsupported payment methods', () => {
  const payment = { amount: 10, paymentDate: '2025-04-03', paymentMethod: 'Cash', transactionRef: 'REF-1' };
  assert.equal(paymentSchema.safeParse(payment).success, true);
  assert.equal(paymentSchema.safeParse({ ...payment, amount: 0 }).success, false);
  assert.throws(() => parseBody(paymentSchema, { ...payment, paymentMethod: 'Crypto' }), { status: 400 });
});

test('result validation enforces marks, totals, and percentage consistency', () => {
  const result = {
    id: 'result-1', examId: 'exam-1', studentId: 'stu-1', classId: 'class-1',
    marks: [{ subjectId: 'math', subjectName: 'Math', maxMarks: 100, marksObtained: 80, grade: 'B', remarks: '' }],
    totalMarksObtained: 80, totalMaxMarks: 100, percentage: 80, gpa: 3.2, overallGrade: 'B',
  };
  assert.equal(resultSchema.safeParse(result).success, true);
  assert.equal(resultSchema.safeParse({ ...result, percentage: 95 }).success, false);
  assert.equal(resultSchema.safeParse({ ...result, marks: [{ ...result.marks[0], marksObtained: 101 }] }).success, false);
});
