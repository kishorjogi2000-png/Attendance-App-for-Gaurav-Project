import React, { useState } from 'react';
import {
  Clock,
  Plus,
  Search,
  Filter,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MapPin,
  ShieldAlert,
  FileSpreadsheet,
  Calendar,
  X,
  Camera,
} from 'lucide-react';
import { AttendanceMode, AttendanceRecord, AttendanceStatus } from '../../types';
import { db } from '../../services/db';

export const AttendanceView: React.FC = () => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => db.getAttendance());
  const employees = db.getEmployees();
  const locations = db.getLocations();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedMode, setSelectedMode] = useState('All');
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // Manual Attendance Modal
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualEmpId, setManualEmpId] = useState(employees[0]?.employee_id || '');
  const [manualLocationId, setManualLocationId] = useState(locations[0]?.location_id || '');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualTime, setManualTime] = useState('09:30:00');
  const [manualStatus, setManualStatus] = useState<AttendanceStatus>('Present');
  const [manualRemarks, setManualRemarks] = useState('Manual regularization by HR Administrator');

  const refresh = () => setAttendance([...db.getAttendance()]);

  const handleExportCSV = () => {
    const headers = [
      'Attendance ID',
      'Employee Code/ID',
      'Employee Name',
      'Date',
      'Check In',
      'Check Out',
      'Location',
      'Distance (m)',
      'Mode',
      'Face Score (%)',
      'Status',
      'Suspicious Flag',
      'Remarks',
    ];

    const rows = filtered.map((a) => [
      a.attendance_id,
      a.employee_id,
      a.employee_name,
      a.date,
      a.check_in_time,
      a.check_out_time || '',
      a.location_name,
      a.distance_from_location,
      a.attendance_mode,
      a.face_confidence || '',
      a.status,
      a.is_suspicious ? `YES: ${a.suspicious_reason || ''}` : 'NO',
      a.remarks || '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Workforce_Attendance_${selectedDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateManualAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((e) => e.employee_id === manualEmpId);
    const loc = locations.find((l) => l.location_id === manualLocationId);
    if (!emp || !loc) return;

    const record: AttendanceRecord = {
      attendance_id: `ATT-MAN-${Date.now().toString().slice(-6)}`,
      employee_id: emp.employee_id,
      employee_name: emp.employee_name,
      date: manualDate,
      check_in_time: manualTime,
      location_id: loc.location_id,
      location_name: loc.location_name,
      latitude: loc.latitude,
      longitude: loc.longitude,
      distance_from_location: 0,
      attendance_mode: 'Manual',
      QR_verified: false,
      GPS_verified: true,
      face_verified: false,
      face_confidence: 100,
      device_id: 'HR-Admin-Console',
      status: manualStatus,
      remarks: manualRemarks,
      created_at: new Date().toISOString(),
    };

    db.addAttendance(record, 'HR Admin');
    setIsManualModalOpen(false);
    refresh();
  };

  const filtered = attendance.filter((a) => {
    const matchSearch =
      a.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.location_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDate = !selectedDate || a.date === selectedDate;
    const matchStatus = selectedStatus === 'All' || a.status === selectedStatus;
    const matchLoc = selectedLocation === 'All' || a.location_id === selectedLocation;
    const matchMode = selectedMode === 'All' || a.attendance_mode === selectedMode;
    return matchSearch && matchDate && matchStatus && matchLoc && matchMode;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            Attendance Management & Real-Time Logs
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time biometric and GPS logs. Filter by office site, verification mode, or export to CSV / Google Sheets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            <span>Manual Entry</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search employee, ID, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="All">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Late">Late</option>
            <option value="Half Day">Half Day</option>
            <option value="Rejected">Rejected</option>
            <option value="Work From Home">Work From Home</option>
            <option value="Manual">Manual</option>
          </select>

          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="All">All Locations</option>
            {locations.map((loc) => (
              <option key={loc.location_id} value={loc.location_id}>
                {loc.location_name}
              </option>
            ))}
          </select>

          <select
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="All">All Modes</option>
            <option value="QR + GPS + Face">QR + GPS + Face</option>
            <option value="GPS + Face">GPS + Face</option>
            <option value="Admin/Office Kiosk">Admin/Office Kiosk</option>
            <option value="Manual">Manual</option>
          </select>

          {selectedDate && (
            <button
              onClick={() => setSelectedDate('')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium px-1"
            >
              Clear Date
            </button>
          )}
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400">
              <tr>
                <th className="py-3 px-4 font-semibold">Employee</th>
                <th className="py-3 px-4 font-semibold">Punch In</th>
                <th className="py-3 px-4 font-semibold">Punch Out</th>
                <th className="py-3 px-4 font-semibold">Location</th>
                <th className="py-3 px-4 font-semibold">Distance</th>
                <th className="py-3 px-4 font-semibold">Mode</th>
                <th className="py-3 px-4 font-semibold">Verification Gates</th>
                <th className="py-3 px-4 font-semibold">Face Score</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Remarks / Flag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((att) => (
                <tr
                  key={att.attendance_id}
                  className={`hover:bg-slate-900/60 transition ${att.is_suspicious ? 'bg-rose-950/15' : ''}`}
                >
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-200 text-sm">{att.employee_name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{att.employee_id} • {att.date}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="font-mono font-medium text-emerald-400">{att.check_in_time}</div>
                        <div className="text-[9px] text-slate-500 truncate max-w-[100px]">{att.punch_in_location_name || att.location_name}</div>
                      </div>
                      {att.punch_in_photo && (
                        <button
                          type="button"
                          onClick={() => setPreviewPhoto(att.punch_in_photo!)}
                          title="View Stamped Punch In Photo"
                          className="w-7 h-7 rounded-lg overflow-hidden border border-emerald-500/50 hover:scale-110 transition shrink-0 cursor-pointer shadow-sm"
                        >
                          <img src={att.punch_in_photo} alt="Punch In" className="w-full h-full object-cover" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div>
                        <div className={`font-mono font-medium ${att.check_out_time ? 'text-amber-400' : 'text-slate-500'}`}>
                          {att.check_out_time || '--:--'}
                        </div>
                        <div className="text-[9px] text-slate-500 truncate max-w-[100px]">
                          {att.check_out_time ? (att.punch_out_location_name || att.location_name) : 'Shift active'}
                        </div>
                      </div>
                      {att.punch_out_photo && (
                        <button
                          type="button"
                          onClick={() => setPreviewPhoto(att.punch_out_photo!)}
                          title="View Stamped Punch Out Photo"
                          className="w-7 h-7 rounded-lg overflow-hidden border border-amber-500/50 hover:scale-110 transition shrink-0 cursor-pointer shadow-sm"
                        >
                          <img src={att.punch_out_photo} alt="Punch Out" className="w-full h-full object-cover" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-slate-200 font-medium flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>{att.location_name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`font-semibold ${
                        att.distance_from_location > 150 ? 'text-rose-400 font-bold' : 'text-slate-300'
                      }`}
                    >
                      {att.distance_from_location}m
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 text-[10px] border border-slate-800">
                      {att.attendance_mode}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span
                        title="GPS Verification"
                        className={`px-1.5 py-0.5 rounded font-bold ${
                          att.GPS_verified ? 'bg-emerald-950/60 text-emerald-300' : 'bg-rose-950/60 text-rose-300'
                        }`}
                      >
                        GPS
                      </span>
                      <span
                        title="QR Verification"
                        className={`px-1.5 py-0.5 rounded font-bold ${
                          att.QR_verified ? 'bg-indigo-950/60 text-indigo-300' : 'bg-slate-900 text-slate-500'
                        }`}
                      >
                        QR
                      </span>
                      <span
                        title="Face Verification"
                        className={`px-1.5 py-0.5 rounded font-bold ${
                          att.face_verified ? 'bg-purple-950/60 text-purple-300' : 'bg-slate-900 text-slate-500'
                        }`}
                      >
                        Face
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold">
                    {att.face_verified ? (
                      <span className="text-emerald-400">{att.face_confidence}%</span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`
                        px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1
                        ${
                          att.status === 'Present'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : att.status === 'Late'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : att.status === 'Rejected'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }
                      `}
                    >
                      {att.status === 'Present' && <CheckCircle2 className="w-2.5 h-2.5" />}
                      {att.status === 'Late' && <Clock className="w-2.5 h-2.5" />}
                      {att.status === 'Rejected' && <XCircle className="w-2.5 h-2.5" />}
                      {att.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {att.is_suspicious ? (
                      <div className="flex items-center gap-1 text-[11px] font-bold text-rose-400">
                        <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                        <span title={att.suspicious_reason}>{att.suspicious_reason?.slice(0, 30)}...</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 truncate max-w-[150px] block">
                        {att.remarks || 'Standard gate check-in'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Attendance Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400" />
                Record Manual Attendance (Audit-Tracked)
              </h2>
              <button onClick={() => setIsManualModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateManualAttendance} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Select Employee *</label>
                <select
                  value={manualEmpId}
                  onChange={(e) => setManualEmpId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  {employees.map((e) => (
                    <option key={e.employee_id} value={e.employee_id}>
                      {e.employee_name} ({e.employee_code} - {e.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Work Location *</label>
                <select
                  value={manualLocationId}
                  onChange={(e) => setManualLocationId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  {locations.map((l) => (
                    <option key={l.location_id} value={l.location_id}>
                      {l.location_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Date</label>
                  <input
                    type="date"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Check-In Time</label>
                  <input
                    type="time"
                    step="1"
                    value={manualTime}
                    onChange={(e) => setManualTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Status</label>
                <select
                  value={manualStatus}
                  onChange={(e) => setManualStatus(e.target.value as AttendanceStatus)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Present">Present</option>
                  <option value="Late">Late</option>
                  <option value="Half Day">Half Day</option>
                  <option value="Work From Home">Work From Home</option>
                  <option value="On Duty">On Duty</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Audit Remarks / Justification *</label>
                <textarea
                  rows={2}
                  required
                  value={manualRemarks}
                  onChange={(e) => setManualRemarks(e.target.value)}
                  placeholder="Reason for manual regularization..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30"
                >
                  Submit & Log Audit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stamped Photo Lightbox Modal */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">Live Stamped Attendance Photo</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex flex-col items-center">
              <img
                src={previewPhoto}
                alt="Stamped Attendance"
                className="w-full rounded-2xl border border-slate-800 shadow-lg object-contain max-h-[70vh]"
              />
              <p className="text-[11px] text-slate-400 mt-3 text-center">
                Verified with GPS Geofence coordinates, employee identity, and tamper-resistant timestamp overlay.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
