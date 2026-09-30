import React, { useState } from 'react';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Search,
  Check,
  X,
  MessageSquare,
} from 'lucide-react';
import { LeaveRecord, LeaveStatus, UserRole } from '../../types';
import { db } from '../../services/db';

interface LeaveManagementViewProps {
  activeRole: UserRole;
}

export const LeaveManagementView: React.FC<LeaveManagementViewProps> = ({ activeRole }) => {
  const [leaves, setLeaves] = useState<LeaveRecord[]>(() => db.getLeaves());
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Action Modal
  const [activeLeave, setActiveLeave] = useState<LeaveRecord | null>(null);
  const [actionType, setActionType] = useState<'Approved' | 'Rejected' | null>(null);
  const [remarks, setRemarks] = useState('');

  const refresh = () => setLeaves([...db.getLeaves()]);

  const handleOpenAction = (leave: LeaveRecord, type: 'Approved' | 'Rejected') => {
    setActiveLeave(leave);
    setActionType(type);
    setRemarks('');
  };

  const handleConfirmAction = () => {
    if (!activeLeave || !actionType) return;
    db.updateLeaveStatus(activeLeave.leave_id, actionType, remarks, activeRole);
    setActiveLeave(null);
    setActionType(null);
    refresh();
  };

  const filtered = leaves.filter((l) => {
    const matchSearch =
      l.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.leave_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = selectedStatus === 'All' || l.status === selectedStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-indigo-400" />
            Leave Management & Approvals
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review casual, sick, and earned leaves submitted by workforce. Authorized approval updates employee attendance calendars automatically.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-800 text-purple-300">
            {leaves.filter((l) => l.status === 'Pending').length} Pending Approvals
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search employee, leave ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Leaves List */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400">
              <tr>
                <th className="py-3 px-4 font-semibold">Employee</th>
                <th className="py-3 px-4 font-semibold">Leave Type</th>
                <th className="py-3 px-4 font-semibold">Duration</th>
                <th className="py-3 px-4 font-semibold">Days</th>
                <th className="py-3 px-4 font-semibold">Reason</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Reviewer</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((l) => (
                <tr key={l.leave_id} className="hover:bg-slate-900/60 transition">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-200 text-sm">{l.employee_name}</div>
                    <div className="text-[10px] text-slate-500">{l.department}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] border border-slate-700">
                      {l.leave_type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300 font-mono">
                    {l.from_date} <span className="text-slate-500">to</span> {l.to_date}
                  </td>
                  <td className="py-3 px-4 font-bold text-indigo-400">{l.days_count} days</td>
                  <td className="py-3 px-4 max-w-xs">
                    <p className="text-slate-300 truncate" title={l.reason}>
                      {l.reason}
                    </p>
                    {l.remarks && <p className="text-[10px] text-slate-500 italic mt-0.5">Note: {l.remarks}</p>}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`
                        px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1
                        ${
                          l.status === 'Approved'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : l.status === 'Rejected'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }
                      `}
                    >
                      {l.status === 'Approved' && <CheckCircle2 className="w-2.5 h-2.5" />}
                      {l.status === 'Rejected' && <XCircle className="w-2.5 h-2.5" />}
                      {l.status === 'Pending' && <Clock className="w-2.5 h-2.5" />}
                      {l.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[11px] text-slate-400">{l.approved_by || '-'}</td>
                  <td className="py-3 px-4 text-right">
                    {l.status === 'Pending' ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenAction(l, 'Approved')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] transition shadow"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleOpenAction(l, 'Rejected')}
                          className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/40 text-[11px] font-semibold transition"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-500">Processed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {activeLeave && actionType && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 className="text-base font-bold text-white mb-2">
              {actionType === 'Approved' ? 'Approve Leave Request' : 'Reject Leave Request'}
            </h3>
            <p className="text-xs text-slate-300 mb-4">
              {actionType === 'Approved' ? 'Confirm approval for' : 'Confirm rejection for'}{' '}
              <strong>{activeLeave.employee_name}</strong> ({activeLeave.leave_type}, {activeLeave.days_count} days).
            </p>

            <div className="mb-4">
              <label className="block text-slate-400 text-xs mb-1 font-medium">Remarks / Note (Optional)</label>
              <textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Reason or handover instructions..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setActiveLeave(null);
                  setActionType(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className={`px-5 py-2 rounded-xl text-white text-xs font-semibold shadow transition ${
                  actionType === 'Approved' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                Confirm {actionType}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
