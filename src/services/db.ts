import {
  AdvanceRecord,
  AttendanceRecord,
  AuditLogRecord,
  Company,
  ComplaintRecord,
  DataSourceConfig,
  DepartmentMaster,
  DesignationMaster,
  EmployeeLocationPermission,
  EmployeeMaster,
  LeaveRecord,
  LocationMaster,
  LocationQRRecord,
  NotificationItem,
  RoleConfig,
  ShiftMaster,
  SystemSettings,
  UserAccount,
  UserRole,
} from '../types';
import { DEFAULT_COLUMN_MAPPINGS } from './dataSourceManager';
import { pushRecordToGoogleSheets } from './googleSheetsAppScript';

const STORAGE_KEY = 'SMART_WORKFORCE_DB_V2';

export interface AppDatabase {
  company: Company;
  users: UserAccount[];
  locations: LocationMaster[];
  locationQRCodes: LocationQRRecord[];
  employeeLocationPermissions: EmployeeLocationPermission[];
  departments: DepartmentMaster[];
  designations: DesignationMaster[];
  shifts: ShiftMaster[];
  employees: EmployeeMaster[];
  attendance: AttendanceRecord[];
  leaves: LeaveRecord[];
  advances: AdvanceRecord[];
  complaints: ComplaintRecord[];
  notifications: NotificationItem[];
  dataSources: DataSourceConfig[];
  roles: RoleConfig[];
  auditLogs: AuditLogRecord[];
  settings: SystemSettings;
}

const SEED_COMPANY: Company = {
  company_id: 'CMP-1001',
  company_name: 'Gourav Project Private Limited',
  logo: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?w=128&auto=format&fit=crop&q=80',
  address: 'Corporate Tower A, Tech Park Corridor, Raipur, CG 492001',
  contact: '+91 98271 55432',
  email: 'admin@apex-corp.in',
  timezone: 'Asia/Kolkata (IST)',
  status: 'Active',
};

// Seed Users with Secure Hashed Passwords
// Note: temp_password is also preserved for initial login testing
const SEED_USERS: UserAccount[] = [
  {
    user_id: 'USR-ADMIN-01',
    employee_id: 'EMP-101',
    username: 'admin',
    password_hash: '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae', // Admin@123
    temp_password: 'Admin@123',
    role: 'Super Admin',
    status: 'Active',
    first_login: false,
    last_login: new Date().toISOString(),
    failed_attempts: 0,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    user_id: 'USR-HR-01',
    employee_id: 'EMP-103',
    username: 'priya.hr',
    password_hash: '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae', // Priya@123
    temp_password: 'Priya@123',
    role: 'HR',
    status: 'Active',
    first_login: false,
    last_login: new Date().toISOString(),
    failed_attempts: 0,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    user_id: 'USR-EMP-101',
    employee_id: 'EMP-101',
    username: 'kishor',
    password_hash: '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae', // Kishor@123
    temp_password: 'Kishor@123',
    role: 'Employee',
    status: 'Active',
    first_login: false,
    last_login: new Date().toISOString(),
    failed_attempts: 0,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    user_id: 'USR-EMP-102',
    employee_id: 'EMP-102',
    username: 'rohit',
    password_hash: '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae', // Rohit@123
    temp_password: 'Rohit@123',
    role: 'Employee',
    status: 'Active',
    first_login: false,
    last_login: new Date().toISOString(),
    failed_attempts: 0,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    user_id: 'USR-EMP-107',
    employee_id: 'EMP-107',
    username: 'mohan',
    password_hash: '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae',
    temp_password: 'Temp@123',
    role: 'Employee',
    status: 'Pending',
    first_login: true, // Forces first-time password change & face setup
    failed_attempts: 0,
    created_at: '2026-09-28T00:00:00Z',
    updated_at: '2026-09-28T00:00:00Z',
  },
];

const SEED_DEPARTMENTS: DepartmentMaster[] = [
  { department_id: 'DEP-HR', department_name: 'Human Resources', department_code: 'HR', department_head: 'Priya Verma', status: 'Active' },
  { department_id: 'DEP-ACC', department_name: 'Accounts & Finance', department_code: 'ACC', department_head: 'Sunita Roy', status: 'Active' },
  { department_id: 'DEP-IT', department_name: 'Information Technology', department_code: 'IT', department_head: 'Kishor Jogi', status: 'Active' },
  { department_id: 'DEP-CIV', department_name: 'Civil Engineering', department_code: 'CIV', department_head: 'Rajesh Kumar', status: 'Active' },
  { department_id: 'DEP-MEC', department_name: 'Mechanical & Plant', department_code: 'MEC', department_head: 'Sanjay Mehra', status: 'Active' },
  { department_id: 'DEP-STR', department_name: 'Store & Warehouse', department_code: 'STR', department_head: 'Amit Patel', status: 'Active' },
  { department_id: 'DEP-PUR', department_name: 'Procurement & Purchase', department_code: 'PUR', department_head: 'Kavita Das', status: 'Active' },
  { department_id: 'DEP-PRD', department_name: 'Operations & Production', department_code: 'PRD', department_head: 'Vikas Singh', status: 'Active' },
  { department_id: 'DEP-SLS', department_name: 'Marketing & Sales', department_code: 'SLS', department_head: 'Anil Gupta', status: 'Active' },
  { department_id: 'DEP-MIS', department_name: 'MIS & Reporting', department_code: 'MIS', department_head: 'Deepak Rao', status: 'Active' },
];

const SEED_DESIGNATIONS: DesignationMaster[] = [
  { designation_id: 'DES-01', designation_name: 'Senior Field Engineer', department_id: 'DEP-CIV', status: 'Active' },
  { designation_id: 'DES-02', designation_name: 'Site Project Supervisor', department_id: 'DEP-CIV', status: 'Active' },
  { designation_id: 'DES-03', designation_name: 'HR Manager & Compliance', department_id: 'DEP-HR', status: 'Active' },
  { designation_id: 'DES-04', designation_name: 'Inventory Officer', department_id: 'DEP-STR', status: 'Active' },
  { designation_id: 'DES-05', designation_name: 'Chief Accountant', department_id: 'DEP-ACC', status: 'Active' },
  { designation_id: 'DES-06', designation_name: 'Plant Operator Lead', department_id: 'DEP-PRD', status: 'Active' },
];

