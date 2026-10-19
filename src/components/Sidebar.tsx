import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Award,
  CalendarCheck,
  ClipboardList,
  Megaphone,
  UserCircle,
  ServerCog,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'courses', label: 'Courses & Catalog', icon: BookOpen },
    { id: 'grades', label: 'Grades & Transcript', icon: Award },
    { id: 'attendance', label: 'Attendance Tracker', icon: CalendarCheck },
    { id: 'assignments', label: 'Assignments', icon: ClipboardList },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'profile', label: 'Student Profile', icon: UserCircle },
    { id: 'diagnostics', label: 'System & Database', icon: ServerCog },
  ];

  const handleItemClick = (pageId: string) => {
    onNavigate(pageId);
    onClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-4 z-40 transition-transform duration-200 ease-in-out shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-6">
          {/* Main Navigation Links */}
          <nav className="space-y-1">
            <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Main Menu
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? 'text-indigo-600' : 'text-slate-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-indigo-500" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Student Profile Card */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
              {user?.full_name?.charAt(0) || 'S'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-900 truncate">
                {user?.full_name}
              </p>
              <p className="text-[10px] text-slate-500 font-mono truncate">
                {user?.student_id || 'Student ID'}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[11px]">
            <span className="text-slate-500 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Verified User
            </span>
            <span className="font-semibold text-slate-700 capitalize">{user?.role}</span>
          </div>
        </div>
      </aside>
    </>
  );
};
