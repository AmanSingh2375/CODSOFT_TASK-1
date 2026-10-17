import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.ts';
import { TimetableEntry, Student } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Loader2
} from 'lucide-react';

export const StudentTimetable: React.FC = () => {
  const { user } = useAuth();
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    async function loadTimetable() {
      try {
        setLoading(true);
        // Get student details for course & semester
        let courseId: number | undefined;
        let semester: number | undefined;

        if (user?.studentId) {
          const st = await api.get<Student>(`/students/${user.studentId}`);
          courseId = st.course_id;
          semester = st.semester;
        }

        const params = new URLSearchParams();
        if (courseId) params.append('courseId', String(courseId));
        if (semester) params.append('semester', String(semester));

        const res = await api.get<TimetableEntry[]>(`/timetable?${params.toString()}`);
        setTimetable(res);
      } catch (err) {
        console.error('Failed to load student timetable', err);
      } finally {
        setLoading(false);
      }
    }
    loadTimetable();
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
          <Calendar className="w-7 h-7 text-indigo-600" />
          <span>Class Weekly Timetable</span>
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Weekly schedule of lectures, laboratory practicals, and faculty instructors
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
          Loading class schedule...
        </div>
      ) : (
        <div className="space-y-4">
          {daysOfWeek.map((day) => {
            const dayEntries = timetable.filter(t => t.day_of_week === day);
            return (
              <div key={day} className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">{day}</h3>
                  </div>
                  <span className="text-xs text-gray-400 font-medium">
                    {dayEntries.length} {dayEntries.length === 1 ? 'Class' : 'Classes'} Scheduled
                  </span>
                </div>

                {dayEntries.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-2">No scheduled lectures for {day}.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {dayEntries.map((slot) => (
                      <div
                        key={slot.id}
                        className="p-4 bg-indigo-50/40 rounded-xl border border-indigo-100 hover:border-indigo-200 transition-colors"
                      >
                        <div className="flex items-center justify-between text-xs text-indigo-700 font-bold mb-1.5">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-indigo-600" />
                            {slot.start_time} – {slot.end_time}
                          </span>
                          <span className="bg-indigo-100 text-indigo-800 text-[10px] px-2 py-0.5 rounded font-mono">
                            {slot.room}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-gray-900 mt-1">{slot.subject_name}</h4>
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                          <User className="w-3 h-3 text-gray-400" />
                          <span>{slot.teacher_name || 'Faculty Member'}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
