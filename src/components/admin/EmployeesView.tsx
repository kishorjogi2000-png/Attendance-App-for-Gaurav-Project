import React, { useState, useRef } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Camera,
  CheckCircle,
  AlertCircle,
  Edit2,
  Trash2,
  MapPin,
  Building2,
  Briefcase,
  Shield,
  X,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { EmployeeCategory, EmployeeMaster, EmploymentType } from '../../types';
import { db } from '../../services/db';
import { extractFaceTemplateFromCanvas } from '../../services/faceVerification';

export const EmployeesView: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeMaster[]>(() => db.getEmployees());
  const departments = db.getDepartments();
  const locations = db.getLocations();
  const shifts = db.getShifts();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeMaster | null>(null);

  // Form Fields
  const [empName, setEmpName] = useState('');
  const [empCode, setEmpCode] = useState('');
  const [empMobile, setEmpMobile] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empDept, setEmpDept] = useState(departments[0]?.department_name || 'Human Resources');
  const [empDesignation, setEmpDesignation] = useState('');
  const [empCategory, setEmpCategory] = useState<EmployeeCategory>('Permanent');
  const [customCategory, setCustomCategory] = useState('');
  const [empType, setEmpType] = useState<EmploymentType>('Full-Time');
  const [empLocation, setEmpLocation] = useState(locations[0]?.location_id || '');
  const [empShift, setEmpShift] = useState(shifts[0]?.shift_id || '');
  const [empPhoto, setEmpPhoto] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');

  // Camera & Face Enrollment State
  const [cameraActive, setCameraActive] = useState(false);
  const [faceSamples, setFaceSamples] = useState<string[]>([]);
  const [extractedTemplate, setExtractedTemplate] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Refresh local list on db update
  const refresh = () => setEmployees([...db.getEmployees()]);

  const handleOpenAdd = () => {
    setEditingEmployee(null);
    setEmpName('');
    setEmpCode(`APX-${Math.floor(1000 + Math.random() * 9000)}`);
    setEmpMobile('+91 ');
    setEmpEmail('');
    setEmpDept(departments[0]?.department_name || 'Human Resources');
    setEmpDesignation('');
    setEmpCategory('Permanent');
    setCustomCategory('');
    setEmpType('Full-Time');
    setEmpLocation(locations[0]?.location_id || '');
    setEmpShift(shifts[0]?.shift_id || '');
    setEmpPhoto('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80');
    setFaceSamples([]);
    setExtractedTemplate('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: EmployeeMaster) => {
    setEditingEmployee(emp);
    setEmpName(emp.employee_name);
    setEmpCode(emp.employee_code);
    setEmpMobile(emp.mobile);
    setEmpEmail(emp.email);
    setEmpDept(emp.department);
    setEmpDesignation(emp.designation);
    setEmpCategory(emp.employee_category);
    setEmpType(emp.employment_type);
    setEmpLocation(emp.assigned_location);
    setEmpShift(emp.shift);
    setEmpPhoto(emp.profile_photo);
    setExtractedTemplate(emp.face_template || '');
    setFaceSamples(emp.face_samples_count ? [`Sample 1 (${emp.face_samples_count} enrolled)`] : []);
    setIsModalOpen(true);
  };

  const startCamera = async () => {
    try {
      setCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 480, height: 480, facingMode: 'user' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert('Unable to access webcam. Please ensure camera permissions are allowed.');
      setCameraActive(false);
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

  const captureFaceSample = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, 300, 300);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const template = extractFaceTemplateFromCanvas(canvas);

    setFaceSamples((prev) => [...prev, dataUrl]);
    setExtractedTemplate(template);
    setEmpPhoto(dataUrl);

    if (faceSamples.length >= 2) {
      stopCamera();
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName.trim() || !empCode.trim()) {
      alert('Please fill in employee name and employee code.');
      return;
    }

    const finalCategory = empCategory === 'Other' && customCategory.trim() ? customCategory.trim() : empCategory;

    if (editingEmployee) {
      const updated: EmployeeMaster = {
        ...editingEmployee,
        employee_name: empName,
        employee_code: empCode,
        mobile: empMobile,
        email: empEmail,
        department: empDept,
        designation: empDesignation,
        employee_category: finalCategory,
        employment_type: empType,
        assigned_location: empLocation,
        shift: empShift,
        profile_photo: empPhoto,
        face_template: extractedTemplate || editingEmployee.face_template,
        face_samples_count: Math.max(editingEmployee.face_samples_count, faceSamples.length || 1),
        face_status: (faceSamples.length > 0 || extractedTemplate || editingEmployee.face_status === 'Registered') ? 'Registered' : 'Pending Registration',
      };
      db.updateEmployee(updated);
    } else {
      const newEmp: EmployeeMaster = {
        employee_id: `EMP-${Date.now().toString().slice(-4)}`,
        employee_code: empCode,
        employee_name: empName,
        profile_photo: empPhoto,
        face_template: extractedTemplate || 'AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyAhIiMkJSYnKCkqKywtLi8w',
        face_samples_count: faceSamples.length || 3,
        face_status: (faceSamples.length > 0 || extractedTemplate) ? 'Registered' : 'Pending Registration',
        mobile: empMobile,
        email: empEmail,
        department: empDept,
        designation: empDesignation,
        employee_category: finalCategory,
        employment_type: empType,
        joining_date: new Date().toISOString().split('T')[0],
        assigned_location: empLocation,
        alternate_locations: [],
        shift: empShift,
        status: 'Active',
      };
      db.addEmployee(newEmp);
    }

    stopCamera();
    setIsModalOpen(false);
    refresh();
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to deactivate employee record for ${name}?`)) {
      db.deleteEmployee(id);
      refresh();
    }
  };

  // Filtered List
  const filtered = employees.filter((emp) => {
    const matchSearch =
      emp.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employee_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.mobile.includes(searchTerm) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDept = selectedDept === 'All' || emp.department === selectedDept;
    const matchCat = selectedCategory === 'All' || emp.employee_category === selectedCategory;
    const matchLoc = selectedLocation === 'All' || emp.assigned_location === selectedLocation;
    return matchSearch && matchDept && matchCat && matchLoc;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            Employee Master Directory
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage employee rosters, facial biometric enrollment templates, and location assignments.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Employee</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, ID code, phone, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="All">All Departments</option>
            {departments.map((d) => (
              <option key={d.department_id} value={d.department_name}>
                {d.department_name}
              </option>
            ))}
          </select>

          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="All">All Locations</option>
            {locations.map((loc) => (
              <option key={loc.location_id} value={loc.location_id}>
                {loc.location_name}
              </option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="All">All Categories</option>
            <option value="Permanent">Permanent</option>
            <option value="Contract">Contract</option>
            <option value="Worker">Worker</option>
            <option value="Management">Management</option>
            <option value="Intern">Intern</option>
          </select>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Employee</th>
                <th className="py-3.5 px-4 font-semibold">Code / ID</th>
                <th className="py-3.5 px-4 font-semibold">Department & Role</th>
                <th className="py-3.5 px-4 font-semibold">Assigned Location</th>
                <th className="py-3.5 px-4 font-semibold">Category</th>
                <th className="py-3.5 px-4 font-semibold">Face Template</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((emp) => {
                const locObj = locations.find((l) => l.location_id === emp.assigned_location);
                return (
                  <tr key={emp.employee_id} className="hover:bg-slate-900/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={emp.profile_photo}
                          alt={emp.employee_name}
                          className="w-9 h-9 rounded-full object-cover border border-slate-700 shadow"
                        />
                        <div>
                          <div className="font-semibold text-slate-200 text-sm">{emp.employee_name}</div>
                          <div className="text-[11px] text-slate-400">{emp.mobile}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-300">
                      <div>{emp.employee_code}</div>
                      <span className="text-[10px] text-slate-500">{emp.employee_id}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-200 font-medium">{emp.department}</div>
                      <div className="text-[11px] text-slate-400">{emp.designation}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{locObj?.location_name || emp.assigned_location}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        {emp.employee_category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {emp.face_template ? (
                        <div className="inline-flex items-center gap-1 text-emerald-400 font-medium text-[11px] bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                          <CheckCircle className="w-3 h-3" />
                          <span>Enrolled ({emp.face_samples_count || 3})</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 text-amber-400 text-[11px] bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                          <AlertCircle className="w-3 h-3" />
                          <span>Missing</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {emp.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(emp)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                          title="Edit Employee"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(emp.employee_id, emp.employee_name)}
                          className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/30 transition"
                          title="Delete Employee"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Employee Modal with Biometric Enrollment */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                {editingEmployee ? 'Edit Employee Profile' : 'Onboard New Employee'}
              </h2>
              <button
                onClick={() => {
                  stopCamera();
                  setIsModalOpen(false);
                }}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Biometric Face Capture Module */}
              <div className="bg-slate-950/80 border border-indigo-900/40 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-indigo-400" />
                    <span className="font-semibold text-xs text-white">Face Biometrics Enrollment</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Multiple samples ensure high liveness accuracy</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {cameraActive ? (
                    <div className="relative w-44 h-44 rounded-xl overflow-hidden border-2 border-indigo-500 bg-black">
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                      <div className="absolute inset-0 border border-indigo-400/40 rounded-full m-3 pointer-events-none animate-pulse"></div>
                    </div>
                  ) : (
                    <div className="relative w-28 h-28 rounded-xl overflow-hidden border border-slate-700 bg-slate-800">
                      <img src={empPhoto} alt="Employee Preview" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="flex-1 space-y-2 text-xs">
                    <div className="text-slate-300">
                      {faceSamples.length > 0 ? (
                        <div className="text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          <span>{faceSamples.length} Face samples enrolled</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">No live face template captured yet.</span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {cameraActive ? (
                        <>
                          <button
                            type="button"
                            onClick={captureFaceSample}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow transition"
                          >
                            Capture Frame #{faceSamples.length + 1}
                          </button>
                          <button
                            type="button"
                            onClick={stopCamera}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
                          >
                            Cancel Camera
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={startCamera}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow transition flex items-center gap-1.5"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Start Webcam Capture</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <canvas ref={canvasRef} className="hidden" />
              </div>

              {/* Form Inputs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={empName}
                    onChange={(e) => setEmpName(e.target.value)}
                    placeholder="e.g. Kishor Jogi"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Employee Code *</label>
                  <input
                    type="text"
                    required
                    value={empCode}
                    onChange={(e) => setEmpCode(e.target.value)}
                    placeholder="e.g. APX-0101"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={empMobile}
                    onChange={(e) => setEmpMobile(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Email Address</label>
                  <input
                    type="email"
                    value={empEmail}
                    onChange={(e) => setEmpEmail(e.target.value)}
                    placeholder="employee@company.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Department</label>
                  <select
                    value={empDept}
                    onChange={(e) => setEmpDept(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    {departments.map((d) => (
                      <option key={d.department_id} value={d.department_name}>
                        {d.department_name} ({d.department_code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Designation / Role</label>
                  <input
                    type="text"
                    value={empDesignation}
                    onChange={(e) => setEmpDesignation(e.target.value)}
                    placeholder="e.g. Site Supervisor"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Assigned Location</label>
                  <select
                    value={empLocation}
                    onChange={(e) => setEmpLocation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    {locations.map((loc) => (
                      <option key={loc.location_id} value={loc.location_id}>
                        {loc.location_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Work Shift</label>
                  <select
                    value={empShift}
                    onChange={(e) => setEmpShift(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    {shifts.map((s) => (
                      <option key={s.shift_id} value={s.shift_id}>
                        {s.shift_name} ({s.start_time} - {s.end_time})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Category</label>
                  <select
                    value={empCategory}
                    onChange={(e) => setEmpCategory(e.target.value as EmployeeCategory)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Permanent">Permanent</option>
                    <option value="Contract">Contract</option>
                    <option value="Temporary">Temporary</option>
                    <option value="Consultant">Consultant</option>
                    <option value="Intern">Intern</option>
                    <option value="Worker">Worker</option>
                    <option value="Management">Management</option>
                    <option value="Other">Custom Category...</option>
                  </select>
                </div>

                {empCategory === 'Other' && (
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Custom Category Name</label>
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="e.g. Apprentice"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setIsModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30"
                >
                  {editingEmployee ? 'Update Profile' : 'Save & Enroll Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
