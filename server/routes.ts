import { Router, Response } from 'express';
import { getDatabase, getDatabaseMode } from './db.js';
import {
  hashPassword,
  comparePassword,
  generateToken,
  authenticateToken,
  AuthRequest,
} from './auth.js';

const router = Router();

// GPA Scale Converter
function calculateGradePoints(grade: string | null): number {
  if (!grade) return 3.5;
  const normalized = grade.trim().toUpperCase();
  switch (normalized) {
    case 'A+':
    case 'A': return 4.0;
    case 'A-': return 3.7;
    case 'B+': return 3.3;
    case 'B': return 3.0;
    case 'B-': return 2.7;
    case 'C+': return 2.3;
    case 'C': return 2.0;
    case 'C-': return 1.7;
    case 'D': return 1.0;
    default: return 0.0;
  }
}

// ==========================================
// 1. AUTHENTICATION ROUTES
// ==========================================

// Register Student
router.post('/auth/register', async (req, res) => {
  try {
    const db = getDatabase();
    const { username, email, password, full_name, student_id, department, semester } = req.body;

    if (!username || !email || !password || !full_name) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: username, email, password, and full_name are required.',
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long.',
      });
      return;
    }

    // Check for existing user
    const existing = await db.query(
      'SELECT id, username, email, student_id FROM users WHERE LOWER(email) = LOWER($1) OR LOWER(username) = LOWER($2) OR (student_id = $3 AND $3 IS NOT NULL)',
      [email.trim(), username.trim(), student_id ? student_id.trim() : null]
    );

    if (existing.rows.length > 0) {
      const match = existing.rows[0] as any;
      if (match.email.toLowerCase() === email.trim().toLowerCase()) {
        res.status(409).json({ success: false, error: 'A student with this email already exists.' });
        return;
      }
      if (match.username.toLowerCase() === username.trim().toLowerCase()) {
        res.status(409).json({ success: false, error: 'This username is already taken. Please choose another.' });
        return;
      }
      if (student_id && match.student_id === student_id.trim()) {
        res.status(409).json({ success: false, error: 'A student with this Student ID already exists.' });
        return;
      }
    }

    const genStudentId = student_id?.trim() || `STU-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const hashedPassword = hashPassword(password);
    const assignedDept = department?.trim() || 'Computer Science & Engineering';
    const assignedSemester = semester?.trim() || 'Semester 1';
    const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(full_name)}`;

    const insertRes = await db.query(`
      INSERT INTO users (username, email, password_hash, full_name, role, student_id, department, semester, avatar_url)
      VALUES ($1, $2, $3, $4, 'student', $5, $6, $7, $8)
      RETURNING id, username, email, full_name, role, student_id, department, semester, avatar_url, created_at
    `, [
      username.trim(),
      email.trim(),
      hashedPassword,
      full_name.trim(),
      genStudentId,
      assignedDept,
      assignedSemester,
      defaultAvatar
    ]);

    const newUser = insertRes.rows[0] as any;

    // Automatically enroll new student in introductory courses for quick start
    try {
      const introCourses = await db.query("SELECT id FROM courses LIMIT 3");
      for (const c of introCourses.rows as any[]) {
        const enrollRes = await db.query(
          "INSERT INTO enrollments (user_id, course_id, grade, score, status) VALUES ($1, $2, 'A', 90.0, 'Enrolled') RETURNING id",
          [newUser.id, c.id]
        );
        const enrollmentId = (enrollRes.rows[0] as any)?.id;
        if (enrollmentId) {
          await db.query(
            "INSERT INTO attendance (enrollment_id, user_id, course_id, date, status, notes) VALUES ($1, $2, $3, CURRENT_DATE, 'Present', 'Enrolled')",
            [enrollmentId, newUser.id, c.id]
          );
        }
      }
    } catch (enrollErr) {
      console.warn('Auto-enroll error on registration (non-fatal):', enrollErr);
    }

    // Add welcome notification
    await db.query(`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES ($1, 'Welcome to EduManage!', 'Your student portal is ready. Check your enrolled courses and upcoming deadlines.', 'success')
    `, [newUser.id]);

    const token = generateToken({
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      full_name: newUser.full_name,
      student_id: newUser.student_id,
      department: newUser.department,
    });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: newUser,
    });
  } catch (err: any) {
    console.error('Registration API Error:', err);
    res.status(500).json({ success: false, error: err?.message || 'Server error during registration.' });
  }
});

