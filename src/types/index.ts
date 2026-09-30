export type OfficeType = 'Head Office' | 'Site Office' | 'Warehouse' | 'Factory' | 'Project Site' | 'Branch Office';

export type EmployeeCategory = 
  | 'Permanent' 
  | 'Contract' 
  | 'Temporary' 
  | 'Consultant' 
  | 'Intern' 
  | 'Worker' 
  | 'Management'
  | string;

export type EmploymentType = 'Full-Time' | 'Part-Time' | 'Contract' | 'Probation';

export type AttendanceMode = 'GPS + Face' | 'QR + GPS + Face' | 'Admin/Office Kiosk' | 'Manual';

export type AttendanceStatus = 
  | 'Present' 
  | 'Late' 
  | 'Half Day' 
  | 'Absent' 
  | 'Work From Home' 
  | 'On Duty' 
  | 'Manual' 
  | 'Rejected';

export type LeaveType = 'Casual Leave' | 'Sick Leave' | 'Earned Leave' | 'Emergency Leave' | 'Maternity/Paternity' | 'Other';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

export type AdvanceStatus = 'Pending' | 'Approved' | 'Paid' | 'Settled' | 'Rejected';

export type ComplaintCategory = 'HR' | 'Salary' | 'Workplace' | 'Management' | 'Safety' | 'IT' | 'Other';
export type ComplaintPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type ComplaintStatus = 'Open' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed';

export type UserRole = 'Super Admin' | 'Admin' | 'HR' | 'Manager' | 'Accounts' | 'Employee';

export type AccountStatus = 'Active' | 'Inactive' | 'Suspended' | 'Pending' | 'Blocked';

export interface Company {
  company_id: string;
  company_name: string;
  logo: string;
  address: string;
  contact: string;
  email: string;
  timezone: string;
  status: 'Active' | 'Inactive';
}

export interface UserAccount {
  user_id: string;
  employee_id: string;
  username: string;
  password_hash: string;
  temp_password?: string;
  role: UserRole;
  status: AccountStatus;
  first_login: boolean;
  password_changed_at?: string;
  last_login?: string;
  failed_attempts: number;
  locked_until?: string;
  created_at: string;
  updated_at: string;
}

