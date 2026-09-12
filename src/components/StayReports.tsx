import React, { useEffect, useState } from 'react';
import {
  Clock,
  MapPin,
  Sliders,
  CheckCircle2,
  Calendar,
  User,
  Search,
  Save,
  Info,
} from 'lucide-react';
import type { Employee, StayRecord, StayDetectionSettings } from '../types';
import { api } from '../services/api';

interface StayReportsProps {
  employees: Employee[];
}

export const StayReports: React.FC<StayReportsProps> = ({ employees = [] }) => {
  const [stays, setStays] = useState<StayRecord[]>([]);
  const [selectedEmp, setSelectedEmp] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [settings, setSettings] = useState<StayDetectionSettings>({
    minStayMinutes: 15,
    stayRadiusMeters: 65,
    autoReverseGeocode: true,
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    loadStays();
    loadSettings();
  }, [selectedEmp, selectedDate]);

  const loadStays = async () => {
    try {
      const res = await api.getStays({
        employeeId: selectedEmp !== 'all' ? selectedEmp : undefined,
        date: selectedDate || undefined,
      });
      setStays(res.stays || []);
    } catch (err) {
      console.error('Error fetching stays', err);
    }
  };

  const loadSettings = async () => {
    try {
      const s = await api.getStaySettings();
      setSettings(s);
    } catch (err) {
      console.error('Error loading stay settings', err);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await api.updateStaySettings(settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      loadStays();
    } catch (err) {
      console.error('Failed updating stay settings', err);
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Workforce Stay & Stop Detection
          </h2>
          <p className="text-xs text-slate-500">
            Geographic stationary period analysis identifying client visits, delivery stops, and resting intervals.
          </p>
        </div>
      </div>

      {/* Stay Detection Settings Card (Section 8 configuration requirement) */}
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/60 to-indigo-50/40 p-5 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <Sliders className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-slate-900">
              Stay Detection Algorithm Configuration
            </h3>
            <p className="text-xs text-slate-600 mt-0.5 max-w-2xl">
              If an employee remains within the geographic radius for at least the minimum duration, the telemetry engine classifies the cluster as a verified stay.
            </p>

            <form onSubmit={handleSaveSettings} className="mt-4 flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <label className="font-semibold text-slate-700">Minimum Stay Duration:</label>
                <select
                  value={settings.minStayMinutes}
                  onChange={(e) =>
                    setSettings({ ...settings, minStayMinutes: Number(e.target.value) })
                  }
                  className="rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 border border-slate-300 focus:ring-2 focus:ring-blue-500"
                >
                  <option value={5}>5 Minutes (Short Stop)</option>
                  <option value={10}>10 Minutes</option>
                  <option value={15}>15 Minutes (Standard Field Visit)</option>
                  <option value={30}>30 Minutes (Extended Appointment)</option>
                  <option value={60}>60 Minutes (Major Project Stay)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="font-semibold text-slate-700">Geographic Detection Radius:</label>
                <select
                  value={settings.stayRadiusMeters}
                  onChange={(e) =>
                    setSettings({ ...settings, stayRadiusMeters: Number(e.target.value) })
                  }
                  className="rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 border border-slate-300 focus:ring-2 focus:ring-blue-500"
                >
                  <option value={35}>35 Meters (Strict / Indoor)</option>
                  <option value={50}>50 Meters (Medium Accuracy)</option>
                  <option value={65}>65 Meters (Recommended for GPS Drift)</option>
                  <option value={100}>100 Meters (Large Campus / Complex)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={savingSettings}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-1.5 font-semibold text-white shadow-xs hover:bg-blue-500 transition-all disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{savingSettings ? 'Saving...' : 'Update Algorithm'}</span>
              </button>

              {savedSuccess && (
                <span className="flex items-center gap-1 text-emerald-700 font-semibold text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Settings updated successfully!</span>
                </span>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-slate-400" />
            <select
              value={selectedEmp}
              onChange={(e) => setSelectedEmp(e.target.value)}
              className="h-9 rounded-xl bg-slate-50 px-3 text-xs font-semibold text-slate-800 border border-slate-200"
            >
              <option value="all">All Employees</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.employeeId})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-9 rounded-xl bg-slate-50 px-3 text-xs font-semibold text-slate-800 border border-slate-200"
            />
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Total Detected Stays:{' '}
          <span className="font-bold text-slate-900">{stays.length}</span>
        </div>
      </div>

      {/* Stay Report Table (Section 8 & 9) */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">S.No</th>
                <th className="px-4 py-3.5">Employee</th>
                <th className="px-4 py-3.5">Place / Area Name</th>
                <th className="px-4 py-3.5">Approximate Address</th>
                <th className="px-4 py-3.5">Arrival Time</th>
                <th className="px-4 py-3.5">Departure Time</th>
                <th className="px-4 py-3.5">Total Stay Duration</th>
                <th className="px-6 py-3.5 text-right">GPS Updates Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stays.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    No verified stays recorded for the selected filter criteria.
                  </td>
                </tr>
              ) : (
                stays.map((s, idx) => {
                  const emp = employees.find((e) => e.id === s.employeeId);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-3.5 font-bold text-slate-700">#{idx + 1}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{emp?.name || s.employeeId}</span>
                          <span className="font-mono text-[10px] text-slate-400">
                            {emp?.employeeId}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">{s.placeName}</td>
                      <td className="px-4 py-3.5 text-slate-600 max-w-xs truncate">{s.address}</td>
                      <td className="px-4 py-3.5 font-medium text-slate-700">{s.arrivalTime}</td>
                      <td className="px-4 py-3.5 font-medium text-slate-700">{s.departureTime}</td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200">
                          <Clock className="h-3 w-3" />
                          <span>{s.durationMinutes} min</span>
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right font-mono font-semibold text-slate-700">
                        {s.gpsPointsCount} pings
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
