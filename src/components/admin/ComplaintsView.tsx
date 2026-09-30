import React, { useState } from 'react';
import {
  AlertCircle,
  ShieldAlert,
  Search,
  CheckCircle2,
  Clock,
  Eye,
  Lock,
  MessageSquare,
  X,
} from 'lucide-react';
import { ComplaintPriority, ComplaintRecord, ComplaintStatus, UserRole } from '../../types';
import { db } from '../../services/db';

interface ComplaintsViewProps {
  activeRole: UserRole;
}

export const ComplaintsView: React.FC<ComplaintsViewProps> = ({ activeRole }) => {
  const [complaints, setComplaints] = useState<ComplaintRecord[]>(() => db.getComplaints());
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [activeComplaint, setActiveComplaint] = useState<ComplaintRecord | null>(null);
  const [resolutionText, setResolutionText] = useState<string>('');
  const [newStatus, setNewStatus] = useState<ComplaintStatus>('In Progress');

  const refresh = () => setComplaints([...db.getComplaints()]);

  // HR / Super Admin role authorization check for confidential grievances
  const canViewConfidential = activeRole === 'Super Admin' || activeRole === 'Admin' || activeRole === 'HR';

  const handleOpenResolve = (comp: ComplaintRecord) => {
    setActiveComplaint(comp);
    setNewStatus(comp.status === 'Open' ? 'In Progress' : 'Resolved');
    setResolutionText(comp.resolution || '');
  };

  const handleSaveResolution = () => {
    if (!activeComplaint) return;
    db.updateComplaintStatus(activeComplaint.complaint_id, newStatus, resolutionText, activeRole);
    setActiveComplaint(null);
    refresh();
  };

  const filtered = complaints.filter((c) => {
    const matchSearch =
      c.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.complaint_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = selectedStatus === 'All' || c.status === selectedStatus;
    const matchCat = selectedCategory === 'All' || c.category === selectedCategory;
    return matchSearch && matchStatus && matchCat;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-indigo-400" />
            Workforce Grievance & Complaint Resolution
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Confidential ticketing system for safety hazards, workplace concerns, salary disputes, and HR disputes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-orange-950/60 border border-orange-800 text-orange-300">
            {complaints.filter((c) => c.status === 'Open' || c.status === 'In Progress').length} Active Issues
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search grievance subject, employee..."
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
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="All">All Categories</option>
            <option value="HR">HR</option>
            <option value="Salary">Salary</option>
            <option value="Workplace">Workplace</option>
            <option value="Safety">Safety</option>
            <option value="IT">IT</option>
            <option value="Management">Management</option>
          </select>
        </div>
      </div>

      {/* Complaints Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((comp) => {
          const isMasked = comp.confidential && !canViewConfidential;

          return (
            <div
              key={comp.complaint_id}
              className={`bg-slate-950/80 border rounded-2xl p-5 shadow-lg flex flex-col justify-between transition ${
                comp.priority === 'Urgent'
                  ? 'border-rose-800/80 bg-rose-950/10'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {comp.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        comp.priority === 'Urgent'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : comp.priority === 'High'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {comp.priority}
                    </span>

                    {comp.confidential && (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800">
                        <Lock className="w-2.5 h-2.5" /> Confidential
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] font-mono text-slate-500">{comp.created_date}</span>
                </div>

                <h3 className="font-bold text-sm text-white mt-1">
                  {isMasked ? '•••••••• [Confidential Grievance Restricted]' : comp.subject}
                </h3>

                <p className="text-xs text-slate-400 mt-2 line-clamp-3">
                  {isMasked
                    ? 'This grievance is marked confidential by the employee and can only be inspected by authorized HR and Super Admin staff.'
                    : comp.description}
                </p>

                {comp.resolution && !isMasked && (
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                    <div className="font-semibold text-slate-300 text-[11px] mb-0.5">Resolution Update:</div>
                    <p className="text-slate-400 text-[11px]">{comp.resolution}</p>
                  </div>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div className="text-xs">
                  <div className="text-slate-400">
                    Raised by: <strong className="text-slate-200">{isMasked ? 'Protected' : comp.employee_name}</strong>
                  </div>
                  <div className="text-[10px] text-slate-500">Assigned: {comp.assigned_to || 'Pending Triage'}</div>
                </div>

                {!isMasked ? (
                  <button
                    onClick={() => handleOpenResolve(comp)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition"
                  >
                    Update Ticket
                  </button>
                ) : (
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> HR Restricted
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Resolution Modal */}
      {activeComplaint && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 className="text-base font-bold text-white mb-2">Update Grievance: {activeComplaint.complaint_id}</h3>
            <p className="text-xs text-slate-300 mb-4">{activeComplaint.subject}</p>

            <div className="space-y-3 mb-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as ComplaintStatus)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Open">Open</option>
                  <option value="Assigned">Assigned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Resolution Notes / Action Taken</label>
                <textarea
                  rows={3}
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  placeholder="Detail investigation, maintenance action, or meeting notes..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setActiveComplaint(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveResolution}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow"
              >
                Save Updates
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
