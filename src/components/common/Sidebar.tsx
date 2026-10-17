import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CalendarCheck,
  FileSpreadsheet,
  Award,
  CreditCard,
  Calendar,
  Megaphone,
  UserCheck,
  BookOpen,
  X
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const adminNav = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Students', path: '/admin/students', icon: Users },
    { name: 'Teachers', path: '/admin/teachers', icon: GraduationCap },
    { name: 'Attendance', path: '/admin/attendance', icon: CalendarCheck },
    { name: 'Examinations', path: '/admin/exams', icon: FileSpreadsheet },
    { name: 'Marks & Grades', path: '/admin/marks', icon: Award },
    { name: 'Fee Management', path: '/admin/fees', icon: CreditCard },
    { name: 'Timetable', path: '/admin/timetable', icon: Calendar },
    { name: 'Announcements', path: '/admin/announcements', icon: Megaphone },
  ];

  const teacherNav = [
    { name: 'Dashboard', path: '/teacher/dashboard', icon: LayoutDashboard },
    { name: 'My Students', path: '/teacher/students', icon: Users },
    { name: 'Attendance', path: '/teacher/attendance', icon: CalendarCheck },
    { name: 'Enter Marks', path: '/teacher/marks', icon: Award },
    { name: 'My Timetable', path: '/teacher/timetable', icon: Calendar },
    { name: 'Announcements', path: '/teacher/announcements', icon: Megaphone },
  ];

  const studentNav = [
    { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { name: 'My Profile', path: '/student/profile', icon: UserCheck },
    { name: 'My Attendance', path: '/student/attendance', icon: CalendarCheck },
    { name: 'Results & Marks', path: '/student/results', icon: Award },
    { name: 'Fee Status', path: '/student/fees', icon: CreditCard },
    { name: 'Class Timetable', path: '/student/timetable', icon: Calendar },
    { name: 'Announcements', path: '/student/announcements', icon: Megaphone },
  ];

  const navItems =
    user.role === 'admin'
      ? adminNav
      : user.role === 'teacher'
      ? teacherNav
      : studentNav;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header inside mobile sidebar */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 lg:hidden">
            <span className="text-lg font-bold text-gray-900">
              Edu<span className="text-blue-600">Manage</span>
            </span>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-500 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User badge preview */}
          <div className="p-4 mx-4 my-3 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                {user.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-gray-900 truncate">{user.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-medium text-gray-500 capitalize">{user.role} Portal</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
            <div className="px-3 pb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Navigation
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                    }`}
                  />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Footer info in sidebar */}
          <div className="p-4 border-t border-gray-100">
            <div className="text-[11px] text-gray-400 text-center">
              EduManage Academic Suite
              <div className="text-[10px] text-gray-400 mt-0.5">Full Stack Web Project</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
