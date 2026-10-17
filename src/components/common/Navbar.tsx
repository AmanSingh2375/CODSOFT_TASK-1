import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  GraduationCap,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Sparkles,
  Menu,
  X,
  Bell
} from 'lucide-react';
import { UserRole } from '../../types/index.ts';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout, quickLogin } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [quickSwitchOpen, setQuickSwitchOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleQuickSwitch = async (role: UserRole) => {
    try {
      await quickLogin(role);
      setQuickSwitchOpen(false);
      navigate(`/${role}/dashboard`);
    } catch (err) {
      console.error('Quick switch failed', err);
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'teacher':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'student':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section: Logo & Sidebar Toggle */}
          <div className="flex items-center gap-3">
            {user && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="p-2 text-gray-600 rounded-lg lg:hidden hover:bg-gray-100 focus:outline-none"
                aria-label="Toggle menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 text-white shadow-sm">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-gray-900">
                  Edu<span className="text-blue-600">Manage</span>
                </span>
                <span className="hidden sm:inline-block ml-2 text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                  v2.0
                </span>
              </div>
            </Link>
          </div>

          {/* Right section: User Profile / Quick Switch / Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <>
                {/* Demo Quick Switcher Button */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setQuickSwitchOpen(!quickSwitchOpen)}
                    className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Quick demo role switch for evaluation"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Role: {user.role.toUpperCase()}</span>
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                  </button>

                  {quickSwitchOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50">
                      <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Switch Demo Role
                      </div>
                      <button
                        onClick={() => handleQuickSwitch('admin')}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-purple-50 ${user.role === 'admin' ? 'font-bold text-purple-700 bg-purple-50/50' : 'text-gray-700'}`}
                      >
                        <span>Administrator</span>
                        <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">Admin</span>
                      </button>
                      <button
                        onClick={() => handleQuickSwitch('teacher')}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-blue-50 ${user.role === 'teacher' ? 'font-bold text-blue-700 bg-blue-50/50' : 'text-gray-700'}`}
                      >
                        <span>Dr. Rajesh Sharma</span>
                        <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">Teacher</span>
                      </button>
                      <button
                        onClick={() => handleQuickSwitch('student')}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-emerald-50 ${user.role === 'student' ? 'font-bold text-emerald-700 bg-emerald-50/50' : 'text-gray-700'}`}
                      >
                        <span>Aarav Sharma</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">Student</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Notifications link */}
                <Link
                  to={`/${user.role}/announcements`}
                  className="p-2 text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 transition-colors"
                  title="Announcements"
                >
                  <Bell className="w-5 h-5" />
                </Link>

                {/* User Profile dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm border border-blue-200">
                      {user.name.charAt(0)}
                    </div>
                    <div className="hidden sm:block text-left">
                      <div className="text-xs font-semibold text-gray-800 leading-tight">
                        {user.name}
                      </div>
                      <div className="text-[10px] text-gray-500 capitalize">
                        {user.role}
                      </div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-xs font-semibold text-gray-800">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getRoleBadgeClass(user.role)}`}>
                          {user.role.toUpperCase()}
                        </span>
                      </div>

                      {user.role === 'student' && (
                        <Link
                          to="/student/profile"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-xs text-gray-700 hover:bg-gray-50"
                        >
                          <UserIcon className="w-4 h-4 text-gray-400" />
                          <span>My Student Profile</span>
                        </Link>
                      )}

                      <Link
                        to={`/${user.role}/dashboard`}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs text-gray-700 hover:bg-gray-50"
                      >
                        <GraduationCap className="w-4 h-4 text-gray-400" />
                        <span>My Dashboard</span>
                      </Link>

                      <div className="border-t border-gray-100 my-1"></div>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 text-left"
                      >
                        <LogOut className="w-4 h-4 text-red-500" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
                >
                  Student Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