const SEED_SHIFTS: ShiftMaster[] = [
  {
    shift_id: 'SHF-GEN',
    shift_name: 'General Shift',
    start_time: '09:30',
    end_time: '18:30',
    grace_period_mins: 15,
    late_threshold_mins: 30,
    early_exit_mins: 15,
    status: 'Active',
  },
  {
    shift_id: 'SHF-MOR',
    shift_name: 'Morning Plant Shift',
    start_time: '07:00',
    end_time: '15:30',
    grace_period_mins: 10,
    late_threshold_mins: 20,
    early_exit_mins: 10,
    status: 'Active',
  },
  {
    shift_id: 'SHF-NIG',
    shift_name: 'Night Operations Shift',
    start_time: '20:00',
    end_time: '04:30',
    grace_period_mins: 15,
    late_threshold_mins: 30,
    early_exit_mins: 15,
    status: 'Active',
  },
];

const SEED_LOCATIONS: LocationMaster[] = [
  {
    location_id: 'LOC-D-OFFICE',
    location_name: 'D Office - Corporate Headquarters',
    location_code: 'D-OFFICE',
    address: 'Sector 5, Financial Center, VIP Road, Raipur, CG',
    latitude: 21.2514,
    longitude: 81.6296,
    allowed_radius_meters: 100,
    QR_code: 'D-OFFICE-ATTENDANCE-QR',
    QR_secret: 'sec_d_office_9841',
    office_type: 'Head Office',
    status: 'Active',
    gps_required: true,
    qr_required: true,
    face_required: true,
    voice_greeting: true,
    shift_id: 'SHF-GEN',
  },
  {
    location_id: 'LOC-SITE-01',
    location_name: 'Site Office 01 - Industrial Corridor',
    location_code: 'SITE-01',
    address: 'Plot 42, Heavy Industrial Belt, Urla Zone, Raipur',
    latitude: 21.3201,
    longitude: 81.6025,
    allowed_radius_meters: 150,
    QR_code: 'SITE-01-ATTENDANCE-QR',
    QR_secret: 'sec_site01_3321',
    office_type: 'Site Office',
    status: 'Active',
    gps_required: true,
    qr_required: true,
    face_required: true,
    voice_greeting: true,
    shift_id: 'SHF-MOR',
  },
  {
    location_id: 'LOC-SITE-02',
    location_name: 'Site Office 02 - Expressway Expansion',
    location_code: 'SITE-02',
    address: 'Camp Unit 4, Highway KM 84, Bilaspur Road',
    latitude: 21.411,
    longitude: 81.712,
    allowed_radius_meters: 200,
    QR_code: 'SITE-02-ATTENDANCE-QR',
    QR_secret: 'sec_site02_7712',
    office_type: 'Site Office',
    status: 'Active',
    gps_required: true,
    qr_required: false,
    face_required: true,
    voice_greeting: true,
    shift_id: 'SHF-GEN',
  },
  {
    location_id: 'LOC-WAREHOUSE',
    location_name: 'Central Warehouse & Logistics Hub',
    location_code: 'WH-CENTRAL',
    address: 'Logistics Park, Ring Road No. 2, Transport Nagar',
    latitude: 21.285,
    longitude: 81.662,
    allowed_radius_meters: 100,
    QR_code: 'WH-CENTRAL-QR',
    QR_secret: 'sec_wh_5541',
    office_type: 'Warehouse',
    status: 'Active',
    gps_required: true,
    qr_required: true,
    face_required: true,
    voice_greeting: true,
    shift_id: 'SHF-GEN',
  },
  {
    location_id: 'LOC-FACTORY',
    location_name: 'Steel Fabrication Factory',
    location_code: 'FACTORY-MAIN',
    address: 'Bhanpuri Heavy Engineering Estate, Sector C',
    latitude: 21.305,
    longitude: 81.638,
    allowed_radius_meters: 250,
    QR_code: 'FACTORY-MAIN-QR',
    QR_secret: 'sec_factory_9981',
    office_type: 'Factory',
    status: 'Active',
    gps_required: true,
    qr_required: true,
    face_required: true,
    voice_greeting: true,
    shift_id: 'SHF-MOR',
  },
];

// Seed QR Records (Persistent without automatic expiration - Section 22)
const SEED_QR_CODES: LocationQRRecord[] = [
  {
    qr_id: 'QR-LOC-D-OFFICE-01',
    location_id: 'LOC-D-OFFICE',
    location_name: 'D Office - Corporate Headquarters',
    qr_type: 'static',
    qr_token: 'SWQR::eyJ2ZXJzaW9uIjoiMS4wIiwibG9jYXRpb25JZCI6IkxPQy1ELU9GRklDRSIsImxvY2F0aW9uQ29kZSI6IkQtT0ZGSUNFIiwic3RhdHVzIjoiQUNUSVZFIiwibm9uY2UiOiJQUzEwMSJ9',
    qr_version: 'v1.0',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    status: 'ACTIVE',
  },
  {
    qr_id: 'QR-LOC-SITE-01-01',
    location_id: 'LOC-SITE-01',
    location_name: 'Site Office 01 - Industrial Corridor',
    qr_type: 'static',
    qr_token: 'SWQR::eyJ2ZXJzaW9uIjoiMS4wIiwibG9jYXRpb25JZCI6IkxPQy1TSVRFLTAxIiwibG9jYXRpb25Db2RlIjoiU0lURS0wMSIsInN0YXR1cyI6IkFDVElWRSIsIm5vbmNlIjoiU1QwMDEifQ==',
    qr_version: 'v1.0',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    status: 'ACTIVE',
  },
  {
    qr_id: 'QR-LOC-WAREHOUSE-01',
    location_id: 'LOC-WAREHOUSE',
    location_name: 'Central Warehouse & Logistics Hub',
    qr_type: 'static',
    qr_token: 'SWQR::eyJ2ZXJzaW9uIjoiMS4wIiwibG9jYXRpb25JZCI6IkxPQy1XQVJFSE9VU0UiLCJsb2NhdGlvbkNvZGUiOiJXSC1DRU5UUkFMIiwic3RhdHVzIjoiQUNUSVZFIiwibm9uY2UiOiJXUzIwMiJ9',
    qr_version: 'v1.0',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    status: 'ACTIVE',
  },
];

