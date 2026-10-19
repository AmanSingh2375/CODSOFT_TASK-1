import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Upload,
  CheckCircle2,
  Clock,
  Award,
  FileText,
  AlertCircle,
  RefreshCw,
  X,
} from 'lucide-react';
import { api } from '../lib/api';
import { Assignment } from '../types';

export const AssignmentsPage: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Submitted' | 'Graded'>('All');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionFile, setSubmissionFile] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const list = await api.getAssignments();
      setAssignments(list);
    } catch (e: any) {
      setFeedbackMsg({ message: e?.message || 'Failed to load assignments.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleOpenSubmit = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setSubmissionFile(assignment.file_name || `${assignment.course_code.toLowerCase()}_solution.pdf`);
    setSubmissionNotes(assignment.content_text || '');
  };

  const handleSubmitSolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    try {
      setSubmitting(true);
      await api.submitAssignment(selectedAssignment.id, submissionFile, submissionNotes);
      setFeedbackMsg({ message: `Successfully submitted "${selectedAssignment.title}"!`, type: 'success' });
      setSelectedAssignment(null);
      await fetchAssignments();
    } catch (err: any) {
      setFeedbackMsg({ message: err?.message || 'Failed to submit assignment.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = assignments.filter((a) => {
    if (filter === 'All') return true;
    return a.submission_status === filter;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Assignments & Assessments</h1>
          <p className="text-xs text-slate-500">
            Submit coursework, track review progress, and review instructor grading notes
          </p>
        </div>

        <button
          onClick={fetchAssignments}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs font-medium flex items-center justify-between gap-2 animate-in fade-in ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{feedbackMsg.message}</span>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-xs underline hover:opacity-80 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {(['All', 'Pending', 'Submitted', 'Graded'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              filter === tab
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
            No assignments match the selected filter.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                    {item.course_code}
                  </span>
                  <span className="text-xs text-slate-500">•</span>
                  <span className="text-xs font-semibold text-slate-700">{item.course_title}</span>
                </div>

                <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>

                {item.feedback && (
                  <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-xs text-emerald-900 mt-2">
                    <span className="font-bold flex items-center gap-1 text-emerald-800 mb-0.5">
                      <Award className="w-3.5 h-3.5" /> Instructor Evaluation:
                    </span>
                    {item.feedback}
                  </div>
                )}
              </div>

              <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 gap-2 shrink-0">
                <div className="text-left md:text-right">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      item.submission_status === 'Graded'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.submission_status === 'Submitted'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.submission_status === 'Graded' && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {item.submission_status === 'Submitted' && <FileText className="w-3.5 h-3.5" />}
                    {item.submission_status === 'Pending' && <Clock className="w-3.5 h-3.5" />}
                    <span>{item.submission_status}</span>
                  </span>

                  <div className="text-[11px] text-slate-400 mt-1 font-mono">
                    Due: {new Date(item.due_date).toLocaleDateString([], { month: 'short', day: '2-digit' })}
                  </div>

                  {item.grade != null && (
                    <div className="text-xs font-bold text-indigo-600 font-mono mt-0.5">
                      Score: {item.grade} / {item.total_points}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleOpenSubmit(item)}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{item.submission_status === 'Pending' ? 'Submit Work' : 'Update Submission'}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Submission Modal */}
      {selectedAssignment && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                  {selectedAssignment.course_code}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{selectedAssignment.title}</h3>
              </div>
              <button
                onClick={() => setSelectedAssignment(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitSolution} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deliverable File Name
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={submissionFile}
                    onChange={(e) => setSubmissionFile(e.target.value)}
                    placeholder="e.g. cs201_homework_alex.pdf"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Submission Notes / Code Repository URL
                </label>
                <textarea
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  placeholder="Include any runtime instructions, test cases, or GitHub commit links..."
                  rows={4}
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAssignment(null)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting ? 'Submitting...' : 'Upload & Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
