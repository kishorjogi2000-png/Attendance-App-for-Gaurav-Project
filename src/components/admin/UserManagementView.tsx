import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Shield,
  KeyRound,
  CheckCircle2,
  XCircle,
  Lock,
  Unlock,
  RefreshCw,
  Edit2,
  Trash2,
  Camera,
  X,
} from 'lucide-react';
import { AccountStatus, UserAccount, UserRole } from '../../types';
import { db } from '../../services/db';
import { hashPassword } from '../../services/auth';

export const UserManagementView: React.FC = () => {
  const [users, setUsers] = useState<UserAccount[]>(() => db.getUsers());
  const employees = db.getEmployees();
  const locations = db.getLocations();
  const departments = db.getDepartments();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  // Form Fields
  const [userId, setUserId] = useState('');
  const [employeeId, setEmployeeId] = useState(employees[0]?.employee_id || '');
  const [username, setUsername] = useState('');
  const [tempPassword, setTempPassword] = useState('Temp@123');
  const [role, setRole] = useState<UserRole>('Employee');
  const [status, setStatus] = useState<AccountStatus>('Active');
  const [forcePasswordChange, setForcePasswordChange] = useState(true);

  // Password Reset Action Modal
  const [resetModalUser, setResetModalUser] = useState<UserAccount | null>(null);
  const [newAdminResetPass, setNewAdminResetPass] = useState('Reset@123');

  const refresh = () => setUsers([...db.getUsers()]);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setUserId(`USR-${Date.now().toString().slice(-4)}`);
    setEmployeeId(employees[0]?.employee_id || '');
    setUsername('');
    setTempPassword('Temp@123');
    setRole('Employee');
    setStatus('Pending');
    setForcePasswordChange(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: UserAccount) => {
    setEditingUser(user);
    setUserId(user.user_id);
    setEmployeeId(user.employee_id);
    setUsername(user.username);
    setRole(user.role);
    setStatus(user.status);
    setForcePasswordChange(user.first_login);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim() || !username.trim()) return;

    if (editingUser) {
      const updated: UserAccount = {
        ...editingUser,
        username,
        employee_id: employeeId,
        role,
        status,
        first_login: forcePasswordChange,
        updated_at: new Date().toISOString(),
      };
      db.updateUser(updated);
    } else {
      const passHash = await hashPassword(tempPassword);
      const newUser: UserAccount = {
        user_id: userId,
        employee_id: employeeId,
        username,
        password_hash: passHash,
        temp_password: tempPassword,
        role,
        status,
        first_login: forcePasswordChange,
        failed_attempts: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.addUser(newUser);
    }

    setIsModalOpen(false);
    refresh();
  };

  const handleToggleStatus = (user: UserAccount, targetStatus: AccountStatus) => {
    const updated: UserAccount = {
      ...user,
      status: targetStatus,
      updated_at: new Date().toISOString(),
    };
    db.updateUser(updated);
    refresh();
  };

  const handleExecuteResetPassword = async () => {
    if (!resetModalUser) return;
    const passHash = await hashPassword(newAdminResetPass);
    const updated: UserAccount = {
      ...resetModalUser,
      password_hash: passHash,
      temp_password: newAdminResetPass,
      first_login: true, // Force user to change on next login
      status: 'Active',
      failed_attempts: 0,
      updated_at: new Date().toISOString(),
    };
    db.updateUser(updated);
    db.logAudit('Reset User Password', resetModalUser.user_id, `Administrator reset password for ${resetModalUser.username} with forced change flag.`);
    setResetModalUser(null);
    refresh();
    alert(`Password reset successfully for ${updated.username}. Temporary password: ${newAdminResetPass}`);
  };

  const filtered = users.filter((u) => {
    const matchSearch =
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.employee_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = selectedRole === 'All' || u.role === selectedRole;
    const matchStatus = selectedStatus === 'All' || u.status === selectedStatus;
    return matchSearch && matchRole && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            User Account & Credential Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Provision employee login IDs, enforce first-time password changes, manage active/inactive statuses, and reset credentials.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Create User Account</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search username, User ID, employee ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="All">All Roles</option>
            <option value="Super Admin">Super Admin</option>
            <option value="Admin">Admin</option>
            <option value="HR">HR</option>
            <option value="Manager">Manager</option>
            <option value="Accounts">Accounts</option>
            <option value="Employee">Employee</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Inactive">Inactive</option>
            <option value="Suspended">Suspended</option>
            <option value="Blocked">Blocked</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400">
              <tr>
                <th className="py-3 px-4 font-semibold">User ID / Username</th>
                <th className="py-3 px-4 font-semibold">Associated Employee</th>
                <th className="py-3 px-4 font-semibold">Role</th>
                <th className="py-3 px-4 font-semibold">Department & Site</th>
                <th className="py-3 px-4 font-semibold">Face Status</th>
                <th className="py-3 px-4 font-semibold">Account Status</th>
                <th className="py-3 px-4 font-semibold">Last Login</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((u) => {
                const emp = employees.find((e) => e.employee_id === u.employee_id);
                return (
                  <tr key={u.user_id} className="hover:bg-slate-900/60 transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200 text-sm font-mono">{u.username}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{u.user_id}</div>
                    </td>
                    <td className="py-3 px-4">
                      {emp ? (
                        <div>
                          <div className="font-medium text-slate-200">{emp.employee_name}</div>
                          <span className="text-[10px] text-slate-400 font-mono">{emp.employee_code}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Admin Root</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-indigo-300 font-semibold">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-300">{emp?.department || 'Administration'}</div>
                      <div className="text-[10px] text-slate-500">{emp?.assigned_location || 'All Sites'}</div>
                    </td>
                    <td className="py-3 px-4">
                      {emp?.face_status === 'Registered' ? (
                        <span className="text-emerald-400 font-medium inline-flex items-center gap-1 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Registered
                        </span>
                      ) : (
                        <span className="text-amber-400 font-medium inline-flex items-center gap-1 text-[11px]">
                          <Camera className="w-3.5 h-3.5" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.status === 'Active'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : u.status === 'Pending'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px] font-mono">
                      {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setResetModalUser(u)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 transition"
                          title="Reset Password"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                          title="Edit User"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {u.status === 'Active' ? (
                          <button
                            onClick={() => handleToggleStatus(u, 'Inactive')}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 transition"
                            title="Disable User"
                          >
                            <Lock className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(u, 'Active')}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 transition"
                            title="Activate User"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit User Account Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                {editingUser ? 'Edit User Credentials' : 'Create User Account'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">User ID *</label>
                <input
                  type="text"
                  required
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Username *</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. kishor.j"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Link to Employee</label>
                <select
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                >
                  {employees.map((e) => (
                    <option key={e.employee_id} value={e.employee_id}>
                      {e.employee_name} ({e.employee_code} - {e.department})
                    </option>
                  ))}
                </select>
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Temporary Password</label>
                  <input
                    type="text"
                    required
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    User will be forced to change password on first login.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Assigned Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Employee">Employee</option>
                    <option value="HR">HR</option>
                    <option value="Manager">Manager</option>
                    <option value="Accounts">Accounts</option>
                    <option value="Admin">Admin</option>
                    <option value="Super Admin">Super Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Account Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as AccountStatus)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Blocked">Blocked</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={forcePasswordChange}
                    onChange={(e) => setForcePasswordChange(e.target.checked)}
                    className="rounded accent-indigo-600"
                  />
                  <span>Force Password Change on Next Login</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow"
                >
                  {editingUser ? 'Save Updates' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Reset Password Modal */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-indigo-400" />
              Reset Password: {resetModalUser.username}
            </h3>
            <p className="text-xs text-slate-300">
              Set a temporary password. The user will be required to change it upon next login.
            </p>

            <div>
              <label className="block text-slate-400 text-xs mb-1">New Temporary Password</label>
              <input
                type="text"
                value={newAdminResetPass}
                onChange={(e) => setNewAdminResetPass(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setResetModalUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteResetPassword}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
