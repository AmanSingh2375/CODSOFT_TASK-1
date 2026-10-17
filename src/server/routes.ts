import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query, queryOne } from './db.ts';
import { authenticateToken, requireRole, generateToken, AuthRequest, UserPayload } from './auth.ts';

export const apiRouter = Router();

// ==========================================
// 1. AUTHENTICATION ROUTES
// ==========================================

// POST /api/auth/login
apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const user = await queryOne('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    let studentInfo: any = null;
    let teacherInfo: any = null;

    if (user.role === 'student') {
      studentInfo = await queryOne('SELECT * FROM students WHERE user_id = $1', [user.id]);
    } else if (user.role === 'teacher') {
      teacherInfo = await queryOne('SELECT * FROM teachers WHERE user_id = $1', [user.id]);
    }

    const payload: UserPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      studentId: studentInfo ? studentInfo.id : undefined,
      studentCode: studentInfo ? studentInfo.student_id : undefined,
      teacherId: teacherInfo ? teacherInfo.id : undefined,
      teacherCode: teacherInfo ? teacherInfo.teacher_id : undefined
    };

    const token = generateToken(payload);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        studentId: studentInfo ? studentInfo.id : undefined,
        studentCode: studentInfo ? studentInfo.student_id : undefined,
        teacherId: teacherInfo ? teacherInfo.id : undefined,
        teacherCode: teacherInfo ? teacherInfo.teacher_id : undefined,
        details: studentInfo || teacherInfo || null
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login: ' + error.message });
  }
});

// POST /api/auth/register (Student self-registration)
apiRouter.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const {
      name, email, password, phone, dob, gender,
      departmentId, courseId, semester = 1, address,
      guardianName, guardianPhone
    } = req.body;

    if (!name || !email || !password || !dob || !gender || !departmentId || !courseId) {
      res.status(400).json({ error: 'Please provide all required fields.' });
      return;
    }

    const existing = await queryOne('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (existing) {
      res.status(400).json({ error: 'An account with this email already exists.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await queryOne(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, 'student') RETURNING id`,
      [name, email.trim(), hashedPassword]
    );

    // Generate unique student ID (e.g. STU2026XXX)
    const countRow = await queryOne('SELECT COUNT(*) as count FROM students');
    const nextNum = parseInt(countRow?.count || '0', 10) + 1;
    const studentCode = `STU2026${String(nextNum).padStart(3, '0')}`;
    const today = new Date().toISOString().split('T')[0];
    const profileImg = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;

    const student = await queryOne(
      `INSERT INTO students (
        student_id, user_id, name, email, phone, dob, gender, address,
        department_id, course_id, semester, admission_date, profile_image,
        guardian_name, guardian_phone, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'Active')
      RETURNING *`,
      [
        studentCode, user.id, name, email.trim(), phone || '', dob, gender, address || 'Hostel Campus',
        Number(departmentId), Number(courseId), Number(semester), today, profileImg,
        guardianName || 'Guardian', guardianPhone || phone || ''
      ]
    );

    // Create default semester fee record
    const course = await queryOne('SELECT name FROM courses WHERE id = $1', [courseId]);
    const feeAmount = 45000;
    await query(
      `INSERT INTO fees (student_id, academic_year, semester, total_fee, paid_amount, remaining_amount, due_date, payment_status)
       VALUES ($1, '2025-2026', $2, $3, 0, $3, '2026-05-30', 'Pending')`,
      [student.id, Number(semester), feeAmount]
    );

    const payload: UserPayload = {
      id: user.id,
      email: email.trim(),
      role: 'student',
      name,
      studentId: student.id,
      studentCode
    };

    const token = generateToken(payload);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        email: email.trim(),
        role: 'student',
        name,
        studentId: student.id,
        studentCode,
        details: student
      }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration: ' + error.message });
  }
});

