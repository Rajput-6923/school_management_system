import React, { useState, useMemo } from 'react';
import { useSchool } from '../../context/SchoolApiContext';
import { Teacher } from '../../types';
import {
  Search,
  Plus,
  Mail,
  Phone,
  GraduationCap,
  Briefcase,
  Edit2,
  Trash2,
  Eye,
  Filter,
} from 'lucide-react';
import { TeacherFormModal } from './TeacherFormModal';
import { TeacherDetailModal } from './TeacherDetailModal';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const TeachersView: React.FC = () => {
  const { teachers, deleteTeacher, currentRole } = useSchool();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [teacherToEdit, setTeacherToEdit] = useState<Teacher | null>(null);
  const [detailTeacher, setDetailTeacher] = useState<Teacher | null>(null);
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);

  const departments = useMemo(() => {
    const set = new Set<string>();
    teachers.forEach((t) => set.add(t.department));
    return Array.from(set);
  }, [teachers]);

  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      const matchSearch =
        `${t.firstName} ${t.lastName} ${t.employeeId} ${t.department} ${t.subjects.join(' ')}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchDept = selectedDept === 'all' || t.department === selectedDept;

      return matchSearch && matchDept;
    });
  }, [teachers, searchTerm, selectedDept]);

  const handleOpenAdd = () => {
    setTeacherToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (t: Teacher) => {
    setTeacherToEdit(t);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search faculty by name, department, subjects..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            {currentRole === 'Admin' && <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Faculty Member</span>
            </button>}
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Department:</span>
          </div>
          <button
            onClick={() => setSelectedDept('all')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              selectedDept === 'all'
                ? 'bg-slate-900 text-white font-medium shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            All Departments ({teachers.length})
          </button>
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                selectedDept === dept
                  ? 'bg-slate-900 text-white font-medium shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              {dept}
            </button>
          ))}

          <div className="ml-auto text-xs text-slate-400 font-mono">
            Showing {filteredTeachers.length} educators
          </div>
        </div>
      </div>

      {/* Grid of Teachers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeachers.map((teacher) => (
          <div
            key={teacher.id}
            className="bg-white border border-slate-200 rounded-xl p-4.5 hover:border-slate-300 transition-all shadow-xs flex flex-col justify-between"
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold flex items-center justify-center font-mono text-sm shrink-0">
                    {teacher.firstName[0]}
                    {teacher.lastName[0]}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors">
                      {teacher.firstName} {teacher.lastName}
                    </h3>
                    <p className="text-[11px] text-slate-500">{teacher.designation}</p>
                  </div>
                </div>

                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  {teacher.department}
                </span>
              </div>

              {/* Specs */}
              <div className="space-y-2 text-xs py-2 border-y border-slate-100">
                <div className="flex items-center gap-2 text-slate-600">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{teacher.qualification}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate font-mono">{teacher.email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono">{teacher.phone}</span>
                </div>
              </div>

              {/* Subjects tags */}
              <div className="mt-3">
                <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider mb-1.5">
                  Subjects Taught
                </div>
                <div className="flex flex-wrap gap-1">
                  {teacher.subjects.map((sub, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] px-2 py-0.5 bg-slate-50 border border-slate-200/70 rounded text-slate-700"
                    >
                      {sub}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-3.5 mt-3.5 border-t border-slate-100">
              <span className="text-[11px] font-mono text-slate-400">
                {teacher.assignedClass ? teacher.assignedClass : 'Subject Faculty'}
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setDetailTeacher(teacher)}
                  className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                  title="View full teacher profile"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                {currentRole === 'Admin' && <button
                  onClick={() => handleOpenEdit(teacher)}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                  title="Edit teacher"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>}
                {currentRole === 'Admin' && <button
                  onClick={() => setTeacherToDelete(teacher)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                  title="Delete teacher"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      <TeacherFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        teacherToEdit={teacherToEdit}
      />

      <TeacherDetailModal
        isOpen={!!detailTeacher}
        onClose={() => setDetailTeacher(null)}
        teacher={detailTeacher}
        onEdit={handleOpenEdit}
      />

      <ConfirmDialog
        isOpen={currentRole === 'Admin' && !!teacherToDelete}
        onClose={() => setTeacherToDelete(null)}
        onConfirm={() => {
          if (teacherToDelete) {
            deleteTeacher(teacherToDelete.id);
            setTeacherToDelete(null);
          }
        }}
        title="Remove Faculty Member"
        message={`Are you sure you want to remove ${teacherToDelete?.firstName} ${teacherToDelete?.lastName} from the faculty register?`}
        confirmLabel="Remove Faculty"
        isDestructive={true}
      />
    </div>
  );
};
