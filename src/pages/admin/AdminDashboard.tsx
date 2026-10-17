import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.ts';
import { AdminStats } from '../../types/index.ts';
import { DashboardCard } from '../../components/common/DashboardCard.tsx';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import {
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  CreditCard,
  FileSpreadsheet,
  PlusCircle,
  Megaphone,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Loader2
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await api.get<AdminStats>('/admin/stats');
        setStats(data);
      } catch (err) {
        console.error('Failed to load admin stats', err);
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
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Administrator Dashboard
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Institutional overview • Spring Academic Semester 2026
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/admin/students"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Student</span>
          </Link>
          <Link
            to="/admin/announcements"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-200 transition-colors"
          >
            <Megaphone className="w-4 h-4" />
            <span>Post Notice</span>
          </Link>
        </div>
      </div>

      {/* 6 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <DashboardCard
          title="Total Students"
          value={stats?.totalStudents ?? 0}
          subtitle="Enrolled active learners"
          icon={Users}
          color="blue"
        />
        <DashboardCard
          title="Total Teachers"
          value={stats?.totalTeachers ?? 0}
          subtitle="Teaching faculty members"
          icon={GraduationCap}
          color="purple"
        />
        <DashboardCard
          title="Courses & Subjects"
          value={`${stats?.totalCourses ?? 0} Courses / ${stats?.totalSubjects ?? 0} Subjects`}
          subtitle="Active academic catalog"
          icon={BookOpen}
          color="indigo"
        />
        <DashboardCard
          title="Attendance Records"
          value={stats?.totalAttendance ?? 0}
          subtitle="Total lecture logs registered"
          icon={CalendarCheck}
          color="emerald"
        />
        <DashboardCard
          title="Pending Fees"
          value={`₹${(stats?.pendingFeesAmount ?? 0).toLocaleString('en-IN')}`}
          subtitle={`${stats?.pendingFeesCount ?? 0} students with due balances`}
          icon={CreditCard}
          color="amber"
        />
        <DashboardCard
          title="Upcoming Exams"
          value={stats?.upcomingExamsCount ?? 0}
          subtitle="Scheduled mid-term & finals"
          icon={FileSpreadsheet}
          color="rose"
        />
      </div>

      {/* Quick Action Matrix */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
          Quick Management Portals
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            to="/admin/students"
            className="p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-blue-50/50 hover:border-blue-200 transition-all text-left group"
          >
            <Users className="w-5 h-5 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-sm font-semibold text-gray-900">Manage Students</div>
            <div className="text-xs text-gray-500 mt-0.5">Admissions & records</div>
          </Link>

          <Link
            to="/admin/teachers"
            className="p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-purple-50/50 hover:border-purple-200 transition-all text-left group"
          >
            <GraduationCap className="w-5 h-5 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-sm font-semibold text-gray-900">Manage Faculty</div>
            <div className="text-xs text-gray-500 mt-0.5">Assignments & depts</div>
          </Link>

          <Link
            to="/admin/exams"
            className="p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-rose-50/50 hover:border-rose-200 transition-all text-left group"
          >
            <FileSpreadsheet className="w-5 h-5 text-rose-600 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-sm font-semibold text-gray-900">Examinations</div>
            <div className="text-xs text-gray-500 mt-0.5">Schedules & halls</div>
          </Link>

          <Link
            to="/admin/fees"
            className="p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-amber-50/50 hover:border-amber-200 transition-all text-left group"
          >
            <CreditCard className="w-5 h-5 text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-sm font-semibold text-gray-900">Fee Accounts</div>
            <div className="text-xs text-gray-500 mt-0.5">Receipts & dues</div>
          </Link>
        </div>
      </div>

      {/* Recent Announcements Board */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Campus Announcements</h2>
            <p className="text-xs text-gray-500">Live published campus bulletins</p>
          </div>
          <Link
            to="/admin/announcements"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            Manage All
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-3">
          {stats?.recentAnnouncements && stats.recentAnnouncements.length > 0 ? (
            stats.recentAnnouncements.map((ann) => (
              <div
                key={ann.id}
                className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-gray-100/60 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={ann.priority} type="priority" />
                    <span className="text-xs font-semibold text-gray-400">
                      Target: {ann.target_audience}
                    </span>
                    <span className="text-xs text-gray-400">• {ann.published_date}</span>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mt-1.5">{ann.title}</h3>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{ann.description}</p>
                </div>
                <div className="text-right text-[11px] text-gray-400 shrink-0">
                  By {ann.author_name} ({ann.author_role})
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-400 py-4 text-center">No announcements published yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};
