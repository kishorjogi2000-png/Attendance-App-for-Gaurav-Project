import React, { useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Search,
  Check,
  X,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';
import { AdvanceRecord, AdvanceStatus, UserRole } from '../../types';
import { db } from '../../services/db';

interface AdvanceManagementViewProps {
  activeRole: UserRole;
}

export const AdvanceManagementView: React.FC<AdvanceManagementViewProps> = ({ activeRole }) => {
  const [advances, setAdvances] = useState<AdvanceRecord[]>(() => db.getAdvances());
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [activeAdv, setActiveAdv] = useState<AdvanceRecord | null>(null);
  const [actionStatus, setActionStatus] = useState<AdvanceStatus | null>(null);
  const [approvedAmount, setApprovedAmount] = useState<number>(0);

  const refresh = () => setAdvances([...db.getAdvances()]);

  const handleOpenAction = (adv: AdvanceRecord, nextStatus: AdvanceStatus) => {
    setActiveAdv(adv);
    setActionStatus(nextStatus);
    setApprovedAmount(adv.approved_amount || adv.amount);
  };

  const handleConfirmAction = () => {
    if (!activeAdv || !actionStatus) return;
    db.updateAdvanceStatus(activeAdv.advance_id, actionStatus, approvedAmount, activeRole);
    setActiveAdv(null);
    setActionStatus(null);
    refresh();
  };

  const totalDisbursed = advances
    .filter((a) => a.approval_status === 'Paid')
    .reduce((acc, curr) => acc + (curr.approved_amount || curr.amount), 0);

  const pendingAmount = advances
    .filter((a) => a.approval_status === 'Pending')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const filtered = advances.filter((a) => {
    const matchSearch =
      a.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.advance_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = selectedStatus === 'All' || a.approval_status === selectedStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-400" />
            Salary Advance & Financial Disbursement
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Accounts verification workflow: Review employee salary advances, adjust approved amounts, track disbursements, and audit payroll settlements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-400">Total Paid Out: </span>
            <span className="font-bold text-emerald-400 font-mono">₹{totalDisbursed.toLocaleString()}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-amber-950/60 border border-amber-800 text-xs text-amber-300 font-medium">
            Pending: ₹{pendingAmount.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search employee, advance ID, reason..."
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
            <option value="Paid">Paid</option>
            <option value="Settled">Settled</option>
          </select>
        </div>
      </div>

      {/* Advance List */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400">
              <tr>
                <th className="py-3 px-4 font-semibold">Employee</th>
                <th className="py-3 px-4 font-semibold">Requested Amount</th>
                <th className="py-3 px-4 font-semibold">Approved Amount</th>
                <th className="py-3 px-4 font-semibold">Reason</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Approval Status</th>
                <th className="py-3 px-4 font-semibold">Settlement</th>
                <th className="py-3 px-4 font-semibold text-right">Workflow Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((adv) => (
                <tr key={adv.advance_id} className="hover:bg-slate-900/60 transition">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-200 text-sm">{adv.employee_name}</div>
                    <div className="text-[10px] text-slate-500">{adv.department}</div>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-200">
                    ₹{adv.amount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-indigo-400">
                    ₹{(adv.approved_amount || adv.amount).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 max-w-xs text-slate-300 truncate" title={adv.reason}>
                    {adv.reason}
                  </td>
                  <td className="py-3 px-4 text-slate-400 font-mono">{adv.date}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`
                        px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1
                        ${
                          adv.approval_status === 'Paid'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : adv.approval_status === 'Approved'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : adv.approval_status === 'Settled'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }
                      `}
                    >
                      {adv.approval_status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[11px] text-slate-300">{adv.settlement_status}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {adv.approval_status === 'Pending' && (
                        <button
                          onClick={() => handleOpenAction(adv, 'Approved')}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] transition shadow"
                        >
                          Approve
                        </button>
                      )}
                      {adv.approval_status === 'Approved' && (
                        <button
                          onClick={() => handleOpenAction(adv, 'Paid')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] transition shadow"
                        >
                          Mark Paid
                        </button>
                      )}
                      {adv.approval_status === 'Paid' && (
                        <span className="text-[10px] text-slate-500">Paid on {adv.payment_date}</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Dialog */}
      {activeAdv && actionStatus && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 className="text-base font-bold text-white mb-2">
              Confirm Advance {actionStatus}: {activeAdv.employee_name}
            </h3>
            <p className="text-xs text-slate-300 mb-4">
              Requested: ₹{activeAdv.amount.toLocaleString()} for "{activeAdv.reason}".
            </p>

            {actionStatus === 'Approved' && (
              <div className="mb-4">
                <label className="block text-slate-400 text-xs mb-1 font-medium">Approved Amount (₹)</label>
                <input
                  type="number"
                  value={approvedAmount}
                  onChange={(e) => setApprovedAmount(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setActiveAdv(null);
                  setActionStatus(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition"
              >
                Confirm {actionStatus}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