// Login User
router.post('/auth/login', async (req, res) => {
  try {
    const db = getDatabase();
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      res.status(400).json({
        success: false,
        error: 'Please provide both your email/username/Student ID and password.',
      });
      return;
    }

    const cleanIdentifier = identifier.trim().toLowerCase();

    // Query user by email, username, or student_id
    const userRes = await db.query(`
      SELECT id, username, email, password_hash, full_name, role, student_id, department, semester, phone, avatar_url, created_at
      FROM users
      WHERE LOWER(email) = $1 OR LOWER(username) = $1 OR LOWER(student_id) = $1
      LIMIT 1
    `, [cleanIdentifier]);

    if (userRes.rows.length === 0) {
      res.status(401).json({
        success: false,
        error: 'No account found with this email, username, or Student ID.',
      });
      return;
    }

    const user = userRes.rows[0] as any;
    const isPasswordValid = comparePassword(password, user.password_hash);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: 'Incorrect password. Please verify your credentials and try again.',
      });
      return;
    }

    // Strip password_hash before returning
    const { password_hash, ...safeUser } = user;

    const token = generateToken({
      id: safeUser.id,
      username: safeUser.username,
      email: safeUser.email,
      role: safeUser.role,
      full_name: safeUser.full_name,
      student_id: safeUser.student_id,
      department: safeUser.department,
    });

    res.json({
      success: true,
      message: 'Signed in successfully.',
      token,
      user: safeUser,
    });
  } catch (err: any) {
    console.error('Login API Error:', err);
    res.status(500).json({ success: false, error: err?.message || 'Server error during sign in.' });
  }
});

// Get Current User Profile (Auth check)
router.get('/auth/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const userId = req.user!.id;

    const userRes = await db.query(`
      SELECT id, username, email, full_name, role, student_id, department, semester, phone, avatar_url, created_at
      FROM users
      WHERE id = $1
    `, [userId]);

    if (userRes.rows.length === 0) {
      res.status(404).json({ success: false, error: 'User not found.' });
      return;
    }

    res.json({
      success: true,
      user: userRes.rows[0],
    });
  } catch (err: any) {
    console.error('Auth/Me API Error:', err);
    res.status(500).json({ success: false, error: err?.message || 'Failed to fetch user profile.' });
  }
});

// ==========================================
// 2. DASHBOARD DATA
// ==========================================

router.get('/dashboard/stats', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const userId = req.user!.id;

    // Enrolled courses with details
    const enrolledRes = await db.query(`
      SELECT 
        e.id as enrollment_id,
        e.grade,
        e.score,
        e.status as enrollment_status,
        c.id as course_id,
        c.code,
        c.title,
        c.credits,
        c.instructor,
        c.schedule,
        c.room,
        c.color
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE e.user_id = $1
      ORDER BY c.code ASC
    `, [userId]);

    const enrolledCourses = enrolledRes.rows as any[];
    const totalEnrolled = enrolledCourses.length;

    // Calculate total credits & GPA
    let totalCredits = 0;
    let totalQualityPoints = 0;
    for (const c of enrolledCourses) {
      const cr = Number(c.credits) || 3;
      totalCredits += cr;
      const pts = calculateGradePoints(c.grade);
      totalQualityPoints += pts * cr;
    }
    const currentGPA = totalCredits > 0 ? (totalQualityPoints / totalCredits).toFixed(2) : '3.80';

    // Attendance stats
    const attendanceRes = await db.query(`
      SELECT 
        status, 
        COUNT(*) as count
      FROM attendance
      WHERE user_id = $1
      GROUP BY status
    `, [userId]);

    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;
    let totalAttendanceRecords = 0;

    for (const row of attendanceRes.rows as any[]) {
      const count = parseInt(row.count, 10);
      totalAttendanceRecords += count;
      if (row.status === 'Present') presentCount += count;
      else if (row.status === 'Late') lateCount += count;
      else if (row.status === 'Absent') absentCount += count;
    }

    const attendanceRate = totalAttendanceRecords > 0
      ? Math.round(((presentCount + (lateCount * 0.75)) / totalAttendanceRecords) * 100)
      : 94;

    // Upcoming assignments
    const assignmentsRes = await db.query(`
      SELECT 
        a.id,
        a.title,
        a.description,
        a.due_date,
        a.total_points,
        c.code as course_code,
        c.title as course_title,
        c.color as course_color,
        s.status as submission_status,
        s.grade as submission_grade
      FROM assignments a
      JOIN courses c ON a.course_id = c.id
      JOIN enrollments e ON e.course_id = c.id AND e.user_id = $1
      LEFT JOIN submissions s ON s.assignment_id = a.id AND s.student_id = $1
      ORDER BY a.due_date ASC
      LIMIT 6
    `, [userId]);

    // Recent announcements
    const announcementsRes = await db.query(`
      SELECT id, title, content, author, category, priority, created_at
      FROM announcements
      ORDER BY created_at DESC
      LIMIT 4
    `);

    // Notifications
    const notificationsRes = await db.query(`
      SELECT id, title, message, type, is_read, created_at
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 5
    `, [userId]);

    res.json({
      success: true,
      data: {
        stats: {
          gpa: currentGPA,
          totalCredits,
          enrolledCount: totalEnrolled,
          attendanceRate,
          assignmentsPending: assignmentsRes.rows.filter((a: any) => !a.submission_status || a.submission_status === 'Pending').length,
          presentCount,
          absentCount,
          lateCount,
        },
        enrolledCourses,
        upcomingAssignments: assignmentsRes.rows,
        recentAnnouncements: announcementsRes.rows,
        notifications: notificationsRes.rows,
      },
    });
  } catch (err: any) {
    console.error('Dashboard Stats API Error:', err);
    res.status(500).json({ success: false, error: err?.message || 'Failed to fetch dashboard data.' });
  }
});

