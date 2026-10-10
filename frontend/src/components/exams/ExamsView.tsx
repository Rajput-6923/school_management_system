import React, { useState, useMemo } from 'react';
import { useSchool } from '../../context/SchoolApiContext';
import { Exam, StudentExamResult, ExamStatus } from '../../types';
import {
  FileSpreadsheet,
  Plus,
  Calendar,
  Award,
  Save,
  CheckCircle,
  Eye,
  Trash2,
  Edit2,
  Printer,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { ReportCardModal } from './ReportCardModal';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface ExamsViewProps {
  initialStudentReportId?: string | null;
}

export const ExamsView: React.FC<ExamsViewProps> = ({ initialStudentReportId }) => {
  const {
    exams,
    classes,
    subjects,
    students,
    results,
    settings,
    addExam,
    updateExam,
    deleteExam,
    saveStudentResult,
    isSaving,
    currentRole,
  } = useSchool();

  const [activeTab, setActiveTab] = useState<'schedules' | 'marks' | 'reportcards'>('schedules');

  // Exam Form Modal state
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [examToEdit, setExamToEdit] = useState<Exam | null>(null);
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null);
  const [examFormData, setExamFormData] = useState({
    title: '',
    academicTerm: 'Spring Semester',
    startDate: '2026-05-15',
    endDate: '2026-05-25',
    status: 'Upcoming' as ExamStatus,
    description: '',
  });

  // Marks Entry State
  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || 'exm-01');
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || 'cls-10a');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || 'sbj-101');

  // Local editable marks state map: studentId -> marksObtained
  const [marksState, setMarksState] = useState<Record<string, number>>({});
  const [remarksState, setRemarksState] = useState<Record<string, string>>({});

  // Report Card Modal State
  const [reportCardStudentId, setReportCardStudentId] = useState<string | null>(
    initialStudentReportId || null
  );

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);
  const selectedClassStudents = useMemo(() => {
    return students.filter((s) => s.classId === selectedClassId);
  }, [students, selectedClassId]);

  // Grade calculator helper based on school grading scale
  const getGradeInfo = (score: number) => {
    const scale = settings.gradingScale.find(
      (g) => score >= g.minScore && score <= g.maxScore
    );
    return scale || { grade: 'F', gpaPoint: 0.0 };
  };

  // Populate marks from existing result records
  React.useEffect(() => {
    const marksMap: Record<string, number> = {};
    const remarksMap: Record<string, string> = {};

    selectedClassStudents.forEach((student) => {
      const studentResult = results.find(
        (r) => r.examId === selectedExamId && r.studentId === student.id
      );
      const subjectMark = studentResult?.marks.find(
        (m) => m.subjectId === selectedSubjectId
      );

      if (subjectMark) {
        marksMap[student.id] = subjectMark.marksObtained;
        remarksMap[student.id] = subjectMark.remarks;
      } else {
        marksMap[student.id] = 85; // default initial score
        remarksMap[student.id] = 'Good comprehension';
      }
    });

    setMarksState(marksMap);
    setRemarksState(remarksMap);
  }, [selectedExamId, selectedClassId, selectedSubjectId, selectedClassStudents, results]);

  // Handle Exam submit
  const handleExamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examFormData.title.trim()) return;

    if (examToEdit) {
      if (await updateExam(examToEdit.id, examFormData)) setIsExamModalOpen(false);
    } else {
      if (await addExam({
        ...examFormData,
        classes: classes.map((c) => c.id),
      })) setIsExamModalOpen(false);
    }
  };

  // Save Grades for this class & subject
  const handleSaveGrades = async () => {
    await Promise.all(selectedClassStudents.map(async (student) => {
      const existingRes = results.find(
        (r) => r.examId === selectedExamId && r.studentId === student.id
      );

      const score = Number(marksState[student.id]) || 0;
      const grade = getGradeInfo(score).grade;
      const remark = remarksState[student.id] || 'Satisfactory';

      const currentMarks = existingRes ? [...existingRes.marks] : [];
      const markIdx = currentMarks.findIndex((m) => m.subjectId === selectedSubjectId);

      const updatedMarkItem = {
        subjectId: selectedSubjectId,
        subjectName: selectedSubject?.name || 'Academic Subject',
        maxMarks: 100,
        marksObtained: score,
        grade,
        remarks: remark,
      };

      if (markIdx >= 0) {
        currentMarks[markIdx] = updatedMarkItem;
      } else {
        currentMarks.push(updatedMarkItem);
      }

      // Re-calculate totals
      const totalObtained = currentMarks.reduce((acc, m) => acc + m.marksObtained, 0);
      const totalMax = currentMarks.reduce((acc, m) => acc + m.maxMarks, 0);
      const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
      const gpa = Number((percentage / 25).toFixed(2));
      const overallGrade = getGradeInfo(percentage).grade;

      await saveStudentResult({
        id: existingRes?.id,
        examId: selectedExamId,
        studentId: student.id,
        classId: selectedClassId,
        marks: currentMarks,
        totalMarksObtained: totalObtained,
        totalMaxMarks: totalMax,
        percentage,
        gpa,
        overallGrade,
        classRank: 1,
        teacherRemarks: `Consistent academic diligence demonstrated across ${currentMarks.length} evaluated subjects.`,
      });
    }));
  };

  return (
    <div className="space-y-4">
      {/* Tab Switcher */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setActiveTab('schedules')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'schedules'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Exam Schedules ({exams.length})
          </button>
          <button
            onClick={() => setActiveTab('marks')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'marks'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Gradebook & Marks Entry
          </button>
          <button
            onClick={() => setActiveTab('reportcards')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'reportcards'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Report Cards Generator
          </button>
        </div>

        {activeTab === 'schedules' && (currentRole === 'Admin' || currentRole === 'Teacher') && (
          <button
            onClick={() => {
              setExamToEdit(null);
              setExamFormData({
                title: '',
                academicTerm: 'Spring Semester',
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0],
                status: 'Upcoming',
                description: '',
              });
              setIsExamModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Exam Session</span>
          </button>
        )}
      </div>

      {/* Tab 1: Exam Schedules */}
      {activeTab === 'schedules' && (currentRole === 'Admin' || currentRole === 'Teacher') && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="bg-white border border-slate-200 rounded-xl p-4.5 hover:border-slate-300 transition-all shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                      exam.status === 'Completed'
                        ? 'bg-emerald-50 text-emerald-700'
                        : exam.status === 'Ongoing'
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {exam.status}
                  </span>

                  <div className="flex items-center gap-1">
                    {(currentRole === 'Admin' || currentRole === 'Teacher') && <button
                      onClick={() => {
                        setExamToEdit(exam);
                        setExamFormData({
                          title: exam.title,
                          academicTerm: exam.academicTerm,
                          startDate: exam.startDate,
                          endDate: exam.endDate,
                          status: exam.status,
                          description: exam.description || '',
                        });
                        setIsExamModalOpen(true);
                      }}
                      className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>}
                    {currentRole === 'Admin' && <button
                      onClick={() => setExamToDelete(exam)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>}
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mb-1 leading-snug">
                  {exam.title}
                </h3>
                <p className="text-xs text-slate-500 font-mono">{exam.academicTerm}</p>

                {exam.description && (
                  <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                    {exam.description}
                  </p>
                )}

                <div className="mt-3.5 py-2.5 px-3 bg-slate-50 border border-slate-100 rounded-lg text-xs space-y-1 font-mono text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Commences:</span>
                    <span className="font-semibold text-slate-800">{exam.startDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Concludes:</span>
                    <span className="font-semibold text-slate-800">{exam.endDate}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  All Grade Levels Enrolled
                </span>
                <button
                  onClick={() => {
                    setSelectedExamId(exam.id);
                    setActiveTab('marks');
                  }}
                  className="text-xs text-indigo-600 hover:underline font-medium inline-flex items-center gap-1"
                >
                  Gradebook <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Marks Entry & Gradebook */}
      {activeTab === 'marks' && (
        <div className="space-y-4">
          {/* Pickers Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Examination
                </label>
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 bg-white"
                >
                  {exams.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Class Section
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 bg-white"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} - Sec {c.section}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Subject
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 bg-white"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleSaveGrades}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 shadow-xs mt-2 md:mt-0"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Subject Marks'}</span>
            </button>
          </div>

          {/* Marks Entry Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-3 border-b border-slate-200 bg-slate-50/75 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800">
                Evaluating: {selectedSubject?.name} (Max Marks: 100)
              </span>
              <span className="text-slate-500 font-mono">
                {selectedClassStudents.length} candidates in roster
              </span>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 w-16">Roll</th>
                  <th className="py-2.5 px-4">Student Name</th>
                  <th className="py-2.5 px-4 w-32 text-center">Marks (0-100)</th>
                  <th className="py-2.5 px-4 w-24 text-center">Grade</th>
                  <th className="py-2.5 px-4">Performance Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedClassStudents.map((student) => {
                  const score = marksState[student.id] ?? 85;
                  const grade = getGradeInfo(score).grade;
                  const remark = remarksState[student.id] || '';

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                        #{student.rollNo}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-800">
                        {student.firstName} {student.lastName}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={score}
                          onChange={(e) =>
                            setMarksState({
                              ...marksState,
                              [student.id]: Number(e.target.value),
                            })
                          }
                          className="w-20 px-2 py-1 text-center font-mono font-bold text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                        />
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded text-xs font-bold font-mono bg-indigo-100 text-indigo-700">
                          {grade}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <input
                          type="text"
                          value={remark}
                          onChange={(e) =>
                            setRemarksState({
                              ...remarksState,
                              [student.id]: e.target.value,
                            })
                          }
                          placeholder="e.g. Excellent analytical reasoning..."
                          className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:border-slate-400 bg-white"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Report Cards Generator */}
      {activeTab === 'reportcards' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Official Academy Transcripts & Report Cards
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Generate and print student report cards with grade distribution and faculty remarks.
              </p>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Academic Term: {settings.academicYear}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((student) => {
              const res = results.find((r) => r.studentId === student.id);
              return (
                <div
                  key={student.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 transition-all shadow-xs"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center font-mono text-xs">
                        {student.firstName[0]}
                        {student.lastName[0]}
                      </div>
                      <span className="font-mono text-xs text-slate-500">
                        Roll #{student.rollNo}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm">
                      {student.firstName} {student.lastName}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {student.className} · Sec {student.section}
                    </p>

                    <div className="mt-3 p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Overall GPA:</span>
                        <span className="font-mono font-bold text-slate-900">
                          {res ? res.gpa.toFixed(2) : 'No results'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Final Grade:</span>
                        <span className="font-mono font-bold text-indigo-700">
                          {res ? res.overallGrade : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Class Standing:</span>
                        <span className="font-mono text-slate-700">
                          {res?.classRank ? `Rank #${res.classRank}` : 'Not ranked'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setReportCardStudentId(student.id)}
                    className="mt-4 w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Generate Official Report</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create / Edit Exam Modal */}
      <Modal
        isOpen={isExamModalOpen}
        onClose={() => setIsExamModalOpen(false)}
        title={examToEdit ? 'Edit Exam Session' : 'Create Examination Schedule'}
        subtitle="Establish academic assessment periods and calendar windows"
        maxWidth="md"
      >
        <form onSubmit={handleExamSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Examination Title *
            </label>
            <input
              type="text"
              required
              value={examFormData.title}
              onChange={(e) =>
                setExamFormData({ ...examFormData, title: e.target.value })
              }
              placeholder="e.g. Annual Finals 2026"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Academic Term
              </label>
              <input
                type="text"
                value={examFormData.academicTerm}
                onChange={(e) =>
                  setExamFormData({ ...examFormData, academicTerm: e.target.value })
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Status
              </label>
              <select
                value={examFormData.status}
                onChange={(e) =>
                  setExamFormData({
                    ...examFormData,
                    status: e.target.value as ExamStatus,
                  })
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 bg-white"
              >
                <option value="Upcoming">Upcoming</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={examFormData.startDate}
                onChange={(e) =>
                  setExamFormData({ ...examFormData, startDate: e.target.value })
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={examFormData.endDate}
                onChange={(e) =>
                  setExamFormData({ ...examFormData, endDate: e.target.value })
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Description / Instructions
            </label>
            <textarea
              rows={2}
              value={examFormData.description}
              onChange={(e) =>
                setExamFormData({ ...examFormData, description: e.target.value })
              }
              placeholder="Notice to students and invigilators..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsExamModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
            >
              {examToEdit ? 'Save Changes' : 'Create Exam'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Exam Dialog */}
      <ConfirmDialog
        isOpen={currentRole === 'Admin' && !!examToDelete}
        onClose={() => setExamToDelete(null)}
        onConfirm={() => {
          if (examToDelete) {
            deleteExam(examToDelete.id);
            setExamToDelete(null);
          }
        }}
        title="Delete Examination Session"
        message={`Are you sure you want to delete ${examToDelete?.title}? Associated grade records will be removed.`}
        confirmLabel="Delete Exam"
        isDestructive={true}
      />

      {/* Report Card Modal */}
      <ReportCardModal
        isOpen={!!reportCardStudentId}
        onClose={() => setReportCardStudentId(null)}
        studentId={reportCardStudentId}
      />
    </div>
  );
};
