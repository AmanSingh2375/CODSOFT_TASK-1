import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.ts';
import { Exam, Subject, Student, MarksRecord } from '../../types/index.ts';
import {
  Award,
  Save,
  Check,
  Loader2,
  AlertCircle
} from 'lucide-react';

export const TeacherMarks: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  // Marks map: studentId -> string (marks obtained)
  const [marksMap, setMarksMap] = useState<Record<number, string>>({});
  const [remarksMap, setRemarksMap] = useState<Record<number, string>>({});

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    async function loadMeta() {
      try {
        setLoading(true);
        const [eRes, sRes] = await Promise.all([
          api.get<Exam[]>('/exams'),
          api.get<Subject[]>('/subjects')
        ]);
        setExams(eRes);
        setSubjects(sRes);

        if (eRes.length > 0) {
          setSelectedExamId(String(eRes[0].id));
          setSelectedSubjectId(String(eRes[0].subject_id));
        }
      } catch (err) {
        console.error('Failed to load marks meta', err);
      } finally {
        setLoading(false);
      }
    }
    loadMeta();
  }, []);

  const activeExam = exams.find(e => e.id === Number(selectedExamId));

  // Load students for this exam's course & semester and any existing marks
  useEffect(() => {
    async function loadStudentsAndMarks() {
      if (!activeExam) return;
      try {
        setLoading(true);
        const stRes = await api.get<Student[]>(`/students?courseId=${activeExam.course_id}&semester=${activeExam.semester}`);
        setStudents(stRes);

        // Fetch existing marks
        const existing = await api.get<MarksRecord[]>(`/marks?examId=${activeExam.id}&subjectId=${activeExam.subject_id}`);
        const mObj: Record<number, string> = {};
        const rObj: Record<number, string> = {};

        existing.forEach(m => {
          mObj[m.student_id] = String(m.marks_obtained);
          if (m.remarks) rObj[m.student_id] = m.remarks;
        });

        // Set initial marks if none exists
        stRes.forEach(s => {
          if (mObj[s.id] === undefined) {
            mObj[s.id] = '75';
          }
        });

        setMarksMap(mObj);
        setRemarksMap(rObj);
      } catch (err) {
        console.error('Failed to load marks roster', err);
      } finally {
        setLoading(false);
      }
    }
    loadStudentsAndMarks();
  }, [selectedExamId]);

  const computeGrade = (marksObtained: number, maxMarks: number) => {
    const pct = (marksObtained / maxMarks) * 100;
    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B+';
    if (pct >= 60) return 'B';
    if (pct >= 50) return 'C';
    if (pct >= 40) return 'D';
    return 'F';
  };

  const handleSaveAllMarks = async () => {
    if (!activeExam) return;
    try {
      setSaving(true);
      setSaveSuccess(false);

      const payload = students.map(s => ({
        studentId: s.id,
        examId: activeExam.id,
        subjectId: activeExam.subject_id,
        marksObtained: Number(marksMap[s.id] || 0),
        maxMarks: activeExam.max_marks,
        remarks: remarksMap[s.id] || 'Regular evaluation'
      }));

      await api.post('/marks', payload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      alert('Failed to save marks: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <Award className="w-7 h-7 text-indigo-600" />
            <span>Enter Examination Marks</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Grade examination answer sheets and record scores into student academic transcripts
          </p>
        </div>
      </div>

      {/* Select Exam Bar */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Select Examination Schedule
        </label>
        <select
          value={selectedExamId}
          onChange={(e) => setSelectedExamId(e.target.value)}
          className="w-full max-w-xl px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {exams.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name} — {ex.subject_name} ({ex.course_name} Sem {ex.semester}) • Max: {ex.max_marks} pts
            </option>
          ))}
        </select>

        {activeExam && (
          <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-4 text-xs text-gray-600">
            <div>
              <span className="text-gray-400">Subject: </span>
              <strong className="text-gray-800">{activeExam.subject_name} ({activeExam.subject_code})</strong>
            </div>
            <div>
              <span className="text-gray-400">Exam Date: </span>
              <strong className="text-gray-800">{activeExam.exam_date}</strong>
            </div>
            <div>
              <span className="text-gray-400">Max Score: </span>
              <strong className="text-indigo-600">{activeExam.max_marks} Marks</strong>
            </div>
            <div>
              <span className="text-gray-400">Passing Score: </span>
              <strong className="text-emerald-600">{activeExam.passing_marks} Marks</strong>
            </div>
          </div>
        )}
      </div>

      {/* Marks Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            Student Marks Sheet
          </span>
          <span className="text-xs text-gray-400">
            Grades calculate automatically based on standard collegiate percentage scale
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-3.5">Roll No</th>
                <th className="px-6 py-3.5">Student Name</th>
                <th className="px-6 py-3.5">Marks Obtained</th>
                <th className="px-6 py-3.5">Percentage</th>
                <th className="px-6 py-3.5">Grade</th>
                <th className="px-6 py-3.5">Feedback / Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                    Loading enrolled students...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No students found for this examination course & semester.
                  </td>
                </tr>
              ) : (
                students.map((st) => {
                  const maxMarks = activeExam?.max_marks || 100;
                  const obtained = Number(marksMap[st.id] || 0);
                  const pct = Math.round((obtained / maxMarks) * 100);
                  const grade = computeGrade(obtained, maxMarks);

                  return (
                    <tr key={st.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-blue-600">
                        {st.student_id}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {st.name}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            max={maxMarks}
                            step="0.5"
                            value={marksMap[st.id] ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMarksMap(prev => ({ ...prev, [st.id]: val }));
                            }}
                            className="w-20 px-3 py-1.5 text-xs font-bold text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <span className="text-gray-400">/ {maxMarks}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-700">
                        {pct}%
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-xs ${
                          pct >= 80 ? 'bg-emerald-100 text-emerald-800' :
                          pct >= 60 ? 'bg-blue-100 text-blue-800' :
                          pct >= 40 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {grade}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          placeholder="Optional feedback..."
                          value={remarksMap[st.id] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setRemarksMap(prev => ({ ...prev, [st.id]: val }));
                          }}
                          className="w-full max-w-xs px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer save bar */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {saveSuccess ? (
              <span className="text-emerald-600 font-bold flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                All student marks and grades successfully recorded into PostgreSQL!
              </span>
            ) : (
              <span>Ready to submit evaluation marks</span>
            )}
          </div>
          <button
            onClick={handleSaveAllMarks}
            disabled={saving || students.length === 0}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Marks...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Submit & Publish Marks</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