// ==========================================
// 3. COURSES & ENROLLMENT
// ==========================================

// Get all courses with enrollment status for logged in student
router.get('/courses', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const userId = req.user!.id;

    const coursesRes = await db.query(`
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) as enrolled_count,
        EXISTS(SELECT 1 FROM enrollments e WHERE e.course_id = c.id AND e.user_id = $1) as is_enrolled,
        (SELECT e.grade FROM enrollments e WHERE e.course_id = c.id AND e.user_id = $1) as student_grade,
        (SELECT e.score FROM enrollments e WHERE e.course_id = c.id AND e.user_id = $1) as student_score
      FROM courses c
      ORDER BY c.code ASC
    `, [userId]);

    res.json({
      success: true,
      courses: coursesRes.rows,
    });
  } catch (err: any) {
    console.error('Courses API Error:', err);
    res.status(500).json({ success: false, error: err?.message || 'Failed to fetch courses.' });
  }
});

// Enroll in course
router.post('/courses/enroll', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const userId = req.user!.id;
    const { course_id } = req.body;

    if (!course_id) {
      res.status(400).json({ success: false, error: 'Course ID is required.' });
      return;
    }

    // Verify course exists
    const courseRes = await db.query('SELECT * FROM courses WHERE id = $1', [course_id]);
    if (courseRes.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Course not found.' });
      return;
    }

    // Check if already enrolled
    const checkRes = await db.query(
      'SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2',
      [userId, course_id]
    );

    if (checkRes.rows.length > 0) {
      res.status(400).json({ success: false, error: 'You are already enrolled in this course.' });
      return;
    }

    // Insert enrollment
    const enrollRes = await db.query(`
      INSERT INTO enrollments (user_id, course_id, grade, score, status)
      VALUES ($1, $2, 'A', 90.0, 'Enrolled')
      RETURNING id
    `, [userId, course_id]);

    const enrollmentId = (enrollRes.rows[0] as any).id;

    // Add initial attendance record
    await db.query(`
      INSERT INTO attendance (enrollment_id, user_id, course_id, date, status, notes)
      VALUES ($1, $2, $3, CURRENT_DATE, 'Present', 'Course registration confirmed')
    `, [enrollmentId, userId, course_id]);

    // Add notification
    const course = courseRes.rows[0] as any;
    await db.query(`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES ($1, 'Course Enrollment Confirmed', 'You have successfully enrolled in ${course.code} - ${course.title}.', 'success')
    `, [userId]);

    res.json({
      success: true,
      message: `Enrolled successfully in ${course.code}!`,
      enrollment_id: enrollmentId,
    });
  } catch (err: any) {
    console.error('Enroll API Error:', err);
    res.status(500).json({ success: false, error: err?.message || 'Failed to enroll in course.' });
  }
});

