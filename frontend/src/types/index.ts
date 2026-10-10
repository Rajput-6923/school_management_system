export type Gender = 'Male' | 'Female' | 'Other';
export type StudentStatus = 'Active' | 'Graduated' | 'Suspended' | 'Inactive';
export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused';
export type FeeStatus = 'Paid' | 'Pending' | 'Partial' | 'Overdue';
export type ExamStatus = 'Upcoming' | 'Ongoing' | 'Completed';
export type NoticePriority = 'Urgent' | 'Normal' | 'Low';
export type NoticeAudience = 'All' | 'Students' | 'Teachers' | 'Parents';

export interface Student {
  id: string;
  admissionNo: string;
  rollNo: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  dob: string;
  classId: string; // e.g. "cls-10a"
  className: string; // e.g. "Grade 10"
  section: string; // e.g. "A"
  enrollmentDate: string;
  status: StudentStatus;
  bloodGroup?: string;
  email?: string;
  phone?: string;
  address: string;
  guardianName: string;
  guardianRelation: string;
  guardianPhone: string;
  guardianEmail: string;
  avatarUrl?: string;
}

export interface Teacher {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: Gender;
  qualification: string;
  department: string;
  designation: string;
  joiningDate: string;
  address: string;
  subjects: string[]; // Subject names or IDs
  assignedClass?: string; // e.g. "Grade 10 - A"
  experienceYears: number;
}

export interface SchoolClass {
  id: string;
  name: string; // e.g. "Grade 10"
  gradeLevel: number; // 1-12
  section: string; // "A", "B", "C"
  classTeacherId: string;
  classTeacherName: string;
  roomNumber: string;
  capacity: number;
  enrolledCount?: number;
  subjectsCount?: number;
}

export interface Subject {
  id: string;
  code: string; // e.g. "MTH-101"
  name: string; // e.g. "Advanced Mathematics"
  department: string;
  gradeLevel: number;
  teacherId: string;
  teacherName: string;
  credits: number;
  hoursPerWeek: number;
  type: 'Core' | 'Elective' | 'Practical';
}

export interface DailyAttendance {
  id: string;
  date: string; // YYYY-MM-DD
  classId: string;
  records: {
    studentId: string;
    studentName: string;
    rollNo: string;
    status: AttendanceStatus;
    remarks?: string;
  }[];
  markedAt: string;
  markedBy: string;
}

export interface Exam {
  id: string;
  title: string; // e.g. "Mid-Term Examination 2026"
  academicTerm: string; // e.g. "Fall 2026"
  startDate: string;
  endDate: string;
  status: ExamStatus;
  classes: string[]; // class IDs
  description?: string;
}

export interface ExamSubjectMark {
  subjectId: string;
  subjectName: string;
  maxMarks: number;
  marksObtained: number;
  grade: string;
  remarks: string;
}

export interface StudentExamResult {
  id: string;
  examId: string;
  studentId: string;
  classId: string;
  marks: ExamSubjectMark[];
  totalMarksObtained: number;
  totalMaxMarks: number;
  percentage: number;
  gpa: number;
  overallGrade: string;
  classRank?: number;
  teacherRemarks?: string;
}

export interface FeeInvoice {
  id: string;
  invoiceNo: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  feeType: 'Tuition Fee' | 'Lab Fee' | 'Transport Fee' | 'Library Fee' | 'Annual Examination';
  amount: number;
  paidAmount: number;
  dueDate: string;
  status: FeeStatus;
  academicTerm: string;
  createdAt: string;
  payments: FeePayment[];
}

export interface FeePayment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'Bank Transfer' | 'Cash' | 'Credit/Debit Card' | 'Online/UPI';
  transactionRef: string;
  notes?: string;
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

export interface TimetableSlot {
  id: string;
  classId: string;
  day: DayOfWeek;
  periodNumber: number; // 1 to 7
  startTime: string; // e.g. "08:30"
  endTime: string; // e.g. "09:15"
  subjectName: string;
  subjectCode: string;
  teacherName: string;
  roomNumber: string;
}

export interface SchoolNotice {
  id: string;
  title: string;
  content: string;
  category: 'Academic' | 'Event' | 'Holiday' | 'Administrative' | 'Sports';
  priority: NoticePriority;
  targetAudience: NoticeAudience;
  publishedDate: string;
  expiryDate?: string;
  isPinned: boolean;
  authorName: string;
}

export interface SchoolSettings {
  schoolName: string;
  motto: string;
  establishedYear: string;
  principalName: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  academicYear: string;
  currencySymbol: string;
  gradingScale: {
    grade: string;
    minScore: number;
    maxScore: number;
    gpaPoint: number;
  }[];
}

export type NavTab = 
  | 'dashboard'
  | 'students'
  | 'teachers'
  | 'classes'
  | 'attendance'
  | 'exams'
  | 'fees'
  | 'timetable'
  | 'notices'
  | 'settings';
