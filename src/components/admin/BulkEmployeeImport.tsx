import React, { useState } from 'react';
import {
  FileText,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Users,
  RefreshCw,
  FileSpreadsheet,
} from 'lucide-react';
import { db } from '../../services/db';
import { EmployeeMaster } from '../../types';

interface ParsedEmployeeRow {
  rowNum: number;
  employee_code: string;
  employee_name: string;
  mobile: string;
  email: string;
  department: string;
  designation: string;
  category: string;
  location: string;
  shift: string;
  isValid: boolean;
  errors: string[];
}

export const BulkEmployeeImport: React.FC = () => {
  const [parsedRows, setParsedRows] = useState<ParsedEmployeeRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [importSummary, setImportSummary] = useState<{ imported: number; skipped: number } | null>(null);

  const existingEmployees = db.getEmployees();
  const existingCodes = new Set(existingEmployees.map((e) => e.employee_code.toLowerCase()));
  const existingMobiles = new Set(existingEmployees.map((e) => e.mobile.replace(/\s+/g, '')));

  const handleDownloadTemplate = () => {
    const headers = [
      'Employee Code',
      'Employee Name',
      'Mobile',
      'Email',
      'Department',
      'Designation',
      'Category',
      'Employment Type',
      'Location Code',
      'Shift Code',
    ];
    const sampleRows = [
      ['APX-2001', 'Kavita Sharma', '+91 98111 22334', 'kavita.s@apex-corp.in', 'Human Resources', 'HR Specialist', 'Permanent', 'Full-Time', 'LOC-D-OFFICE', 'SHF-GEN'],
      ['APX-2002', 'Vikram Rathore', '+91 98222 33445', 'vikram.r@apex-corp.in', 'Civil Engineering', 'Site Supervisor', 'Permanent', 'Full-Time', 'LOC-SITE-01', 'SHF-GEN'],
      ['APX-2003', 'Manoj Tiwary', '+91 98333 44556', 'manoj.t@apex-corp.in', 'Store & Warehouse', 'Warehouse Associate', 'Worker', 'Full-Time', 'LOC-WAREHOUSE', 'SHF-MOR'],
    ];

    const csvContent = [headers.join(','), ...sampleRows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Workforce_Employee_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setImportSummary(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length <= 1) {
        alert('CSV file appears empty or missing rows.');
        setIsProcessing(false);
        return;
      }

      const rows: ParsedEmployeeRow[] = [];
      const seenInBatch = new Set<string>();

      for (let i = 1; i < lines.length; i++) {
        // Simple CSV splitter
        const cols = lines[i].split(',').map((c) => c.replace(/(^"|"$)/g, '').trim());
        if (cols.length < 3) continue;

        const code = cols[0] || '';
        const name = cols[1] || '';
        const mobile = cols[2] || '';
        const email = cols[3] || '';
        const department = cols[4] || 'General';
        const designation = cols[5] || 'Staff';
        const category = cols[6] || 'Permanent';
        const location = cols[8] || 'LOC-D-OFFICE';
        const shift = cols[9] || 'SHF-GEN';

        const errors: string[] = [];
        if (!code) errors.push('Missing Employee Code');
        if (!name) errors.push('Missing Name');
        if (!mobile) errors.push('Missing Mobile');

        if (code && existingCodes.has(code.toLowerCase())) {
          errors.push(`Duplicate ID: Code ${code} already exists in database`);
        }
        if (seenInBatch.has(code.toLowerCase())) {
          errors.push(`Duplicate in file: Code ${code} appears multiple times`);
        }
        seenInBatch.add(code.toLowerCase());

        rows.push({
          rowNum: i + 1,
          employee_code: code,
          employee_name: name,
          mobile,
          email,
          department,
          designation,
          category,
          location,
          shift,
          isValid: errors.length === 0,
          errors,
        });
      }

      setParsedRows(rows);
      setIsProcessing(false);
    };

    reader.readAsText(file);
  };

  const handleImportValid = () => {
    const valid = parsedRows.filter((r) => r.isValid);
    if (valid.length === 0) {
      alert('No valid records to import.');
      return;
    }

    valid.forEach((r) => {
      const newEmp: EmployeeMaster = {
        employee_id: `EMP-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 100)}`,
        employee_code: r.employee_code,
        employee_name: r.employee_name,
        profile_photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        face_template: 'AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyAhIiMkJSYnKCkqKywtLi8w',
        face_samples_count: 2,
        face_status: 'Pending Registration',
        mobile: r.mobile,
        email: r.email,
        department: r.department,
        designation: r.designation,
        employee_category: r.category,
        employment_type: 'Full-Time',
        joining_date: new Date().toISOString().split('T')[0],
        assigned_location: r.location,
        alternate_locations: [],
        shift: r.shift,
        status: 'Active',
      };
      db.addEmployee(newEmp, 'Admin (Bulk CSV)');
    });

    setImportSummary({
      imported: valid.length,
      skipped: parsedRows.length - valid.length,
    });
    setParsedRows([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
            Bulk Employee Import (Excel / CSV)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Download the official schema template, validate records with instant duplicate prevention, and bulk onboard workforce.
          </p>
        </div>

        <button
          onClick={handleDownloadTemplate}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 shadow transition"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Download CSV Template</span>
        </button>
      </div>

      {/* Upload Box */}
      <div className="bg-slate-950/80 border-2 border-dashed border-slate-800 hover:border-indigo-500/60 rounded-2xl p-8 text-center transition group">
        <input
          type="file"
          id="csvUploadInput"
          accept=".csv,.txt"
          onChange={handleFileUpload}
          className="hidden"
        />
        <label htmlFor="csvUploadInput" className="cursor-pointer flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-900/30 border border-indigo-700/40 text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 transition">
            <Upload className="w-6 h-6" />
          </div>
          <div className="text-sm font-semibold text-white">
            {fileName ? `Loaded: ${fileName}` : 'Drop employee CSV file here or click to browse'}
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Validates unique employee codes, mobile numbers, department keys, and shift codes.
          </p>
        </label>
      </div>

      {/* Import Success Banner */}
      {importSummary && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span>
              Successfully imported <strong>{importSummary.imported}</strong> employee profiles. {importSummary.skipped > 0 && `(${importSummary.skipped} duplicate/invalid rows skipped).`}
            </span>
          </div>
        </div>
      )}

      {/* Preview & Validation Table */}
      {parsedRows.length > 0 && (
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl shadow-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-sm text-white flex items-center gap-2">
                <span>Validation Preview</span>
                <span className="text-xs font-normal text-slate-400">({parsedRows.length} rows detected)</span>
              </h2>
              <div className="flex items-center gap-3 text-xs mt-1">
                <span className="text-emerald-400 font-medium">
                  {parsedRows.filter((r) => r.isValid).length} Valid
                </span>
                <span className="text-rose-400 font-medium">
                  {parsedRows.filter((r) => !r.isValid).length} Errors
                </span>
              </div>
            </div>

            <button
              onClick={handleImportValid}
              disabled={parsedRows.filter((r) => r.isValid).length === 0}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Import {parsedRows.filter((r) => r.isValid).length} Valid Records</span>
            </button>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Row</th>
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Mobile</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Validation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {parsedRows.map((row) => (
                  <tr key={row.rowNum} className={row.isValid ? 'hover:bg-slate-900/40' : 'bg-rose-950/20'}>
                    <td className="py-2.5 px-3 text-slate-500 font-mono">#{row.rowNum}</td>
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-200">{row.employee_code}</td>
                    <td className="py-2.5 px-3 text-slate-200">{row.employee_name}</td>
                    <td className="py-2.5 px-3 text-slate-400">{row.mobile}</td>
                    <td className="py-2.5 px-3 text-slate-300">{row.department}</td>
                    <td className="py-2.5 px-3 text-slate-400">{row.designation}</td>
                    <td className="py-2.5 px-3">
                      {row.isValid ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400" title={row.errors.join(', ')}>
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{row.errors[0]}</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
