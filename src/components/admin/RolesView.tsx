import React, { useState } from 'react';
import { ShieldCheck, Check, X, Shield, Lock } from 'lucide-react';
import { RoleConfig } from '../../types';
import { db } from '../../services/db';

export const RolesView: React.FC = () => {
  const [roles, setRoles] = useState<RoleConfig[]>(() => db.getRoles());
  const [activeRoleId, setActiveRoleId] = useState<string>(roles[0]?.role_id || '');

  const activeRole = roles.find((r) => r.role_id === activeRoleId) || roles[0];

  const handleTogglePermission = (permKey: keyof RoleConfig['permissions']) => {
    if (activeRole.role_name === 'Super Admin') {
      alert('Super Admin root permissions cannot be revoked.');
      return;
    }
    const updated = roles.map((r) => {
      if (r.role_id === activeRole.role_id) {
        return {
          ...r,
          permissions: {
            ...r.permissions,
            [permKey]: !r.permissions[permKey],
          },
        };
      }
      return r;
    });
    setRoles(updated);
    db.logAudit('Updated Role Permissions', activeRole.role_name, `Modified permission [${permKey}] for role ${activeRole.role_name}.`);
  };

  const permissionList: { key: keyof RoleConfig['permissions']; label: string; desc: string }[] = [
    { key: 'view_attendance', label: 'View Attendance Records', desc: 'Can view daily logs, GPS locations, and photos' },
    { key: 'edit_attendance', label: 'Manual Attendance / Edit', desc: 'Can manually mark attendance and regularize punches' },
    { key: 'approve_leave', label: 'Approve / Reject Leave', desc: 'Can approve employee casual, sick and earned leaves' },
    { key: 'approve_advance', label: 'Approve Salary Advances', desc: 'Can authorize financial disbursements to staff' },
    { key: 'view_complaints', label: 'View Grievances / Complaints', desc: 'Can inspect employee grievance tickets (including confidential)' },
    { key: 'manage_employees', label: 'Manage Employees & Biometrics', desc: 'Can onboard, edit, and enroll face templates' },
    { key: 'manage_locations', label: 'Manage Locations & Geofences', desc: 'Can create office units, set GPS coordinates and radius' },
    { key: 'generate_qr', label: 'Dynamic QR Code Studio', desc: 'Can generate static and rotating entrance tokens' },
    { key: 'manage_data_sources', label: 'Database & Google Sheets Sync', desc: 'Can configure Google Sheets, field mappings, and sync schedules' },
    { key: 'view_reports', label: 'Export Analytics & Reports', desc: 'Can download daily, monthly, and audit logs' },
    { key: 'system_settings', label: 'System Configuration', desc: 'Can alter grace periods, face threshold, and API keys' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            Role & Permission Access Control Matrix (RBAC)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise granular access control: Assign system privileges to Super Admin, HR, Managers, Accounts, and Workforce.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Role Selector Sidebar */}
        <div className="space-y-2">
          {roles.map((r) => (
            <button
              key={r.role_id}
              onClick={() => setActiveRoleId(r.role_id)}
              className={`w-full text-left p-3.5 rounded-2xl border transition ${
                activeRoleId === r.role_id
                  ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-600/10'
                  : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-200">{r.role_name}</span>
                {r.role_name === 'Super Admin' && <Lock className="w-3.5 h-3.5 text-indigo-400" />}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{r.description}</p>
            </button>
          ))}
        </div>

        {/* Permissions Table for Selected Role */}
        <div className="lg:col-span-3 bg-slate-950/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="border-b border-slate-800 pb-4 mb-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-400" />
                <h2 className="font-bold text-base text-white">{activeRole.role_name} Permissions</h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{activeRole.description}</p>
            </div>
            {activeRole.role_name === 'Super Admin' && (
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Root System
              </span>
            )}
          </div>

          <div className="space-y-3">
            {permissionList.map((perm) => {
              const isEnabled = activeRole.permissions[perm.key];
              return (
                <div
                  key={perm.key}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 transition"
                >
                  <div>
                    <div className="font-semibold text-xs text-white">{perm.label}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{perm.desc}</div>
                  </div>

                  <button
                    type="button"
                    disabled={activeRole.role_name === 'Super Admin'}
                    onClick={() => handleTogglePermission(perm.key)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-75 ${
                      isEnabled ? 'bg-indigo-600' : 'bg-slate-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
