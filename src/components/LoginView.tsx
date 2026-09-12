import React, { useState } from 'react';
import { Shield, Smartphone, Lock, User, Key, CheckCircle2, ArrowRight } from 'lucide-react';
import type { UserSession, Employee } from '../types';

interface LoginViewProps {
  onLoginSuccess: (session: UserSession) => void;
  employees: Employee[];
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, employees = [] }) => {
  const [role, setRole] = useState<'admin' | 'employee'>('admin');
  const [username, setUsername] = useState('admin@trackcorp.io');
  const [password, setPassword] = useState('admin123');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [forgotOpen, setForgotOpen] = useState(false);

  const safeEmployees = Array.isArray(employees) ? employees : [];

  const handleRoleToggle = (newRole: 'admin' | 'employee') => {
    setRole(newRole);
    setError('');
    if (newRole === 'admin') {
      setUsername('admin@trackcorp.io');
      setPassword('admin123');
    } else {
      const emp = safeEmployees[0];
      setUsername(emp ? emp.username : 'alex.r');
      setPassword('password123');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (role === 'admin') {
      if (
        (username === 'admin@trackcorp.io' || username === 'admin') &&
        password === 'admin123'
      ) {
        onLoginSuccess({
          role: 'admin',
          username: 'admin@trackcorp.io',
          name: 'Chief Admin Officer',
        });
      } else {
        setError('Invalid admin credentials. Use admin@trackcorp.io / admin123');
      }
    } else {
      // Find employee
      const emp = safeEmployees.find(
        (e) =>
          e.username.toLowerCase() === username.toLowerCase() ||
          e.employeeId.toLowerCase() === username.toLowerCase() ||
          e.email.toLowerCase() === username.toLowerCase()
      );

      if (emp) {
        onLoginSuccess({
          role: 'employee',
          username: emp.username,
          employeeId: emp.id,
          name: emp.name,
        });
      } else {
        setError(
          `Employee not found. Try '${safeEmployees[0]?.username || 'alex.r'}' with password 'password123'`
        );
      }
    }
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl">
        {/* Brand Header */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/30">
            <Shield className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-xl font-black tracking-tight text-slate-900">
            WorkforceTrack Pro
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Enterprise Employee Live Location & Field Workforce Platform
          </p>
        </div>

        {/* Role Segmented Switcher */}
        <div className="mt-6 flex rounded-2xl bg-slate-100 p-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => handleRoleToggle('admin')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 transition-all ${
              role === 'admin'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Admin Portal</span>
          </button>
          <button
            type="button"
            onClick={() => handleRoleToggle('employee')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 transition-all ${
              role === 'employee'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>Employee Portal</span>
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="mt-6 space-y-4 text-xs">
          {error && (
            <div className="rounded-xl bg-rose-50 p-3 text-rose-700 border border-rose-200 font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {role === 'admin' ? 'Admin Email / Username' : 'Employee ID or Username'}
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={role === 'admin' ? 'admin@trackcorp.io' : 'alex.r or EMP-101'}
                className="w-full rounded-xl bg-slate-50 pl-9 pr-3 py-2.5 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl bg-slate-50 pl-9 pr-3 py-2.5 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="font-semibold text-slate-600">Remember Me</span>
            </label>

            <button
              type="button"
              onClick={() => setForgotOpen(true)}
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-bold text-white shadow-md hover:bg-blue-500 transition-all text-xs"
          >
            <span>Sign In to {role === 'admin' ? 'Admin Dashboard' : 'Field Portal'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Fast Demo Credentials helper */}
        <div className="mt-6 rounded-2xl bg-slate-50 p-3.5 border border-slate-100 text-[11px] text-slate-500">
          <p className="font-bold text-slate-700 mb-1">Demo Access Credentials:</p>
          <div className="space-y-0.5">
            <div>
              <b>Admin:</b> <span className="font-mono text-slate-700">admin@trackcorp.io</span> / <span className="font-mono text-slate-700">admin123</span>
            </div>
            <div>
              <b>Employee:</b> <span className="font-mono text-slate-700">{employees[0]?.username || 'alex.r'}</span> / <span className="font-mono text-slate-700">password123</span>
            </div>
          </div>
        </div>

        {/* Forgot Password Modal */}
        {forgotOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm">Reset Account Password</h3>
              <p className="mt-2 text-xs text-slate-500">
                Please contact your enterprise IT administrator or supervisor at{' '}
                <span className="font-semibold text-blue-600">support@trackcorp.io</span> to request
                a secure password reset link.
              </p>
              <button
                onClick={() => setForgotOpen(false)}
                className="mt-4 w-full rounded-xl bg-slate-100 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
