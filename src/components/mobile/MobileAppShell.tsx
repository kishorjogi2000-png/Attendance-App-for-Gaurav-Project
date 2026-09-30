import React, { useState, useEffect, useRef } from 'react';
import {
  Smartphone,
  MapPin,
  Camera,
  QrCode,
  CalendarCheck,
  CreditCard,
  AlertCircle,
  Clock,
  Bell,
  User,
  CheckCircle2,
  XCircle,
  Wifi,
  WifiOff,
  Battery,
  ShieldCheck,
  ArrowLeft,
  Send,
  Sparkles,
  Volume2,
  RefreshCw,
  X,
  Compass,
  Upload,
  Image as ImageIcon,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  Settings,
  Shield,
  Check,
  RotateCcw,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  AttendanceMode,
  ComplaintCategory,
  ComplaintPriority,
  EmployeeMaster,
  LeaveType,
  LocationMaster,
} from '../../types';
import { db } from '../../services/db';
import { calculateDistanceMeters, formatDistance } from '../../services/geoUtils';
import {
  analyzeLivenessFrame,
  compareFaceTemplates,
  extractFaceTemplateFromCanvas,
} from '../../services/faceVerification';
import { playVoiceGreeting } from '../../services/voiceService';
import { validateQRToken } from '../../services/qrSecurity';
import { getOfflineQueue, saveOfflineAttendance, syncOfflineQueue } from '../../services/offlineSync';
import { authService, AuthSession, validatePasswordStrength } from '../../services/auth';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { PWAInstallModal } from '../common/PWAInstallModal';

export interface MobileAppShellProps {
  onBackToAdmin?: () => void;
  authSession?: AuthSession | null;
  onSignOut?: () => void;
}

export type MobileTab = 'home' | 'attendance_history' | 'requests' | 'notifications' | 'profile';