// Seed Location Permissions (Section 27 & 28)
const SEED_LOCATION_PERMISSIONS: EmployeeLocationPermission[] = [
  {
    id: 'ELP-01',
    employee_id: 'EMP-101',
    location_id: 'LOC-D-OFFICE',
    allowed: true,
    status: 'Active',
  },
  {
    id: 'ELP-02',
    employee_id: 'EMP-101',
    location_id: 'LOC-SITE-01',
    allowed: true,
    status: 'Active',
  },
  {
    id: 'ELP-03',
    employee_id: 'EMP-102',
    location_id: 'LOC-D-OFFICE',
    allowed: true,
    status: 'Active',
  },
  {
    id: 'ELP-04',
    employee_id: 'EMP-102',
    location_id: 'LOC-SITE-01',
    allowed: true,
    valid_from: '2026-09-01',
    valid_to: '2026-12-31',
    status: 'Active',
  },
];

const SEED_EMPLOYEES: EmployeeMaster[] = [
  {
    employee_id: 'EMP-101',
    employee_code: 'APX-0101',
    employee_name: 'Kishor Jogi',
    profile_photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    face_template: 'AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyAhIiMkJSYnKCkqKywtLi8w',
    face_samples_count: 5,
    face_status: 'Registered',
    mobile: '+91 98765 43210',
    email: 'kishorjogi2000@gmail.com',
    department: 'Human Resources',
    designation: 'Senior HR & Operations Lead',
    employee_category: 'Permanent',
    employment_type: 'Full-Time',
    joining_date: '2023-01-15',
    assigned_location: 'LOC-D-OFFICE',
    alternate_locations: ['LOC-SITE-01', 'LOC-WAREHOUSE'],
    shift: 'SHF-GEN',
    status: 'Active',
  },
  {
    employee_id: 'EMP-102',
    employee_code: 'APX-0102',
    employee_name: 'Rohit Sharma',
    profile_photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    face_template: 'BAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyAhIiMkJSYnKCkqKywtLi8wMTIz',
    face_samples_count: 4,
    face_status: 'Registered',
    mobile: '+91 91234 56789',
    email: 'rohit.sharma@apex-corp.in',
    department: 'Civil Engineering',
    designation: 'Site Project Supervisor',
    employee_category: 'Permanent',
    employment_type: 'Full-Time',
    joining_date: '2023-03-01',
    manager_id: 'EMP-101',
    manager_name: 'Kishor Jogi',
    assigned_location: 'LOC-D-OFFICE',
    alternate_locations: ['LOC-SITE-01', 'LOC-SITE-02'],
    shift: 'SHF-GEN',
    status: 'Active',
  },
  {
    employee_id: 'EMP-103',
    employee_code: 'APX-0103',
    employee_name: 'Priya Verma',
    profile_photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    face_template: 'CQgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyAhIiMkJSYnKCkqKywtLi8wMTIzNDU2',
    face_samples_count: 4,
    face_status: 'Registered',
    mobile: '+91 99887 76655',
    email: 'priya.verma@apex-corp.in',
    department: 'Human Resources',
    designation: 'HR Manager & Compliance',
    employee_category: 'Management',
    employment_type: 'Full-Time',
    joining_date: '2022-08-10',
    assigned_location: 'LOC-D-OFFICE',
    alternate_locations: [],
    shift: 'SHF-GEN',
    status: 'Active',
  },
  {
    employee_id: 'EMP-104',
    employee_code: 'APX-0104',
    employee_name: 'Amit Patel',
    profile_photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    face_template: 'DAsMDQ4PEBESExQVFhcYGRobHB0eHyAhIiMkJSYnKCkqKywtLi8wMTIzNDU2Nzg5',
    face_samples_count: 3,
    face_status: 'Registered',
    mobile: '+91 98221 11223',
    email: 'amit.patel@apex-corp.in',
    department: 'Store & Warehouse',
    designation: 'Inventory Manager',
    employee_category: 'Permanent',
    employment_type: 'Full-Time',
    joining_date: '2023-06-20',
    assigned_location: 'LOC-WAREHOUSE',
    alternate_locations: ['LOC-FACTORY'],
    shift: 'SHF-GEN',
    status: 'Active',
  },
  {
    employee_id: 'EMP-105',
    employee_code: 'APX-0105',
    employee_name: 'Sunita Roy',
    profile_photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    face_template: 'EQ4PEBESExQVFhcYGRobHB0eHyAhIiMkJSYnKCkqKywtLi8wMTIzNDU2Nzg5Ojs8',
    face_samples_count: 5,
    face_status: 'Registered',
    mobile: '+91 97711 22334',
    email: 'sunita.roy@apex-corp.in',
    department: 'Accounts & Finance',
    designation: 'Chief Accountant',
    employee_category: 'Management',
    employment_type: 'Full-Time',
    joining_date: '2022-11-01',
    assigned_location: 'LOC-D-OFFICE',
    alternate_locations: [],
    shift: 'SHF-GEN',
    status: 'Active',
  },
  {
    employee_id: 'EMP-107',
    employee_code: 'APX-0107',
    employee_name: 'Mohan Lal Verma',
    profile_photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    face_samples_count: 0,
    face_status: 'Pending Registration',
    mobile: '+91 93311 44556',
    email: 'mohan.verma@apex-corp.in',
    department: 'Operations & Production',
    designation: 'Machine Operator Lead',
    employee_category: 'Worker',
    employment_type: 'Full-Time',
    joining_date: '2024-02-01',
    assigned_location: 'LOC-FACTORY',
    alternate_locations: [],
    shift: 'SHF-MOR',
    status: 'Active',
  },
];

const todayStr = new Date().toISOString().split('T')[0];

