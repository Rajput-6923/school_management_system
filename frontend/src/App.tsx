/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SchoolProvider, useSchool } from './context/SchoolApiContext';
import { LoginScreen } from './components/auth/LoginScreen';
import { Sidebar } from './components/common/Sidebar';
import { Navbar } from './components/common/Navbar';
import { ToastContainer } from './components/common/Toast';
import { DashboardView } from './components/dashboard/DashboardView';
import { StudentsView } from './components/students/StudentsView';
import { TeachersView } from './components/teachers/TeachersView';
import { ClassesView } from './components/classes/ClassesView';
import { AttendanceView } from './components/attendance/AttendanceView';
import { ExamsView } from './components/exams/ExamsView';
import { FeesView } from './components/fees/FeesView';
import { TimetableView } from './components/timetable/TimetableView';
import { NoticesView } from './components/notices/NoticesView';
import { SettingsView } from './components/settings/SettingsView';
import { StudentFormModal } from './components/students/StudentFormModal';
import { ReportCardModal } from './components/exams/ReportCardModal';
import { ReceiptModal } from './components/fees/ReceiptModal';

const AppContent: React.FC = () => {
  const { activeTab, setActiveTab, invoices, authChecking, user, isLoading, dataError, refreshData } = useSchool();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isQuickAddStudentOpen, setIsQuickAddStudentOpen] = useState(false);
  const [reportCardStudentId, setReportCardStudentId] = useState<string | null>(null);
  const [receiptInvoiceId, setReceiptInvoiceId] = useState<string | null>(null);

  if (authChecking) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm text-slate-500">Checking your session...</div>;
  }
  if (!user) return <LoginScreen />;

  const selectedReceiptInvoice = receiptInvoiceId
    ? invoices.find((i) => i.id === receiptInvoiceId) || null
    : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans">
      {/* Sidebar */}
      <Sidebar
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 min-h-screen">
        <Navbar
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
          onOpenQuickAddStudent={() => setIsQuickAddStudentOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {dataError && (
            <div role="alert" className="mb-4 flex items-center justify-between gap-3 border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800 rounded-lg">
              <span>{dataError}</span>
              <button onClick={() => void refreshData()} className="font-semibold underline">Retry</button>
            </div>
          )}
          {isLoading && <div className="mb-4 text-xs text-slate-500" role="status">Loading school records...</div>}
          {activeTab === 'dashboard' && (
            <DashboardView onOpenAddStudent={() => setIsQuickAddStudentOpen(true)} />
          )}

          {activeTab === 'students' && (
            <StudentsView
              onViewReportCard={(studentId) => setReportCardStudentId(studentId)}
              onViewInvoiceReceipt={(invId) => setReceiptInvoiceId(invId)}
            />
          )}

          {activeTab === 'teachers' && <TeachersView />}

          {activeTab === 'classes' && <ClassesView />}

          {activeTab === 'attendance' && <AttendanceView />}

          {activeTab === 'exams' && (
            <ExamsView initialStudentReportId={reportCardStudentId} />
          )}

          {activeTab === 'fees' && (
            <FeesView initialInvoiceReceiptId={receiptInvoiceId} />
          )}

          {activeTab === 'timetable' && <TimetableView />}

          {activeTab === 'notices' && <NoticesView />}

          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Quick Add Student Modal */}
      <StudentFormModal
        isOpen={isQuickAddStudentOpen}
        onClose={() => setIsQuickAddStudentOpen(false)}
      />

      {/* Cross-module Report Card Modal */}
      <ReportCardModal
        isOpen={!!reportCardStudentId}
        onClose={() => setReportCardStudentId(null)}
        studentId={reportCardStudentId}
      />

      {/* Cross-module Receipt Modal */}
      <ReceiptModal
        isOpen={!!receiptInvoiceId}
        onClose={() => setReceiptInvoiceId(null)}
        invoice={selectedReceiptInvoice}
      />

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <SchoolProvider>
      <AppContent />
    </SchoolProvider>
  );
}
