import React, { useState, useEffect, useMemo } from 'react';
import { useSchool } from '../../context/SchoolApiContext';
import { AttendanceStatus, DailyAttendance } from '../../types';
import {
  CalendarCheck,
  CheckCircle,
  Clock,
  XCircle,
  HelpCircle,
  Save,
  Calendar,
  Check,
  RotateCcw,
  Users,
  Search,
} from 'lucide-react';

export const AttendanceView: React.FC = () => {
  const { classes, students, attendance, saveAttendance, isSaving } = useSchool();

  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || 'cls-10a');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [searchTerm, setSearchTerm] = useState('');

  // Local state for the selected day's records
  const [currentRecords, setCurrentRecords] = useState<
    Record<string, { status: AttendanceStatus; remarks: string }>
  >({});

  const classStudents = useMemo(() => {
    return students.filter((s) => s.classId === selectedClassId);
  }, [students, selectedClassId]);

  // Load existing records for the class and date if available
  useEffect(() => {
    const existingEntry = attendance.find(
      (a) => a.classId === selectedClassId && a.date === selectedDate
    );

    const initialMap: Record<string, { status: AttendanceStatus; remarks: string }> = {};

    classStudents.forEach((student) => {
      const match = existingEntry?.records.find((r) => r.studentId === student.id);
      if (match) {
        initialMap[student.id] = {
          status: match.status,
          remarks: match.remarks || '',
        };
      } else {
        // Default to Present
        initialMap[student.id] = {
          status: 'Present',
          remarks: '',
        };
      }
    });

    setCurrentRecords(initialMap);
  }, [selectedClassId, selectedDate, classStudents, attendance]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setCurrentRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setCurrentRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks,
      },
    }));
  };

  // Bulk actions
  const handleMarkAll = (status: AttendanceStatus) => {
    const next: Record<string, { status: AttendanceStatus; remarks: string }> = {};
    classStudents.forEach((s) => {
      next[s.id] = {
        status,
        remarks: currentRecords[s.id]?.remarks || '',
      };
    });
    setCurrentRecords(next);
  };

  // Save Attendance
  const handleSaveAttendance = async () => {
    const selectedClass = classes.find((c) => c.id === selectedClassId);
    const recordsList = classStudents.map((s) => ({
      studentId: s.id,
      studentName: `${s.firstName} ${s.lastName}`,
      rollNo: s.rollNo,
      status: currentRecords[s.id]?.status || 'Present',
      remarks: currentRecords[s.id]?.remarks || '',
    }));

    const attendanceRecord: DailyAttendance = {
      id: `att-${selectedClassId}-${selectedDate}`,
      date: selectedDate,
      classId: selectedClassId,
      records: recordsList,
      markedAt: new Date().toISOString(),
      markedBy: selectedClass?.classTeacherName || 'Class Instructor',
    };

    await saveAttendance(attendanceRecord);
  };

  // Stats calculation
  const stats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;

    classStudents.forEach((s) => {
      const st = currentRecords[s.id]?.status;
      if (st === 'Present') present++;
      else if (st === 'Absent') absent++;
      else if (st === 'Late') late++;
      else if (st === 'Excused') excused++;
    });

    const total = classStudents.length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;

    return { total, present, absent, late, excused, rate };
  }, [classStudents, currentRecords]);

  // Filter roster
  const displayedStudents = classStudents.filter((s) =>
    `${s.firstName} ${s.lastName} ${s.rollNo}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Top Toolbar: Class & Date selector */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Select Class & Section
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white font-medium"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} - Section {c.section} ({c.roomNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Attendance Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Quick Bulk and Save CTA */}
          <div className="flex items-center gap-2 pt-2 md:pt-0">
            <button
              onClick={() => handleMarkAll('Present')}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors whitespace-nowrap shrink-0"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark All Present</span>
            </button>
            <button
              onClick={handleSaveAttendance}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Register'}</span>
            </button>
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[11px] text-slate-500">Enrolled Roster</span>
            <p className="text-base font-bold font-mono text-slate-900 mt-0.5">
              {stats.total} students
            </p>
          </div>
          <div className="p-2.5 bg-emerald-50/70 rounded-lg border border-emerald-100">
            <span className="text-[11px] text-emerald-700">Present</span>
            <p className="text-base font-bold font-mono text-emerald-800 mt-0.5">
              {stats.present} ({stats.rate}%)
            </p>
          </div>
          <div className="p-2.5 bg-rose-50/70 rounded-lg border border-rose-100">
            <span className="text-[11px] text-rose-700">Absent</span>
            <p className="text-base font-bold font-mono text-rose-800 mt-0.5">
              {stats.absent}
            </p>
          </div>
          <div className="p-2.5 bg-amber-50/70 rounded-lg border border-amber-100">
            <span className="text-[11px] text-amber-700">Late Arrival</span>
            <p className="text-base font-bold font-mono text-amber-800 mt-0.5">
              {stats.late}
            </p>
          </div>
          <div className="p-2.5 bg-slate-100 rounded-lg border border-slate-200">
            <span className="text-[11px] text-slate-600">Excused</span>
            <p className="text-base font-bold font-mono text-slate-800 mt-0.5">
              {stats.excused}
            </p>
          </div>
        </div>
      </div>

      {/* Roster Search & Roll Call Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-3 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3">
          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter roster by student name..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
            />
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {displayedStudents.length} students in section
          </span>
        </div>

        {displayedStudents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-16">Roll</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Attendance Status</th>
                  <th className="py-3 px-4">Notes / Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedStudents.map((student) => {
                  const current = currentRecords[student.id] || {
                    status: 'Present',
                    remarks: '',
                  };

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        #{student.rollNo}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {student.firstName} {student.lastName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {student.admissionNo}
                        </div>
                      </td>

                      {/* Status Selector Segmented Buttons */}
                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                          {(
                            [
                              { key: 'Present', color: 'bg-emerald-600 text-white' },
                              { key: 'Late', color: 'bg-amber-600 text-white' },
                              { key: 'Absent', color: 'bg-rose-600 text-white' },
                              { key: 'Excused', color: 'bg-slate-700 text-white' },
                            ] as const
                          ).map((item) => (
                            <button
                              key={item.key}
                              type="button"
                              onClick={() => handleStatusChange(student.id, item.key)}
                              className={`px-2.5 py-1 text-xs font-medium rounded transition-all ${
                                current.status === item.key
                                  ? `${item.color} shadow-xs font-semibold`
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              {item.key}
                            </button>
                          ))}
                        </div>
                      </td>

                      {/* Remarks */}
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={current.remarks}
                          onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                          placeholder="Optional remark (e.g. excused sick, bus delay)..."
                          className="w-full max-w-sm px-2.5 py-1 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-slate-400 bg-white"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-400">
            No students found in this class section.
          </div>
        )}
      </div>
    </div>
  );
};
