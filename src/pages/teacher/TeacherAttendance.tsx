import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.ts';
import { Course, Subject, Student, AttendanceRecord } from '../../types/index.ts';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import {
  CalendarCheck,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Save,
  Check,
  RotateCcw
} from 'lucide-react';

export const TeacherAttendance: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Form selections
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('4');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Attendance states for each student: studentId -> 'Present' | 'Absent' | 'Late'
  const [attendanceMap, setAttendanceMap] = useState<Record<number, 'Present' | 'Absent' | 'Late'>>({});
  const [remarksMap, setRemarksMap] = useState<Record<number, string>>({});

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    async function loadMeta() {
      try {
        setLoading(true);
        const [cRes, sRes] = await Promise.all([
          api.get<Course[]>('/courses'),
          api.get<Subject[]>('/subjects')
        ]);
        setCourses(cRes);
        setSubjects(sRes);

        const initialCourse = cRes[0]?.id ? String(cRes[0].id) : '';
        setSelectedCourse(initialCourse);

        const initialSub = sRes.find(s => s.course_id === Number(initialCourse));
        if (initialSub) {
          setSelectedSubject(String(initialSub.id));
        }
      } catch (err) {
        console.error('Failed to load attendance meta', err);
      } finally {
        setLoading(false);
      }
    }
    loadMeta();
  }, []);

  // When course, semester, subject, or date changes, load students & any existing attendance records
  useEffect(() => {
    async function loadClassRoster() {
      if (!selectedCourse) return;
      try {
        setLoading(true);
        // Load students of this course & semester
        const stRes = await api.get<Student[]>(`/students?courseId=${selectedCourse}&semester=${selectedSemester}`);
        setStudents(stRes);

        // Check if attendance already marked for this subject & date
        let existingMap: Record<number, 'Present' | 'Absent' | 'Late'> = {};
        let existingRemarks: Record<number, string> = {};

        if (selectedSubject && selectedDate) {
          const existing = await api.get<AttendanceRecord[]>(`/attendance?subjectId=${selectedSubject}&date=${selectedDate}`);
          existing.forEach(r => {
            existingMap[r.student_id] = r.status;
            if (r.remarks) existingRemarks[r.student_id] = r.remarks;
          });
        }

        // Initialize default 'Present' for students with no prior record
        const initialStatus: Record<number, 'Present' | 'Absent' | 'Late'> = {};
        stRes.forEach(s => {
          initialStatus[s.id] = existingMap[s.id] || 'Present';
        });
        setAttendanceMap(initialStatus);
        setRemarksMap(existingRemarks);
      } catch (err) {
        console.error('Failed to load roster', err);
      } finally {
        setLoading(false);
      }
    }
    loadClassRoster();
  }, [selectedCourse, selectedSemester, selectedSubject, selectedDate]);

  const handleMarkAll = (status: 'Present' | 'Absent') => {
    const updated: Record<number, 'Present' | 'Absent' | 'Late'> = {};
    students.forEach(s => {
      updated[s.id] = status;
    });
    setAttendanceMap(updated);
  };

  const setStudentStatus = (studentId: number, status: 'Present' | 'Absent' | 'Late') => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSaveAttendance = async () => {
    if (!selectedSubject || !selectedDate) {
      alert('Please select both a subject and date.');
      return;
    }

    try {
      setSaving(true);
      setSaveSuccess(false);

      const payload = students.map(s => ({
        studentId: s.id,
        subjectId: Number(selectedSubject),
        date: selectedDate,
        status: attendanceMap[s.id] || 'Present',
        remarks: remarksMap[s.id] || ''
      }));

      await api.post('/attendance', payload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      alert('Failed to save attendance: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredSubjects = subjects.filter(s => !selectedCourse || s.course_id === Number(selectedCourse));

  const presentCount = Object.values(attendanceMap).filter(s => s === 'Present').length;
  const absentCount = Object.values(attendanceMap).filter(s => s === 'Absent').length;
  const lateCount = Object.values(attendanceMap).filter(s => s === 'Late').length;
  const attendanceRate = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <CalendarCheck className="w-7 h-7 text-emerald-600" />
            <span>Class Lecture Attendance</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Conduct daily roll call, mark present/absent, and sync with institutional database
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleMarkAll('Present')}
            className="px-3.5 py-2 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-colors cursor-pointer"
          >
            Mark All Present
          </button>
          <button
            onClick={() => handleMarkAll('Absent')}
            className="px-3.5 py-2 text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl border border-rose-200 transition-colors cursor-pointer"
          >
            Mark All Absent
          </button>
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Select Program / Course</label>
          <select
            value={selectedCourse}
            onChange={(e) => {
              setSelectedCourse(e.target.value);
              const matchingSubs = subjects.filter(s => s.course_id === Number(e.target.value));
              if (matchingSubs.length > 0) setSelectedSubject(String(matchingSubs[0].id));
            }}
            className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Semester</label>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
              <option key={s} value={s}>Semester {s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Select Subject</label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {filteredSubjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Lecture Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Summary Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-xs">
          <p className="text-xs text-gray-500">Enrolled Students</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{students.length}</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-xs">
          <p className="text-xs text-emerald-600 font-semibold">Marked Present</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{presentCount}</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-xs">
          <p className="text-xs text-rose-600 font-semibold">Marked Absent</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">{absentCount}</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-xs">
          <p className="text-xs text-blue-600 font-semibold">Attendance Ratio</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{attendanceRate}%</p>
        </div>
      </div>

      {/* Student Roster Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            Student Roll-Call Roster
          </span>
          <span className="text-xs text-gray-400">
            Click Present / Absent / Late for each student
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-3.5">Roll No</th>
                <th className="px-6 py-3.5">Student Name</th>
                <th className="px-6 py-3.5">Attendance Status</th>
                <th className="px-6 py-3.5">Remarks / Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                    Loading class roster...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    No students enrolled in this course & semester.
                  </td>
                </tr>
              ) : (
                students.map((st) => {
                  const currentStatus = attendanceMap[st.id] || 'Present';
                  return (
                    <tr key={st.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-blue-600">
                        {st.student_id}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {st.name}
                      </td>
                      <td className="px-6 py-4">
                        <div className="inline-flex rounded-xl p-1 bg-gray-100 border border-gray-200 gap-1">
                          <button
                            type="button"
                            onClick={() => setStudentStatus(st.id, 'Present')}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              currentStatus === 'Present'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-gray-600 hover:text-emerald-700'
                            }`}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() => setStudentStatus(st.id, 'Absent')}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              currentStatus === 'Absent'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'text-gray-600 hover:text-rose-700'
                            }`}
                          >
                            Absent
                          </button>
                          <button
                            type="button"
                            onClick={() => setStudentStatus(st.id, 'Late')}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              currentStatus === 'Late'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'text-gray-600 hover:text-amber-700'
                            }`}
                          >
                            Late
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          placeholder="Optional remarks..."
                          value={remarksMap[st.id] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setRemarksMap(prev => ({ ...prev, [st.id]: val }));
                          }}
                          className="w-full max-w-xs px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Save Bar */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {saveSuccess ? (
              <span className="text-emerald-600 font-bold flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                Attendance saved and synced with PostgreSQL successfully!
              </span>
            ) : (
              <span>Ready to submit attendance records for {selectedDate}</span>
            )}
          </div>
          <button
            onClick={handleSaveAttendance}
            disabled={saving || students.length === 0}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving to Database...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Class Attendance</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
