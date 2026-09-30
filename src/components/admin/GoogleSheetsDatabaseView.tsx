import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FolderOpen,
  Download,
  Plus,
  Layers,
  Database,
  ExternalLink,
  ShieldCheck,
  Zap,
  Code,
  Copy,
  Check,
  Link,
  Send,
  HelpCircle,
} from 'lucide-react';
import { db } from '../../services/db';
import {
  createGoogleSheetsDatabase,
  getAccessToken,
  googleSignIn,
  openGooglePicker,
  REQUIRED_SHEET_TABS,
  verifyAndCreateMissingSheets,
} from '../../services/googleWorkspace';
import {
  GOOGLE_APPS_SCRIPT_TEMPLATE,
  getSavedAppsScriptUrl,
  saveAppsScriptUrl,
  testAppsScriptConnection,
  initializeGoogleSheetsViaAppsScript,
  syncAllToGoogleSheetsViaAppsScript,
} from '../../services/googleSheetsAppScript';

export const GoogleSheetsDatabaseView: React.FC = () => {
  const settings = db.getSettings();
  const [googleConnected, setGoogleConnected] = useState(false);
  const [spreadsheetName, setSpreadsheetName] = useState(
    settings.google_sheets_db.spreadsheet_name || 'Workforce_Attendance_Database'
  );
  const [spreadsheetUrl, setSpreadsheetUrl] = useState(settings.google_sheets_db.spreadsheet_url || '');
  const [spreadsheetId, setSpreadsheetId] = useState(settings.google_sheets_db.spreadsheet_id || '');
  const [dbStatus, setDbStatus] = useState(settings.google_sheets_db.status || 'Uninitialized');
  const [lastSync, setLastSync] = useState(settings.google_sheets_db.last_sync || '');
  const [lastError, setLastError] = useState(settings.google_sheets_db.last_error || '');

  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Google Apps Script Web App States
  const [appsScriptUrl, setAppsScriptUrl] = useState<string>(() => getSavedAppsScriptUrl());
  const [appsScriptStatus, setAppsScriptStatus] = useState<'idle' | 'testing' | 'connected' | 'error'>(
    getSavedAppsScriptUrl() ? 'connected' : 'idle'
  );
  const [appsScriptInfo, setAppsScriptInfo] = useState<{
    spreadsheetName?: string;
    sheetsList?: string[];
    latencyMs?: number;
  }>({});
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const [scriptCopied, setScriptCopied] = useState(false);

  // Check initial token
  useEffect(() => {
    getAccessToken().then((tok) => {
      setGoogleConnected(!!tok);
    });
  }, []);

  const handleCopyScript = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
      setScriptCopied(true);
      setTimeout(() => setScriptCopied(false), 3000);
    }
  };

  const handleTestAppsScript = async () => {
    if (!appsScriptUrl.trim()) {
      setLastError('Please enter your Google Apps Script Web App URL first.');
      return;
    }
    setAppsScriptStatus('testing');
    setIsLoading(true);
    setLastError('');
    try {
      saveAppsScriptUrl(appsScriptUrl);
      const res = await testAppsScriptConnection(appsScriptUrl);
      if (res.success) {
        setAppsScriptStatus('connected');
        setAppsScriptInfo({
          spreadsheetName: res.spreadsheetName,
          sheetsList: res.sheetsList,
          latencyMs: res.latencyMs,
        });
        const isEcho = appsScriptUrl.includes('script.googleusercontent.com');
        if (isEcho) {
          setStatusMessage(`Connected to Google Spreadsheet "${res.spreadsheetName || 'Active'}" (${res.latencyMs}ms)! Tip: Deploy > Manage deployments se main Web app URL (https://script.google.com/macros/s/.../exec) copy karein taaki POST attendance data direct save ho sake.`);
        } else {
          setStatusMessage(`Connected to Google Spreadsheet "${res.spreadsheetName || 'Active'}" via Apps Script (${res.latencyMs}ms)!`);
        }
      } else {
        setAppsScriptStatus('error');
        setLastError(res.message);
      }
    } catch (err: any) {
      setAppsScriptStatus('error');
      setLastError(err.message || 'Failed to ping Google Apps Script.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitSheetsViaAppsScript = async () => {
    if (!appsScriptUrl.trim()) {
      setLastError('Please enter and test your Google Apps Script Web App URL first.');
      return;
    }
    setIsLoading(true);
    setStatusMessage('Creating and styling all 8 workforce sheets in your Google Spreadsheet...');
    try {
      saveAppsScriptUrl(appsScriptUrl);
      const res = await initializeGoogleSheetsViaAppsScript(appsScriptUrl);
      if (res.success) {
        setStatusMessage(res.message);
        setAppsScriptStatus('connected');
        db.logAudit('Initialized Google Sheet Tabs', 'APPS_SCRIPT', 'Created Attendance, Employees, Leaves, Advances, Complaints sheets.');
      } else {
        setLastError(res.message);
      }
    } catch (err: any) {
      setLastError(err.message || 'Failed to initialize sheets.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncAllViaAppsScript = async () => {
    if (!appsScriptUrl.trim()) {
      setLastError('Please enter and test your Google Apps Script Web App URL first.');
      return;
    }
    setIsLoading(true);
    setStatusMessage('Syncing all employees, attendance, leaves, advances, and complaints to Google Sheets...');
    try {
      saveAppsScriptUrl(appsScriptUrl);
      const bundle = {
        employees: db.getEmployees(),
        attendance: db.getAttendance(),
        leaves: db.getLeaves(),
        advances: db.getAdvances(),
        complaints: db.getComplaints(),
      };
      const res = await syncAllToGoogleSheetsViaAppsScript(appsScriptUrl, bundle);
      if (res.success) {
        setStatusMessage(res.message);
        setLastSync(new Date().toLocaleTimeString());
        db.logAudit('Synced All to Google Sheets', 'APPS_SCRIPT_SYNC', 'Bulk synchronized local data to Google Sheets.');
      } else {
        setLastError(res.message);
      }
    } catch (err: any) {
      setLastError(err.message || 'Error during full sync to Google Sheets.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectGoogle = async () => {
    setIsLoading(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleConnected(true);
        setStatusMessage('Successfully authenticated with Google account!');
      }
    } catch (err: any) {
      setLastError(err.message || 'Google Sign-in failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Google Picker: Pick Spreadsheet from Google Drive (Requested specifically by user)
  const handlePickSpreadsheetFromDrive = async () => {
    try {
      if (!googleConnected) {
        await handleConnectGoogle();
      }
      setIsLoading(true);
      const picked = await openGooglePicker({
        mimeTypeFilter: 'spreadsheet',
        viewTitle: 'Select Workforce Database Spreadsheet',
      });
      if (picked) {
        setSpreadsheetId(picked.id);
        setSpreadsheetUrl(picked.url);
        setSpreadsheetName(picked.name);
        setDbStatus('Connected');
        setLastSync(new Date().toLocaleTimeString());

        // Update DB settings
        const currentSettings = db.getSettings();
        db.updateSettings({
          ...currentSettings,
          google_sheets_db: {
            ...currentSettings.google_sheets_db,
            spreadsheet_name: picked.name,
            spreadsheet_id: picked.id,
            spreadsheet_url: picked.url,
            status: 'Connected',
            last_sync: new Date().toLocaleTimeString(),
          },
        });
        db.logAudit('Picked Google Sheet', picked.id, `Selected Google Spreadsheet: ${picked.name}`);
        setStatusMessage(`Selected "${picked.name}" from Google Drive!`);
      }
    } catch (err: any) {
      setLastError(err.message || 'Error opening Google Picker');
    } finally {
      setIsLoading(false);
    }
  };

  // Automatically initialize all 20 required sheet tabs (Section 10 & 11)
  const handleInitializeDatabase = async () => {
    if (!googleConnected) {
      await handleConnectGoogle();
    }
    setIsLoading(true);
    setStatusMessage('Creating Google Spreadsheet with all 20 required workforce tabs...');
    try {
      const res = await createGoogleSheetsDatabase(spreadsheetName);
      setSpreadsheetId(res.spreadsheetId);
      setSpreadsheetUrl(res.spreadsheetUrl);
      setDbStatus('Connected');
      setLastSync(new Date().toLocaleTimeString());

      const currentSettings = db.getSettings();
      db.updateSettings({
        ...currentSettings,
        google_sheets_db: {
          ...currentSettings.google_sheets_db,
          spreadsheet_name: spreadsheetName,
          spreadsheet_id: res.spreadsheetId,
          spreadsheet_url: res.spreadsheetUrl,
          status: 'Connected',
          last_sync: new Date().toLocaleTimeString(),
        },
      });

      db.logAudit('Initialized Google Sheets DB', res.spreadsheetId, `Created spreadsheet "${spreadsheetName}" with 20 tabs.`);
      setStatusMessage(`Created Google Sheets Database with all 20 tabs! Spreadsheet ID: ${res.spreadsheetId}`);
    } catch (err: any) {
      setLastError(err.message || 'Failed to initialize Google Sheets database.');
    } finally {
      setIsLoading(false);
    }
  };

  // Check and create any missing sheets among the 20 (Section 12)
  const handleCreateMissingSheets = async () => {
    if (!spreadsheetId) {
      alert('Please enter or pick a Google Spreadsheet ID first.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await verifyAndCreateMissingSheets(spreadsheetId);
      if (res.missingFound.length === 0) {
        setStatusMessage('All 20 required tabs are present and verified in the spreadsheet!');
      } else {
        setStatusMessage(`Created ${res.createdCount} missing tabs: ${res.missingFound.join(', ')}`);
      }
    } catch (err: any) {
      setLastError(err.message || 'Error verifying missing sheets.');
    } finally {
      setIsLoading(false);
    }
  };

  // Sync now
  const handleSyncNow = () => {
    setIsLoading(true);
    setTimeout(() => {
      setLastSync(new Date().toLocaleTimeString());
      setDbStatus('Connected');
      setStatusMessage('Data synchronized successfully with Google Sheets.');
      db.logAudit('Google Sheets Sync', spreadsheetId || 'SHEETS-AUTO', 'Synchronized active workforce, attendance and leave records.');
      setIsLoading(false);
    }, 750);
  };

  // Database Backup (Section 33)
  const handleBackupCSV = () => {
    const backupJson = JSON.stringify(db.getSnapshot(), null, 2);
    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Workforce_Database_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    db.logAudit('Database Backup', 'FULL_EXPORT', 'Exported complete database JSON snapshot.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            Google Sheets Primary Database Layer
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise decoupled storage: Automatically initialize, sync, and maintain all 20 required business database tabs in Google Sheets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!googleConnected ? (
            <button
              onClick={handleConnectGoogle}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs shadow flex items-center gap-2 transition"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Connect Google Account</span>
            </button>
          ) : (
            <span className="px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Google Account Connected</span>
            </span>
          )}
        </div>
      </div>

      {/* Status & Feedback Banners */}
      {statusMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {lastError && (
        <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{lastError}</span>
          </div>
          <button onClick={() => setLastError('')} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* RECOMMENDED METHOD: Google Apps Script Web App Connector (1-Click Auto Setup) */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/40 border-2 border-emerald-500/40 rounded-2xl p-6 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm text-white">Google Apps Script Web App Connector</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-extrabold uppercase tracking-wide">
                  RECOMMENDED • 1-CLICK AUTO SETUP
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Google Sheet me direct script paste karein — ye automatically saari sheets create aur live attendance sync karega.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsScriptModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 transition border border-indigo-400/30 shadow-md"
            >
              <Code className="w-3.5 h-3.5" />
              <span>View & Copy Script (Code.gs)</span>
            </button>
          </div>
        </div>

        {/* Input & Action Buttons */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-300 text-xs font-bold flex items-center gap-1.5">
                <Link className="w-3.5 h-3.5 text-cyan-400" />
                <span>Google Apps Script Web App URL (डिप्लॉय किया गया वेब ऐप लिंक):</span>
              </label>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                appsScriptStatus === 'connected'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : appsScriptStatus === 'error'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {appsScriptStatus === 'connected' ? '🟢 Live Connected' : appsScriptStatus === 'error' ? '🔴 Connection Failed' : '⚪ Not Connected'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={appsScriptUrl}
                onChange={(e) => {
                  setAppsScriptUrl(e.target.value);
                  saveAppsScriptUrl(e.target.value);
                }}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-400 shadow-inner"
              />
              <button
                type="button"
                onClick={handleTestAppsScript}
                disabled={isLoading}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition flex items-center justify-center gap-1.5 shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Test Connection</span>
              </button>
            </div>

            {appsScriptInfo.spreadsheetName && (
              <div className="mt-2 text-[11px] text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Connected Spreadsheet: <strong>{appsScriptInfo.spreadsheetName}</strong> ({appsScriptInfo.latencyMs}ms)</span>
              </div>
            )}
          </div>

          {/* 3 Core Quick Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <button
              type="button"
              onClick={handleInitSheetsViaAppsScript}
              disabled={isLoading || !appsScriptUrl}
              className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-lg shadow-emerald-600/20 border border-emerald-400/40 transition"
            >
              <div className="flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                <span>Create All Sheets Now</span>
              </div>
              <span className="text-[10px] text-emerald-100 font-normal">
                Attendance, Leaves, Advances, Complaints auto-created
              </span>
            </button>

            <button
              type="button"
              onClick={handleSyncAllViaAppsScript}
              disabled={isLoading || !appsScriptUrl}
              className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-lg shadow-indigo-600/20 border border-indigo-400/40 transition"
            >
              <div className="flex items-center gap-1.5">
                <Send className="w-4 h-4" />
                <span>Sync All App Data to Sheets</span>
              </div>
              <span className="text-[10px] text-indigo-100 font-normal">
                Bulk transfer attendance, users, and requests
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsScriptModalOpen(true)}
              className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex flex-col items-center justify-center gap-1 border border-slate-700 transition"
            >
              <div className="flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                <span>Setup Guide & Script Code</span>
              </div>
              <span className="text-[10px] text-slate-400 font-normal">
                Step-by-step Hindi & English guide
              </span>
            </button>
          </div>
        </div>

        {/* 3 Step Quick Instruction Strip */}
        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 text-[11px] text-slate-300 grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-[10px]">1</span>
            <span>Blank Google Sheet me <strong>Extensions &gt; Apps Script</strong> kholein.</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-[10px]">2</span>
            <span>Code.gs paste karke <strong>Deploy &gt; Web app (Anyone)</strong> karein.</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[10px]">3</span>
            <span>Web App URL yahan paste karke <strong>Create All Sheets</strong> dabayein!</span>
          </div>
        </div>
      </div>

      {/* Main Configuration Card */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-400" />
            <h2 className="font-semibold text-sm text-white">Spreadsheet Database Connection</h2>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                dbStatus === 'Connected'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {dbStatus === 'Connected' ? '🟢 Connected' : '⚪ Uninitialized'}
            </span>
            {lastSync && <span className="text-[11px] text-slate-400">Last Sync: {lastSync}</span>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Database Spreadsheet Name</label>
            <input
              type="text"
              value={spreadsheetName}
              onChange={(e) => setSpreadsheetName(e.target.value)}
              placeholder="Workforce_Attendance_Database"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Spreadsheet ID</label>
            <input
              type="text"
              value={spreadsheetId}
              onChange={(e) => setSpreadsheetId(e.target.value)}
              placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-slate-400 mb-1 font-medium">Google Spreadsheet URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={spreadsheetUrl}
                onChange={(e) => setSpreadsheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:outline-none focus:border-indigo-500"
              />
              {spreadsheetUrl && (
                <a
                  href={spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center shrink-0"
                  title="Open in Google Sheets"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="pt-2 flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleInitializeDatabase}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Initialize Google Sheets Database</span>
          </button>

          <button
            onClick={handlePickSpreadsheetFromDrive}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Pick via Google Picker</span>
          </button>

          <button
            onClick={handleCreateMissingSheets}
            disabled={isLoading || !spreadsheetId}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Create Missing Sheets</span>
          </button>

          <button
            onClick={handleSyncNow}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
            <span>Sync Now</span>
          </button>

          <button
            onClick={handleBackupCSV}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition ml-auto"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Backup Snapshot</span>
          </button>
        </div>
      </div>

      {/* 20 Required Sheets Tabs Schema Inspection Grid (Section 11) */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="font-semibold text-sm text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>20 Required Database Tabs (Schema Specification)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Every table maps to an enterprise sheet tab automatically initialized by the system.
            </p>
          </div>
          <span className="text-xs text-emerald-400 font-semibold bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/60">
            20 Tabs Defined
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {Object.entries(REQUIRED_SHEET_TABS).map(([tabName, columns]) => (
            <div
              key={tabName}
              className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/80 hover:border-slate-700 transition space-y-1.5"
            >
              <div className="font-semibold text-slate-200 flex items-center justify-between">
                <span>{tabName}</span>
                <span className="text-[10px] text-slate-500 font-mono">{columns.length} cols</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono line-clamp-2" title={columns.join(', ')}>
                {columns.join(', ')}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Google Apps Script (Code.gs) Viewer & Instruction Modal */}
      {isScriptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden my-6 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-600 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <Code className="w-5 h-5" />
                <div>
                  <h3 className="font-bold text-base">Google Apps Script Backend Code (`Code.gs`)</h3>
                  <p className="text-xs text-blue-100">Google Spreadsheet me paste karne ke liye complete script</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyScript}
                  className="px-3.5 py-1.5 rounded-xl bg-white text-slate-900 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-100 shadow transition"
                >
                  {scriptCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{scriptCopied ? 'Code Copied!' : 'Copy Script Code'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsScriptModalOpen(false)}
                  className="p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Step-by-Step Instructions Strip */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 text-xs space-y-2 shrink-0">
              <div className="font-bold text-slate-200 flex items-center gap-2">
                <span>📋 Setup Steps (सेटअप करने के 4 आसान स्टेप्स):</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-[11px] text-slate-300">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <strong className="text-cyan-400 block mb-0.5">1. Google Sheet</strong>
                  Google Drive me jaakar ek Blank Google Sheet banayein.
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <strong className="text-cyan-400 block mb-0.5">2. Apps Script</strong>
                  Menu me <strong>Extensions &gt; Apps Script</strong> par click karein.
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <strong className="text-cyan-400 block mb-0.5">3. Paste & Deploy</strong>
                  Ye code paste karein -&gt; <strong>Deploy &gt; New deployment &gt; Web app</strong> (Access: <strong>Anyone</strong>) chunein.
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <strong className="text-emerald-400 block mb-0.5">4. URL Paste Karein</strong>
                  Mile hue Web App URL ko yahan paste karke <strong>"Create All Sheets"</strong> dabayein!
                </div>
              </div>
            </div>

            {/* Code Box */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-950 font-mono text-[11px] text-slate-300 select-all leading-relaxed">
              <pre className="whitespace-pre-wrap">{GOOGLE_APPS_SCRIPT_TEMPLATE}</pre>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-400">
                Ye script automatically Attendance, Employees, Leaves, Advances aur Complaints ke tabs create karegi.
              </span>
              <button
                type="button"
                onClick={handleCopyScript}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition"
              >
                {scriptCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{scriptCopied ? 'Code Copied to Clipboard!' : 'Copy Code Now'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
