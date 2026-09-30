import React, { useState } from 'react';
import {
  MapPin,
  Plus,
  QrCode,
  Edit2,
  Trash2,
  CheckCircle2,
  Compass,
  Navigation,
  Shield,
  Volume2,
  X,
  Search,
} from 'lucide-react';
import { LocationMaster, OfficeType } from '../../types';
import { db } from '../../services/db';

interface LocationsViewProps {
  onSelectForQR?: (location: LocationMaster) => void;
}

export const LocationsView: React.FC<LocationsViewProps> = ({ onSelectForQR }) => {
  const [locations, setLocations] = useState<LocationMaster[]>(() => db.getLocations());
  const shifts = db.getShifts();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLoc, setEditingLoc] = useState<LocationMaster | null>(null);

  // Form Fields
  const [locName, setLocName] = useState('');
  const [locCode, setLocCode] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number>(21.2514);
  const [longitude, setLongitude] = useState<number>(81.6296);
  const [radius, setRadius] = useState<number>(100);
  const [customRadius, setCustomRadius] = useState<number>(100);
  const [officeType, setOfficeType] = useState<OfficeType>('Site Office');
  const [shiftId, setShiftId] = useState(shifts[0]?.shift_id || 'SHF-GEN');

  // Per-Location Attendance Rules
  const [gpsRequired, setGpsRequired] = useState(true);
  const [qrRequired, setQrRequired] = useState(true);
  const [faceRequired, setFaceRequired] = useState(true);
  const [voiceGreeting, setVoiceGreeting] = useState(true);

  // Search Address input
  const [addressSearch, setAddressSearch] = useState('');

  const refresh = () => setLocations([...db.getLocations()]);

  const handleOpenAdd = () => {
    setEditingLoc(null);
    setLocName('');
    setLocCode(`SITE-0${locations.length + 1}`);
    setAddress('');
    setLatitude(21.2514);
    setLongitude(81.6296);
    setRadius(100);
    setOfficeType('Site Office');
    setShiftId(shifts[0]?.shift_id || 'SHF-GEN');
    setGpsRequired(true);
    setQrRequired(true);
    setFaceRequired(true);
    setVoiceGreeting(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (loc: LocationMaster) => {
    setEditingLoc(loc);
    setLocName(loc.location_name);
    setLocCode(loc.location_code);
    setAddress(loc.address);
    setLatitude(loc.latitude);
    setLongitude(loc.longitude);
    setRadius(loc.allowed_radius_meters);
    setOfficeType(loc.office_type);
    setShiftId(loc.shift_id || shifts[0]?.shift_id || 'SHF-GEN');
    setGpsRequired(loc.gps_required);
    setQrRequired(loc.qr_required);
    setFaceRequired(loc.face_required);
    setVoiceGreeting(loc.voice_greeting);
    setIsModalOpen(true);
  };

  const handleSearchAddress = () => {
    if (!addressSearch.trim()) return;
    // Preset geocoding coordinates for simulated demonstration
    const lower = addressSearch.toLowerCase();
    if (lower.includes('raipur') || lower.includes('vip') || lower.includes('d office')) {
      setLatitude(21.2514);
      setLongitude(81.6296);
      setAddress('VIP Road, Sector 5, Financial Center, Raipur, CG');
    } else if (lower.includes('delhi') || lower.includes('connaught')) {
      setLatitude(28.6315);
      setLongitude(77.2167);
      setAddress('Connaught Place, Central Wing, New Delhi');
    } else if (lower.includes('mumbai') || lower.includes('bkc')) {
      setLatitude(19.0657);
      setLongitude(72.8682);
      setAddress('Bandra Kurla Complex, G Block, Mumbai');
    } else if (lower.includes('bangalore') || lower.includes('bengaluru')) {
      setLatitude(12.9716);
      setLongitude(77.5946);
      setAddress('Electronic City Phase 1, Bengaluru, Karnataka');
    } else {
      // Default to slight offset
      setLatitude((prev) => parseFloat((prev + 0.005).toFixed(4)));
      setLongitude((prev) => parseFloat((prev + 0.005).toFixed(4)));
      setAddress(addressSearch);
    }
  };

  const handleMapCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // Map click to slight coordinate delta relative to center
    const deltaLat = ((rect.height / 2 - y) / rect.height) * 0.02;
    const deltaLon = ((x - rect.width / 2) / rect.width) * 0.02;
    setLatitude((prev) => parseFloat((prev + deltaLat).toFixed(4)));
    setLongitude((prev) => parseFloat((prev + deltaLon).toFixed(4)));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locName.trim() || !locCode.trim()) {
      alert('Location name and code are required.');
      return;
    }

    const finalRadius = radius === -1 ? customRadius : radius;

    if (editingLoc) {
      const updated: LocationMaster = {
        ...editingLoc,
        location_name: locName,
        location_code: locCode,
        address,
        latitude,
        longitude,
        allowed_radius_meters: finalRadius,
        office_type: officeType,
        shift_id: shiftId,
        gps_required: gpsRequired,
        qr_required: qrRequired,
        face_required: faceRequired,
        voice_greeting: voiceGreeting,
      };
      db.updateLocation(updated);
    } else {
      const newLoc: LocationMaster = {
        location_id: `LOC-${locCode.replace(/[^a-zA-Z0-9]/g, '-').toUpperCase()}`,
        location_name: locName,
        location_code: locCode,
        address: address || 'Authorized Work Location',
        latitude,
        longitude,
        allowed_radius_meters: finalRadius,
        QR_code: `${locCode.toUpperCase()}-ATTENDANCE-QR`,
        QR_secret: `sec_${Math.random().toString(36).substring(2, 9)}`,
        office_type: officeType,
        status: 'Active',
        shift_id: shiftId,
        gps_required: gpsRequired,
        qr_required: qrRequired,
        face_required: faceRequired,
        voice_greeting: voiceGreeting,
      };
      db.addLocation(newLoc);
    }

    setIsModalOpen(false);
    refresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-indigo-400" />
            Location & Geofencing Master
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure enterprise offices, site units, and factories with GPS coordinates, geofence radius, and attendance security rules.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Create Location</span>
        </button>
      </div>

      {/* Locations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {locations.map((loc) => (
          <div
            key={loc.location_id}
            className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {loc.office_type}
                  </span>
                  <h3 className="font-bold text-sm text-white mt-1.5">{loc.location_name}</h3>
                  <div className="text-[11px] text-slate-500 font-mono">{loc.location_code}</div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(loc)}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 transition"
                    title="Edit Location"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-400 mb-4 line-clamp-2">{loc.address}</p>

              {/* Geofence specs */}
              <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800/80 space-y-2 text-xs mb-4">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-indigo-400" /> GPS Center
                  </span>
                  <span className="font-mono text-slate-200">
                    {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-emerald-400" /> Permitted Radius
                  </span>
                  <span className="font-bold text-emerald-400">{loc.allowed_radius_meters} Meters</span>
                </div>
              </div>

              {/* Attendance Rules Badges */}
              <div className="text-[11px] text-slate-400 space-y-1 mb-4">
                <div className="font-semibold text-slate-300 text-xs mb-1.5">Security Gate Policies:</div>
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  <div className={`flex items-center gap-1 px-2 py-1 rounded ${loc.gps_required ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40' : 'bg-slate-900 text-slate-500'}`}>
                    <CheckCircle2 className="w-2.5 h-2.5" /> GPS Geofence
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded ${loc.qr_required ? 'bg-indigo-950/40 text-indigo-300 border border-indigo-800/40' : 'bg-slate-900 text-slate-500'}`}>
                    <CheckCircle2 className="w-2.5 h-2.5" /> Dynamic QR
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded ${loc.face_required ? 'bg-purple-950/40 text-purple-300 border border-purple-800/40' : 'bg-slate-900 text-slate-500'}`}>
                    <CheckCircle2 className="w-2.5 h-2.5" /> Face Liveness
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded ${loc.voice_greeting ? 'bg-cyan-950/40 text-cyan-300 border border-cyan-800/40' : 'bg-slate-900 text-slate-500'}`}>
                    <CheckCircle2 className="w-2.5 h-2.5" /> Voice TTS
                  </div>
                </div>
              </div>
            </div>

            {/* Quick QR Generator Action */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Terminal Secret: ••••••••</span>
              <button
                onClick={() => onSelectForQR && onSelectForQR(loc)}
                className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Open in QR Studio</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Location Modal with Interactive Geofence Map */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl p-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-400" />
                {editingLoc ? 'Configure Location & Geofence' : 'Create Custom Attendance Location'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Map Coordinate Selector & Search Box */}
              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-indigo-400" />
                    <span>Method 1: Search Address or Method 2: Select on Map</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Click canvas to reposition GPS center</span>
                </div>

                {/* Address Search Bar */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Type office address (e.g. VIP Road Raipur, Connaught Place Delhi, BKC Mumbai)..."
                      value={addressSearch}
                      onChange={(e) => setAddressSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearchAddress())}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSearchAddress}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
                  >
                    Locate
                  </button>
                </div>

                {/* Simulated Interactive Geofence Map Canvas */}
                <div
                  onClick={handleMapCanvasClick}
                  className="relative w-full h-56 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden cursor-crosshair group shadow-inner"
                  title="Click to relocate geofence center point"
                >
                  {/* Grid Lines */}
                  <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>

                  {/* Road Network Lines Simulation */}
                  <svg className="absolute inset-0 w-full h-full stroke-slate-800/80 stroke-2">
                    <path d="M 0 60 Q 200 120 800 90" fill="none" strokeWidth="4" />
                    <path d="M 120 0 Q 150 250 180 300" fill="none" strokeWidth="3" />
                    <path d="M 450 0 L 420 300" fill="none" strokeWidth="3" />
                    <path d="M 0 190 L 800 170" fill="none" strokeWidth="4" />
                  </svg>

                  {/* Geofence Radius Circle */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div
                      className="rounded-full bg-indigo-500/15 border-2 border-indigo-500/60 flex items-center justify-center transition-all duration-300 shadow-lg shadow-indigo-500/10"
                      style={{
                        width: `${Math.min(220, Math.max(50, (radius === -1 ? customRadius : radius) * 1.1))}px`,
                        height: `${Math.min(220, Math.max(50, (radius === -1 ? customRadius : radius) * 1.1))}px`,
                      }}
                    >
                      <div className="w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-md animate-ping opacity-75"></div>
                      <div className="absolute w-3 h-3 rounded-full bg-white border-2 border-indigo-600 shadow"></div>
                    </div>
                  </div>

                  {/* Map Coordinate Overlay Pill */}
                  <div className="absolute bottom-3 left-3 bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center gap-2">
                    <Navigation className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Lat: {latitude.toFixed(6)} | Lon: {longitude.toFixed(6)}</span>
                  </div>

                  <div className="absolute top-3 right-3 bg-indigo-950/90 backdrop-blur-md px-2.5 py-1 rounded-md border border-indigo-800/80 text-[10px] text-indigo-300 font-semibold">
                    Geofence Radius: {radius === -1 ? customRadius : radius}m
                  </div>
                </div>
              </div>

              {/* Location Detail Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Location Name *</label>
                  <input
                    type="text"
                    required
                    value={locName}
                    onChange={(e) => setLocName(e.target.value)}
                    placeholder="e.g. D Office - Headquarters"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Location Code *</label>
                  <input
                    type="text"
                    required
                    value={locCode}
                    onChange={(e) => setLocCode(e.target.value)}
                    placeholder="e.g. D-OFFICE or SITE-01"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-400 mb-1 font-medium">Full Physical Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Street, Industrial Area, City, State, PIN"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={latitude}
                    onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={longitude}
                    onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Allowed Geofence Radius</label>
                  <select
                    value={radius}
                    onChange={(e) => setRadius(parseInt(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="25">25 meters (Strict indoor room)</option>
                    <option value="50">50 meters (Small office building)</option>
                    <option value="100">100 meters (Corporate campus / Standard)</option>
                    <option value="200">200 meters (Large warehouse hub)</option>
                    <option value="500">500 meters (Industrial factory / Highway site)</option>
                    <option value="-1">Custom Radius...</option>
                  </select>
                </div>

                {radius === -1 && (
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Custom Radius (Meters)</label>
                    <input
                      type="number"
                      min="10"
                      max="5000"
                      value={customRadius}
                      onChange={(e) => setCustomRadius(parseInt(e.target.value) || 100)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Office Type</label>
                  <select
                    value={officeType}
                    onChange={(e) => setOfficeType(e.target.value as OfficeType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Head Office">Head Office</option>
                    <option value="Site Office">Site Office</option>
                    <option value="Warehouse">Warehouse</option>
                    <option value="Factory">Factory</option>
                    <option value="Project Site">Project Site</option>
                    <option value="Branch Office">Branch Office</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Default Shift</label>
                  <select
                    value={shiftId}
                    onChange={(e) => setShiftId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    {shifts.map((s) => (
                      <option key={s.shift_id} value={s.shift_id}>
                        {s.shift_name} ({s.start_time} - {s.end_time})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Per-Location Gate Rules */}
              <div className="bg-slate-950 rounded-xl p-3 border border-slate-800">
                <div className="text-xs font-semibold text-slate-300 mb-2">
                  Location Specific Attendance Rules (Section 41)
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gpsRequired}
                      onChange={(e) => setGpsRequired(e.target.checked)}
                      className="rounded accent-indigo-600"
                    />
                    <span className="text-slate-300">GPS Required</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={qrRequired}
                      onChange={(e) => setQrRequired(e.target.checked)}
                      className="rounded accent-indigo-600"
                    />
                    <span className="text-slate-300">QR Required</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={faceRequired}
                      onChange={(e) => setFaceRequired(e.target.checked)}
                      className="rounded accent-indigo-600"
                    />
                    <span className="text-slate-300">Face Required</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={voiceGreeting}
                      onChange={(e) => setVoiceGreeting(e.target.checked)}
                      className="rounded accent-indigo-600"
                    />
                    <span className="text-slate-300">Voice Greeting</span>
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30"
                >
                  {editingLoc ? 'Update Location' : 'Save & Generate QR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
