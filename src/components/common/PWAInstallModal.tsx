import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Smartphone,
  Download,
  QrCode,
  Share2,
  CheckCircle2,
  Copy,
  ExternalLink,
  ShieldCheck,
  Camera,
  MapPin,
  Volume2,
  Sparkles,
  X,
  Check,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeName?: string;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  employeeName,
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'builder'>('android');
  const [installSuccess, setInstallSuccess] = useState(false);

  const currentUrl = typeof window !== 'undefined' ? window.location.href.split('?')[0] : '';

  useEffect(() => {
    if (isOpen && currentUrl) {
      QRCode.toDataURL(currentUrl, {
        width: 240,
        margin: 1.5,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch((err) => console.error('Failed to generate QR code', err));
    }
  }, [isOpen, currentUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `📲 *Smart Workforce Attendance Mobile App (APK)*\n\nApne mobile phone par attendance punch in/out karne ke liye is link ko open karein aur "Install App" / "Add to Home Screen" karein:\n\n${currentUrl}\n\nFeatures: Selfie photo, GPS location, aur Welcome Voice greeting!`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleTriggerInstall = async () => {
    const success = await install();
    if (success) {
      setInstallSuccess(true);
      setTimeout(() => {
        setInstallSuccess(false);
        onClose();
      }, 2000);
    }
  };

  const pwaBuilderUrl = `https://www.pwabuilder.com?url=${encodeURIComponent(currentUrl)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-6">
        {/* Header Banner */}
        <div className="relative bg-gradient-to-r from-blue-700 via-indigo-600 to-cyan-600 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white/90 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white p-2 shadow-lg flex items-center justify-center shrink-0">
              <img src="/icon.svg" alt="App Icon" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-semibold tracking-wide uppercase">
                <Sparkles className="w-3 h-3 text-amber-300" /> Mobile APK & App Installation
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1">
                Attendance Mobile App (APK)
              </h2>
              <p className="text-xs sm:text-sm text-blue-100">
                {employeeName ? `Hello ${employeeName}! ` : ''}Mobile me install karein aur camera selfie, GPS aur voice ke sath punch karein.
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 text-slate-200">
          {/* Main 1-Click Install Action if browser supports it */}
          {isInstallable && (
            <div className="bg-gradient-to-r from-emerald-950/80 to-teal-950/80 border border-emerald-500/50 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-emerald-200 text-sm">
                    1-Click Direct Install (Android WebAPK)
                  </div>
                  <div className="text-xs text-emerald-300/80">
                    Aapka browser is app ko direct phone app ki tarah install kar sakta hai.
                  </div>
                </div>
              </div>
              <button
                onClick={handleTriggerInstall}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition"
              >
                <Download className="w-4 h-4" />
                Install App Now
              </button>
            </div>
          )}

          {installSuccess && (
            <div className="bg-emerald-900/60 border border-emerald-500 rounded-xl p-3 text-xs text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>App mobile home screen par successfully install ho rahi hai!</span>
            </div>
          )}

          {isInstalled && (
            <div className="bg-blue-950/60 border border-blue-600/40 rounded-xl p-3 text-xs text-blue-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Yeh app pehle se aapke device par as Standalone App installed hai!</span>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-800 gap-2">
            <button
              onClick={() => setActiveTab('android')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition ${
                activeTab === 'android'
                  ? 'border-emerald-400 text-emerald-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Android Phone Install (WebAPK)
            </button>
            <button
              onClick={() => setActiveTab('ios')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition ${
                activeTab === 'ios'
                  ? 'border-indigo-400 text-indigo-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              iPhone / iOS
            </button>
            <button
              onClick={() => setActiveTab('builder')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition ${
                activeTab === 'builder'
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Raw .APK File Builder
            </button>
          </div>

          {/* Tab 1: Android WebAPK Flow */}
          {activeTab === 'android' && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
              {/* QR Code Container */}
              <div className="md:col-span-2 flex flex-col items-center justify-center p-4 bg-slate-950 border border-slate-800 rounded-2xl text-center">
                <div className="bg-white p-2 rounded-xl shadow-md mb-2">
                  {qrCodeDataUrl ? (
                    <img src={qrCodeDataUrl} alt="Scan to Install on Mobile" className="w-40 h-40 object-contain" />
                  ) : (
                    <div className="w-40 h-40 flex items-center justify-center text-slate-400 text-xs">
                      Loading QR...
                    </div>
                  )}
                </div>
                <div className="font-bold text-xs text-white flex items-center gap-1">
                  <QrCode className="w-3.5 h-3.5 text-cyan-400" /> Mobile Camera se Scan karein
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Apne phone ka camera open karke scan karein
                </div>
              </div>

              {/* Step by Step instructions */}
              <div className="md:col-span-3 space-y-3 text-xs">
                <div className="font-bold text-sm text-slate-100 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  Android Phone me Kaise Install Karein:
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      1
                    </div>
                    <div>
                      <span className="font-bold text-white">Chrome me Link Open Karein:</span>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        QR scan karein ya niche diye button se link apne phone me open karein.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      2
                    </div>
                    <div>
                      <span className="font-bold text-white">Install App / Add to Home screen dabayein:</span>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        Chrome ke upar 3 dots (<span className="font-bold text-white">⋮</span>) par click karein aur <strong className="text-emerald-300">"Install app"</strong> ya <strong className="text-emerald-300">"Add to Home screen"</strong> chunein.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      3
                    </div>
                    <div>
                      <span className="font-bold text-white">Native Mobile APK Icon Ready:</span>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        Android system iska app icon home screen par bana dega. Click karke sidha attendance punch karein!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: iOS Flow */}
          {activeTab === 'ios' && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
              <div className="md:col-span-2 flex flex-col items-center justify-center p-4 bg-slate-950 border border-slate-800 rounded-2xl text-center">
                <div className="bg-white p-2 rounded-xl shadow-md mb-2">
                  {qrCodeDataUrl && (
                    <img src={qrCodeDataUrl} alt="Scan to Install on iPhone" className="w-40 h-40 object-contain" />
                  )}
                </div>
                <div className="font-bold text-xs text-white">iPhone Camera se Scan karein</div>
              </div>

              <div className="md:col-span-3 space-y-3 text-xs">
                <div className="font-bold text-sm text-slate-100">iPhone / iPad Installation:</div>
                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="font-bold text-white">1. Open in Safari browser</div>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Link ko Apple Safari browser me open karein.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="font-bold text-white">2. Tap Share Icon (□↑)</div>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Safari ke bottom bar me Share button dabayein.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="font-bold text-white">3. Select "Add to Home Screen"</div>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      "Add to Home Screen" (होम स्क्रीन में जोड़ें) dabate hi app icon ban jayega.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: PWABuilder / Standalone APK Packager */}
          {activeTab === 'builder' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-800/60">
                <div className="flex items-center gap-2 font-bold text-sm text-cyan-200">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  Generate Signed Android `.apk` / `.aab` Package via PWABuilder
                </div>
                <p className="text-slate-300 text-xs mt-1">
                  Agar aapko WhatsApp / PenDrive se distribute karne ke liye raw <strong>.apk installer file</strong> chahiye ya Google Play Store par upload karna hai, toh PWABuilder (Microsoft / Google supported) is live PWA ko 1-minute me compile karke signed APK provide karta hai:
                </p>

                <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
                  <a
                    href={pwaBuilderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center justify-center gap-2 shadow-lg transition"
                  >
                    <span>Open PWABuilder with App URL</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <span className="text-[11px] text-slate-400">
                    Click karte hi automatically URL verify hoga aur APK download button aa jayega.
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="font-mono text-[11px] text-slate-400 break-all select-all">
                  App PWA URL: <span className="text-cyan-300 font-bold">{currentUrl}</span>
                </div>
              </div>
            </div>
          )}

          {/* Attendance Features Readiness Checklist */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Mobile App Features Included in APK:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                <Camera className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-200 text-[11px]">Selfie & Face ID</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-slate-200 text-[11px]">GPS Geofence</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-200 text-[11px]">Voice Greeting</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-slate-200 text-[11px]">Offline Sync</span>
              </div>
            </div>
          </div>

          {/* Sharing Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Link Copied!' : 'Copy Mobile Link'}
              </button>
              <button
                onClick={handleShareWhatsApp}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white text-xs font-semibold transition"
              >
                <Share2 className="w-3.5 h-3.5" />
                Share on WhatsApp
              </button>
            </div>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
            >
              Done / Band Karein
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
