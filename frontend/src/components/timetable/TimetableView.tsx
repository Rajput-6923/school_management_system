import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolApiContext';
import { TimetableSlot, DayOfWeek } from '../../types';
import { Clock, Plus, Printer, Edit2, Trash2, MapPin, User } from 'lucide-react';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const TimetableView: React.FC = () => {
  const {
    classes,
    subjects,
    teachers,
    timetableSlots,
    addTimetableSlot,
    updateTimetableSlot,
    deleteTimetableSlot,
    settings,
    isSaving,
  } = useSchool();

  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || 'cls-10a');
  const selectedClass = classes.find((c) => c.id === selectedClassId);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [slotToEdit, setSlotToEdit] = useState<TimetableSlot | null>(null);
  const [slotToDelete, setSlotToDelete] = useState<TimetableSlot | null>(null);

  const [formData, setFormData] = useState({
    day: 'Monday' as DayOfWeek,
    periodNumber: 1,
    startTime: '08:30',
    endTime: '09:15',
    subjectId: subjects[0]?.id || '',
    teacherId: teachers[0]?.id || '',
    roomNumber: 'Room 301',
  });

  const days: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const periods = [1, 2, 3, 4, 5, 6];

  // Default times for periods
  const periodTimes: Record<number, { start: string; end: string }> = {
    1: { start: '08:30', end: '09:15' },
    2: { start: '09:20', end: '10:05' },
    3: { start: '10:20', end: '11:05' },
    4: { start: '11:10', end: '11:55' },
    5: { start: '13:00', end: '13:45' },
    6: { start: '13:50', end: '14:35' },
  };

  const handleOpenAdd = (day?: DayOfWeek, periodNumber?: number) => {
    setSlotToEdit(null);
    const p = periodNumber || 1;
    const times = periodTimes[p] || { start: '08:30', end: '09:15' };
    setFormData({
      day: day || 'Monday',
      periodNumber: p,
      startTime: times.start,
      endTime: times.end,
      subjectId: subjects[0]?.id || '',
      teacherId: teachers[0]?.id || '',
      roomNumber: selectedClass?.roomNumber || 'Room 301',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (slot: TimetableSlot) => {
    setSlotToEdit(slot);
    const matchedSubj = subjects.find((s) => s.name === slot.subjectName);
    const matchedTeacher = teachers.find(
      (t) => `${t.firstName} ${t.lastName}` === slot.teacherName
    );

    setFormData({
      day: slot.day,
      periodNumber: slot.periodNumber,
      startTime: slot.startTime,
      endTime: slot.endTime,
      subjectId: matchedSubj?.id || subjects[0]?.id || '',
      teacherId: matchedTeacher?.id || teachers[0]?.id || '',
      roomNumber: slot.roomNumber,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const subj = subjects.find((s) => s.id === formData.subjectId);
    const teacher = teachers.find((t) => t.id === formData.teacherId);

    const slotPayload = {
      classId: selectedClassId,
      day: formData.day,
      periodNumber: Number(formData.periodNumber),
      startTime: formData.startTime,
      endTime: formData.endTime,
      subjectName: subj?.name || 'Class Subject',
      subjectCode: subj?.code || 'GEN-101',
      teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Instructor',
      roomNumber: formData.roomNumber,
    };

    if (slotToEdit) {
      if (await updateTimetableSlot(slotToEdit.id, slotPayload)) setIsModalOpen(false);
    } else {
      if (await addTimetableSlot(slotPayload)) setIsModalOpen(false);
    }
  };

  // Filter slots for this class
  const classSlots = timetableSlots.filter((s) => s.classId === selectedClassId);

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Select Class Timetable
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 bg-white font-medium"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} - Section {c.section}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-slate-500 pt-3 sm:pt-4">
            Room: <span className="font-medium text-slate-900">{selectedClass?.roomNumber}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Timetable</span>
          </button>
          <button
            onClick={() => handleOpenAdd()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Period Slot</span>
          </button>
        </div>
      </div>

      {/* Weekly Schedule Grid */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-3 border-b border-slate-200 bg-slate-50/75 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-900">
            {selectedClass?.name} ({selectedClass?.section}) · Weekly Schedule
          </span>
          <span className="text-slate-500 font-mono">Academic Term {settings.academicYear}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 w-28 border-r border-slate-200 font-semibold">
                  Day / Period
                </th>
                {periods.map((p) => {
                  const t = periodTimes[p];
                  return (
                    <th key={p} className="py-2.5 px-3 border-r border-slate-200 text-center">
                      <div className="font-semibold text-slate-900">Period {p}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {t?.start} - {t?.end}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {days.map((day) => (
                <tr key={day} className="hover:bg-slate-50/30">
                  <td className="py-3 px-3 font-bold text-slate-900 bg-slate-50/60 border-r border-slate-200">
                    {day}
                  </td>

                  {periods.map((periodNumber) => {
                    const slot = classSlots.find(
                      (s) => s.day === day && s.periodNumber === periodNumber
                    );

                    return (
                      <td
                        key={periodNumber}
                        className="p-2 border-r border-slate-200 align-top h-24 min-w-[170px]"
                      >
                        {slot ? (
                          <div className="h-full p-2.5 bg-indigo-50/60 border border-indigo-100 rounded-lg flex flex-col justify-between group hover:border-indigo-300 transition-colors">
                            <div>
                              <div className="flex items-start justify-between gap-1">
                                <span className="font-bold text-slate-900 line-clamp-1 leading-tight">
                                  {slot.subjectName}
                                </span>
                                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                                  <button
                                    onClick={() => handleOpenEdit(slot)}
                                    className="p-0.5 text-slate-500 hover:text-indigo-600"
                                    title="Edit slot"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => setSlotToDelete(slot)}
                                    className="p-0.5 text-slate-500 hover:text-rose-600"
                                    title="Delete slot"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                              <span className="text-[10px] text-indigo-700 font-mono block mt-0.5">
                                {slot.subjectCode}
                              </span>
                            </div>

                            <div className="mt-2 pt-1.5 border-t border-indigo-100/70 text-[11px] text-slate-600 space-y-0.5">
                              <div className="flex items-center gap-1 truncate">
                                <User className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{slot.teacherName}</span>
                              </div>
                              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span>{slot.roomNumber}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenAdd(day, periodNumber)}
                            className="w-full h-full border border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-300 hover:text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all p-2 text-center"
                          >
                            <Plus className="w-4 h-4 mb-0.5" />
                            <span className="text-[10px]">Add period</span>
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Period Slot Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={slotToEdit ? 'Edit Timetable Period' : 'Assign Timetable Period'}
        subtitle={`${selectedClass?.name} (${selectedClass?.section})`}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Day of Week *
              </label>
              <select
                value={formData.day}
                onChange={(e) => setFormData({ ...formData, day: e.target.value as DayOfWeek })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 bg-white"
              >
                {days.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Period Number *
              </label>
              <select
                value={formData.periodNumber}
                onChange={(e) => {
                  const p = Number(e.target.value);
                  const times = periodTimes[p];
                  setFormData({
                    ...formData,
                    periodNumber: p,
                    startTime: times?.start || formData.startTime,
                    endTime: times?.end || formData.endTime,
                  });
                }}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 bg-white"
              >
                {periods.map((p) => (
                  <option key={p} value={p}>
                    Period {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 bg-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                End Time
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 bg-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Subject *
            </label>
            <select
              value={formData.subjectId}
              onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 bg-white"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Teacher / Instructor *
            </label>
            <select
              value={formData.teacherId}
              onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 bg-white"
            >
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.firstName} {t.lastName} ({t.department})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Assigned Room
            </label>
            <input
              type="text"
              value={formData.roomNumber}
              onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
            >
              {isSaving ? 'Saving...' : 'Save Period'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Slot Dialog */}
      <ConfirmDialog
        isOpen={!!slotToDelete}
        onClose={() => setSlotToDelete(null)}
        onConfirm={() => {
          if (slotToDelete) {
            deleteTimetableSlot(slotToDelete.id);
            setSlotToDelete(null);
          }
        }}
        title="Remove Timetable Period"
        message={`Are you sure you want to remove ${slotToDelete?.subjectName} on ${slotToDelete?.day} (Period ${slotToDelete?.periodNumber})?`}
        confirmLabel="Remove Slot"
        isDestructive={true}
      />
    </div>
  );
};
