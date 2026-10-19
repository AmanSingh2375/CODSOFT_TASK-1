export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: 'student' | 'faculty' | 'admin';
  student_id: string;
  department: string;
  semester: string;
  phone?: string;
  avatar_url?: string;
  created_at?: string;
}

export interface Course {
  id: number;
  code: string;
  title: string;
  description: string;
  credits: number;
  instructor: string;
  department: string;
  semester: string;
  schedule: string;
  room: string;
  capacity: number;
  color: string;
  enrolled_count?: number;
  is_enrolled?: boolean;
  student_grade?: string | null;
  student_score?: number | null;
}

export interface EnrolledCourse {
  enrollment_id: number;
  grade: string;
  score: number;
  enrollment_status: string;
  course_id: number;
  code: string;
  title: string;
  credits: number;
  instructor: string;
  schedule: string;
  room: string;
  color: string;
}

export interface Assignment {
  id: number;
  title: string;
  description: string;
  due_date: string;
  total_points: number;
  weight_percent?: number;
  course_id?: number;
  course_code: string;
  course_title: string;
  course_color: string;
  submission_id?: number | null;
  file_name?: string | null;
  content_text?: string | null;
  submitted_at?: string | null;
  grade?: number | null;
  feedback?: string | null;
  submission_status: 'Pending' | 'Submitted' | 'Graded';
}

export interface AttendanceRecord {
  id: number;
  date: string;
  status: 'Present' | 'Absent' | 'Late' | 'Excused';
  notes: string;
  course_code: string;
  course_title: string;
  course_color: string;
}

export interface AttendanceSummaryItem {
  course_id: number;
  course_code: string;
  course_title: string;
  total_classes: number;
  present_count: number;
  late_count: number;
  absent_count: number;
  percentage: number;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  author: string;
  category: string;
  priority: 'Urgent' | 'High' | 'Normal';
  created_at: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  created_at: string;
}

export interface DashboardData {
  stats: {
    gpa: string;
    totalCredits: number;
    enrolledCount: number;
    attendanceRate: number;
    assignmentsPending: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
  };
  enrolledCourses: EnrolledCourse[];
  upcomingAssignments: Assignment[];
  recentAnnouncements: Announcement[];
  notifications: NotificationItem[];
}

export interface SystemStatus {
  status: string;
  database: {
    engine: string;
    mode: 'persistent' | 'in-memory';
    status: string;
    windowsCompatible: boolean;
    dataDir: string;
    tables: {
      users: number;
      courses: number;
      enrollments: number;
      assignments: number;
      announcements: number;
    };
  };
  environment: {
    nodeVersion: string;
    platform: string;
    uptimeSeconds: number;
    timestamp: string;
  };
}
