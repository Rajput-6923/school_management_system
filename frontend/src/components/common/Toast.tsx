import React from 'react';
import { useSchool } from '../../context/SchoolApiContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useSchool();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-lg border text-sm shadow-sm transition-all duration-150 animate-in fade-in slide-in-from-bottom-2 ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : toast.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-slate-900 border-slate-800 text-white'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toast.type === 'success' && (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            {toast.type === 'error' && (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            {toast.type === 'info' && (
              <Info className="w-4 h-4 text-slate-300 shrink-0" />
            )}
            <p className="font-medium text-xs leading-relaxed">{toast.message}</p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="p-1 hover:opacity-75 transition-opacity text-slate-400 hover:text-slate-600"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
