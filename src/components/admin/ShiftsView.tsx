import React, { useState } from 'react';
import { Clock, Plus, Edit2, CheckCircle2, X } from 'lucide-react';
import { ShiftMaster } from '../../types';
import { db } from '../../services/db';

export const ShiftsView: React.FC = () => {
  const [shifts, setShifts] = useState<ShiftMaster[]>(() => db.getShifts());
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [shiftName, setShiftName] = useState('');
  const [startTime, setStartTime] = useState('09:30');
  const [endTime, setEndTime] = useState('18:30');
  const [gracePeriod, setGracePeriod] = useState(15);
  const [lateThreshold, setLateThreshold] = useState(30);
  const [earlyExit, setEarlyExit] = useState(15);

  const refresh = () => setShifts([...db.getShifts()]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftName.trim()) return;

    const newShift: ShiftMaster = {
      shift_id: `SHF-${Date.now().toString().slice(-4)}`,
      shift_name: shiftName,
      start_time: startTime,
      end_time: endTime,
      grace_period_mins: gracePeriod,
      late_threshold_mins: lateThreshold,
      early_exit_mins: earlyExit,
      status: 'Active',
    };

    db.addShift(newShift);
    setIsModalOpen(false);
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            Shift Master & Work Schedule Policies
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Define corporate, plant, and site duty shifts with grace periods and automated late arrival thresholds.
          </p>
        </div>

        <button
          onClick={() => {
            setShiftName('');
            setIsModalOpen(true);
          }}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Create Shift</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {shifts.map((shift) => (
          <div
            key={shift.shift_id}
            className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30">
                  {shift.shift_id}
                </span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                  Active
                </span>
              </div>

              <h3 className="font-bold text-base text-white mt-1">{shift.shift_name}</h3>

              <div className="mt-3 p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Shift Timings</span>
                  <span className="font-mono font-bold text-slate-200">
                    {shift.start_time} - {shift.end_time}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Grace Period</span>
                  <span className="font-semibold text-emerald-400">{shift.grace_period_mins} mins</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Late Threshold</span>
                  <span className="font-semibold text-amber-400">{shift.late_threshold_mins} mins</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Early Exit Rule</span>
                  <span className="text-slate-300">{shift.early_exit_mins} mins grace</span>
                </div>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-800/80 text-[11px] text-slate-500">
              Assigned across head office & field units
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400" />
                Configure Work Shift
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Shift Name *</label>
                <input
                  type="text"
                  required
                  value={shiftName}
                  onChange={(e) => setShiftName(e.target.value)}
                  placeholder="e.g. Afternoon Operations Shift"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Start Time *</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">End Time *</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Grace (Min)</label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={gracePeriod}
                    onChange={(e) => setGracePeriod(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-white text-center"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Late (Min)</label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={lateThreshold}
                    onChange={(e) => setLateThreshold(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-white text-center"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Early Exit</label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={earlyExit}
                    onChange={(e) => setEarlyExit(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-white text-center"
                  />
                </div>
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
                  Save Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
