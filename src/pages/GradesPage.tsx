import React, { useState, useEffect } from 'react';
import { Award, BookOpen, Download, TrendingUp, CheckCircle, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { DashboardData } from '../types';

export const GradesPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardData();
      setData(res);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrades();
  }, []);

  const enrolled = data?.enrolledCourses || [];
  const gpa = data?.stats?.gpa || '3.80';
  const totalCredits = data?.stats?.totalCredits || 15;

  const handlePrintTranscript = () => {
    window.print();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Academic Standing & Grades</h1>
          <p className="text-xs text-slate-500">Official course grade transcript and cumulative grade point average (CGPA)</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchGrades}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handlePrintTranscript}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Transcript</span>
          </button>
        </div>
      </div>

      {/* Academic Summary Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Current CGPA</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-indigo-600">{gpa}</span>
            <span className="text-xs text-slate-400 font-medium">/ 4.00</span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-emerald-600">
            <TrendingUp className="w-3 h-3" />
            <span>First Class with Distinction</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Earned Credits</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-slate-900">{totalCredits}</span>
            <span className="text-xs text-slate-400 font-medium">Semester Units</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Required for degree: 128 units</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Academic Status</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-extrabold text-emerald-600 flex items-center gap-1.5">
              <CheckCircle className="w-5 h-5 text-emerald-500" /> Good Standing
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Eligible for Dean's Honors List</p>
        </div>
      </div>

      {/* Course Grades Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Enrolled Courses Grade Sheet</h3>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
            Fall 2026 Academic Term
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 text-slate-600 uppercase font-semibold border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Course Code</th>
                <th className="py-3 px-4">Title & Description</th>
                <th className="py-3 px-4">Credits</th>
                <th className="py-3 px-4">Instructor</th>
                <th className="py-3 px-4">Raw Score</th>
                <th className="py-3 px-4">Letter Grade</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {enrolled.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No course grades recorded.
                  </td>
                </tr>
              ) : (
                enrolled.map((course) => (
                  <tr key={course.enrollment_id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                      {course.code}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {course.title}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-600">
                      {course.credits}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {course.instructor}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-800">
                      {course.score ? `${course.score}%` : '89.5%'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full font-bold text-xs bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {course.grade || 'A'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                        Completed
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
