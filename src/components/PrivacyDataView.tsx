import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Eye,
  FileText,
  Save,
  CheckCircle2,
  AlertTriangle,
  Database,
  UserCheck,
} from 'lucide-react';
import type { PrivacySettings } from '../types';
import { api } from '../services/api';

export const PrivacyDataView: React.FC = () => {
  const [settings, setSettings] = useState<PrivacySettings>({
    policyText:
      'Location tracking is active strictly during authorized working hours for logistics coordination, route validation, and worker safety. No tracking occurs after check-out or during unpaid personal breaks.',
    consentNotice:
      'Location tracking is active for authorized work purposes. Your location data will be recorded only according to company policy.',
    dataRetentionDays: 90,
    allowOfflineBuffer: true,
    adminApprovalRequired: true,
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await api.getPrivacySettings();
      setSettings(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updatePrivacySettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Location Privacy, Consent & Governance
          </h2>
          <p className="text-xs text-slate-500">
            Transparent employee consent workflows, GDPR/Workplace compliance, and automated data retention policies.
          </p>
        </div>
      </div>

      {/* Compliance Guarantee Callout */}
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-emerald-900 text-sm">
              Workforce Transparency Guarantee
            </h4>
            <p className="text-emerald-700 mt-1 max-w-3xl leading-relaxed">
              In strict accordance with enterprise privacy standards, administrators cannot silently or secretly activate GPS tracking on an employee’s device. Tracking requires explicit employee consent in the mobile portal and automatically pauses during authorized breaks or after shift check-out.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Consent Notice */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <UserCheck className="h-4 w-4 text-blue-600" />
            <span>Pre-Tracking Employee Consent Modal Notice (Section 13)</span>
          </div>

          <p className="text-xs text-slate-500">
            This notice is displayed to every field worker before GPS tracking can be activated.
          </p>

          <textarea
            rows={3}
            value={settings.consentNotice}
            onChange={(e) => setSettings({ ...settings, consentNotice: e.target.value })}
            className="w-full rounded-xl bg-slate-50 p-3 text-xs text-slate-800 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Full Corporate Privacy Policy */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <FileText className="h-4 w-4 text-blue-600" />
            <span>Enterprise Location Data Policy</span>
          </div>

          <textarea
            rows={4}
            value={settings.policyText}
            onChange={(e) => setSettings({ ...settings, policyText: e.target.value })}
            className="w-full rounded-xl bg-slate-50 p-3 text-xs text-slate-800 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Data Retention & Storage Settings */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Database className="h-4 w-4 text-purple-600" />
            <span>Data Retention Lifecycle</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Historical GPS Retention Window:
              </label>
              <select
                value={settings.dataRetentionDays}
                onChange={(e) =>
                  setSettings({ ...settings, dataRetentionDays: Number(e.target.value) })
                }
                className="w-full rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 border border-slate-200 focus:ring-2 focus:ring-blue-500"
              >
                <option value={30}>30 Days (Strict Storage)</option>
                <option value={60}>60 Days</option>
                <option value={90}>90 Days (Enterprise Standard)</option>
                <option value={180}>180 Days (Half Year)</option>
                <option value={365}>365 Days (Annual Compliance)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Coordinates older than this threshold are purged automatically.
              </p>
            </div>

            <div className="flex flex-col justify-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.allowOfflineBuffer}
                  onChange={(e) =>
                    setSettings({ ...settings, allowOfflineBuffer: e.target.checked })
                  }
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-semibold text-slate-700">
                  Allow Secure Offline Device Buffering (Section 14)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.adminApprovalRequired}
                  onChange={(e) =>
                    setSettings({ ...settings, adminApprovalRequired: e.target.checked })
                  }
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-semibold text-slate-700">
                  Require Employee Explicit Opt-In Signature
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          {saved && (
            <span className="flex items-center gap-1 text-emerald-700 font-semibold text-xs">
              <CheckCircle2 className="h-4 w-4" />
              <span>Policy settings updated and applied across workforce!</span>
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 font-semibold text-white shadow-sm hover:bg-blue-500 transition-all text-xs disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Saving Changes...' : 'Save Policy Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
