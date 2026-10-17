export type UserRole = 'admin' | 'teacher' | 'student';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  name: string;
  studentId?: number;
  studentCode?: string;
  teacherId?: number;
  teacherCode?: string;
  details?: any;
  created_at?: string;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  description?: string;
}

export interface Course {
  id: number;
  name: string;
  code: string;
  department_id: number;
  department_name?: string;
  department_code?: string;
  duration_years: number;
  total_semesters: number;
}

export interface Subject {
  id: number;
  name: string;
  code: string;
  course_id: number;
  course_name?: string;
  course_code?: string;
  semester: number;
  credits: number;
  teacher_id?: number | null;
  teacher_name?: string;
}

export interface Teacher {
  id: number;
  teacher_id: string;
  user_id: number;
  name: string;
  email: string;
  phone?: string;
  department_id: number;
  department_name?: string;
  department_code?: string;
  qualification: string;
  designation: string;
  joining_date: string;
  address?: string;
  subjects?: Subject[];
  timetable?: TimetableEntry[];
}

export interface Student {
  id: number;
  student_id: string;
  user_id: number;
  name: string;
  email: string;
  phone?: string;
  dob: string;
  gender: string;
  address?: string;
  department_id: number;
  department_name?: string;
  course_id: number;
  course_name?: string;
  course_code?: string;
  semester: number;
  admission_date: string;
  profile_image?: string;
  guardian_name?: string;
  guardian_phone?: string;
  status: string;
  attendanceSummary?: {
    totalClasses: number;
    presentClasses: number;
    absentClasses: number;
    percentage: number;
  };
  marks?: MarksRecord[];
  fees?: FeeRecord[];
}

export interface AttendanceRecord {
  id: number;
  student_id: number;
  student_name?: string;
  student_code?: string;
  subject_id: number;
  subject_name?: string;
  subject_code?: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late';
  remarks?: string;
}

export interface SubjectAttendanceSummary {
  subjectId: number;
  subjectName: string;
  subjectCode: string;
  totalClasses: number;
  presentClasses: number;
  absentClasses: number;
  percentage: number;
}

export interface Exam {
  id: number;
  name: string;
  subject_id: number;
  subject_name?: string;
  subject_code?: string;
  course_id: number;
  course_name?: string;
  semester: number;
  exam_date: string;
  start_time: string;
  end_time: string;
  room: string;
  max_marks: number;
  passing_marks: number;
}

export interface MarksRecord {
  id: number;
  student_id: number;
  student_name?: string;
  student_code?: string;
  exam_id: number;
  exam_name?: string;
  exam_date?: string;
  subject_id: number;
  subject_name?: string;
  subject_code?: string;
  semester?: number;
  credits?: number;
  marks_obtained: number;
  max_marks: number;
  grade: string;
  remarks?: string;
  created_at?: string;
}

export interface FeeRecord {
  id: number;
  student_id: number;
  student_name?: string;
  student_code?: string;
  course_name?: string;
  department_name?: string;
  academic_year: string;
  semester: number;
  total_fee: number;
  paid_amount: number;
  remaining_amount: number;
  due_date: string;
  payment_status: 'Paid' | 'Partially Paid' | 'Pending';
  payment_date?: string;
  receipt_no?: string;
  payment_method?: string;
}

export interface TimetableEntry {
  id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  subject_id: number;
  subject_name?: string;
  subject_code?: string;
  teacher_id?: number | null;
  teacher_name?: string;
  room: string;
  course_id: number;
  course_name?: string;
  semester: number;
}

export interface Announcement {
  id: number;
  title: string;
  description: string;
  priority: 'Normal' | 'Important' | 'Urgent';
  target_audience: 'All' | 'Students' | 'Teachers';
  published_date: string;
  author_name: string;
  author_role: string;
  is_active: boolean;
}

export interface AdminStats {
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  totalSubjects: number;
  totalAttendance: number;
  pendingFeesCount: number;
  pendingFeesAmount: number;
  upcomingExamsCount: number;
  recentAnnouncements: Announcement[];
}

export interface TeacherStats {
  assignedStudentsCount: number;
  todayClassesCount: number;
  todayClasses: TimetableEntry[];
  pendingAttendanceCount: number;
  upcomingExams: Exam[];
  recentAnnouncements: Announcement[];
}

export interface StudentStats {
  attendance: {
    totalClasses: number;
    presentClasses: number;
    absentClasses: number;
    percentage: number;
  };
  upcomingExams: Exam[];
  recentMarks: MarksRecord[];
  feeRecord: FeeRecord | null;
  todayClasses: TimetableEntry[];
  latestAnnouncements: Announcement[];
}
