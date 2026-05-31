// seed-users.js — seeds consistent mock users and demo data for student, instructor, admin
const crypto = require('crypto');

function uuidv4() {
  return crypto.randomUUID();
}

function seedUsers(db) {
  // Guard: only seed enrollments if student-1 has none yet
  const existingEnrollments = db.prepare("SELECT COUNT(*) as c FROM enrollments WHERE student_id = 'student-1'").get();
  if (existingEnrollments?.c > 0) return;

  console.log('[DB] Seeding mock users and demo data...');

  // ── Users ──────────────────────────────────────────────────────────────────

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users
      (id, email, name, role, student_id, program, year_level, badges,
       total_cpd_units, total_certificates, total_courses_completed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Student
  insertUser.run(
    'student-1', 'student@lnu.edu.ph', 'Maria Santos', 'student',
    '2021-00123', 'BS Information Technology', 3,
    JSON.stringify([
      { id: 'first-login',  name: 'First Steps',   icon: '🎯' },
      { id: 'fast-learner', name: 'Fast Learner',  icon: '⚡' },
      { id: 'quiz-master',  name: 'Quiz Master',   icon: '🏆' },
    ]),
    5, 1, 1
  );

  // Also update if already exists (name may be the old placeholder)
  db.prepare(`UPDATE users SET name = 'Maria Santos', student_id = '2021-00123',
    program = 'BS Information Technology', year_level = 3,
    total_cpd_units = 5, total_certificates = 1, total_courses_completed = 1
    WHERE id = 'student-1'`).run();

  // Instructor
  insertUser.run(
    'instructor-1', 'instructor@lnu.edu.ph', 'Dr. John Rivera', 'instructor',
    null, null, null,
    JSON.stringify([
      { id: 'educator',       name: 'Educator',         icon: '👨‍🏫' },
      { id: 'content-creator',name: 'Content Creator',  icon: '✍️'  },
    ]),
    0, 0, 0
  );
  db.prepare(`UPDATE users SET name = 'Dr. John Rivera' WHERE id = 'instructor-1'`).run();

  // Admin
  insertUser.run(
    'admin-1', 'admin@lnu.edu.ph', 'CCELL Administrator', 'admin',
    null, null, null,
    JSON.stringify([
      { id: 'administrator',    name: 'Administrator',    icon: '👑' },
      { id: 'platform-manager', name: 'Platform Manager', icon: '⚙️' },
    ]),
    0, 0, 0
  );
  db.prepare(`UPDATE users SET name = 'CCELL Administrator' WHERE id = 'admin-1'`).run();

  // Extra students (for admin dashboards, payment queues, etc.)
  const extraStudents = [
    ['student-demo-2', 'juan.delacruz@lnu.edu.ph',   'Juan Dela Cruz',    '2022-00456', 'BS Computer Science',      2],
    ['student-demo-3', 'ana.reyes@lnu.edu.ph',        'Ana Reyes',         '2020-00789', 'BS Information Systems',   4],
    ['student-demo-4', 'carlo.santos@lnu.edu.ph',     'Carlo Santos',      '2023-00321', 'BS Computer Engineering',  1],
    ['student-demo-5', 'lisa.mendoza@lnu.edu.ph',     'Lisa Mendoza',      '2021-00654', 'BS Information Technology',3],
    ['student-demo-6', 'miguel.garcia@lnu.edu.ph',    'Miguel Garcia',     '2022-00987', 'BS Computer Science',      2],
  ];
  for (const [id, email, name, sid, prog, yr] of extraStudents) {
    db.prepare(`INSERT OR IGNORE INTO users (id, email, name, role, student_id, program, year_level, badges)
      VALUES (?, ?, ?, 'student', ?, ?, ?, '[]')`).run(id, email, name, sid, prog, yr);
  }

  // ── Link instructor to courses ─────────────────────────────────────────────

  db.prepare(`UPDATE courses SET instructor_id = 'instructor-1' WHERE id IN ('1','2','3','4')`).run();

  // ── Enrollments ────────────────────────────────────────────────────────────

  // Use fixed IDs so we can reference them later
  const E1 = 'enrollment-s1-c1'; // Course 1 — active, ~50%
  const E2 = 'enrollment-s1-c2'; // Course 2 — completed, 100%
  const E3 = 'enrollment-s1-c3'; // Course 3 — active, ~25%

  db.prepare(`INSERT OR IGNORE INTO enrollments
    (id, student_id, course_id, enrollment_type, status, payment_status, payment_method, payment_amount, progress_percentage)
    VALUES (?, 'student-1', '1', 'certificatory', 'active', 'verified', 'gcash', 2500, 0)`).run(E1);

  db.prepare(`INSERT OR IGNORE INTO enrollments
    (id, student_id, course_id, enrollment_type, status, payment_status, payment_method, payment_amount, progress_percentage, completed_at)
    VALUES (?, 'student-1', '2', 'academe_student', 'completed', 'verified', 'class_code', 0, 100, datetime('now', '-14 days'))`).run(E2);

  db.prepare(`INSERT OR IGNORE INTO enrollments
    (id, student_id, course_id, enrollment_type, status, payment_status, payment_method, payment_amount, progress_percentage)
    VALUES (?, 'student-1', '3', 'certificatory', 'active', 'verified', 'maya', 3500, 0)`).run(E3);

  // ── Lesson Progress ────────────────────────────────────────────────────────

  const lessons1 = db.prepare("SELECT id FROM lessons WHERE course_id = '1' ORDER BY lesson_order").all();
  const lessons2 = db.prepare("SELECT id FROM lessons WHERE course_id = '2' ORDER BY lesson_order").all();
  const lessons3 = db.prepare("SELECT id FROM lessons WHERE course_id = '3' ORDER BY lesson_order").all();

  // Course 1: complete first half of lessons
  const half1 = Math.ceil(lessons1.length / 2);
  for (const l of lessons1.slice(0, half1)) {
    try { db.prepare(`INSERT OR IGNORE INTO lesson_progress (id, enrollment_id, lesson_id) VALUES (?,?,?)`).run(uuidv4(), E1, l.id); } catch (_) {}
  }

  // Course 2: all lessons complete
  for (const l of lessons2) {
    try { db.prepare(`INSERT OR IGNORE INTO lesson_progress (id, enrollment_id, lesson_id) VALUES (?,?,?)`).run(uuidv4(), E2, l.id); } catch (_) {}
  }

  // Course 3: first lesson only
  if (lessons3.length > 0) {
    try { db.prepare(`INSERT OR IGNORE INTO lesson_progress (id, enrollment_id, lesson_id) VALUES (?,?,?)`).run(uuidv4(), E3, lessons3[0].id); } catch (_) {}
  }

  // Recalculate progress percentages
  const calcProg = (enrollmentId, courseId) => {
    const total = db.prepare('SELECT COUNT(*) as c FROM lessons WHERE course_id = ?').get(courseId)?.c || 0;
    if (total === 0) return 0;
    const done = db.prepare('SELECT COUNT(*) as c FROM lesson_progress WHERE enrollment_id = ?').get(enrollmentId)?.c || 0;
    return Math.round((done / total) * 100);
  };

  db.prepare('UPDATE enrollments SET progress_percentage = ? WHERE id = ?').run(calcProg(E1, '1'), E1);
  db.prepare('UPDATE enrollments SET progress_percentage = 100 WHERE id = ?').run(E2);
  db.prepare('UPDATE enrollments SET progress_percentage = ? WHERE id = ?').run(calcProg(E3, '3'), E3);

  // ── Quiz Results ───────────────────────────────────────────────────────────

  const quizzes1 = db.prepare("SELECT id FROM quizzes WHERE course_id = '1' AND assessment_type = 'post_test'").all();
  const quizzes2 = db.prepare("SELECT id FROM quizzes WHERE course_id = '2'").all();

  for (let i = 0; i < Math.min(quizzes1.length, half1); i++) {
    db.prepare(`INSERT OR IGNORE INTO quiz_results (id, enrollment_id, quiz_id, score, total_questions, correct_answers, attempts)
      VALUES (?, ?, ?, ?, 4, ?, 1)`).run(uuidv4(), E1, quizzes1[i].id, 80, 3);
  }
  for (const q of quizzes2) {
    db.prepare(`INSERT OR IGNORE INTO quiz_results (id, enrollment_id, quiz_id, score, total_questions, correct_answers, attempts)
      VALUES (?, ?, ?, ?, 4, ?, 1)`).run(uuidv4(), E2, q.id, 90, 4);
  }

  // ── Certificate ────────────────────────────────────────────────────────────

  const course2 = db.prepare("SELECT title FROM courses WHERE id = '2'").get();
  const course2Title = course2?.title || 'Digital Marketing Fundamentals';
  const verCode = 'CERT-' + Math.random().toString(36).substring(2, 11).toUpperCase();

  db.prepare(`INSERT OR IGNORE INTO certificates
    (id, enrollment_id, course_id, student_id, student_name, course_name, issue_date, verification_code, cpd_units, status)
    VALUES (?, ?, '2', 'student-1', 'Maria Santos', ?, datetime('now', '-14 days'), ?, 5, 'issued')
  `).run(uuidv4(), E2, course2Title, verCode);

  // ── Class Codes ────────────────────────────────────────────────────────────

  db.prepare(`INSERT OR IGNORE INTO class_codes
    (id, course_id, instructor_id, code, section, program, year_level, semester, school_year, max_uses, is_active)
    VALUES (?, '2', 'instructor-1', 'DIGMKT-2025', 'BSIT-3A', 'BS Information Technology', 3, '1st Semester', '2025-2026', 50, 1)
  `).run(uuidv4());

  db.prepare(`INSERT OR IGNORE INTO class_codes
    (id, course_id, instructor_id, code, section, program, year_level, semester, school_year, max_uses, is_active)
    VALUES (?, '1', 'instructor-1', 'CYBER-2025', 'BSCS-2B', 'BS Computer Science', 2, '1st Semester', '2025-2026', 40, 1)
  `).run(uuidv4());

  // ── Extra student enrollments (pending payments for admin dashboard) ────────

  const pendingData = [
    ['student-demo-2', '1', 'GCH-20250501-001', 2500],
    ['student-demo-3', '4', 'MAYA-20250505-002', 4200],
    ['student-demo-4', '3', 'GCH-20250508-003', 3500],
  ];
  for (const [sid, cid, ref, amt] of pendingData) {
    db.prepare(`INSERT OR IGNORE INTO enrollments
      (id, student_id, course_id, enrollment_type, status, payment_status, payment_method, payment_amount, payment_reference)
      VALUES (?, ?, ?, 'certificatory', 'pending', 'pending', 'gcash', ?, ?)`).run(uuidv4(), sid, cid, amt, ref);
  }

  // Active enrollments for extra students
  const activeData = [
    ['student-demo-5', '1'],
    ['student-demo-6', '2'],
    ['student-demo-5', '2'],
  ];
  for (const [sid, cid] of activeData) {
    db.prepare(`INSERT OR IGNORE INTO enrollments
      (id, student_id, course_id, enrollment_type, status, payment_status, payment_method, payment_amount)
      VALUES (?, ?, ?, 'certificatory', 'active', 'verified', 'gcash', 0)`).run(uuidv4(), sid, cid);
  }

  // ── Notifications ──────────────────────────────────────────────────────────

  const notif = db.prepare(`INSERT OR IGNORE INTO notifications (id, user_id, title, message, is_read) VALUES (?, ?, ?, ?, ?)`);

  notif.run(uuidv4(), 'student-1', 'Welcome to CCELL-LNU!',
    'Your account has been set up. Start exploring our courses and earn certificates.',  0);
  notif.run(uuidv4(), 'student-1', 'Certificate Issued 🎓',
    `Congratulations! You completed "${course2Title}" and earned a CPD certificate.`, 0);
  notif.run(uuidv4(), 'student-1', 'Keep it up!',
    'You are halfway through Introduction to Cybersecurity. Keep going!', 1);

  notif.run(uuidv4(), 'instructor-1', 'New Student Enrollment',
    'Maria Santos has enrolled in Introduction to Cybersecurity.', 0);
  notif.run(uuidv4(), 'instructor-1', 'Course Approved',
    'Your course "Introduction to Cybersecurity" has been approved and is now live.', 1);
  notif.run(uuidv4(), 'instructor-1', 'Pending Payment',
    'A student\'s enrollment payment is pending verification for your course.', 0);

  notif.run(uuidv4(), 'admin-1', 'Pending Payments',
    '3 new payment verifications are waiting for your review.', 0);
  notif.run(uuidv4(), 'admin-1', 'New User Registrations',
    '5 new students registered this week.', 1);

  // ── Messages ───────────────────────────────────────────────────────────────

  db.prepare(`INSERT OR IGNORE INTO messages (id, sender_id, recipient_id, course_id, subject, message, is_read)
    VALUES (?, 'student-1', 'instructor-1', '1', 'Question about Lesson 2',
    'Good day, Dr. Rivera! I have a question about the network security protocols covered in Lesson 2. Could you clarify the difference between symmetric and asymmetric encryption?', 0)
  `).run(uuidv4());

  db.prepare(`INSERT OR IGNORE INTO messages (id, sender_id, recipient_id, course_id, subject, message, is_read)
    VALUES (?, 'instructor-1', 'student-1', '1', 'RE: Question about Lesson 2',
    'Hi Maria! Great question. Symmetric encryption uses the same key for both encryption and decryption, while asymmetric encryption uses a key pair (public/private). I will cover this in more detail in Lesson 3!', 1)
  `).run(uuidv4());

  console.log('[DB] Mock users and demo data seeded successfully.');
}

module.exports = { seedUsers };
