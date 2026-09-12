import React, { useEffect, useState } from 'react';
import {
  FileBarChart2,
  Calendar,
  User,
  Download,
  Printer,
  FileSpreadsheet,
  Clock,
  Navigation,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import type { Employee } from '../types';
import { api } from '../services/api';

interface ComprehensiveReportsProps {
  employees: Employee[];
}

export const ComprehensiveReports: React.FC<ComprehensiveReportsProps> = ({ employees = [] }) => {
  const safeEmployees = Array.isArray(employees) ? employees : [];
  const [reportType, setReportType] = useState<'daily' | 'range'>('daily');
  const [selectedEmpId, setSelectedEmpId] = useState<string>(
    safeEmployees.length > 0 ? safeEmployees[0].id : ''
  );
  const [dailyDate, setDailyDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const [loading, setLoading] = useState(false);
  const [dailyData, setDailyData] = useState<any>(null);
  const [rangeData, setRangeData] = useState<any>(null);

  useEffect(() => {
    if (!selectedEmpId && safeEmployees.length > 0) {
      setSelectedEmpId(safeEmployees[0].id);
    }
  }, [safeEmployees, selectedEmpId]);

  const selectedEmployee = safeEmployees.find((e) => e.id === selectedEmpId);

  // Load Daily Report
  const loadDailyReport = async () => {
    if (!selectedEmpId) return;
    setLoading(true);
    try {
      const res = await api.getMovementHistory(selectedEmpId, dailyDate);
      setDailyData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load Date Range Report
  const loadRangeReport = async () => {
    if (!selectedEmpId) return;
    setLoading(true);
    try {
      const res = await api.getDateRangeReport(selectedEmpId, startDate, endDate);
      setRangeData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (reportType === 'daily') {
      loadDailyReport();
    } else {
      loadRangeReport();
    }
  }, [reportType, selectedEmpId, dailyDate, startDate, endDate]);

  // Export CSV
  const handleExportCSV = () => {
    if (reportType === 'daily' && dailyData) {
      const headers = ['S.No', 'Place / Location', 'Arrival', 'Departure', 'Duration (min)', 'GPS Pings'];
      const rows = dailyData.stays.map((s: any, idx: number) => [
        idx + 1,
        `"${s.placeName.replace(/"/g, '""')}"`,
        s.arrivalTime,
        s.departureTime,
        s.durationMinutes,
        s.gpsPointsCount,
      ]);
      const csvContent =
        `Daily Movement & Stay Report - ${selectedEmployee?.name} (${dailyDate})\n` +
        `Total Distance: ${dailyData.totalDistanceKm} km, Recorded Points: ${dailyData.pointsCount}\n\n` +
        [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');

      downloadBlob(csvContent, `Daily_Report_${selectedEmployee?.employeeId}_${dailyDate}.csv`);
    } else if (reportType === 'range' && rangeData) {
      const headers = ['Date', 'Check-In', 'Check-Out', 'Working Hours', 'Distance (km)', 'Stops', 'Stay Time (min)'];
      const rows = rangeData.rows.map((r: any) => [
        r.date,
        r.checkIn,
        r.checkOut,
        r.workingHours,
        r.distanceKm,
        r.stopsCount,
        r.stayMinutes,
      ]);
      const csvContent =
        `Date Range Summary Report - ${selectedEmployee?.name} (${startDate} to ${endDate})\n` +
        `Total Hours: ${rangeData.summary.totalWorkingHours}, Total Distance: ${rangeData.summary.totalDistanceKm} km, Avg Daily: ${rangeData.summary.averageDailyDistanceKm} km\n\n` +
        [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');

      downloadBlob(csvContent, `Range_Report_${selectedEmployee?.employeeId}_${startDate}_to_${endDate}.csv`);
    }
  };

  const downloadBlob = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Workforce Analytics & Movement Reports
          </h2>
          <p className="text-xs text-slate-500">
            Export official field audit records, daily route sheets, and range summaries.
          </p>
        </div>

        {/* Action Buttons: View, Print, Download PDF, Export CSV (Section 11) */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors"
          >
            <Printer className="h-4 w-4" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Mode Switcher & Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
        {/* Toggle Report Type */}
        <div className="flex items-center rounded-xl bg-slate-100 p-1 text-xs font-semibold">
          <button
            onClick={() => setReportType('daily')}
            className={`rounded-lg px-3 py-1.5 transition-all ${
              reportType === 'daily'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Daily Movement Report
          </button>
          <button
            onClick={() => setReportType('range')}
            className={`rounded-lg px-3 py-1.5 transition-all ${
              reportType === 'range'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Date Range Summary
          </button>
        </div>

        {/* Employee & Date Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-slate-400" />
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="h-9 rounded-xl bg-slate-50 px-3 text-xs font-semibold text-slate-800 border border-slate-200"
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.employeeId})
                </option>
              ))}
            </select>
          </div>

          {reportType === 'daily' ? (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              <input
                type="date"
                value={dailyDate}
                onChange={(e) => setDailyDate(e.target.value)}
                className="h-9 rounded-xl bg-slate-50 px-3 text-xs font-semibold text-slate-800 border border-slate-200"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">From</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 rounded-xl bg-slate-50 px-3 text-xs font-semibold text-slate-800 border border-slate-200"
              />
              <span className="text-xs text-slate-400">To</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 rounded-xl bg-slate-50 px-3 text-xs font-semibold text-slate-800 border border-slate-200"
              />
            </div>
          )}
        </div>
      </div>

      {/* REPORT CONTENT VIEW */}
      {reportType === 'daily' && dailyData && (
        <div className="space-y-6">
          {/* Section 9: Daily Movement Report Cards */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Daily Workforce Field Movement Report
                </h3>
                <p className="text-xs text-slate-500">Official verified GPS field log</p>
              </div>
              <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                DATE: {dailyDate}
              </span>
            </div>

            {/* 1. Employee Information */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="rounded-xl bg-slate-50 p-3">
                <span className="text-slate-400 font-medium block">Employee Name</span>
                <span className="font-bold text-slate-900 text-sm">{selectedEmployee?.name}</span>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <span className="text-slate-400 font-medium block">Employee ID</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {selectedEmployee?.employeeId}
                </span>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <span className="text-slate-400 font-medium block">Department</span>
                <span className="font-bold text-slate-900 text-sm">
                  {selectedEmployee?.department}
                </span>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <span className="text-slate-400 font-medium block">Branch Area</span>
                <span className="font-bold text-slate-900 text-sm">
                  {selectedEmployee?.assignedArea}
                </span>
              </div>
            </div>

            {/* 2. Attendance Stats */}
            <div className="rounded-xl border border-slate-200 p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Shift & Attendance Metrics
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Check-In:</span>
                  <span className="font-bold text-slate-900">
                    {dailyData.attendance?.checkIn || selectedEmployee?.todayStats.checkIn || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Check-Out:</span>
                  <span className="font-bold text-slate-900">
                    {dailyData.attendance?.checkOut || selectedEmployee?.todayStats.checkOut || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Total Working Time:</span>
                  <span className="font-bold text-purple-700">
                    {dailyData.attendance?.totalWorkMinutes
                      ? `${Math.round((dailyData.attendance.totalWorkMinutes / 60) * 10) / 10} hrs`
                      : `${Math.round(((selectedEmployee?.todayStats.workingMinutes || 0) / 60) * 10) / 10} hrs`}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Break Time:</span>
                  <span className="font-bold text-amber-700">
                    {dailyData.attendance?.totalBreakMinutes || 0} min
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Movement Summary */}
            <div className="rounded-xl border border-slate-200 p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Movement & Travel Analysis
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">First Location:</span>
                  <span className="font-semibold text-slate-900 truncate block">
                    {dailyData.points[0]?.address?.split(',')[0] || 'Base Office'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Last Location:</span>
                  <span className="font-semibold text-slate-900 truncate block">
                    {dailyData.points[dailyData.points.length - 1]?.address?.split(',')[0] || 'Final Site'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Total Distance:</span>
                  <span className="font-bold text-blue-700">{dailyData.totalDistanceKm} km</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Location Updates:</span>
                  <span className="font-bold text-slate-900">{dailyData.pointsCount}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Number of Stops:</span>
                  <span className="font-bold text-slate-900">
                    {Math.max(1, dailyData.stays.length + 1)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Detected Stays:</span>
                  <span className="font-bold text-amber-700">{dailyData.stays.length}</span>
                </div>
              </div>
            </div>

            {/* 4. Stay Report Table (Section 9) */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Stay Report Table
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">S.No</th>
                      <th className="px-4 py-2.5">Location</th>
                      <th className="px-4 py-2.5">Arrival</th>
                      <th className="px-4 py-2.5">Departure</th>
                      <th className="px-4 py-2.5">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dailyData.stays.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400">
                          No prolonged stays detected on this date.
                        </td>
                      </tr>
                    ) : (
                      dailyData.stays.map((s: any, idx: number) => (
                        <tr key={s.id} className="hover:bg-slate-50/70">
                          <td className="px-4 py-2.5 font-bold">{idx + 1}</td>
                          <td className="px-4 py-2.5 font-semibold text-slate-900">
                            {s.placeName} ({s.address})
                          </td>
                          <td className="px-4 py-2.5">{s.arrivalTime}</td>
                          <td className="px-4 py-2.5">{s.departureTime}</td>
                          <td className="px-4 py-2.5 font-bold text-amber-700">
                            {s.durationMinutes} min
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DATE RANGE REPORT (Section 12) */}
      {reportType === 'range' && rangeData && (
        <div className="space-y-6">
          {/* Range Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <span className="text-xs text-slate-400 font-medium block">Total Working Hours</span>
              <div className="text-2xl font-bold text-purple-700 mt-1">
                {rangeData.summary.totalWorkingHours} hrs
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <span className="text-xs text-slate-400 font-medium block">Total Distance</span>
              <div className="text-2xl font-bold text-blue-700 mt-1">
                {rangeData.summary.totalDistanceKm} km
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <span className="text-xs text-slate-400 font-medium block">Total Stay Time</span>
              <div className="text-2xl font-bold text-amber-600 mt-1">
                {rangeData.summary.totalStayMinutes} min
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <span className="text-xs text-slate-400 font-medium block">Average Daily Distance</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">
                {rangeData.summary.averageDailyDistanceKm} km/day
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <span className="text-xs text-slate-400 font-medium block">Working Days</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {rangeData.summary.workingDaysCount} days
              </div>
            </div>
          </div>

          {/* Range Summary Table (Section 12) */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="border-b border-slate-100 px-6 py-4">
              <h3 className="text-base font-bold text-slate-900">
                Date Range Summary: {selectedEmployee?.name} ({startDate} to {endDate})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3.5">Date</th>
                    <th className="px-4 py-3.5">Check-In</th>
                    <th className="px-4 py-3.5">Check-Out</th>
                    <th className="px-4 py-3.5">Working Hours</th>
                    <th className="px-4 py-3.5">Distance</th>
                    <th className="px-4 py-3.5">Stops</th>
                    <th className="px-6 py-3.5 text-right">Stay Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rangeData.rows.map((row: any) => (
                    <tr key={row.date} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-3.5 font-bold text-slate-900">{row.date}</td>
                      <td className="px-4 py-3.5 font-medium text-slate-700">{row.checkIn}</td>
                      <td className="px-4 py-3.5 font-medium text-slate-700">{row.checkOut}</td>
                      <td className="px-4 py-3.5 font-semibold text-purple-700">
                        {row.workingHours} hrs
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-blue-700">
                        {row.distanceKm} km
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-700">{row.stopsCount}</td>
                      <td className="px-6 py-3.5 text-right font-bold text-amber-700">
                        {row.stayMinutes} min
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
