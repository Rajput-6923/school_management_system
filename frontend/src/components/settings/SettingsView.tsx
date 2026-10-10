import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolApiContext';
import {
  Settings,
  Building,
  GraduationCap,
  Download,
  Upload,
  RotateCcw,
  Save,
  CheckCircle2,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetToDemoData,
    exportDataToJson,
    importDataFromJson,
    students,
    teachers,
    classes,
    isSaving,
  } = useSchool();

  const [formData, setFormData] = useState({ ...settings });
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings(formData);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        importDataFromJson(content);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Institutional Settings & Storage
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
              School profile, grading criteria, and database backup management.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportDataToJson}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON Backup</span>
          </button>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* School Information */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              School Identity & Campus
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Official School Name *
              </label>
              <input
                type="text"
                required
                value={formData.schoolName}
                onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                School Motto
              </label>
              <input
                type="text"
                value={formData.motto}
                onChange={(e) => setFormData({ ...formData, motto: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Head of School / Principal
              </label>
              <input
                type="text"
                value={formData.principalName}
                onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Academic Year / Term
              </label>
              <input
                type="text"
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                placeholder="2025-2026"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:outline-none focus:border-indigo-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Currency Symbol
              </label>
              <input
                type="text"
                maxLength={3}
                value={formData.currencySymbol}
                onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                placeholder="$, €, £, ₹"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:outline-none focus:border-indigo-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Official Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 bg-white font-mono"
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
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 bg-white font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Campus Postal Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save School Profile'}</span>
            </button>
          </div>
        </div>

        {/* Academic Grading Scale Table */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Academic Grading Rubric & GPA Weights
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">4.0 Scale Standard</span>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Letter Grade</th>
                  <th className="py-2.5 px-4">Score Range (%)</th>
                  <th className="py-2.5 px-4">Grade Point Equiv.</th>
                  <th className="py-2.5 px-4">Classification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {formData.gradingScale.map((scale) => (
                  <tr key={scale.grade} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-bold font-mono text-indigo-700">
                      {scale.grade}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-800">
                      {scale.minScore}% - {scale.maxScore}%
                    </td>
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                      {scale.gpaPoint.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500">
                      {scale.gpaPoint >= 3.8
                        ? 'Distinction / High Honors'
                        : scale.gpaPoint >= 3.0
                        ? 'Honors / Commendable'
                        : scale.gpaPoint >= 2.0
                        ? 'Satisfactory'
                        : 'Requires Remediations'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Local Storage & Demo Dataset Controls */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Shield className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              PostgreSQL Data & Backup Management
            </h3>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            School records are stored in PostgreSQL. JSON backups can be imported additively; records
            with matching IDs are left unchanged, and existing database records are never cleared by import.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {/* Reset */}
            <div className="p-4 border border-rose-200 bg-rose-50/30 rounded-xl space-y-2">
              <span className="font-bold text-xs text-rose-900 block">
                Import Sample Records
              </span>
              <p className="text-[11px] text-slate-500 leading-normal">
                Add the included sample students, faculty, exams, and attendance records without replacing existing data.
              </p>
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(true)}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-700 bg-rose-100 hover:bg-rose-200 rounded-lg transition-colors mt-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Import Sample Data</span>
              </button>
            </div>

            {/* Export */}
            <div className="p-4 border border-slate-200 bg-slate-50 rounded-xl space-y-2">
              <span className="font-bold text-xs text-slate-900 block">
                Export JSON Backup
              </span>
              <p className="text-[11px] text-slate-500 leading-normal">
                Download all academy tables and records into a portable offline JSON file.
              </p>
              <button
                type="button"
                onClick={exportDataToJson}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors mt-2 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Backup</span>
              </button>
            </div>

            {/* Import */}
            <div className="p-4 border border-slate-200 bg-slate-50 rounded-xl space-y-2">
              <span className="font-bold text-xs text-slate-900 block">
                Import JSON Backup
              </span>
              <p className="text-[11px] text-slate-500 leading-normal">
                Import a previously exported backup into the PostgreSQL database.
              </p>
              <label className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors mt-2 shadow-xs cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </form>

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={() => {
            void resetToDemoData();
          setIsResetConfirmOpen(false);
        }}
          title="Import Sample Records"
          message="Sample records with existing IDs will be skipped. No existing PostgreSQL records will be deleted or overwritten. Continue?"
          confirmLabel="Import Samples"
        isDestructive={true}
      />
    </div>
  );
};
