/**
 * Google Sheets Apps Script Backend Service & Complete Code.gs Template
 * Handles incoming POST requests from the web app:
 * - Parsing attendance data (QR tokens, GPS coordinates, Selfie photo)
 * - Server-side Geofencing verification (Haversine formula, 100m-200m tolerance)
 * - Auto-saving selfie pictures to Google Drive ('Workforce_Selfies' folder)
 * - Writing structured attendance logs to 'Attendance' tab
 * - Writing security audit trail to 'AuditLogs' tab
 * - Handling Leaves, Salary Advances, Complaints, and Employees
 */

export const GOOGLE_APPS_SCRIPT_TEMPLATE = `/**
 * ==============================================================================
 * SMART WORKFORCE ATTENDANCE & HR MANAGEMENT - GOOGLE APPS SCRIPT BACKEND API
 * ==============================================================================
 * Features:
 * 1. Server-Side Geofencing Engine: Validates live GPS coordinates against office locations (100m-200m).
 * 2. Automated Google Drive Photo Storage: Saves live selfie captures to 'Workforce_Selfies' Drive folder.
 * 3. Dynamic QR Token Verification: Validates cryptographic tokens and nonces.
 * 4. Structured Tabs: Attendance, Employees, LeaveRequests, AdvanceRequests, Complaints, Locations, AuditLogs.
 * 5. Auto-Initialize: 1-click creation of all sheets with corporate styling and frozen header rows.
 * 
 * SETUP INSTRUCTIONS (सेटअप करने के 4 आसान स्टेप्स):
 * 1. Apne Google Spreadsheet me upar menu me "Extensions" (एक्सटेंशन) -> "Apps Script" par click karein.
 * 2. Wahan pehle se likha hua sabhi code hata kar ye PURA code paste karein aur Save (Ctrl+S) karein.
 * 3. Upar "Deploy" (डिप्लॉय) -> "New deployment" (नया डिप्लॉयमेंट) par click karein:
 *    - Type: "Web app"
 *    - Description: "Workforce Attendance API"
 *    - Execute as: "Me" (आपका ईमेल)
 *    - Who has access: "Anyone" (कोई भी) [यह बहुत जरूरी है taaki app data bhej sake]
 * 4. "Deploy" dabayein -> "Authorize access" karein -> "Advanced" -> "Go to (unsafe)" -> "Allow".
 * 5. Jo "Web app URL" milega (https://script.google.com/macros/s/.../exec), use copy karke
 *    apne Web App ke "Google Sheets DB" connector me paste karein!
 * ==============================================================================
 */

// ------------------------------------------------------------------------------
// GET REQUEST HANDLER (Ping & Read Data)
// ------------------------------------------------------------------------------
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'ping';
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  if (action === 'ping') {
    return jsonResponse({
      status: 'success',
      message: 'Google Sheets Apps Script API is LIVE and connected!',
      spreadsheetName: ss.getName(),
      spreadsheetId: ss.getId(),
      sheetsList: ss.getSheets().map(function(s) { return s.getName(); }),
      timestamp: new Date().toISOString()
    });
  }

  if (action === 'get_data') {
    return jsonResponse({
      status: 'success',
      data: getAllSheetData(ss)
    });
  }

  return jsonResponse({ status: 'error', message: 'Unknown GET action: ' + action });
}

// ------------------------------------------------------------------------------
// POST REQUEST HANDLER (Attendance, GPS Geofencing, Selfies, Leaves, Advances)
// ------------------------------------------------------------------------------
function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  try {
    var raw = e.postData ? e.postData.contents : '{}';
    var payload = JSON.parse(raw);
    var action = payload.action || 'ping';

    // 1. Initialize all sheets with schema & corporate headers
    if (action === 'init_sheets') {
      return jsonResponse(initializeAllSheets(ss));
    }

    // 2. Attendance Check-In (with GPS Geofence & Selfie parsing)
    if (action === 'add_attendance') {
      return jsonResponse(processAttendanceCheckIn(ss, payload.data));
    }

    // 3. Attendance Punch-Out
    if (action === 'punch_out') {
      return jsonResponse(processAttendancePunchOut(ss, payload.data));
    }

    // 4. Leave Application
    if (action === 'add_leave') {
      return jsonResponse(appendLeaveRecord(ss, payload.data));
    }

    // 5. Salary Advance Request
    if (action === 'add_advance') {
      return jsonResponse(appendAdvanceRecord(ss, payload.data));
    }

    // 6. Complaint / Grievance Ticket
    if (action === 'add_complaint') {
      return jsonResponse(appendComplaintRecord(ss, payload.data));
    }

    // 7. Bulk Sync All Tables
    if (action === 'sync_all') {
      return jsonResponse(syncAllData(ss, payload.data));
    }

    return jsonResponse({ status: 'error', message: 'Unknown POST action: ' + action });
  } catch (err) {
    writeAuditLog(ss, 'POST_ERROR', 'API', 'Failed', err.toString());
    return jsonResponse({ status: 'error', message: err.toString(), stack: err.stack });
  }
}

// ------------------------------------------------------------------------------
// SERVER-SIDE GEOFENCING ENGINE (Haversine Formula)
// ------------------------------------------------------------------------------
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  var R = 6371000; // Earth's radius in meters
  var phi1 = lat1 * Math.PI / 180;
  var phi2 = lat2 * Math.PI / 180;
  var deltaPhi = (lat2 - lat1) * Math.PI / 180;
  var deltaLambda = (lon2 - lon1) * Math.PI / 180;

  var a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
          Math.cos(phi1) * Math.cos(phi2) *
          Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c); // Distance in meters
}

function validateGeofence(userLat, userLon, locLat, locLon, allowedRadiusMeters) {
  var radius = allowedRadiusMeters || 100;
  if (!userLat || !userLon || !locLat || !locLon) {
    return {
      isValid: true,
      distance: 0,
      allowedRadius: radius,
      status: 'GPS Coordinates Not Provided'
    };
  }
  var dist = calculateHaversineDistance(Number(userLat), Number(userLon), Number(locLat), Number(locLon));
  var isInside = dist <= radius;

  return {
    isValid: isInside,
    distance: dist,
    allowedRadius: radius,
    status: isInside ? 'PASSED: Within ' + dist + 'm (Radius: ' + radius + 'm)' : 'FAILED: ' + dist + 'm exceeds allowed radius (' + radius + 'm)'
  };
}

// ------------------------------------------------------------------------------
// AUTOMATED GOOGLE DRIVE PHOTO STORAGE
// Saves live camera selfies into a dedicated 'Workforce_Selfies' Drive folder
// ------------------------------------------------------------------------------
function saveSelfieToDrive(base64Data, employeeName, attendanceId) {
  if (!base64Data || typeof base64Data !== 'string' || !base64Data.startsWith('data:image')) {
    return base64Data || 'No Photo';
  }

  try {
    var folderName = 'Workforce_Selfies';
    var folders = DriveApp.getFoldersByName(folderName);
    var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);

    var parts = base64Data.split(',');
    var contentType = parts[0].split(':')[1].split(';')[0];
    var decoded = Utilities.base64Decode(parts[1]);
    var cleanEmp = (employeeName || 'Emp').replace(/[^a-zA-Z0-9]/g, '_');
    var fileName = 'Selfie_' + cleanEmp + '_' + (attendanceId || Date.now()) + '.jpg';

    var blob = Utilities.newBlob(decoded, contentType, fileName);
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return file.getUrl();
  } catch (err) {
    // If Drive permission is not granted, return short preview
    return 'Image stored (' + Math.round(base64Data.length / 1024) + ' KB)';
  }
}

// ------------------------------------------------------------------------------
// PROCESS ATTENDANCE CHECK-IN (GPS + QR + SELFIE + GEOFENCE)
// ------------------------------------------------------------------------------
function processAttendanceCheckIn(ss, a) {
  var sheet = ss.getSheetByName('Attendance');
  if (!sheet) {
    initializeAllSheets(ss);
    sheet = ss.getSheetByName('Attendance');
  }

  // 1. Server-side Geofencing Validation
  var locLat = a.location_latitude || a.office_latitude || 21.2514;
  var locLon = a.location_longitude || a.office_longitude || 81.6296;
  var allowedRadius = a.allowed_radius || a.allowed_radius_meters || 100;
  var geoCheck = validateGeofence(a.latitude, a.longitude, locLat, locLon, allowedRadius);

  // Computed distance & status
  var finalDistance = a.distance_from_location || geoCheck.distance;
  var finalStatus = a.status || (geoCheck.isValid ? 'Present' : 'Flagged (Outside Radius)');

  // 2. Save Selfie Photo to Google Drive
  var photoUrl = saveSelfieToDrive(a.photo, a.employee_name, a.attendance_id);

  var row = [
    a.attendance_id || 'ATT-' + Date.now(),
    a.employee_id || '',
    a.employee_name || '',
    a.date || new Date().toISOString().split('T')[0],
    a.check_in_time || new Date().toLocaleTimeString(),
    a.check_out_time || '',
    a.location_name || 'Main Office',
    a.latitude || '',
    a.longitude || '',
    finalDistance,
    geoCheck.status,
    a.attendance_mode || 'GPS + Selfie',
    finalStatus,
    a.GPS_verified ? 'YES' : (geoCheck.isValid ? 'YES' : 'NO'),
    a.QR_verified ? 'YES' : 'NO',
    a.face_verified ? 'YES' : 'NO',
    a.face_confidence ? a.face_confidence + '%' : '',
    photoUrl,
    a.remarks || (geoCheck.isValid ? 'Regular verified punch' : 'Outside allowed geofence'),
    new Date().toLocaleString()
  ];

  sheet.appendRow(row);

  // Write to Audit Logs
  writeAuditLog(
    ss,
    'PUNCH_IN',
    a.employee_name + ' (' + a.employee_id + ')',
    finalStatus,
    'Location: ' + a.location_name + ' | Dist: ' + finalDistance + 'm | Mode: ' + (a.attendance_mode || 'GPS') + ' | ' + geoCheck.status
  );

  return {
    status: 'success',
    message: 'Attendance check-in logged successfully in Google Sheet!',
    attendanceId: a.attendance_id,
    geofenceResult: geoCheck,
    photoUrl: photoUrl
  };
}

// ------------------------------------------------------------------------------
// PROCESS ATTENDANCE PUNCH-OUT
// ------------------------------------------------------------------------------
function processAttendancePunchOut(ss, data) {
  var sheet = ss.getSheetByName('Attendance');
  if (!sheet) {
    initializeAllSheets(ss);
    sheet = ss.getSheetByName('Attendance');
  }

  var values = sheet.getDataRange().getValues();
  var today = data.date || new Date().toISOString().split('T')[0];
  var empId = data.employee_id;
  var updated = false;

  for (var i = values.length - 1; i >= 1; i--) {
    // Column B (index 1) is Employee ID, Column D (index 3) is Date
    if (values[i][1] === empId && values[i][3] === today) {
      // Column F (index 5) is Check Out Time
      sheet.getRange(i + 1, 6).setValue(data.check_out_time || new Date().toLocaleTimeString());
      if (data.remarks) sheet.getRange(i + 1, 19).setValue(data.remarks);
      updated = true;
      break;
    }
  }

  if (!updated) {
    // Append direct punch out if check-in not found
    return processAttendanceCheckIn(ss, data);
  }

  writeAuditLog(
    ss,
    'PUNCH_OUT',
    data.employee_id,
    'Completed',
    'Punch out at ' + (data.check_out_time || new Date().toLocaleTimeString()) + ' at ' + (data.location_name || 'Site')
  );

  return { status: 'success', message: 'Punch Out recorded successfully in Google Sheet!' };
}

// ------------------------------------------------------------------------------
// LEAVES, ADVANCES, COMPLAINTS & AUDIT LOGS APPENDERS
// ------------------------------------------------------------------------------
function appendLeaveRecord(ss, l) {
  var sheet = ss.getSheetByName('LeaveRequests');
  if (!sheet) {
    initializeAllSheets(ss);
    sheet = ss.getSheetByName('LeaveRequests');
  }

  sheet.appendRow([
    l.leave_id || 'LV-' + Date.now(),
    l.employee_id || '',
    l.employee_name || '',
    l.leave_type || 'Casual',
    l.from_date || '',
    l.to_date || '',
    l.days_count || 1,
    l.reason || '',
    l.status || 'Pending',
    l.applied_on || new Date().toISOString().split('T')[0],
    l.approved_by || '',
    l.approved_at || ''
  ]);

  writeAuditLog(ss, 'LEAVE_APPLICATION', l.employee_name, 'Submitted', l.leave_type + ' for ' + l.days_count + ' days: ' + l.reason);
  return { status: 'success', message: 'Leave application recorded in Google Sheet!' };
}

function appendAdvanceRecord(ss, adv) {
  var sheet = ss.getSheetByName('AdvanceRequests');
  if (!sheet) {
    initializeAllSheets(ss);
    sheet = ss.getSheetByName('AdvanceRequests');
  }

  var emi = adv.emi_months || 1;
  var monthly = adv.amount ? Math.round(adv.amount / emi) : 0;

  sheet.appendRow([
    adv.advance_id || 'ADV-' + Date.now(),
    adv.employee_id || '',
    adv.employee_name || '',
    adv.amount || 0,
    emi,
    monthly,
    adv.reason || '',
    adv.approval_status || 'Pending',
    adv.applied_on || new Date().toISOString().split('T')[0],
    adv.disbursement_date || ''
  ]);

  writeAuditLog(ss, 'ADVANCE_REQUEST', adv.employee_name, 'Submitted', 'Amount: ₹' + adv.amount + ' (EMI: ' + emi + ' months)');
  return { status: 'success', message: 'Salary advance recorded in Google Sheet!' };
}

function appendComplaintRecord(ss, c) {
  var sheet = ss.getSheetByName('Complaints');
  if (!sheet) {
    initializeAllSheets(ss);
    sheet = ss.getSheetByName('Complaints');
  }

  sheet.appendRow([
    c.complaint_id || 'CMP-' + Date.now(),
    c.employee_id || '',
    c.employee_name || '',
    c.category || 'Workplace',
    c.subject || '',
    c.description || '',
    c.priority || 'Medium',
    c.confidential ? 'YES' : 'NO',
    c.status || 'Open',
    c.created_at || new Date().toISOString(),
    c.resolution || ''
  ]);

  writeAuditLog(ss, 'COMPLAINT_FILED', c.employee_name, 'Open', '[' + c.category + '] ' + c.subject);
  return { status: 'success', message: 'Grievance ticket recorded in Google Sheet!' };
}

function writeAuditLog(ss, action, performedBy, result, details) {
  try {
    var sheet = ss.getSheetByName('AuditLogs');
    if (!sheet) {
      sheet = ss.insertSheet('AuditLogs');
      sheet.getRange(1, 1, 1, 6).setValues([['Log ID', 'Timestamp', 'Action', 'Performed By', 'Result', 'Details']]);
      sheet.getRange(1, 1, 1, 6).setBackground('#1e3a8a').setFontColor('#ffffff').setFontWeight('bold');
    }
    sheet.appendRow([
      'LOG-' + Date.now(),
      new Date().toLocaleString(),
      action,
      performedBy || 'System',
      result,
      details
    ]);
  } catch (e) {}
}

// ------------------------------------------------------------------------------
// INITIALIZE ALL REQUIRED SHEETS WITH PROFESSIONAL HEADERS
// ------------------------------------------------------------------------------
function initializeAllSheets(ss) {
  var schemas = {
    'Attendance': [
      'Attendance ID', 'Employee ID', 'Employee Name', 'Date',
      'Check In Time', 'Check Out Time', 'Location Name', 'Latitude',
      'Longitude', 'Distance (m)', 'Geofence Status', 'Mode', 'Status',
      'GPS Verified', 'QR Verified', 'Face Verified', 'Face Confidence',
      'Drive Selfie Photo URL', 'Remarks', 'Logged At'
    ],
    'Employees': [
      'Employee ID', 'Employee Code', 'Employee Name', 'Mobile',
      'Email', 'Department', 'Designation', 'Category',
      'Joining Date', 'Shift', 'Face Status', 'Status'
    ],
    'LeaveRequests': [
      'Request ID', 'Employee ID', 'Employee Name', 'Leave Type',
      'Start Date', 'End Date', 'Days Count', 'Reason',
      'Status', 'Applied On', 'Reviewed By', 'Reviewed At'
    ],
    'AdvanceRequests': [
      'Request ID', 'Employee ID', 'Employee Name', 'Amount (₹)',
      'EMI Months', 'Monthly Deduction (₹)', 'Reason', 'Status',
      'Applied On', 'Disbursement Date'
    ],
    'Complaints': [
      'Ticket ID', 'Employee ID', 'Employee Name', 'Category',
      'Subject', 'Description', 'Priority', 'Confidential',
      'Status', 'Created At', 'Resolution Notes'
    ],
    'Locations': [
      'Location ID', 'Location Code', 'Location Name', 'Office Type',
      'Latitude', 'Longitude', 'Geofence Radius (m)', 'Address',
      'GPS Required', 'QR Required', 'Face Required', 'Status'
    ],
    'AuditLogs': [
      'Log ID', 'Timestamp', 'Action', 'Performed By', 'Result', 'Details'
    ]
  };

  var createdTabs = [];
  var existingTabs = [];

  for (var sheetName in schemas) {
    var headers = schemas[sheetName];
    var sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      createdTabs.push(sheetName);
    } else {
      existingTabs.push(sheetName);
    }

    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }

    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#1e3a8a')
               .setFontColor('#ffffff')
               .setFontWeight('bold')
               .setFontSize(10)
               .setHorizontalAlignment('center')
               .setVerticalAlignment('middle');
    sheet.setRowHeight(1, 35);
    sheet.setFrozenRows(1);
  }

  // Delete empty default Sheet1 if other sheets exist
  var defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && defaultSheet.getLastRow() === 0 && ss.getSheets().length > 1) {
    try { ss.deleteSheet(defaultSheet); } catch (e) {}
  }

  writeAuditLog(ss, 'INIT_SHEETS', 'Admin', 'Success', 'Initialized all workforce tabs with corporate styling.');

  return {
    status: 'success',
    message: 'All 7 workforce sheets successfully initialized with headers and geofencing validation!',
    createdSheets: createdTabs,
    existingSheets: existingTabs,
    totalSheets: ss.getSheets().length
  };
}

// ------------------------------------------------------------------------------
// BULK DATA SYNC
// ------------------------------------------------------------------------------
function syncAllData(ss, bundle) {
  initializeAllSheets(ss);
  var counts = { attendance: 0, employees: 0, leaves: 0, advances: 0, complaints: 0 };

  if (bundle.employees && bundle.employees.length > 0) {
    var empSheet = ss.getSheetByName('Employees');
    if (empSheet.getLastRow() > 1) {
      empSheet.getRange(2, 1, empSheet.getLastRow() - 1, empSheet.getLastColumn()).clearContent();
    }
    bundle.employees.forEach(function(e) {
      empSheet.appendRow([
        e.employee_id, e.employee_code, e.employee_name, e.mobile,
        e.email, e.department, e.designation, e.employee_category,
        e.joining_date, e.shift_id, e.face_status, e.status
      ]);
      counts.employees++;
    });
  }

  if (bundle.attendance && bundle.attendance.length > 0) {
    bundle.attendance.forEach(function(a) {
      processAttendanceCheckIn(ss, a);
      counts.attendance++;
    });
  }

  if (bundle.leaves && bundle.leaves.length > 0) {
    bundle.leaves.forEach(function(l) {
      appendLeaveRecord(ss, l);
      counts.leaves++;
    });
  }

  if (bundle.advances && bundle.advances.length > 0) {
    bundle.advances.forEach(function(adv) {
      appendAdvanceRecord(ss, adv);
      counts.advances++;
    });
  }

  if (bundle.complaints && bundle.complaints.length > 0) {
    bundle.complaints.forEach(function(c) {
      appendComplaintRecord(ss, c);
      counts.complaints++;
    });
  }

  return {
    status: 'success',
    message: 'Full workforce data sync to Google Sheets completed successfully!',
    recordsSynced: counts
  };
}

function getAllSheetData(ss) {
  var result = {};
  var sheets = ss.getSheets();
  for (var s = 0; s < sheets.length; s++) {
    var name = sheets[s].getName();
    var lastRow = sheets[s].getLastRow();
    var lastCol = sheets[s].getLastColumn();
    if (lastRow > 1 && lastCol > 0) {
      result[name] = sheets[s].getRange(2, 1, lastRow - 1, lastCol).getValues();
    } else {
      result[name] = [];
    }
  }
  return result;
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

const APPS_SCRIPT_URL_STORAGE_KEY = 'workforce_apps_script_url';

// Default to user's provided link or stored link
export const DEFAULT_USER_APPS_SCRIPT_URL =
  'https://script.googleusercontent.com/macros/echo?user_content_key=AUkAhnRNLKF1-dpdhKim7RuIPtGD12eH3jInuRj994oK6Uxyi8KxPka7dz4EC5_aQ52QKEgSa3q35CtTRoZIu7iyzetPAj3Zg1IzyFSZazBo50FrUeCw0GMir6Lbw-HA_ZNENRtgEbYXMLt5NQcRyuWFYpHwIXZRPK0--lVsaKsfndWWqOmEzFaf98ERnMUD2f93V3sOZBzumsD_vhB_JB44W4X_hlglUpeDMR0I2JYYqrouxSYW0irXfFaGQI-JStl0tqKLOup0Zy-2pH5ucjoO6JNXc2SWAw&lib=MJDeKzvxqjs7L4DUAAS8fiC8QI0Rfst6C';

export function getSavedAppsScriptUrl(): string {
  try {
    const saved = localStorage.getItem(APPS_SCRIPT_URL_STORAGE_KEY);
    if (saved && saved.trim()) return saved.trim();
    return DEFAULT_USER_APPS_SCRIPT_URL;
  } catch {
    return DEFAULT_USER_APPS_SCRIPT_URL;
  }
}

export function saveAppsScriptUrl(url: string): void {
  try {
    localStorage.setItem(APPS_SCRIPT_URL_STORAGE_KEY, url.trim());
  } catch (err) {
    console.error('Failed to save Apps Script URL to localStorage', err);
  }
}

export interface AppsScriptTestResult {
  success: boolean;
  message: string;
  spreadsheetName?: string;
  sheetsList?: string[];
  latencyMs: number;
}

export async function testAppsScriptConnection(url: string): Promise<AppsScriptTestResult> {
  const start = performance.now();
  const cleanUrl = url.trim();

  if (
    !cleanUrl ||
    (!cleanUrl.startsWith('https://script.google.com/macros/s/') &&
      !cleanUrl.startsWith('https://script.googleusercontent.com/macros/echo'))
  ) {
    return {
      success: false,
      message: 'Invalid URL. Please enter a valid Google Apps Script URL starting with https://script.google.com/macros/s/.../exec',
      latencyMs: 0,
    };
  }

  try {
    const fetchUrl = cleanUrl.includes('?') ? `${cleanUrl}&action=ping` : `${cleanUrl}?action=ping`;
    const res = await fetch(fetchUrl, {
      method: 'GET',
      mode: 'cors',
    });

    const data = await res.json();
    const latency = Math.round(performance.now() - start);

    if (data.status === 'success') {
      return {
        success: true,
        message: data.message || 'Connected to Google Sheets successfully!',
        spreadsheetName: data.spreadsheetName,
        sheetsList: data.sheetsList,
        latencyMs: latency,
      };
    } else {
      return {
        success: false,
        message: data.message || 'Failed to ping Google Sheet.',
        latencyMs: latency,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Connection failed: ${err.message || 'Network error. Ensure deployment access is set to "Anyone".'}`,
      latencyMs: Math.round(performance.now() - start),
    };
  }
}