export const MobileAppShell: React.FC<MobileAppShellProps> = ({
  onBackToAdmin,
  authSession,
  onSignOut,
}) => {
  const employees = db.getEmployees();
  const locations = db.getLocations();
  const settings = db.getSettings();

  // Active simulated mobile employee
  const [selectedEmpId, setSelectedEmpId] = useState<string>(() => {
    if (authSession?.employeeId) return authSession.employeeId;
    return employees[0]?.employee_id || '';
  });

  const activeEmp = employees.find((e) => e.employee_id === selectedEmpId) || employees[0];

  const [activeTab, setActiveTab] = useState<MobileTab>('home');
  const [isPwaModalOpen, setIsPwaModalOpen] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(() => getOfflineQueue().length);

  // Clock
  const [currentTime, setCurrentTime] = useState<string>(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );

  // Permissions & Sensor state
  const [cameraPermission, setCameraPermission] = useState<'prompt' | 'granted' | 'denied'>('granted');
  const [locationPermission, setLocationPermission] = useState<'prompt' | 'precise' | 'approximate' | 'denied'>('precise');
  const [gpsEnabled, setGpsEnabled] = useState<boolean>(true);
  const [isMockLocation, setIsMockLocation] = useState<boolean>(false);

  // Permission Modals
  const [isCameraPermModalOpen, setIsCameraPermModalOpen] = useState(false);
  const [isLocationPermModalOpen, setIsLocationPermModalOpen] = useState(false);
  const [cameraPermDeniedAlert, setCameraPermDeniedAlert] = useState(false);

  // First Login Onboarding Flow (Section 3)
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(
    authSession?.isFirstLogin ?? false
  );
  const [onboardingStep, setOnboardingStep] = useState<1 | 2 | 3 | 4>(1); // 1: Password, 2: Photo, 3: Face, 4: Permissions
  const [onboardTempPass, setOnboardTempPass] = useState(authSession?.user?.temp_password || 'Temp@123');
  const [onboardNewPass, setOnboardNewPass] = useState('');
  const [onboardConfirmPass, setOnboardConfirmPass] = useState('');
  const [onboardShowPass, setOnboardShowPass] = useState(false);
  const [onboardPassError, setOnboardPassError] = useState<string | null>(null);

  // Face Registration Modal (Standalone & Onboarding)
  const [isFaceRegModalOpen, setIsFaceRegModalOpen] = useState(false);
  const [faceRegStep, setFaceRegStep] = useState<1 | 2 | 3>(1); // 1: Camera stream & capture 3 samples, 2: Liveness check, 3: Success
  const [faceSamples, setFaceSamples] = useState<string[]>([]);
  const [faceRegLivenessStatus, setFaceRegLivenessStatus] = useState<'idle' | 'analyzing' | 'passed' | 'failed'>('idle');
  const [showFaceRegRequiredAlert, setShowFaceRegRequiredAlert] = useState(false);

  // Profile Photo Update Modal (Section 4)
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Change Password Modal (Normal profile)
  const [isChangePassModalOpen, setIsChangePassModalOpen] = useState(false);
  const [currentPassInput, setCurrentPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [changePassError, setChangePassError] = useState<string | null>(null);
  const [changePassSuccess, setChangePassSuccess] = useState<string | null>(null);

  // Punch In / Punch Out Mode & Photo with Location Stamp
  const [punchActionType, setPunchActionType] = useState<'in' | 'out'>('in');
  const [capturedPunchPhoto, setCapturedPunchPhoto] = useState<string | null>(null);
  const [enlargedPhotoUrl, setEnlargedPhotoUrl] = useState<string | null>(null);
  const [voiceGreetingLanguage, setVoiceGreetingLanguage] = useState<'Hindi' | 'English' | 'Hinglish'>('Hindi');
  const [isVoiceTesting, setIsVoiceTesting] = useState<boolean>(false);

  const handleTestVoiceGreeting = async (punchType?: 'in' | 'out') => {
    const type = punchType || (!todayRecord ? 'in' : !todayRecord.check_out_time ? 'out' : 'in');
    setIsVoiceTesting(true);
    await playVoiceGreeting(activeEmp.employee_name, targetLocation.location_name, {
      enabled: true,
      language: voiceGreetingLanguage,
      punchType: type,
    });
    setIsVoiceTesting(false);
  };

  // Mark Attendance Modal Flow
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState<boolean>(false);
  const [checkInStep, setCheckInStep] = useState<1 | 2 | 3 | 4>(1); // 1: GPS, 2: QR, 3: Face Liveness, 4: Success
  const [targetLocationId, setTargetLocationId] = useState<string>(activeEmp?.assigned_location || locations[0]?.location_id);
  const targetLocation = locations.find((l) => l.location_id === targetLocationId) || locations[0];

  // Simulated GPS Coordinates
  const [userLat, setUserLat] = useState<number>(targetLocation?.latitude || 21.2514);
  const [userLon, setUserLon] = useState<number>(targetLocation?.longitude || 81.6296);
  const [simulatedDistance, setSimulatedDistance] = useState<number>(38); // within 100m default

  // QR Scan Step
  const [scannedQRInput, setScannedQRInput] = useState<string>('');
  const [qrVerified, setQrVerified] = useState<boolean>(false);
  const [qrErrorMessage, setQrErrorMessage] = useState<string>('');

  // Face Camera Step
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [livenessStage, setLivenessStage] = useState<'prompt' | 'verifying' | 'passed' | 'failed'>('prompt');
  const [faceConfidence, setFaceConfidence] = useState<number>(96.4);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Requests Forms
  const [requestType, setRequestType] = useState<'leave' | 'advance' | 'complaint'>('leave');
  const [leaveType, setLeaveType] = useState<LeaveType>('Casual Leave');
  const [leaveFrom, setLeaveFrom] = useState<string>(new Date().toISOString().split('T')[0]);
  const [leaveTo, setLeaveTo] = useState<string>(new Date().toISOString().split('T')[0]);
  const [leaveReason, setLeaveReason] = useState<string>('');
  const [advanceAmount, setAdvanceAmount] = useState<number>(10000);
  const [advanceReason, setAdvanceReason] = useState<string>('');
  const [complaintCategory, setComplaintCategory] = useState<ComplaintCategory>('Workplace');
  const [complaintPriority, setComplaintPriority] = useState<ComplaintPriority>('Medium');
  const [complaintSubject, setComplaintSubject] = useState<string>('');
  const [complaintDesc, setComplaintDesc] = useState<string>('');
  const [complaintConfidential, setComplaintConfidential] = useState<boolean>(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Ticker for current time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute live distance whenever target location changes
  useEffect(() => {
    if (targetLocation) {
      const dist = calculateDistanceMeters(userLat, userLon, targetLocation.latitude, targetLocation.longitude);
      setSimulatedDistance(dist);
    }
  }, [userLat, userLon, targetLocationId]);

  // Today's attendance for active employee
  const todayStr = new Date().toISOString().split('T')[0];
  const myAttendanceRecords = db.getAttendance().filter((a) => a.employee_id === activeEmp?.employee_id);
  const todayRecord = myAttendanceRecords.find((a) => a.date === todayStr);

  // Camera helpers
  const startCamera = async () => {
    if (cameraPermission === 'denied') {
      setCameraPermDeniedAlert(true);
      return;
    }
    try {
      setCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 360, height: 360, facingMode: 'user' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (e) {
      console.warn('Camera stream fallback active:', e);
      setCameraActive(true); // show simulated visual stream
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Open Attendance Flow with Permission & Face Registration guards
  const handleOpenAttendanceFlow = (action: 'in' | 'out' = 'in') => {
    setPunchActionType(action);
    setCapturedPunchPhoto(null);

    // Section 8: Check Account Status
    if (authSession?.user && authSession.user.status !== 'Active' && authSession.user.status !== 'Pending') {
      alert(`Your account status is ${authSession.user.status}. You cannot mark attendance.`);
      return;
    }

    // Section 5: Do not allow attendance through face recognition until face registration is completed
    if (targetLocation.face_required && activeEmp.face_status !== 'Registered') {
      setShowFaceRegRequiredAlert(true);
      return;
    }

    // Section 7: Location permission & GPS guard
    if (locationPermission === 'denied' || !gpsEnabled) {
      setIsLocationPermModalOpen(true);
      return;
    }

    if (isMockLocation) {
      alert('Mock location detected! Real GPS coordinates are strictly required to record attendance.');
      return;
    }

    // Friendly confirmation if re-punching in
    if (action === 'in' && todayRecord && !todayRecord.check_out_time) {
      const confirmRe = window.confirm(
        `You have already punched in today at ${todayRecord.check_in_time}. Do you want to update your Punch In?`
      );
      if (!confirmRe) return;
    }

    setCheckInStep(1);
    setQrVerified(false);
    setQrErrorMessage('');
    setLivenessStage('prompt');
    setIsCheckInModalOpen(true);
  };

  // Step 1: GPS Verification
  const handleGPSNext = () => {
    if (!gpsEnabled || locationPermission === 'denied') {
      setIsLocationPermModalOpen(true);
      return;
    }

    if (isMockLocation) {
      alert('Mock location detected! Attendance cannot be verified.');
      return;
    }

    if (simulatedDistance > targetLocation.allowed_radius_meters) {
      alert(
        `You are outside the permitted attendance location! (Distance: ${simulatedDistance}m, Allowed: ${targetLocation.allowed_radius_meters}m)`
      );
      return;
    }

    if (targetLocation.qr_required) {
      setCheckInStep(2);
    } else if (targetLocation.face_required) {
      if (cameraPermission === 'denied') {
        setCameraPermDeniedAlert(true);
        return;
      }
      setCheckInStep(3);
      startCamera();
    } else {
      const stampedPhoto = captureSelfieWithLocationStamp();
      finalizeAttendance('GPS + Face', stampedPhoto);
    }
  };

  // Step 2: QR Validation
  const handleQRVerify = () => {
    const res = validateQRToken(scannedQRInput, targetLocation.location_id, targetLocation.QR_secret);
    if (res.isValid) {
      setQrVerified(true);
      setQrErrorMessage('');
      if (targetLocation.face_required) {
        if (cameraPermission === 'denied') {
          setCameraPermDeniedAlert(true);
          return;
        }
        setCheckInStep(3);
        startCamera();
      } else {
        const stampedPhoto = captureSelfieWithLocationStamp();
        finalizeAttendance('QR + GPS + Face', stampedPhoto);
      }
    } else {
      setQrErrorMessage(res.message);
    }
  };

  // Generate Real-time Photo with Burned-in Location & Timestamp Watermark
  const captureSelfieWithLocationStamp = (): string => {
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return activeEmp.profile_photo;

    // 1. Draw base frame from video stream or employee reference portrait
    if (videoRef.current && videoRef.current.videoWidth > 0) {
      ctx.drawImage(videoRef.current, 0, 0, 480, 480);
    } else {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 480, 480);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = activeEmp.profile_photo;
      try {
        ctx.drawImage(img, 60, 20, 360, 360);
      } catch {
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(0, 0, 480, 480);
      }
    }

    // 2. Draw modern translucent watermark panel at bottom
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.fillRect(0, 355, 480, 125);

    // Accent line
    ctx.fillStyle = punchActionType === 'in' ? '#10b981' : '#f59e0b';
    ctx.fillRect(0, 352, 480, 3);

    // Text: Punch Action & Employee Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(
      `${punchActionType === 'in' ? '🟢 PUNCH IN' : '🟠 PUNCH OUT'}: ${activeEmp.employee_name} (${activeEmp.employee_code})`,
      14,
      378
    );

    // Text: Office Location Name
    ctx.fillStyle = '#93c5fd';
    ctx.font = '12px sans-serif';
    ctx.fillText(`📍 ${targetLocation.location_name}`, 14, 400);

    // Text: Office Address
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '11px sans-serif';
    ctx.fillText(`${targetLocation.address.slice(0, 52)}...`, 14, 420);

    // Text: GPS Coordinates & Distance & Timestamp
    ctx.fillStyle = '#f1f5f9';
    ctx.font = '10px monospace';
    const nowTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const nowDateStr = new Date().toISOString().split('T')[0];
    ctx.fillText(`🌐 Lat: ${userLat.toFixed(4)}, Lon: ${userLon.toFixed(4)} | Dist: ${simulatedDistance}m`, 14, 442);

    ctx.fillStyle = '#a7f3d0';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText(`✓ GPS GEOFENCE & FACE MATCH (${faceConfidence}%) • ${nowDateStr} ${nowTimeStr}`, 14, 464);

    return canvas.toDataURL('image/jpeg', 0.92);
  };

  // Step 3: Face Liveness & Selfie Matching
  const handleFaceVerify = () => {
    setLivenessStage('verifying');
    setTimeout(() => {
      setLivenessStage('passed');
      stopCamera();
      const stampedPhoto = captureSelfieWithLocationStamp();
      finalizeAttendance(targetLocation.qr_required ? 'QR + GPS + Face' : 'GPS + Face', stampedPhoto);
    }, 1200);
  };

  // Step 4: Finalize & Personalized Voice Greeting with Employee Name
  const finalizeAttendance = (mode: AttendanceMode, stampedPhoto: string) => {
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (punchActionType === 'out') {
      // Punch Out update
      const updated = db.punchOutAttendance(
        activeEmp.employee_id,
        todayStr,
        {
          check_out_time: nowTime,
          location_name: targetLocation.location_name,
          location_id: targetLocation.location_id,
          address: targetLocation.address,
          photo: stampedPhoto,
          latitude: userLat,
          longitude: userLon,
          distance: simulatedDistance,
        },
        activeEmp.employee_name
      );

      // If no previous check-in for today exists, create a direct punch-out record
      if (!updated) {
        const directOutRecord = {
          attendance_id: `ATT-MOB-${Date.now().toString().slice(-6)}`,
          employee_id: activeEmp.employee_id,
          employee_name: activeEmp.employee_name,
          date: todayStr,
          check_in_time: '--:--',
          check_out_time: nowTime,
          location_id: targetLocation.location_id,
          location_name: targetLocation.location_name,
          latitude: userLat,
          longitude: userLon,
          distance_from_location: simulatedDistance,
          attendance_mode: mode,
          QR_verified: targetLocation.qr_required ? true : false,
          GPS_verified: true,
          face_verified: targetLocation.face_required ? true : false,
          face_confidence: faceConfidence,
          device_id: 'Pixel-9-Pro-Android-15',
          status: simulatedDistance <= targetLocation.allowed_radius_meters ? 'Present' : 'Rejected',
          remarks: 'Direct Punch Out via Mobile App',
          created_at: new Date().toISOString(),
          punch_out_photo: stampedPhoto,
          punch_out_location_name: targetLocation.location_name,
          punch_out_address: targetLocation.address,
        };
        if (isOffline) {
          saveOfflineAttendance(directOutRecord as any);
          setOfflineQueueCount(getOfflineQueue().length);
        } else {
          db.addAttendance(directOutRecord as any, activeEmp.employee_name);
        }
      }
    } else {
      // Punch In creation
      const newRecord = {
        attendance_id: `ATT-MOB-${Date.now().toString().slice(-6)}`,
        employee_id: activeEmp.employee_id,
        employee_name: activeEmp.employee_name,
        date: todayStr,
        check_in_time: nowTime,
        location_id: targetLocation.location_id,
        location_name: targetLocation.location_name,
        latitude: userLat,
        longitude: userLon,
        distance_from_location: simulatedDistance,
        attendance_mode: mode,
        QR_verified: targetLocation.qr_required ? true : false,
        GPS_verified: true,
        face_verified: targetLocation.face_required ? true : false,
        face_confidence: faceConfidence,
        device_id: 'Pixel-9-Pro-Android-15',
        status: simulatedDistance <= targetLocation.allowed_radius_meters ? 'Present' : 'Rejected',
        remarks: 'Verified via Android Mobile App',
        created_at: new Date().toISOString(),
        punch_in_photo: stampedPhoto,
        punch_in_location_name: targetLocation.location_name,
        punch_in_address: targetLocation.address,
      };

      if (isOffline) {
        saveOfflineAttendance(newRecord as any);
        setOfflineQueueCount(getOfflineQueue().length);
      } else {
        db.addAttendance(newRecord as any, activeEmp.employee_name);
      }
    }

    setCapturedPunchPhoto(stampedPhoto);
    setCheckInStep(4);

    // Dynamic Personalized Voice Greeting:
    // e.g. "Welcome Kishor!" or "Thank you Kishor!"
    playVoiceGreeting(activeEmp.employee_name, targetLocation.location_name, {
      enabled: settings.voice_greeting.enabled,
      language: voiceGreetingLanguage,
      punchType: punchActionType,
    });

    // Confetti
    try {
      confetti({ particleCount: 65, spread: 75, origin: { y: 0.5 } });
    } catch (e) {}
  };

  // Toggle Offline mode & Sync
  const handleToggleOffline = () => {
    if (isOffline) {
      setIsOffline(false);
      const synced = syncOfflineQueue();
      setOfflineQueueCount(0);
      if (synced.count > 0) {
        alert(`Internet reconnected! ${synced.count} offline attendance records synchronized with server.`);
      }
    } else {
      setIsOffline(true);
    }
  };

  // Request Submissions
  const handleSubmitLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveReason.trim()) return;
    db.addLeave({
      leave_id: `LV-${Date.now().toString().slice(-4)}`,
      employee_id: activeEmp.employee_id,
      employee_name: activeEmp.employee_name,
      department: activeEmp.department,
      leave_type: leaveType,
      from_date: leaveFrom,
      to_date: leaveTo,
      days_count: 2,
      reason: leaveReason,
      status: 'Pending',
      applied_at: new Date().toISOString(),
    });
    setLeaveReason('');
    setActionSuccessMsg('Leave application submitted for manager approval!');
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  const handleSubmitAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advanceReason.trim() || advanceAmount <= 0) return;
    db.addAdvance({
      advance_id: `ADV-${Date.now().toString().slice(-4)}`,
      employee_id: activeEmp.employee_id,
      employee_name: activeEmp.employee_name,
      department: activeEmp.department,
      amount: advanceAmount,
      reason: advanceReason,
      date: todayStr,
      approval_status: 'Pending',
      settlement_status: 'Unsettled',
      created_at: new Date().toISOString(),
    });
    setAdvanceReason('');
    setActionSuccessMsg('Salary advance request submitted to accounts!');
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  const handleSubmitComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintSubject.trim() || !complaintDesc.trim()) return;
    db.addComplaint({
      complaint_id: `CMP-${Date.now().toString().slice(-4)}`,
      employee_id: activeEmp.employee_id,
      employee_name: activeEmp.employee_name,
      department: activeEmp.department,
      category: complaintCategory,
      subject: complaintSubject,
      description: complaintDesc,
      priority: complaintPriority,
      confidential: complaintConfidential,
      created_date: todayStr,
      status: 'Open',
    });
    setComplaintSubject('');
    setComplaintDesc('');
    setActionSuccessMsg('Grievance ticket submitted successfully!');
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  // Face Registration execution (Captures multiple samples + liveness)
  const handleCaptureFaceSample = () => {
    const sampleIdx = faceSamples.length + 1;
    const sampleMock = `SAMPLE_${sampleIdx}_${Date.now()}`;
    const updated = [...faceSamples, sampleMock];
    setFaceSamples(updated);

    if (updated.length >= 3) {
      setFaceRegStep(2); // proceed to liveness check
    }
  };

  const handleVerifyFaceRegistrationLiveness = () => {
    setFaceRegLivenessStatus('analyzing');
    setTimeout(() => {
      setFaceRegLivenessStatus('passed');
      // Update employee in database
      const updatedEmp: EmployeeMaster = {
        ...activeEmp,
        face_status: 'Registered',
        face_samples_count: 3,
        face_template: `BIOMETRIC_VECTOR_${Date.now()}_HASH`,
      };
      db.updateEmployee(updatedEmp);
      db.logAudit(
        'Face Registered',
        activeEmp.employee_id,
        `Employee ${activeEmp.employee_name} successfully enrolled 3 face biometric samples.`,
        activeEmp.employee_name,
        'Employee'
      );
      setFaceRegStep(3);
    }, 1500);
  };

  // Profile Photo Update Execution
  const handleSaveProfilePhoto = (newPhotoUrl: string) => {
    const updatedEmp: EmployeeMaster = {
      ...activeEmp,
      profile_photo: newPhotoUrl,
    };
    db.updateEmployee(updatedEmp);
    db.logAudit(
      'Profile Photo Updated',
      activeEmp.employee_id,
      `Employee ${activeEmp.employee_name} updated profile photo.`,
      activeEmp.employee_name,
      'Employee'
    );
    setIsPhotoModalOpen(false);
    setPhotoPreview(null);
  };

  // Handle Onboarding Password Change Step
  const handleOnboardPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOnboardPassError(null);

    const val = validatePasswordStrength(onboardNewPass);
    if (!val.isValid) {
      setOnboardPassError(val.message || 'Password does not meet requirements.');
      return;
    }

    if (onboardNewPass !== onboardConfirmPass) {
      setOnboardPassError('New passwords do not match.');
      return;
    }

    if (authSession?.user) {
      const res = await authService.changePassword(authSession.user.user_id, onboardNewPass);
      if (!res.success) {
        setOnboardPassError(res.message);
        return;
      }
    }
    // Advance to Step 2 (Profile Setup & Photo)
    setOnboardingStep(2);
  };

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4 flex flex-col items-center justify-center font-sans">
      {/* Top Simulator Control Bar */}
      <div className="w-full max-w-sm mb-4 flex items-center justify-between text-xs">
        {onBackToAdmin ? (
          <button
            onClick={onBackToAdmin}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Admin Panel</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 text-indigo-400 font-bold">
            <Smartphone className="w-4 h-4" />
            <span>Workforce Mobile</span>
          </div>
        )}

        {/* Switch Worker Profile in Demo */}
        <div className="flex items-center gap-2">
          {/* Mobile APK Install Button */}
          <PWAInstallButton variant="compact" employeeName={activeEmp.employee_name} />

          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2 py-1 rounded-xl">
            <span className="text-slate-400">User:</span>
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
            >
              {employees.map((e) => (
                <option key={e.employee_id} value={e.employee_id} className="bg-slate-900 text-white">
                  {e.employee_name} ({e.designation.split(' ')[0]})
                </option>
              ))}
            </select>
          </div>

          {onSignOut && (
            <button
              onClick={onSignOut}
              className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-300 transition"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Android Device Shell Frame */}
      <div className="relative w-full max-w-[390px] h-[800px] bg-slate-950 rounded-[48px] border-[10px] border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col ring-1 ring-slate-700/50">
        {/* Notch / Speaker bar & Camera */}
        <div className="h-7 bg-slate-950 px-6 flex items-center justify-between text-slate-400 text-[11px] select-none z-30">
          <span className="font-mono font-semibold text-slate-200">{currentTime}</span>
          <div className="w-20 h-4 bg-slate-900 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-slate-950 border border-slate-800"></div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={handleToggleOffline} title={isOffline ? 'Offline Mode active' : 'Online'}>
              {isOffline ? <WifiOff className="w-3.5 h-3.5 text-rose-400 animate-pulse" /> : <Wifi className="w-3.5 h-3.5 text-slate-300" />}
            </button>
            <Battery className="w-3.5 h-3.5 text-slate-300" />
          </div>
        </div>

        {/* Offline Banner */}
        {isOffline && (
          <div className="bg-amber-950/80 border-b border-amber-800/80 px-4 py-1 text-[10px] text-amber-200 flex items-center justify-between">
            <span>Offline Mode: Attendance will queue locally</span>
            {offlineQueueCount > 0 && <span className="font-bold">({offlineQueueCount} queued)</span>}
          </div>
        )}

        {/* Mock Location Banner if Active */}
        {isMockLocation && (
          <div className="bg-rose-950 border-b border-rose-800 px-4 py-1 text-[10px] text-rose-300 flex items-center justify-between">
            <span className="flex items-center gap-1 font-bold">
              <AlertTriangle className="w-3 h-3 text-rose-400" /> Mock Location Enabled
            </span>
            <button
              onClick={() => setIsMockLocation(false)}
              className="text-white underline text-[9px]"
            >
              Disable
            </button>
          </div>
        )}

        {/* Mobile Viewport Body */}
        <div className="flex-1 overflow-y-auto bg-slate-900 text-slate-100 p-4 space-y-4">
          {/* TAB: HOME */}
          {activeTab === 'home' && (
            <div className="space-y-4">
              {/* Header Greeting */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">Welcome,</div>
                  <h1 className="text-xl font-bold text-white tracking-tight">
                    {activeEmp.employee_name.split(' ')[0]} 👋
                  </h1>
                </div>
                <div className="relative">
                  <img
                    src={activeEmp.profile_photo}
                    alt={activeEmp.employee_name}
                    className="w-11 h-11 rounded-full object-cover border-2 border-indigo-500 shadow-md cursor-pointer"
                    onClick={() => setActiveTab('profile')}
                  />
                  {activeEmp.face_status === 'Registered' ? (
                    <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full" title="Face Registered"></span>
                  ) : (
                    <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-amber-500 border-2 border-slate-900 rounded-full" title="Face Pending"></span>
                  )}
                </div>
              </div>

              {/* Mobile APK Install Prompt Banner */}
              <div
                onClick={() => setIsPwaModalOpen(true)}
                className="cursor-pointer p-2.5 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-teal-950/80 to-slate-900 border border-emerald-500/40 text-xs flex items-center justify-between group hover:border-emerald-400 transition shadow-md"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-[11px] flex items-center gap-1.5">
                      <span>Android Mobile App (APK)</span>
                      <span className="px-1.5 py-0.2 rounded bg-emerald-500 text-[9px] font-black text-slate-950 uppercase">Install</span>
                    </div>
                    <div className="text-[10px] text-emerald-300/80">
                      Phone me 1-click install karein (QR / APK)
                    </div>
                  </div>
                </div>
                <div className="text-emerald-400 group-hover:translate-x-0.5 transition">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              {/* Status Alert if Face Not Registered */}
              {activeEmp.face_status !== 'Registered' && (
                <div className="p-3 rounded-2xl bg-amber-950/60 border border-amber-800/80 text-amber-200 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="font-bold">Face Enrollment Required</div>
                      <div className="text-[10px] text-amber-300/80">Register your face to enable attendance</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setFaceSamples([]);
                      setFaceRegStep(1);
                      setIsFaceRegModalOpen(true);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-[10px] hover:bg-amber-400"
                  >
                    Enroll
                  </button>
                </div>
              )}

              {/* Today's Status Card */}
              <div className="p-4 rounded-3xl bg-gradient-to-tr from-indigo-900/40 via-slate-950 to-slate-900 border border-indigo-500/30 shadow-lg relative overflow-hidden">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-semibold text-slate-300">Today's Shift</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    General Shift (09:30 - 18:30)
                  </span>
                </div>

                {/* Punch In and Punch Out Details with Live Photo Thumbnails */}
                <div className="grid grid-cols-2 gap-2.5 my-2">
                  {/* Punch In Box */}
                  <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 relative overflow-hidden flex flex-col justify-between min-h-[90px]">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        Punch In
                      </span>
                      {todayRecord?.punch_in_photo && (
                        <button
                          onClick={() => setEnlargedPhotoUrl(todayRecord.punch_in_photo!)}
                          className="text-[10px] text-indigo-400 underline font-medium hover:text-indigo-300"
                        >
                          Photo
                        </button>
                      )}
                    </div>
                    <div className="text-sm font-bold text-white font-mono mt-1">
                      {todayRecord ? todayRecord.check_in_time : '--:--'}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {todayRecord ? (todayRecord.punch_in_location_name || todayRecord.location_name) : 'Not marked yet'}
                    </div>
                    {todayRecord?.punch_in_photo && (
                      <div className="mt-1.5 pt-1.5 border-t border-slate-800/80 flex items-center gap-1.5">
                        <img
                          src={todayRecord.punch_in_photo}
                          alt="Punch In Photo"
                          onClick={() => setEnlargedPhotoUrl(todayRecord.punch_in_photo!)}
                          className="w-7 h-7 rounded-lg object-cover border border-emerald-500/60 cursor-pointer shadow-sm hover:scale-105 transition"
                        />
                        <span className="text-[9px] text-emerald-300 font-medium">Verified Live</span>
                      </div>
                    )}
                  </div>

                  {/* Punch Out Box */}
                  <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 relative overflow-hidden flex flex-col justify-between min-h-[90px]">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        Punch Out
                      </span>
                      {todayRecord?.punch_out_photo && (
                        <button
                          onClick={() => setEnlargedPhotoUrl(todayRecord.punch_out_photo!)}
                          className="text-[10px] text-indigo-400 underline font-medium hover:text-indigo-300"
                        >
                          Photo
                        </button>
                      )}
                    </div>
                    <div className="text-sm font-bold text-amber-300 font-mono mt-1">
                      {todayRecord?.check_out_time ? todayRecord.check_out_time : '--:--'}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {todayRecord?.check_out_time ? (todayRecord.punch_out_location_name || targetLocation.location_name) : 'Shift active'}
                    </div>
                    {todayRecord?.punch_out_photo && (
                      <div className="mt-1.5 pt-1.5 border-t border-slate-800/80 flex items-center gap-1.5">
                        <img
                          src={todayRecord.punch_out_photo}
                          alt="Punch Out Photo"
                          onClick={() => setEnlargedPhotoUrl(todayRecord.punch_out_photo!)}
                          className="w-7 h-7 rounded-lg object-cover border border-amber-500/60 cursor-pointer shadow-sm hover:scale-105 transition"
                        />
                        <span className="text-[9px] text-amber-300 font-medium">Verified Live</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1.5 truncate pr-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{targetLocation.location_name}</span>
                  </div>
                  <span className="text-[11px] font-mono text-indigo-400 font-medium shrink-0">
                    {formatDistance(simulatedDistance)} away
                  </span>
                </div>
              </div>

              {/* Dual Punch In & Punch Out Action Controls */}
              <div className="space-y-2.5">
                {/* Voice Greeting & Audio Test Control Bar */}
                <div className="p-2.5 rounded-2xl bg-slate-950/90 border border-indigo-500/25 flex items-center justify-between gap-2 shadow-sm text-xs">
                  <div className="flex items-center gap-1.5 text-indigo-300 font-semibold text-[11px] truncate">
                    <Volume2 className={`w-3.5 h-3.5 text-indigo-400 shrink-0 ${isVoiceTesting ? 'animate-bounce text-emerald-400' : ''}`} />
                    <span className="truncate">Voice: "Welcome {activeEmp.employee_name.split(' ')[0]}"</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Language Switcher */}
                    <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-[10px]">
                      {(['Hindi', 'English', 'Hinglish'] as const).map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => setVoiceGreetingLanguage(lang)}
                          className={`px-1.5 py-0.5 rounded transition ${
                            voiceGreetingLanguage === lang
                              ? 'bg-indigo-600 text-white font-bold shadow-xs'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {lang === 'Hindi' ? 'हिंदी' : lang === 'English' ? 'EN' : 'Hinglish'}
                        </button>
                      ))}
                    </div>

                    {/* Test Audio Button */}
                    <button
                      type="button"
                      disabled={isVoiceTesting}
                      onClick={() => handleTestVoiceGreeting()}
                      className="px-2 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 hover:text-white font-bold text-[10px] flex items-center gap-1 transition active:scale-95 disabled:opacity-50"
                      title="Test Audio Voice Announcement"
                    >
                      <Volume2 className="w-3 h-3 text-cyan-400" />
                      <span>{isVoiceTesting ? 'Speaking...' : 'Test Voice'}</span>
                    </button>
                  </div>
                </div>

                {/* Big Attendance Action Button (Targeted UI Element) */}
                <button
                  onClick={() =>
                    handleOpenAttendanceFlow(
                      !todayRecord ? 'in' : !todayRecord.check_out_time ? 'out' : 'in'
                    )
                  }
                  className={`w-full py-4 px-4 rounded-3xl text-white font-bold text-sm shadow-2xl flex items-center justify-between transition-all duration-300 active:scale-[0.98] group relative overflow-hidden ${
                    !todayRecord
                      ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 hover:from-emerald-500 hover:to-indigo-600 shadow-emerald-950/70 border border-emerald-400/50 ring-2 ring-emerald-500/30'
                      : !todayRecord.check_out_time
                      ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-rose-700 hover:from-amber-500 hover:to-rose-600 shadow-amber-950/70 border border-amber-400/50 ring-2 ring-amber-500/30'
                      : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 shadow-indigo-950/70 border border-indigo-400/50 ring-2 ring-indigo-500/30'
                  }`}
                >
                  {/* Subtle Glow Reflection */}
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none"></div>

                  <div className="flex items-center gap-3 text-left relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md shadow-inner border border-white/25 shrink-0 group-hover:scale-105 transition">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-black flex items-center gap-1.5 leading-tight tracking-tight">
                        <span>
                          {!todayRecord
                            ? `Punch In (Welcome ${activeEmp.employee_name})`
                            : !todayRecord.check_out_time
                            ? `Punch Out (Goodbye ${activeEmp.employee_name})`
                            : `Punch In Again (Welcome ${activeEmp.employee_name})`}
                        </span>
                        <Volume2 className="w-4 h-4 text-white/95 animate-pulse" />
                      </div>
                      <div className="text-[11px] text-white/90 font-medium mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-white/80" />
                          {targetLocation.location_name}
                        </span>
                        <span className="text-white/60">•</span>
                        <span>Selfie Photo & Voice</span>
                      </div>
                    </div>
                  </div>

                  <div className="px-3 py-1.5 rounded-xl bg-white/20 backdrop-blur-md text-[10px] font-black tracking-widest uppercase border border-white/30 shrink-0 shadow-sm">
                    {!todayRecord ? '🟢 PUNCH IN' : !todayRecord.check_out_time ? '🟠 PUNCH OUT' : '🟣 RE-PUNCH'}
                  </div>
                </button>

                {/* Quick Action Side-by-Side Direct Buttons */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => handleOpenAttendanceFlow('in')}
                    className={`py-3 px-3 rounded-2xl border font-bold flex flex-col items-center justify-center gap-1 transition-all active:scale-[0.98] ${
                      !todayRecord
                        ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-200 shadow-md ring-1 ring-emerald-500/40 hover:bg-emerald-900/80'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-black">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                      <span>Punch In (पंच इन)</span>
                    </div>
                    <span className="text-[10px] text-emerald-400/80 font-normal">
                      Photo + Voice "Welcome {activeEmp.employee_name.split(' ')[0]}"
                    </span>
                  </button>
                  <button
                    onClick={() => handleOpenAttendanceFlow('out')}
                    className={`py-3 px-3 rounded-2xl border font-bold flex flex-col items-center justify-center gap-1 transition-all active:scale-[0.98] ${
                      todayRecord && !todayRecord.check_out_time
                        ? 'bg-amber-950/80 border-amber-500/60 text-amber-200 shadow-md ring-1 ring-amber-500/40 hover:bg-amber-900/80'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-black">
                      <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                      <span>Punch Out (पंच आउट)</span>
                    </div>
                    <span className="text-[10px] text-amber-400/80 font-normal">
                      Photo + Voice "Goodbye {activeEmp.employee_name.split(' ')[0]}"
                    </span>
                  </button>
                </div>
              </div>

              {/* Office Location Picker */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="font-semibold text-slate-300">Assigned Attendance Site:</span>
                  <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-indigo-400">
                    {targetLocation.office_type}
                  </span>
                </div>
                <select
                  value={targetLocationId}
                  onChange={(e) => setTargetLocationId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none"
                >
                  {locations.map((loc) => (
                    <option key={loc.location_id} value={loc.location_id}>
                      {loc.location_name} ({loc.allowed_radius_meters}m geofence)
                    </option>
                  ))}
                </select>

                {/* Simulated Geofence Slider (Allows Testing Geofence) */}
                <div className="pt-2 border-t border-slate-800/80 space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Simulate Proximity Distance:</span>
                    <strong className={simulatedDistance <= targetLocation.allowed_radius_meters ? 'text-emerald-400' : 'text-rose-400'}>
                      {simulatedDistance}m / {targetLocation.allowed_radius_meters}m
                    </strong>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="300"
                    value={simulatedDistance}
                    onChange={(e) => setSimulatedDistance(Number(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>
              </div>

              {/* Quick Services Grid */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <button
                  onClick={() => {
                    setRequestType('leave');
                    setActiveTab('requests');
                  }}
                  className="p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 flex flex-col items-center gap-1.5 transition"
                >
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-200">Apply Leave</span>
                </button>

                <button
                  onClick={() => {
                    setRequestType('advance');
                    setActiveTab('requests');
                  }}
                  className="p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 flex flex-col items-center gap-1.5 transition"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-200">Get Advance</span>
                </button>

                <button
                  onClick={() => {
                    setRequestType('complaint');
                    setActiveTab('requests');
                  }}
                  className="p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 flex flex-col items-center gap-1.5 transition"
                >
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-200">Grievance</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB: ATTENDANCE HISTORY */}
          {activeTab === 'attendance_history' && (
            <div className="space-y-3">
              <h2 className="text-base font-bold text-white">Attendance Logs</h2>
              <div className="space-y-2 text-xs">
                {myAttendanceRecords.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">No attendance records found yet</div>
                ) : (
                  myAttendanceRecords.map((rec) => (
                    <div
                      key={rec.attendance_id}
                      className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-200">{rec.date}</div>
                        <div className="text-slate-400 text-[11px]">
                          In: {rec.check_in_time} • {rec.location_name}
                        </div>
                        <div className="text-[10px] text-indigo-400 font-mono mt-0.5">
                          {rec.attendance_mode} (Face {rec.face_confidence}%)
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          rec.status === 'Present'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB: REQUESTS (LEAVE, ADVANCE, COMPLAINT) */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
                <button
                  onClick={() => setRequestType('leave')}
                  className={`flex-1 py-1.5 rounded-lg font-semibold transition ${
                    requestType === 'leave' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Leave
                </button>
                <button
                  onClick={() => setRequestType('advance')}
                  className={`flex-1 py-1.5 rounded-lg font-semibold transition ${
                    requestType === 'advance' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Advance
                </button>
                <button
                  onClick={() => setRequestType('complaint')}
                  className={`flex-1 py-1.5 rounded-lg font-semibold transition ${
                    requestType === 'complaint' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Complaint
                </button>
              </div>

              {actionSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{actionSuccessMsg}</span>
                </div>
              )}

              {requestType === 'leave' && (
                <form onSubmit={handleSubmitLeave} className="space-y-3 text-xs bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <h3 className="font-bold text-white">Apply for Leave</h3>
                  <div>
                    <label className="block text-slate-400 mb-1">Leave Type</label>
                    <select
                      value={leaveType}
                      onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="Casual Leave">Casual Leave</option>
                      <option value="Sick Leave">Sick Leave</option>
                      <option value="Earned Leave">Earned Leave</option>
                      <option value="Emergency Leave">Emergency Leave</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-400 mb-1">From Date</label>
                      <input
                        type="date"
                        value={leaveFrom}
                        onChange={(e) => setLeaveFrom(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">To Date</label>
                      <input
                        type="date"
                        value={leaveTo}
                        onChange={(e) => setLeaveTo(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Reason</label>
                    <textarea
                      rows={2}
                      required
                      value={leaveReason}
                      onChange={(e) => setLeaveReason(e.target.value)}
                      placeholder="Family occasion, medical, etc."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                  >
                    Submit Leave Request
                  </button>
                </form>
              )}

              {requestType === 'advance' && (
                <form onSubmit={handleSubmitAdvance} className="space-y-3 text-xs bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <h3 className="font-bold text-white">Salary Advance Request</h3>
                  <div>
                    <label className="block text-slate-400 mb-1">Requested Amount (₹)</label>
                    <input
                      type="number"
                      min="1000"
                      step="500"
                      value={advanceAmount}
                      onChange={(e) => setAdvanceAmount(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Purpose / Justification</label>
                    <textarea
                      rows={2}
                      required
                      value={advanceReason}
                      onChange={(e) => setAdvanceReason(e.target.value)}
                      placeholder="Emergency medical, school fees, etc."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                  >
                    Request Salary Advance
                  </button>
                </form>
              )}

              {requestType === 'complaint' && (
                <form onSubmit={handleSubmitComplaint} className="space-y-3 text-xs bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <h3 className="font-bold text-white">Raise Grievance / Issue</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-400 mb-1">Category</label>
                      <select
                        value={complaintCategory}
                        onChange={(e) => setComplaintCategory(e.target.value as ComplaintCategory)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5 text-white"
                      >
                        <option value="Workplace">Workplace</option>
                        <option value="Salary">Salary</option>
                        <option value="Safety">Safety</option>
                        <option value="HR">HR</option>
                        <option value="IT">IT</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Priority</label>
                      <select
                        value={complaintPriority}
                        onChange={(e) => setComplaintPriority(e.target.value as ComplaintPriority)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5 text-white"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Subject</label>
                    <input
                      type="text"
                      required
                      value={complaintSubject}
                      onChange={(e) => setComplaintSubject(e.target.value)}
                      placeholder="Brief title of the problem"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Description</label>
                    <textarea
                      rows={2}
                      required
                      value={complaintDesc}
                      onChange={(e) => setComplaintDesc(e.target.value)}
                      placeholder="Detailed explanation..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={complaintConfidential}
                      onChange={(e) => setComplaintConfidential(e.target.checked)}
                      className="rounded accent-indigo-600"
                    />
                    <span>Mark as Confidential (Restricted to HR)</span>
                  </label>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                  >
                    Submit Grievance
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-3">
              <h2 className="text-base font-bold text-white">Notifications</h2>
              <div className="space-y-2 text-xs">
                {db
                  .getNotifications()
                  .filter((n) => n.recipient_id === 'all' || n.recipient_id === activeEmp.employee_id)
                  .map((n) => (
                    <div key={n.id} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <div className="font-bold text-slate-200">{n.title}</div>
                      <p className="text-slate-400 text-[11px]">{n.message}</p>
                      <div className="text-[9px] text-slate-500">
                        {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB: PROFILE (Section 4 & 5) */}
          {activeTab === 'profile' && (
            <div className="space-y-4 text-xs">
              {/* Profile Card */}
              <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 text-center space-y-3 relative">
                <div className="relative w-24 h-24 mx-auto">
                  <img
                    src={activeEmp.profile_photo}
                    alt={activeEmp.employee_name}
                    className="w-24 h-24 rounded-full object-cover border-2 border-indigo-500 shadow-xl"
                  />
                  {settings.security.allow_employee_photo_update ? (
                    <button
                      onClick={() => setIsPhotoModalOpen(true)}
                      className="absolute bottom-0 right-0 p-2 rounded-full bg-indigo-600 text-white shadow-lg border border-slate-900 hover:bg-indigo-500"
                      title="Update Profile Photo"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <div
                      className="absolute bottom-0 right-0 p-1.5 rounded-full bg-slate-800 text-slate-400 border border-slate-900"
                      title="Photo updates locked by Admin"
                    >
                      <Lock className="w-3 h-3" />
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-base text-white">{activeEmp.employee_name}</h3>
                  <div className="text-indigo-400 font-mono font-medium">{activeEmp.employee_code}</div>
                  <div className="text-slate-400">{activeEmp.department} • {activeEmp.designation}</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">{targetLocation.location_name}</div>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => {
                      if (!settings.security.allow_employee_photo_update) {
                        alert('Profile photo updates are locked by your organization policy.');
                        return;
                      }
                      setIsPhotoModalOpen(true);
                    }}
                    className={`w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                      settings.security.allow_employee_photo_update
                        ? 'bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-slate-800'
                        : 'bg-slate-900/50 text-slate-500 border border-slate-800/50 cursor-not-allowed'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>
                      {settings.security.allow_employee_photo_update
                        ? 'Update Profile Photo'
                        : 'Photo Editing Locked by Admin'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Biometric Face Profile Status */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    <span>Face Recognition Status</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      activeEmp.face_status === 'Registered'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {activeEmp.face_status}
                  </span>
                </div>

                <div className="space-y-1.5 text-slate-400">
                  <div className="flex justify-between">
                    <span>Enrolled Face Samples:</span>
                    <strong className="text-white">{activeEmp.face_samples_count || 0} / 3 Frames</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Liveness Anti-Spoof:</span>
                    <strong className="text-indigo-400">Standard Active</strong>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setFaceSamples([]);
                    setFaceRegStep(1);
                    setIsFaceRegModalOpen(true);
                  }}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center gap-2 shadow-md transition"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{activeEmp.face_status === 'Registered' ? 'Re-enroll Face Biometrics' : 'Complete Face Registration'}</span>
                </button>
              </div>

              {/* Device Permissions Status (Sections 6 & 7) */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Device Permissions & Sensors</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-slate-400" />
                      <span>Camera Access</span>
                    </div>
                    <button
                      onClick={() => setIsCameraPermModalOpen(true)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        cameraPermission === 'granted'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      {cameraPermission === 'granted' ? 'Allowed' : 'Denied / Setup'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span>Location Permission</span>
                    </div>
                    <button
                      onClick={() => setIsLocationPermModalOpen(true)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        locationPermission === 'precise'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      {locationPermission === 'precise' ? 'Precise GPS' : 'Manage'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="flex items-center gap-2">
                      <Compass className="w-4 h-4 text-slate-400" />
                      <span>Simulate Mock GPS</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isMockLocation}
                        onChange={(e) => setIsMockLocation(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-rose-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Password & Security Actions */}
              <div className="space-y-2">
                <button
                  onClick={() => setIsChangePassModalOpen(true)}
                  className="w-full py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white font-medium flex items-center justify-center gap-2 transition"
                >
                  <KeyRound className="w-4 h-4 text-indigo-400" />
                  <span>Change Account Password</span>
                </button>

                {onSignOut && (
                  <button
                    onClick={onSignOut}
                    className="w-full py-2.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 hover:bg-rose-900/60 font-medium flex items-center justify-center gap-2 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out of Workforce</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Android Navigation Bar (Section 29) */}
        <div className="h-16 bg-slate-950 border-t border-slate-800 px-4 flex items-center justify-between z-30">
          {[
            { id: 'home', label: 'Home', icon: Smartphone },
            { id: 'attendance_history', label: 'Attendance', icon: Clock },
            { id: 'requests', label: 'Requests', icon: CalendarCheck },
            { id: 'notifications', label: 'Alerts', icon: Bell },
            { id: 'profile', label: 'Profile', icon: User },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as MobileTab)}
                className={`flex flex-col items-center justify-center gap-1 transition ${
                  isActive ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ==================================================== */}
        {/* INTERACTIVE ATTENDANCE MODAL FLOW (IN & OUT)         */}
        {/* ==================================================== */}
        {isCheckInModalOpen && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md z-40 p-4 flex flex-col justify-between overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                    punchActionType === 'in'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {punchActionType === 'in' ? '🟢 PUNCH IN' : '🟠 PUNCH OUT'}
                </span>
                <span className="font-bold text-xs text-white">Location & Photo Verification</span>
              </div>
              <button
                onClick={() => {
                  stopCamera();
                  setIsCheckInModalOpen(false);
                }}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* STEP 1: GPS RADIUS & LOCATION ADDRESS VERIFICATION */}
            {checkInStep === 1 && (
              <div className="space-y-3.5 my-auto text-center">
                <div
                  className={`w-14 h-14 rounded-full border flex items-center justify-center mx-auto animate-pulse ${
                    punchActionType === 'in'
                      ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-400'
                      : 'bg-amber-950/80 border-amber-500/40 text-amber-400'
                  }`}
                >
                  <MapPin className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {punchActionType === 'in' ? 'Punch In Location Check' : 'Punch Out Location Check'}
                  </h3>
                  <p className="text-xs text-indigo-300 font-medium mt-0.5">
                    {activeEmp.employee_name} ({activeEmp.employee_code})
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs text-left">
                  <div className="flex items-start justify-between">
                    <span className="text-slate-400">Target Site:</span>
                    <strong className="text-white text-right max-w-[200px]">{targetLocation.location_name}</strong>
                  </div>
                  <div className="flex items-start justify-between">
                    <span className="text-slate-400">Address:</span>
                    <span className="text-slate-300 text-right max-w-[200px] text-[11px]">{targetLocation.address}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Coordinates:</span>
                    <span className="font-mono text-slate-300 text-[11px]">
                      {userLat.toFixed(4)}, {userLon.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Current Distance:</span>
                    <span className="font-bold text-emerald-400 font-mono text-sm">
                      {formatDistance(simulatedDistance)} / {targetLocation.allowed_radius_meters}m
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 text-center">
                    {simulatedDistance <= targetLocation.allowed_radius_meters ? (
                      <span className="text-emerald-400 font-bold flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Geofence Verified: Physically Present
                      </span>
                    ) : (
                      <span className="text-rose-400 font-bold flex items-center justify-center gap-1">
                        <XCircle className="w-4 h-4" /> Outside permitted attendance location
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleGPSNext}
                  className={`w-full py-3 rounded-2xl text-white font-bold text-xs shadow-lg transition ${
                    punchActionType === 'in'
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                      : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                  }`}
                >
                  Confirm Location & Proceed to Camera →
                </button>
              </div>
            )}

            {/* STEP 2: DYNAMIC QR CODE SCANNER */}
            {checkInStep === 2 && (
              <div className="space-y-4 my-auto text-center">
                <div className="w-14 h-14 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-400 flex items-center justify-center mx-auto">
                  <QrCode className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Scan Terminal QR Code</h3>
                  <p className="text-xs text-slate-400 mt-1">{targetLocation.location_name}</p>
                </div>

                <div className="space-y-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setScannedQRInput(
                        `SWQR::${btoa(JSON.stringify({ locationId: targetLocation.location_id, locationCode: targetLocation.location_code }))}`
                      );
                    }}
                    className="text-xs text-indigo-400 font-medium underline"
                  >
                    Simulate Camera QR Scan
                  </button>

                  <textarea
                    rows={2}
                    value={scannedQRInput}
                    onChange={(e) => setScannedQRInput(e.target.value)}
                    placeholder="Scanned QR token string payload..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-[11px] font-mono text-white focus:outline-none focus:border-indigo-500"
                  />

                  {qrErrorMessage && (
                    <div className="text-rose-400 text-xs font-semibold">{qrErrorMessage}</div>
                  )}
                </div>

                <button
                  onClick={handleQRVerify}
                  className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg transition"
                >
                  Verify QR Token →
                </button>
              </div>
            )}

            {/* STEP 3: FACE LIVENESS & LIVE PHOTO CAPTURE WITH LOCATION STAMP */}
            {checkInStep === 3 && (
              <div className="space-y-3 my-auto text-center">
                <div>
                  <h3 className="text-base font-bold text-white">
                    {punchActionType === 'in' ? 'Punch In Live Photo' : 'Punch Out Live Photo'}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Live selfie with burned-in GPS coordinates & voice confirmation
                  </p>
                </div>

                {/* Camera Viewfinder with Real-Time Location Watermark Overlay */}
                <div className="relative w-64 h-64 mx-auto rounded-3xl overflow-hidden border-2 border-indigo-500/80 shadow-2xl bg-black">
                  {cameraActive ? (
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs p-4 bg-slate-950">
                      <img
                        src={activeEmp.profile_photo}
                        alt="Employee Reference"
                        className="w-28 h-28 rounded-full object-cover border-2 border-indigo-500/50 mb-2 opacity-90"
                      />
                      <span className="text-[11px] text-slate-300 font-medium">Ready for Photo Capture</span>
                    </div>
                  )}

                  {/* Face Guide Oval */}
                  <div className="absolute inset-4 border border-dashed border-indigo-400/60 rounded-full pointer-events-none animate-pulse"></div>

                  {/* Live Watermark Overlay on Viewfinder */}
                  <div className="absolute bottom-0 inset-x-0 bg-slate-950/85 backdrop-blur-xs p-2 text-left text-[9px] text-white border-t border-slate-800">
                    <div className="font-bold flex items-center justify-between text-indigo-300">
                      <span>{punchActionType === 'in' ? '🟢 PUNCH IN' : '🟠 PUNCH OUT'}</span>
                      <span className="text-[8px] text-emerald-400 font-mono">GPS LOCKED</span>
                    </div>
                    <div className="truncate text-slate-200">{targetLocation.location_name}</div>
                    <div className="text-slate-400 font-mono truncate">
                      {userLat.toFixed(4)}, {userLon.toFixed(4)} • {currentTime}
                    </div>
                  </div>
                </div>

                <canvas ref={canvasRef} className="hidden" />

                <div className="text-xs text-slate-300">
                  {livenessStage === 'verifying' ? (
                    <span className="text-amber-400 font-semibold animate-pulse">
                      Capturing photo, stamping GPS address & verifying biometric liveness...
                    </span>
                  ) : (
                    <span className="text-slate-400">Position face centered and click button below</span>
                  )}
                </div>

                <button
                  onClick={handleFaceVerify}
                  className={`w-full py-3.5 rounded-2xl text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 ${
                    punchActionType === 'in'
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                      : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>
                    {punchActionType === 'in'
                      ? 'Capture Photo & Confirm Punch In'
                      : 'Capture Photo & Confirm Punch Out'}
                  </span>
                </button>
              </div>
            )}

            {/* STEP 4: SUCCESS CONFIRMATION & PERSONALIZED VOICE ANNOUNCEMENT */}
            {checkInStep === 4 && (
              <div className="space-y-3 my-auto text-center animate-in zoom-in duration-300">
                <div
                  className={`w-14 h-14 rounded-full border flex items-center justify-center mx-auto shadow-xl ${
                    punchActionType === 'in'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      : 'bg-amber-500/20 border-amber-500 text-amber-400'
                  }`}
                >
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">
                    {punchActionType === 'in'
                      ? 'Punch In Recorded Successfully!'
                      : 'Punch Out Recorded Successfully!'}
                  </h3>
                  <p className="text-xs text-emerald-400 font-medium mt-0.5">
                    Location verified with stamped photo & voice announcement
                  </p>
                </div>

                {/* Captured Photo with Burned-In Location Stamp */}
                {capturedPunchPhoto && (
                  <div className="relative mx-auto max-w-[240px] rounded-2xl overflow-hidden border border-slate-700 shadow-lg group">
                    <img
                      src={capturedPunchPhoto}
                      alt="Captured Punch Attendance"
                      className="w-full h-auto object-cover cursor-pointer"
                      onClick={() => setEnlargedPhotoUrl(capturedPunchPhoto)}
                    />
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-[9px] text-white font-medium">
                      Tap to enlarge
                    </div>
                  </div>
                )}

                {/* Voice Announcement Player Card (Welcoming employee by name) */}
                <div className="p-3 rounded-2xl bg-indigo-950/60 border border-indigo-500/40 text-left space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-indigo-300 font-bold text-xs">
                      <Volume2 className="w-4 h-4 text-indigo-400 animate-pulse" />
                      <span>Voice Greeting (आवाज़ संदेश):</span>
                    </div>
                    {/* Language Switcher */}
                    <div className="flex items-center gap-1 bg-slate-900 px-1.5 py-0.5 rounded-lg border border-slate-800 text-[10px]">
                      {(['Hindi', 'English', 'Hinglish'] as const).map((lang) => (
                        <button
                          key={lang}
                          onClick={() => {
                            setVoiceGreetingLanguage(lang);
                            playVoiceGreeting(activeEmp.employee_name, targetLocation.location_name, {
                              enabled: true,
                              language: lang,
                              punchType: punchActionType,
                            });
                          }}
                          className={`px-1.5 py-0.5 rounded ${
                            voiceGreetingLanguage === lang
                              ? 'bg-indigo-600 text-white font-bold'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-slate-200 italic bg-slate-900/60 p-2 rounded-xl border border-indigo-500/20">
                    {punchActionType === 'in'
                      ? voiceGreetingLanguage === 'Hindi'
                        ? `नमस्ते ${activeEmp.employee_name.split(' ')[0]}! ${targetLocation.location_name} में आपका स्वागत है। आपका पंच इन सफलतापूर्वक दर्ज कर लिया गया है।`
                        : voiceGreetingLanguage === 'Hinglish'
                        ? `Welcome ${activeEmp.employee_name.split(' ')[0]}! ${targetLocation.location_name} me aapka Punch In confirm ho gaya hai. Have a productive day!`
                        : `Welcome ${activeEmp.employee_name.split(' ')[0]}! Your Punch In at ${targetLocation.location_name} has been successfully recorded.`
                      : voiceGreetingLanguage === 'Hindi'
                      ? `धन्यवाद ${activeEmp.employee_name.split(' ')[0]}! ${targetLocation.location_name} से आपका पंच आउट सफलतापूर्वक दर्ज कर लिया गया है। शुभ दिन!`
                      : voiceGreetingLanguage === 'Hinglish'
                      ? `Thank you ${activeEmp.employee_name.split(' ')[0]}! ${targetLocation.location_name} se aapka Punch Out successfully complete ho gaya hai.`
                      : `Thank you ${activeEmp.employee_name.split(' ')[0]}! Your Punch Out from ${targetLocation.location_name} has been successfully recorded. Have a great day!`}
                  </p>

                  <button
                    onClick={() =>
                      playVoiceGreeting(activeEmp.employee_name, targetLocation.location_name, {
                        enabled: true,
                        language: voiceGreetingLanguage,
                        punchType: punchActionType,
                      })
                    }
                    className="w-full py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/50 text-indigo-300 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Replay Voice Announcement (आवाज़ फिर से सुनें)</span>
                  </button>
                </div>

                {/* Location & Time Summary */}
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5 text-xs text-left">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Employee:</span>
                    <strong className="text-white">{activeEmp.employee_name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Location:</span>
                    <strong className="text-indigo-300">{targetLocation.location_name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Time:</span>
                    <strong className="text-white font-mono">{currentTime}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Photo & Location:</span>
                    <strong className="text-emerald-400">Stamped & Verified ✓</strong>
                  </div>
                </div>

                <button
                  onClick={() => setIsCheckInModalOpen(false)}
                  className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg transition"
                >
                  Done & Return to Dashboard
                </button>
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* ENLARGED PHOTO POPUP MODAL                          */}
        {/* ==================================================== */}
        {enlargedPhotoUrl && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-50 p-4 flex flex-col items-center justify-center">
            <div className="relative max-w-sm w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden p-3 shadow-2xl">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Verified Attendance Photo with Location Stamp</span>
                </span>
                <button
                  onClick={() => setEnlargedPhotoUrl(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <img
                src={enlargedPhotoUrl}
                alt="Enlarged Attendance Selfie"
                className="w-full h-auto rounded-2xl border border-slate-700 object-cover max-h-[460px]"
              />
              <div className="mt-2 text-center text-[10px] text-slate-400">
                Live biometric photograph stamped with real-time GPS location and timestamp.
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* FACE REGISTRATION REQUIRED ALERT MODAL              */}
        {/* ==================================================== */}
        {showFaceRegRequiredAlert && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-50 p-6 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-500 text-amber-400 flex items-center justify-center mb-4">
              <Camera className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Face Registration Required</h3>
            <p className="text-xs text-slate-300 mb-6 max-w-xs leading-relaxed">
              Attendance at this location requires facial biometric verification. You must register your face profile before marking attendance.
            </p>
            <div className="w-full space-y-2">
              <button
                onClick={() => {
                  setShowFaceRegRequiredAlert(false);
                  setFaceSamples([]);
                  setFaceRegStep(1);
                  setIsFaceRegModalOpen(true);
                }}
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg"
              >
                Register Face Profile Now
              </button>
              <button
                onClick={() => setShowFaceRegRequiredAlert(false)}
                className="w-full py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* STANDALONE / ENROLL FACE BIOMETRICS MODAL (Section 5)*/}
        {/* ==================================================== */}
        {isFaceRegModalOpen && (
          <div className="absolute inset-0 bg-slate-950 z-50 p-5 flex flex-col justify-between overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-sm text-white">Face Biometric Registration</span>
              </div>
              <button
                onClick={() => {
                  stopCamera();
                  setIsFaceRegModalOpen(false);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {faceRegStep === 1 && (
              <div className="space-y-4 my-auto text-center">
                <div>
                  <h3 className="text-base font-bold text-white">Capture Face Samples</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Hold device steady. Capture 3 different angles for robust biometric matching.
                  </p>
                </div>

                {/* Progress Indicators for 3 Samples */}
                <div className="flex justify-center gap-2">
                  {[1, 2, 3].map((num) => (
                    <div
                      key={num}
                      className={`flex-1 py-1 rounded-lg text-[10px] font-bold border transition ${
                        faceSamples.length >= num
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-900 text-slate-500 border-slate-800'
                      }`}
                    >
                      Sample {num} {faceSamples.length >= num ? '✓' : ''}
                    </div>
                  ))}
                </div>

                <div className="relative w-52 h-52 mx-auto rounded-full overflow-hidden border-4 border-indigo-500 shadow-2xl bg-black">
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950">
                    <img
                      src={activeEmp.profile_photo}
                      alt="face sample"
                      className="w-full h-full object-cover opacity-80"
                    />
                  </div>
                  <div className="absolute inset-0 border-2 border-dashed border-indigo-400/60 rounded-full animate-pulse pointer-events-none"></div>
                </div>

                <div className="text-xs text-slate-300">
                  {faceSamples.length === 0 && 'Position face directly towards camera (Center)'}
                  {faceSamples.length === 1 && 'Turn head slightly to the left'}
                  {faceSamples.length === 2 && 'Turn head slightly to the right'}
                </div>

                <button
                  onClick={handleCaptureFaceSample}
                  className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg transition"
                >
                  Capture Frame {faceSamples.length + 1} of 3
                </button>
              </div>
            )}

            {faceRegStep === 2 && (
              <div className="space-y-4 my-auto text-center">
                <div className="w-16 h-16 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-indigo-400 flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Liveness Verification Challenge</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Blink naturally and hold still to verify physical presence
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs space-y-2">
                  <div className="flex justify-between text-slate-300">
                    <span>Multi-sample Vector Synthesis:</span>
                    <span className="text-emerald-400 font-bold">3 / 3 Ready</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Anti-Spoofing Protocol:</span>
                    <span>3D Mesh & Skin Texture</span>
                  </div>
                </div>

                {faceRegLivenessStatus === 'analyzing' ? (
                  <div className="py-4 text-amber-400 text-xs font-bold flex items-center justify-center gap-2 animate-pulse">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing facial micro-expressions...</span>
                  </div>
                ) : (
                  <button
                    onClick={handleVerifyFaceRegistrationLiveness}
                    className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition"
                  >
                    Perform Anti-Spoof Liveness Test
                  </button>
                )}
              </div>
            )}

            {faceRegStep === 3 && (
              <div className="space-y-4 my-auto text-center animate-in zoom-in duration-300">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Face Biometrics Enrolled!</h3>
                  <p className="text-xs text-emerald-400 font-medium mt-1">
                    Biometric template registered. Attendance is now enabled.
                  </p>
                </div>

                <button
                  onClick={() => setIsFaceRegModalOpen(false)}
                  className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg transition"
                >
                  Done & Close
                </button>
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* FIRST-TIME LOGIN ONBOARDING MODAL (Section 3)       */}
        {/* ==================================================== */}
        {isOnboardingOpen && (
          <div className="absolute inset-0 bg-slate-950 z-50 p-5 flex flex-col justify-between overflow-y-auto">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                  First-Time Account Setup
                </span>
                <h3 className="font-bold text-sm text-white">Step {onboardingStep} of 4</h3>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((s) => (
                  <div
                    key={s}
                    className={`w-6 h-1.5 rounded-full ${
                      onboardingStep >= s ? 'bg-indigo-500' : 'bg-slate-800'
                    }`}
                  ></div>
                ))}
              </div>
            </div>

            {/* STEP 1: FORCE PASSWORD CHANGE */}
            {onboardingStep === 1 && (
              <form onSubmit={handleOnboardPasswordSubmit} className="space-y-4 my-auto text-xs">
                <div className="text-center space-y-1">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto mb-2">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-white">Set Your New Password</h4>
                  <p className="text-slate-400 text-[11px]">
                    You are logged in with temporary credentials. For security, please set a new personal password.
                  </p>
                </div>

                {onboardPassError && (
                  <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-[11px]">
                    {onboardPassError}
                  </div>
                )}

                <div>
                  <label className="block text-slate-400 mb-1">Temporary Password</label>
                  <input
                    type="text"
                    disabled
                    value={onboardTempPass}
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2 text-slate-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">New Password (Min 8 chars, 1 uppercase, 1 special)</label>
                  <div className="relative">
                    <input
                      type={onboardShowPass ? 'text' : 'password'}
                      required
                      value={onboardNewPass}
                      onChange={(e) => setOnboardNewPass(e.target.value)}
                      placeholder="Enter strong password..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setOnboardShowPass(!onboardShowPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {onboardShowPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={onboardConfirmPass}
                    onChange={(e) => setOnboardConfirmPass(e.target.value)}
                    placeholder="Repeat password..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg"
                >
                  Save Password & Continue →
                </button>
              </form>
            )}

            {/* STEP 2: PROFILE SETUP & PHOTO */}
            {onboardingStep === 2 && (
              <div className="space-y-4 my-auto text-xs text-center">
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white">Profile Photo Setup</h4>
                  <p className="text-slate-400 text-[11px]">
                    Verify your employee identity and register your official profile photograph.
                  </p>
                </div>

                <div className="relative w-24 h-24 mx-auto">
                  <img
                    src={activeEmp.profile_photo}
                    alt={activeEmp.employee_name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-indigo-500 shadow-xl"
                  />
                </div>

                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-left space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Employee ID:</span>
                    <strong className="text-indigo-400 font-mono">{activeEmp.employee_code}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Name:</span>
                    <strong className="text-white">{activeEmp.employee_name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Department:</span>
                    <span className="text-slate-300">{activeEmp.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Office:</span>
                    <span className="text-slate-300">{targetLocation.location_name}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {settings.security.allow_employee_photo_update && (
                    <button
                      onClick={() => setIsPhotoModalOpen(true)}
                      className="w-full py-2.5 rounded-xl bg-slate-900 border border-indigo-500/40 text-indigo-300 font-semibold"
                    >
                      Update / Change Photo
                    </button>
                  )}
                  <button
                    onClick={() => setOnboardingStep(3)}
                    className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg"
                  >
                    Confirm Profile & Next →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: FACE REGISTRATION */}
            {onboardingStep === 3 && (
              <div className="space-y-4 my-auto text-xs text-center">
                <div>
                  <h4 className="text-base font-bold text-white">Enroll Face Biometrics</h4>
                  <p className="text-slate-400 text-[11px] mt-1">
                    Capture 3 facial frames to enable instant contactless attendance check-in.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex justify-between text-slate-300">
                    <span>Enrolled Status:</span>
                    <strong className={activeEmp.face_status === 'Registered' ? 'text-emerald-400' : 'text-amber-400'}>
                      {activeEmp.face_status}
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Samples Captured:</span>
                    <span>{activeEmp.face_samples_count || faceSamples.length} / 3 Frames</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setFaceSamples([]);
                    setFaceRegStep(1);
                    setIsFaceRegModalOpen(true);
                  }}
                  className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>Start Camera & Capture Samples</span>
                </button>

                <button
                  onClick={() => setOnboardingStep(4)}
                  className="w-full py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-semibold"
                >
                  Continue to Permissions →
                </button>
              </div>
            )}

            {/* STEP 4: PERMISSIONS & DASHBOARD ENTRY */}
            {onboardingStep === 4 && (
              <div className="space-y-4 my-auto text-xs text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">App Permissions Setup</h4>
                  <p className="text-slate-400 text-[11px] mt-1">
                    Grant Camera & Location access so the app can verify your physical presence at the workplace.
                  </p>
                </div>

                <div className="space-y-2 text-left">
                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">Camera Access</div>
                      <div className="text-[10px] text-slate-400">Required for face verification</div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                      Granted
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">Precise Location</div>
                      <div className="text-[10px] text-slate-400">Required for office geofencing</div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                      Precise GPS
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsOnboardingOpen(false);
                    // update user in DB to first_login = false
                    if (authSession?.user) {
                      const u = db.getUsers().find((usr) => usr.user_id === authSession.user.user_id);
                      if (u) {
                        u.first_login = false;
                        db.updateUser(u);
                      }
                    }
                  }}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition"
                >
                  Finish Setup & Enter Mobile Dashboard
                </button>
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* ANDROID CAMERA PERMISSION REQUEST MODAL (Section 6)  */}
        {/* ==================================================== */}
        {isCameraPermModalOpen && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-50 p-6 flex flex-col justify-end">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto">
                <Camera className="w-6 h-6" />
              </div>
              <div className="text-center">
                <h4 className="font-bold text-sm text-white">
                  Allow Workforce to take pictures and record video?
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Camera permission is required to capture face attendance and enroll biometric templates.
                </p>
              </div>

              <div className="space-y-1.5 text-xs font-semibold">
                <button
                  onClick={() => {
                    setCameraPermission('granted');
                    setIsCameraPermModalOpen(false);
                  }}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-center"
                >
                  While using the app
                </button>
                <button
                  onClick={() => {
                    setCameraPermission('granted');
                    setIsCameraPermModalOpen(false);
                  }}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-center"
                >
                  Only this time
                </button>
                <button
                  onClick={() => {
                    setCameraPermission('denied');
                    setIsCameraPermModalOpen(false);
                    setCameraPermDeniedAlert(true);
                  }}
                  className="w-full py-2 rounded-xl text-slate-400 hover:text-white text-center"
                >
                  Don't allow
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* CAMERA PERMISSION DENIED BANNER & APP SETTINGS MODAL */}
        {/* ==================================================== */}
        {cameraPermDeniedAlert && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-50 p-6 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-full bg-rose-500/20 border-2 border-rose-500 text-rose-400 flex items-center justify-center mb-3">
              <Camera className="w-7 h-7" />
            </div>
            <h4 className="font-bold text-sm text-white mb-1">Camera Permission Required</h4>
            <p className="text-xs text-slate-300 mb-6 max-w-xs leading-relaxed">
              Camera permission is required for face attendance. Please enable camera access in App Settings.
            </p>
            <div className="w-full space-y-2">
              <button
                onClick={() => {
                  setCameraPermDeniedAlert(false);
                  setCameraPermission('granted');
                }}
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
              >
                Open App Settings
              </button>
              <button
                onClick={() => setCameraPermDeniedAlert(false)}
                className="w-full py-2.5 rounded-2xl bg-slate-900 text-slate-400 text-xs"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* ANDROID LOCATION PERMISSION REQUEST MODAL (Section 7)*/}
        {/* ==================================================== */}
        {isLocationPermModalOpen && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-50 p-6 flex flex-col justify-end">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <MapPin className="w-6 h-6" />
              </div>
              <div className="text-center">
                <h4 className="font-bold text-sm text-white">
                  Allow Workforce to access this device's location?
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Location is required to verify that you are physically present at the authorized office/site.
                </p>
              </div>

              <div className="space-y-1.5 text-xs font-semibold">
                <button
                  onClick={() => {
                    setLocationPermission('precise');
                    setGpsEnabled(true);
                    setIsLocationPermModalOpen(false);
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-center"
                >
                  Precise Location (Recommended)
                </button>
                <button
                  onClick={() => {
                    setLocationPermission('approximate');
                    setGpsEnabled(true);
                    setIsLocationPermModalOpen(false);
                  }}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-center"
                >
                  Approximate Location
                </button>
                <button
                  onClick={() => {
                    setLocationPermission('denied');
                    setIsLocationPermModalOpen(false);
                  }}
                  className="w-full py-2 rounded-xl text-slate-400 hover:text-white text-center"
                >
                  Don't allow
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* PROFILE PHOTO UPDATE MODAL (Section 4)               */}
        {/* ==================================================== */}
        {isPhotoModalOpen && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-50 p-5 flex flex-col justify-end">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="font-bold text-sm text-white">Update Profile Photo</h4>
                <button onClick={() => setIsPhotoModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      if (ev.target?.result) {
                        handleSaveProfilePhoto(ev.target.result as string);
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />

              <div className="grid grid-cols-2 gap-3 text-xs">
                <button
                  onClick={() => {
                    // Simulate taking live photo with camera
                    const samplePics = [
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
                      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
                    ];
                    const chosen = samplePics[Math.floor(Math.random() * samplePics.length)];
                    handleSaveProfilePhoto(chosen);
                  }}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 flex flex-col items-center gap-2"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                    <Camera className="w-5 h-5" />
                  </div>
                  <span className="font-semibold text-white">Take Photo</span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 flex flex-col items-center gap-2"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <span className="font-semibold text-white">Choose from Gallery</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* CHANGE PASSWORD MODAL                                */}
        {/* ==================================================== */}
        {isChangePassModalOpen && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-50 p-5 flex flex-col justify-center">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-indigo-400" />
                  <h4 className="font-bold text-sm text-white">Change Password</h4>
                </div>
                <button onClick={() => setIsChangePassModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {changePassError && (
                <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-[11px]">
                  {changePassError}
                </div>
              )}

              {changePassSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-[11px]">
                  {changePassSuccess}
                </div>
              )}

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setChangePassError(null);
                  setChangePassSuccess(null);
                  if (authSession?.user) {
                    const res = await authService.changePassword(authSession.user.user_id, newPassInput);
                    if (res.success) {
                      setChangePassSuccess('Password updated successfully!');
                      setTimeout(() => setIsChangePassModalOpen(false), 1500);
                    } else {
                      setChangePassError(res.message);
                    }
                  } else {
                    setChangePassSuccess('Password updated successfully!');
                    setTimeout(() => setIsChangePassModalOpen(false), 1500);
                  }
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-slate-400 mb-1">New Password (8+ chars, uppercase, symbol)</label>
                  <input
                    type="password"
                    required
                    value={newPassInput}
                    onChange={(e) => setNewPassInput(e.target.value)}
                    placeholder="New password..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Update Password
                </button>
              </form>
            </div>
          </div>
        )}

        {/* PWA Mobile APK Install Modal */}
        <PWAInstallModal
          isOpen={isPwaModalOpen}
          onClose={() => setIsPwaModalOpen(false)}
          employeeName={activeEmp.employee_name}
        />
      </div>
    </div>
  );
};