// GET /api/auth/me
apiRouter.get('/auth/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await queryOne('SELECT id, email, role, name, created_at FROM users WHERE id = $1', [req.user!.id]);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    let details: any = null;
    if (user.role === 'student') {
      details = await queryOne(
        `SELECT s.*, d.name as department_name, c.name as course_name
         FROM students s
         LEFT JOIN departments d ON s.department_id = d.id
         LEFT JOIN courses c ON s.course_id = c.id
         WHERE s.user_id = $1`,
        [user.id]
      );
    } else if (user.role === 'teacher') {
      details = await queryOne(
        `SELECT t.*, d.name as department_name
         FROM teachers t
         LEFT JOIN departments d ON t.department_id = d.id
         WHERE t.user_id = $1`,
        [user.id]
      );
    }

    res.json({
      user: {
        ...user,
        studentId: details?.student_id,
        teacherId: details?.teacher_id,
        details
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 2. METADATA: DEPARTMENTS, COURSES, SUBJECTS
// ==========================================

apiRouter.get('/departments', async (req: Request, res: Response) => {
  try {
    const rows = await query('SELECT * FROM departments ORDER BY name ASC');
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/courses', async (req: Request, res: Response) => {
  try {
    const rows = await query(`
      SELECT c.*, d.name as department_name, d.code as department_code
      FROM courses c
      LEFT JOIN departments d ON c.department_id = d.id
      ORDER BY c.name ASC
    `);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/subjects', async (req: Request, res: Response) => {
  try {
    const rows = await query(`
      SELECT s.*, c.name as course_name, c.code as course_code, t.name as teacher_name
      FROM subjects s
      LEFT JOIN courses c ON s.course_id = c.id
      LEFT JOIN teachers t ON s.teacher_id = t.id
      ORDER BY s.semester ASC, s.name ASC
    `);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. STUDENT MANAGEMENT (CRUD)
// ==========================================

// GET /api/students
apiRouter.get('/students', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { search, departmentId, courseId, semester } = req.query;

    let sql = `
      SELECT s.*, d.name as department_name, c.name as course_name, c.code as course_code
      FROM students s
      LEFT JOIN departments d ON s.department_id = d.id
      LEFT JOIN courses c ON s.course_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      params.push(`%${String(search).trim()}%`);
      sql += ` AND (LOWER(s.name) LIKE LOWER($${params.length}) OR LOWER(s.email) LIKE LOWER($${params.length}) OR LOWER(s.student_id) LIKE LOWER($${params.length}))`;
    }
    if (departmentId) {
      params.push(Number(departmentId));
      sql += ` AND s.department_id = $${params.length}`;
    }
    if (courseId) {
      params.push(Number(courseId));
      sql += ` AND s.course_id = $${params.length}`;
    }
    if (semester) {
      params.push(Number(semester));
      sql += ` AND s.semester = $${params.length}`;
    }

    sql += ' ORDER BY s.id ASC';

    const students = await query(sql, params);
    res.json(students);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/students/:id
apiRouter.get('/students/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const student = await queryOne(
      `SELECT s.*, d.name as department_name, c.name as course_name, c.code as course_code
       FROM students s
       LEFT JOIN departments d ON s.department_id = d.id
       LEFT JOIN courses c ON s.course_id = c.id
       WHERE s.id = $1 OR s.student_id = $1`,
      [req.params.id]
    );

    if (!student) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    // Get attendance summary
    const attendanceRecords = await query(
      `SELECT status, COUNT(*) as count FROM attendance WHERE student_id = $1 GROUP BY status`,
      [student.id]
    );
    const totalClasses = attendanceRecords.reduce((acc, curr) => acc + parseInt(curr.count, 10), 0);
    const presentClasses = parseInt(attendanceRecords.find(r => r.status === 'Present')?.count || '0', 10);
    const attendancePercentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;

    // Get marks
    const marks = await query(
      `SELECT m.*, e.name as exam_name, s.name as subject_name, s.code as subject_code
       FROM marks m
       JOIN exams e ON m.exam_id = e.id
       JOIN subjects s ON m.subject_id = s.id
       WHERE m.student_id = $1
       ORDER BY m.created_at DESC`,
      [student.id]
    );

    // Get fees
    const fees = await query(
      `SELECT * FROM fees WHERE student_id = $1 ORDER BY id DESC`,
      [student.id]
    );

    res.json({
      ...student,
      attendanceSummary: {
        totalClasses,
        presentClasses,
        absentClasses: totalClasses - presentClasses,
        percentage: attendancePercentage
      },
      marks,
      fees
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/students (Admin)
apiRouter.post('/students', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const {
      name, email, phone, dob, gender, address,
      departmentId, courseId, semester = 1,
      admissionDate, guardianName, guardianPhone,
      password = 'password123', status = 'Active'
    } = req.body;

    if (!name || !email || !dob || !gender || !departmentId || !courseId) {
      res.status(400).json({ error: 'Missing required student fields.' });
      return;
    }

    const existing = await queryOne('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (existing) {
      res.status(400).json({ error: 'User with this email already exists.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await queryOne(
      `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, 'student') RETURNING id`,
      [name, email.trim(), hashedPassword]
    );

    const countRow = await queryOne('SELECT COUNT(*) as count FROM students');
    const nextNum = parseInt(countRow?.count || '0', 10) + 1;
    const studentCode = `STU2024${String(nextNum).padStart(3, '0')}`;
    const today = admissionDate || new Date().toISOString().split('T')[0];
    const profileImg = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;

    const newStudent = await queryOne(
      `INSERT INTO students (
        student_id, user_id, name, email, phone, dob, gender, address,
        department_id, course_id, semester, admission_date, profile_image,
        guardian_name, guardian_phone, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        studentCode, user.id, name, email.trim(), phone, dob, gender, address,
        Number(departmentId), Number(courseId), Number(semester), today, profileImg,
        guardianName, guardianPhone, status
      ]
    );

    // Initial fee record
    await query(
      `INSERT INTO fees (student_id, academic_year, semester, total_fee, paid_amount, remaining_amount, due_date, payment_status)
       VALUES ($1, '2025-2026', $2, 45000, 0, 45000, '2026-05-15', 'Pending')`,
      [newStudent.id, Number(semester)]
    );

    res.status(201).json(newStudent);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/students/:id (Admin)
apiRouter.put('/students/:id', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name, email, phone, dob, gender, address,
      departmentId, courseId, semester,
      admissionDate, guardianName, guardianPhone, status
    } = req.body;

    const student = await queryOne('SELECT * FROM students WHERE id = $1', [id]);
    if (!student) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    const updated = await queryOne(
      `UPDATE students SET
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        phone = COALESCE($3, phone),
        dob = COALESCE($4, dob),
        gender = COALESCE($5, gender),
        address = COALESCE($6, address),
        department_id = COALESCE($7, department_id),
        course_id = COALESCE($8, course_id),
        semester = COALESCE($9, semester),
        admission_date = COALESCE($10, admission_date),
        guardian_name = COALESCE($11, guardian_name),
        guardian_phone = COALESCE($12, guardian_phone),
        status = COALESCE($13, status)
       WHERE id = $14
       RETURNING *`,
      [
        name, email, phone, dob, gender, address,
        departmentId ? Number(departmentId) : null,
        courseId ? Number(courseId) : null,
        semester ? Number(semester) : null,
        admissionDate, guardianName, guardianPhone, status, id
      ]
    );

    // Keep user table name and email synced
    if (student.user_id && (name || email)) {
      await query(
        `UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email) WHERE id = $3`,
        [name, email, student.user_id]
      );
    }

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/students/:id (Admin)
apiRouter.delete('/students/:id', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const student = await queryOne('SELECT * FROM students WHERE id = $1', [req.params.id]);
    if (!student) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    // Delete linked user (cascades to student)
    await query('DELETE FROM users WHERE id = $1', [student.user_id]);
    res.json({ message: 'Student deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. TEACHER MANAGEMENT (CRUD)
// ==========================================

// GET /api/teachers
apiRouter.get('/teachers', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { search, departmentId } = req.query;
    let sql = `
      SELECT t.*, d.name as department_name, d.code as department_code
      FROM teachers t
      LEFT JOIN departments d ON t.department_id = d.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      params.push(`%${String(search).trim()}%`);
      sql += ` AND (LOWER(t.name) LIKE LOWER($${params.length}) OR LOWER(t.email) LIKE LOWER($${params.length}) OR LOWER(t.teacher_id) LIKE LOWER($${params.length}))`;
    }
    if (departmentId) {
      params.push(Number(departmentId));
      sql += ` AND t.department_id = $${params.length}`;
    }

    sql += ' ORDER BY t.id ASC';

    const teachers = await query(sql, params);

    // Attach subjects to each teacher
    for (const tch of teachers) {
      const subjects = await query(
        `SELECT id, name, code, semester FROM subjects WHERE teacher_id = $1`,
        [tch.id]
      );
      tch.subjects = subjects;
    }

    res.json(teachers);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/teachers/:id
apiRouter.get('/teachers/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const teacher = await queryOne(
      `SELECT t.*, d.name as department_name, d.code as department_code
       FROM teachers t
       LEFT JOIN departments d ON t.department_id = d.id
       WHERE t.id = $1 OR t.teacher_id = $1`,
      [req.params.id]
    );

    if (!teacher) {
      res.status(404).json({ error: 'Teacher not found' });
      return;
    }

    const subjects = await query(
      `SELECT s.*, c.name as course_name FROM subjects s LEFT JOIN courses c ON s.course_id = c.id WHERE s.teacher_id = $1`,
      [teacher.id]
    );

    const timetable = await query(
      `SELECT tt.*, s.name as subject_name, s.code as subject_code, c.name as course_name
       FROM timetable tt
       JOIN subjects s ON tt.subject_id = s.id
       JOIN courses c ON tt.course_id = c.id
       WHERE tt.teacher_id = $1
       ORDER BY tt.day_of_week, tt.start_time`,
      [teacher.id]
    );

    res.json({
      ...teacher,
      subjects,
      timetable
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/teachers (Admin)
apiRouter.post('/teachers', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const {
      name, email, phone, departmentId, qualification,
      designation = 'Assistant Professor', joiningDate, address,
      subjectIds = [], password = 'password123'
    } = req.body;

    if (!name || !email || !departmentId || !qualification) {
      res.status(400).json({ error: 'Missing required teacher fields.' });
      return;
    }

    const existing = await queryOne('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (existing) {
      res.status(400).json({ error: 'User with this email already exists.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await queryOne(
      `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, 'teacher') RETURNING id`,
      [name, email.trim(), hashedPassword]
    );

    const countRow = await queryOne('SELECT COUNT(*) as count FROM teachers');
    const nextNum = parseInt(countRow?.count || '0', 10) + 1;
    const teacherCode = `TCH-${100 + nextNum}`;
    const today = joiningDate || new Date().toISOString().split('T')[0];

    const newTeacher = await queryOne(
      `INSERT INTO teachers (
        teacher_id, user_id, name, email, phone, department_id,
        qualification, designation, joining_date, address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        teacherCode, user.id, name, email.trim(), phone || '', Number(departmentId),
        qualification, designation, today, address || ''
      ]
    );

    // Assign subjects if specified
    if (Array.isArray(subjectIds) && subjectIds.length > 0) {
      for (const subId of subjectIds) {
        await query('UPDATE subjects SET teacher_id = $1 WHERE id = $2', [newTeacher.id, Number(subId)]);
      }
    }

    res.status(201).json(newTeacher);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/teachers/:id (Admin)
apiRouter.put('/teachers/:id', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name, email, phone, departmentId, qualification,
      designation, joiningDate, address, subjectIds
    } = req.body;

    const teacher = await queryOne('SELECT * FROM teachers WHERE id = $1', [id]);
    if (!teacher) {
      res.status(404).json({ error: 'Teacher not found' });
      return;
    }

    const updated = await queryOne(
      `UPDATE teachers SET
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        phone = COALESCE($3, phone),
        department_id = COALESCE($4, department_id),
        qualification = COALESCE($5, qualification),
        designation = COALESCE($6, designation),
        joining_date = COALESCE($7, joining_date),
        address = COALESCE($8, address)
       WHERE id = $9
       RETURNING *`,
      [
        name, email, phone,
        departmentId ? Number(departmentId) : null,
        qualification, designation, joiningDate, address, id
      ]
    );

    if (teacher.user_id && (name || email)) {
      await query(
        `UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email) WHERE id = $3`,
        [name, email, teacher.user_id]
      );
    }

    // Reassign subjects if array provided
    if (Array.isArray(subjectIds)) {
      await query('UPDATE subjects SET teacher_id = NULL WHERE teacher_id = $1', [id]);
      for (const subId of subjectIds) {
        await query('UPDATE subjects SET teacher_id = $1 WHERE id = $2', [id, Number(subId)]);
      }
    }

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/teachers/:id (Admin)
apiRouter.delete('/teachers/:id', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const teacher = await queryOne('SELECT * FROM teachers WHERE id = $1', [req.params.id]);
    if (!teacher) {
      res.status(404).json({ error: 'Teacher not found' });
      return;
    }

    // Unassign subjects
    await query('UPDATE subjects SET teacher_id = NULL WHERE teacher_id = $1', [teacher.id]);
    // Delete linked user (cascades to teacher)
    await query('DELETE FROM users WHERE id = $1', [teacher.user_id]);
    res.json({ message: 'Teacher deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. ATTENDANCE MANAGEMENT
// ==========================================

// GET /api/attendance
apiRouter.get('/attendance', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { studentId, subjectId, date, courseId, semester } = req.query;

    let sql = `
      SELECT a.*, s.name as student_name, s.student_id as student_code, sub.name as subject_name, sub.code as subject_code
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN subjects sub ON a.subject_id = sub.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (studentId) {
      params.push(Number(studentId));
      sql += ` AND a.student_id = $${params.length}`;
    }
    if (subjectId) {
      params.push(Number(subjectId));
      sql += ` AND a.subject_id = $${params.length}`;
    }
    if (date) {
      params.push(String(date));
      sql += ` AND a.date = $${params.length}`;
    }
    if (courseId) {
      params.push(Number(courseId));
      sql += ` AND s.course_id = $${params.length}`;
    }
    if (semester) {
      params.push(Number(semester));
      sql += ` AND s.semester = $${params.length}`;
    }

    sql += ' ORDER BY a.date DESC, s.name ASC';

    const rows = await query(sql, params);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/attendance/summary/:studentId
apiRouter.get('/attendance/summary/:studentId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const studentId = Number(req.params.studentId);

    // Subject-wise attendance calculation
    const subjectStats = await query(`
      SELECT
        sub.id as subject_id,
        sub.name as subject_name,
        sub.code as subject_code,
        COUNT(a.id) as total_classes,
        SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as present_classes,
        SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) as absent_classes
      FROM subjects sub
      JOIN attendance a ON a.subject_id = sub.id
      WHERE a.student_id = $1
      GROUP BY sub.id, sub.name, sub.code
      ORDER BY sub.name ASC
    `, [studentId]);

    const formatted = subjectStats.map(s => {
      const total = parseInt(s.total_classes, 10);
      const present = parseInt(s.present_classes || '0', 10);
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
      return {
        subjectId: s.subject_id,
        subjectName: s.subject_name,
        subjectCode: s.subject_code,
        totalClasses: total,
        presentClasses: present,
        absentClasses: parseInt(s.absent_classes || '0', 10),
        percentage
      };
    });

    const totalClasses = formatted.reduce((acc, curr) => acc + curr.totalClasses, 0);
    const presentClasses = formatted.reduce((acc, curr) => acc + curr.presentClasses, 0);
    const overallPercentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;

    res.json({
      overall: {
        totalClasses,
        presentClasses,
        absentClasses: totalClasses - presentClasses,
        percentage: overallPercentage
      },
      subjects: formatted
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/attendance (Mark attendance: accepts array of records or single)
apiRouter.post('/attendance', authenticateToken, requireRole(['admin', 'teacher']), async (req: AuthRequest, res: Response) => {
  try {
    const records = Array.isArray(req.body) ? req.body : [req.body];
    if (records.length === 0) {
      res.status(400).json({ error: 'No attendance records provided' });
      return;
    }

    const results = [];
    for (const rec of records) {
      const { studentId, subjectId, date, status = 'Present', remarks = '' } = rec;
      if (!studentId || !subjectId || !date) continue;

      const saved = await queryOne(
        `INSERT INTO attendance (student_id, subject_id, date, status, marked_by_id, remarks)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (student_id, subject_id, date)
         DO UPDATE SET status = EXCLUDED.status, remarks = EXCLUDED.remarks, marked_by_id = EXCLUDED.marked_by_id
         RETURNING *`,
        [Number(studentId), Number(subjectId), String(date), status, req.user?.teacherId || req.user?.id || null, remarks]
      );
      results.push(saved);
    }

    res.status(201).json({ message: `Successfully saved ${results.length} attendance records`, records: results });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/attendance/:id
apiRouter.put('/attendance/:id', authenticateToken, requireRole(['admin', 'teacher']), async (req: Request, res: Response) => {
  try {
    const { status, remarks } = req.body;
    const updated = await queryOne(
      `UPDATE attendance SET status = COALESCE($1, status), remarks = COALESCE($2, remarks) WHERE id = $3 RETURNING *`,
      [status, remarks, req.params.id]
    );
    if (!updated) {
      res.status(404).json({ error: 'Attendance record not found' });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. EXAMINATION MANAGEMENT (CRUD)
// ==========================================

// GET /api/exams
apiRouter.get('/exams', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { courseId, semester, subjectId } = req.query;
    let sql = `
      SELECT e.*, s.name as subject_name, s.code as subject_code, c.name as course_name
      FROM exams e
      JOIN subjects s ON e.subject_id = s.id
      JOIN courses c ON e.course_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (courseId) {
      params.push(Number(courseId));
      sql += ` AND e.course_id = $${params.length}`;
    }
    if (semester) {
      params.push(Number(semester));
      sql += ` AND e.semester = $${params.length}`;
    }
    if (subjectId) {
      params.push(Number(subjectId));
      sql += ` AND e.subject_id = $${params.length}`;
    }

    sql += ' ORDER BY e.exam_date ASC, e.start_time ASC';
    const rows = await query(sql, params);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/exams (Admin)
apiRouter.post('/exams', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const {
      name, subjectId, courseId, semester, examDate,
      startTime, endTime, room, maxMarks = 100, passingMarks = 40
    } = req.body;

    if (!name || !subjectId || !courseId || !semester || !examDate || !startTime || !endTime || !room) {
      res.status(400).json({ error: 'Missing required exam fields.' });
      return;
    }

    const exam = await queryOne(
      `INSERT INTO exams (name, subject_id, course_id, semester, exam_date, start_time, end_time, room, max_marks, passing_marks)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [name, Number(subjectId), Number(courseId), Number(semester), examDate, startTime, endTime, room, Number(maxMarks), Number(passingMarks)]
    );

    res.status(201).json(exam);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/exams/:id (Admin)
apiRouter.put('/exams/:id', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const {
      name, subjectId, courseId, semester, examDate,
      startTime, endTime, room, maxMarks, passingMarks
    } = req.body;

    const updated = await queryOne(
      `UPDATE exams SET
        name = COALESCE($1, name),
        subject_id = COALESCE($2, subject_id),
        course_id = COALESCE($3, course_id),
        semester = COALESCE($4, semester),
        exam_date = COALESCE($5, exam_date),
        start_time = COALESCE($6, start_time),
        end_time = COALESCE($7, end_time),
        room = COALESCE($8, room),
        max_marks = COALESCE($9, max_marks),
        passing_marks = COALESCE($10, passing_marks)
       WHERE id = $11
       RETURNING *`,
      [
        name,
        subjectId ? Number(subjectId) : null,
        courseId ? Number(courseId) : null,
        semester ? Number(semester) : null,
        examDate, startTime, endTime, room,
        maxMarks ? Number(maxMarks) : null,
        passingMarks ? Number(passingMarks) : null,
        req.params.id
      ]
    );

    if (!updated) {
      res.status(404).json({ error: 'Exam not found' });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/exams/:id (Admin)
apiRouter.delete('/exams/:id', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    await query('DELETE FROM exams WHERE id = $1', [req.params.id]);
    res.json({ message: 'Exam deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 7. MARKS & ACADEMIC RECORDS
// ==========================================

function calculateGrade(marks: number, max: number): string {
  const percentage = (marks / max) * 100;
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
}

function calculateGradePoints(grade: string): number {
  switch (grade) {
    case 'A+': return 10;
    case 'A': return 9;
    case 'B+': return 8;
    case 'B': return 7;
    case 'C': return 6;
    case 'D': return 5;
    default: return 0;
  }
}

// GET /api/marks
apiRouter.get('/marks', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { studentId, examId, subjectId } = req.query;
    let sql = `
      SELECT m.*, st.name as student_name, st.student_id as student_code,
             e.name as exam_name, s.name as subject_name, s.code as subject_code
      FROM marks m
      JOIN students st ON m.student_id = st.id
      JOIN exams e ON m.exam_id = e.id
      JOIN subjects s ON m.subject_id = s.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (studentId) {
      params.push(Number(studentId));
      sql += ` AND m.student_id = $${params.length}`;
    }
    if (examId) {
      params.push(Number(examId));
      sql += ` AND m.exam_id = $${params.length}`;
    }
    if (subjectId) {
      params.push(Number(subjectId));
      sql += ` AND m.subject_id = $${params.length}`;
    }

    sql += ' ORDER BY st.name ASC, s.name ASC';
    const rows = await query(sql, params);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/marks/student/:studentId (Complete Academic Report for Student)
apiRouter.get('/marks/student/:studentId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const studentId = Number(req.params.studentId);
    const marks = await query(`
      SELECT m.*, e.name as exam_name, e.exam_date, s.name as subject_name, s.code as subject_code, s.semester, s.credits
      FROM marks m
      JOIN exams e ON m.exam_id = e.id
      JOIN subjects s ON m.subject_id = s.id
      WHERE m.student_id = $1
      ORDER BY s.semester ASC, m.created_at DESC
    `, [studentId]);

    // Calculate SGPA and percentage
    let totalMarksObtained = 0;
    let totalMaxMarks = 0;
    let totalWeightedPoints = 0;
    let totalCredits = 0;

    marks.forEach(m => {
      const marksObtained = Number(m.marks_obtained);
      const maxMarks = Number(m.max_marks);
      const credits = Number(m.credits) || 3;
      totalMarksObtained += marksObtained;
      totalMaxMarks += maxMarks;

      const gradePoints = calculateGradePoints(m.grade);
      totalWeightedPoints += gradePoints * credits;
      totalCredits += credits;
    });

    const overallPercentage = totalMaxMarks > 0 ? Number(((totalMarksObtained / totalMaxMarks) * 100).toFixed(2)) : 0;
    const sgpa = totalCredits > 0 ? Number((totalWeightedPoints / totalCredits).toFixed(2)) : 0;

    res.json({
      summary: {
        totalSubjects: marks.length,
        totalMarksObtained,
        totalMaxMarks,
        overallPercentage,
        sgpa,
        overallGrade: calculateGrade(totalMarksObtained, totalMaxMarks || 100)
      },
      records: marks
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/marks (Teacher/Admin)
apiRouter.post('/marks', authenticateToken, requireRole(['admin', 'teacher']), async (req: AuthRequest, res: Response) => {
  try {
    const entries = Array.isArray(req.body) ? req.body : [req.body];
    if (entries.length === 0) {
      res.status(400).json({ error: 'No marks data provided.' });
      return;
    }

    const savedRecords = [];
    for (const entry of entries) {
      const { studentId, examId, subjectId, marksObtained, maxMarks = 100, remarks = '' } = entry;
      if (!studentId || !examId || !subjectId || marksObtained === undefined) continue;

      const numMarks = Number(marksObtained);
      const numMax = Number(maxMarks);
      const grade = calculateGrade(numMarks, numMax);

      const saved = await queryOne(
        `INSERT INTO marks (student_id, exam_id, subject_id, marks_obtained, max_marks, grade, remarks, entered_by_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (student_id, exam_id, subject_id)
         DO UPDATE SET marks_obtained = EXCLUDED.marks_obtained, max_marks = EXCLUDED.max_marks,
                       grade = EXCLUDED.grade, remarks = EXCLUDED.remarks, entered_by_id = EXCLUDED.entered_by_id
         RETURNING *`,
        [Number(studentId), Number(examId), Number(subjectId), numMarks, numMax, grade, remarks, req.user?.teacherId || req.user?.id || null]
      );
      savedRecords.push(saved);
    }

    res.status(201).json({ message: `Saved ${savedRecords.length} marks entries`, marks: savedRecords });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/marks/:id
apiRouter.put('/marks/:id', authenticateToken, requireRole(['admin', 'teacher']), async (req: Request, res: Response) => {
  try {
    const { marksObtained, maxMarks = 100, remarks } = req.body;
    const numMarks = Number(marksObtained);
    const numMax = Number(maxMarks);
    const grade = calculateGrade(numMarks, numMax);

    const updated = await queryOne(
      `UPDATE marks SET
        marks_obtained = $1,
        max_marks = $2,
        grade = $3,
        remarks = COALESCE($4, remarks)
       WHERE id = $5
       RETURNING *`,
      [numMarks, numMax, grade, remarks, req.params.id]
    );

    if (!updated) {
      res.status(404).json({ error: 'Marks record not found' });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 8. FEE MANAGEMENT
// ==========================================

// GET /api/fees
apiRouter.get('/fees', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { studentId, status, semester } = req.query;
    let sql = `
      SELECT f.*, st.name as student_name, st.student_id as student_code,
             c.name as course_name, d.name as department_name
      FROM fees f
      JOIN students st ON f.student_id = st.id
      LEFT JOIN courses c ON st.course_id = c.id
      LEFT JOIN departments d ON st.department_id = d.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (studentId) {
      params.push(Number(studentId));
      sql += ` AND f.student_id = $${params.length}`;
    }
    if (status) {
      params.push(String(status));
      sql += ` AND f.payment_status = $${params.length}`;
    }
    if (semester) {
      params.push(Number(semester));
      sql += ` AND f.semester = $${params.length}`;
    }

    sql += ' ORDER BY f.due_date ASC, f.id DESC';
    const rows = await query(sql, params);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/fees (Admin adds fee record)
apiRouter.post('/fees', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const {
      studentId, academicYear = '2025-2026', semester = 1,
      totalFee, paidAmount = 0, dueDate
    } = req.body;

    if (!studentId || !totalFee || !dueDate) {
      res.status(400).json({ error: 'Missing required fee fields.' });
      return;
    }

    const total = Number(totalFee);
    const paid = Number(paidAmount) || 0;
    const remaining = total - paid;
    const paymentStatus = remaining <= 0 ? 'Paid' : paid > 0 ? 'Partially Paid' : 'Pending';

    const fee = await queryOne(
      `INSERT INTO fees (student_id, academic_year, semester, total_fee, paid_amount, remaining_amount, due_date, payment_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [Number(studentId), academicYear, Number(semester), total, paid, remaining, dueDate, paymentStatus]
    );

    res.status(201).json(fee);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/fees/:id (Admin updates fee record)
apiRouter.put('/fees/:id', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { totalFee, paidAmount, dueDate, paymentStatus, paymentMethod } = req.body;
    const current = await queryOne('SELECT * FROM fees WHERE id = $1', [req.params.id]);
    if (!current) {
      res.status(404).json({ error: 'Fee record not found' });
      return;
    }

    const total = totalFee !== undefined ? Number(totalFee) : Number(current.total_fee);
    const paid = paidAmount !== undefined ? Number(paidAmount) : Number(current.paid_amount);
    const remaining = total - paid;
    const status = paymentStatus || (remaining <= 0 ? 'Paid' : paid > 0 ? 'Partially Paid' : 'Pending');

    const updated = await queryOne(
      `UPDATE fees SET
        total_fee = $1,
        paid_amount = $2,
        remaining_amount = $3,
        due_date = COALESCE($4, due_date),
        payment_status = $5,
        payment_method = COALESCE($6, payment_method)
       WHERE id = $7
       RETURNING *`,
      [total, paid, remaining, dueDate, status, paymentMethod, req.params.id]
    );

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/fees/:id/pay (Mock Payment Flow for Students or Admin)
apiRouter.post('/fees/:id/pay', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { amount, paymentMethod = 'Online Portal (Mock Payment)' } = req.body;
    const fee = await queryOne('SELECT * FROM fees WHERE id = $1', [req.params.id]);
    if (!fee) {
      res.status(404).json({ error: 'Fee record not found' });
      return;
    }

    const currentPaid = Number(fee.paid_amount);
    const total = Number(fee.total_fee);
    const payAmount = amount ? Number(amount) : Number(fee.remaining_amount);

    if (payAmount <= 0) {
      res.status(400).json({ error: 'Payment amount must be greater than 0.' });
      return;
    }

    const newPaid = Math.min(total, currentPaid + payAmount);
    const newRemaining = Math.max(0, total - newPaid);
    const newStatus = newRemaining === 0 ? 'Paid' : 'Partially Paid';
    const receiptNo = `PAY-${Date.now().toString().slice(-6)}-${fee.id}`;
    const today = new Date().toISOString().split('T')[0];

    const updated = await queryOne(
      `UPDATE fees SET
        paid_amount = $1,
        remaining_amount = $2,
        payment_status = $3,
        payment_date = $4,
        receipt_no = $5,
        payment_method = $6
       WHERE id = $7
       RETURNING *`,
      [newPaid, newRemaining, newStatus, today, receiptNo, paymentMethod, fee.id]
    );

    res.json({
      message: 'Payment processed successfully (Mock Transaction Complete)',
      receipt: {
        receiptNo,
        transactionDate: today,
        amountPaid: payAmount,
        status: newStatus,
        paymentMethod
      },
      fee: updated
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 9. TIMETABLE MANAGEMENT
// ==========================================

// GET /api/timetable
apiRouter.get('/timetable', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { courseId, semester, teacherId, day } = req.query;
    let sql = `
      SELECT tt.*, s.name as subject_name, s.code as subject_code,
             t.name as teacher_name, c.name as course_name
      FROM timetable tt
      JOIN subjects s ON tt.subject_id = s.id
      JOIN courses c ON tt.course_id = c.id
      LEFT JOIN teachers t ON tt.teacher_id = t.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (courseId) {
      params.push(Number(courseId));
      sql += ` AND tt.course_id = $${params.length}`;
    }
    if (semester) {
      params.push(Number(semester));
      sql += ` AND tt.semester = $${params.length}`;
    }
    if (teacherId) {
      params.push(Number(teacherId));
      sql += ` AND tt.teacher_id = $${params.length}`;
    }
    if (day) {
      params.push(String(day));
      sql += ` AND tt.day_of_week = $${params.length}`;
    }

    sql += `
      ORDER BY
        CASE tt.day_of_week
          WHEN 'Monday' THEN 1
          WHEN 'Tuesday' THEN 2
          WHEN 'Wednesday' THEN 3
          WHEN 'Thursday' THEN 4
          WHEN 'Friday' THEN 5
          WHEN 'Saturday' THEN 6
          ELSE 7
        END, tt.start_time ASC
    `;

    const rows = await query(sql, params);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/timetable (Admin)
apiRouter.post('/timetable', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { dayOfWeek, startTime, endTime, subjectId, teacherId, room, courseId, semester } = req.body;
    if (!dayOfWeek || !startTime || !endTime || !subjectId || !room || !courseId || !semester) {
      res.status(400).json({ error: 'Missing required timetable fields.' });
      return;
    }

    const entry = await queryOne(
      `INSERT INTO timetable (day_of_week, start_time, end_time, subject_id, teacher_id, room, course_id, semester)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [dayOfWeek, startTime, endTime, Number(subjectId), teacherId ? Number(teacherId) : null, room, Number(courseId), Number(semester)]
    );

    res.status(201).json(entry);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/timetable/:id (Admin)
apiRouter.put('/timetable/:id', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { dayOfWeek, startTime, endTime, subjectId, teacherId, room, courseId, semester } = req.body;
    const updated = await queryOne(
      `UPDATE timetable SET
        day_of_week = COALESCE($1, day_of_week),
        start_time = COALESCE($2, start_time),
        end_time = COALESCE($3, end_time),
        subject_id = COALESCE($4, subject_id),
        teacher_id = COALESCE($5, teacher_id),
        room = COALESCE($6, room),
        course_id = COALESCE($7, course_id),
        semester = COALESCE($8, semester)
       WHERE id = $9
       RETURNING *`,
      [
        dayOfWeek, startTime, endTime,
        subjectId ? Number(subjectId) : null,
        teacherId ? Number(teacherId) : null,
        room,
        courseId ? Number(courseId) : null,
        semester ? Number(semester) : null,
        req.params.id
      ]
    );

    if (!updated) {
      res.status(404).json({ error: 'Timetable entry not found' });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/timetable/:id (Admin)
apiRouter.delete('/timetable/:id', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    await query('DELETE FROM timetable WHERE id = $1', [req.params.id]);
    res.json({ message: 'Timetable entry deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 10. ANNOUNCEMENTS
// ==========================================

// GET /api/announcements
apiRouter.get('/announcements', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { audience, priority } = req.query;
    let sql = 'SELECT * FROM announcements WHERE is_active = TRUE';
    const params: any[] = [];

    if (audience && audience !== 'All') {
      params.push(String(audience));
      sql += ` AND (target_audience = 'All' OR target_audience = $${params.length})`;
    }
    if (priority) {
      params.push(String(priority));
      sql += ` AND priority = $${params.length}`;
    }

    sql += ' ORDER BY published_date DESC, id DESC';
    const rows = await query(sql, params);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/announcements (Admin/Teacher)
apiRouter.post('/announcements', authenticateToken, requireRole(['admin', 'teacher']), async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, priority = 'Normal', targetAudience = 'All' } = req.body;
    if (!title || !description) {
      res.status(400).json({ error: 'Title and description are required.' });
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const authorName = req.user?.name || 'Administrator';
    const authorRole = req.user?.role === 'admin' ? 'Admin' : 'Teacher';

    const announcement = await queryOne(
      `INSERT INTO announcements (title, description, priority, target_audience, published_date, author_name, author_role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
       RETURNING *`,
      [title, description, priority, targetAudience, today, authorName, authorRole]
    );

    res.status(201).json(announcement);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/announcements/:id (Admin)
apiRouter.put('/announcements/:id', authenticateToken, requireRole(['admin', 'teacher']), async (req: Request, res: Response) => {
  try {
    const { title, description, priority, targetAudience, isActive } = req.body;
    const updated = await queryOne(
      `UPDATE announcements SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        priority = COALESCE($3, priority),
        target_audience = COALESCE($4, target_audience),
        is_active = COALESCE($5, is_active)
       WHERE id = $6
       RETURNING *`,
      [title, description, priority, targetAudience, isActive, req.params.id]
    );

    if (!updated) {
      res.status(404).json({ error: 'Announcement not found' });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/announcements/:id (Admin)
apiRouter.delete('/announcements/:id', authenticateToken, requireRole(['admin', 'teacher']), async (req: Request, res: Response) => {
  try {
    await query('DELETE FROM announcements WHERE id = $1', [req.params.id]);
    res.json({ message: 'Announcement deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 11. DASHBOARD STATISTICS
// ==========================================

// GET /api/admin/stats
apiRouter.get('/admin/stats', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const totalStudents = await queryOne('SELECT COUNT(*) as count FROM students');
    const totalTeachers = await queryOne('SELECT COUNT(*) as count FROM teachers');
    const totalCourses = await queryOne('SELECT COUNT(*) as count FROM courses');
    const totalSubjects = await queryOne('SELECT COUNT(*) as count FROM subjects');
    const totalAttendance = await queryOne('SELECT COUNT(*) as count FROM attendance');

    const feeStats = await queryOne(`
      SELECT
        COUNT(CASE WHEN payment_status != 'Paid' THEN 1 END) as pending_count,
        SUM(remaining_amount) as total_pending_amount
      FROM fees
    `);

    const upcomingExams = await queryOne(`
      SELECT COUNT(*) as count FROM exams WHERE exam_date >= TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD')
    `);

    const recentAnnouncements = await query(
      'SELECT * FROM announcements WHERE is_active = TRUE ORDER BY published_date DESC LIMIT 4'
    );

    res.json({
      totalStudents: parseInt(totalStudents?.count || '0', 10),
      totalTeachers: parseInt(totalTeachers?.count || '0', 10),
      totalCourses: parseInt(totalCourses?.count || '0', 10),
      totalSubjects: parseInt(totalSubjects?.count || '0', 10),
      totalAttendance: parseInt(totalAttendance?.count || '0', 10),
      pendingFeesCount: parseInt(feeStats?.pending_count || '0', 10),
      pendingFeesAmount: parseFloat(feeStats?.total_pending_amount || '0'),
      upcomingExamsCount: parseInt(upcomingExams?.count || '0', 10),
      recentAnnouncements
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/teacher/stats
apiRouter.get('/teacher/stats', authenticateToken, requireRole(['teacher']), async (req: AuthRequest, res: Response) => {
  try {
    const teacherId = req.user?.teacherId;
    if (!teacherId) {
      res.status(404).json({ error: 'Teacher profile not found' });
      return;
    }

    // Teacher subjects
    const teacherSubjects = await query('SELECT id, course_id, semester FROM subjects WHERE teacher_id = $1', [teacherId]);
    const subjectIds = teacherSubjects.map(s => s.id);
    const courseIds = [...new Set(teacherSubjects.map(s => s.course_id))];

    // Assigned students count
    let assignedStudentsCount = 0;
    if (courseIds.length > 0) {
      const stCount = await queryOne(
        `SELECT COUNT(DISTINCT id) as count FROM students WHERE course_id = ANY($1::int[])`,
        [courseIds]
      );
      assignedStudentsCount = parseInt(stCount?.count || '0', 10);
    }

    // Today's classes count
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[new Date().getDay()] || 'Monday';
    const todayClasses = await query(
      `SELECT tt.*, s.name as subject_name, s.code as subject_code
       FROM timetable tt
       JOIN subjects s ON tt.subject_id = s.id
       WHERE tt.teacher_id = $1 AND tt.day_of_week = $2
       ORDER BY tt.start_time ASC`,
      [teacherId, currentDay]
    );

    // Pending attendance for today's classes
    const todayDate = new Date().toISOString().split('T')[0];
    let pendingAttendanceCount = 0;
    for (const cls of todayClasses) {
      const marked = await queryOne(
        `SELECT COUNT(*) as count FROM attendance WHERE subject_id = $1 AND date = $2`,
        [cls.subject_id, todayDate]
      );
      if (parseInt(marked?.count || '0', 10) === 0) {
        pendingAttendanceCount++;
      }
    }

    // Upcoming exams
    let upcomingExams = [];
    if (subjectIds.length > 0) {
      upcomingExams = await query(
        `SELECT e.*, s.name as subject_name FROM exams e JOIN subjects s ON e.subject_id = s.id WHERE e.subject_id = ANY($1::int[]) ORDER BY e.exam_date ASC LIMIT 5`,
        [subjectIds]
      );
    }

    // Recent announcements
    const recentAnnouncements = await query(
      `SELECT * FROM announcements WHERE is_active = TRUE AND (target_audience = 'All' OR target_audience = 'Teachers') ORDER BY published_date DESC LIMIT 4`
    );

    res.json({
      assignedStudentsCount,
      todayClassesCount: todayClasses.length,
      todayClasses,
      pendingAttendanceCount,
      upcomingExams,
      recentAnnouncements
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/student/stats
apiRouter.get('/student/stats', authenticateToken, requireRole(['student']), async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user?.studentId;
    if (!studentId) {
      res.status(404).json({ error: 'Student record not found' });
      return;
    }

    const student = await queryOne('SELECT * FROM students WHERE id = $1', [studentId]);
    if (!student) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    // Overall attendance
    const attendanceStats = await query(
      `SELECT status, COUNT(*) as count FROM attendance WHERE student_id = $1 GROUP BY status`,
      [studentId]
    );
    const totalClasses = attendanceStats.reduce((acc, curr) => acc + parseInt(curr.count, 10), 0);
    const presentClasses = parseInt(attendanceStats.find(r => r.status === 'Present')?.count || '0', 10);
    const attendancePercentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;

    // Upcoming exams for student's course and semester
    const upcomingExams = await query(
      `SELECT e.*, s.name as subject_name, s.code as subject_code
       FROM exams e
       JOIN subjects s ON e.subject_id = s.id
       WHERE e.course_id = $1 AND e.semester = $2
       ORDER BY e.exam_date ASC LIMIT 4`,
      [student.course_id, student.semester]
    );

    // Recent marks
    const recentMarks = await query(
      `SELECT m.*, e.name as exam_name, s.name as subject_name
       FROM marks m
       JOIN exams e ON m.exam_id = e.id
       JOIN subjects s ON m.subject_id = s.id
       WHERE m.student_id = $1
       ORDER BY m.created_at DESC LIMIT 4`,
      [studentId]
    );

    // Fee status
    const feeRecord = await queryOne(
      `SELECT * FROM fees WHERE student_id = $1 ORDER BY id DESC LIMIT 1`,
      [studentId]
    );

    // Today's classes
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[new Date().getDay()] || 'Monday';
    const todayClasses = await query(
      `SELECT tt.*, s.name as subject_name, s.code as subject_code, t.name as teacher_name
       FROM timetable tt
       JOIN subjects s ON tt.subject_id = s.id
       LEFT JOIN teachers t ON tt.teacher_id = t.id
       WHERE tt.course_id = $1 AND tt.semester = $2 AND tt.day_of_week = $3
       ORDER BY tt.start_time ASC`,
      [student.course_id, student.semester, currentDay]
    );

    // Latest announcements
    const latestAnnouncements = await query(
      `SELECT * FROM announcements WHERE is_active = TRUE AND (target_audience = 'All' OR target_audience = 'Students') ORDER BY published_date DESC LIMIT 4`
    );

    res.json({
      attendance: {
        totalClasses,
        presentClasses,
        absentClasses: totalClasses - presentClasses,
        percentage: attendancePercentage
      },
      upcomingExams,
      recentMarks,
      feeRecord,
      todayClasses,
      latestAnnouncements
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
