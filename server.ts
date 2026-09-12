import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import type {
  Employee,
  LocationRecord,
  AttendanceRecord,
  StayRecord,
  TrackingSession,
  AuditLog,
  SystemNotification,
  StayDetectionSettings,
  PrivacySettings,
  TimelineEvent,
  DashboardSummary
} from './src/types';

// Helper: Haversine distance in kilometers
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Global In-Memory Database
interface AppDatabase {
  employees: Employee[];
  locationRecords: LocationRecord[];
  attendanceRecords: AttendanceRecord[];
  stayRecords: StayRecord[];
  trackingSessions: TrackingSession[];
  auditLogs: AuditLog[];
  notifications: SystemNotification[];
  staySettings: StayDetectionSettings;
  privacySettings: PrivacySettings;
}

// Initial default settings
const defaultStaySettings: StayDetectionSettings = {
  minStayMinutes: 15,
  stayRadiusMeters: 65,
  autoReverseGeocode: true,
};

const defaultPrivacySettings: PrivacySettings = {
  policyText:
    'Location tracking is active strictly during authorized working hours for logistics coordination, route validation, and worker safety. No tracking occurs after check-out or during unpaid personal breaks.',
  consentNotice:
    'Location tracking is active for authorized work purposes. Your location data will be recorded only according to company policy.',
  dataRetentionDays: 90,
  allowOfflineBuffer: true,
  adminApprovalRequired: true,
};

