import { AccountStatus, UserAccount, UserRole } from '../types';
import { db } from './db';

// Cryptographic hash simulation using Web Crypto API SHA-256
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + ':workforce_salt_v2');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function validatePasswordStrength(password: string): { isValid: boolean; message?: string } {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long.' };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter.' };
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one special character.' };
  }
  return { isValid: true };
}

export interface AuthSession {
  user: UserAccount;
  role: UserRole;
  employeeId?: string;
  employeeName: string;
  isFirstLogin: boolean;
  token: string;
}

const SESSION_KEY = 'WORKFORCE_AUTH_SESSION_V2';

export const authService = {
  // Login Employee
  async loginEmployee(loginId: string, passwordPlain: string): Promise<{ success: boolean; session?: AuthSession; message: string; requiresPasswordChange?: boolean }> {
    const users = db.getUsers();
    const employees = db.getEmployees();

    const normalized = loginId.trim().toLowerCase();
    // Match by user_id, username, or employee_id
    const user = users.find(
      (u) =>
        u.user_id.toLowerCase() === normalized ||
        u.username.toLowerCase() === normalized ||
        u.employee_id.toLowerCase() === normalized
    );

    if (!user) {
      return { success: false, message: 'Invalid User ID or Employee Code.' };
    }

    // Check account status (Section 8)
    if (user.status !== 'Active' && user.status !== 'Pending') {
      return {
        success: false,
        message: `Your account is currently ${user.status.toLowerCase()}. Please contact HR/Admin.`,
      };
    }

    // Verify Password Hash
    const hashedInput = await hashPassword(passwordPlain);
    const isTempMatch = user.temp_password && user.temp_password === passwordPlain;
    const isHashMatch = user.password_hash === hashedInput;

    if (!isHashMatch && !isTempMatch) {
      // Increment failed attempts
      user.failed_attempts = (user.failed_attempts || 0) + 1;
      if (user.failed_attempts >= 5) {
        user.status = 'Blocked';
        db.updateUser(user);
        return { success: false, message: 'Account locked due to 5 consecutive failed login attempts.' };
      }
      db.updateUser(user);
      return { success: false, message: 'Incorrect password. Please try again.' };
    }

    // Reset failed attempts & record login
    user.failed_attempts = 0;
    user.last_login = new Date().toISOString();
    db.updateUser(user);

    const emp = employees.find((e) => e.employee_id === user.employee_id);
    const empName = emp ? emp.employee_name : user.username;

    const session: AuthSession = {
      user,
      role: user.role,
      employeeId: user.employee_id,
      employeeName: empName,
      isFirstLogin: user.first_login,
      token: `AUTH_TOK_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    db.logAudit('Employee Login', user.user_id, `Employee ${empName} logged into mobile portal.`, empName, user.role);

    return {
      success: true,
      session,
      message: 'Login successful',
      requiresPasswordChange: user.first_login,
    };
  },

  // Login Administrator (Section 2)
  async loginAdmin(adminId: string, passwordPlain: string): Promise<{ success: boolean; session?: AuthSession; message: string }> {
    const users = db.getUsers();
    const normalized = adminId.trim().toLowerCase();

    const user = users.find(
      (u) =>
        (u.user_id.toLowerCase() === normalized || u.username.toLowerCase() === normalized) &&
        (u.role === 'Super Admin' || u.role === 'Admin' || u.role === 'HR' || u.role === 'Manager' || u.role === 'Accounts')
    );

    if (!user) {
      return { success: false, message: 'Invalid Admin ID or credentials.' };
    }

    if (user.status !== 'Active') {
      return { success: false, message: `Admin account is ${user.status.toLowerCase()}. Access denied.` };
    }

    const hashedInput = await hashPassword(passwordPlain);
    const isTempMatch = user.temp_password && user.temp_password === passwordPlain;
    if (user.password_hash !== hashedInput && !isTempMatch) {
      return { success: false, message: 'Incorrect administrator password.' };
    }

    user.last_login = new Date().toISOString();
    db.updateUser(user);

    const employees = db.getEmployees();
    const emp = employees.find((e) => e.employee_id === user.employee_id);
    const name = emp ? emp.employee_name : user.username;

    const session: AuthSession = {
      user,
      role: user.role,
      employeeId: user.employee_id,
      employeeName: name,
      isFirstLogin: user.first_login,
      token: `ADMIN_TOK_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    db.logAudit('Admin Login', user.user_id, `Administrator ${name} (${user.role}) logged into Admin Panel.`, name, user.role);

    return { success: true, session, message: 'Administrator authenticated successfully.' };
  },

  // Change Password
  async changePassword(userId: string, newPasswordPlain: string): Promise<{ success: boolean; message: string }> {
    const strength = validatePasswordStrength(newPasswordPlain);
    if (!strength.isValid) {
      return { success: false, message: strength.message || 'Password does not meet complexity requirements.' };
    }

    const user = db.getUsers().find((u) => u.user_id === userId);
    if (!user) return { success: false, message: 'User record not found.' };

    const newHash = await hashPassword(newPasswordPlain);
    user.password_hash = newHash;
    user.temp_password = undefined;
    user.first_login = false;
    user.password_changed_at = new Date().toISOString();
    user.status = 'Active';

    db.updateUser(user);
    db.logAudit('Password Changed', userId, `User ${user.username} updated account password.`, user.username, user.role);

    // Update active session if matching
    const current = this.getCurrentSession();
    if (current && current.user.user_id === userId) {
      current.user = user;
      current.isFirstLogin = false;
      localStorage.setItem(SESSION_KEY, JSON.stringify(current));
    }

    return { success: true, message: 'Password updated successfully.' };
  },

  // Forgot password OTP Request Simulation (Section 17)
  requestForgotPasswordOTP(identifier: string): { success: boolean; otp?: string; message: string } {
    const user = db.getUsers().find(
      (u) =>
        u.user_id.toLowerCase() === identifier.trim().toLowerCase() ||
        u.username.toLowerCase() === identifier.trim().toLowerCase() ||
        u.employee_id.toLowerCase() === identifier.trim().toLowerCase()
    );

    if (!user) {
      return { success: false, message: 'No registered user matches the provided identifier.' };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    return {
      success: true,
      otp,
      message: `Verification code sent to registered mobile/email for user ${user.username}. (Demo OTP: ${otp})`,
    };
  },

  // Reset password via OTP
  async resetPasswordWithOTP(identifier: string, newPasswordPlain: string): Promise<{ success: boolean; message: string }> {
    const strength = validatePasswordStrength(newPasswordPlain);
    if (!strength.isValid) {
      return { success: false, message: strength.message || 'Password does not meet requirements.' };
    }

    const user = db.getUsers().find(
      (u) =>
        u.user_id.toLowerCase() === identifier.trim().toLowerCase() ||
        u.username.toLowerCase() === identifier.trim().toLowerCase() ||
        u.employee_id.toLowerCase() === identifier.trim().toLowerCase()
    );

    if (!user) return { success: false, message: 'User not found.' };

    user.password_hash = await hashPassword(newPasswordPlain);
    user.password_changed_at = new Date().toISOString();
    user.status = 'Active';
    user.first_login = false;
    db.updateUser(user);

    return { success: true, message: 'Password has been reset successfully. You can now login.' };
  },

  // Get current active session
  getCurrentSession(): AuthSession | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  // Logout
  logout(): void {
    const current = this.getCurrentSession();
    if (current) {
      db.logAudit('User Logout', current.user.user_id, `User ${current.employeeName} signed out.`, current.employeeName, current.role);
    }
    localStorage.removeItem(SESSION_KEY);
  },
};
