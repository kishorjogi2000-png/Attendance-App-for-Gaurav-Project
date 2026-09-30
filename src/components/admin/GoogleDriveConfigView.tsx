import React, { useState, useEffect } from 'react';
import {
  Folder,
  FolderOpen,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Plus,
  RefreshCw,
  FolderPlus,
  Image,
  FileText,
  Upload,
} from 'lucide-react';
import { db } from '../../services/db';
import {
  DRIVE_SUBFOLDERS,
  getAccessToken,
  googleSignIn,
  initializeGoogleDriveStructure,
  openGooglePicker,
} from '../../services/googleWorkspace';

export const GoogleDriveConfigView: React.FC = () => {
  const settings = db.getSettings();
  const [googleConnected, setGoogleConnected] = useState(false);
  const [rootFolderName, setRootFolderName] = useState(
    settings.google_drive.root_folder_name || 'Workforce_Attendance_System'
  );
  const [rootFolderId, setRootFolderId] = useState(settings.google_drive.root_folder_id || '');
  const [subfolders, setSubfolders] = useState<Record<string, string>>(settings.google_drive.subfolders || {});

  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    getAccessToken().then((tok) => setGoogleConnected(!!tok));
  }, []);

  const handleConnectGoogle = async () => {
    setIsLoading(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleConnected(true);
        setStatusMessage('Google Account authenticated successfully!');
      }
    } catch (err: any) {
      setLastError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitializeFolders = async () => {
    if (!googleConnected) {
      await handleConnectGoogle();
    }
    setIsLoading(true);
    setStatusMessage('Creating root folder and 8 enterprise subfolders on Google Drive...');
    try {
      const res = await initializeGoogleDriveStructure(rootFolderName);
      setRootFolderId(res.rootFolderId);
      setSubfolders(res.subfolders);

      const current = db.getSettings();
      db.updateSettings({
        ...current,
        google_drive: {
          connected: true,
          root_folder_name: rootFolderName,
          root_folder_id: res.rootFolderId,
          subfolders: res.subfolders,
        },
      });

      db.logAudit('Google Drive Initialized', res.rootFolderId, `Created folder structure for "${rootFolderName}".`);
      setStatusMessage(`Created "${rootFolderName}" and ${Object.keys(res.subfolders).length} subfolders in Google Drive!`);
    } catch (err: any) {
      setLastError(err.message || 'Error initializing Google Drive folders.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBrowseViaPicker = async () => {
    try {
      if (!googleConnected) await handleConnectGoogle();
      setIsLoading(true);
      const picked = await openGooglePicker({
        viewTitle: 'Browse Workforce Google Drive Storage',
      });
      if (picked) {
        setStatusMessage(`Selected: "${picked.name}" (ID: ${picked.id})`);
      }
    } catch (err: any) {
      setLastError(err.message || 'Error opening Google Picker');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Folder className="w-5 h-5 text-amber-400" />
            Google Drive Cloud Storage Architecture
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Secure cloud asset repository: Employee photos, face registration templates, attendance photos, leave attachments, and generated QR codes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!googleConnected ? (
            <button
              onClick={handleConnectGoogle}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs shadow flex items-center gap-2 transition"
            >
              <span>Connect Google Drive</span>
            </button>
          ) : (
            <span className="px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Google Drive Connected</span>
            </span>
          )}
        </div>
      </div>

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
          <button onClick={() => setLastError(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Main Drive Folder Box */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-amber-400" />
            <h2 className="font-semibold text-sm text-white">Drive Folder Hierarchy</h2>
          </div>
          {rootFolderId && (
            <a
              href={`https://drive.google.com/drive/folders/${rootFolderId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              <span>Open in Google Drive</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Root Storage Folder Name</label>
            <input
              type="text"
              value={rootFolderName}
              onChange={(e) => setRootFolderName(e.target.value)}
              placeholder="Workforce_Attendance_System"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Root Folder ID</label>
            <input
              type="text"
              readOnly
              value={rootFolderId || 'Uninitialized'}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 font-mono focus:outline-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleInitializeFolders}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>Initialize Drive Folder Structure</span>
          </button>

          <button
            onClick={handleBrowseViaPicker}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Browse via Google Picker</span>
          </button>
        </div>
      </div>

      {/* 8 Required Subfolders Display (Section 13) */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="font-semibold text-sm text-white flex items-center gap-2">
            <Folder className="w-4 h-4 text-amber-400" />
            <span>8 Automated Storage Subfolders (Section 13)</span>
          </h2>
          <span className="text-xs text-slate-400">Organized asset references stored in Google Sheets</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {DRIVE_SUBFOLDERS.map((subName) => {
            const folderId = subfolders[subName];
            return (
              <div
                key={subName}
                className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/80 hover:border-slate-700 transition space-y-1.5"
              >
                <div className="font-semibold text-slate-200 flex items-center gap-2">
                  <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">{subName}</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono truncate">
                  {folderId ? `ID: ${folderId.slice(0, 14)}...` : 'Pending sync'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
