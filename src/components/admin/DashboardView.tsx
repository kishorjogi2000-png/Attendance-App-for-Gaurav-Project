import React from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  CalendarCheck,
  CreditCard,
  AlertCircle,
  TrendingUp,
  MapPin,
  QrCode,
  ShieldAlert,
  ArrowUpRight,
  Database,
  Building2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { AdminTab } from '../layout/AdminLayout';
import { db } from '../../services/db';

interface DashboardViewProps {
  onNavigate: (tab: AdminTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const employees = db.getEmployees();
  const attendance = db.getAttendance();
  const leaves = db.getLeaves();
  const advances = db.getAdvances();
  const complaints = db.getComplaints();
  const locations = db.getLocations();
  const departments = db.getDepartments();

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.filter((a) => a.date === todayStr);

  const presentCount = todayAttendance.filter((a) => a.status === 'Present').length;
  const lateCount = todayAttendance.filter((a) => a.status === 'Late').length;
  const onLeaveCount = leaves.filter(
    (l) => l.status === 'Approved' && l.from_date <= todayStr && l.to_date >= todayStr
  ).length;
  const absentCount = Math.max(0, employees.length - (presentCount + lateCount + onLeaveCount));

  const pendingLeaves = leaves.filter((l) => l.status === 'Pending').length;
  const pendingAdvances = advances.filter((a) => a.approval_status === 'Pending').length;
  const openComplaints = complaints.filter((c) => c.status === 'Open' || c.status === 'In Progress').length;
  const suspiciousCount = todayAttendance.filter((a) => a.is_suspicious).length;

  // Attendance Modes distribution
  const modeCounts = {
    'QR + GPS + Face': todayAttendance.filter((a) => a.attendance_mode === 'QR + GPS + Face').length,
    'GPS + Face': todayAttendance.filter((a) => a.attendance_mode === 'GPS + Face').length,
    'Admin/Office Kiosk': todayAttendance.filter((a) => a.attendance_mode === 'Admin/Office Kiosk').length,
    'Manual': todayAttendance.filter((a) => a.attendance_mode === 'Manual').length,
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900/60 via-slate-800/80 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2 border border-indigo-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Geofence & Biometric Verification
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Workforce Operations Dashboard
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              Real-time monitoring across {locations.length} authorized locations. Synchronized with internal database and active Google Sheets.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigate('attendance')}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Live Attendance</span>
            </button>
            <button
              onClick={() => onNavigate('qr_management')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition flex items-center gap-1.5"
            >
              <QrCode className="w-3.5 h-3.5 text-indigo-400" />
              <span>Dynamic QR Studio</span>
            </button>
            <button
              onClick={() => onNavigate('datasources')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition flex items-center gap-1.5"
            >
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>Google Sheets Sync</span>
            </button>
          </div>
        </div>
      </div>

      {/* Suspicious / Fraud Alert Banner if any */}
      {suspiciousCount > 0 && (
        <div className="bg-rose-950/40 border border-rose-800/80 rounded-2xl p-4 flex items-start justify-between gap-3 text-rose-200">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-900/50 text-rose-400 border border-rose-700/50">
              <ShieldAlert className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="font-semibold text-sm text-white flex items-center gap-2">
                Suspicious Attendance Alert ({suspiciousCount} incident)
              </div>
              <p className="text-xs text-rose-300/90 mt-0.5">
                Attendance attempt detected outside permitted geofence radius. Automated anti-fraud protection flagged this entry.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('attendance')}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition shrink-0"
          >
            Review Logs
          </button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Staff</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">{employees.length}</div>
          <div className="text-[10px] text-slate-400 mt-1">Enrolled profiles</div>
        </div>

        <div className="bg-slate-950/70 border border-emerald-900/40 rounded-xl p-3.5 hover:border-emerald-800 transition">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-medium">Present Today</span>
            <UserCheck className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-emerald-300">{presentCount}</div>
          <div className="text-[10px] text-emerald-400/70 mt-1">Verified on site</div>
        </div>

        <div className="bg-slate-950/70 border border-amber-900/40 rounded-xl p-3.5 hover:border-amber-800 transition">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs font-medium">Late Arrivals</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-amber-300">{lateCount}</div>
          <div className="text-[10px] text-amber-400/70 mt-1">Past grace period</div>
        </div>

        <div className="bg-slate-950/70 border border-rose-900/30 rounded-xl p-3.5 hover:border-rose-800 transition">
          <div className="flex items-center justify-between text-rose-400 mb-2">
            <span className="text-xs font-medium">Absent</span>
            <UserX className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-rose-300">{absentCount}</div>
          <div className="text-[10px] text-rose-400/70 mt-1">Unrecorded</div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-blue-400 mb-2">
            <span className="text-xs font-medium">On Leave</span>
            <CalendarCheck className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-blue-300">{onLeaveCount}</div>
          <div className="text-[10px] text-blue-400/70 mt-1">Approved leaves</div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-purple-400 mb-2">
            <span className="text-xs font-medium">Pending Leave</span>
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-purple-300">{pendingLeaves}</div>
          <div className="text-[10px] text-purple-400/70 mt-1">Awaiting approval</div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-cyan-400 mb-2">
            <span className="text-xs font-medium">Pending Advance</span>
            <CreditCard className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-cyan-300">{pendingAdvances}</div>
          <div className="text-[10px] text-cyan-400/70 mt-1">Financial requests</div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-orange-400 mb-2">
            <span className="text-xs font-medium">Grievances</span>
            <AlertCircle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-orange-300">{openComplaints}</div>
          <div className="text-[10px] text-orange-400/70 mt-1">Active tickets</div>
        </div>
      </div>

      {/* Main Breakdown Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance by Location */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-400" />
              <h2 className="font-semibold text-sm text-white">Location Geofence Status</h2>
            </div>
            <button
              onClick={() => onNavigate('locations')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Manage
            </button>
          </div>

          <div className="space-y-3">
            {locations.map((loc) => {
              const count = todayAttendance.filter((a) => a.location_id === loc.location_id && a.status !== 'Rejected').length;
              const pct = employees.length > 0 ? Math.round((count / employees.length) * 100) : 0;
              return (
                <div key={loc.location_id} className="p-3 rounded-xl bg-slate-900 border border-slate-800/70">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-slate-200">{loc.location_name}</span>
                    <span className="font-bold text-indigo-400">{count} Present</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, pct * 2.5)}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
                    <span>Radius: {loc.allowed_radius_meters}m</span>
                    <span className="text-emerald-400 font-medium">{loc.office_type}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Attendance Verification Modes */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h2 className="font-semibold text-sm text-white">Verification Mode Breakdown</h2>
            </div>
            <span className="text-xs text-slate-400">Today</span>
          </div>

          <div className="space-y-4">
            {Object.entries(modeCounts).map(([mode, count]) => {
              const totalToday = Math.max(1, todayAttendance.length);
              const pct = Math.round((count / totalToday) * 100);
              return (
                <div key={mode} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{mode}</span>
                    <span className="text-slate-400 font-bold">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}

            <div className="mt-4 p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-2">
              <div className="font-semibold text-slate-200">Anti-Spoof Liveness Safeguards</div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Average Face Match Confidence</span>
                <span className="font-bold text-emerald-400">96.3%</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Dynamic Rotating QR Token TTL</span>
                <span className="font-bold text-indigo-400">60 Seconds</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Google Sheets Auto-Sync</span>
                <span className="font-bold text-cyan-400">Real-time</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <h2 className="font-semibold text-sm text-white mb-4">Quick Operations</h2>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => onNavigate('employees')}
                className="p-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/50 text-left transition group"
              >
                <Users className="w-4 h-4 text-indigo-400 mb-2 group-hover:scale-110 transition" />
                <div className="text-xs font-semibold text-white">Add Employee</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Enroll face template</div>
              </button>

              <button
                onClick={() => onNavigate('locations')}
                className="p-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/50 text-left transition group"
              >
                <MapPin className="w-4 h-4 text-emerald-400 mb-2 group-hover:scale-110 transition" />
                <div className="text-xs font-semibold text-white">Create Location</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Set GPS geofence</div>
              </button>

              <button
                onClick={() => onNavigate('qr_management')}
                className="p-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/50 text-left transition group"
              >
                <QrCode className="w-4 h-4 text-cyan-400 mb-2 group-hover:scale-110 transition" />
                <div className="text-xs font-semibold text-white">Generate QR</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Rotating token print</div>
              </button>

              <button
                onClick={() => onNavigate('bulk_import')}
                className="p-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-purple-500/50 text-left transition group"
              >
                <FileSpreadsheet className="w-4 h-4 text-purple-400 mb-2 group-hover:scale-110 transition" />
                <div className="text-xs font-semibold text-white">Bulk CSV Import</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Upload roster</div>
              </button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Database Connector</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Connected
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Internal store & Google Sheets (Attendance & HR) active.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Check-In Live Stream */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <h2 className="font-semibold text-sm text-white">Recent Attendance Logs</h2>
          </div>
          <button
            onClick={() => onNavigate('attendance')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
          >
            View Full Records & Export →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 font-semibold">Employee</th>
                <th className="pb-3 font-semibold">Time</th>
                <th className="pb-3 font-semibold">Office Location</th>
                <th className="pb-3 font-semibold">Distance</th>
                <th className="pb-3 font-semibold">Verification Mode</th>
                <th className="pb-3 font-semibold">Face Score</th>
                <th className="pb-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {attendance.slice(0, 6).map((att) => (
                <tr key={att.attendance_id} className="hover:bg-slate-900/60 transition">
                  <td className="py-3 font-medium text-slate-200">
                    <div>{att.employee_name}</div>
                    <span className="text-[10px] text-slate-500">{att.employee_id}</span>
                  </td>
                  <td className="py-3 text-slate-300 font-mono">{att.check_in_time}</td>
                  <td className="py-3 text-slate-300">{att.location_name}</td>
                  <td className="py-3 text-slate-300">
                    <span className={att.distance_from_location > 150 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                      {att.distance_from_location}m
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] border border-slate-700">
                      {att.attendance_mode}
                    </span>
                  </td>
                  <td className="py-3">
                    {att.face_verified ? (
                      <span className="text-emerald-400 font-semibold">{att.face_confidence}%</span>
                    ) : (
                      <span className="text-slate-500">N/A</span>
                    )}
                  </td>
                  <td className="py-3">
                    <span
                      className={`
                        px-2 py-0.5 rounded-md text-[10px] font-bold inline-flex items-center gap-1
                        ${
                          att.status === 'Present'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : att.status === 'Late'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }
                      `}
                    >
                      {att.status === 'Present' && <CheckCircle2 className="w-2.5 h-2.5" />}
                      {att.status === 'Late' && <Clock className="w-2.5 h-2.5" />}
                      {att.status === 'Rejected' && <XCircle className="w-2.5 h-2.5" />}
                      {att.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
