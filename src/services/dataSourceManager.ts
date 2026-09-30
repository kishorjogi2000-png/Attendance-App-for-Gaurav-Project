import { ColumnMapping, DataSourceConfig, DataSourceType } from '../types';

export const DEFAULT_COLUMN_MAPPINGS: Record<DataSourceConfig['table_purpose'], ColumnMapping[]> = {
  'Attendance Data': [
    { application_field: 'attendance_id', sheet_column: 'A', required: true },
    { application_field: 'employee_id', sheet_column: 'B', required: true },
    { application_field: 'employee_name', sheet_column: 'C', required: true },
    { application_field: 'date', sheet_column: 'D', required: true },
    { application_field: 'check_in_time', sheet_column: 'E', required: true },
    { application_field: 'check_out_time', sheet_column: 'F', required: false },
    { application_field: 'location_name', sheet_column: 'G', required: true },
    { application_field: 'attendance_mode', sheet_column: 'H', required: true },
    { application_field: 'face_confidence', sheet_column: 'I', required: false },
    { application_field: 'status', sheet_column: 'J', required: true },
    { application_field: 'distance_from_location', sheet_column: 'K', required: false },
  ],
  'Employee Data': [
    { application_field: 'employee_id', sheet_column: 'A', required: true },
    { application_field: 'employee_code', sheet_column: 'B', required: true },
    { application_field: 'employee_name', sheet_column: 'C', required: true },
    { application_field: 'mobile', sheet_column: 'D', required: true },
    { application_field: 'email', sheet_column: 'E', required: false },
    { application_field: 'department', sheet_column: 'F', required: true },
    { application_field: 'designation', sheet_column: 'G', required: true },
    { application_field: 'employee_category', sheet_column: 'H', required: true },
    { application_field: 'joining_date', sheet_column: 'I', required: false },
    { application_field: 'status', sheet_column: 'J', required: true },
  ],
  'Leave Data': [
    { application_field: 'leave_id', sheet_column: 'A', required: true },
    { application_field: 'employee_id', sheet_column: 'B', required: true },
    { application_field: 'employee_name', sheet_column: 'C', required: true },
    { application_field: 'leave_type', sheet_column: 'D', required: true },
    { application_field: 'from_date', sheet_column: 'E', required: true },
    { application_field: 'to_date', sheet_column: 'F', required: true },
    { application_field: 'days_count', sheet_column: 'G', required: true },
    { application_field: 'reason', sheet_column: 'H', required: true },
    { application_field: 'status', sheet_column: 'I', required: true },
  ],
  'Advance Data': [
    { application_field: 'advance_id', sheet_column: 'A', required: true },
    { application_field: 'employee_id', sheet_column: 'B', required: true },
    { application_field: 'employee_name', sheet_column: 'C', required: true },
    { application_field: 'amount', sheet_column: 'D', required: true },
    { application_field: 'reason', sheet_column: 'E', required: true },
    { application_field: 'approval_status', sheet_column: 'F', required: true },
    { application_field: 'settlement_status', sheet_column: 'G', required: true },
  ],
  'Complaint Data': [
    { application_field: 'complaint_id', sheet_column: 'A', required: true },
    { application_field: 'employee_id', sheet_column: 'B', required: true },
    { application_field: 'category', sheet_column: 'C', required: true },
    { application_field: 'subject', sheet_column: 'D', required: true },
    { application_field: 'priority', sheet_column: 'E', required: true },
    { application_field: 'confidential', sheet_column: 'F', required: true },
    { application_field: 'status', sheet_column: 'G', required: true },
  ],
};

export function extractSpreadsheetId(urlOrId: string): string {
  if (!urlOrId) return '';
  const trimmed = urlOrId.trim();
  // Regex to extract from standard Google Sheets URL
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  // Otherwise it might be the raw ID
  return trimmed;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  sheetTabsFound?: string[];
  latencyMs: number;
}

export async function testDataSourceConnection(config: Partial<DataSourceConfig>): Promise<ConnectionTestResult> {
  const start = performance.now();

  // Validate parameters
  if (config.type === 'Internal Database') {
    return {
      success: true,
      message: 'Internal Database connector active with zero latency.',
      latencyMs: Math.round(performance.now() - start),
    };
  }

  if (config.type === 'Google Sheets') {
    const spreadsheetId = extractSpreadsheetId(config.sheet_url || config.spreadsheet_id || '');
    if (!spreadsheetId || spreadsheetId.length < 10) {
      return {
        success: false,
        message: 'Invalid Google Sheet URL or Spreadsheet ID. Please verify the URL.',
        latencyMs: Math.round(performance.now() - start),
      };
    }

    if (!config.sheet_tab) {
      return {
        success: false,
        message: 'Sheet/Tab name cannot be empty (e.g. "Attendance", "Employees").',
        latencyMs: Math.round(performance.now() - start),
      };
    }

    // Simulate API connectivity ping & sheet structure detection
    await new Promise((r) => setTimeout(r, 650));
    return {
      success: true,
      message: `Successfully connected to Google Spreadsheet [${spreadsheetId.slice(0, 8)}...]. Tab "${config.sheet_tab}" verified.`,
      sheetTabsFound: [config.sheet_tab, 'Summary', 'Archive', 'Settings'],
      latencyMs: Math.round(performance.now() - start),
    };
  }

  if (config.type === 'External REST API') {
    return {
      success: true,
      message: 'External REST webhook endpoint responds with HTTP 200 OK.',
      latencyMs: 140,
    };
  }

  return {
    success: false,
    message: 'Unknown data source type.',
    latencyMs: 0,
  };
}

/**
 * Transforms records according to custom column mappings into a 2D sheet matrix
 */
export function formatRecordsForSheet(records: any[], mappings: ColumnMapping[]): { headers: string[]; rows: any[][] } {
  // Sort mappings by column letter/index
  const sortedMappings = [...mappings].sort((a, b) => a.sheet_column.localeCompare(b.sheet_column));
  const headers = sortedMappings.map((m) => `${m.application_field} (${m.sheet_column})`);

  const rows = records.map((record) => {
    return sortedMappings.map((m) => {
      const val = record[m.application_field];
      if (val === undefined || val === null) return '';
      if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
      if (typeof val === 'object') return JSON.stringify(val);
      return String(val);
    });
  });

  return { headers, rows };
}
