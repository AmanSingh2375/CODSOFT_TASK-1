import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.ts';
import { Student } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import {
  UserCheck,
  Mail,
  Phone,
  Calendar,
  Building2,
  BookOpen,
  MapPin,
  Shield,
  Loader2,
  CheckCircle2
} from 'lucide-react';

export const StudentProfile: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        if (user?.studentId) {
          const data = await api.get<Student>(`/students/${user.studentId}`);
          setProfile(data);
        } else {
          // Fallback to me endpoint
          const me = await api.get<any>('/auth/me');
          if (me.user?.details) {
            setProfile(me.user.details);
          }
        }
      } catch (err) {
        console.error('Failed to load profile', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const student = profile || user?.details;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
          <UserCheck className="w-7 h-7 text-emerald-600" />
          <span>Student Academic Profile</span>
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Official enrollment credentials and university student record
        </p>
      </div>

      {/* Main Profile Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        {/* Cover / Header */}
        <div className="h-28 bg-linear-to-r from-emerald-600 to-teal-700 relative" />

        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-12 mb-6 gap-4">
            <div className="flex items-end gap-4">
              <img
                src={student?.profile_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student?.name || 'student'}`}
                alt={student?.name}
                className="w-24 h-24 rounded-2xl bg-white p-1 border-2 border-white shadow-md"
              />
              <div className="mb-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900">{student?.name}</h2>
                  <StatusBadge status={student?.status || 'Active'} />
                </div>
                <p className="text-xs font-mono font-bold text-emerald-700">
                  {student?.student_id}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-200">
                Semester {student?.semester || 1} • {student?.course_name || 'Enrolled Course'}
              </span>
            </div>
          </div>

          {/* Academic Info Grid */}
          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
              Academic Enrollment Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                <Building2 className="w-5 h-5 text-gray-400" />
                <div>
                  <span className="text-[11px] text-gray-400 block">Department</span>
                  <span className="text-xs font-semibold text-gray-800">{student?.department_name || 'Computer Science & Engineering'}</span>
                </div>
              </div>

              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-gray-400" />
                <div>
                  <span className="text-[11px] text-gray-400 block">Degree Program</span>
                  <span className="text-xs font-semibold text-gray-800">{student?.course_name || 'B.Tech in Computer Science'}</span>
                </div>
              </div>

              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <span className="text-[11px] text-gray-400 block">Date of Admission</span>
                  <span className="text-xs font-semibold text-gray-800">{student?.admission_date || '2022-08-10'}</span>
                </div>
              </div>

              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                <Shield className="w-5 h-5 text-gray-400" />
                <div>
                  <span className="text-[11px] text-gray-400 block">Academic Standing</span>
                  <span className="text-xs font-semibold text-emerald-700">Good Standing (Regular)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Personal & Contact Grid */}
          <div className="border-t border-gray-100 pt-6 mt-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
              Personal & Guardian Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <span className="text-[11px] text-gray-400 block">Email Address</span>
                  <span className="text-xs font-semibold text-gray-800">{student?.email}</span>
                </div>
              </div>

              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <span className="text-[11px] text-gray-400 block">Contact Phone</span>
                  <span className="text-xs font-semibold text-gray-800">{student?.phone || 'Not Specified'}</span>
                </div>
              </div>

              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <span className="text-[11px] text-gray-400 block">Date of Birth & Gender</span>
                  <span className="text-xs font-semibold text-gray-800">{student?.dob} ({student?.gender})</span>
                </div>
              </div>

              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                <UserCheck className="w-5 h-5 text-gray-400" />
                <div>
                  <span className="text-[11px] text-gray-400 block">Parent / Guardian</span>
                  <span className="text-xs font-semibold text-gray-800">
                    {student?.guardian_name || 'N/A'} ({student?.guardian_phone || 'N/A'})
                  </span>
                </div>
              </div>

              <div className="sm:col-span-2 p-3.5 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <span className="text-[11px] text-gray-400 block">Residential Campus Address</span>
                  <span className="text-xs font-semibold text-gray-800">{student?.address || 'Campus Hostels, University Campus'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
