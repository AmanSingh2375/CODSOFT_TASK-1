import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.ts';
import { Announcement } from '../../types/index.ts';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import {
  Megaphone,
  Search,
  Calendar,
  Loader2,
  Filter
} from 'lucide-react';

export const StudentAnnouncements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  useEffect(() => {
    async function loadAnnouncements() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.append('audience', 'Students');
        if (priorityFilter) params.append('priority', priorityFilter);

        const res = await api.get<Announcement[]>(`/announcements?${params.toString()}`);
        setAnnouncements(res);
      } catch (err) {
        console.error('Failed to load announcements', err);
      } finally {
        setLoading(false);
      }
    }
    loadAnnouncements();
  }, [priorityFilter]);

  const filtered = announcements.filter(a =>
    !search ||
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
          <Megaphone className="w-7 h-7 text-blue-600" />
          <span>Campus Notices & Circulars</span>
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Official academic announcements, schedule revisions, and event circulars
        </p>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search bulletins by title or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Priorities</option>
          <option value="Urgent">Urgent Only</option>
          <option value="Important">Important Only</option>
          <option value="Normal">Normal Only</option>
        </select>
      </div>

      {/* Bulletins List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
            Loading notices...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-gray-200 text-gray-500 text-xs">
            No announcements found matching your criteria.
          </div>
        ) : (
          filtered.map((ann) => (
            <div
              key={ann.id}
              className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center gap-2 mb-3">
                <StatusBadge status={ann.priority} type="priority" />
                <span className="text-xs text-gray-400 font-mono">• {ann.published_date}</span>
              </div>

              <h3 className="text-base font-bold text-gray-900">{ann.title}</h3>
              <p className="mt-2 text-xs sm:text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {ann.description}
              </p>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                <span>Published by: <strong className="text-gray-700">{ann.author_name}</strong> ({ann.author_role})</span>
                <span className="text-emerald-600 font-semibold">Active Official Notice</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
