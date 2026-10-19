import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  TrendingUp,
  AlertCircle,
  Megaphone,
  ArrowRight,
  Clock,
  CheckCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { api } from '../lib/api';
import { DashboardData } from '../types';
import { useAuth } from '../context/AuthContext';

interface DashboardPageProps {
  onNavigate: (page: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDashboardData();
      setData(res);
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError(err?.message || 'Failed to load dashboard data from PGlite backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading && !data) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-8 w-28 bg-slate-200 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-slate-200 rounded-2xl animate-pulse" />
          <div className="h-72 bg-slate-200 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center mt-12">
        <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">Dashboard Sync Error</h3>
        <p className="text-xs text-slate-600 mb-6 bg-rose-50 p-3 rounded-xl border border-rose-200">
          {error}
        </p>
        <button
          onClick={fetchDashboard}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Loading</span>
        </button>
      </div>
    );
  }

  const stats = data?.stats;
  const enrolledCourses = data?.enrolledCourses || [];
  const upcomingAssignments = data?.upcomingAssignments || [];
  const announcements = data?.recentAnnouncements || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Academic Portal Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.full_name}!
          </h1>
          <p className="text-indigo-100 text-xs sm:text-sm max-w-xl">
            {user?.department} • {user?.semester} • Student ID: <span className="font-mono font-semibold">{user?.student_id}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate('courses')}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white text-indigo-700 hover:bg-indigo-50 transition-colors shadow-sm cursor-pointer flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            <span>Manage Courses</span>
          </button>
          <button
            onClick={() => onNavigate('assignments')}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-800/60 hover:bg-indigo-800/80 text-white transition-colors border border-white/20 cursor-pointer flex items-center gap-2"
          >
            <ClipboardList className="w-4 h-4" />
            <span>Assignments</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cumulative GPA */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Cumulative GPA
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {stats?.gpa || '3.80'}
              </span>
              <span className="text-xs text-slate-400 font-medium">/ 4.0</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-emerald-600">
              <TrendingUp className="w-3 h-3" />
              <span>Dean's Honor Roll</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>

        {/* Enrolled Courses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Enrolled Courses
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {stats?.enrolledCount ?? enrolledCourses.length}
              </span>
              <span className="text-xs text-slate-400 font-medium">Active</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {stats?.totalCredits || 15} Total Credits
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        {/* Attendance Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Attendance Rate
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {stats?.attendanceRate || 92}%
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-emerald-600">
              <CheckCircle className="w-3 h-3" />
              <span>Above 75% Requirement</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <CalendarCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Assignments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Pending Tasks
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {stats?.assignmentsPending ?? 2}
              </span>
              <span className="text-xs text-slate-400 font-medium">To Submit</span>
            </div>
            <div className="text-[11px] text-amber-600 font-semibold mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Next due in 3 days</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <ClipboardList className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Enrolled Courses & Side Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Enrolled Courses */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Current Course Enrollments</h2>
                <p className="text-xs text-slate-500">Courses currently registered for this semester</p>
              </div>
              <button
                onClick={() => onNavigate('courses')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Browse All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {enrolledCourses.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl">
                <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-600 font-medium">No courses enrolled yet.</p>
                <button
                  onClick={() => onNavigate('courses')}
                  className="mt-3 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 cursor-pointer"
                >
                  Enroll in Courses
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {enrolledCourses.map((c) => (
                  <div key={c.enrollment_id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                        {c.code.slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-indigo-600 font-mono">{c.code}</span>
                          <span className="text-xs font-semibold text-slate-900">{c.title}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {c.instructor} • {c.schedule} • Room: {c.room}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        Grade: {c.grade || 'A'}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
                        {c.credits} Credits
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Assignments Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Upcoming Assignments & Tests</h2>
                <p className="text-xs text-slate-500">Deliverables and deadlines across your courses</p>
              </div>
              <button
                onClick={() => onNavigate('assignments')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {upcomingAssignments.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">
                No pending assignments at the moment.
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingAssignments.slice(0, 3).map((a) => (
                  <div
                    key={a.id}
                    className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-mono">
                          {a.course_code}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800">{a.title}</h4>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{a.description}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          a.submission_status === 'Graded'
                            ? 'bg-emerald-100 text-emerald-800'
                            : a.submission_status === 'Submitted'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {a.submission_status}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-1 font-mono">
                        Due: {new Date(a.due_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Campus Announcements & Quick Actions */}
        <div className="space-y-6">
          {/* Announcements Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Campus Notices</h3>
              </div>
              <button
                onClick={() => onNavigate('announcements')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                More
              </button>
            </div>

            <div className="space-y-3.5">
              {announcements.slice(0, 3).map((item) => (
                <div key={item.id} className="pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        item.priority === 'Urgent'
                          ? 'bg-rose-100 text-rose-700'
                          : item.priority === 'High'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.priority}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 hover:text-indigo-600 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{item.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Support Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md">
            <h4 className="text-sm font-bold mb-1">Need Academic Assistance?</h4>
            <p className="text-xs text-slate-300 mb-4">
              Connect with department academic advisors, registrar office, or explore system diagnostics.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => onNavigate('attendance')}
                className="w-full text-left px-3 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer flex items-center justify-between"
              >
                <span>Check Detailed Attendance</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => onNavigate('diagnostics')}
                className="w-full text-left px-3 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer flex items-center justify-between"
              >
                <span>Inspect PGlite Database</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
