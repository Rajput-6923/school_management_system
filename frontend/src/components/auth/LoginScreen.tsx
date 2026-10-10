import React, { useState } from 'react';
import { ArrowRight, LockKeyhole } from 'lucide-react';
import { useSchool } from '../../context/SchoolApiContext';

export const LoginScreen: React.FC = () => {
  const { login, dataError, settings } = useSchool();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    if (!email.trim()) return;
    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <section className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-sm p-7 sm:p-9">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center">EF</div>
          <div>
            <p className="text-sm font-bold text-slate-900">{settings.schoolName || 'EduFlow'}</p>
            <p className="text-xs text-slate-500">School Management System</p>
          </div>
        </div>

        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900">Sign in</h1>
          <p className="text-sm text-slate-500 mt-1">Use your school account to continue.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-xs font-medium text-slate-700 mb-1.5">Email address</label>
            <input id="login-email" type="email" autoComplete="username" required maxLength={254} value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600" />
          </div>
          <div>
            <label htmlFor="login-password" className="block text-xs font-medium text-slate-700 mb-1.5">Password</label>
            <input id="login-password" type="password" autoComplete="current-password" required maxLength={200} value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600" />
          </div>
          {dataError && <p role="alert" className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2.5">{dataError}</p>}
          <button disabled={isSubmitting} type="submit"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-60">
            {isSubmitting ? <LockKeyhole className="w-4 h-4 animate-pulse" /> : <ArrowRight className="w-4 h-4" />}
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  );
};