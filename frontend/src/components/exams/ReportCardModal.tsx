import React from 'react';
import { useSchool } from '../../context/SchoolApiContext';
import { Modal } from '../common/Modal';
import { Award, Printer, ShieldCheck } from 'lucide-react';

interface ReportCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string | null;
  examId?: string | null;
}

export const ReportCardModal: React.FC<ReportCardModalProps> = ({
  isOpen,
  onClose,
  studentId,
  examId,
}) => {
  const { students, results, exams, settings, classes } = useSchool();

  if (!studentId) return null;

  const student = students.find((s) => s.id === studentId);
  if (!student) return null;

  // Selected or most recent result
  const studentResults = results.filter((r) => r.studentId === student.id);
  const activeResult = examId
    ? studentResults.find((r) => r.examId === examId) || studentResults[0]
    : studentResults[0];

  const exam = activeResult
    ? exams.find((e) => e.id === activeResult.examId)
    : exams[0];

  const studentClass = classes.find((c) => c.id === student.classId);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Official Academic Report Card"
      subtitle={`${student.firstName} ${student.lastName} · Session ${settings.academicYear}`}
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Printable Card Area */}
        <div className="p-6 bg-white border border-slate-300 rounded-xl shadow-xs print:border-none print:shadow-none print:p-0">
          {/* Institution Header with Crest */}
          <div className="border-b-2 border-slate-900 pb-5 mb-5 text-center">
            <div className="flex items-center justify-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-lg bg-indigo-950 text-white font-bold flex items-center justify-center font-mono text-base">
                EC
              </div>
              <h2 className="text-xl font-extrabold tracking-tight text-slate-950 uppercase">
                {settings.schoolName}
              </h2>
            </div>
            <p className="text-xs text-slate-600 font-serif italic">
              "{settings.motto}"
            </p>
            <p className="text-[11px] text-slate-500 font-mono mt-1">
              {settings.address} · Tel: {settings.phone}
            </p>
            <div className="mt-3 inline-block px-3 py-1 bg-slate-100 rounded-md text-xs font-bold text-slate-800 uppercase tracking-widest">
              OFFICIAL GRADE REPORT CARD · {exam?.title || 'Academic Assessment'}
            </div>
          </div>

          {/* Student Dossier Information */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs mb-6">
            <div>
              <span className="text-slate-500 block">Student Name</span>
              <span className="font-bold text-slate-900 text-sm">
                {student.firstName} {student.lastName}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Roll Number</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                #{student.rollNo}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Class & Section</span>
              <span className="font-medium text-slate-900">
                {student.className} - Sec {student.section}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Admission ID</span>
              <span className="font-mono text-slate-900">{student.admissionNo}</span>
            </div>

            <div>
              <span className="text-slate-500 block">Term / Session</span>
              <span className="text-slate-900 font-medium">
                {exam?.academicTerm || 'Fall Semester'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Date of Birth</span>
              <span className="font-mono text-slate-900">{student.dob}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Class Teacher</span>
              <span className="text-slate-900 font-medium">
                {studentClass?.classTeacherName || 'Class Instructor'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Class Rank</span>
              <span className="font-bold text-indigo-700 font-mono">
                {activeResult?.classRank ? `Rank #${activeResult.classRank}` : 'Honors'}
              </span>
            </div>
          </div>

          {/* Marks Breakdown Table */}
          {activeResult ? (
            <div className="border border-slate-200 rounded-lg overflow-hidden mb-6">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Subject</th>
                    <th className="py-2.5 px-3 text-right">Max Marks</th>
                    <th className="py-2.5 px-3 text-right">Marks Obtained</th>
                    <th className="py-2.5 px-3 text-center">Grade</th>
                    <th className="py-2.5 px-3">Performance Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeResult.marks.map((m) => (
                    <tr key={m.subjectId} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {m.subjectName}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                        {m.maxMarks}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {m.marksObtained}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold font-mono text-indigo-600">
                        {m.grade}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                        {m.remarks}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* Total Row */}
                <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-slate-900">
                  <tr>
                    <td className="py-2.5 px-3">Cumulative Total</td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {activeResult.totalMaxMarks}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-700 text-sm">
                      {activeResult.totalMarksObtained}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-indigo-700">
                      {activeResult.overallGrade}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] font-mono text-slate-700">
                      Average: {activeResult.percentage.toFixed(1)}% · GPA:{' '}
                      {activeResult.gpa.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-500 bg-slate-50 rounded-lg">
              No results logged for this student yet.
            </div>
          )}

          {/* Teacher Commentary */}
          {activeResult?.teacherRemarks && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs mb-8">
              <span className="font-semibold text-slate-900 uppercase tracking-wider text-[10px] block mb-1">
                Faculty Remarks & Assessment
              </span>
              <p className="text-slate-700 italic leading-relaxed">
                "{activeResult.teacherRemarks}"
              </p>
            </div>
          )}

          {/* Institutional Signatures */}
          <div className="grid grid-cols-3 gap-6 pt-10 text-center text-xs text-slate-600 border-t border-slate-200">
            <div>
              <div className="border-b border-slate-400 pb-8 mb-1.5 font-serif italic text-slate-400">
                {studentClass?.classTeacherName}
              </div>
              <span className="font-medium text-slate-900">Class Teacher Signature</span>
            </div>
            <div>
              <div className="border-b border-slate-400 pb-8 mb-1.5 font-serif italic text-slate-400">
                Office of Examinations
              </div>
              <span className="font-medium text-slate-900">Controller of Exams</span>
            </div>
            <div>
              <div className="border-b border-slate-400 pb-8 mb-1.5 font-serif italic text-slate-800">
                {settings.principalName}
              </div>
              <span className="font-medium text-slate-900">Principal Seal & Signature</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Official Report</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
