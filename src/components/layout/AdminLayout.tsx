import React, { useState } from 'react';
import {
  Building2,
  Users,
  MapPin,
  QrCode,
  Clock,
  CalendarCheck,
  CreditCard,
  AlertCircle,
  Database,
  ShieldCheck,
  FileText,
  Sliders,
  Bell,
  Smartphone,
  Monitor,
  Menu,
  X,
  Search,
  ExternalLink,
  BookOpen,
  History,
  Layers,
  Sparkles,
  FileSpreadsheet,
  FolderOpen,
  LogOut,
} from 'lucide-react';
import { Company, RoleConfig, UserRole } from '../../types';
import { db } from '../../services/db';
import { PWAInstallButton } from '../common/PWAInstallButton';

export type AdminTab =
  | 'dashboard'
  | 'employees'
  | 'bulk_import'
  | 'departments'
  | 'locations'
  | 'qr_management'
  | 'attendance'
  | 'leaves'
  | 'advances'
  | 'complaints'
  | 'shifts'
  | 'datasources'
  | 'google_sheets_db'
  | 'google_drive'
  | 'reports'
  | 'users'
  | 'roles'
  | 'audit_logs'
  | 'settings';

interface AdminLayoutProps {
  currentTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  activeRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onSwitchToMobile: () => void;
  onSwitchToKiosk: () => void;
  onOpenDocs: () => void;
  onSignOut?: () => void;
  userName?: string;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onTabChange,
  activeRole,
  onRoleChange,
  onSwitchToMobile,
  onSwitchToKiosk,
  onOpenDocs,
  onSignOut,
  userName = 'Admin User',
  children,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const company = db.getCompany();
  const notifications = db.getNotifications();
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const navItems: { id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }>; category: string; badge?: string | number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Layers, category: 'Core' },
    { id: 'attendance', label: 'Attendance Logs', icon: Clock, category: 'Attendance', badge: 'Live' },
    { id: 'locations', label: 'Locations & Geofence', icon: MapPin, category: 'Attendance' },
    { id: 'qr_management', label: 'Dynamic QR Studio', icon: QrCode, category: 'Attendance' },
    { id: 'employees', label: 'Employee Master', icon: Users, category: 'Workforce' },
    { id: 'bulk_import', label: 'Bulk CSV Import', icon: FileText, category: 'Workforce' },
    { id: 'departments', label: 'Departments', icon: Building2, category: 'Workforce' },
    { id: 'shifts', label: 'Shift Master', icon: Clock, category: 'Workforce' },
    { id: 'leaves', label: 'Leave Requests', icon: CalendarCheck, category: 'Workflows', badge: db.getLeaves().filter(l => l.status === 'Pending').length || undefined },
    { id: 'advances', label: 'Salary Advance', icon: CreditCard, category: 'Workflows', badge: db.getAdvances().filter(a => a.approval_status === 'Pending').length || undefined },
    { id: 'complaints', label: 'Grievance / Complaints', icon: AlertCircle, category: 'Workflows', badge: db.getComplaints().filter(c => c.status === 'Open').length || undefined },
    { id: 'datasources', label: 'Data Source Connectors', icon: Database, category: 'Data & Integrations' },
    { id: 'google_sheets_db', label: 'Google Sheets DB', icon: FileSpreadsheet, category: 'Data & Integrations', badge: '20 Tabs' },
    { id: 'google_drive', label: 'Google Drive Storage', icon: FolderOpen, category: 'Data & Integrations', badge: 'Picker' },
    { id: 'reports', label: 'Analytics & Reports', icon: FileText, category: 'Data & Integrations' },
    { id: 'users', label: 'User Accounts & RBAC', icon: Users, category: 'Administration' },
    { id: 'roles', label: 'Roles & Permissions', icon: ShieldCheck, category: 'Administration' },
    { id: 'audit_logs', label: 'Audit Trail', icon: History, category: 'Administration' },
    { id: 'settings', label: 'System Settings', icon: Sliders, category: 'Administration' },
  ];

  const categories = Array.from(new Set(navItems.map((item) => item.category)));

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Global Bar */}
      <header className="h-16 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-sm tracking-tight text-white flex items-center gap-2">
                {company.company_name}
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Enterprise
                </span>
              </div>
              <p className="text-xs text-slate-400">Smart Workforce & Attendance ERP</p>
            </div>
          </div>
        </div>

        {/* Center / Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Experience Switchers */}
          <div className="hidden md:flex items-center p-1 bg-slate-900/90 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => {}}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-medium shadow-sm"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Admin Panel</span>
            </button>
            <button
              onClick={onSwitchToMobile}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              title="Launch Simulated Android Mobile App"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Mobile App</span>
            </button>
            <button
              onClick={onSwitchToKiosk}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              title="Launch Office Entrance Kiosk Terminal"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Office Kiosk</span>
            </button>
          </div>

          {/* Mobile APK / Install App Button */}
          <PWAInstallButton variant="primary" />

          {/* Setup & API Guide */}
          <button
            onClick={onOpenDocs}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Setup & Docs</span>
          </button>

          {/* Role Impersonation Switcher */}
          <div className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60 text-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400 hidden xl:inline">Role:</span>
            <select
              value={activeRole}
              onChange={(e) => onRoleChange(e.target.value as UserRole)}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer text-xs"
            >
              <option value="Super Admin" className="bg-slate-900 text-white">Super Admin</option>
              <option value="Admin" className="bg-slate-900 text-white">Admin</option>
              <option value="HR" className="bg-slate-900 text-white">HR</option>
              <option value="Manager" className="bg-slate-900 text-white">Manager</option>
              <option value="Accounts" className="bg-slate-900 text-white">Accounts</option>
            </select>
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 relative transition"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                  <div className="font-semibold text-xs text-white">System Notifications</div>
                  <span className="text-[10px] text-slate-400">{notifications.length} total</span>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-3 text-xs hover:bg-slate-800/40 transition">
                      <div className="font-medium text-slate-200">{n.title}</div>
                      <p className="text-slate-400 text-[11px] mt-0.5">{n.message}</p>
                      <div className="text-[9px] text-slate-500 mt-1">
                        {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Current User Pill & Sign Out */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center font-bold text-xs text-indigo-300">
              {userName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'AD'}
            </div>
            <div className="text-left text-xs hidden lg:block">
              <div className="font-medium text-white leading-tight">{userName}</div>
              <div className="text-[10px] text-slate-400">{activeRole}</div>
            </div>
            {onSignOut && (
              <button
                onClick={onSignOut}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-700/60 transition ml-1"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-950 border-r border-slate-800/80
            transform transition-transform duration-200 ease-in-out flex flex-col pt-16 lg:pt-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          <div className="p-4 border-b border-slate-800/50">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Workforce Navigation
            </div>
            {/* Mobile / Kiosk shortcuts on mobile view */}
            <div className="grid grid-cols-2 gap-2 lg:hidden mb-2">
              <button
                onClick={onSwitchToMobile}
                className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-medium"
              >
                <Smartphone className="w-3.5 h-3.5" /> Mobile App
              </button>
              <button
                onClick={onSwitchToKiosk}
                className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-amber-950/60 border border-amber-800 text-amber-300 text-xs font-medium"
              >
                <Sparkles className="w-3.5 h-3.5" /> Kiosk Terminal
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
            {categories.map((cat) => (
              <div key={cat} className="space-y-1">
                <div className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {cat}
                </div>
                {navItems
                  .filter((item) => item.category === cat)
                  .map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onTabChange(item.id);
                          setSidebarOpen(false);
                        }}
                        className={`
                          w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition
                          ${
                            isActive
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                          }
                        `}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge !== undefined && (
                          <span
                            className={`
                              px-1.5 py-0.5 rounded text-[10px] font-bold
                              ${
                                typeof item.badge === 'number'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              }
                            `}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>
            ))}
          </div>

          {/* Sidebar Footer info */}
          <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 text-center">
            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>All Systems Operational</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">v2.4 Enterprise Production</p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-900 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
};
