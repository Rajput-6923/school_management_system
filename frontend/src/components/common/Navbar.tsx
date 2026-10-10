import React from 'react';
import { useSchool } from '../../context/SchoolApiContext';
import { Menu, Plus, Calendar, Bell, Sparkles } from 'lucide-react';
import { NavTab } from '../../types';

interface NavbarProps {
  onToggleMobileMenu: () => void;
  onOpenQuickAddStudent?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu, onOpenQuickAddStudent }) => {
  const { activeTab, setActiveTab, currentRole, notices, settings } = useSchool();

  const titleMap: Record<NavTab, { title: string; subtitle: string }> = {
    dashboard: { title: 'Administrative Dashboard', subtitle: 'Executive overview & academy analytics' },
    students: { title: 'Student Directory', subtitle: 'Manage enrollments, profiles, and records' },
    teachers: { title: 'Faculty & Staff', subtitle: 'Academic personnel and department rosters' },
    classes: { title: 'Classes & Curriculum', subtitle: 'Classroom allocations and subject catalog' },
    attendance: { title: 'Attendance Register', subtitle: 'Daily roll-call & presence tracking' },
    exams: { title: 'Examinations & Grades', subtitle: 'Assessments, report cards, and GPA' },
    fees: { title: 'Fees & Accounts', subtitle: 'Invoicing, dues collection, and payment receipts' },
    timetable: { title: 'Timetable & Schedules', subtitle: 'Weekly period grids and room allocations' },
    notices: { title: 'Notice Board', subtitle: 'Official bulletins, circulars, and events' },
    settings: { title: 'Academy Configuration', subtitle: 'Institution profile, grading rules, and data' },
  };

  const currentInfo = titleMap[activeTab] || { title: 'School Management', subtitle: 'Portal' };

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  const unreadNotices = notices.filter((n) => n.priority === 'Urgent').length;

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      {/* Left: Mobile trigger & Breadcrumbs */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <button
          onClick={onToggleMobileMenu}
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-medium text-slate-500">{settings.schoolName}</span>
            <span>/</span>
            <span className="text-slate-900 font-semibold truncate">{currentInfo.title}</span>
          </div>
        </div>
      </div>

      {/* Right: Date, Role tag, Quick CTA */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200/80 px-2.5 py-1.5 rounded-lg">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-mono tabular-nums">{todayFormatted}</span>
        </div>

        <button
          onClick={() => setActiveTab('notices')}
          className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          title="View notices"
          aria-label="View notices"
        >
          <Bell className="w-4 h-4" />
          {unreadNotices > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
          )}
        </button>

        {currentRole === 'Admin' && activeTab === 'students' && onOpenQuickAddStudent && (
          <button
            onClick={onOpenQuickAddStudent}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Admit Student</span>
          </button>
        )}
      </div>
    </header>
  );
};
