import React, { useState } from 'react';
import { History, Search, ShieldCheck, Download } from 'lucide-react';
import { AuditLogRecord } from '../../types';
import { db } from '../../services/db';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogRecord[]>(() => db.getAuditLogs());
  const [searchTerm, setSearchTerm] = useState('');

  const handleExportLogs = () => {
    const headers = ['Audit ID', 'User Name', 'Role', 'Action', 'Target Entity', 'Details', 'IP Address', 'Device', 'Timestamp'];
    const rows = filtered.map((l) => [l.id, l.user_name, l.user_role, l.action, l.target_entity, l.details, l.ip_address, l.device_info, l.timestamp]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Workforce_Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = logs.filter((l) => {
    return (
      l.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.target_entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.details.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            System Audit Trail & Compliance Log
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable log of administrative events: Location creations, biometric enrollments, leave approvals, financial payouts, and QR token generations.
          </p>
        </div>

        <button
          onClick={handleExportLogs}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span>Export Audit CSV</span>
        </button>
      </div>

      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 shadow-lg">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search audit actions, users, target IDs, or change summaries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400">
              <tr>
                <th className="py-3 px-4 font-semibold">Timestamp</th>
                <th className="py-3 px-4 font-semibold">User</th>
                <th className="py-3 px-4 font-semibold">Role</th>
                <th className="py-3 px-4 font-semibold">Action</th>
                <th className="py-3 px-4 font-semibold">Target Entity</th>
                <th className="py-3 px-4 font-semibold">Audit Details</th>
                <th className="py-3 px-4 font-semibold">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/60 transition font-sans">
                  <td className="py-3 px-4 text-slate-400 font-mono text-[10px] whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-200">{log.user_name}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-indigo-300 font-medium">
                      {log.user_role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-white">{log.action}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300 text-[10px]">{log.target_entity}</td>
                  <td className="py-3 px-4 text-slate-300 max-w-sm">{log.details}</td>
                  <td className="py-3 px-4 font-mono text-slate-400 text-[10px]">{log.ip_address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
