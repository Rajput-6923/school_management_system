import React, { useState, useEffect } from 'react';
import { useSchool } from '../../context/SchoolApiContext';
import { Teacher, Gender } from '../../types';
import { Modal } from '../common/Modal';

interface TeacherFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherToEdit?: Teacher | null;
}

export const TeacherFormModal: React.FC<TeacherFormModalProps> = ({
  isOpen,
  onClose,
  teacherToEdit,
}) => {
  const { addTeacher, updateTeacher, isSaving } = useSchool();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    employeeId: '',
    email: '',
    phone: '',
    gender: 'Female' as Gender,
    qualification: '',
    department: 'Mathematics',
    designation: 'Senior Teacher',
    joiningDate: '2022-08-01',
    address: '',
    subjects: 'Mathematics',
    assignedClass: '',
    experienceYears: 5,
  });

  useEffect(() => {
    if (teacherToEdit) {
      setFormData({
        firstName: teacherToEdit.firstName,
        lastName: teacherToEdit.lastName,
        employeeId: teacherToEdit.employeeId,
        email: teacherToEdit.email,
        phone: teacherToEdit.phone,
        gender: teacherToEdit.gender,
        qualification: teacherToEdit.qualification,
        department: teacherToEdit.department,
        designation: teacherToEdit.designation,
        joiningDate: teacherToEdit.joiningDate,
        address: teacherToEdit.address,
        subjects: teacherToEdit.subjects.join(', '),
        assignedClass: teacherToEdit.assignedClass || '',
        experienceYears: teacherToEdit.experienceYears,
      });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        employeeId: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
        email: '',
        phone: '',
        gender: 'Female',
        qualification: 'M.Ed / M.Sc.',
        department: 'Science',
        designation: 'Faculty Instructor',
        joiningDate: new Date().toISOString().split('T')[0],
        address: '',
        subjects: 'Physics, Science',
        assignedClass: '',
        experienceYears: 4,
      });
    }
  }, [teacherToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim()) return;

    const subjectsArray = formData.subjects
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const teacherData = {
      ...formData,
      subjects: subjectsArray,
    };

    if (teacherToEdit) {
      if (await updateTeacher(teacherToEdit.id, teacherData)) onClose();
    } else {
      if (await addTeacher(teacherData)) onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={teacherToEdit ? 'Edit Teacher Record' : 'Add New Faculty Member'}
      subtitle="Institutional staff qualifications and credentials"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              First Name *
            </label>
            <input
              type="text"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              placeholder="e.g. Katherine"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Last Name *
            </label>
            <input
              type="text"
              required
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              placeholder="e.g. Reynolds"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Employee ID *
            </label>
            <input
              type="text"
              required
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Department *
            </label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
            >
              <option value="Mathematics">Mathematics</option>
              <option value="Science">Science</option>
              <option value="Technology">Technology & Computer Science</option>
              <option value="Languages & Humanities">Languages & Humanities</option>
              <option value="Fine Arts">Fine Arts</option>
              <option value="Physical Education">Physical Education</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Designation *
            </label>
            <input
              type="text"
              required
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              placeholder="e.g. Senior Faculty / Head of Dept"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Highest Qualification
            </label>
            <input
              type="text"
              value={formData.qualification}
              onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
              placeholder="e.g. Ph.D. Physics (Stanford)"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Official Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="teacher@oakridge-academy.edu"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 (555) 000-0000"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Subjects Taught (comma separated)
            </label>
            <input
              type="text"
              value={formData.subjects}
              onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
              placeholder="e.g. Advanced Physics, Astrophysics, Science Lab"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Homeroom / Assigned Class
            </label>
            <input
              type="text"
              value={formData.assignedClass}
              onChange={(e) => setFormData({ ...formData, assignedClass: e.target.value })}
              placeholder="e.g. Grade 10 - B"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Years of Teaching Experience
            </label>
            <input
              type="number"
              min="0"
              value={formData.experienceYears}
              onChange={(e) => setFormData({ ...formData, experienceYears: Number(e.target.value) })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white font-mono"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
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
            {isSaving ? 'Saving...' : teacherToEdit ? 'Save Changes' : 'Register Faculty'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
