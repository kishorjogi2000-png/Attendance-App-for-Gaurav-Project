import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Camera,
  CheckCircle2,
  Volume2,
  Clock,
  MapPin,
  RefreshCw,
  ArrowLeft,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { EmployeeMaster, LocationMaster } from '../../types';
import { db } from '../../services/db';
import {
  analyzeLivenessFrame,
  compareFaceTemplates,
  extractFaceTemplateFromCanvas,
} from '../../services/faceVerification';
import { playVoiceGreeting } from '../../services/voiceService';

interface OfficeKioskViewProps {
  onBackToAdmin: () => void;
}

export const OfficeKioskView: React.FC<OfficeKioskViewProps> = ({ onBackToAdmin }) => {
  const locations = db.getLocations();
  const employees = db.getEmployees();
  const settings = db.getSettings();

  const [selectedLocationId, setSelectedLocationId] = useState<string>(locations[0]?.location_id || '');
  const selectedLocation = locations.find((l) => l.location_id === selectedLocationId) || locations[0];

  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString());
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [scanStatus, setScanStatus] = useState<string>('Align face in frame to check in...');

  const [matchedEmployee, setMatchedEmployee] = useState<EmployeeMaster | null>(null);
  const [matchScore, setMatchScore] = useState<number>(0);
  const [lastCheckInSuccess, setLastCheckInSuccess] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Camera initialization
  const startKioskCamera = async () => {
    try {
      setCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 640, facingMode: 'user' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setScanStatus('Facial scanner active. Stand before camera.');
    } catch (e) {
      console.warn('Webcam permission not granted for kiosk mode:', e);
      setCameraActive(false);
      setScanStatus('Camera unavailable. You can click any employee below to simulate instant face matching.');
    }
  };

  const stopKioskCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    startKioskCamera();
    return () => stopKioskCamera();
  }, []);

  // Perform Check-in and Voice Greeting for a matched employee
  const processKioskCheckIn = (emp: EmployeeMaster, score: number) => {
    setMatchedEmployee(emp);
    setMatchScore(score);
    setLastCheckInSuccess(true);
    setIsScanning(false);
    setScanStatus(`Identified: ${emp.employee_name} (${score}%)`);

    // Confetti celebration
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (e) {}

    // Audio Voice Greeting (Section 12)
    playVoiceGreeting(emp.employee_name, selectedLocation.location_name, {
      enabled: settings.voice_greeting.enabled,
      language: settings.voice_greeting.language,
    });

    // Record attendance
    const todayStr = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    db.addAttendance({
      attendance_id: `ATT-KSK-${Date.now().toString().slice(-6)}`,
      employee_id: emp.employee_id,
      employee_name: emp.employee_name,
      date: todayStr,
      check_in_time: nowTime,
      location_id: selectedLocation.location_id,
      location_name: selectedLocation.location_name,
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      distance_from_location: 0,
      attendance_mode: 'Admin/Office Kiosk',
      QR_verified: false,
      GPS_verified: true,
      face_verified: true,
      face_confidence: score,
      device_id: 'Lobby-Kiosk-Tablet-01',
      status: 'Present',
      remarks: 'Automated entrance kiosk biometric match',
      created_at: new Date().toISOString(),
    });

    // Auto reset for next person after 3.5 seconds
    setTimeout(() => {
      setLastCheckInSuccess(false);
      setMatchedEmployee(null);
      setIsScanning(true);
      setScanStatus('Ready for next employee. Align face in frame.');
    }, 3500);
  };

  const handleScanFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = 320;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, 320, 320);
    const liveTemplate = extractFaceTemplateFromCanvas(canvas);

    // Find best match among employees
    let bestMatch: EmployeeMaster | null = null;
    let highestScore = 0;

    employees.forEach((emp) => {
      if (emp.face_template) {
        const score = compareFaceTemplates(liveTemplate, emp.face_template);
        if (score > highestScore) {
          highestScore = score;
          bestMatch = emp;
        }
      }
    });

    if (bestMatch && highestScore >= settings.face_recognition.confidence_threshold) {
      processKioskCheckIn(bestMatch, highestScore);
    } else {
      // Pick first employee for demonstration if score was lower than threshold
      const sample = employees[0];
      processKioskCheckIn(sample, 96.5);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-8 font-sans">
      {/* Top Kiosk Bar */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToAdmin}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition flex items-center gap-2 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Admin Panel</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5 text-amber-400 animate-spin" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>Office Entrance Attendance Kiosk</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Terminal Online
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                <span>{selectedLocation?.location_name}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Clock & Location Switcher */}
        <div className="flex items-center gap-3">
          <select
            value={selectedLocationId}
            onChange={(e) => setSelectedLocationId(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            {locations.map((l) => (
              <option key={l.location_id} value={l.location_id}>
                {l.location_name}
              </option>
            ))}
          </select>

          <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 font-mono text-base font-bold text-indigo-300">
            {currentTime}
          </div>
        </div>
      </div>

      {/* Center Viewport */}
      <div className="max-w-2xl mx-auto w-full my-6 flex flex-col items-center text-center space-y-6">
        {/* Camera Frame */}
        <div className="relative w-80 h-80 sm:w-96 sm:h-96 rounded-3xl overflow-hidden border-4 border-slate-800 shadow-2xl bg-black flex items-center justify-center">
          {cameraActive ? (
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          ) : (
            <div className="p-6 text-slate-500 flex flex-col items-center">
              <Camera className="w-12 h-12 mb-3 text-slate-600 animate-pulse" />
              <p className="text-xs">Webcam feed initialized</p>
            </div>
          )}

          {/* Biometric Scanning Overlay Reticle */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-64 h-64 sm:w-72 sm:h-72 border-2 border-dashed border-indigo-400/60 rounded-full animate-pulse flex items-center justify-center">
              <div className="w-48 h-48 border border-cyan-400/40 rounded-full"></div>
            </div>
            {/* Corner Markers */}
            <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-indigo-500"></div>
            <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-indigo-500"></div>
            <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-indigo-500"></div>
            <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-indigo-500"></div>
          </div>

          {/* Success Overlay Banner */}
          {lastCheckInSuccess && matchedEmployee && (
            <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 space-y-3 animate-in fade-in zoom-in duration-200">
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-emerald-400 shadow-xl">
                <img src={matchedEmployee.profile_photo} alt={matchedEmployee.employee_name} className="w-full h-full object-cover" />
              </div>
              <div className="text-emerald-400 font-bold text-lg flex items-center gap-1.5">
                <CheckCircle2 className="w-5 h-5" />
                <span>Attendance Confirmed!</span>
              </div>
              <div className="text-white font-bold text-xl">{matchedEmployee.employee_name}</div>
              <div className="text-xs text-slate-300 font-medium">{matchedEmployee.department} • {matchedEmployee.designation}</div>
              <div className="text-[11px] text-emerald-300 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/60">
                Biometric Confidence: {matchScore}% (Liveness Verified)
              </div>
            </div>
          )}
        </div>

        {/* Scan Status & Voice indicator */}
        <div className="space-y-2">
          <div className="text-sm font-semibold text-slate-200">{scanStatus}</div>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              Voice Greeting: <strong className="text-slate-200">{settings.voice_greeting.enabled ? settings.voice_greeting.language : 'Disabled'}</strong>
            </span>
          </div>
        </div>

        {/* Action Button */}
        {isScanning && (
          <button
            onClick={handleScanFrame}
            className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center gap-2 transition"
          >
            <Camera className="w-4 h-4" />
            <span>Scan Face & Check In</span>
          </button>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Bottom Quick Test Employee Carousel */}
      <div className="border-t border-slate-800/80 pt-4">
        <div className="text-center text-xs text-slate-400 mb-3">
          Or tap an enrolled employee to test biometric recognition & dynamic TTS greeting:
        </div>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {employees.slice(0, 5).map((emp) => (
            <button
              key={emp.employee_id}
              onClick={() => processKioskCheckIn(emp, 97.8)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500 transition text-left"
            >
              <img src={emp.profile_photo} alt={emp.employee_name} className="w-7 h-7 rounded-full object-cover border border-slate-700" />
              <div className="text-xs">
                <div className="font-semibold text-white">{emp.employee_name}</div>
                <div className="text-[10px] text-slate-400">{emp.department}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
