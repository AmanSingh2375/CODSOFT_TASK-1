import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.ts';
import { StudentStats } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { DashboardCard } from '../../components/common/DashboardCard.tsx';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import {
  CalendarCheck,
  Award,
  CreditCard,
  Calendar,
  UserCheck,
  Megaphone,
  ArrowRight,
  Loader2,
  Clock,
  Sparkles,
  BookOpen
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const data = await api.get<StudentStats>('/student/stats');
        setStats(data);
      } catch (err) {
        console.error('Failed to load student dashboard stats', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const attendancePct = stats?.attendance?.percentage ?? 0;
  const feeStatus = stats?.feeRecord?.payment_status ?? 'Pending';
  const remainingFee = stats?.feeRecord?.remaining_amount ?? 0;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white font-bold flex items-center justify-center text-xl shadow-sm">
            {user?.name?.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Welcome, {user?.name}
              </h1>
              <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                {user?.studentCode || 'STU2024001'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Student Academic Hub • Spring Semester 2026
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/student/attendance"
            className="px-3.5 py-2 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-colors"
          >
            My Attendance
          </Link>
          <Link
            to="/student/results"
            className="px-3.5 py-2 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors"
          >
            View Results
          </Link>
        </div>
      </div>

      {/* 4 Key Dashboard Statistic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <DashboardCard
          title="Attendance Rate"
          value={`${attendancePct}%`}
          subtitle={`${stats?.attendance?.presentClasses ?? 0} of ${stats?.attendance?.totalClasses ?? 0} lectures attended`}
          icon={CalendarCheck}
          color={attendancePct >= 75 ? 'emerald' : 'amber'}
        />

        <DashboardCard
          title="Upcoming Exams"
          value={stats?.upcomingExams?.length ?? 0}
          subtitle="Tests scheduled this semester"
          icon={Award}
          color="blue"
        />

        <DashboardCard
          title="Semester Fees"
          value={remainingFee > 0 ? `₹${Number(remainingFee).toLocaleString('en-IN')}` : 'Cleared'}
          subtitle={`Status: ${feeStatus}`}
          icon={CreditCard}
          color={remainingFee > 0 ? 'rose' : 'emerald'}
        />

        <DashboardCard
          title="Today's Classes"
          value={stats?.todayClasses?.length ?? 0}
          subtitle="Lecture sessions on timetable"
          icon={Clock}
          color="indigo"
        />
      </div>

      {/* Quick Action Buttons */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
          Quick Access Portals
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Link
            to="/student/attendance"
            className="p-3 bg-gray-50 hover:bg-emerald-50 hover:border-emerald-200 border border-gray-100 rounded-xl text-center transition-all group"
          >
            <CalendarCheck className="w-5 h-5 text-emerald-600 mx-auto mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-gray-800">Attendance</span>
          </Link>

          <Link
            to="/student/results"
            className="p-3 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 border border-gray-100 rounded-xl text-center transition-all group"
          >
            <Award className="w-5 h-5 text-blue-600 mx-auto mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-gray-800">Exam Results</span>
          </Link>

          <Link
            to="/student/fees"
            className="p-3 bg-gray-50 hover:bg-amber-50 hover:border-amber-200 border border-gray-100 rounded-xl text-center transition-all group"
          >
            <CreditCard className="w-5 h-5 text-amber-600 mx-auto mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-gray-800">Fee Status</span>
          </Link>

          <Link
            to="/student/timetable"
            className="p-3 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-200 border border-gray-100 rounded-xl text-center transition-all group"
          >
            <Calendar className="w-5 h-5 text-indigo-600 mx-auto mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-gray-800">Timetable</span>
          </Link>

          <Link
            to="/student/profile"
            className="p-3 bg-gray-50 hover:bg-purple-50 hover:border-purple-200 border border-gray-100 rounded-xl text-center transition-all group"
          >
            <UserCheck className="w-5 h-5 text-purple-600 mx-auto mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-gray-800">My Profile</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Timetable */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Today's Class Schedule</h2>
              <Link to="/student/timetable" className="text-xs text-blue-600 font-semibold hover:underline">
                View Weekly
              </Link>
            </div>

            {stats?.todayClasses && stats.todayClasses.length > 0 ? (
              <div className="space-y-3">
                {stats.todayClasses.map((cls) => (
                  <div
                    key={cls.id}
                    className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-bold text-blue-600 font-mono">
                        {cls.start_time} - {cls.end_time}
                      </span>
                      <h4 className="text-sm font-bold text-gray-900 mt-0.5">{cls.subject_name}</h4>
                      <p className="text-[11px] text-gray-500">{cls.teacher_name || 'Faculty'} • Room: {cls.room}</p>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-semibold">
                      {cls.subject_code}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic py-6 text-center">
                No scheduled lectures for today. Enjoy your day!
              </p>
            )}
          </div>
        </div>

        {/* Upcoming Exams */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Upcoming Examinations</h2>
              <Link to="/student/results" className="text-xs text-blue-600 font-semibold hover:underline">
                View All
              </Link>
            </div>

            {stats?.upcomingExams && stats.upcomingExams.length > 0 ? (
              <div className="space-y-3">
                {stats.upcomingExams.map((ex) => (
                  <div
                    key={ex.id}
                    className="p-3.5 bg-rose-50/50 rounded-xl border border-rose-100 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-bold text-rose-700 font-mono">
                        {ex.exam_date} ({ex.start_time})
                      </span>
                      <h4 className="text-sm font-bold text-gray-900 mt-0.5">{ex.name}</h4>
                      <p className="text-[11px] text-gray-500">{ex.subject_name} • Room: {ex.room}</p>
                    </div>
                    <span className="text-xs bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold">
                      {ex.max_marks} pts
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic py-6 text-center">
                No upcoming exams scheduled at this time.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Latest Announcements */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Campus News & Notices</h2>
            <p className="text-xs text-gray-500">Official student announcements and academic circulars</p>
          </div>
          <Link to="/student/announcements" className="text-xs text-blue-600 font-semibold hover:underline">
            All Bulletins
          </Link>
        </div>

        <div className="space-y-3">
          {stats?.latestAnnouncements && stats.latestAnnouncements.length > 0 ? (
            stats.latestAnnouncements.map((ann) => (
              <div
                key={ann.id}
                className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={ann.priority} type="priority" />
                    <span className="text-xs text-gray-400 font-mono">• {ann.published_date}</span>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mt-1">{ann.title}</h3>
                  <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{ann.description}</p>
                </div>
                <div className="text-[11px] text-gray-400 shrink-0">
                  By {ann.author_name}
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-400 py-4 text-center">No current announcements.</p>
          )}
        </div>
      </div>
    </div>
  );
};
