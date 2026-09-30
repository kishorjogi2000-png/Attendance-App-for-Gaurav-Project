import React, { useState } from 'react';
import {
  Sliders,
  Building2,
  Clock,
  Camera,
  Volume2,
  ShieldAlert,
  Key,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
} from 'lucide-react';
import { SystemSettings } from '../../types';
import { db } from '../../services/db';

export const SettingsView: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>(() => db.getSettings());
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    db.updateSettings(settings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleReset = () => {
    if (confirm('Reset system data to initial factory demo seed? This clears local test edits.')) {
      db.resetToSeed();
      setSettings(db.getSettings());
      alert('System successfully reset to default factory state.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-400" />
            System Administration & Policy Settings
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure company identity, global geofence rules, biometric thresholds, dynamic text-to-speech voice greetings, and external API gateways.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>System configuration successfully updated and saved to persistent store.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Company Identity */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <h2 className="font-semibold text-sm text-white">Company Identity & Organization</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Company Name *</label>
              <input
                type="text"
                required
                value={settings.company.company_name}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    company: { ...settings.company, company_name: e.target.value },
                  })
                }
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Headquarters Address</label>
              <input
                type="text"
                value={settings.company.address}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    company: { ...settings.company, address: e.target.value },
                  })
                }
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Official Contact</label>
              <input
                type="text"
                value={settings.company.contact}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    company: { ...settings.company, contact: e.target.value },
                  })
                }
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Global Attendance & Geofence Rules */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Clock className="w-4 h-4 text-emerald-400" />
            <h2 className="font-semibold text-sm text-white">Global Attendance & Geofence Rules</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Default GPS Radius (Meters)</label>
              <input
                type="number"
                min="10"
                max="2000"
                value={settings.attendance_rules.allowed_gps_radius_meters}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    attendance_rules: {
                      ...settings.attendance_rules,
                      allowed_gps_radius_meters: parseInt(e.target.value) || 100,
                    },
                  })
                }
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Late Arrival After</label>
              <input
                type="time"
                value={settings.attendance_rules.late_after_time}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    attendance_rules: {
                      ...settings.attendance_rules,
                      late_after_time: e.target.value,
                    },
                  })
                }
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Grace Period (Minutes)</label>
              <input
                type="number"
                min="0"
                max="60"
                value={settings.attendance_rules.grace_period_mins}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    attendance_rules: {
                      ...settings.attendance_rules,
                      grace_period_mins: parseInt(e.target.value) || 15,
                    },
                  })
                }
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.attendance_rules.allow_offline_attendance}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      attendance_rules: {
                        ...settings.attendance_rules,
                        allow_offline_attendance: e.target.checked,
                      },
                    })
                  }
                  className="rounded accent-indigo-600"
                />
                <span className="text-slate-300">Allow Offline Attendance</span>
              </label>
            </div>
          </div>
        </div>

        {/* Biometrics & Anti-Spoof Liveness Rules */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Camera className="w-4 h-4 text-purple-400" />
            <h2 className="font-semibold text-sm text-white">Face Recognition & Anti-Spoof Liveness</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Match Confidence Threshold (%)</label>
              <input
                type="number"
                min="50"
                max="99"
                value={settings.face_recognition.confidence_threshold}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    face_recognition: {
                      ...settings.face_recognition,
                      confidence_threshold: parseInt(e.target.value) || 85,
                    },
                  })
                }
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Anti-Spoofing Strictness</label>
              <select
                value={settings.face_recognition.anti_spoofing_level}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    face_recognition: {
                      ...settings.face_recognition,
                      anti_spoofing_level: e.target.value as any,
                    },
                  })
                }
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Strict">Strict (Blink & Micro-movement required)</option>
                <option value="Standard">Standard (Skin variance only)</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.face_recognition.liveness_detection_required}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      face_recognition: {
                        ...settings.face_recognition,
                        liveness_detection_required: e.target.checked,
                      },
                    })
                  }
                  className="rounded accent-indigo-600"
                />
                <span className="text-slate-300">Mandatory Liveness Prompt</span>
              </label>
            </div>
          </div>
        </div>

        {/* Dynamic Voice Greeting (Section 12) */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Volume2 className="w-4 h-4 text-cyan-400" />
            <h2 className="font-semibold text-sm text-white">Dynamic Voice Greeting (Android Text-to-Speech)</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Voice Greeting Status</label>
              <select
                value={settings.voice_greeting.enabled ? 'ON' : 'OFF'}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    voice_greeting: {
                      ...settings.voice_greeting,
                      enabled: e.target.value === 'ON',
                    },
                  })
                }
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="ON">ON (Play greeting on check-in)</option>
                <option value="OFF">OFF (Silent check-in)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Voice Language</label>
              <select
                value={settings.voice_greeting.language}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    voice_greeting: {
                      ...settings.voice_greeting,
                      language: e.target.value as any,
                    },
                  })
                }
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="English">English ("Good Morning Kishor, Welcome to D Office")</option>
                <option value="Hindi">Hindi ("शुभ प्रभात किशोर, डी ऑफिस में आपका स्वागत है")</option>
                <option value="Hinglish">Hinglish ("Good Morning Kishor! Welcome to D Office")</option>
              </select>
            </div>
          </div>
        </div>

        {/* API Configuration Panel (Section 45) */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              <h2 className="font-semibold text-sm text-white">External Integration Gateways</h2>
            </div>
            <span className="text-[10px] text-slate-400">Environment variables & server-side proxy routes</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Google Sheets API */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">Google Sheets API (v4)</span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                  Configured
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Service Account credential for bi-directional sheet row synchronizations.
              </p>
              <div className="font-mono text-[10px] text-slate-500 bg-slate-950 p-2 rounded border border-slate-800 truncate">
                Client: {settings.integrations.google_sheets_api.client_email}
              </div>
            </div>

            {/* Google Maps / Location API */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">Google Maps Platform</span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                  Configured
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Geocoding, reverse geocoding, and Haversine distance computations.
              </p>
              <div className="font-mono text-[10px] text-slate-500 bg-slate-950 p-2 rounded border border-slate-800 truncate">
                Key: AIzaSyB_MAPS_GEOCODE_RESTRICTED (Backend Proxy)
              </div>
            </div>

            {/* Face Recognition SDK */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">Biometric Vision Engine</span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                  Built-in Active
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Real-time spatial & frequency facial template extraction with liveness detection.
              </p>
              <div className="font-mono text-[10px] text-slate-500 bg-slate-950 p-2 rounded border border-slate-800 truncate">
                Engine: Canvas HTML5 Vision Rec. 601 Luma + Anti-Spoof
              </div>
            </div>

            {/* Firebase Cloud Messaging */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">Push Notification Gateway (FCM)</span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                  Configured
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Automated push triggers for attendance confirmations, late arrivals, and approvals.
              </p>
              <div className="font-mono text-[10px] text-slate-500 bg-slate-950 p-2 rounded border border-slate-800 truncate">
                Project: {settings.integrations.fcm.sender_id}
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-2.5">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition"
          >
            <Save className="w-4 h-4" />
            <span>Save System Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
