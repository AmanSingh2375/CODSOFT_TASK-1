import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.ts';
import { Announcement } from '../../types/index.ts';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import { Modal } from '../../components/common/Modal.tsx';
import {
  Megaphone,
  Plus,
  Loader2,
  Calendar,
  User,
  AlertCircle
} from 'lucide-react';

export const TeacherAnnouncements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const initialForm = {
    title: '',
    description: '',
    priority: 'Normal',
    targetAudience: 'Students'
  };
  const [formData, setFormData] = useState(initialForm);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get<Announcement[]>('/announcements');
      setAnnouncements(res);
    } catch (err) {
      console.error('Failed to load announcements', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePostNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setFormError(null);
      await api.post('/announcements', formData);
      setIsAddModalOpen(false);
      setFormData(initialForm);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to publish notice');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <Megaphone className="w-7 h-7 text-blue-600" />
            <span>Faculty Announcements</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Broadcast class assignments, lecture updates, and department circulars
          </p>
        </div>
        <button
          onClick={() => {
            setFormData(initialForm);
            setFormError(null);
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Post Student Notice</span>
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
            Loading notices...
          </div>
        ) : announcements.length === 0 ? (
          <div className="py-12 text-center text-gray-500 bg-white rounded-2xl border border-gray-200">
            No notices published.
          </div>
        ) : (
          announcements.map((ann) => (
            <div
              key={ann.id}
              className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center gap-2 mb-3">
                <StatusBadge status={ann.priority} type="priority" />
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                  Target: {ann.target_audience}
                </span>
                <span className="text-xs text-gray-400 font-mono">• {ann.published_date}</span>
              </div>

              <h3 className="text-base font-bold text-gray-900">{ann.title}</h3>
              <p className="mt-2 text-xs sm:text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {ann.description}
              </p>

              <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] text-gray-400">
                Posted by <strong className="text-gray-700">{ann.author_name}</strong> ({ann.author_role})
              </div>
            </div>
          ))
        )}
      </div>

      {/* Post Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Post Notice to Students"
        maxWidth="lg"
      >
        <form onSubmit={handlePostNotice} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700">Notice Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Lab Assignment 3 Submission Deadline"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Normal">Normal</option>
                <option value="Important">Important</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700">Target Audience</label>
              <select
                value={formData.targetAudience}
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Students">Students Only</option>
                <option value="All">All Campus</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700">Notice Description *</label>
            <textarea
              rows={4}
              required
              placeholder="Enter instructions, requirements, or circular details..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Publish Notice</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