// Drop course
router.post('/courses/drop', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const userId = req.user!.id;
    const { course_id } = req.body;

    if (!course_id) {
      res.status(400).json({ success: false, error: 'Course ID is required.' });
      return;
    }

    await db.query('DELETE FROM enrollments WHERE user_id = $1 AND course_id = $2', [userId, course_id]);
    await db.query('DELETE FROM attendance WHERE user_id = $1 AND course_id = $2', [userId, course_id]);

    res.json({
      success: true,
      message: 'Course dropped successfully.',
    });
  } catch (err: any) {
    console.error('Drop Course API Error:', err);
    res.status(500).json({ success: false, error: err?.message || 'Failed to drop course.' });
  }
});

// ==========================================
// 4. ASSIGNMENTS & SUBMISSIONS
// ==========================================

router.get('/assignments', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const userId = req.user!.id;

    const assignmentsRes = await db.query(`
      SELECT 
        a.id,
        a.title,
        a.description,
        a.due_date,
        a.total_points,
        a.weight_percent,
        c.id as course_id,
        c.code as course_code,
        c.title as course_title,
        c.color as course_color,
        s.id as submission_id,
        s.file_name,
        s.content_text,
        s.submitted_at,
        s.grade,
        s.feedback,
        COALESCE(s.status, 'Pending') as submission_status
      FROM assignments a
      JOIN courses c ON a.course_id = c.id
      JOIN enrollments e ON e.course_id = c.id AND e.user_id = $1
      LEFT JOIN submissions s ON s.assignment_id = a.id AND s.student_id = $1
      ORDER BY a.due_date ASC
    `, [userId]);

    res.json({
      success: true,
      assignments: assignmentsRes.rows,
    });
  } catch (err: any) {
    console.error('Assignments API Error:', err);
    res.status(500).json({ success: false, error: err?.message || 'Failed to fetch assignments.' });
  }
});

router.post('/assignments/submit', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const userId = req.user!.id;
    const { assignment_id, file_name, content_text } = req.body;

    if (!assignment_id) {
      res.status(400).json({ success: false, error: 'Assignment ID is required.' });
      return;
    }

    // Check if submission already exists
    const existing = await db.query(
      'SELECT id FROM submissions WHERE assignment_id = $1 AND student_id = $2',
      [assignment_id, userId]
    );

    if (existing.rows.length > 0) {
      // Update submission
      await db.query(`
        UPDATE submissions 
        SET file_name = $1, content_text = $2, submitted_at = CURRENT_TIMESTAMP, status = 'Submitted'
        WHERE assignment_id = $3 AND student_id = $4
      `, [file_name || 'submission_file.pdf', content_text || '', assignment_id, userId]);
    } else {
      // Insert new submission
      await db.query(`
        INSERT INTO submissions (assignment_id, student_id, file_name, content_text, status)
        VALUES ($1, $2, $3, $4, 'Submitted')
      `, [assignment_id, userId, file_name || 'assignment_submission.pdf', content_text || '']);
    }

    // Notification
    await db.query(`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES ($1, 'Assignment Submitted', 'Your assignment submission has been received and logged.', 'info')
    `, [userId]);

    res.json({
      success: true,
      message: 'Assignment submitted successfully!',
    });
  } catch (err: any) {
    console.error('Submit Assignment API Error:', err);
    res.status(500).json({ success: false, error: err?.message || 'Failed to submit assignment.' });
  }
});

// ==========================================
// 5. ATTENDANCE
// ==========================================

router.get('/attendance', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const userId = req.user!.id;

    const logsRes = await db.query(`
      SELECT 
        att.id,
        att.date,
        att.status,
        att.notes,
        c.code as course_code,
        c.title as course_title,
        c.color as course_color
      FROM attendance att
      JOIN courses c ON att.course_id = c.id
      WHERE att.user_id = $1
      ORDER BY att.date DESC
    `, [userId]);

    // Subject breakdown
    const summaryRes = await db.query(`
      SELECT 
        c.id as course_id,
        c.code as course_code,
        c.title as course_title,
        COUNT(*) as total_classes,
        SUM(CASE WHEN att.status = 'Present' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN att.status = 'Late' THEN 1 ELSE 0 END) as late_count,
        SUM(CASE WHEN att.status = 'Absent' THEN 1 ELSE 0 END) as absent_count
      FROM attendance att
      JOIN courses c ON att.course_id = c.id
      WHERE att.user_id = $1
      GROUP BY c.id, c.code, c.title
      ORDER BY c.code ASC
    `, [userId]);

    res.json({
      success: true,
      logs: logsRes.rows,
      summary: summaryRes.rows.map((row: any) => {
        const total = parseInt(row.total_classes, 10);
        const present = parseInt(row.present_count, 10);
        const late = parseInt(row.late_count, 10);
        const percentage = total > 0 ? Math.round(((present + (late * 0.75)) / total) * 100) : 100;
        return {
          ...row,
          percentage,
        };
      }),
    });
  } catch (err: any) {
    console.error('Attendance API Error:', err);
    res.status(500).json({ success: false, error: err?.message || 'Failed to fetch attendance.' });
  }
});

