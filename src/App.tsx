import React, { useState, useEffect } from 'react';
import { UserRole } from './types';
import { AdminLayout, AdminTab } from './components/layout/AdminLayout';
import { DashboardView } from './components/admin/DashboardView';
import { AttendanceView } from './components/admin/AttendanceView';
import { LocationsView } from './components/admin/LocationsView';
import { QRManagementView } from './components/admin/QRManagementView';
import { EmployeesView } from './components/admin/EmployeesView';
import { BulkEmployeeImport } from './components/admin/BulkEmployeeImport';
import { DepartmentsView } from './components/admin/DepartmentsView';
import { ShiftsView } from './components/admin/ShiftsView';
import { LeaveManagementView } from './components/admin/LeaveManagementView';
import { AdvanceManagementView } from './components/admin/AdvanceManagementView';
import { ComplaintsView } from './components/admin/ComplaintsView';
import { DataSourcesView } from './components/admin/DataSourcesView';
import { GoogleSheetsDatabaseView } from './components/admin/GoogleSheetsDatabaseView';
import { GoogleDriveConfigView } from './components/admin/GoogleDriveConfigView';
import { UserManagementView } from './components/admin/UserManagementView';
import { ReportsView } from './components/admin/ReportsView';
import { RolesView } from './components/admin/RolesView';
import { AuditLogsView } from './components/admin/AuditLogsView';
import { SettingsView } from './components/admin/SettingsView';
import { SetupGuideModal } from './components/admin/SetupGuideModal';
import { OfficeKioskView } from './components/kiosk/OfficeKioskView';
import { MobileAppShell } from './components/mobile/MobileAppShell';
import { AuthScreen } from './components/auth/AuthScreen';
import { authService, AuthSession } from './services/auth';
import { OfflineIndicator } from './components/common/OfflineIndicator';

export type AppExperienceMode = 'admin' | 'mobile' | 'kiosk';

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(() => authService.getCurrentSession());
  const [experienceMode, setExperienceMode] = useState<AppExperienceMode>(() => {
    const s = authService.getCurrentSession();
    if (!s) return 'admin';
    return s.role === 'Employee' ? 'mobile' : 'admin';
  });
  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard');
  const [activeRole, setActiveRole] = useState<UserRole>(() => {
    const s = authService.getCurrentSession();
    return s && s.role !== 'Employee' ? s.role : 'Super Admin';
  });
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [selectedQRLocationId, setSelectedQRLocationId] = useState<string | undefined>(undefined);

  const handleSignOut = () => {
    authService.logout();
    setSession(null);
  };

  // If not logged in, display secure Auth Screen (Employee Login / Admin Login tabs)
  if (!session) {
    return (
      <>
        <AuthScreen
          onLoginSuccess={(newSession, targetMode) => {
            setSession(newSession);
            if (newSession.role === 'Employee') {
              setExperienceMode('mobile');
            } else {
              setExperienceMode(targetMode);
              setActiveRole(newSession.role);
            }
          }}
        />
        <OfflineIndicator />
      </>
    );
  }

  // Employee role cannot access Admin panel - strictly bound to Mobile portal
  const isEmployeeRole = session.role === 'Employee';

  // If in Mobile App Simulator
  if (experienceMode === 'mobile' || isEmployeeRole) {
    return (
      <>
        <MobileAppShell
          authSession={session}
          onSignOut={handleSignOut}
          onBackToAdmin={!isEmployeeRole ? () => setExperienceMode('admin') : undefined}
        />
        <OfflineIndicator />
      </>
    );
  }

  // If in Office Entrance Kiosk Terminal Mode
  if (experienceMode === 'kiosk') {
    return (
      <>
        <OfficeKioskView onBackToAdmin={() => setExperienceMode('admin')} />
        <OfflineIndicator />
      </>
    );
  }

  // Web-Based Admin Panel (Protected: Admin, HR, Manager, Accounts, Super Admin)
  return (
    <>
      <AdminLayout
        currentTab={adminTab}
        onTabChange={setAdminTab}
        activeRole={activeRole}
        onRoleChange={setActiveRole}
        onSwitchToMobile={() => setExperienceMode('mobile')}
        onSwitchToKiosk={() => setExperienceMode('kiosk')}
        onOpenDocs={() => setIsDocsOpen(true)}
        onSignOut={handleSignOut}
        userName={session.employeeName || session.user.username}
      >
        {adminTab === 'dashboard' && <DashboardView onNavigate={setAdminTab} />}
        {adminTab === 'attendance' && <AttendanceView />}
        {adminTab === 'locations' && (
          <LocationsView
            onSelectForQR={(loc) => {
              setSelectedQRLocationId(loc.location_id);
              setAdminTab('qr_management');
            }}
          />
        )}
        {adminTab === 'qr_management' && (
          <QRManagementView initialLocationId={selectedQRLocationId} />
        )}
        {adminTab === 'employees' && <EmployeesView />}
        {adminTab === 'bulk_import' && <BulkEmployeeImport />}
        {adminTab === 'departments' && <DepartmentsView />}
        {adminTab === 'shifts' && <ShiftsView />}
        {adminTab === 'leaves' && <LeaveManagementView activeRole={activeRole} />}
        {adminTab === 'advances' && <AdvanceManagementView activeRole={activeRole} />}
        {adminTab === 'complaints' && <ComplaintsView activeRole={activeRole} />}
        {adminTab === 'datasources' && <DataSourcesView />}
        {adminTab === 'google_sheets_db' && <GoogleSheetsDatabaseView />}
        {adminTab === 'google_drive' && <GoogleDriveConfigView />}
        {adminTab === 'reports' && <ReportsView />}
        {adminTab === 'users' && <UserManagementView />}
        {adminTab === 'roles' && <RolesView />}
        {adminTab === 'audit_logs' && <AuditLogsView />}
        {adminTab === 'settings' && <SettingsView />}
      </AdminLayout>

      <OfflineIndicator />

      {/* Setup Guide & Technical Architecture Documentation */}
      <SetupGuideModal isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} />
    </>
  );
}
