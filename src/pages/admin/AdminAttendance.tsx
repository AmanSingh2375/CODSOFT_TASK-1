import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.ts';
import { AttendanceRecord, Course, Subject, Student } from '../../types/index.ts';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import { Modal } from '../../components/common/Modal.tsx';
import {
  CalendarCheck,
  Search,
  Plus,
  Loader2,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Filter
} from 'lucide-react';

export const AdminAttendance: React.FC = () => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('4');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  // Update modal
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [updateStatus, setUpdateStatus] = useState<'Present' | 'Absent' | 'Late'>('Present');
  const [updateRemarks, setUpdateRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Add attendance modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    studentId: '',
    subjectId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Present',
    remarks: 'Manual entry by Administrator'
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [cRes, sRes, stRes] = await Promise.all([
        api.get<Course[]>('/courses'),
        api.get<Subject[]>('/subjects'),
        api.get<Student[]>('/students')
      ]);
      setCourses(cRes);
      setSubjects(sRes);
      setStudents(stRes);

      const params = new URLSearchParams();
      if (selectedCourse) params.append('courseId', selectedCourse);
      if (selectedSemester) params.append('semester', selectedSemester);
      if (selectedSubject) params.append('subjectId', selectedSubject);
      if (selectedDate) params.append('date', selectedDate);

      const attRes = await api.get<AttendanceRecord[]>(`/attendance?${params.toString()}`);
      setAttendance(attRes);
    } catch (err) {
      console.error('Failed to load attendance', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCourse, selectedSemester, selectedSubject, selectedDate]);

  const handleOpenUpdate = (rec: AttendanceRecord) => {
    setSelectedRecord(rec);
    setUpdateStatus(rec.status);
    setUpdateRemarks(rec.remarks || '');
    setIsUpdateModalOpen(true);
  };

  const handleSaveUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    try {
      setActionLoading(true);
      await api.put(`/attendance/${selectedRecord.id}`, {
        status: updateStatus,
        remarks: updateRemarks
      });
      setIsUpdateModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert('Failed to update attendance: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setAddForm({
      studentId: students[0]?.id ? String(students[0].id) : '',
      subjectId: subjects[0]?.id ? String(subjects[0].id) : '',
      date: new Date().toISOString().split('T')[0],
      status: 'Present',
      remarks: 'Manual attendance log'
    });
    setIsAddModalOpen(true);
  };

  const handleCreateAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await api.post('/attendance', addForm);
      setIsAddModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert('Failed to create attendance: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const total = attendance.length;
  const presentCount = attendance.filter(a => a.status === 'Present').length;
  const absentCount = attendance.filter(a => a.status === 'Absent').length;
  const lateCount = attendance.filter(a => a.status === 'Late').length;
  const overallRate = total > 0 ? Math.round((presentCount / total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <CalendarCheck className="w-7 h-7 text-emerald-600" />
            <span>Institutional Attendance Records</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Real-time lecture roll-call tracking and institutional logs
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Log Single Record</span>
        </button>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-xs">
          <p className="text-xs text-gray-500">Filtered Logs</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{total}</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-xs">
          <p className="text-xs text-emerald-600 font-semibold">Present Count</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{presentCount}</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-xs">
          <p className="text-xs text-rose-600 font-semibold">Absent Count</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">{absentCount}</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-xs">
          <p className="text-xs text-blue-600 font-semibold">Attendance Rate</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{overallRate}%</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-wrap items-center gap-3">
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">All Courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">All Subjects</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
          ))}
        </select>

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />

        {(selectedCourse || selectedSubject || selectedDate) && (
          <button
            onClick={() => {
              setSelectedCourse('');
              setSelectedSubject('');
              setSelectedDate('');
            }}
            className="px-3 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
          >
            Reset
          </button>
        )}
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Student</th>
                <th className="px-6 py-3.5">Roll No</th>
                <th className="px-6 py-3.5">Subject</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Remarks</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                    Loading attendance entries...
                  </td>
                </tr>
              ) : attendance.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No attendance records found for selected criteria.
                  </td>
                </tr>
              ) : (
                attendance.map((rec) => (
                  <tr key={rec.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-6 py-4 font-mono text-gray-600 font-medium">
                      {rec.date}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {rec.student_name}
                    </td>
                    <td className="px-6 py-4 font-mono text-blue-600">
                      {rec.student_code}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {rec.subject_name} ({rec.subject_code})
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={rec.status} type="attendance" />
                    </td>
                    <td className="px-6 py-4 text-gray-500 italic">
                      {rec.remarks || 'Regular class'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenUpdate(rec)}
                        className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Attendance Record Modal */}
      <Modal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        title="Update Attendance Status"
        subtitle={`${selectedRecord?.student_name} • ${selectedRecord?.date}`}
        maxWidth="md"
      >
        <form onSubmit={handleSaveUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Attendance Status</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Present', 'Absent', 'Late'] as const).map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setUpdateStatus(s)}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                    updateStatus === s
                      ? s === 'Present'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : s === 'Absent'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700">Remarks / Reason</label>
            <input
              type="text"
              value={updateRemarks}
              onChange={(e) => setUpdateRemarks(e.target.value)}
              placeholder="e.g. Excused medical leave"
              className="mt-1 w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsUpdateModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Save Status</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Attendance Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Log Single Attendance Entry"
        maxWidth="md"
      >
        <form onSubmit={handleCreateAttendance} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700">Student *</label>
            <select
              value={addForm.studentId}
              onChange={(e) => setAddForm({ ...addForm, studentId: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.student_id})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700">Subject *</label>
            <select
              value={addForm.subjectId}
              onChange={(e) => setAddForm({ ...addForm, subjectId: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700">Date *</label>
            <input
              type="date"
              required
              value={addForm.date}
              onChange={(e) => setAddForm({ ...addForm, date: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700">Status</label>
            <select
              value={addForm.status}
              onChange={(e) => setAddForm({ ...addForm, status: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Late">Late</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700">Remarks</label>
            <input
              type="text"
              value={addForm.remarks}
              onChange={(e) => setAddForm({ ...addForm, remarks: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
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
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Save Record</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
