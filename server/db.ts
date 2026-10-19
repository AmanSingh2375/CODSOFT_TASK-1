import { PGlite } from '@electric-sql/pglite';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

let dbInstance: PGlite | null = null;
let dbMode: 'persistent' | 'in-memory' = 'persistent';

/**
 * Clean up stale lock files that cause Windows / NTFS PGlite startup crashes
 */
function cleanupStaleLocks(dir: string) {
  try {
    const lockFiles = ['postmaster.pid', '.lock', 'LOCK'];
    for (const file of lockFiles) {
      const lockPath = path.join(dir, file);
      if (fs.existsSync(lockPath)) {
        try {
          fs.unlinkSync(lockPath);
          console.log(`[PGlite] Removed stale lock file: ${file}`);
        } catch (e) {
          // Lock may be held or inaccessible, ignore
        }
      }
    }
  } catch (err) {
    // Non-fatal lock cleanup warning
  }
}

/**
 * Initializes PGlite with Windows compatibility, path normalization, and safe fallback.
 */
export async function initDatabase(): Promise<PGlite> {
  if (dbInstance) {
    return dbInstance;
  }

  const requestedDir = process.env.PGLITE_DATA_DIR || './data/pglite';
  const forceMemory = process.env.PGLITE_MEMORY === 'true';

  if (forceMemory) {
    console.log('[PGlite] Initializing in-memory database as configured...');
    dbInstance = new PGlite();
    await dbInstance.waitReady;
    dbMode = 'in-memory';
    await initializeSchemaAndSeed(dbInstance);
    return dbInstance;
  }

  try {
    // Normalize path for Windows and Unix
    const resolvedPath = path.resolve(process.cwd(), requestedDir);
    fs.mkdirSync(resolvedPath, { recursive: true });
    cleanupStaleLocks(resolvedPath);

    // On Windows, normalize backslashes for Emscripten virtual file system
    const normalizedPath = resolvedPath.split(path.sep).join('/');

    console.log(`[PGlite] Initializing database at: ${normalizedPath}`);
    // relaxedDurability: true prevents fsync locks on Windows NTFS filesystems
    dbInstance = new PGlite(normalizedPath, {
      relaxedDurability: true,
    });

    await dbInstance.waitReady;
    dbMode = 'persistent';
    console.log('[PGlite] Persistent database initialized successfully.');
  } catch (err: any) {
    console.warn(`[PGlite Warning] Persistent storage initialization failed: ${err?.message || err}`);
    console.warn('[PGlite] Falling back to in-memory database for local stability (Windows/lock protection)...');

    try {
      dbInstance = new PGlite();
      await dbInstance.waitReady;
      dbMode = 'in-memory';
      console.log('[PGlite] In-memory database ready and operational.');
    } catch (fallbackErr: any) {
      console.error('[PGlite Fatal] Both persistent and in-memory PGlite failed:', fallbackErr);
      throw new Error(`PGlite initialization failed: ${fallbackErr?.message || fallbackErr}`);
    }
  }

  await initializeSchemaAndSeed(dbInstance);
  return dbInstance;
}

export function getDatabase(): PGlite {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return dbInstance;
}

export function getDatabaseMode(): 'persistent' | 'in-memory' {
  return dbMode;
}

/**
 * Create tables and seed initial demo data
 */