// Seed 5 realistic sample field employees with realistic routes and stays
function getInitialSeedData(): AppDatabase {
  const todayStr = new Date().toISOString().split('T')[0];

  // Base reference coords: Central Metro Business District (e.g. San Francisco / Oakland / Palo Alto corridor)
  const baseLat = 37.7749;
  const baseLng = -122.4194;

  const sampleEmployees: Employee[] = [
    {
      id: 'emp-1',
      employeeId: 'EMP-101',
      name: 'Marcus Vance',
      phone: '+1 (555) 234-5678',
      email: 'marcus.v@fieldwork.corp',
      department: 'Field Service',
      designation: 'Senior HVAC & Electrical Tech',
      joiningDate: '2022-03-15',
      username: 'marcus101',
      profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      assignedArea: 'Metro West District',
      trackingPermissionStatus: 'granted',
      status: 'active',
      workStatus: 'working',
      isTracking: true,
      isOnline: true,
      todayStats: {
        checkIn: '08:45 AM',
        workingMinutes: 345,
        distanceKm: 24.8,
        updatesCount: 78,
        stayCount: 3,
      },
      lastLocation: {
        id: 'loc-m-last',
        employeeId: 'emp-1',
        latitude: baseLat + 0.012,
        longitude: baseLng - 0.018,
        timestamp: new Date().toISOString(),
        accuracy: 8.5,
        speed: 1.2,
        heading: 185,
        trackingSessionId: 'sess-m-1',
        isOfflineSynced: false,
        locationType: 'gps',
        address: '840 Harrison St, Tech Square Hub',
      },
      isDemo: true,
    },
    {
      id: 'emp-2',
      employeeId: 'EMP-102',
      name: 'Sarah Chen',
      phone: '+1 (555) 345-6789',
      email: 'sarah.chen@fieldwork.corp',
      department: 'Sales',
      designation: 'Enterprise Client Representative',
      joiningDate: '2023-01-10',
      username: 'sarah102',
      profilePhoto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      assignedArea: 'Financial District & Downtown',
      trackingPermissionStatus: 'granted',
      status: 'active',
      workStatus: 'working',
      isTracking: true,
      isOnline: true,
      todayStats: {
        checkIn: '09:00 AM',
        workingMinutes: 330,
        distanceKm: 18.2,
        updatesCount: 64,
        stayCount: 2,
      },
      lastLocation: {
        id: 'loc-s-last',
        employeeId: 'emp-2',
        latitude: baseLat - 0.008,
        longitude: baseLng + 0.015,
        timestamp: new Date().toISOString(),
        accuracy: 12.0,
        speed: 0.0,
        heading: 90,
        trackingSessionId: 'sess-s-1',
        isOfflineSynced: false,
        locationType: 'gps',
        address: '425 Market St, Apex Financial Center',
      },
      isDemo: true,
    },
    {
      id: 'emp-3',
      employeeId: 'EMP-103',
      name: 'Carlos Rodriguez',
      phone: '+1 (555) 456-7890',
      email: 'carlos.r@fieldwork.corp',
      department: 'Logistics & Delivery',
      designation: 'Fleet Courier Lead',
      joiningDate: '2021-08-01',
      username: 'carlos103',
      profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      assignedArea: 'North Industrial Port',
      trackingPermissionStatus: 'granted',
      status: 'active',
      workStatus: 'on_break',
      isTracking: true,
      isOnline: true,
      todayStats: {
        checkIn: '08:15 AM',
        workingMinutes: 375,
        distanceKm: 42.6,
        updatesCount: 112,
        stayCount: 4,
      },
      lastLocation: {
        id: 'loc-c-last',
        employeeId: 'emp-3',
        latitude: baseLat + 0.025,
        longitude: baseLng + 0.01,
        timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        accuracy: 9.0,
        speed: 0.0,
        heading: null,
        trackingSessionId: 'sess-c-1',
        isOfflineSynced: false,
        locationType: 'gps',
        address: 'Bayside Deli & Rest Stop, Pier 28',
      },
      isDemo: true,
    },
    {
      id: 'emp-4',
      employeeId: 'EMP-104',
      name: 'Elena Rostova',
      phone: '+1 (555) 567-8901',
      email: 'elena.r@fieldwork.corp',
      department: 'Quality Audit',
      designation: 'Safety & Site Compliance Auditor',
      joiningDate: '2023-06-20',
      username: 'elena104',
      profilePhoto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      assignedArea: 'South Bay Construction Sites',
      trackingPermissionStatus: 'prompt',
      status: 'active',
      workStatus: 'not_started',
      isTracking: false,
      isOnline: false,
      todayStats: {
        checkIn: undefined,
        workingMinutes: 0,
        distanceKm: 0,
        updatesCount: 0,
        stayCount: 0,
      },
      lastLocation: {
        id: 'loc-e-last',
        employeeId: 'emp-4',
        latitude: baseLat - 0.02,
        longitude: baseLng - 0.01,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
        accuracy: 25.0,
        speed: null,
        heading: null,
        trackingSessionId: 'sess-e-prev',
        isOfflineSynced: false,
        locationType: 'last_known',
        address: 'Regional HQ Operations Center',
      },
      isDemo: true,
    },
    {
      id: 'emp-5',
      employeeId: 'EMP-105',
      name: 'David Kim',
      phone: '+1 (555) 678-9012',
      email: 'david.k@fieldwork.corp',
      department: 'Maintenance',
      designation: 'Field Network Specialist',
      joiningDate: '2022-11-04',
      username: 'david105',
      profilePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      assignedArea: 'Silicon Valley Corridor',
      trackingPermissionStatus: 'granted',
      status: 'active',
      workStatus: 'working',
      isTracking: true,
      isOnline: false, // temporarily offline (sync buffer test)
      todayStats: {
        checkIn: '09:15 AM',
        workingMinutes: 315,
        distanceKm: 15.4,
        updatesCount: 45,
        stayCount: 2,
      },
      lastLocation: {
        id: 'loc-d-last',
        employeeId: 'emp-5',
        latitude: baseLat - 0.015,
        longitude: baseLng + 0.005,
        timestamp: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
        accuracy: 14.2,
        speed: 0.8,
        heading: 45,
        trackingSessionId: 'sess-d-1',
        isOfflineSynced: true,
        locationType: 'offline_synced',
        address: 'Substation #4 - Valley West',
      },
      isDemo: true,
    },
  ];

  // Seed detailed movement history for Marcus Vance (emp-1)
  const historyPoints: LocationRecord[] = [
    {
      id: 'pt-1',
      employeeId: 'emp-1',
      latitude: baseLat,
      longitude: baseLng,
      timestamp: `${todayStr}T08:50:00Z`,
      accuracy: 6,
      speed: 0,
      heading: 0,
      trackingSessionId: 'sess-m-1',
      isOfflineSynced: false,
      locationType: 'gps',
      address: 'Central Branch Office, 100 Mission St',
    },
    {
      id: 'pt-2',
      employeeId: 'emp-1',
      latitude: baseLat + 0.002,
      longitude: baseLng - 0.003,
      timestamp: `${todayStr}T09:10:00Z`,
      accuracy: 7,
      speed: 35.5,
      heading: 315,
      trackingSessionId: 'sess-m-1',
      isOfflineSynced: false,
      locationType: 'gps',
      address: 'Transit Arterial (Market & 5th)',
    },
    {
      id: 'pt-3',
      employeeId: 'emp-1',
      latitude: baseLat + 0.005,
      longitude: baseLng - 0.007,
      timestamp: `${todayStr}T09:35:00Z`,
      accuracy: 5,
      speed: 0,
      heading: null,
      trackingSessionId: 'sess-m-1',
      isOfflineSynced: false,
      locationType: 'gps',
      address: 'Customer Site Alpha, Civic Plaza Suite 400',
    },
    {
      id: 'pt-4',
      employeeId: 'emp-1',
      latitude: baseLat + 0.0051,
      longitude: baseLng - 0.0069,
      timestamp: `${todayStr}T10:05:00Z`,
      accuracy: 8,
      speed: 0,
      heading: null,
      trackingSessionId: 'sess-m-1',
      isOfflineSynced: false,
      locationType: 'gps',
      address: 'Customer Site Alpha, Civic Plaza Suite 400',
    },
    {
      id: 'pt-5',
      employeeId: 'emp-1',
      latitude: baseLat + 0.008,
      longitude: baseLng - 0.012,
      timestamp: `${todayStr}T10:35:00Z`,
      accuracy: 6,
      speed: 28.0,
      heading: 290,
      trackingSessionId: 'sess-m-1',
      isOfflineSynced: false,
      locationType: 'gps',
      address: 'Van Ness Avenue Corridor',
    },
    {
      id: 'pt-6',
      employeeId: 'emp-1',
      latitude: baseLat + 0.01,
      longitude: baseLng - 0.015,
      timestamp: `${todayStr}T11:10:00Z`,
      accuracy: 5,
      speed: 0,
      heading: null,
      trackingSessionId: 'sess-m-1',
      isOfflineSynced: false,
      locationType: 'gps',
      address: 'Customer Site Beta - Medical Labs',
    },
    {
      id: 'pt-7',
      employeeId: 'emp-1',
      latitude: baseLat + 0.0102,
      longitude: baseLng - 0.0151,
      timestamp: `${todayStr}T11:55:00Z`,
      accuracy: 6,
      speed: 0,
      heading: null,
      trackingSessionId: 'sess-m-1',
      isOfflineSynced: false,
      locationType: 'gps',
      address: 'Customer Site Beta - Medical Labs',
    },
    {
      id: 'pt-8',
      employeeId: 'emp-1',
      latitude: baseLat + 0.007,
      longitude: baseLng - 0.013,
      timestamp: `${todayStr}T12:30:00Z`,
      accuracy: 9,
      speed: 0,
      heading: null,
      trackingSessionId: 'sess-m-1',
      isOfflineSynced: false,
      locationType: 'gps',
      address: 'Hayes Valley Food Plaza (Lunch Break)',
    },
    {
      id: 'pt-9',
      employeeId: 'emp-1',
      latitude: baseLat + 0.012,
      longitude: baseLng - 0.018,
      timestamp: `${todayStr}T14:15:00Z`,
      accuracy: 7,
      speed: 0,
      heading: null,
      trackingSessionId: 'sess-m-1',
      isOfflineSynced: false,
      locationType: 'gps',
      address: 'Customer Site Gamma, 840 Harrison St',
    },
  ];

  const stays: StayRecord[] = [
    {
      id: 'stay-1',
      employeeId: 'emp-1',
      date: todayStr,
      latitude: baseLat + 0.005,
      longitude: baseLng - 0.007,
      placeName: 'Customer Site Alpha',
      address: 'Civic Plaza Suite 400',
      arrivalTime: '09:35 AM',
      departureTime: '10:25 AM',
      durationMinutes: 50,
      gpsPointsCount: 18,
    },
    {
      id: 'stay-2',
      employeeId: 'emp-1',
      date: todayStr,
      latitude: baseLat + 0.01,
      longitude: baseLng - 0.015,
      placeName: 'Customer Site Beta (Medical Labs)',
      address: '1420 Sutter St',
      arrivalTime: '11:10 AM',
      departureTime: '12:15 PM',
      durationMinutes: 65,
      gpsPointsCount: 24,
    },
    {
      id: 'stay-3',
      employeeId: 'emp-1',
      date: todayStr,
      latitude: baseLat + 0.007,
      longitude: baseLng - 0.013,
      placeName: 'Hayes Valley Lunch & Refreshment',
      address: '450 Hayes St',
      arrivalTime: '12:30 PM',
      departureTime: '01:15 PM',
      durationMinutes: 45,
      gpsPointsCount: 15,
    },
  ];

  const attendance: AttendanceRecord[] = [
    {
      id: 'att-1',
      employeeId: 'emp-1',
      date: todayStr,
      checkIn: '08:45 AM',
      workStart: '08:50 AM',
      breaks: [{ start: '12:30 PM', end: '01:15 PM', durationMinutes: 45 }],
      totalWorkMinutes: 345,
      totalBreakMinutes: 45,
      status: 'present',
    },
    {
      id: 'att-2',
      employeeId: 'emp-2',
      date: todayStr,
      checkIn: '09:00 AM',
      workStart: '09:05 AM',
      breaks: [{ start: '01:00 PM', end: '01:40 PM', durationMinutes: 40 }],
      totalWorkMinutes: 330,
      totalBreakMinutes: 40,
      status: 'present',
    },
    {
      id: 'att-3',
      employeeId: 'emp-3',
      date: todayStr,
      checkIn: '08:15 AM',
      workStart: '08:20 AM',
      breaks: [{ start: '02:00 PM' }],
      totalWorkMinutes: 375,
      totalBreakMinutes: 25,
      status: 'present',
    },
  ];

  const auditLogs: AuditLog[] = [
    {
      id: 'log-1',
      adminId: 'admin-1',
      adminName: 'Operations Lead (Admin)',
      action: 'SYSTEM_STARTUP',
      timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      details: 'Workforce location tracking services initialized with HTTPS encryption.',
    },
    {
      id: 'log-2',
      adminId: 'admin-1',
      adminName: 'Operations Lead (Admin)',
      action: 'POLICY_AUDIT',
      timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      details: 'Verified consent requirements and strict stay detection algorithm settings.',
    },
  ];

  const notifications: SystemNotification[] = [
    {
      id: 'notif-1',
      type: 'check_in',
      title: 'Employee Check-In',
      message: 'Marcus Vance (EMP-101) checked in at Central Branch Office.',
      timestamp: '08:45 AM',
      employeeId: 'emp-1',
      employeeName: 'Marcus Vance',
      read: false,
    },
    {
      id: 'notif-2',
      type: 'stay_detected',
      title: 'Stay Detected (Customer Site Alpha)',
      message: 'Marcus Vance stayed 50 min at Civic Plaza Suite 400.',
      timestamp: '10:25 AM',
      employeeId: 'emp-1',
      employeeName: 'Marcus Vance',
      read: false,
    },
    {
      id: 'notif-3',
      type: 'offline',
      title: 'Connection Status Changed',
      message: 'David Kim (EMP-105) transitioned to offline mode. GPS points buffering locally.',
      timestamp: '01:10 PM',
      employeeId: 'emp-5',
      employeeName: 'David Kim',
      read: false,
    },
  ];

  return {
    employees: sampleEmployees,
    locationRecords: historyPoints,
    attendanceRecords: attendance,
    stayRecords: stays,
    trackingSessions: [],
    auditLogs: auditLogs,
    notifications: notifications,
    staySettings: { ...defaultStaySettings },
    privacySettings: { ...defaultPrivacySettings },
  };
}

