import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  Student, Teacher, SchoolClass, Subject, DailyAttendance, Exam, StudentExamResult, FeeInvoice,
  TimetableSlot, SchoolNotice, SchoolSettings, NavTab, FeePayment,
} from '../types';
import {
  initialSchoolSettings, initialTeachers, initialClasses, initialSubjects, initialStudents, initialAttendance,
  initialExams, initialResults, initialInvoices, initialTimetableSlots, initialNotices,
} from '../data/mockData';
import { apiRequest, jsonBody, ApiError } from '../api/client';

export interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: 'Admin' | 'Teacher' | 'Student' | 'Bursar';
  teacherId?: string | null;
  studentId?: string | null;
}

interface Snapshot {
  students: Student[];
  teachers: Teacher[];
  classes: SchoolClass[];
  subjects: Subject[];
  attendance: DailyAttendance[];
  exams: Exam[];
  results: StudentExamResult[];
  invoices: FeeInvoice[];
  timetableSlots: TimetableSlot[];
  notices: SchoolNotice[];
  settings: SchoolSettings;
}

interface SchoolContextType extends Snapshot {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  user: SessionUser | null;
  currentRole: SessionUser['role'];
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  authChecking: boolean;
  isLoading: boolean;
  isSaving: boolean;
  dataError: string;
  refreshData: () => Promise<boolean>;
  addStudent: (student: Omit<Student, 'id'>) => Promise<boolean>;
  updateStudent: (id: string, student: Partial<Student>) => Promise<boolean>;
  deleteStudent: (id: string) => Promise<boolean>;
  addTeacher: (teacher: Omit<Teacher, 'id'>) => Promise<boolean>;
  updateTeacher: (id: string, teacher: Partial<Teacher>) => Promise<boolean>;
  deleteTeacher: (id: string) => Promise<boolean>;
  addClass: (cls: Omit<SchoolClass, 'id'>) => Promise<boolean>;
  updateClass: (id: string, cls: Partial<SchoolClass>) => Promise<boolean>;
  deleteClass: (id: string) => Promise<boolean>;
  addSubject: (subject: Omit<Subject, 'id'>) => Promise<boolean>;
  updateSubject: (id: string, subject: Partial<Subject>) => Promise<boolean>;
  deleteSubject: (id: string) => Promise<boolean>;
  saveAttendance: (record: DailyAttendance) => Promise<boolean>;
  addExam: (exam: Omit<Exam, 'id'>) => Promise<boolean>;
  updateExam: (id: string, exam: Partial<Exam>) => Promise<boolean>;
  deleteExam: (id: string) => Promise<boolean>;
  saveStudentResult: (result: Omit<StudentExamResult, 'id'> & { id?: string }) => Promise<boolean>;
  addInvoice: (invoice: Omit<FeeInvoice, 'id' | 'payments' | 'createdAt'>) => Promise<boolean>;
  recordPayment: (invoiceId: string, payment: Omit<FeePayment, 'id' | 'invoiceId'>) => Promise<boolean>;
  deleteInvoice: (id: string) => Promise<boolean>;
  addTimetableSlot: (slot: Omit<TimetableSlot, 'id'>) => Promise<boolean>;
  updateTimetableSlot: (id: string, slot: Partial<TimetableSlot>) => Promise<boolean>;
  deleteTimetableSlot: (id: string) => Promise<boolean>;
  addNotice: (notice: Omit<SchoolNotice, 'id' | 'publishedDate'>) => Promise<boolean>;
  updateNotice: (id: string, notice: Partial<SchoolNotice>) => Promise<boolean>;
  deleteNotice: (id: string) => Promise<boolean>;
  togglePinNotice: (id: string) => Promise<boolean>;
  updateSettings: (settings: Partial<SchoolSettings>) => Promise<boolean>;
  resetToDemoData: () => Promise<boolean>;
  exportDataToJson: () => void;
  importDataFromJson: (jsonStr: string) => Promise<boolean>;
  toasts: ToastNotification[];
  showToast: (message: string, type?: ToastNotification['type']) => void;
  removeToast: (id: string) => void;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);