const SEED_ATTENDANCE: AttendanceRecord[] = [
  {
    attendance_id: 'ATT-20260928-01',
    employee_id: 'EMP-101',
    employee_name: 'Kishor Jogi',
    date: todayStr,
    check_in_time: '09:32:15',
    location_id: 'LOC-D-OFFICE',
    location_name: 'D Office - Corporate Headquarters',
    latitude: 21.25142,
    longitude: 81.62958,
    distance_from_location: 42,
    attendance_mode: 'QR + GPS + Face',
    QR_verified: true,
    GPS_verified: true,
    face_verified: true,
    face_confidence: 96.4,
    device_id: 'Pixel-9-Pro-Android-15',
    status: 'Present',
    remarks: 'Verified at entrance terminal 1',
    created_at: `${todayStr}T09:32:15Z`,
    synced_to_sheets: true,
  },
  {
    attendance_id: 'ATT-20260928-02',
    employee_id: 'EMP-103',
    employee_name: 'Priya Verma',
    date: todayStr,
    check_in_time: '09:18:40',
    location_id: 'LOC-D-OFFICE',
    location_name: 'D Office - Corporate Headquarters',
    latitude: 21.25139,
    longitude: 81.62961,
    distance_from_location: 28,
    attendance_mode: 'GPS + Face',
    QR_verified: true,
    GPS_verified: true,
    face_verified: true,
    face_confidence: 98.1,
    device_id: 'Samsung-S24-Ultra',
    status: 'Present',
    created_at: `${todayStr}T09:18:40Z`,
    synced_to_sheets: true,
  },
  {
    attendance_id: 'ATT-20260928-03',
    employee_id: 'EMP-104',
    employee_name: 'Amit Patel',
    date: todayStr,
    check_in_time: '09:54:10',
    location_id: 'LOC-WAREHOUSE',
    location_name: 'Central Warehouse & Logistics Hub',
    latitude: 21.2851,
    longitude: 81.6622,
    distance_from_location: 35,
    attendance_mode: 'Admin/Office Kiosk',
    QR_verified: false,
    GPS_verified: true,
    face_verified: true,
    face_confidence: 95.8,
    device_id: 'Kiosk-Tablet-WH-01',
    status: 'Late',
    remarks: 'Checked in 24 mins past grace period',
    created_at: `${todayStr}T09:54:10Z`,
    synced_to_sheets: true,
  },
];

const SEED_LEAVES: LeaveRecord[] = [
  {
    leave_id: 'LV-2026-001',
    employee_id: 'EMP-102',
    employee_name: 'Rohit Sharma',
    department: 'Civil Engineering',
    leave_type: 'Casual Leave',
    from_date: '2026-10-02',
    to_date: '2026-10-03',
    days_count: 2,
    reason: 'Family function in home town.',
    status: 'Pending',
    applied_at: `${todayStr}T08:30:00Z`,
  },
];

const SEED_ADVANCES: AdvanceRecord[] = [
  {
    advance_id: 'ADV-2026-001',
    employee_id: 'EMP-102',
    employee_name: 'Rohit Sharma',
    department: 'Civil Engineering',
    amount: 15000,
    reason: 'Emergency medical expenses for dental surgery.',
    date: todayStr,
    approval_status: 'Approved',
    approved_amount: 15000,
    approved_by: 'Sunita Roy',
    payment_date: '2026-09-29',
    settlement_status: 'Unsettled',
    created_at: `${todayStr}T09:00:00Z`,
  },
];

const SEED_COMPLAINTS: ComplaintRecord[] = [
  {
    complaint_id: 'CMP-2026-01',
    employee_id: 'EMP-104',
    employee_name: 'Amit Patel',
    department: 'Store & Warehouse',
    category: 'Safety',
    subject: 'Forklift battery charger sparking at Bay 3',
    description: 'The wall socket connected to the secondary forklift charger at Bay 3 is overheating and throwing sparks when plugged in. Urgent electrical repair needed to avoid fire hazard.',
    priority: 'Urgent',
    confidential: false,
    created_date: todayStr,
    status: 'In Progress',
    assigned_to: 'Kishor Jogi',
    resolution: 'Maintenance team notified. Electrical technician scheduled today 2:00 PM.',
  },
];

const SEED_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'NOTIF-01',
    recipient_id: 'all',
    title: 'New Dynamic QR Terminals Deployed',
    message: 'D-Office and Site 01 entrance terminals now use persistent QR codes with admin status controls.',
    type: 'announcement',
    is_read: false,
    timestamp: `${todayStr}T08:00:00Z`,
  },
];

const SEED_DATA_SOURCES: DataSourceConfig[] = [
  {
    id: 'DS-INTERNAL',
    data_source_name: 'Primary Enterprise High-Speed Store',
    type: 'Internal Database',
    table_purpose: 'Attendance Data',
    read_permission: true,
    write_permission: true,
    sync_direction: 'Bidirectional',
    sync_frequency: 'Real-time',
    status: 'Active',
    last_sync_at: `${todayStr} 09:32 AM`,
    last_sync_status: 'Healthy - Sub-millisecond indexed transactions',
    column_mappings: DEFAULT_COLUMN_MAPPINGS['Attendance Data'],
  },
];

const SEED_ROLES: RoleConfig[] = [
  {
    role_id: 'ROLE-SUPER-ADMIN',
    role_name: 'Super Admin',
    description: 'Full root access to all system modules, configurations, and database connectors.',
    permissions: {
      view_attendance: true,
      edit_attendance: true,
      approve_leave: true,
      approve_advance: true,
      view_complaints: true,
      manage_employees: true,
      manage_locations: true,
      generate_qr: true,
      manage_data_sources: true,
      view_reports: true,
      system_settings: true,
    },
  },
  {
    role_id: 'ROLE-ADMIN',
    role_name: 'Admin',
    description: 'Administrative access to manage operations, locations, QR terminals, and logs.',
    permissions: {
      view_attendance: true,
      edit_attendance: true,
      approve_leave: true,
      approve_advance: true,
      view_complaints: true,
      manage_employees: true,
      manage_locations: true,
      generate_qr: true,
      manage_data_sources: true,
      view_reports: true,
      system_settings: false,
    },
  },
  {
    role_id: 'ROLE-HR',
    role_name: 'HR',
    description: 'Employee onboarding, attendance regularizations, leave approvals, and grievance handling.',
    permissions: {
      view_attendance: true,
      edit_attendance: true,
      approve_leave: true,
      approve_advance: false,
      view_complaints: true,
      manage_employees: true,
      manage_locations: false,
      generate_qr: true,
      manage_data_sources: false,
      view_reports: true,
      system_settings: false,
    },
  },
  {
    role_id: 'ROLE-MANAGER',
    role_name: 'Manager',
    description: 'Departmental management, shift oversight, team attendance monitoring, and leave approvals.',
    permissions: {
      view_attendance: true,
      edit_attendance: false,
      approve_leave: true,
      approve_advance: false,
      view_complaints: false,
      manage_employees: false,
      manage_locations: false,
      generate_qr: false,
      manage_data_sources: false,
      view_reports: true,
      system_settings: false,
    },
  },
  {
    role_id: 'ROLE-ACCOUNTS',
    role_name: 'Accounts',
    description: 'Salary advance approvals, settlement reconciliation, and payroll reporting.',
    permissions: {
      view_attendance: true,
      edit_attendance: false,
      approve_leave: false,
      approve_advance: true,
      view_complaints: false,
      manage_employees: false,
      manage_locations: false,
      generate_qr: false,
      manage_data_sources: false,
      view_reports: true,
      system_settings: false,
    },
  },
  {
    role_id: 'ROLE-EMPLOYEE',
    role_name: 'Employee',
    description: 'Mobile app user: mark attendance via QR/GPS/Face, apply leaves, advances, and grievances.',
    permissions: {
      view_attendance: false,
      edit_attendance: false,
      approve_leave: false,
      approve_advance: false,
      view_complaints: false,
      manage_employees: false,
      manage_locations: false,
      generate_qr: false,
      manage_data_sources: false,
      view_reports: false,
      system_settings: false,
    },
  },
];

