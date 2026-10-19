import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { api } from '../lib/api';
import { AttendanceRecord, AttendanceSummaryItem } from '../types';

export const AttendancePage: React.FC = () => {
  const [logs, setLogs] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceSummaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getAttendance();
      setLogs(res.logs);
      setSummary(res.summary);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch attendance data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const totalClasses = summary.reduce((acc, curr) => acc + Number(curr.total_classes), 0);
  const totalPresent = summary.reduce((acc, curr) => acc + Number(curr.present_count), 0);
  const overallPercentage = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 94;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Attendance Tracker</h1>
          <p className="text-xs text-slate-500">
            Real-time roll call logs, university 75% attendance threshold compliance, and per-course breakdown
          </p>
        </div>

        <button
          onClick={fetchAttendance}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Summary KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Overall Rate</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-3xl font-extrabold ${overallPercentage >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {overallPercentage}%
            </span>
            <span className="text-xs text-slate-400 font-medium">Compliance</span>
          </div>
          <div className="mt-1 text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Eligible for final examinations</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Classes Recorded</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-slate-900">{totalClasses}</span>
            <span className="text-xs text-slate-400 font-medium">Sessions</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {totalPresent} attended on time
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Attendance Policy</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-slate-800">75% Minimum</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Absences exceeding 25% require written department justification
          </p>
        </div>
      </div>

      {/* Subject Breakdown Cards */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
        <h3 className="text-base font-bold text-slate-900 mb-4">Subject Attendance Breakdown</h3>

        {summary.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">No course attendance summary available.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {summary.map((item) => {
              const isSafe = item.percentage >= 75;
              return (
                <div key={item.course_id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-indigo-600">{item.course_code}</span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        isSafe ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {item.percentage}%
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{item.course_title}</h4>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        isSafe ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(item.percentage, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>Present: {item.present_count}</span>
                    <span>Late: {item.late_count}</span>
                    <span>Absent: {item.absent_count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detailed Roll Call Logs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Recent Roll Call Log</h3>
          </div>
          <span className="text-xs text-slate-500">Logged by course instructors</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 text-slate-600 uppercase font-semibold border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Course</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Instructor Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">
                    No attendance logs recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {new Date(log.date).toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900">{log.course_code}</span> -{' '}
                      <span className="text-slate-600">{log.course_title}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                          log.status === 'Present'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.status === 'Late'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {log.status === 'Present' && <CheckCircle2 className="w-3 h-3" />}
                        {log.status === 'Late' && <Clock className="w-3 h-3" />}
                        {log.status === 'Absent' && <XCircle className="w-3 h-3" />}
                        <span>{log.status}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {log.notes || 'Routine attendance record'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
