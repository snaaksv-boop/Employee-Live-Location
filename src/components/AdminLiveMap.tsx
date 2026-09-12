import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Search,
  Filter,
  RefreshCw,
  Locate,
  Layers,
  MapPin,
  Clock,
  Navigation,
  ShieldCheck,
  Radio,
  ExternalLink,
  SlidersHorizontal,
} from 'lucide-react';
import type { Employee } from '../types';

interface AdminLiveMapProps {
  employees: Employee[];
  selectedEmployeeId?: string | null;
  onSelectEmployee?: (empId: string) => void;
  onViewHistory: (empId: string) => void;
  onRefresh: () => void;
}

export const AdminLiveMap: React.FC<AdminLiveMapProps> = ({
  employees,
  selectedEmployeeId,
  onSelectEmployee,
  onViewHistory,
  onRefresh,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [empId: string]: L.Marker }>({});

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [focusedEmp, setFocusedEmp] = useState<Employee | null>(null);

  // Extract distinct departments
  const safeEmployees = Array.isArray(employees) ? employees : [];
  const departments = Array.from(new Set(safeEmployees.map((e) => e.department)));

  // Filter employees
  const filteredEmployees = safeEmployees.filter((emp) => {
    if (selectedDept !== 'all' && emp.department !== selectedDept) return false;
    if (selectedStatus !== 'all' && emp.workStatus !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        emp.name.toLowerCase().includes(q) ||
        emp.employeeId.toLowerCase().includes(q) ||
        emp.department.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Default center: First employee with location, or SF Bay Area
    const empWithLoc = employees.find((e) => e.lastLocation);
    const centerLat = empWithLoc?.lastLocation?.latitude || 37.7749;
    const centerLng = empWithLoc?.lastLocation?.longitude || -122.4194;

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 13,
      zoomControl: false,
    });

    // High quality CartoDB Positron tiles for corporate clean look
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers when employees or filters change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers not in current list
    Object.keys(markersRef.current).forEach((id) => {
      markersRef.current[id].remove();
      delete markersRef.current[id];
    });

    const bounds = L.latLngBounds([]);

    filteredEmployees.forEach((emp) => {
      if (!emp.lastLocation) return;
      const { latitude, longitude, accuracy, locationType } = emp.lastLocation;

      const isWorking = emp.workStatus === 'working';
      const isOnBreak = emp.workStatus === 'on_break';
      const isOffline = !emp.isOnline;

      const statusColor = isWorking
        ? '#10b981' // emerald
        : isOnBreak
        ? '#f59e0b' // amber
        : isOffline
        ? '#ef4444' // red
        : '#64748b'; // slate

      // Custom DivIcon marker
      const customHtml = `
        <div class="relative group cursor-pointer" style="transform: translate(-50%, -50%);">
          <!-- Pulse animation if actively tracking -->
          ${
            emp.isTracking && emp.isOnline
              ? `<span class="absolute -inset-1 rounded-full animate-ping opacity-75" style="background-color: ${statusColor};"></span>`
              : ''
          }
          <!-- Marker Avatar Container -->
          <div class="relative flex items-center justify-center h-11 w-11 rounded-full bg-white shadow-lg border-2" style="border-color: ${statusColor};">
            <img src="${emp.profilePhoto}" class="h-9 w-9 rounded-full object-cover" alt="${emp.name}" />
            <!-- Status Badge Dot -->
            <span class="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white shadow-xs" style="background-color: ${statusColor};"></span>
          </div>
          <!-- Employee ID Tag -->
          <div class="absolute top-12 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900/90 backdrop-blur-xs px-1.5 py-0.5 text-[10px] font-bold text-white shadow-md">
            ${emp.employeeId}
          </div>
        </div>
      `;

      const icon = L.divIcon({
        html: customHtml,
        className: 'custom-emp-marker',
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      const marker = L.marker([latitude, longitude], { icon }).addTo(map);

      marker.on('click', () => {
        setFocusedEmp(emp);
        if (onSelectEmployee) onSelectEmployee(emp.id);
        map.setView([latitude, longitude], 15, { animate: true });
      });

      markersRef.current[emp.id] = marker;
      bounds.extend([latitude, longitude]);
    });

    // Auto fit bounds if multiple markers exist and none specifically selected
    if (!selectedEmployeeId && filteredEmployees.length > 0 && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [filteredEmployees, selectedEmployeeId]);

  // Center on targeted employee if selectedEmployeeId prop provided
  useEffect(() => {
    if (!selectedEmployeeId || !mapInstanceRef.current) return;
    const target = employees.find((e) => e.id === selectedEmployeeId);
    if (target && target.lastLocation) {
      setFocusedEmp(target);
      mapInstanceRef.current.setView(
        [target.lastLocation.latitude, target.lastLocation.longitude],
        16,
        { animate: true }
      );
    }
  }, [selectedEmployeeId, employees]);

  const handleCenterOnEmployee = (emp: Employee) => {
    if (!mapInstanceRef.current || !emp.lastLocation) return;
    setFocusedEmp(emp);
    mapInstanceRef.current.setView(
      [emp.lastLocation.latitude, emp.lastLocation.longitude],
      16,
      { animate: true }
    );
  };

  return (
    <div className="relative flex flex-col h-[calc(100vh-8.5rem)] rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Search & Filters (Interactive) */}
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto bg-white/95 backdrop-blur-md p-2 rounded-2xl shadow-lg border border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search employee or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-44 sm:w-56 rounded-xl bg-slate-50 pl-9 pr-3 text-xs text-slate-900 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="h-9 rounded-xl bg-slate-50 px-3 text-xs font-medium text-slate-700 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-9 rounded-xl bg-slate-50 px-3 text-xs font-medium text-slate-700 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="working">Working</option>
            <option value="on_break">On Break</option>
            <option value="not_started">Not Started</option>
          </select>

          <button
            onClick={onRefresh}
            title="Refresh Live Geolocation Feed"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* Live Count Pill */}
        <div className="pointer-events-auto flex items-center gap-2 rounded-2xl bg-slate-900/90 text-white backdrop-blur-md px-3.5 py-2 shadow-lg text-xs font-medium">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          <span>
            {filteredEmployees.filter((e) => e.isTracking && e.isOnline).length} Active Live
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-300">{filteredEmployees.length} Total</span>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="h-full w-full z-10" />

      {/* Slide-out Employee Detail Inspector Card */}
      {focusedEmp && (
        <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-96 z-20 rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-md p-4 shadow-2xl animate-in fade-in slide-in-from-bottom-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <img
                src={focusedEmp.profilePhoto}
                alt={focusedEmp.name}
                className="h-12 w-12 rounded-full object-cover border-2 border-blue-500"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 text-sm">{focusedEmp.name}</h4>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-700">
                    {focusedEmp.employeeId}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{focusedEmp.designation}</p>
                <span className="text-[11px] font-medium text-blue-600">{focusedEmp.department}</span>
              </div>
            </div>

            <button
              onClick={() => setFocusedEmp(null)}
              className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl bg-slate-50 p-2 border border-slate-100">
              <span className="text-[10px] text-slate-400 block font-medium">Current Status</span>
              <span className="font-semibold capitalize text-slate-800">
                {focusedEmp.workStatus.replace('_', ' ')}
              </span>
            </div>

            <div className="rounded-xl bg-slate-50 p-2 border border-slate-100">
              <span className="text-[10px] text-slate-400 block font-medium">GPS Accuracy</span>
              <span className="font-semibold text-slate-800">
                ±{Math.round(focusedEmp.lastLocation?.accuracy || 0)}m (
                {focusedEmp.lastLocation?.locationType?.toUpperCase()})
              </span>
            </div>

            <div className="rounded-xl bg-slate-50 p-2 border border-slate-100">
              <span className="text-[10px] text-slate-400 block font-medium">Check-In Time</span>
              <span className="font-semibold text-slate-800">
                {focusedEmp.todayStats?.checkIn || 'Not recorded'}
              </span>
            </div>

            <div className="rounded-xl bg-slate-50 p-2 border border-slate-100">
              <span className="text-[10px] text-slate-400 block font-medium">Today's Distance</span>
              <span className="font-semibold text-slate-800">
                {focusedEmp.todayStats?.distanceKm || 0} km
              </span>
            </div>
          </div>

          {/* Location & Speed */}
          <div className="mt-2.5 rounded-xl bg-slate-50 p-2.5 border border-slate-100 text-xs">
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <MapPin className="h-3.5 w-3.5 text-blue-600" />
              <span className="font-medium text-[11px]">Last Location Address</span>
            </div>
            <p className="font-medium text-slate-800">
              {focusedEmp.lastLocation?.address ||
                `${focusedEmp.lastLocation?.latitude.toFixed(5)}, ${focusedEmp.lastLocation?.longitude.toFixed(5)}`}
            </p>
            <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
              <span>
                Updated:{' '}
                {focusedEmp.lastLocation
                  ? new Date(focusedEmp.lastLocation.timestamp).toLocaleTimeString()
                  : 'N/A'}
              </span>
              <span>Speed: {focusedEmp.lastLocation?.speed ? `${Math.round(focusedEmp.lastLocation.speed)} km/h` : '0 km/h'}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => handleCenterOnEmployee(focusedEmp)}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <Locate className="h-3.5 w-3.5" />
              <span>Center</span>
            </button>
            <button
              onClick={() => onViewHistory(focusedEmp.id)}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2 text-xs font-semibold text-white hover:bg-blue-500 shadow-sm transition-all"
            >
              <Navigation className="h-3.5 w-3.5" />
              <span>Route History</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
