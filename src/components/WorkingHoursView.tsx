import React from 'react';
import { Timer, Clock, Coffee, CheckCircle2, TrendingUp } from 'lucide-react';
import type { Employee } from '../types';

interface WorkingHoursViewProps {
  employees: Employee[];
}

export const WorkingHoursView: React.FC<WorkingHoursViewProps> = ({ employees = [] }) => {
  const safeEmployees = Array.isArray(employees) ? employees : [];
  const totalMinutes = safeEmployees.reduce((sum, e) => sum + (e.todayStats?.workingMinutes || 0), 0);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
  const activeCount = safeEmployees.filter((e) => (e.todayStats?.workingMinutes || 0) > 0).length;
  const avgHours = activeCount > 0 ? Math.round((totalHours / activeCount) * 10) / 10 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Working Hours & Productivity Analytics
          </h2>
          <p className="text-xs text-slate-500">
            Aggregated productive work hours calculated strictly from shift attendance and verified check-in sessions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs text-slate-400 font-medium block">Total Field Hours Logged</span>
          <div className="text-2xl font-bold text-purple-700 mt-1">{totalHours} hrs</div>
          <span className="text-[10px] text-slate-400">Summed across workforce today</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs text-slate-400 font-medium block">Average Shift Duration</span>
          <div className="text-2xl font-bold text-indigo-600 mt-1">{avgHours} hrs</div>
          <span className="text-[10px] text-slate-400">Per working employee</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs text-slate-400 font-medium block">Active Workers Today</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{activeCount} / {employees.length}</div>
          <span className="text-[10px] text-slate-400">Logged shift attendance</span>
        </div>
      </div>

      {/* Breakdown per Employee */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="text-base font-bold text-slate-900">Employee Shift Breakdown</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Employee</th>
                <th className="px-4 py-3.5">Department</th>
                <th className="px-4 py-3.5">Shift Window</th>
                <th className="px-4 py-3.5">Total Productive Hours</th>
                <th className="px-4 py-3.5">Target Progress (8h standard)</th>
                <th className="px-6 py-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((emp) => {
                const hours = Math.round(((emp.todayStats?.workingMinutes || 0) / 60) * 10) / 10;
                const progress = Math.min(100, Math.round((hours / 8) * 100));

                return (
                  <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={emp.profilePhoto}
                          alt={emp.name}
                          className="h-8 w-8 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <span className="font-bold text-slate-900">{emp.name}</span>
                          <span className="text-[11px] font-mono text-slate-400 block font-semibold">
                            {emp.employeeId}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 font-medium text-slate-700">{emp.department}</td>

                    <td className="px-4 py-4 font-medium text-slate-800">
                      {emp.todayStats?.checkIn || 'Not started'} - {emp.todayStats?.checkOut || 'Active'}
                    </td>

                    <td className="px-4 py-4 font-bold text-purple-700">{hours} hrs</td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-28 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-purple-600 transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-slate-500">{progress}%</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          progress >= 90
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : progress > 0
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {progress >= 90 ? 'Complete' : progress > 0 ? 'In Progress' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
