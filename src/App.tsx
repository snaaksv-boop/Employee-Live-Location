import React, { useEffect, useState, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { AdminSidebar, AdminTab } from './components/AdminSidebar';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLiveMap } from './components/AdminLiveMap';
import { EmployeeManagement } from './components/EmployeeManagement';
import { MovementHistory } from './components/MovementHistory';
import { StayReports } from './components/StayReports';
import { AttendanceView } from './components/AttendanceView';
import { ComprehensiveReports } from './components/ComprehensiveReports';
import { DistanceReports } from './components/DistanceReports';
import { WorkingHoursView } from './components/WorkingHoursView';
import { PrivacyDataView } from './components/PrivacyDataView';
import { AuditLogsView } from './components/AuditLogsView';
import { NotificationsPanel } from './components/NotificationsPanel';
import { EmployeePanel } from './components/EmployeePanel';
import { LoginView } from './components/LoginView';
import type { Employee, DashboardSummary, SystemNotification, UserSession } from './types';
import { api } from './services/api';

export default function App() {
  // Session State
  const [session, setSession] = useState<UserSession | null>({
    role: 'admin',
    username: 'admin@trackcorp.io',
    name: 'Chief Admin Officer',
  });

  // Active Admin View Tab
  const [currentTab, setCurrentTab] = useState<AdminTab>('dashboard');

  // Selected Employee for focused Map or History
  const [focusedEmployeeId, setFocusedEmployeeId] = useState<string | null>(null);

  // App Data
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [loading, setLoading] = useState(true);

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      const [empRes, sumRes, notifRes] = await Promise.all([
        api.getEmployees(),
        api.getDashboardSummary(),
        api.getNotifications(),
      ]);
      setEmployees(empRes.employees || []);
      setSummary(sumRes);
      setNotifications(notifRes.notifications || []);
    } catch (err) {
      console.error('Error fetching data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Connect SSE for live updates
  useEffect(() => {
    const cleanup = api.connectSSE({
      onLocationUpdate: (record) => {
        setEmployees((prev) =>
          prev.map((emp) =>
            emp.id === record.employeeId
              ? {
                  ...emp,
                  lastLocation: record,
                  isOnline: true,
                }
              : emp
          )
        );
      },
      onEmployeeStatus: (data) => {
        setEmployees((prev) =>
          prev.map((emp) =>
            emp.id === data.employeeId
              ? {
                  ...emp,
                  workStatus: data.workStatus,
                  isOnline: data.isOnline !== undefined ? data.isOnline : emp.isOnline,
                }
              : emp
          )
        );
      },
      onNotification: (notif) => {
        setNotifications((prev) => [notif, ...prev]);
      },
    });

    return () => cleanup();
  }, []);

  // Employee CRUD handlers
  const handleAddEmployee = async (data: Partial<Employee>) => {
    await api.createEmployee(data);
    await loadData();
  };

  const handleUpdateEmployee = async (id: string, data: Partial<Employee>) => {
    await api.updateEmployee(id, data);
    await loadData();
  };

  const handleDeactivateEmployee = async (id: string) => {
    await api.deactivateEmployee(id);
    await loadData();
  };

  const handleViewLiveLocation = (id: string) => {
    setFocusedEmployeeId(id);
    setCurrentTab('live_tracking');
  };

  const handleViewHistory = (id: string) => {
    setFocusedEmployeeId(id);
    setCurrentTab('movement_history');
  };

  const handleMarkAllNotificationsRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Find active employee for Employee Panel
  const currentEmployee =
    employees.find((e) => e.id === session?.employeeId) ||
    employees[0] ||
    null;

  // Render Login if no session
  if (!session) {
    return <LoginView employees={employees} onLoginSuccess={setSession} />;
  }

  const unreadCount = (notifications || []).filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Navigation Bar */}
      <Navbar
        userSession={session}
        session={session}
        onSwitchRole={(newRole) => {
          if (newRole === 'admin') {
            setSession({
              role: 'admin',
              username: 'admin@trackcorp.io',
              name: 'Chief Admin Officer',
            });
          } else {
            const emp = employees[0];
            setSession({
              role: 'employee',
              username: emp?.username || 'alex.r',
              employeeId: emp?.id || 'emp-1',
              name: emp?.name || 'Alex Rivera',
            });
          }
        }}
        onLogout={() => setSession(null)}
        notifications={notifications}
        unreadNotificationsCount={unreadCount}
        onMarkNotificationsRead={handleMarkAllNotificationsRead}
        isLiveConnected={true}
        isDemoActive={true}
        onResetDemo={async () => {
          await api.resetDemoData();
          await loadData();
        }}
        onOpenNotifications={() => {
          if (session.role === 'admin') {
            setCurrentTab('notifications');
          }
        }}
      />

      {/* Main Content Area */}
      {session.role === 'employee' ? (
        // EMPLOYEE PANEL VIEW (Mobile Friendly)
        <main className="flex-1">
          {currentEmployee ? (
            <EmployeePanel
              currentEmployee={currentEmployee}
              onLogout={() => setSession(null)}
              onRefreshEmployee={loadData}
            />
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">
              No employee profile associated with this account.
            </div>
          )}
        </main>
      ) : (
        // ADMIN PANEL VIEW
        <div className="flex-1 flex flex-col md:flex-row">
          {/* Admin Sidebar */}
          <AdminSidebar
            currentTab={currentTab}
            onSelectTab={setCurrentTab}
            onLogout={() => setSession(null)}
            unreadCount={unreadCount}
          />

          {/* Admin View Canvas */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {currentTab === 'dashboard' && (
              <AdminDashboard
                summary={summary}
                employees={employees}
                onViewLiveMap={handleViewLiveLocation}
                onViewHistory={handleViewHistory}
              />
            )}

            {currentTab === 'live_tracking' && (
              <AdminLiveMap
                employees={employees}
                selectedEmployeeId={focusedEmployeeId}
                onSelectEmployee={setFocusedEmployeeId}
              />
            )}

            {currentTab === 'employees' && (
              <EmployeeManagement
                employees={employees}
                onAddEmployee={handleAddEmployee}
                onUpdateEmployee={handleUpdateEmployee}
                onDeactivateEmployee={handleDeactivateEmployee}
                onViewLiveLocation={handleViewLiveLocation}
                onViewHistory={handleViewHistory}
              />
            )}

            {currentTab === 'movement_history' && (
              <MovementHistory
                employees={employees}
                initialEmployeeId={focusedEmployeeId}
              />
            )}

            {currentTab === 'stay_reports' && <StayReports employees={employees} />}

            {currentTab === 'attendance' && <AttendanceView employees={employees} />}

            {currentTab === 'reports' && <ComprehensiveReports employees={employees} />}

            {currentTab === 'distance_reports' && <DistanceReports employees={employees} />}

            {currentTab === 'working_hours' && <WorkingHoursView employees={employees} />}

            {(currentTab === 'privacy_data' || currentTab === 'settings') && <PrivacyDataView />}

            {currentTab === 'audit_logs' && <AuditLogsView />}

            {currentTab === 'notifications' && (
              <NotificationsPanel
                notifications={notifications}
                onMarkAllRead={handleMarkAllNotificationsRead}
              />
            )}
          </main>
        </div>
      )}
    </div>
  );
}