async function initializeSchemaAndSeed(db: PGlite) {
  console.log('[Database] Verifying schema and tables...');

  // Create tables idempotently
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(100) NOT NULL,
      role VARCHAR(20) DEFAULT 'student',
      student_id VARCHAR(50) UNIQUE,
      department VARCHAR(100) DEFAULT 'Computer Science',
      semester VARCHAR(20) DEFAULT 'Semester 4',
      phone VARCHAR(30) DEFAULT '+1 (555) 234-5678',
      avatar_url VARCHAR(255) DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS courses (
      id SERIAL PRIMARY KEY,
      code VARCHAR(20) UNIQUE NOT NULL,
      title VARCHAR(120) NOT NULL,
      description TEXT,
      credits INTEGER NOT NULL DEFAULT 3,
      instructor VARCHAR(100) NOT NULL,
      department VARCHAR(100) NOT NULL,
      semester VARCHAR(20) NOT NULL,
      schedule VARCHAR(100),
      room VARCHAR(50),
      capacity INTEGER DEFAULT 45,
      color VARCHAR(30) DEFAULT 'indigo',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS enrollments (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      grade VARCHAR(5) DEFAULT 'A-',
      score NUMERIC(5, 2) DEFAULT 88.5,
      status VARCHAR(20) DEFAULT 'Enrolled',
      enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, course_id)
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id SERIAL PRIMARY KEY,
      enrollment_id INTEGER REFERENCES enrollments(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      status VARCHAR(20) NOT NULL,
      notes VARCHAR(255) DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS assignments (
      id SERIAL PRIMARY KEY,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      title VARCHAR(150) NOT NULL,
      description TEXT,
      due_date TIMESTAMP NOT NULL,
      total_points INTEGER DEFAULT 100,
      weight_percent INTEGER DEFAULT 15,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id SERIAL PRIMARY KEY,
      assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
      student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      file_name VARCHAR(255),
      content_text TEXT,
      submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      grade NUMERIC(5, 2),
      feedback TEXT,
      status VARCHAR(20) DEFAULT 'Submitted',
      UNIQUE(assignment_id, student_id)
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id SERIAL PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      content TEXT NOT NULL,
      author VARCHAR(100) DEFAULT 'Dean of Academic Affairs',
      category VARCHAR(50) DEFAULT 'General',
      priority VARCHAR(20) DEFAULT 'Normal',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(150) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(30) DEFAULT 'info',
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Check if seed data exists
  const checkUser = await db.query('SELECT count(*) as count FROM users');
  const userCount = parseInt((checkUser.rows[0] as any)?.count || '0', 10);

  if (userCount === 0) {
    console.log('[Database] Seeding initial EduManage data...');

    const saltRounds = 10;
    const studentHash = bcrypt.hashSync('student123', saltRounds);
    const facultyHash = bcrypt.hashSync('faculty123', saltRounds);
    const adminHash = bcrypt.hashSync('admin123', saltRounds);

    // 1. Seed Users
    await db.query(`
      INSERT INTO users (username, email, password_hash, full_name, role, student_id, department, semester, phone, avatar_url)
      VALUES 
        ('alex_turner', 'student@edumanage.edu', $1, 'Alex Turner', 'student', 'STU-2024-0891', 'Computer Science & Engineering', 'Semester 4', '+1 (555) 234-5678', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'),
        ('prof_roberts', 'faculty@edumanage.edu', $2, 'Dr. Eleanor Roberts', 'faculty', 'FAC-1002', 'Computer Science & Engineering', 'Faculty', '+1 (555) 345-6789', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'),
        ('admin', 'admin@edumanage.edu', $3, 'System Administrator', 'admin', 'ADM-001', 'Administration', 'Staff', '+1 (555) 456-7890', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80')
    `, [studentHash, facultyHash, adminHash]);

    // 2. Seed Courses
    await db.query(`
      INSERT INTO courses (code, title, description, credits, instructor, department, semester, schedule, room, capacity, color)
      VALUES 
        ('CS201', 'Data Structures & Algorithms', 'In-depth study of abstract data types, balanced search trees, graph algorithms, divide-and-conquer, dynamic programming, and complexity analysis.', 4, 'Dr. Eleanor Roberts', 'Computer Science & Engineering', 'Semester 4', 'Mon, Wed 09:00 - 10:30 AM', 'Turing Hall 204', 45, 'indigo'),
        ('CS303', 'Database Management Systems', 'Relational database model, SQL queries, normalization, transactions, ACID properties, indexing, and storage engine fundamentals.', 3, 'Prof. Marcus Vance', 'Computer Science & Engineering', 'Semester 4', 'Tue, Thu 11:00 - 12:30 PM', 'Babbage Lab 102', 40, 'emerald'),
        ('MATH205', 'Discrete Mathematics', 'Logic, set theory, combinatorics, graph theory, mathematical induction, and recurrence relations for computer science.', 3, 'Dr. Sarah Lin', 'Mathematics', 'Semester 4', 'Mon, Wed 01:00 - 02:30 PM', 'Euler Center 301', 50, 'violet'),
        ('ENG102', 'Technical Communication & Ethics', 'Professional engineering writing, peer reviews, technical presentations, engineering ethics, and digital privacy.', 2, 'Prof. David Miller', 'Humanities', 'Semester 4', 'Fri 10:00 - 12:00 PM', 'Franklin Hall 105', 35, 'amber'),
        ('CS405', 'Software Engineering & Agile Methods', 'Modern software lifecycle, Git workflows, CI/CD pipelines, Scrum sprint cycles, microservices, and system design.', 3, 'Dr. Eleanor Roberts', 'Computer Science & Engineering', 'Semester 4', 'Tue, Thu 02:00 - 03:30 PM', 'Ada Lovelace 210', 40, 'rose'),
        ('AI210', 'Foundations of Artificial Intelligence', 'Heuristic search, constraint satisfaction, probabilistic reasoning, introduction to neural networks and machine learning.', 4, 'Dr. Alan K. Chen', 'Computer Science & Engineering', 'Semester 4', 'Mon, Thu 03:30 - 05:00 PM', 'Shannon Suite 402', 30, 'cyan')
    `);

    // Fetch user Alex Turner and Courses
    const studentRes = await db.query("SELECT id FROM users WHERE username = 'alex_turner'");
    const studentId = (studentRes.rows[0] as any).id;

    const coursesRes = await db.query("SELECT id, code FROM courses");
    const coursesMap = new Map<string, number>();
    for (const row of coursesRes.rows as any[]) {
      coursesMap.set(row.code, row.id);
    }

    // 3. Enroll Alex Turner in 5 courses
    const enrollmentsToSeed = [
      { code: 'CS201', grade: 'A', score: 93.5 },
      { code: 'CS303', grade: 'A-', score: 89.0 },
      { code: 'MATH205', grade: 'B+', score: 86.2 },
      { code: 'ENG102', grade: 'A', score: 94.0 },
      { code: 'CS405', grade: 'A-', score: 88.5 },
    ];

    for (const e of enrollmentsToSeed) {
      const courseId = coursesMap.get(e.code);
      if (courseId) {
        const enrollRes = await db.query(
          `INSERT INTO enrollments (user_id, course_id, grade, score, status) VALUES ($1, $2, $3, $4, 'Enrolled') RETURNING id`,
          [studentId, courseId, e.grade, e.score]
        );
        const enrollmentId = (enrollRes.rows[0] as any).id;

        // Seed 6 attendance records for each course
        const sampleDates = [
          '2026-09-02', '2026-09-09', '2026-09-16', '2026-09-23', '2026-09-30', '2026-10-07'
        ];
        for (let i = 0; i < sampleDates.length; i++) {
          const status = (e.code === 'MATH205' && i === 2) ? 'Absent' : (i === 4 && e.code === 'CS303') ? 'Late' : 'Present';
          await db.query(
            `INSERT INTO attendance (enrollment_id, user_id, course_id, date, status, notes) VALUES ($1, $2, $3, $4, $5, $6)`,
            [enrollmentId, studentId, courseId, sampleDates[i], status, status === 'Present' ? 'On time' : status === 'Late' ? 'Late 10 mins' : 'Medical leave']
          );
        }
      }
    }

    // 4. Seed Assignments
    const cs201Id = coursesMap.get('CS201');
    const cs303Id = coursesMap.get('CS303');
    const math205Id = coursesMap.get('MATH205');
    const cs405Id = coursesMap.get('CS405');

    if (cs201Id && cs303Id && math205Id && cs405Id) {
      const a1 = await db.query(`
        INSERT INTO assignments (course_id, title, description, due_date, total_points, weight_percent)
        VALUES 
          ($1, 'Assignment 3: Red-Black Trees & Balancing', 'Implement a balanced Red-Black Tree in C++ or Java with insert, delete, and visualization functions.', '2026-10-25 23:59:00', 100, 20)
        RETURNING id
      `, [cs201Id]);

      const a2 = await db.query(`
        INSERT INTO assignments (course_id, title, description, due_date, total_points, weight_percent)
        VALUES 
          ($1, 'Database Schema Normalization & B+ Trees', 'Submit a full 3NF normalized schema along with index sizing calculations for 10M rows.', '2026-10-28 23:59:00', 100, 15)
        RETURNING id
      `, [cs303Id]);

      const a3 = await db.query(`
        INSERT INTO assignments (course_id, title, description, due_date, total_points, weight_percent)
        VALUES 
          ($1, 'Sprint 2: Architecture & CI Pipeline', 'Configure GitHub Actions CI workflow, Dockerfile, and automated integration test runner.', '2026-10-22 18:00:00', 100, 25)
        RETURNING id
      `, [cs405Id]);

      const a4 = await db.query(`
        INSERT INTO assignments (course_id, title, description, due_date, total_points, weight_percent)
        VALUES 
          ($1, 'Assignment 1: Sorting Algorithms Benchmark', 'Empirical comparison of QuickSort, MergeSort, and HeapSort with 100K integers.', '2026-09-18 23:59:00', 100, 15)
        RETURNING id
      `, [cs201Id]);

      // Seed submissions for Alex
      const a4Id = (a4.rows[0] as any).id;
      const a3Id = (a3.rows[0] as any).id;

      await db.query(`
        INSERT INTO submissions (assignment_id, student_id, file_name, content_text, grade, feedback, status)
        VALUES 
          ($1, $2, 'sorting_benchmarks_alex_turner.pdf', 'Completed sorting benchmarks with cache performance metrics.', 96.0, 'Excellent benchmark analysis and clean visualizations.', 'Graded'),
          ($3, $2, 'sprint2_architecture_report.zip', 'CI/CD pipeline and multi-stage Docker build ready.', NULL, 'Submitted on time, awaiting professor review.', 'Submitted')
      `, [a4Id, studentId, a3Id]);
    }

    // 5. Seed Announcements
    await db.query(`
      INSERT INTO announcements (title, content, author, category, priority)
      VALUES 
        ('Midterm Examination Schedule Released', 'The Fall 2026 Midterm Exam Schedule is officially published. Exams commence next Monday in Turing and Babbage examination halls. Please verify your seating arrangements.', 'Office of the Registrar', 'Examinations', 'Urgent'),
        ('Annual HackEdu 2026 Hackathon Registration Open', 'Join over 400 developers this weekend for HackEdu 2026! Sponsored by leading tech innovators with $15,000 in prizes. Team signups close Thursday midnight.', 'Computer Science Society', 'Events', 'Normal'),
        ('Library Extended Study Hours for Finals', 'The Central STEM Library will remain open 24/7 starting November 1st with complimentary coffee and dedicated private group study pods.', 'University Libraries', 'Campus Life', 'Normal'),
        ('Course Withdrawal Deadline Notice', 'Students wishing to withdraw from elective courses without academic penalty must submit their forms before October 31.', 'Academic Advising', 'Academic', 'High')
    `);

    // 6. Seed Notifications for student
    await db.query(`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES 
        ($1, 'Grade Published', 'Your grade for CS201 Assignment 1 has been published: 96/100 (A).', 'success'),
        ($1, 'Upcoming Deadline Alert', 'Sprint 2: Architecture & CI Pipeline is due in 3 days.', 'warning'),
        ($1, 'Attendance Verified', 'Your attendance record for CS303 on Oct 07 has been confirmed.', 'info')
    `, [studentId]);

    console.log('[Database] Seed data created successfully!');
  } else {
    console.log(`[Database] Found ${userCount} existing users. Schema ready.`);
  }
}
