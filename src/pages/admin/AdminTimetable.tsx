import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.ts';
import { TimetableEntry, Course, Subject, Teacher } from '../../types/index.ts';
import { Modal } from '../../components/common/Modal.tsx';
import {
  Calendar,
  Plus,
  Trash2,
  Clock,
  MapPin,
  User,
  Loader2,
  AlertCircle
} from 'lucide-react';

export const AdminTimetable: React.FC = () => {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('4');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<TimetableEntry | null>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const initialForm = {
    dayOfWeek: 'Monday',
    startTime: '09:00 AM',
    endTime: '10:30 AM',
    courseId: '',
    semester: '4',
    subjectId: '',
    teacherId: '',
    room: 'Lecture Hall 101'
  };
  const [formData, setFormData] = useState(initialForm);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cRes, sRes, tRes] = await Promise.all([
        api.get<Course[]>('/courses'),
        api.get<Subject[]>('/subjects'),
        api.get<Teacher[]>('/teachers')
      ]);
      setCourses(cRes);
      setSubjects(sRes);
      setTeachers(tRes);

      const activeCourse = selectedCourse || (cRes[0]?.id ? String(cRes[0].id) : '');
      if (!selectedCourse && activeCourse) {
        setSelectedCourse(activeCourse);
      }

      const params = new URLSearchParams();
      if (activeCourse) params.append('courseId', activeCourse);
      if (selectedSemester) params.append('semester', selectedSemester);

      const ttRes = await api.get<TimetableEntry[]>(`/timetable?${params.toString()}`);
      setTimetable(ttRes);
    } catch (err) {
      console.error('Failed to load timetable', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCourse, selectedSemester]);

  const handleOpenAdd = () => {
    const course = selectedCourse || (courses[0]?.id ? String(courses[0].id) : '');
    const filteredSubs = subjects.filter(s => s.course_id === Number(course));
    setFormData({
      ...initialForm,
      courseId: course,
      semester: selectedSemester,
      subjectId: filteredSubs[0]?.id ? String(filteredSubs[0].id) : '',
      teacherId: teachers[0]?.id ? String(teachers[0].id) : ''
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenDelete = (entry: TimetableEntry) => {
    setSelectedEntry(entry);
    setIsDeleteModalOpen(true);
  };

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setFormError(null);
      await api.post('/timetable', formData);
      setIsAddModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to add timetable slot');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteEntry = async () => {
    if (!selectedEntry) return;
    try {
      setActionLoading(true);
      await api.delete(`/timetable/${selectedEntry.id}`);
      setIsDeleteModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert('Failed to delete timetable entry: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredSubjects = subjects.filter(s => !formData.courseId || s.course_id === Number(formData.courseId));

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <Calendar className="w-7 h-7 text-indigo-600" />
            <span>Weekly Class Timetable Builder</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Organize lecture schedules, classroom halls, and faculty allocations
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Lecture Slot</span>
        </button>
      </div>

      {/* Program and Semester Selectors */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-wrap items-center gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Course / Program</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[200px]"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Semester</label>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[120px]"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
              <option key={s} value={s}>Semester {s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Weekly Visual Schedule Table */}
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
                      className="p-3.5 bg-gray-50/80 hover:bg-gray-100/70 rounded-xl border border-gray-200 flex flex-col justify-between transition-colors group"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs text-indigo-700 font-bold mb-1">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-indigo-500" />
                            {slot.start_time} – {slot.end_time}
                          </span>
                          <button
                            onClick={() => handleOpenDelete(slot)}
                            className="text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Remove Slot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <h4 className="text-sm font-bold text-gray-900 mt-1">{slot.subject_name}</h4>
                        <p className="text-[11px] text-gray-500 font-mono">{slot.subject_code}</p>

                        <div className="mt-3 pt-2 border-t border-gray-200/60 flex items-center justify-between text-[11px] text-gray-600">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-gray-400" />
                            {slot.teacher_name || 'Faculty Assigned'}
                          </span>
                          <span className="font-semibold text-gray-800 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            {slot.room}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Slot Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Timetable Class Slot"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateEntry} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700">Day of the Week *</label>
              <select
                value={formData.dayOfWeek}
                onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {daysOfWeek.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700">Classroom / Room *</label>
              <input
                type="text"
                required
                placeholder="e.g. Lecture Hall 101"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-700">Subject *</label>
              <select
                value={formData.subjectId}
                onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {filteredSubjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-700">Instructor / Teacher</label>
              <select
                value={formData.teacherId}
                onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- No Teacher Assigned --</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} ({t.teacher_id})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700">Start Time *</label>
              <input
                type="text"
                required
                placeholder="09:00 AM"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700">End Time *</label>
              <input
                type="text"
                required
                placeholder="10:30 AM"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Save Slot</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Slot Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Remove Timetable Slot"
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-600 leading-relaxed">
            Are you sure you want to remove the lecture slot for{' '}
            <strong className="text-gray-900">{selectedEntry?.subject_name}</strong> on {selectedEntry?.day_of_week} ({selectedEntry?.start_time})?
          </p>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteEntry}
              disabled={actionLoading}
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Remove Slot</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