let db: AppDatabase = getInitialSeedData();

// SSE (Server-Sent Events) clients registry for live real-time push
const sseClients: Response[] = [];

function broadcastSSE(type: string, data: any) {
  const payload = `data: ${JSON.stringify({ type, data, timestamp: new Date().toISOString() })}\n\n`;
  for (let i = sseClients.length - 1; i >= 0; i--) {
    const client = sseClients[i];
    try {
      client.write(payload);
    } catch {
      sseClients.splice(i, 1);
    }
  }
}

// Automatic Stay Detection processor
function processStayDetection(
  employeeId: string,
  newPoint: LocationRecord
) {
  const todayStr = newPoint.timestamp.split('T')[0];
  const settings = db.staySettings;

  // Get recent points today for this employee
  const empPoints = db.locationRecords
    .filter(
      (p) => p.employeeId === employeeId && p.timestamp.startsWith(todayStr)
    )
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

  if (empPoints.length < 3) return;

  const lastPoint = empPoints[empPoints.length - 1];
  const windowRadiusKm = settings.stayRadiusMeters / 1000;

  // Walk backwards to find contiguous cluster within stay radius
  let clusterStart = lastPoint;
  let clusterPoints = [lastPoint];

  for (let i = empPoints.length - 2; i >= 0; i--) {
    const p = empPoints[i];
    const dist = calculateHaversineDistance(
      lastPoint.latitude,
      lastPoint.longitude,
      p.latitude,
      p.longitude
    );
    if (dist <= windowRadiusKm) {
      clusterStart = p;
      clusterPoints.push(p);
    } else {
      break;
    }
  }

  const startTimeMs = new Date(clusterStart.timestamp).getTime();
  const endTimeMs = new Date(lastPoint.timestamp).getTime();
  const durationMinutes = Math.round((endTimeMs - startTimeMs) / (1000 * 60));

  if (durationMinutes >= settings.minStayMinutes && clusterPoints.length >= 3) {
    // Check if an existing stay record exists near here
    const existingStayIndex = db.stayRecords.findIndex(
      (s) =>
        s.employeeId === employeeId &&
        s.date === todayStr &&
        calculateHaversineDistance(s.latitude, s.longitude, lastPoint.latitude, lastPoint.longitude) <= windowRadiusKm
    );

    const arrivalTime = new Date(clusterStart.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    const departureTime = new Date(lastPoint.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const placeName = lastPoint.address || `Area (${lastPoint.latitude.toFixed(4)}, ${lastPoint.longitude.toFixed(4)})`;

    if (existingStayIndex >= 0) {
      db.stayRecords[existingStayIndex].departureTime = departureTime;
      db.stayRecords[existingStayIndex].durationMinutes = durationMinutes;
      db.stayRecords[existingStayIndex].gpsPointsCount = clusterPoints.length;
    } else {
      const newStay: StayRecord = {
        id: `stay-${Date.now()}`,
        employeeId,
        date: todayStr,
        latitude: lastPoint.latitude,
        longitude: lastPoint.longitude,
        placeName: `Stay @ ${placeName.split(',')[0]}`,
        address: placeName,
        arrivalTime,
        departureTime,
        durationMinutes,
        gpsPointsCount: clusterPoints.length,
      };
      db.stayRecords.push(newStay);

      const emp = db.employees.find((e) => e.id === employeeId);
      const notif: SystemNotification = {
        id: `notif-${Date.now()}`,
        type: 'stay_detected',
        title: 'Prolonged Stay Detected',
        message: `${emp ? emp.name : 'Employee'} stayed ${durationMinutes} min at ${placeName.split(',')[0]}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        employeeId,
        employeeName: emp?.name,
        read: false,
      };
      db.notifications.unshift(notif);
      broadcastSSE('notification', notif);
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Request logger for audit & security compliance
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    next();
  });

  // --- REST API ENDPOINTS ---

  // 1. Authentication
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { username, password, role } = req.body;

    if (role === 'admin' || username === 'admin' || username === 'admin@fieldwork.corp') {
      if (password === 'admin123' || password === 'admin' || !password) {
        return res.json({
          success: true,
          role: 'admin',
          token: `token-admin-${Date.now()}`,
          name: 'Operations Administrator',
          email: 'admin@fieldwork.corp',
          id: 'admin-1',
        });
      }
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    // Employee login
    const employee = db.employees.find(
      (e) =>
        e.username.toLowerCase() === (username || '').toLowerCase() ||
        e.email.toLowerCase() === (username || '').toLowerCase() ||
        e.employeeId.toLowerCase() === (username || '').toLowerCase()
    );

    if (employee) {
      return res.json({
        success: true,
        role: 'employee',
        token: `token-emp-${employee.id}-${Date.now()}`,
        name: employee.name,
        email: employee.email,
        id: employee.id,
        employee,
      });
    }

    // If username is empty or demo test, pick first employee
    const defaultEmp = db.employees[0];
    return res.json({
      success: true,
      role: 'employee',
      token: `token-emp-${defaultEmp.id}-${Date.now()}`,
      name: defaultEmp.name,
      email: defaultEmp.email,
      id: defaultEmp.id,
      employee: defaultEmp,
    });
  });

  // 2. Real-Time SSE Stream for Admin Dashboard & Live Map
  app.get('/api/location/sse', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    sseClients.push(res);

    // Send initial snapshot
    res.write(
      `data: ${JSON.stringify({
        type: 'init',
        employees: db.employees,
        summary: getDashboardSummaryData(),
      })}\n\n`
    );

    req.on('close', () => {
      const idx = sseClients.indexOf(res);
      if (idx !== -1) {
        sseClients.splice(idx, 1);
      }
    });
  });

  function getDashboardSummaryData(): DashboardSummary {
    const totalEmployees = db.employees.length;
    const onlineEmployees = db.employees.filter((e) => e.isOnline).length;
    const currentlyWorking = db.employees.filter((e) => e.workStatus === 'working').length;
    const notStarted = db.employees.filter((e) => e.workStatus === 'not_started').length;
    const onBreak = db.employees.filter((e) => e.workStatus === 'on_break').length;

    let totalDist = 0;
    let totalMinutes = 0;
    let totalUpdates = 0;

    db.employees.forEach((e) => {
      totalDist += e.todayStats?.distanceKm || 0;
      totalMinutes += e.todayStats?.workingMinutes || 0;
      totalUpdates += e.todayStats?.updatesCount || 0;
    });

    return {
      totalEmployees,
      onlineEmployees,
      currentlyWorking,
      notStarted,
      onBreak,
      todayDistanceKm: Math.round(totalDist * 10) / 10,
      todayWorkingHours: Math.round((totalMinutes / 60) * 10) / 10,
      totalLocationUpdates: totalUpdates,
    };
  }

  // 3. Employees Management
  app.get('/api/employees', (req: Request, res: Response) => {
    const { department, status, search } = req.query;
    let list = [...db.employees];

    if (department && department !== 'all') {
      list = list.filter((e) => e.department === department);
    }
    if (status && status !== 'all') {
      list = list.filter((e) => e.workStatus === status || e.status === status);
    }
    if (search) {
      const q = (search as string).toLowerCase();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.employeeId.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q)
      );
    }

    res.json({ employees: list });
  });

  app.get('/api/employees/:id', (req: Request, res: Response) => {
    const emp = db.employees.find((e) => e.id === req.params.id);
    if (!emp) return res.status(404).json({ error: 'Employee not found' });
    res.json({ employee: emp });
  });

  app.post('/api/employees', (req: Request, res: Response) => {
    const body = req.body;
    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      employeeId: body.employeeId || `EMP-${100 + db.employees.length + 1}`,
      name: body.name || 'New Employee',
      phone: body.phone || '+1 (555) 000-0000',
      email: body.email || 'employee@fieldwork.corp',
      department: body.department || 'Field Service',
      designation: body.designation || 'Field Representative',
      joiningDate: body.joiningDate || new Date().toISOString().split('T')[0],
      username: body.username || `user${100 + db.employees.length + 1}`,
      password: body.password || 'welcome123',
      profilePhoto:
        body.profilePhoto ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      assignedArea: body.assignedArea || 'Central District',
      trackingPermissionStatus: body.trackingPermissionStatus || 'prompt',
      status: 'active',
      workStatus: 'not_started',
      isTracking: false,
      isOnline: false,
      todayStats: {
        workingMinutes: 0,
        distanceKm: 0,
        updatesCount: 0,
        stayCount: 0,
      },
    };

    db.employees.unshift(newEmp);

    db.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      adminId: 'admin-1',
      adminName: 'Operations Lead',
      action: 'ADD_EMPLOYEE',
      timestamp: new Date().toISOString(),
      employeeId: newEmp.id,
      employeeName: newEmp.name,
      details: `Created record for ${newEmp.name} (${newEmp.employeeId})`,
    });

    broadcastSSE('employee_updated', { employee: newEmp });
    res.status(201).json({ success: true, employee: newEmp });
  });

  app.put('/api/employees/:id', (req: Request, res: Response) => {
    const idx = db.employees.findIndex((e) => e.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Employee not found' });

    db.employees[idx] = { ...db.employees[idx], ...req.body };

    db.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      adminId: 'admin-1',
      adminName: 'Operations Lead',
      action: 'UPDATE_EMPLOYEE',
      timestamp: new Date().toISOString(),
      employeeId: db.employees[idx].id,
      employeeName: db.employees[idx].name,
      details: `Updated details for ${db.employees[idx].name}`,
    });

    broadcastSSE('employee_updated', { employee: db.employees[idx] });
    res.json({ success: true, employee: db.employees[idx] });
  });

  app.delete('/api/employees/:id', (req: Request, res: Response) => {
    const idx = db.employees.findIndex((e) => e.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Employee not found' });

    const emp = db.employees[idx];
    emp.status = 'inactive';
    emp.isTracking = false;
    emp.isOnline = false;

    db.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      adminId: 'admin-1',
      adminName: 'Operations Lead',
      action: 'DEACTIVATE_EMPLOYEE',
      timestamp: new Date().toISOString(),
      employeeId: emp.id,
      employeeName: emp.name,
      details: `Deactivated profile ${emp.name} (${emp.employeeId})`,
    });

    broadcastSSE('employee_updated', { employee: emp });
    res.json({ success: true, message: 'Employee deactivated successfully' });
  });

  // 4. Live GPS Location Updates (from real browser Geolocation API)
  app.post('/api/location/update', (req: Request, res: Response) => {
    const {
      employeeId,
      latitude,
      longitude,
      accuracy,
      speed,
      heading,
      timestamp,
      isOfflineSynced,
      locationType,
      batteryLevel,
    } = req.body;

    const emp = db.employees.find((e) => e.id === employeeId);
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    const newRecord: LocationRecord = {
      id: `loc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      employeeId,
      latitude: Number(latitude),
      longitude: Number(longitude),
      accuracy: Number(accuracy) || 10,
      speed: speed != null ? Number(speed) : null,
      heading: heading != null ? Number(heading) : null,
      timestamp: timestamp || new Date().toISOString(),
      trackingSessionId: `sess-${employeeId}`,
      isOfflineSynced: Boolean(isOfflineSynced),
      locationType: locationType || (isOfflineSynced ? 'offline_synced' : 'gps'),
      batteryLevel,
    };

    // Calculate distance increment if previous location exists
    let distInc = 0;
    if (emp.lastLocation) {
      distInc = calculateHaversineDistance(
        emp.lastLocation.latitude,
        emp.lastLocation.longitude,
        newRecord.latitude,
        newRecord.longitude
      );
      // Filter out tiny GPS drift (less than 10 meters)
      if (distInc < 0.01) distInc = 0;
    }

    db.locationRecords.push(newRecord);

    // Update employee state
    emp.lastLocation = newRecord;
    emp.isOnline = !isOfflineSynced;
    emp.isTracking = true;
    if (emp.workStatus === 'not_started') {
      emp.workStatus = 'working';
    }

    if (!emp.todayStats) {
      emp.todayStats = {
        workingMinutes: 0,
        distanceKm: 0,
        updatesCount: 0,
        stayCount: 0,
      };
    }

    emp.todayStats.distanceKm = Math.round((emp.todayStats.distanceKm + distInc) * 100) / 100;
    emp.todayStats.updatesCount += 1;

    // Run stay detection
    processStayDetection(employeeId, newRecord);

    // Broadcast update via SSE to live dashboard & map
    broadcastSSE('location_update', {
      employeeId,
      employee: emp,
      record: newRecord,
      summary: getDashboardSummaryData(),
    });

    res.json({ success: true, record: newRecord, todayStats: emp.todayStats });
  });

  // 5. Offline GPS Points Batch Sync
  app.post('/api/location/batch-sync', (req: Request, res: Response) => {
    const { employeeId, points } = req.body;
    if (!Array.isArray(points) || points.length === 0) {
      return res.status(400).json({ error: 'No points provided for sync' });
    }

    const emp = db.employees.find((e) => e.id === employeeId);
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    let addedCount = 0;
    let totalSyncedDist = 0;

    points.forEach((p) => {
      const record: LocationRecord = {
        id: `loc-synced-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        employeeId,
        latitude: Number(p.latitude),
        longitude: Number(p.longitude),
        accuracy: Number(p.accuracy) || 15,
        speed: p.speed != null ? Number(p.speed) : null,
        heading: p.heading != null ? Number(p.heading) : null,
        timestamp: p.timestamp || new Date().toISOString(),
        trackingSessionId: `sess-${employeeId}`,
        isOfflineSynced: true,
        locationType: 'offline_synced',
      };
      db.locationRecords.push(record);
      addedCount++;
      processStayDetection(employeeId, record);
    });

    emp.isOnline = true;
    emp.todayStats.updatesCount += addedCount;

    const notif: SystemNotification = {
      id: `notif-${Date.now()}`,
      type: 'system',
      title: 'Offline GPS Points Synchronized',
      message: `${emp.name} synced ${addedCount} buffered location points recorded while offline.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      employeeId,
      employeeName: emp.name,
      read: false,
    };
    db.notifications.unshift(notif);

    broadcastSSE('batch_synced', {
      employeeId,
      employee: emp,
      syncedCount: addedCount,
    });

    res.json({ success: true, syncedCount: addedCount });
  });

  // 6. Attendance Actions
  app.post('/api/attendance/check-in', (req: Request, res: Response) => {
    const { employeeId } = req.body;
    const emp = db.employees.find((e) => e.id === employeeId);
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const todayStr = now.toISOString().split('T')[0];

    emp.workStatus = 'working';
    emp.isOnline = true;
    emp.todayStats.checkIn = timeStr;

    let att = db.attendanceRecords.find((a) => a.employeeId === employeeId && a.date === todayStr);
    if (!att) {
      att = {
        id: `att-${Date.now()}`,
        employeeId,
        date: todayStr,
        checkIn: timeStr,
        workStart: timeStr,
        breaks: [],
        totalWorkMinutes: 0,
        totalBreakMinutes: 0,
        status: 'present',
      };
      db.attendanceRecords.unshift(att);
    } else {
      att.checkIn = timeStr;
    }

    const notif: SystemNotification = {
      id: `notif-${Date.now()}`,
      type: 'check_in',
      title: 'Employee Checked In',
      message: `${emp.name} (${emp.employeeId}) checked in at ${timeStr}.`,
      timestamp: timeStr,
      employeeId: emp.id,
      employeeName: emp.name,
      read: false,
    };
    db.notifications.unshift(notif);

    broadcastSSE('attendance_update', { employee: emp, attendance: att });
    res.json({ success: true, employee: emp, attendance: att });
  });

  app.post('/api/attendance/check-out', (req: Request, res: Response) => {
    const { employeeId } = req.body;
    const emp = db.employees.find((e) => e.id === employeeId);
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const todayStr = now.toISOString().split('T')[0];

    emp.workStatus = 'completed';
    emp.isTracking = false;
    emp.todayStats.checkOut = timeStr;

    const att = db.attendanceRecords.find((a) => a.employeeId === employeeId && a.date === todayStr);
    if (att) {
      att.checkOut = timeStr;
      att.workEnd = timeStr;
    }

    const notif: SystemNotification = {
      id: `notif-${Date.now()}`,
      type: 'check_out',
      title: 'Employee Checked Out',
      message: `${emp.name} (${emp.employeeId}) checked out at ${timeStr}.`,
      timestamp: timeStr,
      employeeId: emp.id,
      employeeName: emp.name,
      read: false,
    };
    db.notifications.unshift(notif);

    broadcastSSE('attendance_update', { employee: emp, attendance: att });
    res.json({ success: true, employee: emp, attendance: att });
  });

  app.post('/api/attendance/break-start', (req: Request, res: Response) => {
    const { employeeId } = req.body;
    const emp = db.employees.find((e) => e.id === employeeId);
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const todayStr = now.toISOString().split('T')[0];

    emp.workStatus = 'on_break';

    const att = db.attendanceRecords.find((a) => a.employeeId === employeeId && a.date === todayStr);
    if (att) {
      att.breaks.push({ start: timeStr });
    }

    broadcastSSE('employee_updated', { employee: emp });
    res.json({ success: true, employee: emp });
  });

  app.post('/api/attendance/break-end', (req: Request, res: Response) => {
    const { employeeId } = req.body;
    const emp = db.employees.find((e) => e.id === employeeId);
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const todayStr = now.toISOString().split('T')[0];

    emp.workStatus = 'working';

    const att = db.attendanceRecords.find((a) => a.employeeId === employeeId && a.date === todayStr);
    if (att && att.breaks.length > 0) {
      const currentBreak = att.breaks[att.breaks.length - 1];
      if (!currentBreak.end) {
        currentBreak.end = timeStr;
      }
    }

    broadcastSSE('employee_updated', { employee: emp });
    res.json({ success: true, employee: emp });
  });

  // 7. Tracking Start / Stop with Consent Acknowledged
  app.post('/api/tracking/start', (req: Request, res: Response) => {
    const { employeeId, consentGiven } = req.body;
    const emp = db.employees.find((e) => e.id === employeeId);
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    if (!consentGiven) {
      return res.status(400).json({ error: 'User consent required to activate live location tracking' });
    }

    emp.isTracking = true;
    emp.trackingPermissionStatus = 'granted';
    emp.isOnline = true;
    if (emp.workStatus === 'not_started') {
      emp.workStatus = 'working';
    }

    const notif: SystemNotification = {
      id: `notif-${Date.now()}`,
      type: 'tracking_started',
      title: 'Location Tracking Started',
      message: `${emp.name} activated location tracking for work shift.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      employeeId: emp.id,
      employeeName: emp.name,
      read: false,
    };
    db.notifications.unshift(notif);

    broadcastSSE('tracking_status_change', { employee: emp, isTracking: true });
    res.json({ success: true, employee: emp });
  });

  app.post('/api/tracking/stop', (req: Request, res: Response) => {
    const { employeeId } = req.body;
    const emp = db.employees.find((e) => e.id === employeeId);
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    emp.isTracking = false;

    const notif: SystemNotification = {
      id: `notif-${Date.now()}`,
      type: 'tracking_stopped',
      title: 'Location Tracking Paused',
      message: `${emp.name} paused location tracking.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      employeeId: emp.id,
      employeeName: emp.name,
      read: false,
    };
    db.notifications.unshift(notif);

    broadcastSSE('tracking_status_change', { employee: emp, isTracking: false });
    res.json({ success: true, employee: emp });
  });

  // 8. Movement History & Connected Route
  app.get('/api/movement/history', (req: Request, res: Response) => {
    const { employeeId, date } = req.query;
    const targetDate = (date as string) || new Date().toISOString().split('T')[0];

    const emp = db.employees.find((e) => e.id === employeeId);
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    const points = db.locationRecords
      .filter((p) => p.employeeId === employeeId && p.timestamp.startsWith(targetDate))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const stays = db.stayRecords.filter(
      (s) => s.employeeId === employeeId && s.date === targetDate
    );

    const attendance = db.attendanceRecords.find(
      (a) => a.employeeId === employeeId && a.date === targetDate
    );

    // Calculate precise route distance from actual GPS coordinates
    let totalDist = 0;
    for (let i = 1; i < points.length; i++) {
      totalDist += calculateHaversineDistance(
        points[i - 1].latitude,
        points[i - 1].longitude,
        points[i].latitude,
        points[i].longitude
      );
    }

    // Build timeline events
    const timeline: TimelineEvent[] = [];
    if (attendance?.checkIn) {
      timeline.push({
        id: 'tl-ci',
        time: attendance.checkIn,
        type: 'check_in',
        title: 'Check-In Completed',
        description: 'Shift started and location authorization verified.',
      });
    }

    // Add first location
    if (points.length > 0) {
      const firstPt = points[0];
      timeline.push({
        id: 'tl-start',
        time: new Date(firstPt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'office',
        title: 'Departure from Base / First GPS Fix',
        description: firstPt.address || 'Starting Location Fix',
        latitude: firstPt.latitude,
        longitude: firstPt.longitude,
      });
    }

    // Add stays to timeline
    stays.forEach((s, idx) => {
      timeline.push({
        id: `tl-stay-${idx}`,
        time: s.arrivalTime,
        type: 'stay',
        title: `Arrival at ${s.placeName}`,
        description: `Stay duration: ${s.durationMinutes} minutes (${s.gpsPointsCount} GPS pings recorded)`,
        location: s.address,
        latitude: s.latitude,
        longitude: s.longitude,
        duration: `${s.durationMinutes} min`,
      });
    });

    if (attendance?.breaks) {
      attendance.breaks.forEach((b, idx) => {
        timeline.push({
          id: `tl-brk-${idx}`,
          time: b.start,
          type: 'break',
          title: 'Break Started',
          description: b.end ? `Resumed at ${b.end}` : 'Break in progress',
          duration: b.durationMinutes ? `${b.durationMinutes} min` : undefined,
        });
      });
    }

    if (attendance?.checkOut) {
      timeline.push({
        id: 'tl-co',
        time: attendance.checkOut,
        type: 'check_out',
        title: 'Check-Out Recorded',
        description: 'End of shift. Tracking deactivated.',
      });
    }

    // Sort timeline by time
    timeline.sort((a, b) => a.time.localeCompare(b.time));

    res.json({
      employee: emp,
      date: targetDate,
      totalDistanceKm: Math.round(totalDist * 10) / 10,
      pointsCount: points.length,
      points,
      stays,
      attendance,
      timeline,
    });
  });

  // 9. Stay Reports & Settings
  app.get('/api/stays', (req: Request, res: Response) => {
    const { employeeId, date } = req.query;
    let list = [...db.stayRecords];
    if (employeeId) {
      list = list.filter((s) => s.employeeId === employeeId);
    }
    if (date) {
      list = list.filter((s) => s.date === date);
    }
    res.json({ stays: list });
  });

  app.get('/api/settings/stay-detection', (req: Request, res: Response) => {
    res.json(db.staySettings);
  });

  app.put('/api/settings/stay-detection', (req: Request, res: Response) => {
    db.staySettings = { ...db.staySettings, ...req.body };
    db.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      adminId: 'admin-1',
      adminName: 'Operations Lead',
      action: 'UPDATE_STAY_SETTINGS',
      timestamp: new Date().toISOString(),
      details: `Updated stay detection: radius=${db.staySettings.stayRadiusMeters}m, minStay=${db.staySettings.minStayMinutes}min`,
    });
    res.json({ success: true, settings: db.staySettings });
  });

  // 10. Privacy & Consent Settings
  app.get('/api/settings/privacy', (req: Request, res: Response) => {
    res.json(db.privacySettings);
  });

  app.put('/api/settings/privacy', (req: Request, res: Response) => {
    db.privacySettings = { ...db.privacySettings, ...req.body };
    res.json({ success: true, settings: db.privacySettings });
  });

  // 11. Dashboard Analytics Summary
  app.get('/api/reports/dashboard', (req: Request, res: Response) => {
    res.json(getDashboardSummaryData());
  });

  // 12. Date Range Comprehensive Report
  app.get('/api/reports/range', (req: Request, res: Response) => {
    const { employeeId, startDate, endDate } = req.query;

    const emp = db.employees.find((e) => e.id === employeeId);
    const start = (startDate as string) || new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0];
    const end = (endDate as string) || new Date().toISOString().split('T')[0];

    // Generate date array between start and end
    const rows = [];
    let cur = new Date(start);
    const endD = new Date(end);

    let totalWorkHours = 0;
    let totalDist = 0;
    let totalStayMin = 0;
    let workingDaysCount = 0;

    while (cur <= endD) {
      const dStr = cur.toISOString().split('T')[0];
      const att = db.attendanceRecords.find((a) => a.employeeId === employeeId && a.date === dStr);
      const stays = db.stayRecords.filter((s) => s.employeeId === employeeId && s.date === dStr);
      const points = db.locationRecords.filter(
        (p) => p.employeeId === employeeId && p.timestamp.startsWith(dStr)
      );

      let dayDist = 0;
      for (let i = 1; i < points.length; i++) {
        dayDist += calculateHaversineDistance(
          points[i - 1].latitude,
          points[i - 1].longitude,
          points[i].latitude,
          points[i].longitude
        );
      }

      if (dStr === new Date().toISOString().split('T')[0] && emp?.todayStats?.distanceKm) {
        dayDist = Math.max(dayDist, emp.todayStats.distanceKm);
      }

      const dayStayMin = stays.reduce((sum, s) => sum + s.durationMinutes, 0);
      const workingHours = att?.totalWorkMinutes
        ? Math.round((att.totalWorkMinutes / 60) * 10) / 10
        : (emp && dStr === new Date().toISOString().split('T')[0] ? Math.round((emp.todayStats.workingMinutes / 60) * 10) / 10 : 0);

      if (workingHours > 0 || dayDist > 0) {
        workingDaysCount++;
      }

      totalWorkHours += workingHours;
      totalDist += dayDist;
      totalStayMin += dayStayMin;

      rows.push({
        date: dStr,
        checkIn: att?.checkIn || (dStr === new Date().toISOString().split('T')[0] ? emp?.todayStats.checkIn || '-' : '-'),
        checkOut: att?.checkOut || (dStr === new Date().toISOString().split('T')[0] ? emp?.todayStats.checkOut || '-' : '-'),
        workingHours,
        distanceKm: Math.round(dayDist * 10) / 10,
        stopsCount: points.length > 0 ? Math.max(1, stays.length + 1) : 0,
        stayMinutes: dayStayMin,
      });

      cur.setDate(cur.getDate() + 1);
    }

    res.json({
      employee: emp,
      startDate: start,
      endDate: end,
      rows,
      summary: {
        totalWorkingHours: Math.round(totalWorkHours * 10) / 10,
        totalDistanceKm: Math.round(totalDist * 10) / 10,
        totalStayMinutes: totalStayMin,
        averageDailyDistanceKm:
          workingDaysCount > 0 ? Math.round((totalDist / workingDaysCount) * 10) / 10 : 0,
        workingDaysCount,
      },
    });
  });

  // 13. Notifications & Audit Logs
  app.get('/api/notifications', (req: Request, res: Response) => {
    res.json({ notifications: db.notifications });
  });

  app.post('/api/notifications/mark-read', (req: Request, res: Response) => {
    db.notifications.forEach((n) => (n.read = true));
    res.json({ success: true });
  });

  app.get('/api/audit-logs', (req: Request, res: Response) => {
    res.json({ logs: db.auditLogs });
  });

  // 14. Demo Mode Toggle / Reset
  app.post('/api/demo/reset', (req: Request, res: Response) => {
    db = getInitialSeedData();
    broadcastSSE('demo_reset', { employees: db.employees });
    res.json({ success: true, message: 'Sample demo field workforce data re-initialized.' });
  });

  // --- Vite Middleware (Development vs Production) ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Enterprise Field Workforce Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
