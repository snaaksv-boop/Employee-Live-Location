import React from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Clock,
  WifiOff,
  ShieldAlert,
  Coffee,
} from 'lucide-react';
import type { SystemNotification } from '../types';

interface NotificationsPanelProps {
  notifications: SystemNotification[];
  onMarkAllRead: () => void;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  notifications = [],
  onMarkAllRead,
}) => {
  const safeNotifs = Array.isArray(notifications) ? notifications : [];
  const getIcon = (type: string) => {
    switch (type) {
      case 'tracking_started':
        return <Radio className="h-4 w-4 text-emerald-600" />;
      case 'tracking_stopped':
        return <Radio className="h-4 w-4 text-slate-400" />;
      case 'check_in':
        return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
      case 'check_out':
        return <Clock className="h-4 w-4 text-purple-600" />;
      case 'stay_detected':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'offline':
        return <WifiOff className="h-4 w-4 text-rose-500" />;
      case 'permission_denied':
        return <ShieldAlert className="h-4 w-4 text-rose-600" />;
      default:
        return <Bell className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Workforce Activity & Alert Notifications
          </h2>
          <p className="text-xs text-slate-500">
            Live broadcast events triggered by field worker check-ins, route movements, and stay detections.
          </p>
        </div>

        <button
          onClick={onMarkAllRead}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-blue-600 hover:bg-slate-50 transition-colors self-start sm:self-auto"
        >
          Mark all as read
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs divide-y divide-slate-100 overflow-hidden">
        {safeNotifs.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No system notifications recorded.
          </div>
        ) : (
          safeNotifs.map((n) => (
            <div
              key={n.id}
              className={`p-4 flex items-start gap-4 transition-colors ${
                n.read ? 'hover:bg-slate-50/80' : 'bg-blue-50/40 hover:bg-blue-50/60'
              }`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200 shadow-xs mt-0.5">
                {getIcon(n.type)}
              </div>

              <div className="flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{n.title}</span>
                  <span className="text-[11px] font-medium text-slate-400">{n.timestamp}</span>
                </div>
                <p className="text-slate-600 mt-1">{n.message}</p>
                {n.employeeName && (
                  <span className="mt-2 inline-block rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                    Personnel: {n.employeeName}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
