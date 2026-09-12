import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Calendar,
  User,
  Route,
  Navigation,
  Clock,
  MapPin,
  CheckCircle2,
  ChevronRight,
  Coffee,
  Building,
  Flag,
  Radio,
  FileSpreadsheet,
} from 'lucide-react';
import type { Employee, LocationRecord, StayRecord, TimelineEvent, AttendanceRecord } from '../types';
import { api } from '../services/api';

interface MovementHistoryProps {
  employees: Employee[];
  initialEmployeeId?: string | null;
}

export const MovementHistory: React.FC<MovementHistoryProps> = ({
  employees,
  initialEmployeeId,
}) => {
  const [selectedEmpId, setSelectedEmpId] = useState<string>(
    initialEmployeeId || (employees.length > 0 ? employees[0].id : '')
  );
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(false);
  const [historyData, setHistoryData] = useState<{
    employee: Employee;
    totalDistanceKm: number;
    pointsCount: number;
    points: LocationRecord[];
    stays: StayRecord[];
    attendance?: AttendanceRecord;
    timeline: TimelineEvent[];
  } | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const pathLayerRef = useRef<L.Polyline | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (initialEmployeeId) {
      setSelectedEmpId(initialEmployeeId);
    }
  }, [initialEmployeeId]);

  // Load history data from backend API
  const loadHistory = async (empId: string, date: string) => {
    if (!empId) return;
    setLoading(true);
    try {
      const data = await api.getMovementHistory(empId, date);
      setHistoryData(data);
    } catch (err) {
      console.error('Failed loading movement history', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedEmpId) {
      loadHistory(selectedEmpId, selectedDate);
    }
  }, [selectedEmpId, selectedDate]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [37.7749, -122.4194],
      zoom: 13,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    markersGroupRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Render Route and Stops on Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !markersGroupRef.current) return;

    markersGroupRef.current.clearLayers();
    if (pathLayerRef.current) {
      pathLayerRef.current.remove();
      pathLayerRef.current = null;
    }

    if (!historyData || historyData.points.length === 0) return;

    const latLngs: L.LatLngExpression[] = historyData.points.map((p) => [p.latitude, p.longitude]);

    // Draw connected path polyline
    pathLayerRef.current = L.polyline(latLngs, {
      color: '#2563eb', // Blue-600
      weight: 4,
      opacity: 0.85,
      dashArray: '8, 8',
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    // Add Start Marker (Flag)
    const firstPoint = historyData.points[0];
    const startIcon = L.divIcon({
      html: `
        <div class="flex items-center justify-center h-8 w-8 rounded-full bg-emerald-600 text-white shadow-lg border-2 border-white font-bold text-xs">
          A
        </div>
      `,
      className: 'start-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
    L.marker([firstPoint.latitude, firstPoint.longitude], { icon: startIcon })
      .bindPopup(
        `<div class="p-1 text-xs"><b>Shift Start / Origin</b><br/>${new Date(firstPoint.timestamp).toLocaleTimeString()}<br/>${firstPoint.address || ''}</div>`
      )
      .addTo(markersGroupRef.current);

    // Add End Marker
    const lastPoint = historyData.points[historyData.points.length - 1];
    const endIcon = L.divIcon({
      html: `
        <div class="flex items-center justify-center h-8 w-8 rounded-full bg-rose-600 text-white shadow-lg border-2 border-white font-bold text-xs">
          B
        </div>
      `,
      className: 'end-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
    L.marker([lastPoint.latitude, lastPoint.longitude], { icon: endIcon })
      .bindPopup(
        `<div class="p-1 text-xs"><b>Current / Final Fix</b><br/>${new Date(lastPoint.timestamp).toLocaleTimeString()}<br/>${lastPoint.address || ''}</div>`
      )
      .addTo(markersGroupRef.current);

    // Add Detected Stays with Detection Radius Circle & Numbered Stop Pin
    historyData.stays.forEach((stay, idx) => {
      // Draw 65m Stay Radius Circle
      L.circle([stay.latitude, stay.longitude], {
        radius: 65,
        color: '#f59e0b',
        fillColor: '#fbbf24',
        fillOpacity: 0.25,
        weight: 1.5,
      }).addTo(markersGroupRef.current!);

      // Numbered Stop Marker Pin
      const stopIcon = L.divIcon({
        html: `
          <div class="flex flex-col items-center">
            <div class="flex items-center justify-center h-7 w-7 rounded-full bg-amber-500 text-white shadow-md border-2 border-white font-extrabold text-[11px]">
              ${idx + 1}
            </div>
            <div class="rounded bg-slate-900/90 text-white px-1 text-[9px] font-bold shadow-xs whitespace-nowrap mt-0.5">
              ${stay.durationMinutes}m
            </div>
          </div>
        `,
        className: 'stay-marker',
        iconSize: [30, 42],
        iconAnchor: [15, 21],
      });

      L.marker([stay.latitude, stay.longitude], { icon: stopIcon })
        .bindPopup(
          `<div class="p-1 text-xs">
            <b class="text-slate-900 font-bold">Stop ${idx + 1}: ${stay.placeName}</b>
            <div class="text-slate-600 mt-1">${stay.address}</div>
            <div class="text-slate-500 mt-1">Arrival: <b>${stay.arrivalTime}</b> | Departure: <b>${stay.departureTime}</b></div>
            <div class="text-amber-700 font-semibold mt-0.5">Duration: ${stay.durationMinutes} min (${stay.gpsPointsCount} GPS pings)</div>
          </div>`
        )
        .addTo(markersGroupRef.current!);
    });

    map.fitBounds(pathLayerRef.current.getBounds(), { padding: [40, 40], maxZoom: 15 });
  }, [historyData]);

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Employee Movement History</h2>
          <p className="text-xs text-slate-500">
            Recorded GPS trajectory, connected routes, and verified geographic stop locations.
          </p>
        </div>

        {/* Selector Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Employee Dropdown */}
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-slate-400" />
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="h-9 rounded-xl bg-slate-50 px-3 text-xs font-semibold text-slate-800 border border-slate-200 focus:ring-2 focus:ring-blue-500"
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.employeeId})
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-9 rounded-xl bg-slate-50 px-3 text-xs font-semibold text-slate-800 border border-slate-200 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={() => loadHistory(selectedEmpId, selectedDate)}
            className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-500 transition-all"
          >
            Load Route
          </button>
        </div>
      </div>

      {/* Movement Metrics Summary Strip */}
      {historyData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <span className="text-xs text-slate-400 font-medium block">Total Route Distance</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {historyData.totalDistanceKm} km
            </div>
            <span className="text-[10px] text-slate-400">Actual GPS Coordinates</span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <span className="text-xs text-slate-400 font-medium block">Recorded GPS Points</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {historyData.pointsCount} points
            </div>
            <span className="text-[10px] text-slate-400">Telemetry Pings</span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <span className="text-xs text-slate-400 font-medium block">Detected Stays</span>
            <div className="text-2xl font-bold text-amber-600 mt-1">
              {historyData.stays.length} stays
            </div>
            <span className="text-[10px] text-slate-400">Duration ≥ 15 mins</span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <span className="text-xs text-slate-400 font-medium block">Today's Shift Hours</span>
            <div className="text-2xl font-bold text-purple-600 mt-1">
              {historyData.attendance
                ? `${Math.round((historyData.attendance.totalWorkMinutes / 60) * 10) / 10} hrs`
                : 'Active Shift'}
            </div>
            <span className="text-[10px] text-slate-400">Attendance Logged</span>
          </div>
        </div>
      )}

      {/* Two Columns: Map Route on Left, Visual Day Timeline on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Route Map Container (2 Cols) */}
        <div className="lg:col-span-2 relative h-[500px] rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          {historyData && historyData.points.length === 0 && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-50/90 p-6 text-center">
              <Route className="h-10 w-10 text-slate-300 mb-2" />
              <p className="font-semibold text-slate-700 text-sm">No Location Records Found</p>
              <p className="text-xs text-slate-400 max-w-xs mt-1">
                No location points were recorded for this employee on {selectedDate}.
              </p>
            </div>
          )}

          <div ref={mapContainerRef} className="h-full w-full z-10" />

          {/* Map Legend Overlay */}
          <div className="absolute bottom-4 left-4 z-20 rounded-xl bg-white/95 backdrop-blur-md p-2.5 shadow-md border border-slate-200 text-[11px] space-y-1">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
              <span className="text-slate-600">Start / Departure Point</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-600" />
              <span className="text-slate-600">Final / Current Fix</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span className="text-slate-600">Detected Work Stay (Circle = Radius)</span>
            </div>
          </div>
        </div>

        {/* Daily Visual Timeline (Section 10) (1 Col) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs h-[500px] flex flex-col">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span>Daily Visual Timeline</span>
            </h3>
            <p className="text-[11px] text-slate-500">Chronological itinerary of the work day</p>
          </div>

          <div className="flex-1 overflow-y-auto mt-3 space-y-3 pr-1">
            {historyData?.timeline && historyData.timeline.length > 0 ? (
              historyData.timeline.map((event, idx) => (
                <div key={event.id} className="relative flex items-start gap-3 text-xs">
                  {/* Timeline Node Line */}
                  {idx < historyData.timeline.length - 1 && (
                    <div className="absolute left-3 top-5 bottom-0 w-0.5 bg-slate-200" />
                  )}

                  {/* Icon Node */}
                  <div
                    className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white text-[10px] font-bold ${
                      event.type === 'check_in' || event.type === 'office'
                        ? 'bg-emerald-600'
                        : event.type === 'check_out'
                        ? 'bg-rose-600'
                        : event.type === 'stay'
                        ? 'bg-amber-500'
                        : event.type === 'break'
                        ? 'bg-purple-500'
                        : 'bg-blue-600'
                    }`}
                  >
                    {idx + 1}
                  </div>

                  {/* Content Card */}
                  <div className="flex-1 rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{event.title}</span>
                      <span className="text-[10px] font-semibold text-slate-500">{event.time}</span>
                    </div>

                    <p className="text-[11px] text-slate-600 mt-0.5">{event.description}</p>

                    {event.location && (
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400 truncate">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        <span>{event.location}</span>
                      </div>
                    )}

                    {event.duration && (
                      <span className="mt-1 inline-block rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-800 border border-amber-200">
                        {event.duration}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                No timeline events recorded for this shift.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recorded Stays Table (Section 8 & 9) */}
      {historyData && historyData.stays.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-4">
            <h3 className="text-base font-bold text-slate-900">Detected Work Stays & Stops</h3>
            <p className="text-xs text-slate-500">
              Automatic classification based on GPS clusters within configurable geographic radius.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">S.No</th>
                  <th className="px-4 py-3">Location / Place Name</th>
                  <th className="px-4 py-3">Approximate Address</th>
                  <th className="px-4 py-3">Arrival Time</th>
                  <th className="px-4 py-3">Departure Time</th>
                  <th className="px-4 py-3">Stay Duration</th>
                  <th className="px-6 py-3 text-right">GPS Updates</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historyData.stays.map((stay, idx) => (
                  <tr key={stay.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-slate-700">#{idx + 1}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900">{stay.placeName}</td>
                    <td className="px-4 py-3.5 text-slate-600">{stay.address}</td>
                    <td className="px-4 py-3.5 font-medium text-slate-700">{stay.arrivalTime}</td>
                    <td className="px-4 py-3.5 font-medium text-slate-700">{stay.departureTime}</td>
                    <td className="px-4 py-3.5">
                      <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200">
                        {stay.durationMinutes} min
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono font-semibold text-slate-600">
                      {stay.gpsPointsCount} pings
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
