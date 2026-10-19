import React, { useState } from 'react';
import {
  GraduationCap,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Shield,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
  onSwitchToRegister: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSwitchToRegister }) => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim() || !password) {
      setError('Please enter both your login identifier and password.');
      return;
    }

    try {
      setLoading(true);
      await login(identifier.trim(), password);
    } catch (err: any) {
      setError(err?.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (id: string, pass: string) => {
    setIdentifier(id);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <GraduationCap className="w-8 h-8" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900">
          Sign in to EduManage
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Student Information & Academic Management Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm sm:rounded-2xl border border-slate-200 sm:px-10">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email, Username, or Student ID
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="student@edumanage.edu or alex_turner"
                  className="block w-full pl-10 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors bg-white text-slate-900"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors bg-white text-slate-900"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors shadow-xs disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo Accounts Quick-Fill */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                1-Click Demo Accounts
              </span>
              <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Hashed DB seed
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoFill('student@edumanage.edu', 'student123')}
                className="p-2 text-left rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors cursor-pointer group"
              >
                <div className="text-[11px] font-bold text-slate-800 group-hover:text-indigo-600">
                  Student
                </div>
                <div className="text-[10px] text-slate-500 truncate">Alex Turner</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoFill('faculty@edumanage.edu', 'faculty123')}
                className="p-2 text-left rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors cursor-pointer group"
              >
                <div className="text-[11px] font-bold text-slate-800 group-hover:text-indigo-600">
                  Faculty
                </div>
                <div className="text-[10px] text-slate-500 truncate">Dr. Roberts</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoFill('admin@edumanage.edu', 'admin123')}
                className="p-2 text-left rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors cursor-pointer group"
              >
                <div className="text-[11px] font-bold text-slate-800 group-hover:text-indigo-600">
                  Admin
                </div>
                <div className="text-[10px] text-slate-500 truncate">SysAdmin</div>
              </button>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              New student?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="font-semibold text-indigo-600 hover:text-indigo-500 cursor-pointer"
              >
                Create an account
              </button>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <Shield className="w-3.5 h-3.5 text-slate-400" />
          <span>PGlite embedded PostgreSQL • Bcrypt & JWT Protected</span>
        </div>
      </div>
    </div>
  );
};
