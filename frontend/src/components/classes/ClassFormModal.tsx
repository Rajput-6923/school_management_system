import React, { useState, useEffect } from 'react';
import { useSchool } from '../../context/SchoolApiContext';
import { SchoolClass } from '../../types';
import { Modal } from '../common/Modal';

interface ClassFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  classToEdit?: SchoolClass | null;
}

export const ClassFormModal: React.FC<ClassFormModalProps> = ({
  isOpen,
  onClose,
  classToEdit,
}) => {
  const { teachers, addClass, updateClass, isSaving } = useSchool();

  const [formData, setFormData] = useState({
    name: 'Grade 10',
    gradeLevel: 10,
    section: 'A',
    classTeacherId: '',
    roomNumber: 'Room 301',
    capacity: 30,
  });

  useEffect(() => {
    if (classToEdit) {
      setFormData({
        name: classToEdit.name,
        gradeLevel: classToEdit.gradeLevel,
        section: classToEdit.section,
        classTeacherId: classToEdit.classTeacherId,
        roomNumber: classToEdit.roomNumber,
        capacity: classToEdit.capacity,
      });
    } else {
      setFormData({
        name: 'Grade 10',
        gradeLevel: 10,
        section: 'A',
        classTeacherId: teachers[0]?.id || '',
        roomNumber: 'Room 201',
        capacity: 30,
      });
    }
  }, [classToEdit, isOpen, teachers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const assignedTeacher = teachers.find((t) => t.id === formData.classTeacherId);
    const classTeacherName = assignedTeacher
      ? `${assignedTeacher.firstName} ${assignedTeacher.lastName}`
      : 'Unassigned';

    if (classToEdit) {
      const saved = await updateClass(classToEdit.id, {
        ...formData,
        classTeacherName,
      });
      if (saved) onClose();
    } else {
      const saved = await addClass({
        ...formData,
        classTeacherName,
        enrolledCount: 0,
        subjectsCount: 5,
      });
      if (saved) onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={classToEdit ? 'Edit Class Configuration' : 'Create New Class Section'}
      subtitle="Define grade level, section, homeroom teacher, and room allocation"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Grade / Class Name *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Grade 10"
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Grade Level (Numeric) *
            </label>
            <input
              type="number"
              min="1"
              max="12"
              required
              value={formData.gradeLevel}
              onChange={(e) => setFormData({ ...formData, gradeLevel: Number(e.target.value) })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Section *
            </label>
            <input
              type="text"
              required
              maxLength={2}
              value={formData.section}
              onChange={(e) => setFormData({ ...formData, section: e.target.value.toUpperCase() })}
              placeholder="e.g. A, B, C"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Homeroom / Class Teacher
          </label>
          <select
            value={formData.classTeacherId}
            onChange={(e) => setFormData({ ...formData, classTeacherId: e.target.value })}
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
              Room / Hall Number
            </label>
            <input
              type="text"
              value={formData.roomNumber}
              onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
              placeholder="e.g. Room 301 (East Wing)"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Student Capacity
            </label>
            <input
              type="number"
              min="5"
              max="60"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
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
            {isSaving ? 'Saving...' : classToEdit ? 'Save Changes' : 'Create Section'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
