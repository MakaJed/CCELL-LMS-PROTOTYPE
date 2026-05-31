// Uses node:sqlite built into Node.js v22+ (run with --experimental-sqlite flag)
const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const DB_PATH = process.env.DB_PATH ? path.resolve(process.env.DB_PATH) : path.join(__dirname, 'lms.db');
const db = new DatabaseSync(DB_PATH);

db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

// ─── SCHEMA ──────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student',
    student_id TEXT,
    program TEXT,
    year_level INTEGER,
    profile_picture_url TEXT,
    total_cpd_units INTEGER DEFAULT 0,
    total_certificates INTEGER DEFAULT 0,
    total_courses_completed INTEGER DEFAULT 0,
    badges TEXT DEFAULT '[]',
    is_suspended INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    instructor_id TEXT,
    instructor_name TEXT,
    category TEXT,
    level TEXT,
    duration TEXT,
    price REAL DEFAULT 0,
    image TEXT,
    enrolled_count INTEGER DEFAULT 0,
    rating REAL DEFAULT 0,
    status TEXT DEFAULT 'approved',
    course_type TEXT DEFAULT 'certificatory',
    certificate_eligible INTEGER DEFAULT 0,
    cpd_units INTEGER DEFAULT 0,
    objectives TEXT DEFAULT '[]',
    focus TEXT DEFAULT '[]',
    rejection_reason TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS modules (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    module_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS lessons (
    id TEXT PRIMARY KEY,
    module_id TEXT,
    course_id TEXT NOT NULL,
    title TEXT NOT NULL,
    type TEXT DEFAULT 'document',
    duration TEXT,
    content TEXT,
    lesson_order INTEGER DEFAULT 0,
    requires_submission INTEGER DEFAULT 0,
    submission_types TEXT DEFAULT '[]',
    submission_instructions TEXT,
    submission_deadline TEXT,
    allow_resubmission INTEGER DEFAULT 0,
    max_resubmissions INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS quizzes (
    id TEXT PRIMARY KEY,
    module_id TEXT,
    course_id TEXT NOT NULL,
    title TEXT NOT NULL,
    passing_score INTEGER DEFAULT 70,
    time_limit INTEGER,
    allow_retakes INTEGER DEFAULT 1,
    max_retake_attempts INTEGER DEFAULT 3,
    questions TEXT DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS enrollments (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    course_id TEXT NOT NULL,
    enrollment_type TEXT DEFAULT 'certificatory',
    status TEXT DEFAULT 'active',
    payment_method TEXT,
    payment_reference TEXT,
    payment_amount REAL,
    payment_status TEXT DEFAULT 'verified',
    class_code TEXT,
    progress_percentage REAL DEFAULT 0,
    enrolled_at TEXT DEFAULT (datetime('now')),
    expires_at TEXT,
    completed_at TEXT,
    final_grade REAL,
    gwa REAL,
    UNIQUE(student_id, course_id)
  );

  CREATE TABLE IF NOT EXISTS lesson_progress (
    id TEXT PRIMARY KEY,
    enrollment_id TEXT NOT NULL,
    lesson_id TEXT NOT NULL,
    completed_at TEXT DEFAULT (datetime('now')),
    UNIQUE(enrollment_id, lesson_id)
  );

  CREATE TABLE IF NOT EXISTS quiz_results (
    id TEXT PRIMARY KEY,
    enrollment_id TEXT NOT NULL,
    quiz_id TEXT NOT NULL,
    score REAL NOT NULL,
    total_questions INTEGER,
    correct_answers INTEGER,
    attempts INTEGER DEFAULT 1,
    submitted_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS certificates (
    id TEXT PRIMARY KEY,
    enrollment_id TEXT,
    course_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    course_name TEXT NOT NULL,
    issue_date TEXT DEFAULT (datetime('now')),
    verification_code TEXT UNIQUE NOT NULL,
    cpd_units INTEGER DEFAULT 0,
    status TEXT DEFAULT 'issued'
  );

  CREATE TABLE IF NOT EXISTS class_codes (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    instructor_id TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    section TEXT,
    program TEXT,
    year_level INTEGER,
    semester TEXT,
    school_year TEXT,
    max_uses INTEGER,
    uses_count INTEGER DEFAULT 0,
    expires_at TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    sender_id TEXT NOT NULL,
    recipient_id TEXT,
    course_id TEXT,
    subject TEXT,
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    parent_message_id TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS recommendations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    course_id TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, course_id)
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    action TEXT NOT NULL,
    details TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// ─── MIGRATIONS ──────────────────────────────────────────────────────────────
// Add new lesson columns (idempotent — safe to run on existing DB)
[
  `description TEXT`,
  `images TEXT DEFAULT '[]'`,
  `key_points TEXT DEFAULT '[]'`,
  `video_url TEXT`,
  `powerpoint_url TEXT`,
  `pre_test_id TEXT`,
  `post_test_id TEXT`,
  `estimated_duration_minutes INTEGER DEFAULT 30`,
  `extra_media_url TEXT`,
].forEach(col => {
  try { db.exec(`ALTER TABLE lessons ADD COLUMN ${col}`); } catch (_) {}
});
try { db.exec(`ALTER TABLE quizzes ADD COLUMN assessment_type TEXT DEFAULT 'quiz'`); } catch (_) {}
try { db.exec(`ALTER TABLE users ADD COLUMN password_hash TEXT`); } catch (_) {}
try { db.exec(`ALTER TABLE users ADD COLUMN preferences TEXT DEFAULT '{}'`); } catch (_) {}
try { db.exec(`ALTER TABLE enrollments ADD COLUMN class_code_id TEXT`); } catch (_) {}
try { db.exec(`ALTER TABLE enrollments ADD COLUMN final_assessment_passed INTEGER DEFAULT 0`); } catch (_) {}
try { db.exec(`ALTER TABLE enrollments ADD COLUMN is_expired INTEGER DEFAULT 0`); } catch (_) {}
try { db.exec(`ALTER TABLE courses ADD COLUMN certificate_template_url TEXT`); } catch (_) {}
try { db.exec(`ALTER TABLE courses ADD COLUMN certificate_name_settings TEXT DEFAULT '{}'`); } catch (_) {}
try { db.exec(`ALTER TABLE enrollments ADD COLUMN certificate_name_settings_override TEXT DEFAULT '{}'`); } catch (_) {}

try {
  db.exec(`CREATE TABLE IF NOT EXISTS essay_responses (
    id TEXT PRIMARY KEY,
    enrollment_id TEXT NOT NULL,
    quiz_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    answer_text TEXT NOT NULL,
    score REAL,
    feedback TEXT,
    graded_by TEXT,
    graded_at TEXT,
    submitted_at TEXT DEFAULT (datetime('now')),
    UNIQUE(enrollment_id, quiz_id, question_id)
  )`);
} catch (_) {}

try {
  db.exec(`CREATE TABLE IF NOT EXISTS user_channel_state (
    user_id TEXT NOT NULL,
    channel TEXT NOT NULL,
    last_seen TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, channel)
  )`);
} catch (_) {}

try {
  db.exec(`CREATE TABLE IF NOT EXISTS reopen_requests (
    id TEXT PRIMARY KEY,
    enrollment_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    course_id TEXT NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending',
    reviewed_by TEXT,
    reviewed_at TEXT,
    response_message TEXT,
    requested_at TEXT DEFAULT (datetime('now'))
  )`);
} catch (_) {}

try {
  db.exec(`CREATE TABLE IF NOT EXISTS platform_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT DEFAULT (datetime('now'))
  )`);
  const defaults = {
    platform_name: 'LNU CCELL Portal',
    institution: 'Leyte Normal University',
    contact_email: 'ccell@lnu.edu.ph',
    support_phone: '+63 53 321 2176',
    description: 'Center for Continuing Education and Lifelong Learning at Leyte Normal University - Tacloban City, Philippines',
    notif_enroll: '1',
    notif_payment: '1',
    notif_cert: '1',
    notif_digest: '0',
    notif_storage: '1',
  };
  for (const [key, value] of Object.entries(defaults)) {
    db.prepare('INSERT OR IGNORE INTO platform_settings (key, value) VALUES (?, ?)').run(key, value);
  }
} catch (_) {}

// ─── SEED ─────────────────────────────────────────────────────────────────────

function seed() {
  const count = db.prepare('SELECT COUNT(*) as c FROM courses').get().c;
  if (count > 0) return;

  console.log('[DB] Seeding initial data...');

  const insertCourse = db.prepare(`
    INSERT OR IGNORE INTO courses
      (id, title, description, instructor_name, category, level, duration, price, image,
       enrolled_count, rating, status, course_type, certificate_eligible, cpd_units, objectives, focus)
    VALUES
      (@id, @title, @description, @instructor_name, @category, @level, @duration, @price, @image,
       @enrolled_count, @rating, @status, @course_type, @certificate_eligible, @cpd_units, @objectives, @focus)
  `);


  const doSeed = () => {
    db.exec('BEGIN');
    const mockCourses = [
      {
        id: '1', title: 'Introduction to Cybersecurity',
        description: 'Learn the fundamentals of cybersecurity, including threat detection, network security, and best practices for protecting digital assets.',
        instructor_name: 'Dr. John Rivera', category: 'Technology', level: 'Beginner',
        duration: '6 weeks', price: 2500,
        image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800',
        enrolled_count: 1247, rating: 4.8, status: 'approved',
        course_type: 'certificatory', certificate_eligible: 1, cpd_units: 8,
        objectives: JSON.stringify([
          'Understand the fundamental concepts and principles of cybersecurity',
          'Identify common cyber threats and vulnerabilities in digital systems',
          'Apply security frameworks and best practices to protect organizational assets',
          'Implement basic network security measures and encryption techniques',
          'Develop incident response strategies for security breaches',
        ]),
        focus: JSON.stringify([
          'Threat Detection & Prevention', 'Network Security Protocols',
          'Data Encryption Methods', 'Security Policy Development',
          'Incident Response Planning', 'Risk Assessment Techniques',
        ]),
      },
      {
        id: '2', title: 'Digital Marketing Fundamentals',
        description: 'Master the essentials of digital marketing including SEO, social media marketing, content strategy, and analytics.',
        instructor_name: 'Prof. Ana Cruz', category: 'Business', level: 'Beginner',
        duration: '4 weeks', price: 1800,
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
        enrolled_count: 892, rating: 4.6, status: 'approved',
        course_type: 'academe', certificate_eligible: 0, cpd_units: 5,
        objectives: JSON.stringify([
          'Develop effective digital marketing strategies for various platforms',
          'Optimize websites for search engines using SEO best practices',
          'Create engaging content for social media marketing campaigns',
          'Analyze marketing metrics and ROI using analytics tools',
          'Build brand awareness through integrated digital marketing channels',
        ]),
        focus: JSON.stringify([
          'Search Engine Optimization (SEO)', 'Social Media Strategy',
          'Content Marketing', 'Email Marketing Campaigns',
          'Google Analytics & Metrics', 'Paid Advertising (PPC)',
        ]),
      },
      {
        id: '3', title: 'Data Science with Python',
        description: 'Learn data analysis, visualization, and machine learning using Python, pandas, and scikit-learn.',
        instructor_name: 'Dr. Carlos Mendoza', category: 'Technology', level: 'Intermediate',
        duration: '8 weeks', price: 3500,
        image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
        enrolled_count: 634, rating: 4.9, status: 'approved',
        course_type: 'academe', certificate_eligible: 0, cpd_units: 0,
        objectives: JSON.stringify([]), focus: JSON.stringify([]),
      },
      {
        id: '4', title: 'Project Management Professional',
        description: 'Prepare for PMP certification with comprehensive project management training covering all knowledge areas.',
        instructor_name: 'Engr. Lisa Reyes', category: 'Business', level: 'Advanced',
        duration: '10 weeks', price: 4200,
        image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800',
        enrolled_count: 523, rating: 4.7, status: 'approved',
        course_type: 'certificatory', certificate_eligible: 1, cpd_units: 12,
        objectives: JSON.stringify([
          'Master the PMBOK Guide framework and project management methodologies',
          'Plan, execute, monitor, and close projects effectively using industry standards',
          'Manage project scope, schedule, cost, quality, and risk systematically',
          'Lead and communicate effectively with project stakeholders and teams',
          'Prepare for and pass the PMP certification examination',
        ]),
        focus: JSON.stringify([
          'Project Integration Management', 'Scope & Schedule Planning',
          'Cost Management & Budgeting', 'Quality Assurance',
          'Risk Management Strategies', 'Stakeholder Communication',
          'Agile & Hybrid Approaches', 'PMP Exam Preparation',
        ]),
      },
      {
        id: '5', title: 'Web Development Bootcamp',
        description: 'Full-stack web development course covering HTML, CSS, JavaScript, React, Node.js, and databases.',
        instructor_name: 'Mark Tan', category: 'Technology', level: 'Beginner',
        duration: '12 weeks', price: 5000,
        image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800',
        enrolled_count: 1456, rating: 4.9, status: 'approved',
        course_type: 'academe', certificate_eligible: 0, cpd_units: 0,
        objectives: JSON.stringify([]), focus: JSON.stringify([]),
      },
      {
        id: '6', title: 'Financial Literacy for Professionals',
        description: 'Essential financial concepts for career growth including budgeting, investing, and retirement planning.',
        instructor_name: 'CPA Maria Lopez', category: 'Finance', level: 'Beginner',
        duration: '5 weeks', price: 2200,
        image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800',
        enrolled_count: 745, rating: 4.5, status: 'approved',
        course_type: 'academe', certificate_eligible: 0, cpd_units: 0,
        objectives: JSON.stringify([]), focus: JSON.stringify([]),
      },
      {
        id: '7', title: 'Cisco CCNA Certification Prep',
        description: 'Comprehensive preparation for the Cisco Certified Network Associate exam covering networking fundamentals, routing, and switching.',
        instructor_name: 'Engr. Roberto Bautista', category: 'Technology', level: 'Intermediate',
        duration: '10 weeks', price: 4800,
        image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800',
        enrolled_count: 389, rating: 4.8, status: 'approved',
        course_type: 'certificatory', certificate_eligible: 1, cpd_units: 0,
        objectives: JSON.stringify([]), focus: JSON.stringify([]),
      },
      {
        id: '8', title: 'Ethical Hacking & Penetration Testing',
        description: 'Hands-on ethical hacking course with real-world lab environments for aspiring security professionals.',
        instructor_name: 'Dr. John Rivera', category: 'Technology', level: 'Advanced',
        duration: '14 weeks', price: 6500,
        image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800',
        enrolled_count: 278, rating: 4.9, status: 'approved',
        course_type: 'certificatory', certificate_eligible: 1, cpd_units: 0,
        objectives: JSON.stringify([]), focus: JSON.stringify([]),
      },
    ];

    for (const c of mockCourses) insertCourse.run(c);

    db.exec('COMMIT');
  };

  try {
    doSeed();
    console.log('[DB] Seed complete.');
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('[DB] Seed failed:', err);
  }
}

seed();
require('./seed-content')(db);
require('./seed-content-2')(db);
require('./seed-final-assessments')(db);
require('./seed-users').seedUsers(db);
require('./seed-accounts').seedAccounts(db);

module.exports = db;
