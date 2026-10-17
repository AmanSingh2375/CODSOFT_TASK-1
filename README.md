# EduManage – Student Management System
*A Capstone Full Stack Web Development Academic Project*

---

## 1. Project Overview

**EduManage** is a modern, full-stack centralized education management platform engineered to digitize, automate, and streamline academic and administrative workflows in colleges and universities.

The platform provides dedicated, role-based dashboards and capabilities for three primary user personas:
1. **Administrators** – Full institutional administration across admissions, faculty appointments, curriculum, examinations, fee ledgers, timetable generation, and campus-wide bulletins.
2. **Teachers / Faculty** – Real-time lecture roll-call attendance marking, examination paper grading, student roster monitoring, and personal teaching schedule view.
3. **Students** – Self-service portal to monitor live attendance percentages (including subject-wise stats like Java 88%, DBMS 80%, DSA 92%), examination results, semester SGPA transcripts, semester fee statuses with simulated payment checkout, class schedules, and official notices.

---

## 2. Technology Stack

### Frontend
- **Framework**: React 19 with Vite
- **Routing**: React Router 7 (App Routing with URL synchronization)
- **Styling**: Tailwind CSS v4 (Modern responsive utility system)
- **Icons**: Lucide React
- **HTTP Client**: Typed Fetch API Wrapper with JWT bearer token injection

### Backend
- **Runtime**: Node.js (v22.x LTS)
- **Web Framework**: Express.js REST APIs
- **Authentication**: JSON Web Tokens (`jsonwebtoken`) & password salting (`bcryptjs`)
- **Process Runner**: `tsx` (TypeScript Execution)

### Database & ORM
- **Database Engine**: PostgreSQL 16 (executed via embedded persistent WASM engine `@electric-sql/pglite` stored to `./data/edumanage-pg`, compatible with external PostgreSQL instances)
- **ORM / Schema**: Prisma ORM (`prisma/schema.prisma`) with full relational constraints, foreign keys, and indexes

---

## 3. User Roles & Permission Matrix

| Feature / Module | Administrator | Teacher | Student |
|---|:---:|:---:|:---:|
| **Student Management** (Add, Edit, Delete, View) | Full CRUD | View Assigned | View Self Profile |
| **Faculty Management** (Add, Edit, Delete, Subjects) | Full CRUD | View Self Profile | View Instructor Info |
| **Daily Attendance** | View All / Override | Mark Class Roster | View Subject-wise % |
| **Examinations** | Schedule / Manage | View Schedules | View Timetable |
| **Marks & Grading** | Manage All Transcripts | Enter & Grade Marks | View SGPA & Transcripts |
| **Fee Management** | Invoices & Receipts | None | View Dues & Mock Pay |
| **Timetable Matrix** | Create & Allocate Halls | View Teaching Schedule | View Class Timetable |
| **Announcements** | Publish & Broadcast | Post Student Notices | Read Bulletins |

---

## 4. Test Login Credentials

All sample accounts are pre-seeded in the database with the default password `password123`. The landing page and login screens also feature 1-click test login buttons for rapid reviewer evaluation:

| Role | Name | Email Address | Password | Sample Role Details |
|---|---|---|---|---|
| **Administrator** | System Administrator | `admin@edumanage.edu` | `password123` | Full Institutional Superadmin |
| **Teacher** | Dr. Rajesh Sharma | `dr.sharma@edumanage.edu` | `password123` | HOD Computer Science, Taught: Java, DSA |
| **Teacher** | Prof. Priya Verma | `prof.priya@edumanage.edu` | `password123` | Assoc. Prof IT, Taught: DBMS, Web Tech |
| **Teacher** | Prof. Anand Rao | `prof.anand@edumanage.edu` | `password123` | Asst. Prof ECE, Taught: Networks, OS |
| **Student** | Aarav Sharma | `arav.sharma@student.edu` | `password123` | B.Tech CS Sem 4, STU2024001, Java 88%, DSA 92% |
| **Student** | Sneha Patel | `sneha.patel@student.edu` | `password123` | B.Tech CS Sem 4, STU2024002 |
| **Student** | Ananya Singh | `ananya.singh@student.edu` | `password123` | BCA Sem 2, STU2024004 |
| **Student** | Ishaan Verma | `ishaan.verma@student.edu` | `password123` | B.Sc IT Sem 3, STU2024006 |

