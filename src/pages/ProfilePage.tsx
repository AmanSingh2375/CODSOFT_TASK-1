import React, { useState } from 'react';
import {
  UserCircle,
  Mail,
  Phone,
  Building2,
  Calendar,
  IdCard,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '+1 (555) 234-5678');
  const [department, setDepartment] = useState(user?.department || 'Computer Science & Engineering');
  const [semester, setSemester] = useState(user?.semester || 'Semester 4');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setStatusMsg(null);
      await updateProfile({
        full_name: fullName.trim(),
        phone: phone.trim(),
        department,
        semester,
        avatar_url: avatarUrl.trim(),
      });
      setStatusMsg({ message: 'Profile updated successfully!', type: 'success' });
    } catch (err: any) {
      setStatusMsg({ message: err?.message || 'Failed to update profile.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Student Profile & Settings</h1>
        <p className="text-xs text-slate-500">Manage your student record, contact details, and view your digital university badge</p>
      </div>

      {statusMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs font-medium flex items-center justify-between gap-2 animate-in fade-in ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span className="flex items-center gap-2">
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            {statusMsg.message}
          </span>
          <button onClick={() => setStatusMsg(null)} className="underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Digital Student ID Card */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-indigo-700/50 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-indigo-500/20 rounded-full blur-2xl" />

            <div className="flex items-center justify-between border-b border-indigo-700/60 pb-4 mb-4">
              <div>
                <div className="text-[10px] uppercase font-bold tracking-widest text-indigo-300">
                  EduManage University
                </div>
                <div className="text-xs font-bold text-white">Student Identification Card</div>
              </div>
              <div className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30">
                Active
              </div>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <img
                src={
                  avatarUrl ||
                  user?.avatar_url ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                    user?.full_name || 'Alex Turner'
                  )}`
                }
                alt="Student avatar"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-400/50 shadow-inner"
              />
              <div className="overflow-hidden">
                <h3 className="text-base font-extrabold truncate">{fullName || user?.full_name}</h3>
                <p className="text-xs text-indigo-200 font-mono tracking-wider">{user?.student_id}</p>
                <p className="text-[11px] text-slate-300 truncate mt-0.5">{department}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] pt-3 border-t border-indigo-700/60">
              <div>
                <span className="text-indigo-300">Term:</span>
                <p className="font-semibold">{semester}</p>
              </div>
              <div>
                <span className="text-indigo-300">Role:</span>
                <p className="font-semibold capitalize">{user?.role}</p>
              </div>
              <div className="col-span-2 mt-1">
                <span className="text-indigo-300">Email:</span>
                <p className="font-mono text-slate-200 truncate">{user?.email}</p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-indigo-700/40 flex items-center justify-between text-[9px] text-slate-400">
              <span>Card ID: 2026-STU-VERIFIED</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <ShieldCheck className="w-3 h-3" /> Secure NFC Chip
              </span>
            </div>
          </div>

          {/* Security & Authentication Info */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Security & Auth Status
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Password Hashing:</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono text-[11px]">
                  bcrypt (10 rounds)
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Session Protocol:</span>
                <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-mono text-[11px]">
                  JWT Bearer Token
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Database Engine:</span>
                <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded font-mono text-[11px]">
                  PGlite PostgreSQL
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Edit Details Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
            <h3 className="text-base font-bold text-slate-900 mb-1">Personal & Academic Details</h3>
            <p className="text-xs text-slate-500 mb-5">
              Update your contact info and personal details saved in the database
            </p>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                  <div className="relative">
                    <UserCircle className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Student ID <span className="text-slate-400 font-normal">(read-only)</span>
                  </label>
                  <div className="relative">
                    <IdCard className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={user?.student_id || ''}
                      disabled
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-100 text-slate-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address <span className="text-slate-400 font-normal">(login credential)</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-100 text-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Electrical Engineering">Electrical Engineering</option>
                      <option value="Mathematics & Data Science">Mathematics & Data Science</option>
                      <option value="Business & Management">Business & Management</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Current Semester</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <select
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value="Semester 1">Semester 1</option>
                      <option value="Semester 2">Semester 2</option>
                      <option value="Semester 3">Semester 3</option>
                      <option value="Semester 4">Semester 4</option>
                      <option value="Semester 5">Semester 5</option>
                      <option value="Semester 6">Semester 6</option>
                      <option value="Semester 7">Semester 7</option>
                      <option value="Semester 8">Semester 8</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Avatar Image URL</label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors cursor-pointer flex items-center gap-2 shadow-xs disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
