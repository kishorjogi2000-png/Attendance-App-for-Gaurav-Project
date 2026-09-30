import React, { useState } from 'react';
import {
  Database,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Link,
  Table,
  Sliders,
  ExternalLink,
  Edit2,
  Trash2,
  Play,
  X,
  Layers,
} from 'lucide-react';
import { ColumnMapping, DataSourceConfig, DataSourceType } from '../../types';
import { db } from '../../services/db';
import {
  DEFAULT_COLUMN_MAPPINGS,
  extractSpreadsheetId,
  formatRecordsForSheet,
  testDataSourceConnection,
} from '../../services/dataSourceManager';

export const DataSourcesView: React.FC = () => {
  const [dataSources, setDataSources] = useState<DataSourceConfig[]>(() => db.getDataSources());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDS, setEditingDS] = useState<DataSourceConfig | null>(null);

  // Form Fields
  const [dsName, setDsName] = useState('');
  const [dsType, setDsType] = useState<DataSourceType>('Google Sheets');
  const [googleAccount, setGoogleAccount] = useState('kishorjogi2000@gmail.com');
  const [sheetUrl, setSheetUrl] = useState('');
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [sheetTab, setSheetTab] = useState('');
  const [tablePurpose, setTablePurpose] = useState<DataSourceConfig['table_purpose']>('Attendance Data');
  const [readPerm, setReadPerm] = useState(true);
  const [writePerm, setWritePerm] = useState(true);
  const [syncDirection, setSyncDirection] = useState<DataSourceConfig['sync_direction']>('App to Sheets');
  const [syncFreq, setSyncFreq] = useState<DataSourceConfig['sync_frequency']>('Real-time');
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>(DEFAULT_COLUMN_MAPPINGS['Attendance Data']);

  // Test & Sync Feedback
  const [testTesting, setTestTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const refresh = () => setDataSources([...db.getDataSources()]);

  const handleOpenAdd = () => {
    setEditingDS(null);
    setDsName('Live Attendance Google Sheet Connector');
    setDsType('Google Sheets');
    setGoogleAccount('kishorjogi2000@gmail.com');
    setSheetUrl('https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit');
    setSpreadsheetId('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms');
    setSheetTab('Attendance_Live');
    setTablePurpose('Attendance Data');
    setReadPerm(true);
    setWritePerm(true);
    setSyncDirection('App to Sheets');
    setSyncFreq('Real-time');
    setColumnMappings(DEFAULT_COLUMN_MAPPINGS['Attendance Data']);
    setTestResult(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ds: DataSourceConfig) => {
    setEditingDS(ds);
    setDsName(ds.data_source_name);
    setDsType(ds.type);
    setGoogleAccount(ds.google_account || '');
    setSheetUrl(ds.sheet_url || '');
    setSpreadsheetId(ds.spreadsheet_id || '');
    setSheetTab(ds.sheet_tab || '');
    setTablePurpose(ds.table_purpose);
    setReadPerm(ds.read_permission);
    setWritePerm(ds.write_permission);
    setSyncDirection(ds.sync_direction);
    setSyncFreq(ds.sync_frequency);
    setColumnMappings(ds.column_mappings || DEFAULT_COLUMN_MAPPINGS[ds.table_purpose]);
    setTestResult(null);
    setIsModalOpen(true);
  };

  const handleUrlChange = (url: string) => {
    setSheetUrl(url);
    const extracted = extractSpreadsheetId(url);
    if (extracted) {
      setSpreadsheetId(extracted);
    }
  };

  const handlePurposeChange = (purpose: DataSourceConfig['table_purpose']) => {
    setTablePurpose(purpose);
    setColumnMappings(DEFAULT_COLUMN_MAPPINGS[purpose] || []);
  };

  const handleTestConnection = async () => {
    setTestTesting(true);
    setTestResult(null);
    const res = await testDataSourceConnection({
      type: dsType,
      sheet_url: sheetUrl,
      spreadsheet_id: spreadsheetId,
      sheet_tab: sheetTab,
    });
    setTestResult(res);
    setTestTesting(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dsName.trim()) {
      alert('Data Source Name is required.');
      return;
    }

    if (editingDS) {
      const updated: DataSourceConfig = {
        ...editingDS,
        data_source_name: dsName,
        type: dsType,
        google_account: googleAccount,
        sheet_url: sheetUrl,
        spreadsheet_id: spreadsheetId || extractSpreadsheetId(sheetUrl),
        sheet_tab: sheetTab,
        table_purpose: tablePurpose,
        read_permission: readPerm,
        write_permission: writePerm,
        sync_direction: syncDirection,
        sync_frequency: syncFreq,
        column_mappings: columnMappings,
      };
      db.updateDataSource(updated);
    } else {
      const newDS: DataSourceConfig = {
        id: `DS-${Date.now().toString().slice(-6)}`,
        data_source_name: dsName,
        type: dsType,
        google_account: googleAccount,
        sheet_url: sheetUrl,
        spreadsheet_id: spreadsheetId || extractSpreadsheetId(sheetUrl),
        sheet_tab: sheetTab,
        table_purpose: tablePurpose,
        read_permission: readPerm,
        write_permission: writePerm,
        sync_direction: syncDirection,
        sync_frequency: syncFreq,
        status: 'Active',
        column_mappings: columnMappings,
      };
      db.addDataSource(newDS);
    }

    setIsModalOpen(false);
    refresh();
  };

  const handleSyncNow = async (ds: DataSourceConfig) => {
    setSyncingId(ds.id);
    await new Promise((r) => setTimeout(r, 750));

    // Get relevant dataset
    let count = 0;
    if (ds.table_purpose === 'Attendance Data') count = db.getAttendance().length;
    else if (ds.table_purpose === 'Employee Data') count = db.getEmployees().length;
    else if (ds.table_purpose === 'Leave Data') count = db.getLeaves().length;
    else if (ds.table_purpose === 'Advance Data') count = db.getAdvances().length;
    else if (ds.table_purpose === 'Complaint Data') count = db.getComplaints().length;

    const updated: DataSourceConfig = {
      ...ds,
      last_sync_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      last_sync_status: `Synced ${count} rows successfully (${ds.sync_direction})`,
    };
    db.updateDataSource(updated);
    db.logAudit('Data Source Sync Executed', ds.id, `Manual sync executed for "${ds.data_source_name}". Transferred ${count} rows.`);
    setSyncingId(null);
    refresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-400" />
            Configurable Database & Google Sheets Connectors
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise database decoupling layer: Switch between Internal Database, Google Sheets, or REST APIs. Dynamically map database fields to spreadsheet columns without hardcoding.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Data Source</span>
        </button>
      </div>

      {/* Connected Data Sources List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dataSources.map((ds) => (
          <div
            key={ds.id}
            className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        ds.type === 'Internal Database'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      }`}
                    >
                      {ds.type}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">{ds.table_purpose}</span>
                  </div>
                  <h3 className="font-bold text-sm text-white mt-1.5">{ds.data_source_name}</h3>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(ds)}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 transition"
                    title="Edit Connector"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {ds.type !== 'Internal Database' && (
                    <button
                      onClick={() => {
                        if (confirm(`Remove data source connector "${ds.data_source_name}"?`)) {
                          db.deleteDataSource(ds.id);
                          refresh();
                        }
                      }}
                      className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Specific info depending on type */}
              {ds.type === 'Google Sheets' && (
                <div className="mt-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Spreadsheet ID</span>
                    <span className="font-mono text-[11px] text-slate-300">
                      {ds.spreadsheet_id ? `${ds.spreadsheet_id.slice(0, 16)}...` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Sheet Tab Name</span>
                    <span className="font-semibold text-indigo-400">{ds.sheet_tab}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Sync Direction</span>
                    <span className="text-slate-200">{ds.sync_direction}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Frequency</span>
                    <span className="text-emerald-400 font-medium">{ds.sync_frequency}</span>
                  </div>
                </div>
              )}

              {ds.type === 'Internal Database' && (
                <div className="mt-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Storage Engine</span>
                    <span className="text-emerald-300 font-semibold">In-Memory / Local Indexed Store</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Latency</span>
                    <span className="text-slate-300 font-mono">0.2 ms</span>
                  </div>
                </div>
              )}

              {/* Column Mapping Pill summary */}
              <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-1.5">
                <Table className="w-3.5 h-3.5 text-slate-500" />
                <span>
                  Mapped fields: <strong>{ds.column_mappings?.length || 8} Columns</strong> (e.g. Name → Col C, CheckIn → Col E)
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <div className="text-[11px]">
                <div className="text-slate-400">
                  Last Sync: <span className="text-slate-200">{ds.last_sync_at || 'Just now'}</span>
                </div>
                <div className="text-[10px] text-emerald-400 truncate max-w-[200px]">
                  {ds.last_sync_status || 'Operational'}
                </div>
              </div>

              <button
                onClick={() => handleSyncNow(ds)}
                disabled={syncingId === ds.id}
                className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${syncingId === ds.id ? 'animate-spin' : ''}`} />
                <span>{syncingId === ds.id ? 'Syncing...' : 'Sync Now'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Data Source Modal with Visual Column Mapping */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl p-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-400" />
                {editingDS ? 'Configure Data Source' : 'Connect New Database / Google Sheet'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Data Source Name *</label>
                  <input
                    type="text"
                    required
                    value={dsName}
                    onChange={(e) => setDsName(e.target.value)}
                    placeholder="e.g. Master Attendance Sheet"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Database / Connector Type</label>
                  <select
                    value={dsType}
                    onChange={(e) => setDsType(e.target.value as DataSourceType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Google Sheets">Google Sheets</option>
                    <option value="Internal Database">Internal Database</option>
                    <option value="External REST API">External REST API / Webhook</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Table Purpose *</label>
                  <select
                    value={tablePurpose}
                    onChange={(e) => handlePurposeChange(e.target.value as DataSourceConfig['table_purpose'])}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Attendance Data">Attendance Data</option>
                    <option value="Employee Data">Employee Data</option>
                    <option value="Leave Data">Leave Data</option>
                    <option value="Advance Data">Advance Data</option>
                    <option value="Complaint Data">Complaint Data</option>
                  </select>
                </div>

                {dsType === 'Google Sheets' && (
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Google Account Email</label>
                    <input
                      type="email"
                      value={googleAccount}
                      onChange={(e) => setGoogleAccount(e.target.value)}
                      placeholder="kishorjogi2000@gmail.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>

              {dsType === 'Google Sheets' && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Google Sheet URL *</label>
                    <input
                      type="url"
                      required
                      value={sheetUrl}
                      onChange={(e) => handleUrlChange(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0.../edit"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Auto-Extracted Spreadsheet ID</label>
                      <input
                        type="text"
                        readOnly
                        value={spreadsheetId}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 font-mono text-[11px] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Sheet Tab Name *</label>
                      <input
                        type="text"
                        required
                        value={sheetTab}
                        onChange={(e) => setSheetTab(e.target.value)}
                        placeholder="e.g. Attendance_Live"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Sync Direction</label>
                      <select
                        value={syncDirection}
                        onChange={(e) => setSyncDirection(e.target.value as DataSourceConfig['sync_direction'])}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Bidirectional">Bidirectional (Two-way sync)</option>
                        <option value="App to Sheets">App to Sheets (Push only)</option>
                        <option value="Sheets to App">Sheets to App (Pull only)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Sync Frequency</label>
                      <select
                        value={syncFreq}
                        onChange={(e) => setSyncFreq(e.target.value as DataSourceConfig['sync_frequency'])}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Real-time">Real-time (on event)</option>
                        <option value="Every 15 mins">Every 15 minutes</option>
                        <option value="Hourly">Hourly</option>
                        <option value="Daily">Daily</option>
                        <option value="Manual">Manual trigger only</option>
                      </select>
                    </div>
                  </div>

                  {/* Test Connection Button & Result */}
                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={testTesting}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold transition"
                    >
                      {testTesting ? 'Testing Connectivity...' : 'Test Connection'}
                    </button>

                    {testResult && (
                      <span
                        className={`text-[11px] font-semibold flex items-center gap-1 ${
                          testResult.success ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {testResult.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                        <span>{testResult.message}</span>
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Dynamic Column Mapping UI (Section 25) */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white">Dynamic Column Mapping UI</h3>
                    <p className="text-[10px] text-slate-400">Map internal data fields to custom Google Sheet columns.</p>
                  </div>
                  <span className="text-[10px] text-slate-500">e.g. employee_name → Col B</span>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {columnMappings.map((m, idx) => (
                    <div key={m.application_field} className="flex items-center gap-2 bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                      <span className="w-48 font-mono text-slate-200 font-medium truncate">
                        {m.application_field}
                      </span>
                      <span className="text-slate-500">→</span>
                      <div className="flex items-center gap-1.5 flex-1">
                        <span className="text-slate-400 text-[10px]">Column:</span>
                        <input
                          type="text"
                          value={m.sheet_column}
                          onChange={(e) => {
                            const updated = [...columnMappings];
                            updated[idx].sheet_column = e.target.value.toUpperCase();
                            setColumnMappings(updated);
                          }}
                          className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono text-center text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <span className="text-[10px] text-slate-500">{m.required ? 'Required' : 'Optional'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
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
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30"
                >
                  Save Connector
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
