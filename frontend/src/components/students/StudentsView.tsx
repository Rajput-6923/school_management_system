import React, { useState, useMemo } from 'react';
import { useSchool } from '../../context/SchoolApiContext';
import { Student } from '../../types';
import {
  Search,
  Filter,
  Plus,
  Download,
  Trash2,
  Edit2,
  Eye,
  MoreVertical,
  Printer,
  ChevronDown,
} from 'lucide-react';
import { StudentFormModal } from './StudentFormModal';
import { StudentDetailModal } from './StudentDetailModal';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface StudentsViewProps {
  onViewReportCard?: (studentId: string) => void;
  onViewInvoiceReceipt?: (invoiceId: string) => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  onViewReportCard,
  onViewInvoiceReceipt,
}) => {
  const { students, classes, deleteStudent, currentRole } = useSchool();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [detailStudent, setDetailStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  // Filtered List
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        `${s.firstName} ${s.lastName} ${s.admissionNo} ${s.rollNo} ${s.guardianName}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchClass =
        selectedClassId === 'all' || s.classId === selectedClassId;

      const matchGender =
        selectedGender === 'all' || s.gender === selectedGender;

      const matchStatus =
        selectedStatus === 'all' || s.status === selectedStatus;

      return matchSearch && matchClass && matchGender && matchStatus;
    });
  }, [students, searchTerm, selectedClassId, selectedGender, selectedStatus]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Roll No',
      'Admission No',
      'First Name',
      'Last Name',
      'Class',
      'Section',
      'Gender',
      'DOB',
      'Guardian Name',
      'Guardian Phone',
      'Status',
    ];
    const rows = filteredStudents.map((s) => [
      s.rollNo,
      s.admissionNo,
      `"${s.firstName}"`,
      `"${s.lastName}"`,
      `"${s.className}"`,
      `"${s.section}"`,
      s.gender,
      s.dob,
      `"${s.guardianName}"`,
      s.guardianPhone,
      s.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `students-export-${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenEdit = (student: Student) => {
    setStudentToEdit(student);
    setIsFormOpen(true);
  };

  const handleOpenAdd = () => {
    setStudentToEdit(null);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, roll no, admission ID, parent..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
              title="Download filtered roster as CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
              title="Print student roster"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print Roster</span>
            </button>
            {currentRole === 'Admin' && <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Admit Student</span>
            </button>}
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Class Filter */}
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:border-slate-400 text-xs"
          >
            <option value="all">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} - Sec {c.section}
              </option>
            ))}
          </select>

          {/* Gender Filter */}
          <select
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:border-slate-400 text-xs"
          >
            <option value="all">All Genders</option>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="Other">Other</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:border-slate-400 text-xs"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
            <option value="Graduated">Graduated</option>
            <option value="Inactive">Inactive</option>
          </select>

          {(searchTerm ||
            selectedClassId !== 'all' ||
            selectedGender !== 'all' ||
            selectedStatus !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedClassId('all');
                setSelectedGender('all');
                setSelectedStatus('all');
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 underline ml-2"
            >
              Clear filters
            </button>
          )}

          <div className="ml-auto text-xs text-slate-400 font-mono">
            Showing {filteredStudents.length} of {students.length} students
          </div>
        </div>
      </div>

      {/* Students Data Grid */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {filteredStudents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-medium">
                <tr>
                  <th className="py-3 px-4 w-16">Roll</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Guardian / Emergency</th>
                  <th className="py-3 px-4">DOB & Gender</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                    onClick={() => setDetailStudent(student)}
                  >
                    <td className="py-3 px-4 font-mono font-medium text-slate-900 tabular-nums">
                      #{student.rollNo}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-bold flex items-center justify-center font-mono text-xs shrink-0">
                          {student.firstName[0]}
                          {student.lastName[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {student.firstName} {student.lastName}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {student.admissionNo}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">
                        {student.className}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Sec {student.section}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">
                        {student.guardianName}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {student.guardianPhone}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-slate-700">{student.gender}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {student.dob}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                          student.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : student.status === 'Suspended'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {student.status}
                      </span>
                    </td>

                    <td
                      className="py-3 px-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setDetailStudent(student)}
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                          title="View student profile"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {currentRole === 'Admin' && <button
                          onClick={() => handleOpenEdit(student)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                          title="Edit student"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>}
                        {currentRole === 'Admin' && <button
                          onClick={() => setStudentToDelete(student)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title="Delete student"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                No matching student records found
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Try refining your search filter or admit a new student to this class.
              </p>
            </div>
            {currentRole === 'Admin' && <button
              onClick={handleOpenAdd}
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
            >
              Admit New Student
            </button>}
          </div>
        )}
      </div>

      {/* Modals */}
      <StudentFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        studentToEdit={studentToEdit}
      />

      <StudentDetailModal
        isOpen={!!detailStudent}
        onClose={() => setDetailStudent(null)}
        student={detailStudent}
        onEdit={handleOpenEdit}
        onViewReportCard={onViewReportCard}
        onViewInvoiceReceipt={onViewInvoiceReceipt}
      />

      <ConfirmDialog
        isOpen={currentRole === 'Admin' && !!studentToDelete}
        onClose={() => setStudentToDelete(null)}
        onConfirm={() => {
          if (studentToDelete) {
            deleteStudent(studentToDelete.id);
            setStudentToDelete(null);
          }
        }}
        title="Confirm Student Deletion"
        message={`Are you certain you wish to delete ${studentToDelete?.firstName} ${studentToDelete?.lastName} (Admission No: ${studentToDelete?.admissionNo})? This action will remove associated attendance and fee references.`}
        confirmLabel="Delete Student"
        isDestructive={true}
      />
    </div>
  );
};
