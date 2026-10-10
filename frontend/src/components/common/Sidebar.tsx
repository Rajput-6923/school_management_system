import React from 'react';
import { useSchool } from '../../context/SchoolApiContext';
import { NavTab } from '../../types';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Layers,
  CalendarCheck,
  FileSpreadsheet,
  CreditCard,
  Clock,
  Bell,
  Settings,
  ChevronRight,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, setIsMobileOpen }) => {
  const { activeTab, setActiveTab, students, teachers, notices, invoices, settings, user, logout } = useSchool();

  const urgentNoticesCount = notices.filter((n) => n.priority === 'Urgent').length;
  const overdueInvoicesCount = invoices.filter((i) => i.status === 'Overdue' || i.status === 'Pending').length;

  const navItems: {
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    counter?: number;
  }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: Users, counter: students.length },
    { id: 'teachers', label: 'Teachers', icon: GraduationCap, counter: teachers.length },
    { id: 'classes', label: 'Classes & Subjects', icon: Layers },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'exams', label: 'Examinations', icon: FileSpreadsheet },
    { id: 'fees', label: 'Fees & Billing', icon: CreditCard, counter: overdueInvoicesCount },
    { id: 'timetable', label: 'Timetable', icon: Clock },
    { id: 'notices', label: 'Notices & Events', icon: Bell, counter: urgentNoticesCount },
    { id: 'settings', label: 'School Settings', icon: Settings },
  ];
  const allowedTabs = {
    Admin: navItems.map((item) => item.id),
    Teacher: ['dashboard', 'students', 'teachers', 'classes', 'attendance', 'exams', 'timetable', 'notices'] as NavTab[],
    Bursar: ['dashboard', 'students', 'fees', 'notices'] as NavTab[],
    Student: ['dashboard', 'notices'] as NavTab[],
  };

  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand & Crest Header */}
        <div className="h-16 flex items-center px-5 border-b border-slate-100 gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-xs shrink-0 tracking-tight">
            EC
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-bold text-slate-900 truncate tracking-tight">
              {settings.schoolName || 'EduCore Academy'}
            </h1>
            <p className="text-[11px] text-slate-500 truncate font-mono">
              Academic {settings.academicYear}
            </p>
          </div>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Menu
          </div>

          {navItems.filter((item) => allowedTabs[user?.role || 'Student'].includes(item.id)).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.counter !== undefined && item.counter > 0 && (
                  <span
                    className={`text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded ${
                      isActive
                        ? 'bg-slate-800 text-slate-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.counter}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Signed-in account */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[11px] text-slate-500 font-medium">Signed in</span>
            <span className="text-[10px] text-indigo-600 font-mono">{user?.role}</span>
          </div>
          <div className="px-1 text-[11px] text-slate-700 truncate" title={user?.email}>
            {user?.fullName || user?.email}
          </div>
          <button onClick={() => void logout()} className="mt-2 w-full flex items-center gap-2 px-2 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md">
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
};