const emptySnapshot: Snapshot = {
  students: [], teachers: [], classes: [], subjects: [], attendance: [], exams: [], results: [], invoices: [],
  timetableSlots: [], notices: [], settings: initialSchoolSettings,
};
const legacyKeys: Record<keyof Omit<Snapshot, 'settings'> | 'settings', string[]> = {
  students: ['educore_students_v1', 'eduflow_students', 'eduflow_students_v1'],
  teachers: ['educore_teachers_v1', 'eduflow_teachers', 'eduflow_teachers_v1'],
  classes: ['educore_classes_v1', 'eduflow_classes', 'eduflow_classes_v1'],
  subjects: ['educore_subjects_v1', 'eduflow_subjects', 'eduflow_subjects_v1'],
  attendance: ['educore_attendance_v1', 'eduflow_attendance', 'eduflow_attendance_v1'],
  exams: ['educore_exams_v1', 'eduflow_exams', 'eduflow_exams_v1'],
  results: ['educore_results_v1', 'eduflow_results', 'eduflow_results_v1'],
  invoices: ['educore_invoices_v1', 'eduflow_fees', 'eduflow_invoices', 'eduflow_fees_v1'],
  timetableSlots: ['educore_timetable_v1', 'eduflow_timetable', 'eduflow_timetable_v1'],
  notices: ['educore_notices_v1', 'eduflow_notices', 'eduflow_notices_v1'],
  settings: ['educore_settings_v1', 'eduflow_settings', 'eduflow_settings_v1'],
};

function readLegacySnapshot(): Partial<Snapshot> {
  const snapshot: Record<string, unknown> = {};
  for (const [field, keys] of Object.entries(legacyKeys)) {
    for (const key of keys) {
      try {
        const stored = localStorage.getItem(key);
        if (!stored) continue;
        const value = JSON.parse(stored);
        if (value !== null && value !== undefined) {
          snapshot[field] = value;
          break;
        }
      } catch {
        continue;
      }
    }
  }
  return snapshot as Partial<Snapshot>;
}