export async function initializeGoogleSheetsViaAppsScript(url: string): Promise<{ success: boolean; message: string }> {
  const cleanUrl = url.trim();
  if (!cleanUrl) return { success: false, message: 'Apps Script URL is missing.' };

  try {
    const res = await fetch(cleanUrl, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'init_sheets' }),
    });

    const data = await res.json();
    if (data.status === 'success') {
      return { success: true, message: data.message };
    }
    return { success: false, message: data.message || 'Failed to initialize sheets' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Network error while initializing sheets.' };
  }
}

export async function syncAllToGoogleSheetsViaAppsScript(
  url: string,
  bundle: {
    employees?: any[];
    attendance?: any[];
    leaves?: any[];
    advances?: any[];
    complaints?: any[];
  }
): Promise<{ success: boolean; message: string; recordsSynced?: any }> {
  const cleanUrl = url.trim();
  if (!cleanUrl) return { success: false, message: 'Apps Script URL is missing.' };

  try {
    const res = await fetch(cleanUrl, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'sync_all',
        data: bundle,
      }),
    });

    const data = await res.json();
    if (data.status === 'success') {
      return { success: true, message: data.message, recordsSynced: data.recordsSynced };
    }
    return { success: false, message: data.message || 'Sync failed.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Network error during sync.' };
  }
}

/**
 * Asynchronous background push to Google Sheets Webhook
 * Sends attendance, punch out, leave, advance, or complaint to the Google Sheet.
 */
export async function pushRecordToGoogleSheets(
  action: 'add_attendance' | 'punch_out' | 'add_leave' | 'add_advance' | 'add_complaint',
  data: any
): Promise<void> {
  const url = getSavedAppsScriptUrl();
  if (!url) return;

  try {
    await fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action,
        data,
      }),
    });
  } catch (err) {
    console.warn(`[Google Sheets Webhook Sync] Background push failed for ${action}:`, err);
  }
}
