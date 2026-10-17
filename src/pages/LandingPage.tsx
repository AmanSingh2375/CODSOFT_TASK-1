import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import {
  GraduationCap,
  Users,
  CalendarCheck,
  Award,
  CreditCard,
  Calendar,
  Megaphone,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Mail,
  Phone,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { UserRole } from '../types/index.ts';

export const LandingPage: React.FC = () => {
  const { user, quickLogin } = useAuth();
  const navigate = useNavigate();

  const handleQuickDemo = async (role: UserRole) => {
    try {
      await quickLogin(role);
      navigate(`/${role}/dashboard`);
    } catch (err) {
      console.error('Quick login failed', err);
    }
  };

  const features = [
    {
      title: 'Student Management',
      desc: 'Centralized student directory with academic history, guardian details, department assignments, and profile records.',
      icon: Users,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Attendance Tracking',
      desc: 'Real-time subject-wise attendance tracking with instant statistics, percentages, and faculty daily roll-call.',
      icon: CalendarCheck,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      title: 'Examination Management',
      desc: 'Complete exam scheduling, hall allocations, marks entry, automated grade calculation, and SGPA transcripts.',
      icon: Award,
      color: 'bg-purple-50 text-purple-600',
    },
    {
      title: 'Fee Management',
      desc: 'Semester fee ledger with paid, partially paid, and pending balances, automated receipts, and online test checkout.',
      icon: CreditCard,
      color: 'bg-amber-50 text-amber-600',
    },
    {
      title: 'Weekly Timetable',
      desc: 'Visual course schedules, classroom allocations, and faculty timetables synchronized across semesters.',
      icon: Calendar,
      color: 'bg-indigo-50 text-indigo-600',
    },
    {
      title: 'Campus Announcements',
      desc: 'Instant academic notifications with priority tiers (Urgent, Important, Normal) filtered by target audience.',
      icon: Megaphone,
      color: 'bg-rose-50 text-rose-600',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      {/* Top Banner / Demo Notice */}
      <div className="bg-slate-900 text-white text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500 text-white">
              COLLEGE PROJECT
            </span>
            <span className="text-gray-300">
              Full Stack Web Development Submission: PostgreSQL, Express REST APIs, React & JWT Auth
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-400 hidden sm:inline">1-Click Test Login:</span>
            <button
              onClick={() => handleQuickDemo('admin')}
              className="text-purple-300 hover:text-white underline text-xs font-medium"
            >
              Admin
            </button>
            <span className="text-gray-600">•</span>
            <button
              onClick={() => handleQuickDemo('teacher')}
              className="text-blue-300 hover:text-white underline text-xs font-medium"
            >
              Teacher
            </button>
            <span className="text-gray-600">•</span>
            <button
              onClick={() => handleQuickDemo('student')}
              className="text-emerald-300 hover:text-white underline text-xs font-medium"
            >
              Student
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="border-b border-gray-100 bg-white/95 backdrop-blur-xs sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-gray-900">
                Edu<span className="text-blue-600">Manage</span>
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#roles" className="hover:text-blue-600 transition-colors">Portals</a>
            <a href="#about" className="hover:text-blue-600 transition-colors">About</a>
            <a href="#contact" className="hover:text-blue-600 transition-colors">Contact</a>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to={`/${user.role}/dashboard`}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-sm transition-all"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-sm transition-all"
                >
                  Student Register
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-linear-to-b from-blue-50/50 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100/80 border border-blue-200 text-blue-700 text-xs font-semibold mb-6">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Academic Year 2025–2026 Portal Live
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight">
              Digitizing College Operations with{' '}
              <span className="text-blue-600">EduManage</span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed font-normal">
              A comprehensive, role-based Student Management System built for colleges and universities.
              Seamlessly handle attendance, academic transcripts, examinations, semester fees, and timetables in one unified platform.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/login"
                className="px-7 py-3.5 text-base font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
              >
                Access Portal
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/register"
                className="px-7 py-3.5 text-base font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 shadow-xs transition-all"
              >
                New Student Registration
              </Link>
            </div>

            {/* Quick Demo Credentials Box */}
            <div className="mt-12 p-5 bg-white rounded-2xl border border-gray-200 shadow-sm max-w-2xl mx-auto text-left">
              <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Pre-configured Test Logins (Password: password123)
                </span>
                <span className="text-[11px] text-gray-400">Click to auto-login</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  onClick={() => handleQuickDemo('admin')}
                  className="p-3 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100/70 text-left transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-900">Admin</span>
                    <span className="text-[10px] bg-purple-200 text-purple-800 px-1.5 py-0.5 rounded">Full CRUD</span>
                  </div>
                  <p className="text-[11px] text-purple-700 mt-1 truncate">admin@edumanage.edu</p>
                </button>

                <button
                  onClick={() => handleQuickDemo('teacher')}
                  className="p-3 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/70 text-left transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900">Teacher</span>
                    <span className="text-[10px] bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded">Faculty</span>
                  </div>
                  <p className="text-[11px] text-blue-700 mt-1 truncate">dr.sharma@edumanage.edu</p>
                </button>

                <button
                  onClick={() => handleQuickDemo('student')}
                  className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/70 text-left transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900">Student</span>
                    <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded">Learner</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 mt-1 truncate">arav.sharma@student.edu</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section id="features" className="py-20 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest">
              Core Modules
            </h2>
            <p className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Everything Your Academic Institution Needs
            </p>
            <p className="mt-4 text-base text-gray-600">
              Designed according to real collegiate administrative workflows with modular database relationships.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="bg-white p-7 rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition-shadow"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${f.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{f.title}</h3>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Portals / User Roles Section */}
      <section id="roles" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest">
              Role-Based Architecture
            </h2>
            <p className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Tailored Portals for Every Stakeholder
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Admin Box */}
            <div className="bg-purple-50/40 border border-purple-200/80 rounded-2xl p-7 flex flex-col justify-between">
              <div>
                <div className="inline-block px-3 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded-lg mb-4">
                  Administrator
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Central Administration</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Complete authority over institutional records, student admissions, teacher appointments, examinations, and financial ledgers.
                </p>
                <ul className="space-y-2.5 text-xs text-gray-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600" />
                    <span>CRUD operations on Students & Teachers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600" />
                    <span>Create Exams & Allocate Halls</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600" />
                    <span>Fee collection & payment tracking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600" />
                    <span>Timetable builder & Announcements</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => handleQuickDemo('admin')}
                className="mt-8 w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
              >
                Log in as Admin
              </button>
            </div>

            {/* Teacher Box */}
            <div className="bg-blue-50/40 border border-blue-200/80 rounded-2xl p-7 flex flex-col justify-between">
              <div>
                <div className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-lg mb-4">
                  Faculty Member
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Teaching & Grading</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Streamlined portal for subject faculty to take daily class attendance, enter exam marks, and inspect assigned timetables.
                </p>
                <ul className="space-y-2.5 text-xs text-gray-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    <span>One-click daily attendance marking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    <span>Exam marks entry with automatic grade calculation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    <span>View assigned student rosters & profiles</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    <span>Teacher lecture timetable schedule</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => handleQuickDemo('teacher')}
                className="mt-8 w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
              >
                Log in as Teacher
              </button>
            </div>

            {/* Student Box */}
            <div className="bg-emerald-50/40 border border-emerald-200/80 rounded-2xl p-7 flex flex-col justify-between">
              <div>
                <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg mb-4">
                  Student Portal
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Self-Service Student Hub</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Empowering students with 24/7 visibility into their academic progress, attendance percentages, fees, and campus news.
                </p>
                <ul className="space-y-2.5 text-xs text-gray-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Subject-wise attendance breakdown (88%, 92%, etc.)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Semester marks transcript & SGPA records</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Fee dues and simulated online fee checkout</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Class schedule matrix & exam calendar</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => handleQuickDemo('student')}
                className="mt-8 w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
              >
                Log in as Student
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">
                <BookOpen className="w-4 h-4" /> Academic Engineering
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                Built as a Capstone Full Stack Web Development Project
              </h2>
              <p className="mt-4 text-sm text-gray-600 leading-relaxed">
                EduManage satisfies all academic criteria for undergraduate and graduate software engineering curricula:
                relational PostgreSQL data persistence, clean RESTful endpoints, bcrypt password salting, JSON Web Token session management, and responsive Tailwind UI.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-xl border border-gray-200">
                  <div className="text-xl font-bold text-blue-600">PostgreSQL</div>
                  <div className="text-xs text-gray-500 mt-0.5">Relational DB with Prisma models</div>
                </div>
                <div className="p-4 bg-white rounded-xl border border-gray-200">
                  <div className="text-xl font-bold text-emerald-600">JWT & bcrypt</div>
                  <div className="text-xs text-gray-500 mt-0.5">Role-based access control</div>
                </div>
                <div className="p-4 bg-white rounded-xl border border-gray-200">
                  <div className="text-xl font-bold text-purple-600">REST APIs</div>
                  <div className="text-xs text-gray-500 mt-0.5">Node.js Express backend</div>
                </div>
                <div className="p-4 bg-white rounded-xl border border-gray-200">
                  <div className="text-xl font-bold text-amber-600">React + Vite</div>
                  <div className="text-xs text-gray-500 mt-0.5">Tailwind CSS responsive design</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Sample Seed Records Included</h3>
              <p className="text-xs text-gray-500 mb-6">
                The database is pre-seeded with sample records covering all student, faculty, and administrative activities:
              </p>
              <div className="space-y-3 text-xs text-gray-700">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="font-medium">1 Administrator Account</span>
                  <span className="text-purple-600 font-semibold">admin@edumanage.edu</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="font-medium">3 Faculty Professors</span>
                  <span className="text-blue-600 font-semibold">CSE, IT, ECE Departments</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="font-medium">10 Enrolled Students</span>
                  <span className="text-emerald-600 font-semibold">B.Tech CS, BCA, B.Sc IT</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="font-medium">Attendance Records</span>
                  <span className="text-gray-600 font-semibold">Java (88%), DBMS (80%), DSA (92%)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="font-medium">Exams & Transcripts</span>
                  <span className="text-gray-600 font-semibold">Mid-Term & End-Sem Schedules</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="font-medium">Fees & Announcements</span>
                  <span className="text-gray-600 font-semibold">Fee Ledgers & Priority Notices</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  University Academic Helpdesk
                </h2>
                <p className="mt-3 text-sm text-gray-300">
                  Have questions about admissions, examination dates, or fees? Reach out to the university administration department.
                </p>
                <div className="mt-6 space-y-3 text-xs sm:text-sm text-gray-300">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-blue-400" />
                    <span>support@edumanage.edu</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-blue-400" />
                    <span>+1 (800) 555-CAMPUS (Ext 401)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-blue-400" />
                    <span>Academic Block A, University Campus, EduManage Hall</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                <h3 className="text-base font-semibold text-white mb-2">Ready to explore?</h3>
                <p className="text-xs text-gray-300 mb-4">
                  Log in directly with any pre-seeded profile or register a new student account to experience the full workflow.
                </p>
                <div className="flex gap-3">
                  <Link
                    to="/login"
                    className="flex-1 py-2.5 text-center text-xs font-semibold bg-blue-600 hover:bg-blue-500 rounded-xl text-white transition-colors"
                  >
                    Log In Now
                  </Link>
                  <Link
                    to="/register"
                    className="flex-1 py-2.5 text-center text-xs font-semibold bg-white/20 hover:bg-white/30 rounded-xl text-white transition-colors"
                  >
                    Register Student
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-gray-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2 font-semibold text-gray-700">
            <GraduationCap className="w-4 h-4 text-blue-600" />
            <span>EduManage – College Student Management System</span>
          </div>
          <div>
            Built with React, Express, PostgreSQL, Prisma & Tailwind CSS
          </div>
          <div>
            &copy; 2026 EduManage Academic Suite. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