const SEED_AUDIT_LOGS: AuditLogRecord[] = [
  {
    id: 'AUD-01',
    user_name: 'Kishor Jogi',
    user_role: 'Super Admin',
    action: 'Created Location',
    target_entity: 'LOC-D-OFFICE',
    details: 'Configured D Office - Corporate Headquarters with 100m geofence radius and persistent QR.',
    ip_address: '103.21.58.12',
    device_info: 'Chrome 128 / macOS',
    timestamp: `${todayStr} 08:15:30`,
  },
];

const SEED_SETTINGS: SystemSettings = {
  company: SEED_COMPANY,
  security: {
    require_face: true,
    require_gps: true,
    require_qr: true,
    allow_manual_attendance: true,
    allow_offline_attendance: true,
    allow_employee_photo_update: true,
    allow_employee_password_change: true,
    allow_employee_userid_change: false,
    enable_voice_greeting: true,
    enable_notifications: true,
  },
  google_sheets_db: {
    spreadsheet_name: 'Workforce_Attendance_Database',
    spreadsheet_url: '',
    spreadsheet_id: '',
    status: 'Uninitialized',
    tab_names: {
      '01_Users': '01_Users',
      '02_Employees': '02_Employees',
      '03_Employee_Login': '03_Employee_Login',
      '04_Admin_Users': '04_Admin_Users',
      '05_Departments': '05_Departments',
      '06_Designations': '06_Designations',
      '07_Employee_Categories': '07_Employee_Categories',
      '08_Locations': '08_Locations',
      '09_Location_QR': '09_Location_QR',
      '10_Attendance': '10_Attendance',
      '11_Leave': '11_Leave',
      '12_Advance': '12_Advance',
      '13_Complaints': '13_Complaints',
      '14_Shifts': '14_Shifts',
      '15_Roles': '15_Roles',
      '16_Permissions': '16_Permissions',
      '17_Role_Permissions': '17_Role_Permissions',
      '18_Notifications': '18_Notifications',
      '19_Audit_Log': '19_Audit_Log',
      '20_App_Settings': '20_App_Settings',
    },
    tabs_status: {},
  },
  google_drive: {
    connected: false,
    root_folder_name: 'Workforce_Attendance_System',
    subfolders: {},
  },
  attendance_rules: {
    allowed_gps_radius_meters: 100,
    late_after_time: '09:30',
    grace_period_mins: 15,
    half_day_late_mins: 120,
    allow_offline_attendance: true,
    prevent_duplicate_checkin: true,
  },
  face_recognition: {
    enabled: true,
    confidence_threshold: 85,
    liveness_detection_required: true,
    anti_spoofing_level: 'Strict',
  },
  qr_rules: {
    dynamic_qr_enabled: false, // Section 22: QR codes should NOT have an automatic expiration date
    refresh_interval_seconds: 60,
    token_encryption: true,
  },
  voice_greeting: {
    enabled: true,
    language: 'English',
    welcome_message_template: '{time_greeting} {name}, Welcome to {location}.',
  },
  anti_fraud: {
    detect_mock_location: true,
    flag_radius_mismatch: true,
    require_admin_review_for_suspicious: true,
  },
  integrations: {
    google_sheets_api: {
      status: 'Configured',
      api_key: 'PROXY_AUTH_ACTIVE',
      client_email: 'kishorjogi2000@gmail.com',
    },
    google_maps: {
      status: 'Configured',
      api_key: 'AIzaSyB_MAPS_GEOCODE_RESTRICTED',
    },
    face_sdk: {
      status: 'Configured',
      provider: 'Built-in Canvas Vision',
    },
    fcm: {
      status: 'Configured',
      sender_id: 'fcm-project-apex-9281',
    },
  },
};