export interface LocationMaster {
  location_id: string;
  location_name: string;
  location_code: string;
  address: string;
  latitude: number;
  longitude: number;
  allowed_radius_meters: number;
  QR_code: string;
  QR_secret: string;
  office_type: OfficeType;
  status: 'Active' | 'Inactive';
  gps_required: boolean;
  qr_required: boolean;
  face_required: boolean;
  voice_greeting: boolean;
  shift_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LocationQRRecord {
  qr_id: string;
  location_id: string;
  location_name: string;
  qr_type: 'static' | 'dynamic';
  qr_token: string;
  qr_version: string;
  created_at: string;
  updated_at: string;
  status: 'ACTIVE' | 'DEACTIVATED';
  deactivated_at?: string;
}

export interface EmployeeLocationPermission {
  id: string;
  employee_id: string;
  location_id: string;
  allowed: boolean;
  valid_from?: string;
  valid_to?: string;
  status: 'Active' | 'Inactive';
}

export interface DepartmentMaster {
  department_id: string;
  department_name: string;
  department_code: string;
  department_head: string;
  status: 'Active' | 'Inactive';
}

export interface DesignationMaster {
  designation_id: string;
  designation_name: string;
  department_id: string;
  status: 'Active' | 'Inactive';
}

export interface ShiftMaster {
  shift_id: string;
  shift_name: string;
  start_time: string; // "09:30"
  end_time: string;   // "18:30"
  grace_period_mins: number;
  late_threshold_mins: number;
  early_exit_mins: number;
  status: 'Active' | 'Inactive';
}

export interface EmployeeMaster {
  employee_id: string;
  employee_code: string;
  employee_name: string;
  profile_photo: string;
  face_template?: string; // Encoded biometric vector / reference representation
  face_samples_count: number;
  face_status: 'Registered' | 'Pending Registration';
  mobile: string;
  email: string;
  department: string;
  designation: string;
  employee_category: EmployeeCategory;
  employment_type: EmploymentType;
  joining_date: string;
  manager_id?: string;
  manager_name?: string;
  assigned_location: string; // primary location_id
  alternate_locations: string[]; // additional location_ids
  shift: string; // shift_id
  status: 'Active' | 'Inactive' | 'On Notice' | 'Suspended';
  created_at?: string;
  updated_at?: string;
}

export interface AttendanceRecord {
  attendance_id: string;
  employee_id: string;
  employee_name: string;
  date: string; // YYYY-MM-DD
  check_in_time: string; // HH:mm:ss
  check_out_time?: string;
  location_id: string;
  location_name: string;
  latitude: number;
  longitude: number;
  distance_from_location: number; // in meters
  attendance_mode: AttendanceMode;
  QR_verified: boolean;
  GPS_verified: boolean;
  face_verified: boolean;
  face_confidence: number; // e.g. 96.5%
  device_id: string;
  ip?: string;
  status: AttendanceStatus;
  remarks?: string;
  is_suspicious?: boolean;
  suspicious_reason?: string;
  created_at: string;
  synced_to_sheets?: boolean;
  // Punch In details
  punch_in_photo?: string;
  punch_in_address?: string;
  punch_in_location_name?: string;
  // Punch Out details
  punch_out_photo?: string;
  punch_out_address?: string;
  punch_out_location_name?: string;
  punch_out_latitude?: number;
  punch_out_longitude?: number;
  punch_out_distance?: number;
}

export interface LeaveRecord {
  leave_id: string;
  employee_id: string;
  employee_name: string;
  department: string;
  leave_type: LeaveType;
  from_date: string;
  to_date: string;
  days_count: number;
  reason: string;
  attachment_url?: string;
  remarks?: string;
  status: LeaveStatus;
  applied_at: string;
  approved_by?: string;
  approved_at?: string;
  created_at?: string;
}

export interface AdvanceRecord {
  advance_id: string;
  employee_id: string;
  employee_name: string;
  department: string;
  amount: number;
  reason: string;
  date: string;
  attachment_url?: string;
  approval_status: AdvanceStatus;
  approved_amount?: number;
  approved_by?: string;
  payment_date?: string;
  settlement_status: 'Unsettled' | 'Partially Settled' | 'Settled';
  created_at: string;
}

export interface ComplaintRecord {
  complaint_id: string;
  employee_id: string;
  employee_name: string;
  department: string;
  category: ComplaintCategory;
  subject: string;
  description: string;
  attachment_url?: string;
  priority: ComplaintPriority;
  confidential: boolean;
  created_date: string;
  status: ComplaintStatus;
  assigned_to?: string;
  resolution?: string;
  closed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface NotificationItem {
  id: string;
  recipient_id: string; // 'all' or specific employee_id
  title: string;
  message: string;
  type: 'attendance' | 'late' | 'leave' | 'advance' | 'complaint' | 'announcement';
  is_read: boolean;
  timestamp: string;
  action_url?: string;
}

export type DataSourceType = 'Internal Database' | 'Google Sheets' | 'External REST API';

export interface ColumnMapping {
  application_field: string;
  sheet_column: string;
  required: boolean;
}

export interface DataSourceConfig {
  id: string;
  data_source_name: string;
  type: DataSourceType;
  google_account?: string;
  sheet_url?: string;
  spreadsheet_id?: string;
  sheet_tab?: string;
  table_purpose: 'Attendance Data' | 'Employee Data' | 'Leave Data' | 'Advance Data' | 'Complaint Data';
  read_permission: boolean;
  write_permission: boolean;
  sync_direction: 'Bidirectional' | 'App to Sheets' | 'Sheets to App';
  sync_frequency: 'Real-time' | 'Every 15 mins' | 'Hourly' | 'Daily' | 'Manual';
  status: 'Active' | 'Inactive' | 'Error';
  last_sync_at?: string;
  last_sync_status?: string;
  column_mappings: ColumnMapping[];
}

export interface RoleConfig {
  role_id: string;
  role_name: UserRole;
  description: string;
  permissions: {
    view_attendance: boolean;
    edit_attendance: boolean;
    approve_leave: boolean;
    approve_advance: boolean;
    view_complaints: boolean;
    manage_employees: boolean;
    manage_locations: boolean;
    generate_qr: boolean;
    manage_data_sources: boolean;
    view_reports: boolean;
    system_settings: boolean;
  };
}

export interface AuditLogRecord {
  id: string;
  user_name: string;
  user_role: string;
  action: string;
  target_entity: string;
  details: string;
  ip_address: string;
  device_info: string;
  timestamp: string;
}

export interface GoogleSheetsDbConfig {
  spreadsheet_name: string;
  spreadsheet_url: string;
  spreadsheet_id: string;
  status: 'Connected' | 'Syncing' | 'Connection Error' | 'Uninitialized';
  last_sync?: string;
  last_error?: string;
  last_backup?: string;
  tab_names: Record<string, string>;
  tabs_status: Record<string, boolean>; // e.g. "01_Users": true
}

export interface GoogleDriveConfig {
  connected: boolean;
  root_folder_name: string;
  root_folder_id?: string;
  subfolders: Record<string, string>; // folder_name -> folder_id
}

export interface SecuritySettings {
  require_face: boolean;
  require_gps: boolean;
  require_qr: boolean;
  allow_manual_attendance: boolean;
  allow_offline_attendance: boolean;
  allow_employee_photo_update: boolean;
  allow_employee_password_change: boolean;
  allow_employee_userid_change: boolean;
  enable_voice_greeting: boolean;
  enable_notifications: boolean;
}

export interface SystemSettings {
  company: Company;
  security: SecuritySettings;
  google_sheets_db: GoogleSheetsDbConfig;
  google_drive: GoogleDriveConfig;
  attendance_rules: {
    allowed_gps_radius_meters: number;
    late_after_time: string; // "09:30"
    grace_period_mins: number;
    half_day_late_mins: number;
    allow_offline_attendance: boolean;
    prevent_duplicate_checkin: boolean;
  };
  face_recognition: {
    enabled: boolean;
    confidence_threshold: number;
    liveness_detection_required: boolean;
    anti_spoofing_level: 'Standard' | 'Strict';
  };
  qr_rules: {
    dynamic_qr_enabled: boolean;
    refresh_interval_seconds: number;
    token_encryption: boolean;
  };
  voice_greeting: {
    enabled: boolean;
    language: 'English' | 'Hindi' | 'Hinglish';
    welcome_message_template: string;
  };
  anti_fraud: {
    detect_mock_location: boolean;
    flag_radius_mismatch: boolean;
    require_admin_review_for_suspicious: boolean;
  };
  integrations: {
    google_sheets_api: {
      status: 'Configured' | 'API Key Required' | 'Disabled';
      api_key?: string;
      client_email?: string;
    };
    google_maps: {
      status: 'Configured' | 'API Key Required' | 'Disabled';
      api_key?: string;
    };
    face_sdk: {
      status: 'Configured' | 'API Key Required';
      provider: 'Built-in Canvas Vision' | 'External AI SDK';
    };
    fcm: {
      status: 'Configured' | 'API Key Required';
      sender_id?: string;
    };
  };
}
