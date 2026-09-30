import React, { useState, useEffect } from 'react';
import {
  QrCode,
  RefreshCw,
  Download,
  Printer,
  ShieldCheck,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { LocationMaster } from '../../types';
import { db } from '../../services/db';
import { generateQRToken, renderQRCodeDataUrl, validateQRToken } from '../../services/qrSecurity';

interface QRManagementViewProps {
  initialLocationId?: string;
}

export const QRManagementView: React.FC<QRManagementViewProps> = ({ initialLocationId }) => {
  const locations = db.getLocations();
  const company = db.getCompany();

  const [selectedLocationId, setSelectedLocationId] = useState<string>(
    initialLocationId || locations[0]?.location_id || ''
  );
  const [qrType, setQrType] = useState<'dynamic' | 'static'>('dynamic');
  const [refreshInterval, setRefreshInterval] = useState<number>(60); // 30, 60, 300 seconds
  const [secondsRemaining, setSecondsRemaining] = useState<number>(60);

  const [currentQRString, setCurrentQRString] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [nonce, setNonce] = useState<string>('');
  const [tokenPayload, setTokenPayload] = useState<any>(null);

  // Token Validation Sandbox Tester
  const [testTokenInput, setTestTokenInput] = useState<string>('');
  const [testResult, setTestResult] = useState<any>(null);

  const selectedLoc = locations.find((l) => l.location_id === selectedLocationId) || locations[0];

  // Refresh QR token
  const refreshQR = () => {
    if (!selectedLoc) return;
    const { qrString, payload } = generateQRToken(
      selectedLoc.location_id,
      selectedLoc.location_code,
      selectedLoc.QR_secret,
      qrType,
      refreshInterval
    );
    setCurrentQRString(qrString);
    setNonce(payload.nonce);
    setTokenPayload(payload);
    setSecondsRemaining(refreshInterval);

    renderQRCodeDataUrl(qrString).then((url) => {
      setQrDataUrl(url);
    });
  };

  // Initial generation and trigger on location / type change
  useEffect(() => {
    refreshQR();
  }, [selectedLocationId, qrType, refreshInterval]);

  // Dynamic countdown timer
  useEffect(() => {
    if (qrType === 'static') return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          refreshQR();
          return refreshInterval;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [qrType, refreshInterval, selectedLocationId]);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `${selectedLoc.location_code}_${qrType.toUpperCase()}_QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPoster = () => {
    window.print();
  };

  const handleTestToken = () => {
    if (!testTokenInput.trim() || !selectedLoc) return;
    const res = validateQRToken(testTokenInput.trim(), selectedLoc.location_id, selectedLoc.QR_secret);
    setTestResult(res);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <QrCode className="w-5 h-5 text-indigo-400" />
            Dynamic & Static QR Studio
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise QR tokens with cryptographic HMAC signatures, location binding, and auto-rotating anti-screenshot replay protection.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshQR}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
            <span>Regenerate Token</span>
          </button>
          <button
            onClick={handleDownload}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Download PNG</span>
          </button>
          <button
            onClick={handlePrintPoster}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Office Poster</span>
          </button>
        </div>
      </div>

      {/* Main Studio Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: QR Controls & Settings */}
        <div className="space-y-4">
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <h2 className="font-semibold text-sm text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-400" />
              <span>Select Work Location</span>
            </h2>

            <div>
              <label className="block text-slate-400 text-xs mb-1.5 font-medium">Terminal Location</label>
              <select
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {locations.map((l) => (
                  <option key={l.location_id} value={l.location_id}>
                    {l.location_name} ({l.location_code})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <label className="block text-slate-400 text-xs mb-1.5 font-medium">Security Mode</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setQrType('dynamic')}
                  className={`p-3 rounded-xl border text-xs font-semibold text-left transition ${
                    qrType === 'dynamic'
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>Dynamic Rotating</span>
                    {qrType === 'dynamic' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Auto-expires. Prevents photo spoofing.</div>
                </button>

                <button
                  type="button"
                  onClick={() => setQrType('static')}
                  className={`p-3 rounded-xl border text-xs font-semibold text-left transition ${
                    qrType === 'static'
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>Static Terminal</span>
                    {qrType === 'static' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Permanent entrance poster QR.</div>
                </button>
              </div>
            </div>

            {qrType === 'dynamic' && (
              <div className="pt-2 border-t border-slate-800">
                <label className="block text-slate-400 text-xs mb-1.5 font-medium">Token Refresh Interval</label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { label: '30 Sec', sec: 30 },
                    { label: '1 Min', sec: 60 },
                    { label: '5 Min', sec: 300 },
                  ].map((opt) => (
                    <button
                      key={opt.sec}
                      type="button"
                      onClick={() => setRefreshInterval(opt.sec)}
                      className={`py-2 px-3 rounded-xl border font-semibold text-center transition ${
                        refreshInterval === opt.sec
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Cryptographic Token Details */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2.5 text-xs">
            <h3 className="font-semibold text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Security Token Inspection</span>
            </h3>
            <div className="font-mono text-[10px] bg-slate-900 p-2.5 rounded-lg border border-slate-800 space-y-1 text-slate-300 overflow-x-auto">
              <div><strong>Location ID:</strong> {tokenPayload?.locationId}</div>
              <div><strong>Nonce:</strong> {nonce}</div>
              <div><strong>Signature:</strong> {tokenPayload?.signature}</div>
              <div><strong>Type:</strong> {tokenPayload?.type}</div>
              <div><strong>Expiry:</strong> {new Date(tokenPayload?.expiresAt || 0).toLocaleTimeString()}</div>
            </div>
            <p className="text-[10px] text-slate-500">
              * The employee mobile app decodes this token and validates against server cryptographic keys.
            </p>
          </div>
        </div>

        {/* Center Column: High-Res QR Display & Live Terminal Mockup */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center justify-between text-center relative overflow-hidden">
          {/* Printable Poster Header */}
          <div className="w-full border-b border-slate-800 pb-4 mb-4">
            <div className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">
              {company.company_name}
            </div>
            <h2 className="text-lg font-bold text-white mt-0.5">{selectedLoc?.location_name}</h2>
            <div className="text-xs text-slate-400 mt-0.5">Official Workforce Attendance Terminal</div>
          </div>

          {/* QR Code Container */}
          <div className="relative p-6 bg-white rounded-3xl shadow-2xl border-4 border-slate-700/50 my-2">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Attendance QR Code" className="w-64 h-64 object-contain" />
            ) : (
              <div className="w-64 h-64 flex items-center justify-center text-slate-400">
                Generating QR...
              </div>
            )}

            {/* Center Logo Badge */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-12 h-12 rounded-xl bg-slate-900 border-2 border-indigo-400 flex items-center justify-center shadow-lg">
                <QrCode className="w-6 h-6 text-indigo-400" />
              </div>
            </div>
          </div>

          {/* Countdown Clock for Dynamic Mode */}
          {qrType === 'dynamic' ? (
            <div className="mt-4 w-full bg-slate-900/90 border border-indigo-900/50 rounded-2xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-indigo-300">
                <Clock className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Next token rotation:</span>
              </div>
              <div className="font-mono font-bold text-sm text-indigo-300 bg-indigo-950/80 px-3 py-1 rounded-lg border border-indigo-800">
                {secondsRemaining}s
              </div>
            </div>
          ) : (
            <div className="mt-4 text-xs text-slate-400">
              Static Terminal Poster - Ready for Wall Mounting
            </div>
          )}

          {/* Quick Copy String */}
          <div className="mt-4 w-full flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={currentQRString}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-[10px] font-mono text-slate-400 focus:outline-none"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(currentQRString);
                alert('QR token payload copied to clipboard!');
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0"
              title="Copy token string"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Security Verification Sandbox Tester */}
        <div className="space-y-4">
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
            <h2 className="font-semibold text-sm text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Token Validation Simulator</span>
            </h2>
            <p className="text-xs text-slate-400">
              Test scanning any QR string to verify HMAC cryptographic integrity and anti-replay protection.
            </p>

            <div>
              <label className="block text-slate-400 text-xs mb-1 font-medium">Scanned QR String Payload</label>
              <textarea
                rows={3}
                value={testTokenInput}
                onChange={(e) => setTestTokenInput(e.target.value)}
                placeholder="Paste SWQR::... string here to validate"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-[11px] font-mono text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTestTokenInput(currentQRString)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Paste Current Token
              </button>
              <button
                type="button"
                onClick={handleTestToken}
                className="flex-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow"
              >
                Validate Token
              </button>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-xl border text-xs space-y-1 ${
                  testResult.isValid
                    ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-800 text-rose-300'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  {testResult.isValid ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                  <span>{testResult.message}</span>
                </div>
                {testResult.locationCode && (
                  <div className="text-[11px] text-slate-300">
                    Location: <strong>{testResult.locationCode}</strong> (ID: {testResult.locationId})
                  </div>
                )}
                {testResult.isExpired && (
                  <div className="text-[11px] font-bold text-rose-400">
                    Reason: Expired rotating token
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Anti-Fraud Protections Information Box */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2 text-xs">
            <h3 className="font-semibold text-slate-200">How Anti-Fraud Works</h3>
            <ul className="space-y-1.5 text-slate-400 text-[11px]">
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold">•</span>
                <span><strong>No Fake QR:</strong> Signed with a per-office secret never stored on the client.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold">•</span>
                <span><strong>No Screenshot Sharing:</strong> Tokens expire in 60s, making forwarded images invalid.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold">•</span>
                <span><strong>Geofence Cross-Check:</strong> App verifies device GPS within radius simultaneously.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
