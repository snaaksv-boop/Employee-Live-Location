import React, { useState } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  MapPin,
  Clock,
  Navigation,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Shield,
  Filter,
} from 'lucide-react';
import type { Employee } from '../types';

interface EmployeeManagementProps {
  employees: Employee[];
  onAddEmployee: (data: Partial<Employee>) => Promise<void>;
  onUpdateEmployee: (id: string, data: Partial<Employee>) => Promise<void>;
  onDeactivateEmployee: (id: string) => Promise<void>;
  onViewLiveLocation: (id: string) => void;
  onViewHistory: (id: string) => void;
}

export const EmployeeManagement: React.FC<EmployeeManagementProps> = ({
  employees,
  onAddEmployee,
  onUpdateEmployee,
  onDeactivateEmployee,
  onViewLiveLocation,
  onViewHistory,
}) => {
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Employee>>({
    name: '',
    employeeId: '',
    phone: '',
    email: '',
    department: 'Field Service',
    designation: 'Field Technician',
    joiningDate: new Date().toISOString().split('T')[0],
    username: '',
    password: '',
    assignedArea: 'Central Metro Branch',
    trackingPermissionStatus: 'granted',
    profilePhoto:
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  });

  const departments = ['Field Service', 'Sales', 'Logistics & Delivery', 'Quality Audit', 'Maintenance'];

  const safeEmployees = Array.isArray(employees) ? employees : [];
  const filtered = safeEmployees.filter((emp) => {
    if (filterDept !== 'all' && emp.department !== filterDept) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        emp.name.toLowerCase().includes(q) ||
        emp.employeeId.toLowerCase().includes(q) ||
        emp.email.toLowerCase().includes(q) ||
        emp.assignedArea.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenAdd = () => {
    setEditingEmployee(null);
    setFormData({
      name: '',
      employeeId: `EMP-${100 + employees.length + 1}`,
      phone: '',
      email: '',
      department: 'Field Service',
      designation: 'Field Technician',
      joiningDate: new Date().toISOString().split('T')[0],
      username: `user${100 + employees.length + 1}`,
      password: 'password123',
      assignedArea: 'Central Metro Branch',
      trackingPermissionStatus: 'granted',
      profilePhoto:
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({ ...emp });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEmployee) {
      await onUpdateEmployee(editingEmployee.id, formData);
    } else {
      await onAddEmployee(formData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Employee Management</h2>
          <p className="text-xs text-slate-500">
            Configure field personnel accounts, authorization levels, and branch assignments.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Add Employee</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, ID, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-xl bg-slate-50 pl-9 pr-3 text-xs text-slate-900 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="h-9 rounded-xl bg-slate-50 px-3 text-xs font-medium text-slate-700 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-400 font-medium">
          Showing <span className="font-bold text-slate-700">{filtered.length}</span> employees
        </div>
      </div>

      {/* Employees Table (Section 3) */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Employee Name & ID</th>
                <th className="px-4 py-3.5">Contact Details</th>
                <th className="px-4 py-3.5">Department & Area</th>
                <th className="px-4 py-3.5">Current Status</th>
                <th className="px-4 py-3.5">Last Location</th>
                <th className="px-4 py-3.5">Today's Activity</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((emp) => {
                const isWorking = emp.workStatus === 'working';
                const isOnBreak = emp.workStatus === 'on_break';
                const isOffline = !emp.isOnline;

                return (
                  <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={emp.profilePhoto}
                          alt={emp.name}
                          className="h-10 w-10 rounded-full object-cover border border-slate-200 shadow-xs"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">{emp.name}</span>
                            {emp.isDemo && (
                              <span className="rounded bg-amber-100 px-1 py-0.2 text-[9px] font-bold text-amber-800">
                                SAMPLE
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-mono text-slate-400 block font-semibold">
                            {emp.employeeId}
                          </span>
                          <span className="text-[10px] text-slate-400">Joined {emp.joiningDate}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-800">{emp.email}</p>
                      <p className="text-[11px] text-slate-400">{emp.phone}</p>
                      <span className="text-[10px] font-mono text-slate-400">@{emp.username}</span>
                    </td>

                    <td className="px-4 py-4">
                      <span className="font-semibold text-slate-800">{emp.department}</span>
                      <p className="text-[11px] text-slate-500">{emp.designation}</p>
                      <span className="inline-block mt-0.5 text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                        {emp.assignedArea}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          isWorking
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isOnBreak
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : isOffline
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isWorking
                              ? 'bg-emerald-500'
                              : isOnBreak
                              ? 'bg-amber-500'
                              : isOffline
                              ? 'bg-rose-500'
                              : 'bg-slate-400'
                          }`}
                        />
                        {isWorking ? 'Working' : isOnBreak ? 'On Break' : isOffline ? 'Offline' : 'Not Started'}
                      </span>
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
                        <Shield className="h-3 w-3 text-emerald-600" />
                        <span>Tracking: {emp.trackingPermissionStatus.toUpperCase()}</span>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      {emp.lastLocation ? (
                        <div className="max-w-[200px]">
                          <p className="font-medium text-slate-800 truncate">
                            {emp.lastLocation.address || `${emp.lastLocation.latitude.toFixed(4)}, ${emp.lastLocation.longitude.toFixed(4)}`}
                          </p>
                          <span className="text-[10px] text-slate-400 block">
                            Last updated:{' '}
                            {new Date(emp.lastLocation.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No GPS update today</span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <div className="space-y-0.5 font-medium">
                        <div className="flex items-center gap-1 text-slate-700">
                          <Navigation className="h-3 w-3 text-blue-600" />
                          <span>{emp.todayStats?.distanceKm || 0} km</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-700">
                          <Clock className="h-3 w-3 text-purple-600" />
                          <span>{Math.round(((emp.todayStats?.workingMinutes || 0) / 60) * 10) / 10} hrs</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onViewLiveLocation(emp.id)}
                          className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                          Live Location
                        </button>
                        <button
                          onClick={() => onViewHistory(emp.id)}
                          className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                        >
                          History
                        </button>
                        <button
                          onClick={() => handleOpenEdit(emp)}
                          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                          title="Edit Employee"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onDeactivateEmployee(emp.id)}
                          className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          title="Deactivate Employee"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingEmployee ? 'Edit Employee Profile' : 'Add New Workforce Member'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Employee ID *</label>
                  <input
                    type="text"
                    required
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full rounded-xl bg-slate-50 px-3 py-2 border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl bg-slate-50 px-3 py-2 border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-xl bg-slate-50 px-3 py-2 border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-xl bg-slate-50 px-3 py-2 border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full rounded-xl bg-slate-50 px-3 py-2 border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full rounded-xl bg-slate-50 px-3 py-2 border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Joining Date</label>
                  <input
                    type="date"
                    value={formData.joiningDate}
                    onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                    className="w-full rounded-xl bg-slate-50 px-3 py-2 border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Area / Branch</label>
                  <input
                    type="text"
                    value={formData.assignedArea}
                    onChange={(e) => setFormData({ ...formData, assignedArea: e.target.value })}
                    className="w-full rounded-xl bg-slate-50 px-3 py-2 border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Portal Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full rounded-xl bg-slate-50 px-3 py-2 border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    placeholder={editingEmployee ? 'Leave blank to keep current' : 'Enter password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full rounded-xl bg-slate-50 px-3 py-2 border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Profile Photo URL</label>
                <input
                  type="url"
                  value={formData.profilePhoto}
                  onChange={(e) => setFormData({ ...formData, profilePhoto: e.target.value })}
                  className="w-full rounded-xl bg-slate-50 px-3 py-2 border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-500 shadow-sm"
                >
                  {editingEmployee ? 'Save Changes' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
