import React from 'react';
import {
  LayoutDashboard,
  Users,
  MapPin,
  CalendarCheck,
  Route,
  Clock,
  Navigation,
  Timer,
  FileBarChart2,
  Bell,
  Sliders,
  ShieldCheck,
  History,
  LogOut,
  ChevronRight,
} from 'lucide-react';

export type AdminTab =
  | 'dashboard'
  | 'employees'
  | 'live_tracking'
  | 'attendance'
  | 'movement_history'
  | 'stay_reports'
  | 'distance_reports'
  | 'working_hours'
  | 'reports'
  | 'notifications'
  | 'settings'
  | 'privacy_data'
  | 'audit_logs';

interface AdminSidebarProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onLogout: () => void;
  unreadCount?: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentTab,
  onSelectTab,
  onLogout,
  unreadCount = 0,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const menuItems: Array<{ id: AdminTab; label: string; icon: React.ElementType; badge?: number }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'live_tracking', label: 'Live Tracking', icon: MapPin },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'movement_history', label: 'Movement History', icon: Route },
    { id: 'stay_reports', label: 'Stay Reports', icon: Clock },
    { id: 'distance_reports', label: 'Distance Reports', icon: Navigation },
    { id: 'working_hours', label: 'Working Hours', icon: Timer },
    { id: 'reports', label: 'Reports & Export', icon: FileBarChart2 },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    { id: 'settings', label: 'Settings', icon: Sliders },
    { id: 'privacy_data', label: 'Privacy & Data', icon: ShieldCheck },
    { id: 'audit_logs', label: 'Audit Logs', icon: History },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center px-6 border-b border-slate-100">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Workforce Portal
          </span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge != null && item.badge > 0 ? (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : isActive ? (
                  <ChevronRight className="h-3.5 w-3.5 text-blue-200" />
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Bottom Session Logout */}
        <div className="border-t border-slate-100 p-3">
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout Session</span>
          </button>
        </div>
      </aside>
    </>
  );
};
