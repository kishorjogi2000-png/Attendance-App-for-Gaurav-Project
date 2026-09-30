import React, { useState } from 'react';
import {
  BookOpen,
  Code2,
  Database,
  Smartphone,
  Server,
  Key,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Copy,
  X,
} from 'lucide-react';

interface SetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SetupGuideModal: React.FC<SetupGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeDocTab, setActiveDocTab] = useState<'deployment' | 'api' | 'sheets' | 'mobile'>('deployment');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Enterprise Deployment & API Architecture Manual
              </h2>
              <p className="text-xs text-slate-400">
                Setup guide for Android Flutter App, Node.js REST API, Google Sheets Connectors, and Face Biometrics.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveDocTab('deployment')}
            className={`flex-1 py-2 px-3 rounded-lg font-semibold transition ${
              activeDocTab === 'deployment' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            1. Deployment & Local Run
          </button>
          <button
            onClick={() => setActiveDocTab('api')}
            className={`flex-1 py-2 px-3 rounded-lg font-semibold transition ${
              activeDocTab === 'api' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            2. REST API Endpoints
          </button>
          <button
            onClick={() => setActiveDocTab('sheets')}
            className={`flex-1 py-2 px-3 rounded-lg font-semibold transition ${
              activeDocTab === 'sheets' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            3. Google Sheets Decoupling
          </button>
          <button
            onClick={() => setActiveDocTab('mobile')}
            className={`flex-1 py-2 px-3 rounded-lg font-semibold transition ${
              activeDocTab === 'mobile' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            4. Flutter Android Architecture
          </button>
        </div>

        {/* Content Tabs */}
        {activeDocTab === 'deployment' && (
          <div className="space-y-4 text-xs text-slate-300">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-400" />
                Step-by-Step Production Setup Checklist
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-slate-300 leading-relaxed">
                <li>
                  <strong>Clone & Dependencies:</strong> Run <code className="bg-slate-900 px-2 py-0.5 rounded text-indigo-300 font-mono">npm install</code> to install modern dependencies.
                </li>
                <li>
                  <strong>Start Local Server:</strong> Execute <code className="bg-slate-900 px-2 py-0.5 rounded text-indigo-300 font-mono">npm run dev</code> to boot the Vite SPA and Express backend on port 3000.
                </li>
                <li>
                  <strong>Database Initialization:</strong> On first launch, the in-memory Indexed DB pre-seeds D Office, Site 01, shifts, and enrolled staff with facial biometrics.
                </li>
                <li>
                  <strong>Create First Location:</strong> Go to <em>Location Management → Create Location</em>. Search your office address, pick the GPS center point, and set your desired geofence radius (e.g., 100 meters).
                </li>
                <li>
                  <strong>Generate Dynamic QR:</strong> Open <em>Dynamic QR Studio</em>. Select your location and choose <em>Dynamic Rotating (60s TTL)</em> for entrance kiosks or <em>Static Terminal</em> for wall posters.
                </li>
                <li>
                  <strong>Onboard Employees & Enroll Faces:</strong> Go to <em>Employee Master → Add Employee</em>. Activate the webcam to capture multiple face angle frames to extract the 64-byte biometric descriptor.
                </li>
              </ol>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <h4 className="font-bold text-white text-xs">Production Environment Variables (.env)</h4>
              <div className="font-mono text-[11px] bg-slate-900 p-3 rounded-xl border border-slate-800 text-slate-300 space-y-1">
                <div>PORT=3000</div>
                <div>DATABASE_CONNECTOR=INTERNAL_STORAGE # or POSTGRES_URL</div>
                <div>GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL=service-account@apex-attendance.iam.gserviceaccount.com</div>
                <div>GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIB..."</div>
                <div>APP_URL=https://attendance.apex-corp.in</div>
              </div>
            </div>
          </div>
        )}

        {activeDocTab === 'api' && (
          <div className="space-y-4 text-xs text-slate-300">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Code2 className="w-4 h-4 text-cyan-400" />
                Standard REST API Specification (Section 35)
              </h3>
              <div className="space-y-2">
                {[
                  { method: 'POST', path: '/api/auth/login', desc: 'Authenticate employee or administrator with JWT/session.' },
                  { method: 'GET', path: '/api/employees', desc: 'List active workforce roster with department and shift filters.' },
                  { method: 'POST', path: '/api/employees', desc: 'Onboard employee with multi-sample face template vector.' },
                  { method: 'POST', path: '/api/locations', desc: 'Create custom geofenced office/site with allowed radius in meters.' },
                  { method: 'GET', path: '/api/qr/token/:location_id', desc: 'Generate encrypted HMAC rotating dynamic QR token with TTL.' },
                  { method: 'POST', path: '/api/attendance/check-in', desc: 'Submit check-in with GPS coords, scanned QR token, and face frame.' },
                  { method: 'POST', path: '/api/leave/apply', desc: 'Submit casual, sick, or earned leave request.' },
                  { method: 'PATCH', path: '/api/leave/:id/status', desc: 'Approve or reject leave with manager audit remarks.' },
                  { method: 'POST', path: '/api/advance/request', desc: 'Request financial salary advance.' },
                  { method: 'POST', path: '/api/complaints', desc: 'Submit confidential or standard grievance ticket.' },
                  { method: 'POST', path: '/api/datasources/sync', desc: 'Trigger manual or real-time sync with Google Sheets.' },
                ].map((ep) => (
                  <div key={ep.path + ep.method} className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span
                      className={`font-mono font-bold text-[10px] px-2 py-0.5 rounded ${
                        ep.method === 'POST'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : ep.method === 'GET'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {ep.method}
                    </span>
                    <span className="font-mono text-slate-200 text-xs">{ep.path}</span>
                    <span className="text-slate-400 text-[11px] ml-auto">{ep.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeDocTab === 'sheets' && (
          <div className="space-y-4 text-xs text-slate-300">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                Decoupled Data Source Architecture (Section 2 & 24)
              </h3>
              <p className="leading-relaxed">
                The application is architected so that Google Sheets is <strong>NOT</strong> a permanent dependency.
                The admin can freely select between Internal High-Speed Database, Google Sheets, or custom REST APIs.
              </p>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="font-semibold text-white">Dynamic Column Mapping Feature:</div>
                <p className="text-slate-400">
                  Unlike brittle hardcoded integrations, the admin can visually map application fields (e.g.{' '}
                  <code className="text-indigo-300 font-mono">employee_name</code>) to any arbitrary spreadsheet column (e.g.{' '}
                  <code className="text-emerald-300 font-mono">Column B</code>).
                </p>
              </div>
            </div>
          </div>
        )}

        {activeDocTab === 'mobile' && (
          <div className="space-y-4 text-xs text-slate-300">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-purple-400" />
                Flutter Android Mobile Architecture (Section 1 & 43)
              </h3>
              <p className="leading-relaxed">
                The mobile client is designed with modern Android-first Material 3 ergonomics. Below is the Flutter/Dart structural roadmap:
              </p>
              <div className="font-mono text-[11px] bg-slate-900 p-3 rounded-xl border border-slate-800 text-slate-300 space-y-1">
                <div>lib/</div>
                <div>├── main.dart (Entry point, Firebase initialization & TTS engine)</div>
                <div>├── models/ (Attendance, Employee, Leave, Advance, Complaint)</div>
                <div>├── services/</div>
                <div>│   ├── geofence_service.dart (Haversine distance & mock location detection)</div>
                <div>│   ├── qr_scanner_service.dart (Mobile camera dynamic QR token reader)</div>
                <div>│   ├── face_liveness_service.dart (On-device ML Kit / vision anti-spoof)</div>
                <div>│   ├── voice_greeting_service.dart (Android TextToSpeech engine)</div>
                <div>│   └── offline_queue_service.dart (Encrypted SQLite cache with auto-sync)</div>
                <div>└── screens/ (HomeDashboard, CameraAttendance, Requests, Profile)</div>
              </div>
            </div>
          </div>
        )}

        <div className="border-t border-slate-800 pt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow"
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>
  );
};
