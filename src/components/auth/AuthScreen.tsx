import React, { useState } from 'react';
import {
  Building2,
  Lock,
  User,
  ShieldCheck,
  Eye,
  EyeOff,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { authService, AuthSession } from '../../services/auth';
import { db } from '../../services/db';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { PWAInstallModal } from '../common/PWAInstallModal';

interface AuthScreenProps {
  onLoginSuccess: (session: AuthSession, targetMode: 'admin' | 'mobile') => void;
  initialMode?: 'employee' | 'admin';
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess, initialMode = 'employee' }) => {
  const [authMode, setAuthMode] = useState<'employee' | 'admin'>(initialMode);
  const company = db.getCompany();

  // Form Fields
  const [loginId, setLoginId] = useState(initialMode === 'admin' ? 'admin' : 'kishor');
  const [password, setPassword] = useState(initialMode === 'admin' ? 'Admin@123' : 'Kishor@123');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Forgot Password Modal
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [forgotInput, setForgotInput] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otpStep, setOtpStep] = useState<1 | 2>(1);
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (authMode === 'admin') {
        const res = await authService.loginAdmin(loginId, password);
        if (res.success && res.session) {
          onLoginSuccess(res.session, 'admin');
        } else {
          setErrorMessage(res.message);
        }
      } else {
        const res = await authService.loginEmployee(loginId, password);
        if (res.success && res.session) {
          onLoginSuccess(res.session, 'mobile');
        } else {
          setErrorMessage(res.message);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotInput.trim()) return;
    const res = authService.requestForgotPasswordOTP(forgotInput);
    if (res.success && res.otp) {
      setForgotOtp(res.otp);
      setOtpStep(2);
      setForgotMsg(res.message);
    } else {
      setForgotMsg(res.message);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredOtp !== forgotOtp) {
      setForgotMsg('Invalid verification code entered.');
      return;
    }
    const res = await authService.resetPasswordWithOTP(forgotInput, newPassword);
    if (res.success) {
      alert('Password reset successfully. Please login with your new password.');
      setIsForgotModalOpen(false);
      setOtpStep(1);
      setForgotMsg(null);
    } else {
      setForgotMsg(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 font-sans relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10">
        {/* Company Logo & Branding */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/25">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">{company.company_name}</h1>
          <p className="text-xs text-slate-400">Smart Workforce Attendance & Management System</p>
        </div>

        {/* Login Type Tabs (Employee vs Admin) */}
        <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 mb-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setAuthMode('employee');
              setLoginId('kishor');
              setPassword('Kishor@123');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
              authMode === 'employee'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Employee Login</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('admin');
              setLoginId('admin');
              setPassword('Admin@123');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
              authMode === 'admin'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Login</span>
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 mb-1.5 font-medium">
              {authMode === 'admin' ? 'Admin ID / Username' : 'User ID / Employee Code'}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder={authMode === 'admin' ? 'e.g. admin or priya.hr' : 'e.g. kishor or APX-0101'}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-300 font-medium">Password</label>
              {authMode === 'employee' && (
                <button
                  type="button"
                  onClick={() => {
                    setForgotInput(loginId);
                    setForgotMsg(null);
                    setOtpStep(1);
                    setIsForgotModalOpen(true);
                  }}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-10 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-400">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded accent-indigo-600"
              />
              <span>Remember Me</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition mt-2"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            <span>{authMode === 'admin' ? 'Enter Admin Panel' : 'Sign In to Mobile Portal'}</span>
          </button>
        </form>

        {/* Quick Demo Credentials Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1.5">
          <div className="font-semibold text-slate-300">Quick Test Credentials:</div>
          <div className="flex justify-between font-mono text-[10px]">
            <span>Super Admin: <strong className="text-indigo-300">admin / Admin@123</strong></span>
            <span>HR: <strong className="text-indigo-300">priya.hr / Priya@123</strong></span>
          </div>
          <div className="flex justify-between font-mono text-[10px]">
            <span>Employee: <strong className="text-emerald-300">kishor / Kishor@123</strong></span>
            <span>New (First Login): <strong className="text-amber-300">mohan / Temp@123</strong></span>
          </div>
        </div>

        {/* Mobile APK / App Install Banner */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mobile phone par attendance?</span>
          </div>
          <button
            type="button"
            onClick={() => setIsInstallModalOpen(true)}
            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-[11px] border border-emerald-500/40 transition flex items-center gap-1"
          >
            Install Mobile APK
          </button>
        </div>
      </div>

      {/* PWA Mobile APK Install Modal */}
      <PWAInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        employeeName={loginId}
      />

      {/* Forgot Password Recovery Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-sm text-white">Reset Password</h3>
              </div>
              <button
                onClick={() => setIsForgotModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {forgotMsg && (
              <div className="p-3 rounded-xl bg-indigo-950/60 border border-indigo-800 text-indigo-300 text-xs">
                {forgotMsg}
              </div>
            )}

            {otpStep === 1 ? (
              <form onSubmit={handleRequestOtp} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Enter Username / Employee ID</label>
                  <input
                    type="text"
                    required
                    value={forgotInput}
                    onChange={(e) => setForgotInput(e.target.value)}
                    placeholder="e.g. kishor"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Send Verification Code
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Enter Verification Code</label>
                  <input
                    type="text"
                    required
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value)}
                    placeholder="6-digit OTP code"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-center tracking-widest text-sm"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">New Password (Min 8 chars, 1 uppercase, 1 special)</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="NewPassword@123"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Set New Password
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