---

## 5. Relational Database Schema

The database models are specified in `prisma/schema.prisma` and mirrored in the PostgreSQL schema:

```
+-------------+         +----------------+
|    User     | 1 --- 1 |    Student     | 1 --- * Attendance
| (Auth/Role) |         +----------------+ 1 --- * Marks
+-------------+                | 1         1 --- * Fee
       | 1                     | *
       | 1              +----------------+
+-------------+         |     Course     | 1 --- * Timetable
|   Teacher   |         +----------------+ 1 --- * Exam
+-------------+                | *
       | 1                     | 1
       | *              +----------------+
+-------------+         |   Department   |
|   Subject   |         +----------------+
+-------------+
```

### Table Definitions:
1. `users` – `(id, email, password, role, name, created_at)`
2. `departments` – `(id, name, code, description)`
3. `courses` – `(id, name, code, department_id, duration_years, total_semesters)`
4. `teachers` – `(id, teacher_id, user_id, name, email, phone, department_id, qualification, designation, joining_date, address)`
5. `subjects` – `(id, name, code, course_id, semester, credits, teacher_id)`
6. `students` – `(id, student_id, user_id, name, email, phone, dob, gender, address, department_id, course_id, semester, admission_date, profile_image, guardian_name, guardian_phone, status)`
7. `attendance` – `(id, student_id, subject_id, date, status, marked_by_id, remarks)` [Unique constraint on `student_id, subject_id, date`]
8. `exams` – `(id, name, subject_id, course_id, semester, exam_date, start_time, end_time, room, max_marks, passing_marks)`
9. `marks` – `(id, student_id, exam_id, subject_id, marks_obtained, max_marks, grade, remarks, entered_by_id)`
10. `fees` – `(id, student_id, academic_year, semester, total_fee, paid_amount, remaining_amount, due_date, payment_status, payment_date, receipt_no, payment_method)`
11. `timetable` – `(id, day_of_week, start_time, end_time, subject_id, teacher_id, room, course_id, semester)`
12. `announcements` – `(id, title, description, priority, target_audience, published_date, author_name, author_role, is_active)`

---

## 6. REST API Endpoints

### Authentication & Self-Service
- `POST /api/auth/login` – Authenticate with email & password, returns JWT token & user payload
- `POST /api/auth/register` – Student registration with department, program, semester, and guardian info
- `GET  /api/auth/me` – Retrieve verified authenticated profile

### Academic Metadata
- `GET  /api/departments` – Retrieve all academic departments
- `GET  /api/courses` – Retrieve degree programs
- `GET  /api/subjects` – Retrieve all semester subjects with instructors

### Student Operations
- `GET    /api/students` – Search and filter students by department, program, semester
- `GET    /api/students/:id` – Detailed student record with attendance rates, marks, fee ledger
- `POST   /api/students` – [Admin] Create student & auto-generate user login credentials
- `PUT    /api/students/:id` – [Admin] Update student details
- `DELETE /api/students/:id` – [Admin] Delete student & cascade records

### Faculty Operations
- `GET    /api/teachers` – Retrieve faculty directory with assigned subjects
- `GET    /api/teachers/:id` – Detailed faculty profile with assigned courses & timetable
- `POST   /api/teachers` – [Admin] Appoint new faculty instructor
- `PUT    /api/teachers/:id` – [Admin] Update teacher details and subject assignments
- `DELETE /api/teachers/:id` – [Admin] Remove faculty member

