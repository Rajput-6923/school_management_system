import React from 'react';
import { useSchool } from '../../context/SchoolApiContext';
import { Teacher } from '../../types';
import { Modal } from '../common/Modal';
import {
  GraduationCap,
  Mail,
  Phone,
  Briefcase,
  BookOpen,
  Calendar,
  MapPin,
  Clock,
  Printer,
} from 'lucide-react';

interface TeacherDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: Teacher | null;
  onEdit: (teacher: Teacher) => void;
}

export const TeacherDetailModal: React.FC<TeacherDetailModalProps> = ({
  isOpen,
  onClose,
  teacher,
  onEdit,
}) => {
  const { timetableSlots } = useSchool();

  if (!teacher) return null;

  // Timetable periods taught by this teacher
  const teacherPeriods = timetableSlots.filter((t) =>
    t.teacherName.toLowerCase().includes(teacher.lastName.toLowerCase())
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Faculty Dossier"
      subtitle={`${teacher.firstName} ${teacher.lastName} · ${teacher.designation}`}
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {/* Profile Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-indigo-900 text-white font-bold flex items-center justify-center text-lg shadow-xs font-mono">
              {teacher.firstName[0]}
              {teacher.lastName[0]}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {teacher.firstName} {teacher.lastName}
              </h3>
              <p className="text-xs text-indigo-700 font-medium">
                {teacher.designation} · {teacher.department}
              </p>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                ID: {teacher.employeeId} · Joined {teacher.joiningDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onEdit(teacher);
              }}
              className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
            >
              Edit Profile
            </button>
          </div>
        </div>

        {/* Credentials and Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
            <h4 className="font-semibold text-slate-900 uppercase tracking-wider text-[11px]">
              Academic Background
            </h4>
            <div className="space-y-2">
              <div>
                <span className="text-slate-500">Qualification</span>
                <p className="font-medium text-slate-900 mt-0.5">{teacher.qualification}</p>
              </div>
              <div>
                <span className="text-slate-500">Experience</span>
                <p className="font-mono text-slate-900 mt-0.5">
                  {teacher.experienceYears} academic years
                </p>
              </div>
              {teacher.assignedClass && (
                <div>
                  <span className="text-slate-500">Homeroom Advisor</span>
                  <p className="font-semibold text-indigo-700 mt-0.5">
                    {teacher.assignedClass}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
            <h4 className="font-semibold text-slate-900 uppercase tracking-wider text-[11px]">
              Direct Contact
            </h4>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-slate-700">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono">{teacher.email}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono">{teacher.phone || 'Extension 204'}</span>
              </div>
              <div className="flex items-start gap-2 text-slate-700">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>{teacher.address || 'Springfield Academy Campus'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Subjects taught */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
          <h4 className="font-semibold text-slate-900 uppercase tracking-wider text-[11px]">
            Subjects & Curricula Taught
          </h4>
          <div className="flex flex-wrap gap-2 pt-1">
            {teacher.subjects.map((sub, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 text-xs bg-slate-100 text-slate-700 rounded-md font-medium"
              >
                {sub}
              </span>
            ))}
          </div>
        </div>

        {/* Weekly Classes Schedule for Teacher */}
        <div className="space-y-2">
          <h4 className="font-semibold text-slate-900 uppercase tracking-wider text-[11px]">
            Weekly Teaching Schedule ({teacherPeriods.length} periods assigned)
          </h4>
          {teacherPeriods.length > 0 ? (
            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs overflow-hidden">
              {teacherPeriods.map((period) => (
                <div
                  key={period.id}
                  className="px-4 py-2.5 flex items-center justify-between hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-800 w-20">{period.day}</span>
                    <span className="font-mono text-slate-500">
                      Period #{period.periodNumber} ({period.startTime} - {period.endTime})
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-indigo-700">{period.subjectName}</span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {period.roomNumber}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-lg">
              No periodic slots assigned in current timetable.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
};
