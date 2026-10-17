import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { MarksRecord, Exam } from '../../types/index.ts';
import {
  Award,
  Calendar,
  FileSpreadsheet,
  TrendingUp,
  Loader2,
  CheckCircle2
} from 'lucide-react';

interface AcademicReport {
  summary: {
    totalSubjects: number;
    totalMarksObtained: number;
    totalMaxMarks: number;
    overallPercentage: number;
    sgpa: number;
    overallGrade: string;
  };
  records: MarksRecord[];
}

export const StudentResults: React.FC = () => {
  const { user } = useAuth();
  const [report, setReport] = useState<AcademicReport | null>(null);
  const [upcomingExams, setUpcomingExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadResults() {
      try {
        setLoading(true);
        const studentId = user?.studentId;
        if (studentId) {
          const [repRes, statsRes] = await Promise.all([
            api.get<AcademicReport>(`/marks/student/${studentId}`),
            api.get<any>('/student/stats')
          ]);
          setReport(repRes);
          setUpcomingExams(statsRes.upcomingExams || []);
        }
      } catch (err) {
        console.error('Failed to load student results', err);
      } finally {
        setLoading(false);
      }
    }
    loadResults();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const summary = report?.summary || {
    totalSubjects: 0,
    totalMarksObtained: 0,
    totalMaxMarks: 0,
    overallPercentage: 0,
    sgpa: 0,
    overallGrade: 'N/A'
  };

  const getGradeStyle = (grade: string) => {
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
            <Award className="w-7 h-7 text-blue-600" />
            <span>Academic Transcript & Exam Results</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Official semester grade sheet, SGPA evaluation, and scheduled examinations
          </p>
        </div>
      </div>

      {/* SGPA & Academic Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-blue-100 bg-blue-50/20 shadow-xs">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Semester SGPA</p>
          <p className="text-3xl font-extrabold text-blue-600 mt-1">{summary.sgpa} <span className="text-sm font-normal text-gray-400">/ 10</span></p>
          <p className="text-[11px] text-blue-600/80 mt-0.5">Grade Point Average</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-emerald-100 bg-emerald-50/20 shadow-xs">
          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Overall Percentage</p>
          <p className="text-3xl font-extrabold text-emerald-600 mt-1">{summary.overallPercentage}%</p>
          <p className="text-[11px] text-emerald-600/80 mt-0.5">Total Marks Ratio</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-purple-100 bg-purple-50/20 shadow-xs">
          <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Overall Grade</p>
          <p className="text-3xl font-extrabold text-purple-600 mt-1">{summary.overallGrade}</p>
          <p className="text-[11px] text-purple-600/80 mt-0.5">Performance Classification</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-xs">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Evaluated Papers</p>
          <p className="text-3xl font-extrabold text-gray-900 mt-1">{summary.totalSubjects}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{summary.totalMarksObtained} / {summary.totalMaxMarks} Marks</p>
        </div>
      </div>

      {/* Marks Records Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            Subject-Wise Examination Results
          </span>
          <span className="text-xs text-gray-400">
            Graded on 10-point credit scale
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-3.5">Subject Code</th>
                <th className="px-6 py-3.5">Subject Name</th>
                <th className="px-6 py-3.5">Examination</th>
                <th className="px-6 py-3.5 text-center">Marks Obtained</th>
                <th className="px-6 py-3.5 text-center">Grade</th>
                <th className="px-6 py-3.5">Examiner Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {report?.records && report.records.length > 0 ? (
                report.records.map((rec) => {
                  const pct = Math.round((Number(rec.marks_obtained) / Number(rec.max_marks)) * 100);
                  return (
                    <tr key={rec.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-blue-600">
                        {rec.subject_code}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {rec.subject_name}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {rec.exam_name}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-bold text-gray-900">{rec.marks_obtained}</span>
                        <span className="text-gray-400"> / {rec.max_marks} ({pct}%)</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-3 py-0.5 rounded-full font-bold text-xs border ${getGradeStyle(rec.grade)}`}>
                          {rec.grade}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 italic">
                        {rec.remarks || 'Satisfactory'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    No examination results released for this semester yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upcoming Exam Schedule Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6">
        <h2 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
          Upcoming Examination Timetable
        </h2>

        {upcomingExams.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingExams.map((ex) => (
              <div
                key={ex.id}
                className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col justify-between"
              >
                <div>
                  <span className="text-xs font-mono font-bold text-rose-700 block mb-1">
                    {ex.exam_date} • {ex.start_time}
                  </span>
                  <h4 className="text-sm font-bold text-gray-900">{ex.name}</h4>
                  <p className="text-xs text-blue-600 font-semibold mt-1">{ex.subject_name}</p>
                </div>
                <div className="mt-4 pt-2 border-t border-gray-200/60 flex items-center justify-between text-xs text-gray-500">
                  <span>Room: <strong className="text-gray-800">{ex.room}</strong></span>
                  <span>Pass Marks: <strong className="text-emerald-700">{ex.passing_marks}</strong></span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic text-center py-4">
            No further upcoming examinations scheduled at this time.
          </p>
        )}
      </div>
    </div>
  );
};
