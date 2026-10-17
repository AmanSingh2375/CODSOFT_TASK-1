import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.ts';
import { MarksRecord, Exam, Subject, Student } from '../../types/index.ts';
import { Modal } from '../../components/common/Modal.tsx';
import {
  Award,
  Search,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';

export const AdminMarks: React.FC = () => {
  const [marks, setMarks] = useState<MarksRecord[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MarksRecord | null>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const initialForm = {
    studentId: '',
    examId: '',
    subjectId: '',
    marksObtained: '85',
    maxMarks: '100',
    remarks: 'Satisfactory performance'
  };
  const [formData, setFormData] = useState(initialForm);

  const loadData = async () => {
    try {
      setLoading(true);
      const [eRes, sRes, stRes] = await Promise.all([
        api.get<Exam[]>('/exams'),
        api.get<Subject[]>('/subjects'),
        api.get<Student[]>('/students')
      ]);
      setExams(eRes);
      setSubjects(sRes);
      setStudents(stRes);

      const params = new URLSearchParams();
      if (selectedExam) params.append('examId', selectedExam);
      if (selectedSubject) params.append('subjectId', selectedSubject);

      const mRes = await api.get<MarksRecord[]>(`/marks?${params.toString()}`);
      setMarks(mRes);
    } catch (err) {
      console.error('Failed to load marks', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedExam, selectedSubject]);

  const handleOpenAdd = () => {
    setFormData({
      studentId: students[0]?.id ? String(students[0].id) : '',
      examId: exams[0]?.id ? String(exams[0].id) : '',
      subjectId: exams[0]?.subject_id ? String(exams[0].subject_id) : (subjects[0]?.id ? String(subjects[0].id) : ''),
      marksObtained: '85',
      maxMarks: '100',
      remarks: 'Satisfactory'
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (rec: MarksRecord) => {
    setSelectedRecord(rec);
    setFormData({
      studentId: String(rec.student_id),
      examId: String(rec.exam_id),
      subjectId: String(rec.subject_id),
      marksObtained: String(rec.marks_obtained),
      maxMarks: String(rec.max_marks),
      remarks: rec.remarks || ''
    });
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleCreateMarks = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setFormError(null);
      await api.post('/marks', formData);
      setIsAddModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to enter marks');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateMarks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    try {
      setActionLoading(true);
      setFormError(null);
      await api.put(`/marks/${selectedRecord.id}`, {
        marksObtained: formData.marksObtained,
        maxMarks: formData.maxMarks,
        remarks: formData.remarks
      });
      setIsEditModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update marks');
    } finally {
      setActionLoading(false);
    }
  };

  const getGradeBadge = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'B+':
      case 'B':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'C':
      case 'D':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-rose-100 text-rose-800 border-rose-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <Award className="w-7 h-7 text-indigo-600" />
            <span>Academic Marks & Results</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Student examination marks, grade points, and performance records
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Enter Student Marks</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-wrap items-center gap-3">
        <select
          value={selectedExam}
          onChange={(e) => setSelectedExam(e.target.value)}
          className="px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Examinations</option>
          {exams.map((e) => (
            <option key={e.id} value={e.id}>{e.name} ({e.subject_name})</option>
          ))}
        </select>

        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Subjects</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
          ))}
        </select>

        {(selectedExam || selectedSubject) && (
          <button
            onClick={() => {
              setSelectedExam('');
              setSelectedSubject('');
            }}
            className="px-3 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Marks Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-3.5">Student</th>
                <th className="px-6 py-3.5">Roll No</th>
                <th className="px-6 py-3.5">Examination</th>
                <th className="px-6 py-3.5">Subject</th>
                <th className="px-6 py-3.5">Marks Obtained</th>
                <th className="px-6 py-3.5">Grade</th>
                <th className="px-6 py-3.5">Remarks</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                    Loading examination marks...
                  </td>
                </tr>
              ) : marks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No marks records found for this selection.
                  </td>
                </tr>
              ) : (
                marks.map((rec) => {
                  const pct = Math.round((Number(rec.marks_obtained) / Number(rec.max_marks)) * 100);
                  return (
                    <tr key={rec.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {rec.student_name}
                      </td>
                      <td className="px-6 py-4 font-mono text-blue-600 font-medium">
                        {rec.student_code}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {rec.exam_name}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {rec.subject_name} ({rec.subject_code})
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-900">{rec.marks_obtained}</span>
                        <span className="text-gray-400"> / {rec.max_marks} ({pct}%)</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-xs border ${getGradeBadge(rec.grade)}`}>
                          {rec.grade}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 italic">
                        {rec.remarks || 'Completed'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleOpenEdit(rec)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Marks"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Marks Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Enter Student Exam Marks"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateMarks} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700">Select Examination *</label>
            <select
              value={formData.examId}
              onChange={(e) => {
                const ex = exams.find(x => x.id === Number(e.target.value));
                setFormData({
                  ...formData,
                  examId: e.target.value,
                  subjectId: ex ? String(ex.subject_id) : formData.subjectId,
                  maxMarks: ex ? String(ex.max_marks) : '100'
                });
              }}
              className="mt-1 w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>{ex.name} - {ex.subject_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700">Student *</label>
            <select
              value={formData.studentId}
              onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {students.map((st) => (
                <option key={st.id} value={st.id}>{st.name} ({st.student_id})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700">Marks Obtained *</label>
              <input
                type="number"
                step="0.5"
                required
                value={formData.marksObtained}
                onChange={(e) => setFormData({ ...formData, marksObtained: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700">Maximum Marks</label>
              <input
                type="number"
                value={formData.maxMarks}
                onChange={(e) => setFormData({ ...formData, maxMarks: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700">Remarks</label>
            <input
              type="text"
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="e.g. Well organized answers"
              className="mt-1 w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Save Marks</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Marks Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Student Marks"
        subtitle={`${selectedRecord?.student_name} • ${selectedRecord?.subject_name}`}
        maxWidth="md"
      >
        <form onSubmit={handleUpdateMarks} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700">Marks Obtained</label>
              <input
                type="number"
                step="0.5"
                required
                value={formData.marksObtained}
                onChange={(e) => setFormData({ ...formData, marksObtained: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700">Maximum Marks</label>
              <input
                type="number"
                value={formData.maxMarks}
                onChange={(e) => setFormData({ ...formData, maxMarks: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700">Remarks</label>
            <input
              type="text"
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
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
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
