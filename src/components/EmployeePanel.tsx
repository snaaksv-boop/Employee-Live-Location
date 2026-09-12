import React, { useEffect, useState } from 'react';
import {
  Smartphone,
  MapPin,
  Clock,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Wifi,
  WifiOff,
  Coffee,
  Play,
  Square,
  Shield,
  RefreshCw,
  LogOut,
  Layers,
  ChevronRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import type { Employee, UserSession } from '../types';
import { geoService, GeoState } from '../services/geolocation';
import { api } from '../services/api';

interface EmployeePanelProps {
  currentEmployee: Employee;
  onLogout: () => void;
  onRefreshEmployee: () => Promise<void>;
}

export const EmployeePanel: React.FC<EmployeePanelProps> = ({
  currentEmployee,
  onLogout,
  onRefreshEmployee,
}) => {
  const [geoState, setGeoState] = useState<GeoState>(geoService.getState());
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [syncingOffline, setSyncingOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = geoService.subscribe((state) => {
      setGeoState(state);
    });
    return () => unsubscribe();
  }, []);

  // Check In Handler
  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      await api.checkIn(currentEmployee.id);
      await onRefreshEmployee();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Check Out Handler
  const handleCheckOut = async () => {
    if (geoState.isTracking) {
      geoService.stopTracking();
      await api.stopTracking(currentEmployee.id);
    }
    setActionLoading(true);
    try {
      await api.checkOut(currentEmployee.id);
      await onRefreshEmployee();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Start Break
  const handleStartBreak = async () => {
    setActionLoading(true);
    try {
      await api.startBreak(currentEmployee.id);
      await onRefreshEmployee();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // End Break
  const handleEndBreak = async () => {
    setActionLoading(true);
    try {
      await api.endBreak(currentEmployee.id);
      await onRefreshEmployee();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Tracking Toggle with Mandatory Consent Check (Section 4, 5, 13)
  const handleToggleTrackingClick = () => {
    if (geoState.isTracking) {
      geoService.stopTracking();
      api.stopTracking(currentEmployee.id);
    } else {
      setShowConsentModal(true);
    }
  };

  const handleConfirmConsentAndStart = async () => {
    setShowConsentModal(false);
    const success = await geoService.startTracking(currentEmployee.id);
    if (success) {
      await api.startTracking(currentEmployee.id, true);
      await onRefreshEmployee();
    }
  };

  // Manual Offline Flush
  const handleFlushOffline = async () => {
    setSyncingOffline(true);
    try {
      await geoService.flushOfflineQueue();
      await onRefreshEmployee();
    } finally {
      setSyncingOffline(false);
    }
  };

  const isCheckedIn = Boolean(currentEmployee.todayStats?.checkIn);
  const isCheckedOut = Boolean(currentEmployee.todayStats?.checkOut);
  const isOnBreak = currentEmployee.workStatus === 'on_break';
  const isWorking = currentEmployee.workStatus === 'working';

  return (
    <div className="mx-auto max-w-lg space-y-4 px-3 py-4 sm:px-4 sm:py-6">
      {/* Employee Identity Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={currentEmployee.profilePhoto}
              alt={currentEmployee.name}
              className="h-14 w-14 rounded-full object-cover border-2 border-blue-600 shadow-sm"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-extrabold text-slate-900 text-base">{currentEmployee.name}</h2>
                {currentEmployee.isDemo && (
                  <span className="rounded bg-amber-100 px-1.5 py-0.2 text-[9px] font-bold text-amber-800">
                    DEMO
                  </span>
                )}
              </div>
              <span className="font-mono text-xs font-bold text-slate-400 block">
                {currentEmployee.employeeId}
              </span>
              <p className="text-xs text-slate-500">{currentEmployee.designation}</p>
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Sign out"
            className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        {/* Assigned Area Tag */}
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
          <span className="text-slate-500">Branch Assignment:</span>
          <span className="font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
            {currentEmployee.assignedArea}
          </span>
        </div>
      </div>

      {/* Network & Offline Status Banner (Section 14) */}
      {!geoState.isOnline ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 shadow-xs">
          <div className="flex items-center gap-2 font-bold">
            <WifiOff className="h-4 w-4 text-amber-600" />
            <span>OFFLINE MODE ACTIVE</span>
          </div>
          <p className="mt-1 text-[11px] text-amber-800">
            Internet disconnected. GPS points are buffered securely on your device and will synchronize automatically upon reconnect.
          </p>
          {geoState.pendingOfflineCount > 0 && (
            <div className="mt-2 flex items-center justify-between font-semibold">
              <span>{geoState.pendingOfflineCount} points pending sync</span>
              <button
                onClick={handleFlushOffline}
                disabled={syncingOffline}
                className="rounded-lg bg-amber-600 px-3 py-1 text-white hover:bg-amber-700 text-[11px]"
              >
                {syncingOffline ? 'Syncing...' : 'Retry Sync Now'}
              </button>
            </div>
          )}
        </div>
      ) : geoState.pendingOfflineCount > 0 ? (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-blue-600" />
            <span>{geoState.pendingOfflineCount} offline buffered points ready</span>
          </div>
          <button
            onClick={handleFlushOffline}
            disabled={syncingOffline}
            className="rounded-lg bg-blue-600 px-3 py-1 text-white hover:bg-blue-700 text-[11px] font-semibold"
          >
            {syncingOffline ? 'Syncing...' : 'Sync to Server'}
          </button>
        </div>
      ) : null}

      {/* Live Tracking Status & Explicit Toggle (Section 4, 5, 13) */}
      <div
        className={`rounded-3xl border p-5 shadow-sm transition-all ${
          geoState.isTracking
            ? 'border-emerald-200 bg-gradient-to-br from-emerald-500/10 via-white to-white'
            : 'border-slate-200 bg-white'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                geoState.isTracking
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              <Radio
                className={`h-5 w-5 ${geoState.isTracking ? 'animate-pulse' : ''}`}
              />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Workforce Location Telemetry
              </span>
              <span
                className={`text-sm font-extrabold ${
                  geoState.isTracking ? 'text-emerald-700' : 'text-slate-700'
                }`}
              >
                {geoState.isTracking ? 'GPS Live Tracking Active' : 'Tracking Paused / Inactive'}
              </span>
            </div>
          </div>

          <button
            onClick={handleToggleTrackingClick}
            className={`flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all shadow-sm ${
              geoState.isTracking
                ? 'bg-rose-600 text-white hover:bg-rose-500'
                : 'bg-emerald-600 text-white hover:bg-emerald-500'
            }`}
          >
            {geoState.isTracking ? (
              <>
                <Square className="h-3.5 w-3.5 fill-current" />
                <span>Stop Tracking</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Start Tracking</span>
              </>
            )}
          </button>
        </div>

        {/* Clear Notice (Section 13) */}
        <div className="mt-3 rounded-xl bg-slate-50 p-2.5 text-[11px] text-slate-500 border border-slate-100">
          <div className="flex items-center gap-1 text-slate-700 font-semibold mb-0.5">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
            <span>Transparent Corporate Privacy Policy:</span>
          </div>
          Location tracking is active strictly for authorized work purposes. Your location data will be recorded only according to company policy and halts during breaks or check-out.
        </div>

        {/* Real GPS Sensor Feedback (Section 5, 20) */}
        {geoState.error ? (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <p className="font-bold">GPS Sensor Notice</p>
              <p className="text-[11px] text-rose-700 mt-0.5">{geoState.error}</p>
            </div>
          </div>
        ) : geoState.lastPosition ? (
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl bg-slate-50 p-2 border border-slate-100">
              <span className="text-[10px] text-slate-400 block font-medium">GPS Accuracy Fix</span>
              <span
                className={`font-bold font-mono ${
                  geoState.lastPosition.accuracy <= 15
                    ? 'text-emerald-700'
                    : 'text-amber-700'
                }`}
              >
                ±{Math.round(geoState.lastPosition.accuracy)}m (LIVE FIX)
              </span>
            </div>

            <div className="rounded-xl bg-slate-50 p-2 border border-slate-100">
              <span className="text-[10px] text-slate-400 block font-medium">Current Speed</span>
              <span className="font-bold font-mono text-slate-800">
                {geoState.lastPosition.speed
                  ? `${Math.round(geoState.lastPosition.speed)} km/h`
                  : 'Stationary (0 km/h)'}
              </span>
            </div>

            <div className="col-span-2 rounded-xl bg-slate-50 p-2 border border-slate-100">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-600">
                <span>
                  Lat: {geoState.lastPosition.latitude.toFixed(5)}, Lng:{' '}
                  {geoState.lastPosition.longitude.toFixed(5)}
                </span>
                <span className="text-[10px] text-slate-400">
                  {new Date(geoState.lastPosition.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-3 text-center text-xs text-slate-400 py-1">
            {geoState.isTracking
              ? 'Acquiring high-accuracy browser GPS satellite fix...'
              : 'Turn on tracking when beginning your route to record field movement.'}
          </div>
        )}
      </div>

      {/* Shift Attendance Controls (Section 4) */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Shift & Attendance Controls</h3>
            <p className="text-xs text-slate-500">Record daily punch and break periods</p>
          </div>

          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
              isWorking
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : isOnBreak
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : isCheckedOut
                ? 'bg-slate-100 text-slate-600'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {isWorking ? 'ON DUTY' : isOnBreak ? 'ON BREAK' : isCheckedOut ? 'COMPLETED' : 'NOT CHECKED IN'}
          </span>
        </div>

        {/* Primary Punch Buttons */}
        <div className="grid grid-cols-2 gap-3">
          {!isCheckedIn ? (
            <button
              onClick={handleCheckIn}
              disabled={actionLoading}
              className="col-span-2 flex items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3 text-xs font-bold text-white shadow-md hover:bg-blue-500 transition-all"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Check-In to Shift</span>
            </button>
          ) : !isCheckedOut ? (
            <>
              {/* Break Button */}
              {isOnBreak ? (
                <button
                  onClick={handleEndBreak}
                  disabled={actionLoading}
                  className="flex items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-500"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>End Break / Resume</span>
                </button>
              ) : (
                <button
                  onClick={handleStartBreak}
                  disabled={actionLoading}
                  className="flex items-center justify-center gap-1.5 rounded-2xl bg-amber-500 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-amber-400"
                >
                  <Coffee className="h-3.5 w-3.5" />
                  <span>Start Break</span>
                </button>
              )}

              {/* Check Out */}
              <button
                onClick={handleCheckOut}
                disabled={actionLoading}
                className="flex items-center justify-center gap-1.5 rounded-2xl border border-slate-300 bg-white py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Check-Out Shift</span>
              </button>
            </>
          ) : (
            <div className="col-span-2 rounded-2xl bg-slate-100 py-2.5 text-center text-xs font-bold text-slate-600">
              Shift Completed for Today
            </div>
          )}
        </div>

        {/* Shift Stats Counters */}
        <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
          <div className="rounded-2xl bg-slate-50 p-3 text-center">
            <span className="text-[11px] font-semibold text-slate-400 block">Today's Working Hours</span>
            <span className="text-xl font-extrabold text-purple-700 mt-1 block">
              {Math.round(((currentEmployee.todayStats?.workingMinutes || 0) / 60) * 10) / 10} hrs
            </span>
          </div>

          <div className="rounded-2xl bg-slate-50 p-3 text-center">
            <span className="text-[11px] font-semibold text-slate-400 block">Today's Distance</span>
            <span className="text-xl font-extrabold text-blue-700 mt-1 block">
              {currentEmployee.todayStats?.distanceKm || 0} km
            </span>
          </div>
        </div>
      </div>

      {/* MANDATORY CONSENT MODAL (Section 13) */}
      {showConsentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 mx-auto">
              <ShieldCheck className="h-6 w-6" />
            </div>

            <h3 className="mt-4 text-center text-base font-bold text-slate-900">
              Authorized Location Tracking Consent
            </h3>

            <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 leading-relaxed border border-slate-100">
              <p className="font-semibold text-slate-900 mb-1">
                "Location tracking is active for authorized work purposes. Your location data will be recorded only according to company policy."
              </p>
              <p className="text-[11px] text-slate-500 mt-2">
                Your device GPS will periodically share coordinates while you are actively on-duty. Tracking stops during breaks or when you end your shift.
              </p>
            </div>

            <div className="mt-5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowConsentModal(false)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmConsentAndStart}
                className="flex-1 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-500 shadow-md"
              >
                Agree & Start
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
