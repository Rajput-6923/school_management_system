import React, { useState, useEffect } from 'react';
import { useSchool } from '../../context/SchoolApiContext';
import { Student, Gender, StudentStatus } from '../../types';
import { Modal } from '../common/Modal';

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentToEdit?: Student | null;
}

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  isOpen,
  onClose,
  studentToEdit,
}) => {
  const { classes, addStudent, updateStudent, isSaving } = useSchool();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    rollNo: '',
    admissionNo: '',
    classId: '',
    gender: 'Female' as Gender,
    dob: '2010-01-01',
    status: 'Active' as StudentStatus,
    bloodGroup: 'O+',
    email: '',
    phone: '',
    address: '',
    guardianName: '',
    guardianRelation: 'Parent',
    guardianPhone: '',
    guardianEmail: '',
  });

  useEffect(() => {
    if (studentToEdit) {
      setFormData({
        firstName: studentToEdit.firstName,
        lastName: studentToEdit.lastName,
        rollNo: studentToEdit.rollNo,
        admissionNo: studentToEdit.admissionNo,
        classId: studentToEdit.classId,
        gender: studentToEdit.gender,
        dob: studentToEdit.dob,
        status: studentToEdit.status,
        bloodGroup: studentToEdit.bloodGroup || 'O+',
        email: studentToEdit.email || '',
        phone: studentToEdit.phone || '',
        address: studentToEdit.address,
        guardianName: studentToEdit.guardianName,
        guardianRelation: studentToEdit.guardianRelation,
        guardianPhone: studentToEdit.guardianPhone,
        guardianEmail: studentToEdit.guardianEmail,
      });
    } else {
      const defaultClassId = classes[0]?.id || 'cls-10a';
      setFormData({
        firstName: '',
        lastName: '',
        rollNo: Math.floor(100 + Math.random() * 900).toString(),
        admissionNo: `ADM-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        classId: defaultClassId,
        gender: 'Female',
        dob: '2010-05-15',
        status: 'Active',
        bloodGroup: 'O+',
        email: '',
        phone: '',
        address: '',
        guardianName: '',
        guardianRelation: 'Parent',
        guardianPhone: '',
        guardianEmail: '',
      });
    }
  }, [studentToEdit, isOpen, classes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim()) return;

    const selectedClass = classes.find((c) => c.id === formData.classId) || classes[0];
    const className = selectedClass ? selectedClass.name : 'Grade 10';
    const section = selectedClass ? selectedClass.section : 'A';

    if (studentToEdit) {
      const saved = await updateStudent(studentToEdit.id, {
        ...formData,
        className,
        section,
      });
      if (saved) onClose();
    } else {
      const saved = await addStudent({
        ...formData,
        className,
        section,
        enrollmentDate: new Date().toISOString().split('T')[0],
      });
      if (saved) onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={studentToEdit ? 'Edit Student Details' : 'Student Admission Form'}
      subtitle="Complete profile and guardian contact information"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic Information */}
        <div>
          <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
            Academic & Personal Identity
          </h4>
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
                placeholder="e.g. Liam"
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
                placeholder="e.g. Vance"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Admission Number *
              </label>
              <input
                type="text"
                required
                value={formData.admissionNo}
                onChange={(e) => setFormData({ ...formData, admissionNo: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Roll Number *
              </label>
              <input
                type="text"
                required
                value={formData.rollNo}
                onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Class / Grade *
              </label>
              <select
                value={formData.classId}
                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} - Section {cls.section} ({cls.roomNumber})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Gender *
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Date of Birth *
              </label>
              <input
                type="date"
                required
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Blood Group
              </label>
              <input
                type="text"
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                placeholder="e.g. O+, A+, B-"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Guardian & Contact Information */}
        <div className="pt-2 border-t border-slate-100">
          <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
            Parent / Guardian Contact
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Guardian Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.guardianName}
                onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                placeholder="e.g. Robert Montgomery"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Relationship
              </label>
              <input
                type="text"
                value={formData.guardianRelation}
                onChange={(e) => setFormData({ ...formData, guardianRelation: e.target.value })}
                placeholder="e.g. Father, Mother, Legal Guardian"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Guardian Emergency Phone *
              </label>
              <input
                type="tel"
                required
                value={formData.guardianPhone}
                onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Guardian Email
              </label>
              <input
                type="email"
                value={formData.guardianEmail}
                onChange={(e) => setFormData({ ...formData, guardianEmail: e.target.value })}
                placeholder="parent@example.com"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Residential Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Street address, City, Postal Code"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
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
            {isSaving ? 'Saving...' : studentToEdit ? 'Save Changes' : 'Confirm Enrollment'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
