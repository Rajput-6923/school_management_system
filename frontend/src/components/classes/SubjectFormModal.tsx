import React, { useState, useEffect } from 'react';
import { useSchool } from '../../context/SchoolApiContext';
import { Subject } from '../../types';
import { Modal } from '../common/Modal';

interface SubjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectToEdit?: Subject | null;
}

export const SubjectFormModal: React.FC<SubjectFormModalProps> = ({
  isOpen,
  onClose,
  subjectToEdit,
}) => {
  const { teachers, addSubject, updateSubject, isSaving } = useSchool();

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    department: 'Mathematics',
    gradeLevel: 10,
    teacherId: '',
    credits: 3,
    hoursPerWeek: 4,
    type: 'Core' as 'Core' | 'Elective' | 'Practical',
  });

  useEffect(() => {
    if (subjectToEdit) {
      setFormData({
        code: subjectToEdit.code,
        name: subjectToEdit.name,
        department: subjectToEdit.department,
        gradeLevel: subjectToEdit.gradeLevel,
        teacherId: subjectToEdit.teacherId,
        credits: subjectToEdit.credits,
        hoursPerWeek: subjectToEdit.hoursPerWeek,
        type: subjectToEdit.type,
      });
    } else {
      setFormData({
        code: `SUB-${Math.floor(100 + Math.random() * 900)}`,
        name: '',
        department: 'Science',
        gradeLevel: 10,
        teacherId: teachers[0]?.id || '',
        credits: 3,
        hoursPerWeek: 4,
        type: 'Core',
      });
    }
  }, [subjectToEdit, isOpen, teachers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) return;

    const teacher = teachers.find((t) => t.id === formData.teacherId);
    const teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Unassigned';

    if (subjectToEdit) {
      const saved = await updateSubject(subjectToEdit.id, {
        ...formData,
        teacherName,
      });
      if (saved) onClose();
    } else {
      const saved = await addSubject({
        ...formData,
        teacherName,
      });
      if (saved) onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={subjectToEdit ? 'Edit Subject Curriculum' : 'Register New Subject'}
      subtitle="Define subject code, faculty instructor, credits and type"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Subject Code *
            </label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g. MTH-101"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Target Grade Level
            </label>
            <input
              type="number"
              min="1"
              max="12"
              value={formData.gradeLevel}
              onChange={(e) => setFormData({ ...formData, gradeLevel: Number(e.target.value) })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Subject Title *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Advanced Inorganic Chemistry"
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Department
            </label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
            >
              <option value="Mathematics">Mathematics</option>
              <option value="Science">Science</option>
              <option value="Technology">Technology</option>
              <option value="Languages & Humanities">Languages & Humanities</option>
              <option value="Fine Arts">Fine Arts</option>
              <option value="Physical Education">Physical Education</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Curriculum Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
            >
              <option value="Core">Core</option>
              <option value="Elective">Elective</option>
              <option value="Practical">Practical / Lab</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Assigned Lead Instructor
          </label>
          <select
            value={formData.teacherId}
            onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
          >
            <option value="">Unassigned</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.firstName} {t.lastName} ({t.department})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Credit Hours
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={formData.credits}
              onChange={(e) => setFormData({ ...formData, credits: Number(e.target.value) })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Periods / Week
            </label>
            <input
              type="number"
              min="1"
              max="15"
              value={formData.hoursPerWeek}
              onChange={(e) => setFormData({ ...formData, hoursPerWeek: Number(e.target.value) })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 shadow-xs"
          >
            {isSaving ? 'Saving...' : subjectToEdit ? 'Save Changes' : 'Register Subject'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
