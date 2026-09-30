import React, { useState } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  FileSpreadsheet,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { db } from '../../services/db';

export const ReportsView: React.FC = () => {
  const [reportType, setReportType] = useState('Daily Attendance');
  const [selectedMonth, setSelectedMonth] = useState('2026-09');
  const [isExporting, setIsExporting] = useState(false);

  const employees = db.getEmployees();
  const attendance = db.getAttendance();
  const leaves = db.getLeaves();
  const advances = db.getAdvances();
  const complaints = db.getComplaints();

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      let headers: string[] = [];
      let rows: any[][] = [];
      let filename = `Report_${reportType.replace(/\s+/g, '_')}_${selectedMonth}.csv`;

      if (reportType === 'Daily Attendance' || reportType === 'Late Report') {
        headers = ['ID', 'Employee', 'Date', 'Time', 'Location', 'Distance (m)', 'Mode', 'Status'];
        const list = reportType === 'Late Report' ? attendance.filter((a) => a.status === 'Late') : attendance;
        rows = list.map((a) => [a.attendance_id, a.employee_name, a.date, a.check_in_time, a.location_name, a.distance_from_location, a.attendance_mode, a.status]);
      } else if (reportType === 'Leave Report') {
        headers = ['Leave ID', 'Employee', 'Department', 'Type', 'From', 'To', 'Days', 'Reason', 'Status', 'Approved By'];
        rows = leaves.map((l) => [l.leave_id, l.employee_name, l.department, l.leave_type, l.from_date, l.to_date, l.days_count, l.reason, l.status, l.approved_by || '']);
      } else if (reportType === 'Advance Report') {
        headers = ['Advance ID', 'Employee', 'Department', 'Amount', 'Reason', 'Date', 'Status', 'Settlement'];
        rows = advances.map((a) => [a.advance_id, a.employee_name, a.department, a.amount, a.reason, a.date, a.approval_status, a.settlement_status]);
      } else if (reportType === 'Complaint Report') {
        headers = ['ID', 'Employee', 'Category', 'Subject', 'Priority', 'Confidential', 'Status', 'Assigned To'];
        rows = complaints.map((c) => [c.complaint_id, c.employee_name, c.category, c.subject, c.priority, c.confidential ? 'YES' : 'NO', c.status, c.assigned_to || '']);
      } else {
        headers = ['Employee Code', 'Name', 'Mobile', 'Department', 'Designation', 'Location', 'Category', 'Status'];
        rows = employees.map((e) => [e.employee_code, e.employee_name, e.mobile, e.department, e.designation, e.assigned_location, e.employee_category, e.status]);
      }

      const csvContent = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      db.logAudit('Exported Report', reportType, `Generated and exported ${reportType} CSV for month ${selectedMonth}.`);
      setIsExporting(false);
    }, 400);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            Enterprise Reports & Export Hub
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Generate audit-ready Excel and CSV reports for payroll calculation, departmental compliance, and workforce tracking.
          </p>
        </div>

        <button
          onClick={handleExport}
          disabled={isExporting}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isExporting ? 'Generating...' : 'Export Selected Report'}</span>
        </button>
      </div>

      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <h2 className="font-semibold text-sm text-white">Report Configuration</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Select Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="Daily Attendance">Daily Attendance</option>
              <option value="Monthly Attendance">Monthly Attendance Roster</option>
              <option value="Late Report">Late Arrival Summary</option>
              <option value="Leave Report">Leave & Absence Report</option>
              <option value="Advance Report">Salary Advance & Disbursement</option>
              <option value="Complaint Report">Grievance & Resolution Log</option>
              <option value="Employee Master">Employee Master Roster</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Billing / Payroll Month</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Output Format</label>
            <div className="flex gap-2">
              <span className="px-3 py-2 rounded-xl bg-slate-900 border border-indigo-500 text-indigo-300 font-semibold text-xs flex-1 text-center">
                CSV / Excel
              </span>
              <span className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs flex-1 text-center">
                Google Sheets
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
