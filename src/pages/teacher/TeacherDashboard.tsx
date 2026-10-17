import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.ts';
import { TeacherStats } from '../../types/index.ts';
import { DashboardCard } from '../../components/common/DashboardCard.tsx';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import {
  Users,
  CalendarCheck,
  FileSpreadsheet,
  Clock,
  Megaphone,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Calendar,
  Award
} from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await api.get<TeacherStats>('/teacher/stats');
        setStats(data);
      } catch (err) {
        console.error('Failed to load teacher stats', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Faculty Teaching Portal
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Academic schedule, lecture attendance, and student evaluations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/teacher/attendance"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 shadow-xs transition-colors"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Mark Daily Attendance</span>
          </Link>
          <Link
            to="/teacher/marks"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold hover:bg-indigo-100 transition-colors"
          >
            <Award className="w-4 h-4" />
            <span>Enter Exam Marks</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <DashboardCard
          title="Assigned Students"
          value={stats?.assignedStudentsCount ?? 0}
          subtitle="Enrolled across your classes"
          icon={Users}
          color="blue"
        />
        <DashboardCard
          title="Today's Lectures"
          value={stats?.todayClassesCount ?? 0}
          subtitle="Scheduled teaching sessions"
          icon={Clock}
          color="purple"
        />
        <DashboardCard
          title="Pending Attendance"
          value={stats?.pendingAttendanceCount ?? 0}
          subtitle="Classes awaiting roll-call"
          icon={CalendarCheck}
          color={stats?.pendingAttendanceCount ? 'rose' : 'emerald'}
        />
        <DashboardCard
          title="Upcoming Exams"
          value={stats?.upcomingExams.length ?? 0}
          subtitle="Course evaluation tests"
          icon={FileSpreadsheet}
          color="indigo"
        />
      </div>

      {/* Today's Schedule Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Today's Class Schedule</h2>
            <p className="text-xs text-gray-500">Your scheduled lectures for today</p>
          </div>
          <Link
            to="/teacher/timetable"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            Full Week Timetable
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {stats?.todayClasses && stats.todayClasses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.todayClasses.map((cls) => (
              <div
                key={cls.id}
                className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-blue-600 font-bold mb-1">
                    <span>{cls.start_time} - {cls.end_time}</span>
                    <span className="text-gray-500 font-normal">Room: {cls.room}</span>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mt-1">{cls.subject_name}</h3>
                  <p className="text-xs text-gray-500 font-mono">{cls.subject_code} • Semester {cls.semester}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-200/60 flex items-center justify-between">
                  <Link
                    to="/teacher/attendance"
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    Take Attendance
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400 text-xs">
            No scheduled lectures for today. Check your weekly timetable for other days.
          </div>
        )}
      </div>

      {/* Announcements Board */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Faculty Notices & Circulars</h2>
            <p className="text-xs text-gray-500">Official campus updates for faculty and department staff</p>
          </div>
          <Link
            to="/teacher/announcements"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            All Notices
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-3">
          {stats?.recentAnnouncements && stats.recentAnnouncements.length > 0 ? (
            stats.recentAnnouncements.map((ann) => (
              <div
                key={ann.id}
                className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={ann.priority} type="priority" />
                    <span className="text-xs text-gray-400 font-mono">• {ann.published_date}</span>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mt-1">{ann.title}</h3>
                  <p className="text-xs text-gray-600 mt-1">{ann.description}</p>
                </div>
                <div className="text-[11px] text-gray-400 shrink-0">
                  By {ann.author_name}
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-400 py-4 text-center">No announcements available.</p>
          )}
        </div>
      </div>
    </div>
  );
};