function makeId(): string {
  return globalThis.crypto?.randomUUID?.() || `record-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const SchoolProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [user, setUser] = useState<SessionUser | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [savingCount, setSavingCount] = useState(0);
  const [dataError, setDataError] = useState('');
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [students, setStudents] = useState<Student[]>(emptySnapshot.students);
  const [teachers, setTeachers] = useState<Teacher[]>(emptySnapshot.teachers);
  const [classes, setClasses] = useState<SchoolClass[]>(emptySnapshot.classes);
  const [subjects, setSubjects] = useState<Subject[]>(emptySnapshot.subjects);
  const [attendance, setAttendance] = useState<DailyAttendance[]>(emptySnapshot.attendance);
  const [exams, setExams] = useState<Exam[]>(emptySnapshot.exams);
  const [results, setResults] = useState<StudentExamResult[]>(emptySnapshot.results);
  const [invoices, setInvoices] = useState<FeeInvoice[]>(emptySnapshot.invoices);
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>(emptySnapshot.timetableSlots);
  const [notices, setNotices] = useState<SchoolNotice[]>(emptySnapshot.notices);
  const [settings, setSettings] = useState<SchoolSettings>(emptySnapshot.settings);
  const currentRole = user?.role || 'Student';

  const showToast = (message: string, type: ToastNotification['type'] = 'success') => {
    const id = makeId();
    setToasts((previous) => [...previous, { id, message, type }]);
    window.setTimeout(() => setToasts((previous) => previous.filter((toast) => toast.id !== id)), 4000);
  };
  const removeToast = (id: string) => setToasts((previous) => previous.filter((toast) => toast.id !== id));

  const applySnapshot = (data: Snapshot) => {
    setStudents(data.students || []);
    setTeachers(data.teachers || []);
    setClasses(data.classes || []);
    setSubjects(data.subjects || []);
    setAttendance(data.attendance || []);
    setExams(data.exams || []);
    setResults(data.results || []);
    setInvoices(data.invoices || []);
    setTimetableSlots(data.timetableSlots || []);
    setNotices(data.notices || []);
    setSettings(data.settings || initialSchoolSettings);
  };

  const refreshData = async (): Promise<boolean> => {
    if (!user) return false;
    try {
      const data = await apiRequest<Snapshot>('/data');
      applySnapshot(data);
      setDataError('');
      return true;
    } catch (error) {
      setDataError(error instanceof Error ? error.message : 'Could not load school data.');
      return false;
    }
  };

  useEffect(() => {
    let active = true;
    apiRequest<{ user: SessionUser }>('/auth/me')
      .then(({ user: sessionUser }) => { if (active) setUser(sessionUser); })
      .catch((error: unknown) => {
        if (active && (!(error instanceof ApiError) || error.status !== 401)) {
          setDataError(error instanceof Error ? error.message : 'Could not connect to the API.');
        }
      })
      .finally(() => { if (active) setAuthChecking(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!user) {
      setStudents([]); setTeachers([]); setClasses([]); setSubjects([]); setAttendance([]); setExams([]);
      setResults([]); setInvoices([]); setTimetableSlots([]); setNotices([]); setSettings(initialSchoolSettings);
      return;
    }
    let active = true;
    (async () => {
      setIsLoading(true);
      try {
        let data = await apiRequest<Snapshot>('/data');
        const recordCount = data.students.length + data.teachers.length + data.classes.length + data.subjects.length +
          data.attendance.length + data.exams.length + data.results.length + data.invoices.length + data.notices.length + data.timetableSlots.length;
        if (recordCount === 0 && user.role === 'Admin') {
          const legacy = readLegacySnapshot();
          const legacyCount = Object.entries(legacy).reduce((count, [key, value]) => count + (key === 'settings' ? 0 : Array.isArray(value) ? value.length : 0), 0);
          if (legacyCount > 0 || legacy.settings !== undefined) {
            try {
              await apiRequest('/data/migrate-local-storage', { method: 'POST', body: jsonBody(legacy) });
              data = await apiRequest<Snapshot>('/data');
              if (active) showToast('Existing browser records were imported into the school database.');
            } catch (error) {
              if (!(error instanceof ApiError) || error.status !== 409) throw error;
              data = await apiRequest<Snapshot>('/data');
            }
          }
        }
        if (active) { applySnapshot(data); setDataError(''); }
      } catch (error) {
        if (active) setDataError(error instanceof Error ? error.message : 'Could not load school data.');
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => { active = false; };
  }, [user]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiRequest<{ user: SessionUser }>('/auth/login', { method: 'POST', body: jsonBody({ email, password }) });
      setDataError('');
      setUser(response.user);
      return true;
    } catch (error) {
      setDataError(error instanceof Error ? error.message : 'Login failed.');
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try { await apiRequest('/auth/logout', { method: 'POST' }); }
    catch { /* Clear local session state even if the server is unavailable. */ }
    setUser(null);
    setDataError('');
  };

  const mutate = async <T,>(request: () => Promise<T>, apply: (record: T) => void, success: string): Promise<boolean> => {
    setSavingCount((count) => count + 1);
    try {
      const result = await request();
      apply(result);
      showToast(success);
      return true;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) setUser(null);
      showToast(error instanceof Error ? error.message : 'The change could not be saved.', 'error');
      return false;
    } finally {
      setSavingCount((count) => Math.max(0, count - 1));
    }
  };

  const addStudent = (student: Omit<Student, 'id'>) => mutate(
    () => apiRequest<Student>('/people/students', { method: 'POST', body: jsonBody({ ...student, id: makeId() }) }),
    (record) => setStudents((current) => [record, ...current]), `Student ${student.firstName} ${student.lastName} enrolled successfully.`
  );
  const updateStudent = (id: string, update: Partial<Student>) => {
    const current = students.find((record) => record.id === id);
    if (!current) return Promise.resolve(false);
    return mutate(() => apiRequest<Student>(`/people/students/${encodeURIComponent(id)}`, { method: 'PUT', body: jsonBody({ ...current, ...update }) }),
      (record) => setStudents((items) => items.map((item) => item.id === id ? record : item)), 'Student record updated successfully.');
  };
  const deleteStudent = (id: string) => mutate(
    () => apiRequest(`/people/students/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    () => setStudents((items) => items.filter((item) => item.id !== id)), 'Student record deleted.'
  );

  const addTeacher = (teacher: Omit<Teacher, 'id'>) => mutate(
    () => apiRequest<Teacher>('/people/teachers', { method: 'POST', body: jsonBody({ ...teacher, id: makeId() }) }),
    (record) => setTeachers((items) => [record, ...items]), `Faculty member ${teacher.firstName} ${teacher.lastName} added.`
  );
  const updateTeacher = (id: string, update: Partial<Teacher>) => {
    const current = teachers.find((record) => record.id === id);
    if (!current) return Promise.resolve(false);
    return mutate(() => apiRequest<Teacher>(`/people/teachers/${encodeURIComponent(id)}`, { method: 'PUT', body: jsonBody({ ...current, ...update }) }),
      (record) => setTeachers((items) => items.map((item) => item.id === id ? record : item)), 'Teacher profile updated.');
  };
  const deleteTeacher = (id: string) => mutate(
    () => apiRequest(`/people/teachers/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    () => setTeachers((items) => items.filter((item) => item.id !== id)), 'Faculty record deleted.'
  );

  const addClass = (cls: Omit<SchoolClass, 'id'>) => mutate(
    () => apiRequest<SchoolClass>('/people/classes', { method: 'POST', body: jsonBody({ ...cls, id: makeId() }) }),
    (record) => setClasses((items) => [...items, record]), `Class ${cls.name} (${cls.section}) added.`
  );
  const updateClass = (id: string, update: Partial<SchoolClass>) => {
    const current = classes.find((record) => record.id === id);
    if (!current) return Promise.resolve(false);
    return mutate(() => apiRequest<SchoolClass>(`/people/classes/${encodeURIComponent(id)}`, { method: 'PUT', body: jsonBody({ ...current, ...update }) }),
      (record) => setClasses((items) => items.map((item) => item.id === id ? record : item)), 'Class information updated.');
  };
  const deleteClass = (id: string) => mutate(
    () => apiRequest(`/people/classes/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    () => setClasses((items) => items.filter((item) => item.id !== id)), 'Class deleted.'
  );

  const addSubject = (subject: Omit<Subject, 'id'>) => mutate(
    () => apiRequest<Subject>('/people/subjects', { method: 'POST', body: jsonBody({ ...subject, id: makeId() }) }),
    (record) => setSubjects((items) => [...items, record]), `Subject ${subject.name} registered.`
  );
  const updateSubject = (id: string, update: Partial<Subject>) => {
    const current = subjects.find((record) => record.id === id);
    if (!current) return Promise.resolve(false);
    return mutate(() => apiRequest<Subject>(`/people/subjects/${encodeURIComponent(id)}`, { method: 'PUT', body: jsonBody({ ...current, ...update }) }),
      (record) => setSubjects((items) => items.map((item) => item.id === id ? record : item)), 'Subject updated.');
  };
  const deleteSubject = (id: string) => mutate(
    () => apiRequest(`/people/subjects/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    () => setSubjects((items) => items.filter((item) => item.id !== id)), 'Subject removed.'
  );

  const saveAttendance = (record: DailyAttendance) => mutate(
    () => apiRequest<DailyAttendance>('/academic/attendance', { method: 'PUT', body: jsonBody(record) }),
    (saved) => setAttendance((items) => [saved, ...items.filter((item) => item.id !== saved.id && !(item.date === saved.date && item.classId === saved.classId))]),
    `Attendance recorded for ${record.date}.`
  );
  const addExam = (exam: Omit<Exam, 'id'>) => mutate(
    () => apiRequest<Exam>('/academic/exams', { method: 'POST', body: jsonBody({ ...exam, id: makeId() }) }),
    (record) => setExams((items) => [record, ...items]), 'Examination schedule created.'
  );
  const updateExam = (id: string, update: Partial<Exam>) => {
    const current = exams.find((record) => record.id === id);
    if (!current) return Promise.resolve(false);
    return mutate(() => apiRequest<Exam>(`/academic/exams/${encodeURIComponent(id)}`, { method: 'PUT', body: jsonBody({ ...current, ...update }) }),
      (record) => setExams((items) => items.map((item) => item.id === id ? record : item)), 'Exam updated.');
  };
  const deleteExam = (id: string) => mutate(
    () => apiRequest(`/academic/exams/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    () => { setExams((items) => items.filter((item) => item.id !== id)); setResults((items) => items.filter((item) => item.examId !== id)); }, 'Exam schedule deleted.'
  );
  const saveStudentResult = (result: Omit<StudentExamResult, 'id'> & { id?: string }) => mutate(
    () => apiRequest<StudentExamResult>('/academic/results', { method: 'PUT', body: jsonBody({ ...result, id: result.id || makeId() }) }),
    (record) => setResults((items) => [record, ...items.filter((item) => !(item.examId === record.examId && item.studentId === record.studentId))]),
    'Assessment grades recorded.'
  );

  const addInvoice = (invoice: Omit<FeeInvoice, 'id' | 'payments' | 'createdAt'>) => mutate(
    () => apiRequest<FeeInvoice>('/finance/invoices', { method: 'POST', body: jsonBody({ ...invoice, id: makeId(), payments: [] }) }),
    (record) => setInvoices((items) => [record, ...items]), `Invoice ${invoice.invoiceNo} generated.`
  );
  const recordPayment = (invoiceId: string, payment: Omit<FeePayment, 'id' | 'invoiceId'>) => mutate(
    () => apiRequest<FeeInvoice>(`/finance/invoices/${encodeURIComponent(invoiceId)}/payments`, { method: 'POST', body: jsonBody({ ...payment, id: makeId() }) }),
    (record) => setInvoices((items) => items.map((item) => item.id === invoiceId ? record : item)), `Payment of ${settings.currencySymbol}${payment.amount} recorded.`
  );
  const deleteInvoice = (id: string) => mutate(
    () => apiRequest(`/finance/invoices/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    () => setInvoices((items) => items.filter((item) => item.id !== id)), 'Fee record removed.'
  );

  const addTimetableSlot = (slot: Omit<TimetableSlot, 'id'>) => mutate(
    () => apiRequest<TimetableSlot>('/academic/timetable', { method: 'POST', body: jsonBody({ ...slot, id: makeId() }) }),
    (record) => setTimetableSlots((items) => [...items, record]), `Schedule slot added for ${slot.day}.`
  );
  const updateTimetableSlot = (id: string, update: Partial<TimetableSlot>) => {
    const current = timetableSlots.find((record) => record.id === id);
    if (!current) return Promise.resolve(false);
    return mutate(() => apiRequest<TimetableSlot>(`/academic/timetable/${encodeURIComponent(id)}`, { method: 'PUT', body: jsonBody({ ...current, ...update }) }),
      (record) => setTimetableSlots((items) => items.map((item) => item.id === id ? record : item)), 'Timetable period updated.');
  };
  const deleteTimetableSlot = (id: string) => mutate(
    () => apiRequest(`/academic/timetable/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    () => setTimetableSlots((items) => items.filter((item) => item.id !== id)), 'Period deleted.'
  );

  const addNotice = (notice: Omit<SchoolNotice, 'id' | 'publishedDate'>) => mutate(
    () => apiRequest<SchoolNotice>('/finance/notices', { method: 'POST', body: jsonBody({ ...notice, id: makeId() }) }),
    (record) => setNotices((items) => [record, ...items]), 'Notice published.'
  );
  const updateNotice = (id: string, update: Partial<SchoolNotice>) => {
    const current = notices.find((record) => record.id === id);
    if (!current) return Promise.resolve(false);
    return mutate(() => apiRequest<SchoolNotice>(`/finance/notices/${encodeURIComponent(id)}`, { method: 'PUT', body: jsonBody({ ...current, ...update }) }),
      (record) => setNotices((items) => items.map((item) => item.id === id ? record : item)), 'Notice updated.');
  };
  const deleteNotice = (id: string) => mutate(
    () => apiRequest(`/finance/notices/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    () => setNotices((items) => items.filter((item) => item.id !== id)), 'Notice removed.'
  );
  const togglePinNotice = (id: string) => mutate(
    () => apiRequest<SchoolNotice>(`/finance/notices/${encodeURIComponent(id)}/pin`, { method: 'PATCH' }),
    (record) => setNotices((items) => items.map((item) => item.id === id ? record : item)), 'Notice pin updated.'
  );

  const updateSettings = (update: Partial<SchoolSettings>) => {
    const nextSettings = { ...settings, ...update };
    return mutate(() => apiRequest<SchoolSettings>('/finance/settings', { method: 'PUT', body: jsonBody(nextSettings) }),
      setSettings, 'School preferences saved.');
  };

  const resetToDemoData = async (): Promise<boolean> => {
    const sample = { students: initialStudents, teachers: initialTeachers, classes: initialClasses, subjects: initialSubjects,
      attendance: initialAttendance, exams: initialExams, results: initialResults, invoices: initialInvoices,
      timetableSlots: initialTimetableSlots, notices: initialNotices, settings: initialSchoolSettings };
    const ok = await mutate(() => apiRequest('/data/import', { method: 'POST', body: jsonBody(sample) }),
      () => undefined, 'Sample records imported. Existing database records were preserved.');
    if (ok) await refreshData();
    return ok;
  };

  const exportDataToJson = () => {
    const backupData = { exportedAt: new Date().toISOString(), school: settings.schoolName, students, teachers, classes, subjects,
      attendance, exams, results, invoices, timetableSlots, notices, settings };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `eduflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('School data backup file downloaded.');
  };

  const importDataFromJson = async (jsonStr: string): Promise<boolean> => {
    try {
      const data = JSON.parse(jsonStr);
      await apiRequest('/data/import', { method: 'POST', body: jsonBody(data) });
      const refreshed = await refreshData();
      if (refreshed) showToast('Data imported. Existing records with matching IDs were left unchanged.');
      return refreshed;
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'The backup could not be imported.', 'error');
      return false;
    }
  };

  return (
    <SchoolContext.Provider value={{
      activeTab, setActiveTab, user, currentRole, login, logout, authChecking, isLoading, isSaving: savingCount > 0, dataError, refreshData,
      students, teachers, classes, subjects, attendance, exams, results, invoices, timetableSlots, notices, settings,
      addStudent, updateStudent, deleteStudent, addTeacher, updateTeacher, deleteTeacher, addClass, updateClass, deleteClass,
      addSubject, updateSubject, deleteSubject, saveAttendance, addExam, updateExam, deleteExam, saveStudentResult,
      addInvoice, recordPayment, deleteInvoice, addTimetableSlot, updateTimetableSlot, deleteTimetableSlot,
      addNotice, updateNotice, deleteNotice, togglePinNotice, updateSettings, resetToDemoData,
      exportDataToJson, importDataFromJson, toasts, showToast, removeToast,
    }}>
      {children}
    </SchoolContext.Provider>
  );
};

export const useSchool = () => {
  const context = useContext(SchoolContext);
  if (!context) throw new Error('useSchool must be used within a SchoolProvider');
  return context;
};
