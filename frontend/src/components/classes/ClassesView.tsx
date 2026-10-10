import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolApiContext';
import { SchoolClass, Subject } from '../../types';
import {
  Layers,
  BookOpen,
  Plus,
  Users,
  MapPin,
  GraduationCap,
  Edit2,
  Trash2,
  Clock,
  Award,
} from 'lucide-react';
import { ClassFormModal } from './ClassFormModal';
import { SubjectFormModal } from './SubjectFormModal';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const ClassesView: React.FC = () => {
  const { classes, subjects, students, deleteClass, deleteSubject, currentRole } = useSchool();
  const [subTab, setSubTab] = useState<'classes' | 'subjects'>('classes');

  // Modal states
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [classToEdit, setClassToEdit] = useState<SchoolClass | null>(null);
  const [classToDelete, setClassToDelete] = useState<SchoolClass | null>(null);

  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [subjectToEdit, setSubjectToEdit] = useState<Subject | null>(null);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);

  return (
    <div className="space-y-4">
      {/* Tab Switcher & Top CTA */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setSubTab('classes')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              subTab === 'classes'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Classrooms & Sections ({classes.length})
          </button>
          <button
            onClick={() => setSubTab('subjects')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              subTab === 'subjects'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Curriculum & Subjects ({subjects.length})
          </button>
        </div>

        {currentRole === 'Admin' && subTab === 'classes' ? (
          <button
            onClick={() => {
              setClassToEdit(null);
              setIsClassModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Class Section</span>
          </button>
        ) : currentRole === 'Admin' ? (
          <button
            onClick={() => {
              setSubjectToEdit(null);
              setIsSubjectModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Subject</span>
          </button>
        ) : null}
      </div>

      {/* Subtab 1: Classes & Sections */}
      {subTab === 'classes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => {
            const actualEnrolled = students.filter((s) => s.classId === cls.id).length;
            const utilizationPct = Math.min(
              100,
              Math.round((actualEnrolled / (cls.capacity || 30)) * 100)
            );

            return (
              <div
                key={cls.id}
                className="bg-white border border-slate-200 rounded-xl p-4.5 hover:border-slate-300 transition-all shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">
                          {cls.name}
                        </h3>
                        <span className="font-mono font-bold px-2 py-0.5 rounded text-xs bg-indigo-100 text-indigo-700">
                          Sec {cls.section}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{cls.roomNumber}</span>
                      </p>
                    </div>

                    {currentRole === 'Admin' && <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setClassToEdit(cls);
                          setIsClassModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                        title="Edit class"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setClassToDelete(cls)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        title="Delete class"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>}
                  </div>

                  {/* Teacher info */}
                  <div className="py-2.5 px-3 bg-slate-50 border border-slate-100 rounded-lg text-xs space-y-1 mb-3">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">
                      Homeroom Advisor
                    </span>
                    <div className="flex items-center gap-2 text-slate-800 font-medium">
                      <GraduationCap className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="truncate">{cls.classTeacherName}</span>
                    </div>
                  </div>

                  {/* Enrollment Progress */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Student Capacity</span>
                      <span className="font-mono font-semibold text-slate-900 tabular-nums">
                        {actualEnrolled} / {cls.capacity} ({utilizationPct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          utilizationPct > 90 ? 'bg-amber-500' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${utilizationPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Grade Level: {cls.gradeLevel}</span>
                  <span className="font-mono">
                    {students.filter((s) => s.classId === cls.id).length} registered
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Subtab 2: Subjects Catalog */}
      {subTab === 'subjects' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-medium">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Subject Title</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Target Grade</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Lead Instructor</th>
                  <th className="py-3 px-4 text-center">Credits / Hrs</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subjects.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {sub.code}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {sub.name}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{sub.department}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      Grade {sub.gradeLevel}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          sub.type === 'Core'
                            ? 'bg-indigo-50 text-indigo-700'
                            : sub.type === 'Elective'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {sub.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-800">{sub.teacherName}</td>
                    <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-600">
                      {sub.credits} cr · {sub.hoursPerWeek} hrs/wk
                    </td>
                    <td className="py-3 px-4 text-right">
                      {currentRole === 'Admin' && <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setSubjectToEdit(sub);
                            setIsSubjectModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                          title="Edit subject"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setSubjectToDelete(sub)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title="Delete subject"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Class Modals */}
      <ClassFormModal
        isOpen={isClassModalOpen}
        onClose={() => setIsClassModalOpen(false)}
        classToEdit={classToEdit}
      />

      <ConfirmDialog
        isOpen={currentRole === 'Admin' && !!classToDelete}
        onClose={() => setClassToDelete(null)}
        onConfirm={() => {
          if (classToDelete) {
            deleteClass(classToDelete.id);
            setClassToDelete(null);
          }
        }}
        title="Delete Class Section"
        message={`Are you sure you want to delete ${classToDelete?.name} (${classToDelete?.section})?`}
        confirmLabel="Delete Class"
        isDestructive={true}
      />

      {/* Subject Modals */}
      <SubjectFormModal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        subjectToEdit={subjectToEdit}
      />

      <ConfirmDialog
        isOpen={currentRole === 'Admin' && !!subjectToDelete}
        onClose={() => setSubjectToDelete(null)}
        onConfirm={() => {
          if (subjectToDelete) {
            deleteSubject(subjectToDelete.id);
            setSubjectToDelete(null);
          }
        }}
        title="Delete Subject"
        message={`Are you sure you want to delete ${subjectToDelete?.name} (${subjectToDelete?.code})?`}
        confirmLabel="Delete Subject"
        isDestructive={true}
      />
    </div>
  );
};