// ==========================================
// 6. ANNOUNCEMENTS & NOTIFICATIONS
// ==========================================

router.get('/announcements', async (req, res) => {
  try {
    const db = getDatabase();
    const announcementsRes = await db.query(`
      SELECT * FROM announcements ORDER BY created_at DESC
    `);
    res.json({
      success: true,
      announcements: announcementsRes.rows,
    });
  } catch (err: any) {
    console.error('Announcements API Error:', err);
    res.status(500).json({ success: false, error: err?.message || 'Failed to fetch announcements.' });
  }
});

router.get('/notifications', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const userId = req.user!.id;
    const notifs = await db.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20',
      [userId]
    );
    res.json({ success: true, notifications: notifs.rows });
  } catch (err: any) {
    console.error('Notifications API Error:', err);
    res.status(500).json({ success: false, error: err?.message || 'Failed to fetch notifications.' });
  }
});

router.post('/notifications/mark-read', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const userId = req.user!.id;
    await db.query('UPDATE notifications SET is_read = TRUE WHERE user_id = $1', [userId]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to update notifications.' });
  }
});

// ==========================================
// 7. PROFILE & SETTINGS
// ==========================================

router.put('/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDatabase();
    const userId = req.user!.id;
    const { full_name, phone, department, semester, avatar_url } = req.body;

    const updateRes = await db.query(`
      UPDATE users
      SET 
        full_name = COALESCE($1, full_name),
        phone = COALESCE($2, phone),
        department = COALESCE($3, department),
        semester = COALESCE($4, semester),
        avatar_url = COALESCE($5, avatar_url)
      WHERE id = $6
      RETURNING id, username, email, full_name, role, student_id, department, semester, phone, avatar_url
    `, [full_name, phone, department, semester, avatar_url, userId]);

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: updateRes.rows[0],
    });
  } catch (err: any) {
    console.error('Update Profile API Error:', err);
    res.status(500).json({ success: false, error: err?.message || 'Failed to update profile.' });
  }
});

// ==========================================
// 8. SYSTEM STATUS & PGLITE DIAGNOSTICS
// ==========================================

router.get('/system/status', async (req, res) => {
  try {
    const db = getDatabase();
    const dbMode = getDatabaseMode();

    const [usersCount, coursesCount, enrollmentsCount, assignmentsCount, announcementsCount] = await Promise.all([
      db.query('SELECT count(*) as count FROM users'),
      db.query('SELECT count(*) as count FROM courses'),
      db.query('SELECT count(*) as count FROM enrollments'),
      db.query('SELECT count(*) as count FROM assignments'),
      db.query('SELECT count(*) as count FROM announcements'),
    ]);

    res.json({
      success: true,
      status: 'healthy',
      database: {
        engine: 'PGlite (PostgreSQL WebAssembly)',
        mode: dbMode,
        status: 'Connected & Operational',
        windowsCompatible: true,
        dataDir: process.env.PGLITE_DATA_DIR || './data/pglite',
        tables: {
          users: parseInt((usersCount.rows[0] as any)?.count || '0', 10),
          courses: parseInt((coursesCount.rows[0] as any)?.count || '0', 10),
          enrollments: parseInt((enrollmentsCount.rows[0] as any)?.count || '0', 10),
          assignments: parseInt((assignmentsCount.rows[0] as any)?.count || '0', 10),
          announcements: parseInt((announcementsCount.rows[0] as any)?.count || '0', 10),
        },
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      status: 'error',
      error: err?.message || 'Database status check failed',
    });
  }
});

export default router;
