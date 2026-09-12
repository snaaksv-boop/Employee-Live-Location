import React from 'react';
import {
  Users,
  Wifi,
  Briefcase,
  Coffee,
  Hourglass,
  Navigation,
  Clock,
  Radio,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import type { DashboardSummary, Employee } from '../types';

interface AdminDashboardProps {
  summary: DashboardSummary | null;
  employees: Employee[];
  onViewLiveLocation?: (empId: string) => void;
  onViewLiveMap?: (empId: string) => void;
  onViewHistory: (empId: string) => void;
  onOpenTab?: (tab: any) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  summary,
  employees = [],
  onViewLiveLocation,
  onViewLiveMap,
  onViewHistory,
  onOpenTab,
}) => {
  const handleLiveLocation = onViewLiveLocation || onViewLiveMap || (() => {});
  const safeEmployees = Array.isArray(employees) ? employees : [];

  const s = summary || {
    totalEmployees: safeEmployees.length,
    onlineEmployees: safeEmployees.filter((e) => e.isOnline).length,
    currentlyWorking: safeEmployees.filter((e) => e.workStatus === 'working').length,
    notStarted: safeEmployees.filter((e) => e.workStatus === 'not_started').length,
    onBreak: safeEmployees.filter((e) => e.workStatus === 'on_break').length,
    todayDistanceKm: 0,
    todayWorkingHours: 0,
    totalLocationUpdates: 0,
  };

  const cards = [
    {
      title: 'Total Employees',
      value: s.totalEmployees,
      unit: 'Registered Staff',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100',
    },
    {
      title: 'Online Employees',
      value: s.onlineEmployees,
      unit: 'Active Devices',
      icon: Wifi,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
    },
    {
      title: 'Currently Working',
      value: s.currentlyWorking,
      unit: 'In Shift',
      icon: Briefcase,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-100',
    },
    {
      title: 'On Break',
      value: s.onBreak,
      unit: 'Rest Period',
      icon: Coffee,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-100',
    },
    {
      title: 'Not Started',
      value: s.notStarted,
      unit: 'Pending Check-In',
      icon: Hourglass,
      color: 'text-slate-600',
      bgColor: 'bg-slate-100',
      borderColor: 'border-slate-200',
    },
    {
      title: "Today's Distance",
      value: `${s.todayDistanceKm} km`,
      unit: 'Total Field Route',
      icon: Navigation,
      color: 'text-sky-600',
      bgColor: 'bg-sky-50',
      borderColor: 'border-sky-100',
    },
    {
      title: "Today's Working Hours",
      value: `${s.todayWorkingHours} hrs`,
      unit: 'Productive Time',
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-100',
    },
    {
      title: 'Total Location Updates',
      value: s.totalLocationUpdates,
      unit: 'Verified GPS Pings',
      icon: Radio,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-xl font-bold tracking-tight">Workforce Live Operations Center</h2>
          </div>
          <p className="text-xs text-slate-300 max-w-xl">
            Real-time field personnel tracking, verified GPS routes, automatic stay detection, and attendance sync.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onOpenTab('live_tracking')}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-blue-500 transition-all"
          >
            <Radio className="h-4 w-4" />
            <span>Open Live Map</span>
          </button>
          <button
            onClick={() => onOpenTab('movement_history')}
            className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/20 transition-all"
          >
            <ArrowUpRight className="h-4 w-4" />
            <span>Route History</span>
          </button>
        </div>
      </div>

      {/* Summary Metric Cards (Section 2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={i}
              className={`rounded-2xl border ${c.borderColor} bg-white p-4 shadow-xs transition-hover hover:shadow-md`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">{c.title}</span>
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${c.bgColor} ${c.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold tracking-tight text-slate-900">{c.value}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{c.unit}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Real-time Field Workforce Status Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 px-6 py-4 gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Active Field Workforce</h3>
            <p className="text-xs text-slate-500">Live operational status and telemetry for today</p>
          </div>
          <button
            onClick={() => onOpenTab('employees')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View All Management</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Employee</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last GPS Fix</th>
                <th className="px-4 py-3">Accuracy</th>
                <th className="px-4 py-3">Today Distance</th>
                <th className="px-4 py-3">Today Hours</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((emp) => {
                const isWorking = emp.workStatus === 'working';
                const isOnBreak = emp.workStatus === 'on_break';
                const isOffline = !emp.isOnline;

                return (
                  <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={emp.profilePhoto}
                          alt={emp.name}
                          className="h-8 w-8 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-900">{emp.name}</span>
                            {emp.isDemo && (
                              <span className="rounded bg-amber-100 px-1.5 py-0.2 text-[9px] font-bold text-amber-800">
                                DEMO
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">{emp.employeeId}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-medium text-slate-700">{emp.department}</span>
                      <p className="text-[10px] text-slate-400">{emp.designation}</p>
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          isWorking
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isOnBreak
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : isOffline
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isWorking
                              ? 'bg-emerald-500'
                              : isOnBreak
                              ? 'bg-amber-500'
                              : isOffline
                              ? 'bg-rose-500'
                              : 'bg-slate-400'
                          }`}
                        />
                        {isWorking ? 'Working' : isOnBreak ? 'On Break' : isOffline ? 'Offline' : 'Not Started'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      {emp.lastLocation ? (
                        <div>
                          <p className="font-medium text-slate-800 truncate max-w-[180px]">
                            {emp.lastLocation.address || `${emp.lastLocation.latitude.toFixed(4)}, ${emp.lastLocation.longitude.toFixed(4)}`}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {new Date(emp.lastLocation.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No GPS signal</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      {emp.lastLocation ? (
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold ${
                            emp.lastLocation.accuracy <= 10
                              ? 'bg-emerald-50 text-emerald-700'
                              : emp.lastLocation.accuracy <= 35
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          ±{Math.round(emp.lastLocation.accuracy)}m ({emp.lastLocation.locationType.toUpperCase()})
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 font-semibold text-slate-800">
                      {emp.todayStats?.distanceKm || 0} km
                    </td>

                    <td className="px-4 py-3.5 font-semibold text-slate-800">
                      {Math.round(((emp.todayStats?.workingMinutes || 0) / 60) * 10) / 10} hrs
                    </td>

                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleLiveLocation(emp.id)}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                        >
                          Live Map
                        </button>
                        <button
                          onClick={() => onViewHistory(emp.id)}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                          History
                        </button>
                      </div>
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