### Attendance Operations
- `GET  /api/attendance` – Filter roll logs by course, semester, subject, date
- `GET  /api/attendance/summary/:studentId` – Aggregate subject-wise attendance summary (Java 22/25 88%, etc.)
- `POST /api/attendance` – [Faculty/Admin] Bulk or single attendance marking (Present / Absent / Late)
- `PUT  /api/attendance/:id` – [Faculty/Admin] Update single attendance entry

### Examinations & Grading
- `GET    /api/exams` – Retrieve examination schedules
- `POST   /api/exams` – [Admin] Schedule new exam with room & timing
- `PUT    /api/exams/:id` – [Admin] Edit examination schedule
- `DELETE /api/exams/:id` – [Admin] Cancel/delete exam
- `GET    /api/marks` – Filter marks by exam, subject, student
- `GET    /api/marks/student/:studentId` – Complete academic transcript, GPA calculation, subject breakdown
- `POST   /api/marks` – [Faculty/Admin] Enter marks obtained with auto grade calculation (A+, A, B, etc.)
- `PUT    /api/marks/:id` – [Faculty/Admin] Update marks entry

### Fee Management
- `GET  /api/fees` – Retrieve fee accounts and payment statuses (Paid, Partially Paid, Pending)
- `POST /api/fees` – [Admin] Issue semester fee record
- `PUT  /api/fees/:id` – [Admin] Update fee details
- `POST /api/fees/:id/pay` – Simulated mock checkout generating official receipt number

### Timetable & Schedules
- `GET    /api/timetable` – Retrieve weekly schedule matrix by course, semester, or teacher
- `POST   /api/timetable` – [Admin] Add lecture time slot
- `PUT    /api/timetable/:id` – [Admin] Update timetable entry
- `DELETE /api/timetable/:id` – [Admin] Remove timetable slot

### Announcements & Bulletins
- `GET    /api/announcements` – Retrieve active announcements filtered by target audience and priority
- `POST   /api/announcements` – [Admin/Faculty] Publish campus announcement
- `PUT    /api/announcements/:id` – [Admin/Faculty] Edit announcement
- `DELETE /api/announcements/:id` – [Admin/Faculty] Remove notice

---

## 7. Installation & Setup Instructions

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Step 1: Clone or Open Workspace
```bash
git clone <repository_url>
cd edumanage
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default configuration values:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/edumanage?schema=public"
JWT_SECRET="edumanage-super-secure-secret-key-college-project-2026"
PORT=3000
```

### Step 4: Run Application
To start the unified Full Stack development server (serving Express backend APIs and Vite React frontend concurrently on port 3000):
```bash
npm run dev
```

The database initializes automatically on startup and self-seeds all Admin, Teachers, Students, Courses, Attendance, Exams, Marks, Fees, Timetable, and Announcements data if not already present.

### Step 5: (Optional) External PostgreSQL with Prisma
To migrate schema to an external PostgreSQL database:
```bash
npx prisma db push
npx tsx prisma/seed.ts
```

### Step 6: Build for Production
```bash
npm run build
npm start
```

---

## 8. Frontend-Backend-Database Architecture

```
[ Client Browser: React 19 SPA ]
          |
          | HTTP REST (JSON) + Authorization: Bearer <JWT>
          v
[ Node.js + Express.js Backend Server (server.ts) ]
          |
          +---> auth.ts (JWT verification & Role Guards: requireRole)
          +---> routes.ts (CRUD endpoints, Input validation, Error handling)
          |
          v
[ PostgreSQL Relational Database Engine ]
   (Users, Students, Teachers, Courses, Attendance, Marks, Fees, Timetable)
```

1. **State Isolation**: User JWT tokens are held in client storage and sent via `Authorization: Bearer <token>` on all API calls.
2. **Role Guards**: Express middleware validates the token signature and verifies role authorization (`admin`, `teacher`, `student`).
3. **Database Relational Integrity**: All queries utilize relational joins and foreign key constraints to ensure consistency across students, departments, courses, teachers, and grades.
