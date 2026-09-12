import React, { useState } from 'react';
import { Navigation, Trophy, TrendingUp, Filter, Search, Award } from 'lucide-react';
import type { Employee } from '../types';

interface DistanceReportsProps {
  employees: Employee[];
}

export const DistanceReports: React.FC<DistanceReportsProps> = ({ employees = [] }) => {
  const [filterDept, setFilterDept] = useState('all');
  const safeEmployees = Array.isArray(employees) ? employees : [];

  // Sort by today's distance descending
  const sorted = [...safeEmployees]
    .filter((e) => filterDept === 'all' || e.department === filterDept)
    .sort((a, b) => (b.todayStats?.distanceKm || 0) - (a.todayStats?.distanceKm || 0));

  const totalDist = safeEmployees.reduce((sum, e) => sum + (e.todayStats?.distanceKm || 0), 0);
  const avgDist = safeEmployees.length > 0 ? Math.round((totalDist / safeEmployees.length) * 10) / 10 : 0;
  const maxDist = sorted.length > 0 ? sorted[0].todayStats?.distanceKm || 1 : 1;

  const departments = ['Field Service', 'Sales', 'Logistics & Delivery', 'Quality Audit', 'Maintenance'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Workforce Field Distance Analytics
          </h2>
          <p className="text-xs text-slate-500">
            Precise distance traveled calculated directly from recorded geographic coordinates.
          </p>
        </div>

        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="h-9 rounded-xl bg-white px-3 text-xs font-semibold text-slate-800 border border-slate-200 shadow-xs"
        >
          <option value="all">All Departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs text-slate-400 font-medium block">Total Field Distance</span>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {Math.round(totalDist * 10) / 10} km
          </div>
          <span className="text-[10px] text-slate-400">Summed across all active field staff</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs text-slate-400 font-medium block">Average Distance / Employee</span>
          <div className="text-2xl font-bold text-indigo-600 mt-1">{avgDist} km</div>
          <span className="text-[10px] text-slate-400">Daily baseline benchmark</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-xs text-slate-400 font-medium block">Top Distance Leader</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {sorted[0]?.name || 'N/A'}
          </div>
          <span className="text-[10px] text-slate-400 font-semibold">
            {sorted[0]?.todayStats?.distanceKm || 0} km today
          </span>
        </div>
      </div>

      {/* Leaderboard & Progress Bars */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-500" />
          <span>Field Travel Leaderboard (Today)</span>
        </h3>

        <div className="space-y-4">
          {sorted.map((emp, index) => {
            const distance = emp.todayStats?.distanceKm || 0;
            const percent = Math.min(100, Math.round((distance / (maxDist || 1)) * 100));

            return (
              <div key={emp.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                        index === 0
                          ? 'bg-amber-100 text-amber-800'
                          : index === 1
                          ? 'bg-slate-200 text-slate-700'
                          : index === 2
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className="font-bold text-slate-900">{emp.name}</span>
                    <span className="text-slate-400">({emp.department})</span>
                  </div>
                  <span className="font-mono font-bold text-blue-700">{distance} km</span>
                </div>

                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