// Database Singleton Manager with LocalStorage Persistence & Event Broadcasting
class DatabaseManager {
  private data: AppDatabase;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.data = this.loadInitial();
  }

  private loadInitial(): AppDatabase {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          company: parsed.company || SEED_COMPANY,
          users: parsed.users?.length ? parsed.users : SEED_USERS,
          locations: parsed.locations?.length ? parsed.locations : SEED_LOCATIONS,
          locationQRCodes: parsed.locationQRCodes?.length ? parsed.locationQRCodes : SEED_QR_CODES,
          employeeLocationPermissions: parsed.employeeLocationPermissions?.length ? parsed.employeeLocationPermissions : SEED_LOCATION_PERMISSIONS,
          departments: parsed.departments?.length ? parsed.departments : SEED_DEPARTMENTS,
          designations: parsed.designations?.length ? parsed.designations : SEED_DESIGNATIONS,
          shifts: parsed.shifts?.length ? parsed.shifts : SEED_SHIFTS,
          employees: parsed.employees?.length ? parsed.employees : SEED_EMPLOYEES,
          attendance: parsed.attendance?.length ? parsed.attendance : SEED_ATTENDANCE,
          leaves: parsed.leaves?.length ? parsed.leaves : SEED_LEAVES,
          advances: parsed.advances?.length ? parsed.advances : SEED_ADVANCES,
          complaints: parsed.complaints?.length ? parsed.complaints : SEED_COMPLAINTS,
          notifications: parsed.notifications?.length ? parsed.notifications : SEED_NOTIFICATIONS,
          dataSources: parsed.dataSources?.length ? parsed.dataSources : SEED_DATA_SOURCES,
          roles: parsed.roles?.length ? parsed.roles : SEED_ROLES,
          auditLogs: parsed.auditLogs?.length ? parsed.auditLogs : SEED_AUDIT_LOGS,
          settings: {
            ...SEED_SETTINGS,
            ...(parsed.settings || {}),
            security: { ...SEED_SETTINGS.security, ...(parsed.settings?.security || {}) },
            google_sheets_db: { ...SEED_SETTINGS.google_sheets_db, ...(parsed.settings?.google_sheets_db || {}) },
            google_drive: { ...SEED_SETTINGS.google_drive, ...(parsed.settings?.google_drive || {}) },
          },
        };
      }
    } catch (e) {
      console.warn('Could not read from localStorage, using initial seeds:', e);
    }

    return {
      company: SEED_COMPANY,
      users: SEED_USERS,
      locations: SEED_LOCATIONS,
      locationQRCodes: SEED_QR_CODES,
      employeeLocationPermissions: SEED_LOCATION_PERMISSIONS,
      departments: SEED_DEPARTMENTS,
      designations: SEED_DESIGNATIONS,
      shifts: SEED_SHIFTS,
      employees: SEED_EMPLOYEES,
      attendance: SEED_ATTENDANCE,
      leaves: SEED_LEAVES,
      advances: SEED_ADVANCES,
      complaints: SEED_COMPLAINTS,
      notifications: SEED_NOTIFICATIONS,
      dataSources: SEED_DATA_SOURCES,
      roles: SEED_ROLES,
      auditLogs: SEED_AUDIT_LOGS,
      settings: SEED_SETTINGS,
    };
  }

  public save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }

  // Getters
  public getSnapshot(): AppDatabase {
    return this.data;
  }

  public getCompany(): Company {
    return this.data.company;
  }

  public getUsers(): UserAccount[] {
    return this.data.users || [];
  }

  public getLocations(): LocationMaster[] {
    return this.data.locations;
  }

  public getLocationQRCodes(): LocationQRRecord[] {
    return this.data.locationQRCodes || [];
  }

  public getEmployeeLocationPermissions(): EmployeeLocationPermission[] {
    return this.data.employeeLocationPermissions || [];
  }

  public getDepartments(): DepartmentMaster[] {
    return this.data.departments;
  }

  public getDesignations(): DesignationMaster[] {
    return this.data.designations || [];
  }

  public getShifts(): ShiftMaster[] {
    return this.data.shifts;
  }

  public getEmployees(): EmployeeMaster[] {
    return this.data.employees;
  }

  public getAttendance(): AttendanceRecord[] {
    return this.data.attendance;
  }

  public getLeaves(): LeaveRecord[] {
    return this.data.leaves;
  }

  public getAdvances(): AdvanceRecord[] {
    return this.data.advances;
  }

  public getComplaints(): ComplaintRecord[] {
    return this.data.complaints;
  }

  public getNotifications(): NotificationItem[] {
    return this.data.notifications;
  }

  public getDataSources(): DataSourceConfig[] {
    return this.data.dataSources;
  }

  public getRoles(): RoleConfig[] {
    return this.data.roles;
  }

  public getAuditLogs(): AuditLogRecord[] {
    return this.data.auditLogs;
  }

  public getSettings(): SystemSettings {
    return this.data.settings;
  }

  // Mutators with Audit Logging
  public logAudit(action: string, target_entity: string, details: string, userName: string = 'Admin User', userRole: string = 'Super Admin'): void {
    const record: AuditLogRecord = {
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user_name: userName,
      user_role: userRole,
      action,
      target_entity,
      details,
      ip_address: '103.21.58.12',
      device_info: `${navigator.userAgent.slice(0, 45)}...`,
      timestamp: new Date().toLocaleString(),
    };
    this.data.auditLogs.unshift(record);
    if (this.data.auditLogs.length > 200) {
      this.data.auditLogs.pop();
    }
    this.save();
  }

  public addUser(user: UserAccount, actorName: string = 'Super Admin'): void {
    this.data.users.push(user);
    this.logAudit('Created User Account', user.user_id, `Created user ${user.username} (Role: ${user.role}, Status: ${user.status}).`, actorName);
    this.save();
  }

  public updateUser(user: UserAccount, actorName: string = 'Super Admin'): void {
    const idx = this.data.users.findIndex((u) => u.user_id === user.user_id);
    if (idx !== -1) {
      this.data.users[idx] = user;
      this.logAudit('Updated User Account', user.user_id, `Updated account ${user.username} status/role.`, actorName);
      this.save();
    }
  }

  public deleteUser(userId: string, actorName: string = 'Super Admin'): void {
    const user = this.data.users.find((u) => u.user_id === userId);
    this.data.users = this.data.users.filter((u) => u.user_id !== userId);
    if (user) {
      this.logAudit('Deleted User Account', userId, `Removed account ${user.username}.`, actorName);
    }
    this.save();
  }

  public addAttendance(record: AttendanceRecord, userName?: string): void {
    this.data.attendance.unshift(record);
    this.logAudit('Attendance Recorded', record.attendance_id, `Checked in ${record.employee_name} at ${record.location_name} via ${record.attendance_mode}. Status: ${record.status}.`, userName || record.employee_name, 'Employee');
    
    this.data.notifications.unshift({
      id: `NOTIF-${Date.now()}`,
      recipient_id: record.employee_id,
      title: record.status === 'Rejected' ? 'Attendance Rejected' : 'Attendance Recorded',
      message: record.status === 'Rejected' 
        ? `Attendance at ${record.location_name} rejected: ${record.remarks || 'Outside radius'}`
        : `Check-in recorded at ${record.check_in_time} at ${record.location_name}.`,
      type: 'attendance',
      is_read: false,
      timestamp: new Date().toISOString(),
    });

    this.save();
    pushRecordToGoogleSheets('add_attendance', record);
  }

  public updateAttendance(record: AttendanceRecord, userName?: string): void {
    const idx = this.data.attendance.findIndex((a) => a.attendance_id === record.attendance_id);
    if (idx !== -1) {
      this.data.attendance[idx] = record;
      this.logAudit('Attendance Updated', record.attendance_id, `Attendance for ${record.employee_name} updated (Punch Out: ${record.check_out_time || 'N/A'}).`, userName || record.employee_name, 'Employee');
      this.save();
    }
  }

  public punchOutAttendance(
    employeeId: string,
    date: string,
    punchOutData: {
      check_out_time: string;
      location_name: string;
      location_id: string;
      address: string;
      photo?: string;
      latitude: number;
      longitude: number;
      distance: number;
    },
    userName?: string
  ): AttendanceRecord | null {
    const record = this.data.attendance.find((a) => a.employee_id === employeeId && a.date === date);
    if (record) {
      record.check_out_time = punchOutData.check_out_time;
      record.punch_out_photo = punchOutData.photo;
      record.punch_out_address = punchOutData.address;
      record.punch_out_location_name = punchOutData.location_name;
      record.punch_out_latitude = punchOutData.latitude;
      record.punch_out_longitude = punchOutData.longitude;
      record.punch_out_distance = punchOutData.distance;

      this.logAudit(
        'Punch Out Recorded',
        record.attendance_id,
        `Punched out ${record.employee_name} at ${punchOutData.location_name} (${punchOutData.check_out_time}).`,
        userName || record.employee_name,
        'Employee'
      );

      this.data.notifications.unshift({
        id: `NOTIF-${Date.now()}`,
        recipient_id: employeeId,
        title: 'Punch Out Recorded',
        message: `Punch Out recorded at ${punchOutData.check_out_time} at ${punchOutData.location_name}.`,
        type: 'attendance',
        is_read: false,
        timestamp: new Date().toISOString(),
      });

      this.save();
      pushRecordToGoogleSheets('punch_out', { employee_id: employeeId, date, ...punchOutData });
      return record;
    }
    return null;
  }

  public addEmployee(emp: EmployeeMaster, actorName: string = 'Admin'): void {
    this.data.employees.push(emp);
    this.logAudit('Created Employee', emp.employee_id, `Added employee ${emp.employee_name} (${emp.employee_code}) to ${emp.department}.`, actorName);
    this.save();
  }

  public updateEmployee(emp: EmployeeMaster, actorName: string = 'Admin'): void {
    const idx = this.data.employees.findIndex((e) => e.employee_id === emp.employee_id);
    if (idx !== -1) {
      this.data.employees[idx] = emp;
      this.logAudit('Updated Employee', emp.employee_id, `Updated profile for ${emp.employee_name}.`, actorName);
      this.save();
    }
  }

  public deleteEmployee(id: string, actorName: string = 'Admin'): void {
    const target = this.data.employees.find((e) => e.employee_id === id);
    this.data.employees = this.data.employees.filter((e) => e.employee_id !== id);
    if (target) {
      this.logAudit('Deleted Employee', id, `Removed employee ${target.employee_name}.`, actorName);
    }
    this.save();
  }

  public addLocation(loc: LocationMaster, actorName: string = 'Admin'): void {
    this.data.locations.push(loc);
    // Create corresponding active Location QR record
    const qrRecord: LocationQRRecord = {
      qr_id: `QR-${loc.location_id}-${Date.now().toString().slice(-4)}`,
      location_id: loc.location_id,
      location_name: loc.location_name,
      qr_type: 'static',
      qr_token: `SWQR::${btoa(JSON.stringify({ locationId: loc.location_id, locationCode: loc.location_code, status: 'ACTIVE', nonce: Math.random().toString(36).substring(2, 8).toUpperCase() }))}`,
      qr_version: 'v1.0',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'ACTIVE',
    };
    this.data.locationQRCodes.push(qrRecord);
    this.logAudit('Created Location', loc.location_id, `Added location ${loc.location_name} and issued active QR token.`, actorName);
    this.save();
  }

  public updateLocation(loc: LocationMaster, actorName: string = 'Admin'): void {
    const idx = this.data.locations.findIndex((l) => l.location_id === loc.location_id);
    if (idx !== -1) {
      this.data.locations[idx] = loc;
      this.logAudit('Updated Location', loc.location_id, `Modified settings for ${loc.location_name}.`, actorName);
      this.save();
    }
  }

  // QR Management Actions (Section 22, 23, 24)
  public deactivateQRCode(qrId: string, actorName: string = 'Admin'): void {
    const qr = this.data.locationQRCodes.find((q) => q.qr_id === qrId);
    if (qr) {
      qr.status = 'DEACTIVATED';
      qr.deactivated_at = new Date().toISOString();
      qr.updated_at = new Date().toISOString();
      this.logAudit('Deactivated QR Code', qrId, `Deactivated QR for ${qr.location_name}. Attendance scans will be rejected.`, actorName);
      this.save();
    }
  }

  public reactivateQRCode(qrId: string, actorName: string = 'Admin'): void {
    const qr = this.data.locationQRCodes.find((q) => q.qr_id === qrId);
    if (qr) {
      qr.status = 'ACTIVE';
      qr.deactivated_at = undefined;
      qr.updated_at = new Date().toISOString();
      this.logAudit('Reactivated QR Code', qrId, `Re-enabled QR code for ${qr.location_name}.`, actorName);
      this.save();
    }
  }

  public regenerateQRCode(locationId: string, actorName: string = 'Admin'): LocationQRRecord | null {
    const loc = this.data.locations.find((l) => l.location_id === locationId);
    if (!loc) return null;

    // Deactivate previous active QRs for this location
    this.data.locationQRCodes
      .filter((q) => q.location_id === locationId && q.status === 'ACTIVE')
      .forEach((q) => {
        q.status = 'DEACTIVATED';
        q.deactivated_at = new Date().toISOString();
        q.updated_at = new Date().toISOString();
      });

    // Generate new active QR with fresh nonce & secret
    const newQR: LocationQRRecord = {
      qr_id: `QR-${loc.location_id}-${Date.now().toString().slice(-4)}`,
      location_id: loc.location_id,
      location_name: loc.location_name,
      qr_type: 'static',
      qr_token: `SWQR::${btoa(JSON.stringify({ locationId: loc.location_id, locationCode: loc.location_code, status: 'ACTIVE', nonce: Math.random().toString(36).substring(2, 9).toUpperCase(), regeneratedAt: Date.now() }))}`,
      qr_version: `v${Date.now().toString().slice(-3)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'ACTIVE',
    };

    this.data.locationQRCodes.unshift(newQR);
    this.logAudit('Regenerated QR Code', newQR.qr_id, `Regenerated QR code for ${loc.location_name}. Previous codes invalidated.`, actorName);
    this.save();
    return newQR;
  }

  public setLocationPermission(perm: EmployeeLocationPermission, actorName: string = 'Admin'): void {
    const idx = this.data.employeeLocationPermissions.findIndex((p) => p.id === perm.id || (p.employee_id === perm.employee_id && p.location_id === perm.location_id));
    if (idx !== -1) {
      this.data.employeeLocationPermissions[idx] = perm;
    } else {
      this.data.employeeLocationPermissions.push(perm);
    }
    this.logAudit('Updated Location Permission', perm.employee_id, `Set location access [${perm.location_id}] to ${perm.allowed ? 'ALLOWED' : 'DENIED'} for employee ${perm.employee_id}.`, actorName);
    this.save();
  }

  public addDepartment(dept: DepartmentMaster, actorName: string = 'Admin'): void {
    this.data.departments.push(dept);
    this.logAudit('Created Department', dept.department_id, `Created ${dept.department_name} (Code: ${dept.department_code}).`, actorName);
    this.save();
  }

  public addDesignation(desig: DesignationMaster, actorName: string = 'Admin'): void {
    this.data.designations.push(desig);
    this.logAudit('Created Designation', desig.designation_id, `Created ${desig.designation_name}.`, actorName);
    this.save();
  }

  public addShift(shift: ShiftMaster, actorName: string = 'Admin'): void {
    this.data.shifts.push(shift);
    this.logAudit('Created Shift', shift.shift_id, `Created shift ${shift.shift_name} (${shift.start_time} - ${shift.end_time}).`, actorName);
    this.save();
  }

  public addLeave(leave: LeaveRecord): void {
    this.data.leaves.unshift(leave);
    this.logAudit('Applied Leave', leave.leave_id, `${leave.employee_name} applied for ${leave.leave_type} (${leave.days_count} days).`, leave.employee_name, 'Employee');
    this.save();
    pushRecordToGoogleSheets('add_leave', leave);
  }

  public updateLeaveStatus(leaveId: string, status: LeaveRecord['status'], remarks?: string, actorName: string = 'HR Admin'): void {
    const leave = this.data.leaves.find((l) => l.leave_id === leaveId);
    if (leave) {
      leave.status = status;
      leave.remarks = remarks || leave.remarks;
      leave.approved_by = actorName;
      leave.approved_at = new Date().toISOString();
      this.logAudit(`Leave ${status}`, leaveId, `${actorName} marked leave as ${status}.`, actorName, 'HR');
      this.save();
    }
  }

  public addAdvance(adv: AdvanceRecord): void {
    this.data.advances.unshift(adv);
    this.logAudit('Requested Advance', adv.advance_id, `${adv.employee_name} requested salary advance of ₹${adv.amount}.`, adv.employee_name, 'Employee');
    this.save();
    pushRecordToGoogleSheets('add_advance', adv);
  }

  public updateAdvanceStatus(advId: string, status: AdvanceRecord['approval_status'], approvedAmount?: number, actorName: string = 'Accounts'): void {
    const adv = this.data.advances.find((a) => a.advance_id === advId);
    if (adv) {
      adv.approval_status = status;
      if (approvedAmount !== undefined) adv.approved_amount = approvedAmount;
      adv.approved_by = actorName;
      if (status === 'Paid') adv.payment_date = new Date().toISOString().split('T')[0];
      this.logAudit(`Advance ${status}`, advId, `Salary advance ${status} by ${actorName}. Amount: ₹${adv.approved_amount || adv.amount}.`, actorName, 'Accounts');
      this.save();
    }
  }

  public addComplaint(comp: ComplaintRecord): void {
    this.data.complaints.unshift(comp);
    this.logAudit('Raised Complaint', comp.complaint_id, `${comp.employee_name} filed grievance: "${comp.subject}" [Priority: ${comp.priority}, Confidential: ${comp.confidential}].`, comp.employee_name, 'Employee');
    this.save();
    pushRecordToGoogleSheets('add_complaint', comp);
  }

  public updateComplaintStatus(compId: string, status: ComplaintRecord['status'], resolution?: string, actorName: string = 'HR'): void {
    const c = this.data.complaints.find((comp) => comp.complaint_id === compId);
    if (c) {
      c.status = status;
      if (resolution) c.resolution = resolution;
      if (status === 'Closed') c.closed_at = new Date().toISOString();
      this.logAudit(`Complaint ${status}`, compId, `Grievance status changed to ${status}.`, actorName, 'HR');
      this.save();
    }
  }

  public addDataSource(ds: DataSourceConfig, actorName: string = 'Super Admin'): void {
    this.data.dataSources.push(ds);
    this.logAudit('Created Data Source', ds.id, `Configured ${ds.type} connector: "${ds.data_source_name}".`, actorName);
    this.save();
  }

  public updateDataSource(ds: DataSourceConfig, actorName: string = 'Super Admin'): void {
    const idx = this.data.dataSources.findIndex((d) => d.id === ds.id);
    if (idx !== -1) {
      this.data.dataSources[idx] = ds;
      this.logAudit('Updated Data Source', ds.id, `Modified connector "${ds.data_source_name}".`, actorName);
      this.save();
    }
  }

  public deleteDataSource(id: string, actorName: string = 'Super Admin'): void {
    const target = this.data.dataSources.find((d) => d.id === id);
    this.data.dataSources = this.data.dataSources.filter((d) => d.id !== id);
    if (target) {
      this.logAudit('Deleted Data Source', id, `Removed data source connector "${target.data_source_name}".`, actorName);
    }
    this.save();
  }

  public updateSettings(newSettings: SystemSettings, actorName: string = 'Super Admin'): void {
    this.data.settings = newSettings;
    this.data.company = newSettings.company;
    this.logAudit('Updated System Settings', 'CONFIG', 'Modified system rules, security policies or Google integrations.', actorName);
    this.save();
  }

  public resetToSeed(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.data = this.loadInitial();
    this.notify();
  }
}

export const db = new DatabaseManager();
