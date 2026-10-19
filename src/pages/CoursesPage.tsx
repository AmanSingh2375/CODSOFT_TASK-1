import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  Check,
  Plus,
  Trash2,
  Clock,
  MapPin,
  Users,
  GraduationCap,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { api } from '../lib/api';
import { Course } from '../types';

export const CoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(
    null
  );

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await api.getCourses();
      setCourses(list);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch courses from PGlite backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleEnroll = async (courseId: number) => {
    try {
      setActionLoadingId(courseId);
      setFeedback(null);
      const res = await api.enrollCourse(courseId);
      setFeedback({ message: res.message, type: 'success' });
      await fetchCourses();
    } catch (err: any) {
      setFeedback({ message: err?.message || 'Failed to enroll.', type: 'error' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDrop = async (courseId: number) => {
    if (!confirm('Are you sure you want to drop this course?')) return;
    try {
      setActionLoadingId(courseId);
      setFeedback(null);
      const res = await api.dropCourse(courseId);
      setFeedback({ message: res.message, type: 'success' });
      await fetchCourses();
    } catch (err: any) {
      setFeedback({ message: err?.message || 'Failed to drop course.', type: 'error' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const departments = ['All', ...Array.from(new Set(courses.map((c) => c.department)))];

  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.instructor.toLowerCase().includes(search.toLowerCase());
    const matchesDept = selectedDept === 'All' || c.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Course Catalog & Registration</h1>
          <p className="text-xs text-slate-500">
            Browse available courses, enroll in electives, or manage your active academic schedule
          </p>
        </div>

        <button
          onClick={fetchCourses}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-medium flex items-center justify-between gap-2 animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs underline hover:opacity-80 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code (e.g. CS201), course title, or instructor..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white text-slate-900"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white text-slate-900 shrink-0"
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCourses.map((course) => {
            const isEnrolled = !!course.is_enrolled;
            const isActing = actionLoadingId === course.id;

            return (
              <div
                key={course.id}
                className={`bg-white rounded-2xl border transition-all duration-200 shadow-xs flex flex-col justify-between overflow-hidden ${
                  isEnrolled ? 'border-indigo-200 ring-1 ring-indigo-500/20' : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-mono">
                      {course.code}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {course.credits} Credits
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">{course.title}</h3>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-3">{course.description}</p>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{course.instructor}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{course.schedule}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Room: {course.room}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Class Capacity: {course.capacity} seats</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                  {isEnrolled ? (
                    <>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Enrolled ({course.student_grade || 'A'})</span>
                      </div>
                      <button
                        onClick={() => handleDrop(course.id)}
                        disabled={isActing}
                        className="px-2.5 py-1.5 text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                        title="Drop this course"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Drop</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-[11px] text-slate-500 font-medium">Available</span>
                      <button
                        onClick={() => handleEnroll(course.id)}
                        disabled={isActing}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1 shadow-xs disabled:opacity-50"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isActing ? 'Enrolling...' : 'Enroll'}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
