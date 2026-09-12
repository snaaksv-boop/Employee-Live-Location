import type {
  Employee,
  LocationRecord,
  AttendanceRecord,
  StayRecord,
  AuditLog,
  SystemNotification,
  StayDetectionSettings,
  PrivacySettings,
  DashboardSummary,
  TimelineEvent,
} from '../types';

export const api = {
  // Auth
  async login(credentials: { username: string; password?: string; role?: 'admin' | 'employee' }) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Login failed');
    return res.json();
  },

  // Employees
  async getEmployees(params?: { department?: string; status?: string; search?: string }): Promise<{ employees: Employee[] }> {
    const query = new URLSearchParams();
    if (params?.department) query.set('department', params.department);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    const res = await fetch(`/api/employees?${query.toString()}`);
    return res.json();
  },

  async getEmployee(id: string): Promise<{ employee: Employee }> {
    const res = await fetch(`/api/employees/${id}`);
    return res.json();
  },

  async createEmployee(data: Partial<Employee>): Promise<{ success: boolean; employee: Employee }> {
    const res = await fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateEmployee(id: string, data: Partial<Employee>): Promise<{ success: boolean; employee: Employee }> {
    const res = await fetch(`/api/employees/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async deactivateEmployee(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Location Updates
  async sendLocationUpdate(data: {
    employeeId: string;
    latitude: number;
    longitude: number;
    accuracy: number;
    speed: number | null;
    heading?: number | null;
    timestamp?: string;
    isOfflineSynced?: boolean;
    locationType?: string;
  }) {
    const res = await fetch('/api/location/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async batchSyncLocations(employeeId: string, points: any[]) {
    const res = await fetch('/api/location/batch-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId, points }),
    });
    return res.json();
  },

  // Attendance
  async checkIn(employeeId: string) {
    const res = await fetch('/api/attendance/check-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId }),
    });
    return res.json();
  },

  async checkOut(employeeId: string) {
    const res = await fetch('/api/attendance/check-out', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId }),
    });
    return res.json();
  },

  async startBreak(employeeId: string) {
    const res = await fetch('/api/attendance/break-start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId }),
    });
    return res.json();
  },

  async endBreak(employeeId: string) {
    const res = await fetch('/api/attendance/break-end', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId }),
    });
    return res.json();
  },

  // Tracking
  async startTracking(employeeId: string, consentGiven = true) {
    const res = await fetch('/api/tracking/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId, consentGiven }),
    });
    return res.json();
  },

  async stopTracking(employeeId: string) {
    const res = await fetch('/api/tracking/stop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId }),
    });
    return res.json();
  },

  // History & Movement
  async getMovementHistory(employeeId: string, date?: string): Promise<{
    employee: Employee;
    date: string;
    totalDistanceKm: number;
    pointsCount: number;
    points: LocationRecord[];
    stays: StayRecord[];
    attendance?: AttendanceRecord;
    timeline: TimelineEvent[];
  }> {
    const query = new URLSearchParams({ employeeId });
    if (date) query.set('date', date);
    const res = await fetch(`/api/movement/history?${query.toString()}`);
    return res.json();
  },

  // Stays & Settings
  async getStays(params?: { employeeId?: string; date?: string }): Promise<{ stays: StayRecord[] }> {
    const query = new URLSearchParams();
    if (params?.employeeId) query.set('employeeId', params.employeeId);
    if (params?.date) query.set('date', params.date);
    const res = await fetch(`/api/stays?${query.toString()}`);
    return res.json();
  },

  async getStaySettings(): Promise<StayDetectionSettings> {
    const res = await fetch('/api/settings/stay-detection');
    return res.json();
  },

  async updateStaySettings(settings: Partial<StayDetectionSettings>) {
    const res = await fetch('/api/settings/stay-detection', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return res.json();
  },

  // Privacy & Consent
  async getPrivacySettings(): Promise<PrivacySettings> {
    const res = await fetch('/api/settings/privacy');
    return res.json();
  },

  async updatePrivacySettings(settings: Partial<PrivacySettings>) {
    const res = await fetch('/api/settings/privacy', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return res.json();
  },

  // Analytics & Reports
  async getDashboardSummary(): Promise<DashboardSummary> {
    const res = await fetch('/api/reports/dashboard');
    return res.json();
  },

  async getDateRangeReport(employeeId: string, startDate?: string, endDate?: string) {
    const query = new URLSearchParams({ employeeId });
    if (startDate) query.set('startDate', startDate);
    if (endDate) query.set('endDate', endDate);
    const res = await fetch(`/api/reports/range?${query.toString()}`);
    return res.json();
  },

  // Notifications & Audits
  async getNotifications(): Promise<{ notifications: SystemNotification[] }> {
    const res = await fetch('/api/notifications');
    return res.json();
  },

  async markAllNotificationsRead() {
    const res = await fetch('/api/notifications/mark-read', { method: 'POST' });
    return res.json();
  },

  async getAuditLogs(): Promise<{ logs: AuditLog[] }> {
    const res = await fetch('/api/audit-logs');
    return res.json();
  },

  // Demo Reset
  async resetDemoData() {
    const res = await fetch('/api/demo/reset', { method: 'POST' });
    return res.json();
  },

  // SSE connection for live tracking events
  connectSSE(callbacks: {
    onLocationUpdate?: (record: LocationRecord) => void;
    onEmployeeStatus?: (data: { employeeId: string; workStatus: any; isOnline?: boolean }) => void;
    onNotification?: (notif: SystemNotification) => void;
  }) {
    const eventSource = new EventSource('/api/events');

    eventSource.addEventListener('location_update', (e) => {
      try {
        const data = JSON.parse(e.data);
        callbacks.onLocationUpdate?.(data);
      } catch (err) {
        console.error('SSE location parse error', err);
      }
    });

    eventSource.addEventListener('employee_status', (e) => {
      try {
        const data = JSON.parse(e.data);
        callbacks.onEmployeeStatus?.(data);
      } catch (err) {
        console.error('SSE status parse error', err);
      }
    });

    eventSource.addEventListener('notification', (e) => {
      try {
        const data = JSON.parse(e.data);
        callbacks.onNotification?.(data);
      } catch (err) {
        console.error('SSE notification parse error', err);
      }
    });

    eventSource.onerror = (err) => {
      console.warn('SSE event stream warning', err);
    };

    return () => {
      eventSource.close();
    };
  },
};
