import React, { useState } from 'react';
import {
  Bell,
  Radio,
  ShieldCheck,
  User,
  LogOut,
  RefreshCw,
  Sparkles,
  Smartphone,
  LayoutDashboard,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import type { UserSession, SystemNotification } from '../types';

interface NavbarProps {
  userSession?: UserSession;
  session?: UserSession;
  onLogout: () => void;
  onSwitchRole: (role: 'admin' | 'employee') => void;
  notifications?: SystemNotification[];
  onMarkNotificationsRead?: () => void;
  unreadNotificationsCount?: number;
  onOpenNotifications?: () => void;
  isLiveConnected?: boolean;
  isDemoActive?: boolean;
  onResetDemo?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  userSession,
  session,
  onLogout,
  onSwitchRole,
  notifications = [],
  onMarkNotificationsRead,
  unreadNotificationsCount,
  onOpenNotifications,
  isLiveConnected = true,
  isDemoActive = true,
  onResetDemo,
}) => {
  const [showNotifs, setShowNotifs] = useState(false);
  const currentSession = userSession || session || {
    role: 'admin',
    name: 'Administrator',
    username: 'admin',
  };
  const notifsList = Array.isArray(notifications) ? notifications : [];
  const unreadCount =
    unreadNotificationsCount !== undefined
      ? unreadNotificationsCount
      : notifsList.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md sm:px-6">
      {/* Brand & Mode Tag */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white shadow-md shadow-blue-500/20">
          <Radio className="h-5 w-5 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-tight text-slate-900 text-base sm:text-lg">
              GeoWorkforce
            </span>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 border border-blue-200">
              Enterprise Live
            </span>
          </div>
          <p className="hidden text-xs text-slate-500 sm:block">
            Field Location & Workforce Management
          </p>
        </div>
      </div>

      {/* Demo Mode Indicator & Role Switcher */}
      <div className="flex items-center gap-2 sm:gap-4">
        {isDemoActive && (
          <div className="hidden lg:flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 border border-amber-200/80 text-xs font-medium text-amber-800">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            <span>SAMPLE/DEMO DATA ACTIVE</span>
            <button
              onClick={onResetDemo}
              title="Reset Demo Dataset"
              className="ml-1 rounded p-0.5 hover:bg-amber-100 text-amber-900"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Live SSE Status Pill */}
        <div
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border"
          style={{
            backgroundColor: isLiveConnected ? '#ecfdf5' : '#fffbeb',
            borderColor: isLiveConnected ? '#a7f3d0' : '#fde68a',
            color: isLiveConnected ? '#065f46' : '#92400e',
          }}
          title={isLiveConnected ? 'Real-time WebSocket/SSE active' : 'Connecting to live events...'}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              isLiveConnected ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'
            }`}
          />
          <span className="hidden sm:inline">
            {isLiveConnected ? 'Live Real-Time' : 'Syncing'}
          </span>
        </div>

        {/* Quick View Switcher between Admin and Employee */}
        <div className="flex items-center rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
          <button
            onClick={() => onSwitchRole('admin')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 transition-all ${
              currentSession.role === 'admin'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Admin Panel</span>
            <span className="md:hidden">Admin</span>
          </button>
          <button
            onClick={() => onSwitchRole('employee')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 transition-all ${
              currentSession.role === 'employee'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Employee Mobile</span>
            <span className="md:hidden">Worker</span>
          </button>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifs(!showNotifs);
              if (!showNotifs && unreadCount > 0) {
                onMarkNotificationsRead();
              }
            }}
            className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Flyout */}
          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 px-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-slate-900 text-sm">Workforce Alerts</h4>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700 font-medium">
                    {notifications.length}
                  </span>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkNotificationsRead}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Mark read
                  </button>
                )}
              </div>

              <div className="mt-2 max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No recent activity alerts.
                  </div>
                ) : (
                  notifications.slice(0, 10).map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-2.5 transition-colors rounded-lg ${
                        notif.read ? 'hover:bg-slate-50' : 'bg-blue-50/50'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 text-blue-600">
                          {notif.type === 'stay_detected' ? (
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-slate-900">{notif.title}</p>
                          <p className="text-xs text-slate-600 mt-0.5">{notif.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {notif.timestamp}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Session Profile & Logout */}
        <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs">
              {(currentSession.name || 'User').charAt(0)}
            </div>
            <div className="hidden xl:block text-left">
              <p className="text-xs font-semibold text-slate-900 leading-tight">
                {currentSession.name || 'User'}
              </p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                {currentSession.role || 'admin'}
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Logout Session"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
