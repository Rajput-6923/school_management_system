import { z } from 'zod';

const text = (max = 300) => z.string().trim().max(max);
const optionalText = (max = 300) => text(max).optional().nullable();
const date = z.iso.date();

export const loginSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(200),
});

export const studentSchema = z.object({
  id: text(100).optional(), admissionNo: text(100), rollNo: text(30), firstName: text(100), lastName: text(100),
  gender: z.enum(['Male', 'Female', 'Other']), dob: date, classId: text(100), className: text(100).optional(),
  section: text(10).optional(), enrollmentDate: date, status: z.enum(['Active', 'Graduated', 'Suspended', 'Inactive']),
  bloodGroup: optionalText(10), email: z.email().max(254).optional().or(z.literal('')), phone: optionalText(50),
  address: text(500), guardianName: text(200), guardianRelation: text(100), guardianPhone: text(50),
  guardianEmail: z.email().max(254).or(z.literal('')), avatarUrl: optionalText(1000),
});
export const teacherSchema = z.object({
  id: text(100).optional(), employeeId: text(100), firstName: text(100), lastName: text(100), email: z.email().max(254),
  phone: text(50), gender: z.enum(['Male', 'Female', 'Other']), qualification: text(250), department: text(150),
  designation: text(150), joiningDate: date, address: text(500), subjects: z.array(text(120)).max(100),
  assignedClass: optionalText(120), experienceYears: z.number().int().min(0).max(80),
});
export const classSchema = z.object({
  id: text(100).optional(), name: text(100), gradeLevel: z.number().int().min(1).max(12), section: text(10),
  classTeacherId: optionalText(100), classTeacherName: text(200).optional(), roomNumber: text(100),
  capacity: z.number().int().min(1).max(500), enrolledCount: z.number().int().min(0).optional(), subjectsCount: z.number().int().min(0).optional(),
});
export const subjectSchema = z.object({
  id: text(100).optional(), code: text(30), name: text(150), department: text(150), gradeLevel: z.number().int().min(1).max(12),
  teacherId: optionalText(100), teacherName: text(200), credits: z.number().int().min(1).max(30),
  hoursPerWeek: z.number().int().min(1).max(40), type: z.enum(['Core', 'Elective', 'Practical']),
});
export const attendanceSchema = z.object({
  id: text(100), date, classId: text(100), markedAt: z.string().max(100), markedBy: text(200),
  records: z.array(z.object({ studentId: text(100), studentName: text(200), rollNo: text(30),
    status: z.enum(['Present', 'Absent', 'Late', 'Excused']), remarks: optionalText(500) })).max(1000),
});
export const examSchema = z.object({
  id: text(100).optional(), title: text(200), academicTerm: text(100), startDate: date, endDate: date,
  status: z.enum(['Upcoming', 'Ongoing', 'Completed']), classes: z.array(text(100)).max(500), description: optionalText(2000),
});
const markSchema = z.object({ subjectId: text(100), subjectName: text(150), maxMarks: z.number().min(0).max(10000),
  marksObtained: z.number().min(0).max(10000), grade: text(10), remarks: text(1000) });
export const resultSchema = z.object({
  id: text(100).optional(), examId: text(100), studentId: text(100), classId: text(100), marks: z.array(markSchema).max(100),
  totalMarksObtained: z.number().min(0), totalMaxMarks: z.number().min(0), percentage: z.number().min(0).max(100),
  gpa: z.number().min(0).max(10), overallGrade: text(10), classRank: z.number().int().positive().optional().nullable(),
  teacherRemarks: optionalText(2000),
}).superRefine((result, context) => {
  const obtained = result.marks.reduce((total, mark) => total + mark.marksObtained, 0);
  const possible = result.marks.reduce((total, mark) => total + mark.maxMarks, 0);
  if (result.marks.some((mark) => mark.marksObtained > mark.maxMarks)) {
    context.addIssue({ code: 'custom', path: ['marks'], message: 'Marks obtained cannot exceed maximum marks.' });
  }
  if (Math.abs(obtained - result.totalMarksObtained) > 0.01 || Math.abs(possible - result.totalMaxMarks) > 0.01) {
    context.addIssue({ code: 'custom', path: ['totalMarksObtained'], message: 'Result totals must match the subject marks.' });
  }
  const expectedPercentage = possible ? (obtained / possible) * 100 : 0;
  if (Math.abs(expectedPercentage - result.percentage) > 0.1) {
    context.addIssue({ code: 'custom', path: ['percentage'], message: 'Percentage must match the subject marks.' });
  }
});
export const invoiceSchema = z.object({
  id: text(100).optional(), invoiceNo: text(100), studentId: text(100), studentName: text(200), classId: text(100),
  className: text(100), feeType: z.enum(['Tuition Fee', 'Lab Fee', 'Transport Fee', 'Library Fee', 'Annual Examination']),
  amount: z.number().positive().max(100000000), paidAmount: z.number().min(0).optional(), dueDate: date,
  status: z.enum(['Paid', 'Pending', 'Partial', 'Overdue']), academicTerm: text(100), createdAt: date.optional(), payments: z.array(z.any()).optional(),
});
export const paymentSchema = z.object({
  id: text(100).optional(), invoiceId: text(100).optional(), amount: z.number().positive().max(100000000), paymentDate: date,
  paymentMethod: z.enum(['Bank Transfer', 'Cash', 'Credit/Debit Card', 'Online/UPI']),
  transactionRef: text(150), notes: optionalText(1000),
});
export const timetableSchema = z.object({
  id: text(100).optional(), classId: text(100), day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
  periodNumber: z.number().int().min(1).max(12), startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), subjectName: text(150), subjectCode: text(30),
  teacherName: text(200), roomNumber: text(100),
});
export const noticeSchema = z.object({
  id: text(100).optional(), title: text(200), content: text(10000),
  category: z.enum(['Academic', 'Event', 'Holiday', 'Administrative', 'Sports']),
  priority: z.enum(['Urgent', 'Normal', 'Low']), targetAudience: z.enum(['All', 'Students', 'Teachers', 'Parents']),
  publishedDate: date.optional(), expiryDate: date.optional().nullable(), isPinned: z.boolean(), authorName: text(200),
});
export const settingsSchema = z.object({
  schoolName: text(200), motto: text(500), establishedYear: text(20), principalName: text(200), email: z.email().max(254).or(z.literal('')),
  phone: text(50), address: text(500), website: text(300), academicYear: text(30), currencySymbol: text(5),
  gradingScale: z.array(z.object({ grade: text(10), minScore: z.number().min(0).max(100), maxScore: z.number().min(0).max(100), gpaPoint: z.number().min(0).max(10) })).max(30),
});

export function parseBody(schema, body) {
  const result = schema.safeParse(body);
  if (!result.success) {
    const error = new Error(result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; '));
    error.status = 400;
    throw error;
  }
  return result.data;
}
