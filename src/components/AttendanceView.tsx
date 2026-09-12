import React, { useState } from 'react';
import {
  CalendarCheck,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Coffee,
  AlertCircle,
  Download,
} from 'lucide-react';
import type { Employee, AttendanceRecord } from '../types';

interface AttendanceViewProps {
  employees: Employee[];
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({ employees = [] }) => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const todayStr = new Date().toISOString().split('T')[0];

  const safeEmployees = Array.isArray(employees) ? employees : [];
  const filtered = safeEmployees.filter((emp) => {
    if (filterStatus === 'present' && emp.workStatus === 'not_started') return false;
    if (filterStatus === 'working' && emp.workStatus !== 'working') return false;
    if (filterStatus === 'on_break' && emp.workStatus !== 'on_break') return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        emp.name.toLowerCase().includes(q) ||
        emp.employeeId.toLowerCase().includes(q) ||
        emp.department.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Workforce Attendance & Shift Logs
          </h2>
          <p className="text-xs text-slate-500">
            Automated punch-in, break interval calculations, and verified shift duration records.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search employee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-xl bg-slate-50 pl-9 pr-3 text-xs text-slate-900 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-9 rounded-xl bg-slate-50 px-3 text-xs font-semibold text-slate-700 border border-slate-200"
          >
            <option value="all">All Statuses</option>
            <option value="present">Present (Checked-In)</option>
            <option value="working">Currently Working</option>
            <option value="on_break">On Break</option>
          </select>
        </div>

        <div className="text-xs text-slate-500">
          Date: <span className="font-bold text-slate-900">{todayStr}</span>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Employee</th>
                <th className="px-4 py-3.5">Department</th>
                <th className="px-4 py-3.5">Check-In</th>
                <th className="px-4 py-3.5">Check-Out</th>
                <th className="px-4 py-3.5">Working Hours</th>
                <th className="px-4 py-3.5">Break Status</th>
                <th className="px-6 py-3.5 text-right">Attendance State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((emp) => {
                const isCheckedIn = Boolean(emp.todayStats?.checkIn);
                const isWorking = emp.workStatus === 'working';
                const isOnBreak = emp.workStatus === 'on_break';

                return (
                  <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={emp.profilePhoto}
                          alt={emp.name}
                          className="h-9 w-9 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <span className="font-bold text-slate-900">{emp.name}</span>
                          <span className="text-[11px] font-mono text-slate-400 block">
                            {emp.employeeId}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span className="font-semibold text-slate-800">{emp.department}</span>
                      <p className="text-[11px] text-slate-500">{emp.designation}</p>
                    </td>

                    <td className="px-4 py-4">
                      {emp.todayStats?.checkIn ? (
                        <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {emp.todayStats.checkIn}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Not checked in</span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      {emp.todayStats?.checkOut ? (
                        <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {emp.todayStats.checkOut}
                        </span>
                      ) : isCheckedIn ? (
                        <span className="text-blue-600 font-medium italic">Shift active</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <Clock className="h-3.5 w-3.5 text-purple-600" />
                        <span>
                          {Math.round(((emp.todayStats?.workingMinutes || 0) / 60) * 10) / 10} hrs
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      {isOnBreak ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <Coffee className="h-3 w-3" />
                          <span>On Lunch / Rest Break</span>
                        </span>
                      ) : isCheckedIn ? (
                        <span className="text-slate-500 font-medium">Duty active</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          isCheckedIn
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {isCheckedIn ? 'PRESENT' : 'PENDING'}
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
