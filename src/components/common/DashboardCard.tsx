import React from 'react';
import { LucideIcon } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'blue' | 'purple' | 'emerald' | 'amber' | 'rose' | 'indigo';
  onClick?: () => void;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'blue',
  onClick,
}) => {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-100',
      hover: 'hover:border-blue-300',
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-100',
      hover: 'hover:border-purple-300',
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
      hover: 'hover:border-emerald-300',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-100',
      hover: 'hover:border-amber-300',
    },
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      border: 'border-rose-100',
      hover: 'hover:border-rose-300',
    },
    indigo: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      border: 'border-indigo-100',
      hover: 'hover:border-indigo-300',
    },
  };

  const scheme = colorMap[color];

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 border ${scheme.border} shadow-xs transition-all duration-200 ${
        onClick ? `cursor-pointer ${scheme.hover} hover:shadow-md` : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            {title}
          </p>
          <h3 className="mt-2 text-2xl font-bold text-gray-900 tracking-tight">
            {value}
          </h3>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-500 font-normal">{subtitle}</p>
          )}
        </div>
        <div
          className={`flex items-center justify-center w-12 h-12 rounded-xl ${scheme.bg} ${scheme.text} shadow-xs`}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
