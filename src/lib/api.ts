import {
  User,
  Course,
  DashboardData,
  Assignment,
  AttendanceRecord,
  AttendanceSummaryItem,
  Announcement,
  NotificationItem,
  SystemStatus,
} from '../types';

const TOKEN_KEY = 'edumanage_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({
    success: false,
    error: `HTTP ${response.status}: Failed to parse server response.`,
  }));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  // Authentication
  async login(identifier: string, password: string): Promise<{ token: string; user: User }> {
    const res = await request<{ success: boolean; token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    setStoredToken(res.token);
    return res;
  },

  async register(data: {
    username: string;
    email: string;
    password: string;
    full_name: string;
    student_id?: string;
    department?: string;
    semester?: string;
  }): Promise<{ token: string; user: User }> {
    const res = await request<{ success: boolean; token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setStoredToken(res.token);
    return res;
  },

  async getMe(): Promise<User> {
    const res = await request<{ success: boolean; user: User }>('/api/auth/me');
    return res.user;
  },

  logout(): void {
    removeStoredToken();
  },

  // Dashboard
  async getDashboardData(): Promise<DashboardData> {
    const res = await request<{ success: boolean; data: DashboardData }>('/api/dashboard/stats');
    return res.data;
  },

  // Courses
  async getCourses(): Promise<Course[]> {
    const res = await request<{ success: boolean; courses: Course[] }>('/api/courses');
    return res.courses;
  },

  async enrollCourse(course_id: number): Promise<{ message: string }> {
    return request<{ success: boolean; message: string }>('/api/courses/enroll', {
      method: 'POST',
      body: JSON.stringify({ course_id }),
    });
  },

  async dropCourse(course_id: number): Promise<{ message: string }> {
    return request<{ success: boolean; message: string }>('/api/courses/drop', {
      method: 'POST',
      body: JSON.stringify({ course_id }),
    });
  },

  // Assignments
  async getAssignments(): Promise<Assignment[]> {
    const res = await request<{ success: boolean; assignments: Assignment[] }>('/api/assignments');
    return res.assignments;
  },

  async submitAssignment(
    assignment_id: number,
    file_name: string,
    content_text: string
  ): Promise<{ message: string }> {
    return request<{ success: boolean; message: string }>('/api/assignments/submit', {
      method: 'POST',
      body: JSON.stringify({ assignment_id, file_name, content_text }),
    });
  },

  // Attendance
  async getAttendance(): Promise<{ logs: AttendanceRecord[]; summary: AttendanceSummaryItem[] }> {
    const res = await request<{
      success: boolean;
      logs: AttendanceRecord[];
      summary: AttendanceSummaryItem[];
    }>('/api/attendance');
    return { logs: res.logs, summary: res.summary };
  },

  // Announcements
  async getAnnouncements(): Promise<Announcement[]> {
    const res = await request<{ success: boolean; announcements: Announcement[] }>(
      '/api/announcements'
    );
    return res.announcements;
  },

  // Notifications
  async getNotifications(): Promise<NotificationItem[]> {
    const res = await request<{ success: boolean; notifications: NotificationItem[] }>(
      '/api/notifications'
    );
    return res.notifications;
  },

  async markNotificationsRead(): Promise<void> {
    await request('/api/notifications/mark-read', { method: 'POST' });
  },

  // Profile
  async updateProfile(data: Partial<User>): Promise<User> {
    const res = await request<{ success: boolean; user: User }>('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.user;
  },

  // System Diagnostics
  async getSystemStatus(): Promise<SystemStatus> {
    const res = await request<{ success: boolean } & SystemStatus>('/api/system/status');
    return res;
  },
};
