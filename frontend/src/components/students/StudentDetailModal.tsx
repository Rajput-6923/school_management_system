import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolApiContext';
import { Student } from '../../types';
import { Modal } from '../common/Modal';
import {
  User,
  GraduationCap,
  CalendarCheck,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Award,
  FileText,
  Printer,
  ChevronRight,
} from 'lucide-react';

interface StudentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onEdit: (student: Student) => void;
  onViewReportCard?: (studentId: string) => void;
  onViewInvoiceReceipt?: (invoiceId: string) => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  isOpen,
  onClose,
  student,
  onEdit,
  onViewReportCard,
  onViewInvoiceReceipt,
}) => {
  const { results, attendance, invoices, settings, exams } = useSchool();
  const [activeTab, setActiveTab] = useState<'profile' | 'academics' | 'attendance' | 'fees'>('profile');

  if (!student) return null;

  // Student specific data
  const studentResults = results.filter((r) => r.studentId === student.id);
  const studentInvoices = invoices.filter((i) => i.studentId === student.id);

  // Attendance stats for student
  let studentPresent = 0;
  let studentAbsent = 0;
  let studentLate = 0;
  let totalDaysMarked = 0;

  attendance.forEach((att) => {
    const rec = att.records.find((r) => r.studentId === student.id);
    if (rec) {
      totalDaysMarked++;
      if (rec.status === 'Present') studentPresent++;
      if (rec.status === 'Absent') studentAbsent++;
      if (rec.status === 'Late') studentLate++;
    }
  });

  const attendanceRate =
    totalDaysMarked > 0
      ? Math.round((studentPresent / totalDaysMarked) * 100)
      : 96;

  // Print function
  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Student Record Profile"
      subtitle={`${student.firstName} ${student.lastName} · Roll #${student.rollNo}`}
      maxWidth="3xl"
    >
      <div className="space-y-5">
        {/* Header Profile Strip */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-lg shadow-xs font-mono">
              {student.firstName[0]}
              {student.lastName[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  {student.firstName} {student.lastName}
                </h3>
                <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {student.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Adm: {student.admissionNo} · {student.className} (Sec {student.section})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={() => {
                onClose();
                onEdit(student);
              }}
              className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
            >
              Edit Profile
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 gap-6 text-xs font-medium">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-2.5 transition-colors ${
              activeTab === 'profile'
                ? 'border-b-2 border-indigo-600 text-indigo-600 font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Personal & Guardian
          </button>
          <button
            onClick={() => setActiveTab('academics')}
            className={`pb-2.5 transition-colors ${
              activeTab === 'academics'
                ? 'border-b-2 border-indigo-600 text-indigo-600 font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Academic Results ({studentResults.length})
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`pb-2.5 transition-colors ${
              activeTab === 'attendance'
                ? 'border-b-2 border-indigo-600 text-indigo-600 font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Attendance History ({attendanceRate}%)
          </button>
          <button
            onClick={() => setActiveTab('fees')}
            className={`pb-2.5 transition-colors ${
              activeTab === 'fees'
                ? 'border-b-2 border-indigo-600 text-indigo-600 font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Fees & Billing ({studentInvoices.length})
          </button>
        </div>

        {/* Tab 1: Profile & Guardian */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Student Details
              </h4>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Gender</span>
                  <span className="font-medium text-slate-900">{student.gender}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Date of Birth</span>
                  <span className="font-mono text-slate-900">{student.dob}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Blood Group</span>
                  <span className="font-medium text-slate-900">{student.bloodGroup || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Enrollment Date</span>
                  <span className="font-mono text-slate-900">{student.enrollmentDate}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Student Email</span>
                  <span className="font-mono text-slate-900">{student.email || 'None'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Home Address</span>
                  <span className="text-slate-900 text-right max-w-xs">{student.address}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Guardian Information
              </h4>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3 text-xs">
                <div>
                  <div className="text-slate-500">Primary Contact</div>
                  <div className="text-sm font-semibold text-slate-900 mt-0.5">
                    {student.guardianName}
                  </div>
                  <div className="text-slate-500 text-[11px]">{student.guardianRelation}</div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-200 text-slate-700">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono">{student.guardianPhone}</span>
                </div>
                {student.guardianEmail && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{student.guardianEmail}</span>
                  </div>
                )}
                <div className="flex items-start gap-2 text-slate-700 pt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{student.address}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Academic Results */}
        {activeTab === 'academics' && (
          <div className="space-y-4">
            {studentResults.length > 0 ? (
              studentResults.map((res) => {
                const exam = exams.find((e) => e.id === res.examId);
                return (
                  <div
                    key={res.id}
                    className="p-4 bg-white border border-slate-200 rounded-xl space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">
                          {exam ? exam.title : 'Official Assessment'}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-mono">
                          Term: {exam?.academicTerm || 'Spring Term'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-xs text-slate-500">GPA </span>
                          <span className="font-mono font-bold text-slate-900 text-sm">
                            {res.gpa.toFixed(2)}
                          </span>
                          <span className="ml-2 font-bold px-1.5 py-0.5 rounded text-[11px] bg-indigo-100 text-indigo-700">
                            Grade {res.overallGrade}
                          </span>
                        </div>
                        {onViewReportCard && (
                          <button
                            onClick={() => {
                              onClose();
                              onViewReportCard(student.id);
                            }}
                            className="px-2.5 py-1 text-[11px] font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                          >
                            Full Report Card
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Marks Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="text-slate-400 border-b border-slate-100">
                            <th className="py-2 font-medium">Subject</th>
                            <th className="py-2 font-medium text-right">Max</th>
                            <th className="py-2 font-medium text-right">Obtained</th>
                            <th className="py-2 font-medium text-center">Grade</th>
                            <th className="py-2 font-medium">Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {res.marks.map((m) => (
                            <tr key={m.subjectId}>
                              <td className="py-2 font-medium text-slate-800">{m.subjectName}</td>
                              <td className="py-2 text-right font-mono text-slate-500">
                                {m.maxMarks}
                              </td>
                              <td className="py-2 text-right font-mono font-bold text-slate-900">
                                {m.marksObtained}
                              </td>
                              <td className="py-2 text-center font-bold text-indigo-600">
                                {m.grade}
                              </td>
                              <td className="py-2 text-slate-500 text-[11px]">{m.remarks}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {res.teacherRemarks && (
                      <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 italic">
                        "{res.teacherRemarks}"
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-600 font-medium">
                  No exam records logged for this session yet.
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Input grades in the Examinations & Results section.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Attendance History */}
        {activeTab === 'attendance' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-center">
              <div>
                <span className="text-[11px] text-slate-500">Present</span>
                <p className="text-lg font-bold font-mono text-emerald-600 mt-0.5">
                  {studentPresent} days
                </p>
              </div>
              <div>
                <span className="text-[11px] text-slate-500">Late</span>
                <p className="text-lg font-bold font-mono text-amber-600 mt-0.5">
                  {studentLate} days
                </p>
              </div>
              <div>
                <span className="text-[11px] text-slate-500">Absent</span>
                <p className="text-lg font-bold font-mono text-rose-600 mt-0.5">
                  {studentAbsent} days
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Recent Daily Logs
              </h5>
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                {attendance
                  .filter((a) => a.records.some((r) => r.studentId === student.id))
                  .slice(0, 10)
                  .map((att) => {
                    const record = att.records.find((r) => r.studentId === student.id)!;
                    return (
                      <div
                        key={att.id}
                        className="px-4 py-3 flex items-center justify-between hover:bg-slate-50/50"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-slate-600">{att.date}</span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-500">
                            Marked by {att.markedBy || 'Homeroom Teacher'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {record.remarks && (
                            <span className="text-slate-400 italic text-[11px]">
                              {record.remarks}
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                              record.status === 'Present'
                                ? 'bg-emerald-100 text-emerald-800'
                                : record.status === 'Late'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {record.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Fees & Billing */}
        {activeTab === 'fees' && (
          <div className="space-y-4">
            {studentInvoices.length > 0 ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                {studentInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{inv.feeType}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                            inv.status === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.status === 'Partial'
                              ? 'bg-amber-100 text-amber-800'
                              : inv.status === 'Overdue'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Invoice #{inv.invoiceNo} · Due: {inv.dueDate}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-mono font-bold text-slate-900 text-sm">
                          {settings.currencySymbol}
                          {inv.paidAmount} / {settings.currencySymbol}
                          {inv.amount}
                        </div>
                        {inv.amount - inv.paidAmount > 0 && (
                          <div className="text-[11px] text-rose-600 font-mono">
                            Due: {settings.currencySymbol}
                            {inv.amount - inv.paidAmount}
                          </div>
                        )}
                      </div>
                      {onViewInvoiceReceipt && (
                        <button
                          onClick={() => {
                            onClose();
                            onViewInvoiceReceipt(inv.id);
                          }}
                          className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          Receipt
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <CreditCard className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-600 font-medium">No fee records found.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Generate invoices in the Fees & Billing module.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
