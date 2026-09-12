export type WorkStatus = 'not_started' | 'working' | 'on_break' | 'completed' | 'offline';
export type LocationType = 'gps' | 'approx' | 'last_known' | 'offline_synced';
export type TrackingPermission = 'granted' | 'prompt' | 'denied';

export interface LocationRecord {
  id: string;
  employeeId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy: number;
  speed: number | null;
  heading?: number | null;
  trackingSessionId: string;
  isOfflineSynced: boolean;
  locationType: LocationType;
  address?: string;
  batteryLevel?: number;
}

export interface StayRecord {
  id: string;
  employeeId: string;
  date: string;
  latitude: number;
  longitude: number;
  address: string;
  placeName: string;
  arrivalTime: string;
  departureTime: string;
  durationMinutes: number;
  gpsPointsCount: number;
}

export interface BreakPeriod {
  start: string;
  end?: string;
  durationMinutes?: number;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  workStart?: string;
  workEnd?: string;
  breaks: BreakPeriod[];
  totalWorkMinutes: number;
  totalBreakMinutes: number;
  status: 'present' | 'absent' | 'half_day' | 'on_leave';
}

export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  phone: string;
  email: string;
  department: string;
  designation: string;
  joiningDate: string;
  username: string;
  password?: string;
  profilePhoto: string;
  assignedArea: string;
  trackingPermissionStatus: TrackingPermission;
  status: 'active' | 'inactive';
  workStatus: WorkStatus;
  isTracking: boolean;
  isOnline: boolean;
  lastLocation?: LocationRecord;
  todayStats: {
    checkIn?: string;
    checkOut?: string;
    workingMinutes: number;
    distanceKm: number;
    updatesCount: number;
    stayCount: number;
  };
  isDemo?: boolean;
}

export interface TrackingSession {
  id: string;
  employeeId: string;
  startTime: string;
  endTime?: string;
  status: 'active' | 'stopped';
  consentAcknowledged: boolean;
  totalDistanceKm: number;
  pointsCount: number;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  timestamp: string;
  employeeId?: string;
  employeeName?: string;
  details: string;
}

export interface SystemNotification {
  id: string;
  type:
    | 'tracking_started'
    | 'tracking_stopped'
    | 'check_in'
    | 'check_out'
    | 'offline'
    | 'permission_denied'
    | 'stay_detected'
    | 'system';
  title: string;
  message: string;
  timestamp: string;
  employeeId?: string;
  employeeName?: string;
  read: boolean;
}

export interface StayDetectionSettings {
  minStayMinutes: number;
  stayRadiusMeters: number;
  autoReverseGeocode: boolean;
}

export interface PrivacySettings {
  policyText: string;
  consentNotice: string;
  dataRetentionDays: number;
  allowOfflineBuffer: boolean;
  adminApprovalRequired: boolean;
}

export interface DashboardSummary {
  totalEmployees: number;
  onlineEmployees: number;
  currentlyWorking: number;
  notStarted: number;
  onBreak: number;
  todayDistanceKm: number;
  todayWorkingHours: number;
  totalLocationUpdates: number;
}

export interface TimelineEvent {
  id: string;
  time: string;
  type: 'check_in' | 'check_out' | 'office' | 'travel' | 'stay' | 'break' | 'resume';
  title: string;
  description: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  duration?: string;
}

export interface UserSession {
  role: 'admin' | 'employee';
  id: string;
  name: string;
  email: string;
  token: string;
  employee?: Employee;
}
