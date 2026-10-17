import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'attendance' | 'fee' | 'priority' | 'general';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'general' }) => {
  const getStyles = () => {
    const s = status.toLowerCase();

    // Attendance
    if (s === 'present') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (s === 'absent') return 'bg-rose-50 text-rose-700 border-rose-200';
    if (s === 'late') return 'bg-amber-50 text-amber-700 border-amber-200';

    // Fee
    if (s === 'paid') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (s === 'partially paid') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (s === 'pending') return 'bg-rose-50 text-rose-700 border-rose-200';

    // Priority
    if (s === 'urgent') return 'bg-rose-50 text-rose-700 border-rose-200';
    if (s === 'important') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (s === 'normal') return 'bg-blue-50 text-blue-700 border-blue-200';

    // General
    if (s === 'active') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (s === 'inactive') return 'bg-gray-100 text-gray-700 border-gray-200';

    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStyles()}`}
    >
      {status}
    </span>
  );
};
