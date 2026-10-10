import React from 'react';
import { useSchool } from '../../context/SchoolApiContext';
import {
  Users,
  GraduationCap,
  Layers,
  CalendarCheck,
  CreditCard,
  FileSpreadsheet,
  ArrowUpRight,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Megaphone,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface DashboardViewProps {
  onOpenAddStudent: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onOpenAddStudent }) => {
  const {
    students,
    teachers,
    classes,
    attendance,
    invoices,
    exams,
    results,
    notices,
    settings,
    setActiveTab,
    currentRole,
  } = useSchool();

  // Metrics
  const totalStudents = students.length;
  const activeStudents = students.filter((s) => s.status === 'Active').length;
  const totalTeachers = teachers.length;
  const totalClasses = classes.length;

  // Attendance metrics for today / most recent
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendanceList = attendance.filter((a) => a.date === todayStr);

  let presentCount = 0;
  let totalMarked = 0;
  let absentCount = 0;
  let lateCount = 0;

  todayAttendanceList.forEach((att) => {
    att.records.forEach((rec) => {
      totalMarked++;
      if (rec.status === 'Present') presentCount++;
      if (rec.status === 'Absent') absentCount++;
      if (rec.status === 'Late') lateCount++;
    });
  });

  const attendanceRate =
    totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : 0;

  // Financial metrics
  const totalBilled = invoices.reduce((acc, inv) => acc + inv.amount, 0);
  const totalCollected = invoices.reduce((acc, inv) => acc + inv.paidAmount, 0);
  const totalOutstanding = Math.max(0, totalBilled - totalCollected);
  const collectionRate =
    totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

  const weeklyAttendanceData = (() => {
    const days: { day: string; rate: number }[] = [];
    const cursor = new Date(`${todayStr}T00:00:00Z`);
    while (days.length < 5) {
      const weekday = cursor.getUTCDay();
      if (weekday >= 1 && weekday <= 5) {
        const date = cursor.toISOString().slice(0, 10);
        const records = attendance.filter((entry) => entry.date === date).flatMap((entry) => entry.records);
        const present = records.filter((record) => record.status === 'Present').length;
        days.push({
          day: cursor.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
          rate: records.length ? Math.round((present / records.length) * 100) : 0,
        });
      }
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }
    return days.reverse();
  })();

  // Fee categories breakdown
  const feeTypeMap: Record<string, { collected: number; pending: number }> = {};
  invoices.forEach((inv) => {
    if (!feeTypeMap[inv.feeType]) {
      feeTypeMap[inv.feeType] = { collected: 0, pending: 0 };
    }
    feeTypeMap[inv.feeType].collected += inv.paidAmount;
    feeTypeMap[inv.feeType].pending += Math.max(0, inv.amount - inv.paidAmount);
  });

  const feeChartData = Object.keys(feeTypeMap).map((type) => ({
    type: type.replace(' Fee', ''),
    Collected: feeTypeMap[type].collected,
    Pending: feeTypeMap[type].pending,
  }));

  // Grade Distribution from Results
  const gradeCounts: Record<string, number> = {
    'A+': 0,
    A: 0,
    B: 0,
    C: 0,
    D: 0,
    F: 0,
  };
  results.forEach((res) => {
    if (gradeCounts[res.overallGrade] !== undefined) {
      gradeCounts[res.overallGrade]++;
    }
  });

  const gradeData = [
    { name: 'A+ Grade', value: gradeCounts['A+'], color: '#4f46e5' },
    { name: 'A Grade', value: gradeCounts['A'], color: '#6366f1' },
    { name: 'B Grade', value: gradeCounts['B'], color: '#38bdf8' },
    { name: 'C Grade', value: gradeCounts['C'], color: '#f59e0b' },
    { name: 'D/F Grade', value: (gradeCounts['D'] || 0) + (gradeCounts['F'] || 0), color: '#ef4444' },
  ].filter((item) => item.value > 0);

  const upcomingExams = exams.filter((e) => e.status !== 'Completed');
  const pinnedNotices = notices.filter((n) => n.isPinned || n.priority === 'Urgent').slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white border border-slate-200 rounded-xl">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Academic Term Overview
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {settings.motto} · Session {settings.academicYear}
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center flex-wrap gap-2">
          {currentRole === 'Admin' && <button
            onClick={onOpenAddStudent}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Admit Student</span>
          </button>}
          {(currentRole === 'Admin' || currentRole === 'Teacher') && <button
            onClick={() => setActiveTab('attendance')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <CalendarCheck className="w-3.5 h-3.5 text-slate-600" />
            <span>Take Attendance</span>
          </button>}
          {(currentRole === 'Admin' || currentRole === 'Bursar') && <button
            onClick={() => setActiveTab('fees')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <CreditCard className="w-3.5 h-3.5 text-slate-600" />
            <span>Collect Fees</span>
          </button>}
          {(currentRole === 'Admin' || currentRole === 'Teacher') && <button
            onClick={() => setActiveTab('timetable')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Clock className="w-3.5 h-3.5 text-slate-600" />
            <span>Schedule</span>
          </button>}
        </div>
      </div>

      {/* KPI Stat Cards (4 columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Students */}
        <div className="p-4.5 bg-white border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Enrolled</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {totalStudents}
            </span>
            <span className="text-xs text-slate-500">students</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
            <span>{activeStudents} currently active</span>
            <button
              onClick={() => setActiveTab('students')}
              className="text-indigo-600 hover:underline font-medium inline-flex items-center"
            >
              Directory <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
        </div>

        {/* Card 2: Faculty */}
        <div className="p-4.5 bg-white border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Faculty Staff</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {totalTeachers}
            </span>
            <span className="text-xs text-slate-500">educators</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
            <span>Across 5 departments</span>
            <button
              onClick={() => setActiveTab('teachers')}
              className="text-indigo-600 hover:underline font-medium inline-flex items-center"
            >
              Faculty <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
        </div>

        {/* Card 3: Today's Attendance */}
        <div className="p-4.5 bg-white border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Today Attendance</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {attendanceRate}%
            </span>
            <span className="text-xs text-emerald-600 font-medium">on track</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
            <span>
              {totalMarked > 0
                ? `${presentCount} present · ${absentCount} absent`
                : 'Roll-call in progress'}
            </span>
            <button
              onClick={() => setActiveTab('attendance')}
              className="text-indigo-600 hover:underline font-medium inline-flex items-center"
            >
              Roll-call <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
        </div>

        {/* Card 4: Fee Collection */}
        <div className="p-4.5 bg-white border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Collected Revenue</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {settings.currencySymbol}
              {totalCollected.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">
              / {settings.currencySymbol}
              {totalBilled.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
            <span>{collectionRate}% realized</span>
            <button
              onClick={() => setActiveTab('fees')}
              className="text-indigo-600 hover:underline font-medium inline-flex items-center"
            >
              Invoices <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Charts & Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Weekly Attendance Trend (2 cols) */}
        <div className="lg:col-span-2 p-5 bg-white border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
                Weekly Class Attendance (%)
              </h3>
              <p className="text-xs text-slate-500">
                Average attendance percentage across all grades
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-indigo-600" />
                Present %
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={weeklyAttendanceData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="day"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  unit="%"
                />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Attendance Rate']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="rate" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={38} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Grade Breakdown (1 col) */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl flex flex-col">
          <div className="mb-2">
            <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
              Grade Distribution
            </h3>
            <p className="text-xs text-slate-500">
              Grade distribution from saved results
            </p>
          </div>

          <div className="h-52 w-full my-auto">
            {gradeData.length > 0 ? <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gradeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {gradeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: any) => [`${val} Students`, name]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer> : <div className="h-full flex items-center justify-center text-xs text-slate-400">No grade records yet</div>}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
            {gradeData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5 truncate">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate">{item.name}</span>
                </span>
                <span className="font-mono font-medium text-slate-900 tabular-nums">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Row: Fee Allocation Chart + Notices & Exams Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fees by Category Bar Chart */}
        <div className="lg:col-span-2 p-5 bg-white border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
                Fees Billing & Collection by Category
              </h3>
              <p className="text-xs text-slate-500">
                Tuition, lab, and auxiliary services breakdown
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-indigo-600" />
                Collected
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-amber-400" />
                Pending
              </span>
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={feeChartData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="type"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${settings.currencySymbol}${val}`}
                />
                <Tooltip
                  formatter={(val: any) => [`${settings.currencySymbol}${val}`, '']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="Collected" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="Pending" fill="#fbbf24" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Notices & Announcements Widget */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
                Academy Notices
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('notices')}
              className="text-xs text-indigo-600 hover:underline font-medium"
            >
              All ({notices.length})
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {pinnedNotices.length > 0 ? (
              pinnedNotices.map((notice) => (
                <div
                  key={notice.id}
                  className="p-3 bg-slate-50 border border-slate-100 rounded-lg hover:border-slate-200 transition-colors cursor-pointer"
                  onClick={() => setActiveTab('notices')}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[11px] font-semibold text-slate-700 truncate">
                      {notice.title}
                    </span>
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                        notice.priority === 'Urgent'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      {notice.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {notice.content}
                  </p>
                  <div className="mt-2 text-[10px] text-slate-400 font-mono">
                    {notice.publishedDate} · {notice.authorName}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                No active announcements
              </div>
            )}
          </div>

          {upcomingExams.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Upcoming Examination
              </div>
              <div className="flex items-center justify-between text-xs bg-indigo-50/60 p-2.5 rounded-lg border border-indigo-100 text-indigo-950">
                <div>
                  <p className="font-semibold">{upcomingExams[0].title}</p>
                  <p className="text-[11px] text-indigo-700 font-mono">
                    Starts {upcomingExams[0].startDate}
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('exams')}
                  className="px-2 py-1 bg-white border border-indigo-200 text-indigo-700 rounded text-[11px] font-medium hover:bg-indigo-50"
                >
                  View
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
