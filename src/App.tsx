import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.tsx';
import { AppLayout } from './components/layout/AppLayout.tsx';

// Public pages
import { LandingPage } from './pages/LandingPage.tsx';
import { LoginPage } from './pages/auth/LoginPage.tsx';
import { RegisterPage } from './pages/auth/RegisterPage.tsx';

// Admin pages
import { AdminDashboard } from './pages/admin/AdminDashboard.tsx';
import { AdminStudents } from './pages/admin/AdminStudents.tsx';
import { AdminTeachers } from './pages/admin/AdminTeachers.tsx';
import { AdminAttendance } from './pages/admin/AdminAttendance.tsx';
import { AdminExams } from './pages/admin/AdminExams.tsx';
import { AdminMarks } from './pages/admin/AdminMarks.tsx';
import { AdminFees } from './pages/admin/AdminFees.tsx';
import { AdminTimetable } from './pages/admin/AdminTimetable.tsx';
import { AdminAnnouncements } from './pages/admin/AdminAnnouncements.tsx';

// Teacher pages
import { TeacherDashboard } from './pages/teacher/TeacherDashboard.tsx';
import { TeacherStudents } from './pages/teacher/TeacherStudents.tsx';
import { TeacherAttendance } from './pages/teacher/TeacherAttendance.tsx';
import { TeacherMarks } from './pages/teacher/TeacherMarks.tsx';
import { TeacherTimetable } from './pages/teacher/TeacherTimetable.tsx';
import { TeacherAnnouncements } from './pages/teacher/TeacherAnnouncements.tsx';

// Student pages
import { StudentDashboard } from './pages/student/StudentDashboard.tsx';
import { StudentProfile } from './pages/student/StudentProfile.tsx';
import { StudentAttendance } from './pages/student/StudentAttendance.tsx';
import { StudentResults } from './pages/student/StudentResults.tsx';
import { StudentFees } from './pages/student/StudentFees.tsx';
import { StudentTimetable } from './pages/student/StudentTimetable.tsx';
import { StudentAnnouncements } from './pages/student/StudentAnnouncements.tsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Admin Protected Routes */}
          <Route element={<AppLayout allowedRoles={['admin']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/students" element={<AdminStudents />} />
            <Route path="/admin/teachers" element={<AdminTeachers />} />
            <Route path="/admin/attendance" element={<AdminAttendance />} />
            <Route path="/admin/exams" element={<AdminExams />} />
            <Route path="/admin/marks" element={<AdminMarks />} />
            <Route path="/admin/fees" element={<AdminFees />} />
            <Route path="/admin/timetable" element={<AdminTimetable />} />
            <Route path="/admin/announcements" element={<AdminAnnouncements />} />
          </Route>

          {/* Teacher Protected Routes */}
          <Route element={<AppLayout allowedRoles={['teacher']} />}>
            <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
            <Route path="/teacher/students" element={<TeacherStudents />} />
            <Route path="/teacher/attendance" element={<TeacherAttendance />} />
            <Route path="/teacher/marks" element={<TeacherMarks />} />
            <Route path="/teacher/timetable" element={<TeacherTimetable />} />
            <Route path="/teacher/announcements" element={<TeacherAnnouncements />} />
          </Route>

          {/* Student Protected Routes */}
          <Route element={<AppLayout allowedRoles={['student']} />}>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/profile" element={<StudentProfile />} />
            <Route path="/student/attendance" element={<StudentAttendance />} />
            <Route path="/student/results" element={<StudentResults />} />
            <Route path="/student/fees" element={<StudentFees />} />
            <Route path="/student/timetable" element={<StudentTimetable />} />
            <Route path="/student/announcements" element={<StudentAnnouncements />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
