import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';

// Ensure data directory exists
const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let dbInstance: PGlite | null = null;
let isInitialized = false;

export async function getDb(): Promise<PGlite> {
  if (!dbInstance) {
    const dbPath = path.resolve(dataDir, 'edumanage-pg');
    dbInstance = new PGlite(dbPath);
  }
  return dbInstance;
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const db = await getDb();
  const res = await db.query(sql, params);
  return res.rows as T[];
}

export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export async function initDb(): Promise<void> {
  if (isInitialized) return;
  const db = await getDb();

  // Create PostgreSQL tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'student',
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS departments (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      code VARCHAR(50) UNIQUE NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS courses (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(50) UNIQUE NOT NULL,
      department_id INTEGER REFERENCES departments(id) ON DELETE CASCADE,
      duration_years INTEGER DEFAULT 4,
      total_semesters INTEGER DEFAULT 8,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS teachers (
      id SERIAL PRIMARY KEY,
      teacher_id VARCHAR(50) UNIQUE NOT NULL,
      user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(50),
      department_id INTEGER REFERENCES departments(id) ON DELETE RESTRICT,
      qualification VARCHAR(255) NOT NULL,
      designation VARCHAR(255) DEFAULT 'Assistant Professor',
      joining_date VARCHAR(50) NOT NULL,
      address TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(50) UNIQUE NOT NULL,
      course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
      semester INTEGER NOT NULL,
      credits INTEGER DEFAULT 3,
      teacher_id INTEGER REFERENCES teachers(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS students (
      id SERIAL PRIMARY KEY,
      student_id VARCHAR(50) UNIQUE NOT NULL,
      user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(50),
      dob VARCHAR(50) NOT NULL,
      gender VARCHAR(20) NOT NULL,
      address TEXT,
      department_id INTEGER REFERENCES departments(id) ON DELETE RESTRICT,
      course_id INTEGER REFERENCES courses(id) ON DELETE RESTRICT,
      semester INTEGER DEFAULT 1,
      admission_date VARCHAR(50) NOT NULL,
      profile_image TEXT,
      guardian_name VARCHAR(255),
      guardian_phone VARCHAR(50),
      status VARCHAR(50) DEFAULT 'Active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id SERIAL PRIMARY KEY,
      student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
      subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
      date VARCHAR(20) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'Present',
      marked_by_id INTEGER,
      remarks TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT unique_student_subject_date UNIQUE (student_id, subject_id, date)
    );

    CREATE TABLE IF NOT EXISTS exams (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
      course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
      semester INTEGER NOT NULL,
      exam_date VARCHAR(50) NOT NULL,
      start_time VARCHAR(20) NOT NULL,
      end_time VARCHAR(20) NOT NULL,
      room VARCHAR(50) NOT NULL,
      max_marks INTEGER DEFAULT 100,
      passing_marks INTEGER DEFAULT 40,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS marks (
      id SERIAL PRIMARY KEY,
      student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
      exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
      subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
      marks_obtained NUMERIC(5,2) NOT NULL,
      max_marks NUMERIC(5,2) DEFAULT 100,
      grade VARCHAR(10) NOT NULL,
      remarks TEXT,
      entered_by_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT unique_student_exam_subject UNIQUE (student_id, exam_id, subject_id)
    );

    CREATE TABLE IF NOT EXISTS fees (
      id SERIAL PRIMARY KEY,
      student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
      academic_year VARCHAR(50) NOT NULL,
      semester INTEGER NOT NULL,
      total_fee NUMERIC(10,2) NOT NULL,
      paid_amount NUMERIC(10,2) DEFAULT 0,
      remaining_amount NUMERIC(10,2) NOT NULL,
      due_date VARCHAR(50) NOT NULL,
      payment_status VARCHAR(50) DEFAULT 'Pending',
      payment_date VARCHAR(50),
      receipt_no VARCHAR(100),
      payment_method VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS timetable (
      id SERIAL PRIMARY KEY,
      day_of_week VARCHAR(20) NOT NULL,
      start_time VARCHAR(20) NOT NULL,
      end_time VARCHAR(20) NOT NULL,
      subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
      teacher_id INTEGER REFERENCES teachers(id) ON DELETE SET NULL,
      room VARCHAR(50) NOT NULL,
      course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
      semester INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      priority VARCHAR(20) DEFAULT 'Normal',
      target_audience VARCHAR(50) DEFAULT 'All',
      published_date VARCHAR(50) NOT NULL,
      author_name VARCHAR(255) NOT NULL,
      author_role VARCHAR(50) NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Check if seeded
  let needsSeed = false;
  try {
    const deptCheck = await queryOne('SELECT id FROM departments LIMIT 1');
    if (!deptCheck) needsSeed = true;
  } catch {
    needsSeed = true;
  }

  if (needsSeed) {
    console.log('Seeding initial data for EduManage PostgreSQL database...');
    await seedDatabase();
  }

  isInitialized = true;
}

export async function seedDatabase() {
  const db = await getDb();
  try {
    await db.exec('TRUNCATE users, departments, courses, teachers, subjects, students, attendance, exams, marks, fees, timetable, announcements RESTART IDENTITY CASCADE;');
  } catch (err) {
    // Tables may be newly created, ignore if empty or fresh
  }
  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Admin user
  const adminUser = await queryOne(
    `INSERT INTO users (email, password, role, name)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    ['admin@edumanage.edu', hashedPassword, 'admin', 'System Administrator']
  );

  // 2. Departments
  const csDept = await queryOne(
    `INSERT INTO departments (name, code, description)
     VALUES ($1, $2, $3) RETURNING id`,
    ['Computer Science & Engineering', 'CSE', 'Department of Computer Science and Engineering']
  );

  const itDept = await queryOne(
    `INSERT INTO departments (name, code, description)
     VALUES ($1, $2, $3) RETURNING id`,
    ['Information Technology', 'IT', 'Department of Information Technology & Software Systems']
  );

  const eceDept = await queryOne(
    `INSERT INTO departments (name, code, description)
     VALUES ($1, $2, $3) RETURNING id`,
    ['Electronics & Communication', 'ECE', 'Department of Electronics & Communication Engineering']
  );

  // 3. Courses
  const btechCs = await queryOne(
    `INSERT INTO courses (name, code, department_id, duration_years, total_semesters)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    ['B.Tech in Computer Science', 'BTECH-CS', csDept.id, 4, 8]
  );

  const bca = await queryOne(
    `INSERT INTO courses (name, code, department_id, duration_years, total_semesters)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    ['Bachelor of Computer Applications', 'BCA', itDept.id, 3, 6]
  );

  const bscIt = await queryOne(
    `INSERT INTO courses (name, code, department_id, duration_years, total_semesters)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    ['B.Sc in Information Technology', 'BSC-IT', itDept.id, 3, 6]
  );

  // 4. Teachers (3 Teachers)
  const teacher1User = await queryOne(
    `INSERT INTO users (email, password, role, name) VALUES ($1, $2, $3, $4) RETURNING id`,
    ['dr.sharma@edumanage.edu', hashedPassword, 'teacher', 'Dr. Rajesh Sharma']
  );
  const teacher1 = await queryOne(
    `INSERT INTO teachers (teacher_id, user_id, name, email, phone, department_id, qualification, designation, joining_date, address)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
    ['TCH-101', teacher1User.id, 'Dr. Rajesh Sharma', 'dr.sharma@edumanage.edu', '+1 (555) 234-5678', csDept.id, 'Ph.D. in Computer Science', 'Professor & HOD', '2019-07-15', 'Faculty Enclave, Block A-12']
  );

  const teacher2User = await queryOne(
    `INSERT INTO users (email, password, role, name) VALUES ($1, $2, $3, $4) RETURNING id`,
    ['prof.priya@edumanage.edu', hashedPassword, 'teacher', 'Prof. Priya Verma']
  );
  const teacher2 = await queryOne(
    `INSERT INTO teachers (teacher_id, user_id, name, email, phone, department_id, qualification, designation, joining_date, address)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
    ['TCH-102', teacher2User.id, 'Prof. Priya Verma', 'prof.priya@edumanage.edu', '+1 (555) 345-6789', itDept.id, 'M.Tech in Information Technology', 'Associate Professor', '2021-08-01', 'Green View Apartments, Flat 304']
  );

  const teacher3User = await queryOne(
    `INSERT INTO users (email, password, role, name) VALUES ($1, $2, $3, $4) RETURNING id`,
    ['prof.anand@edumanage.edu', hashedPassword, 'teacher', 'Prof. Anand Rao']
  );
  const teacher3 = await queryOne(
    `INSERT INTO teachers (teacher_id, user_id, name, email, phone, department_id, qualification, designation, joining_date, address)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
    ['TCH-103', teacher3User.id, 'Prof. Anand Rao', 'prof.anand@edumanage.edu', '+1 (555) 456-7890', eceDept.id, 'M.E. in Electronics & Communication', 'Assistant Professor', '2022-01-10', 'Hilltop Residency, Tower B-502']
  );

  // 5. Subjects
  const javaSub = await queryOne(
    `INSERT INTO subjects (name, code, course_id, semester, credits, teacher_id)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    ['Java Programming', 'CS401', btechCs.id, 4, 4, teacher1.id]
  );

  const dsaSub = await queryOne(
    `INSERT INTO subjects (name, code, course_id, semester, credits, teacher_id)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    ['Data Structures & Algorithms', 'CS402', btechCs.id, 4, 4, teacher1.id]
  );

  const dbmsSub = await queryOne(
    `INSERT INTO subjects (name, code, course_id, semester, credits, teacher_id)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    ['Database Management Systems', 'CS403', btechCs.id, 4, 4, teacher2.id]
  );

  const webTechSub = await queryOne(
    `INSERT INTO subjects (name, code, course_id, semester, credits, teacher_id)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    ['Web Technologies', 'IT201', bca.id, 2, 3, teacher2.id]
  );

  const netSub = await queryOne(
    `INSERT INTO subjects (name, code, course_id, semester, credits, teacher_id)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    ['Computer Networks', 'CS404', btechCs.id, 4, 3, teacher3.id]
  );

  const osSub = await queryOne(
    `INSERT INTO subjects (name, code, course_id, semester, credits, teacher_id)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    ['Operating Systems', 'IT301', bscIt.id, 3, 4, teacher3.id]
  );

  // 6. Students (10 Students)
  const studentData = [
    { id: 'STU2024001', name: 'Aarav Sharma', email: 'arav.sharma@student.edu', phone: '+1 (555) 789-0101', dob: '2004-05-14', gender: 'Male', dept: csDept.id, course: btechCs.id, sem: 4, adm: '2022-08-10', guardian: 'Suresh Sharma', gPhone: '+1 (555) 789-0199', feeTotal: 45000, feePaid: 45000, feeStatus: 'Paid' },
    { id: 'STU2024002', name: 'Sneha Patel', email: 'sneha.patel@student.edu', phone: '+1 (555) 789-0102', dob: '2004-09-22', gender: 'Female', dept: csDept.id, course: btechCs.id, sem: 4, adm: '2022-08-10', guardian: 'Bhavesh Patel', gPhone: '+1 (555) 789-0198', feeTotal: 45000, feePaid: 30000, feeStatus: 'Partially Paid' },
    { id: 'STU2024003', name: 'Rohan Gupta', email: 'rohan.gupta@student.edu', phone: '+1 (555) 789-0103', dob: '2003-11-05', gender: 'Male', dept: csDept.id, course: btechCs.id, sem: 4, adm: '2022-08-10', guardian: 'Vinod Gupta', gPhone: '+1 (555) 789-0197', feeTotal: 45000, feePaid: 45000, feeStatus: 'Paid' },
    { id: 'STU2024004', name: 'Ananya Singh', email: 'ananya.singh@student.edu', phone: '+1 (555) 789-0104', dob: '2005-03-18', gender: 'Female', dept: itDept.id, course: bca.id, sem: 2, adm: '2023-08-12', guardian: 'Pradeep Singh', gPhone: '+1 (555) 789-0196', feeTotal: 38000, feePaid: 0, feeStatus: 'Pending' },
    { id: 'STU2024005', name: 'Vikram Aditya', email: 'vikram.aditya@student.edu', phone: '+1 (555) 789-0105', dob: '2004-12-30', gender: 'Male', dept: itDept.id, course: bca.id, sem: 2, adm: '2023-08-12', guardian: 'Manoj Aditya', gPhone: '+1 (555) 789-0195', feeTotal: 38000, feePaid: 38000, feeStatus: 'Paid' },
    { id: 'STU2024006', name: 'Ishaan Verma', email: 'ishaan.verma@student.edu', phone: '+1 (555) 789-0106', dob: '2004-07-09', gender: 'Male', dept: itDept.id, course: bscIt.id, sem: 3, adm: '2023-01-15', guardian: 'Dinesh Verma', gPhone: '+1 (555) 789-0194', feeTotal: 40000, feePaid: 20000, feeStatus: 'Partially Paid' },
    { id: 'STU2024007', name: 'Diya Reddy', email: 'diya.reddy@student.edu', phone: '+1 (555) 789-0107', dob: '2004-02-14', gender: 'Female', dept: csDept.id, course: btechCs.id, sem: 4, adm: '2022-08-10', guardian: 'Kalyan Reddy', gPhone: '+1 (555) 789-0193', feeTotal: 45000, feePaid: 45000, feeStatus: 'Paid' },
    { id: 'STU2024008', name: 'Kabir Mehta', email: 'kabir.mehta@student.edu', phone: '+1 (555) 789-0108', dob: '2003-08-27', gender: 'Male', dept: csDept.id, course: btechCs.id, sem: 4, adm: '2022-08-10', guardian: 'Sanjay Mehta', gPhone: '+1 (555) 789-0192', feeTotal: 45000, feePaid: 15000, feeStatus: 'Partially Paid' },
    { id: 'STU2024009', name: 'Tanvi Joshi', email: 'tanvi.joshi@student.edu', phone: '+1 (555) 789-0109', dob: '2005-06-01', gender: 'Female', dept: itDept.id, course: bca.id, sem: 2, adm: '2023-08-12', guardian: 'Ashok Joshi', gPhone: '+1 (555) 789-0191', feeTotal: 38000, feePaid: 38000, feeStatus: 'Paid' },
    { id: 'STU2024010', name: 'Aditya Nair', email: 'aditya.nair@student.edu', phone: '+1 (555) 789-0110', dob: '2004-10-11', gender: 'Male', dept: itDept.id, course: bscIt.id, sem: 3, adm: '2023-01-15', guardian: 'Ramesh Nair', gPhone: '+1 (555) 789-0190', feeTotal: 40000, feePaid: 40000, feeStatus: 'Paid' }
  ];

  const studentRows = [];
  for (const s of studentData) {
    const sUser = await queryOne(
      `INSERT INTO users (email, password, role, name) VALUES ($1, $2, $3, $4) RETURNING id`,
      [s.email, hashedPassword, 'student', s.name]
    );

    const sRow = await queryOne(
      `INSERT INTO students (student_id, user_id, name, email, phone, dob, gender, address, department_id, course_id, semester, admission_date, profile_image, guardian_name, guardian_phone, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING id`,
      [s.id, sUser.id, s.name, s.email, s.phone, s.dob, s.gender, 'Campus Hostels, University Campus', s.dept, s.course, s.sem, s.adm, `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(s.name)}`, s.guardian, s.gPhone, 'Active']
    );
    studentRows.push({ ...s, id: sRow.id, student_code: s.id });

    // Insert fee record
    const remaining = s.feeTotal - s.feePaid;
    await query(
      `INSERT INTO fees (student_id, academic_year, semester, total_fee, paid_amount, remaining_amount, due_date, payment_status, payment_date, receipt_no, payment_method)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [sRow.id, '2026-2027', s.sem, s.feeTotal, s.feePaid, remaining, '2026-11-30', s.feeStatus, s.feePaid > 0 ? '2026-09-10' : null, s.feePaid > 0 ? `REC-${s.id}-${s.sem}` : null, s.feePaid > 0 ? 'Online NetBanking' : null]
    );
  }

  // 7. Seed Attendance for Aarav Sharma (STU2024001) & other CS students
  // Aarav has:
  // Java: 22 present out of 25 (88%)
  // DBMS: 20 present out of 25 (80%)
  // DSA: 23 present out of 25 (92%)
  // Computer Networks: 21 present out of 25 (84%)
  const aarav = studentRows[0];
  const csSubjects = [
    { subId: javaSub.id, presentCount: 22, total: 25 },
    { subId: dbmsSub.id, presentCount: 20, total: 25 },
    { subId: dsaSub.id, presentCount: 23, total: 25 },
    { subId: netSub.id, presentCount: 21, total: 25 }
  ];

  // Dates over the past few weeks
  for (const csSub of csSubjects) {
    for (let day = 1; day <= 25; day++) {
      const month = day <= 15 ? '02' : '03';
      const dayStr = String(day).padStart(2, '0');
      const date = `2026-${month}-${dayStr}`;
      const isPresent = day <= csSub.presentCount;
      await query(
        `INSERT INTO attendance (student_id, subject_id, date, status, marked_by_id, remarks)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (student_id, subject_id, date) DO NOTHING`,
        [aarav.id, csSub.subId, date, isPresent ? 'Present' : 'Absent', teacher1.id, isPresent ? 'Regular attendance' : 'Absent without leave']
      );
    }
  }

  // Also seed attendance for other students
  for (let i = 1; i < studentRows.length; i++) {
    const st = studentRows[i];
    const subId = st.course === btechCs.id ? javaSub.id : webTechSub.id;
    for (let day = 1; day <= 15; day++) {
      const date = `2026-03-${String(day).padStart(2, '0')}`;
      const isPresent = (day + i) % 4 !== 0;
      await query(
        `INSERT INTO attendance (student_id, subject_id, date, status, marked_by_id, remarks)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (student_id, subject_id, date) DO NOTHING`,
        [st.id, subId, date, isPresent ? 'Present' : 'Absent', teacher1.id, isPresent ? 'Present' : 'Absent']
      );
    }
  }

  // 8. Exams
  const midTermExam = await queryOne(
    `INSERT INTO exams (name, subject_id, course_id, semester, exam_date, start_time, end_time, room, max_marks, passing_marks)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
    ['Semester Mid-Term Exam Fall 2026', javaSub.id, btechCs.id, 4, '2026-11-10', '10:00 AM', '12:00 PM', 'Hall 301', 100, 40]
  );

  const dbmsExam = await queryOne(
    `INSERT INTO exams (name, subject_id, course_id, semester, exam_date, start_time, end_time, room, max_marks, passing_marks)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
    ['Semester Mid-Term Exam Fall 2026', dbmsSub.id, btechCs.id, 4, '2026-11-12', '10:00 AM', '12:00 PM', 'Hall 302', 100, 40]
  );

  const dsaExam = await queryOne(
    `INSERT INTO exams (name, subject_id, course_id, semester, exam_date, start_time, end_time, room, max_marks, passing_marks)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
    ['Semester Mid-Term Exam Fall 2026', dsaSub.id, btechCs.id, 4, '2026-11-15', '02:00 PM', '04:00 PM', 'Hall 301', 100, 40]
  );

  const webTechExam = await queryOne(
    `INSERT INTO exams (name, subject_id, course_id, semester, exam_date, start_time, end_time, room, max_marks, passing_marks)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
    ['Unit Test 2 - Web Tech', webTechSub.id, bca.id, 2, '2026-11-18', '11:00 AM', '01:00 PM', 'Lab 2', 50, 20]
  );

  // 9. Marks
  // Marks for Aarav Sharma
  const marksData = [
    { studentId: aarav.id, examId: midTermExam.id, subId: javaSub.id, marks: 92, maxMarks: 100, grade: 'A+', remarks: 'Exceptional performance in OOP concepts' },
    { studentId: aarav.id, examId: dbmsExam.id, subId: dbmsSub.id, marks: 85, maxMarks: 100, grade: 'A', remarks: 'Good grasp of SQL queries and normalization' },
    { studentId: aarav.id, examId: dsaExam.id, subId: dsaSub.id, marks: 88, maxMarks: 100, grade: 'A', remarks: 'Well-structured solutions for tree traversals' }
  ];

  for (const m of marksData) {
    await query(
      `INSERT INTO marks (student_id, exam_id, subject_id, marks_obtained, max_marks, grade, remarks, entered_by_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (student_id, exam_id, subject_id) DO NOTHING`,
      [m.studentId, m.examId, m.subId, m.marks, m.maxMarks, m.grade, m.remarks, teacher1.id]
    );
  }

  // Marks for other students
  for (let i = 1; i < 4; i++) {
    const st = studentRows[i];
    await query(
      `INSERT INTO marks (student_id, exam_id, subject_id, marks_obtained, max_marks, grade, remarks, entered_by_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (student_id, exam_id, subject_id) DO NOTHING`,
      [st.id, midTermExam.id, javaSub.id, 75 + i * 5, 100, i === 1 ? 'A' : 'B+', 'Consistent effort', teacher1.id]
    );
  }

  // 10. Timetable
  const timetableEntries = [
    { day: 'Monday', start: '09:00 AM', end: '10:30 AM', sub: javaSub.id, teacher: teacher1.id, room: 'Lecture Hall 101', course: btechCs.id, sem: 4 },
    { day: 'Monday', start: '11:00 AM', end: '12:30 PM', sub: dbmsSub.id, teacher: teacher2.id, room: 'Lecture Hall 102', course: btechCs.id, sem: 4 },
    { day: 'Tuesday', start: '09:00 AM', end: '10:30 AM', sub: dsaSub.id, teacher: teacher1.id, room: 'Lecture Hall 101', course: btechCs.id, sem: 4 },
    { day: 'Tuesday', start: '02:00 PM', end: '04:00 PM', sub: javaSub.id, teacher: teacher1.id, room: 'Computing Lab 1', course: btechCs.id, sem: 4 },
    { day: 'Wednesday', start: '10:00 AM', end: '11:30 AM', sub: netSub.id, teacher: teacher3.id, room: 'Lecture Hall 103', course: btechCs.id, sem: 4 },
    { day: 'Wednesday', start: '01:30 PM', end: '03:00 PM', sub: dbmsSub.id, teacher: teacher2.id, room: 'Database Lab 2', course: btechCs.id, sem: 4 },
    { day: 'Thursday', start: '09:00 AM', end: '10:30 AM', sub: dsaSub.id, teacher: teacher1.id, room: 'Lecture Hall 101', course: btechCs.id, sem: 4 },
    { day: 'Thursday', start: '11:00 AM', end: '12:30 PM', sub: netSub.id, teacher: teacher3.id, room: 'Lecture Hall 103', course: btechCs.id, sem: 4 },
    { day: 'Friday', start: '09:00 AM', end: '11:00 AM', sub: javaSub.id, teacher: teacher1.id, room: 'Computing Lab 1', course: btechCs.id, sem: 4 },
    { day: 'Friday', start: '02:00 PM', end: '03:30 PM', sub: dbmsSub.id, teacher: teacher2.id, room: 'Lecture Hall 102', course: btechCs.id, sem: 4 }
  ];

  for (const t of timetableEntries) {
    await query(
      `INSERT INTO timetable (day_of_week, start_time, end_time, subject_id, teacher_id, room, course_id, semester)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [t.day, t.start, t.end, t.sub, t.teacher, t.room, t.course, t.sem]
    );
  }

  // 11. Announcements
  const announcements = [
    {
      title: 'Spring 2026 Mid-Semester Examination Schedule Announced',
      description: 'The timetable for Mid-Semester examinations has been officially published. Students are advised to verify their seating arrangement and admit cards in advance. Strict adherence to academic honesty policies is required.',
      priority: 'Urgent',
      audience: 'All',
      date: '2026-03-28',
      author: 'Office of the Registrar',
      role: 'Admin'
    },
    {
      title: 'Faculty Meeting: Academic Curriculum Review',
      description: 'All department heads and teaching faculty members are requested to attend the semester curriculum review meeting on April 5th at 3:00 PM in Conference Hall A.',
      priority: 'Important',
      audience: 'Teachers',
      date: '2026-03-25',
      author: 'Academic Dean',
      role: 'Admin'
    },
    {
      title: 'Semester Fee Payment Deadline Extended',
      description: 'The deadline for payment of Semester 4 tuition fees without late fine has been extended until April 15, 2026. Payments can be submitted directly through the online EduManage student portal.',
      priority: 'Important',
      audience: 'Students',
      date: '2026-03-20',
      author: 'Finance & Accounts Division',
      role: 'Admin'
    },
    {
      title: 'Annual College Hackathon & Tech Fest 2026 Registration Open',
      description: 'Registrations are now live for InnovateTech 2026! Cash prizes worth $5,000 to be won across Web, AI, and Cybersecurity tracks. Form teams of 2 to 4 students and submit your proposals.',
      priority: 'Normal',
      audience: 'Students',
      date: '2026-03-15',
      author: 'Computer Science Department',
      role: 'Teacher'
    }
  ];

  for (const a of announcements) {
    await query(
      `INSERT INTO announcements (title, description, priority, target_audience, published_date, author_name, author_role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [a.title, a.description, a.priority, a.audience, a.date, a.author, a.role, true]
    );
  }

  console.log('Database seeded successfully with Admin, 3 Teachers, 10 Students, Classes, Timetable, Attendance, Exams, Marks, Fees, and Announcements!');
}
