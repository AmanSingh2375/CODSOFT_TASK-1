import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { SubjectAttendanceSummary } from '../../types/index.ts';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  TrendingUp,
  AlertTriangle,
  Loader2,
  BookOpen
} from 'lucide-react';

interface AttendanceSummaryResponse {
  overall: {
    totalClasses: number;
    presentClasses: number;
    absentClasses: number;
    percentage: number;
  };
  subjects: SubjectAttendanceSummary[];
}

export const StudentAttendance: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<AttendanceSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAttendance() {
      try {
        setLoading(true);
        const studentId = user?.studentId;
        if (studentId) {
          const res = await api.get<AttendanceSummaryResponse>(`/attendance/summary/${studentId}`);
          setData(res);
        }
      } catch (err) {
        console.error('Failed to load student attendance', err);
      } finally {
        setLoading(false);
      }
    }
    loadAttendance();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const overall = data?.overall || {
    totalClasses: 0,
    presentClasses: 0,
    absentClasses: 0,
    percentage: 0
  };

  const isEligible = overall.percentage >= 75;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <CalendarCheck className="w-7 h-7 text-emerald-600" />
            <span>My Attendance Transcript</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Subject-wise lecture attendance, roll logs, and exam eligibility criteria
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isEligible ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Eligible for Semester Examinations (≥75%)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-100 text-rose-800 rounded-xl text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Warning: Low Attendance (&lt;75%)
            </span>
          )}
        </div>
      </div>

      {/* 4 Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-xs">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Classes</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{overall.totalClasses}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Lectures conducted</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-emerald-100 bg-emerald-50/20 rounded-2xl shadow-xs">
          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Present Classes</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{overall.presentClasses}</p>
          <p className="text-[11px] text-emerald-600/80 mt-0.5">Attended sessions</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-rose-100 bg-rose-50/20 rounded-2xl shadow-xs">
          <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Absent Classes</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">{overall.absentClasses}</p>
          <p className="text-[11px] text-rose-600/80 mt-0.5">Missed lectures</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-blue-100 bg-blue-50/20 rounded-2xl shadow-xs">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Overall Percentage</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{overall.percentage}%</p>
          <p className="text-[11px] text-blue-600/80 mt-0.5">Aggregate record</p>
        </div>
      </div>

      {/* Subject-Wise Attendance Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            Subject-Wise Attendance Breakdown
          </span>
          <span className="text-xs text-gray-400">
            Minimum required for end-semester exams: 75%
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-3.5">Subject Code</th>
                <th className="px-6 py-3.5">Subject Name</th>
                <th className="px-6 py-3.5 text-center">Present Classes</th>
                <th className="px-6 py-3.5 text-center">Total Classes</th>
                <th className="px-6 py-3.5 text-center">Attendance %</th>
                <th className="px-6 py-3.5 text-right">Eligibility Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.subjects && data.subjects.length > 0 ? (
                data.subjects.map((sub) => {
                  const meetsThreshold = sub.percentage >= 75;
                  return (
                    <tr key={sub.subjectId} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-blue-600">
                        {sub.subjectCode}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {sub.subjectName}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-emerald-600">
                        {sub.presentClasses}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-gray-900">
                        {sub.totalClasses}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2 overflow-hidden hidden sm:block">
                            <div
                              className={`h-full rounded-full ${meetsThreshold ? 'bg-emerald-500' : 'bg-rose-500'}`}
                              style={{ width: `${sub.percentage}%` }}
                            />
                          </div>
                          <span className={`font-bold ${meetsThreshold ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {sub.percentage}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            meetsThreshold
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {meetsThreshold ? 'Eligible' : 'Short Attendance'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    No attendance records logged for your current semester.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
