import React, { useEffect, useState } from 'react';
import { History, Shield, Search, Lock, User } from 'lucide-react';
import type { AuditLog } from '../types';
import { api } from '../services/api';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const res = await api.getAuditLogs();
      setLogs(res.logs || []);
    } catch (err) {
      console.error(err);
    }
  };

  const safeLogs = Array.isArray(logs) ? logs : [];
  const filtered = safeLogs.filter((log) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.adminName.toLowerCase().includes(q) ||
      (log.employeeName && log.employeeName.toLowerCase().includes(q)) ||
      log.details.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            System Security & Administrative Audit Logs
          </h2>
          <p className="text-xs text-slate-500">
            Immutable trace of admin operations, policy modifications, and workforce privilege assignments.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search action, admin or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-xl bg-slate-50 pl-9 pr-3 text-xs text-slate-900 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="text-xs text-slate-500">
          Showing <span className="font-bold text-slate-900">{filtered.length}</span> recorded logs
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Timestamp</th>
                <th className="px-4 py-3.5">Admin Operator</th>
                <th className="px-4 py-3.5">Action Code</th>
                <th className="px-4 py-3.5">Target Employee</th>
                <th className="px-6 py-3.5">Operation Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-4">
                    <span className="font-semibold text-slate-900">{log.adminName}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">{log.adminId}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-700 border border-slate-200">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    {log.employeeName ? (
                      <span className="font-semibold text-blue-700">{log.employeeName}</span>
                    ) : (
                      <span className="text-slate-400 italic">System wide</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-700 font-medium">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
