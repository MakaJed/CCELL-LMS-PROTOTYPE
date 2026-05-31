const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('./db');

const uuidv4 = () => crypto.randomUUID();

const app = express();
const PORT = process.env.PORT || 3001;

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// ─── PERFORMANCE INDEXES (idempotent) ─────────────────────────────────────────
try {
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
    CREATE INDEX IF NOT EXISTS idx_courses_type ON courses(course_type);
    CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(instructor_id);
    CREATE INDEX IF NOT EXISTS idx_courses_updated ON courses(updated_at);

    CREATE INDEX IF NOT EXISTS idx_enrollments_course_class ON enrollments(course_id, class_code_id);
    CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
    CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);
    CREATE INDEX IF NOT EXISTS idx_enrollments_enrolled ON enrollments(enrolled_at);

    CREATE INDEX IF NOT EXISTS idx_certificates_student_date ON certificates(student_id, issue_date);
    CREATE INDEX IF NOT EXISTS idx_certificates_course ON certificates(course_id);
  `);
  console.log('[DB] Indexes ensured.');
} catch (err) {
  console.warn('[DB] Failed ensuring indexes:', err?.message);
}

// ─── FILE UPLOADS ────────────────────────────────────────────────────────────
const UPLOADS_DIR = process.env.UPLOADS_DIR ? path.resolve(process.env.UPLOADS_DIR) : path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
['videos', 'presentations', 'images'].forEach(sub => {
  const dir = path.join(UPLOADS_DIR, sub);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
const sseClients = new Map();

function getLastSeen(userId, channel) {
  const row = db.prepare('SELECT last_seen FROM user_channel_state WHERE user_id = ? AND channel = ?').get(userId, channel);
  return row?.last_seen || '1970-01-01T00:00:00Z';
}

function setSeenNow(userId, channels) {
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const stmt = db.prepare('INSERT INTO user_channel_state (user_id, channel, last_seen) VALUES (?, ?, ?) ON CONFLICT(user_id, channel) DO UPDATE SET last_seen = excluded.last_seen');
  for (const ch of channels) stmt.run(userId, ch, now);
}

function computeCountsFor(user) {
  const role = user.role;
  const counts = {};
  const uid = user.id;

  if (role === 'student') {
    const chCourses = 'student.courses';
    const lastSeenCourses = getLastSeen(uid, chCourses);
    counts[chCourses] = db.prepare(`
      SELECT COUNT(*) as c FROM (
        SELECT DISTINCT c.id
        FROM courses c
        JOIN enrollments e ON e.course_id = c.id
        WHERE e.student_id = ? AND datetime(c.updated_at) > datetime(?)
      )` ).get(uid, lastSeenCourses)?.c || 0;

    const chCerts = 'student.certificates';
    const lastSeenCerts = getLastSeen(uid, chCerts);
    counts[chCerts] = db.prepare('SELECT COUNT(*) as c FROM certificates WHERE student_id = ? AND datetime(issue_date) > datetime(?)').get(uid, lastSeenCerts)?.c || 0;

    const chGrades = 'student.grades';
    const lastSeenGrades = getLastSeen(uid, chGrades);
    counts[chGrades] = db.prepare(`
      SELECT COUNT(*) as c
      FROM essay_responses er
      JOIN enrollments e ON e.id = er.enrollment_id
      WHERE e.student_id = ? AND er.graded_at IS NOT NULL AND datetime(er.graded_at) > datetime(?)
    `).get(uid, lastSeenGrades)?.c || 0;

    const chPayments = 'student.payments';
    counts[chPayments] = db.prepare(`
      SELECT COUNT(*) as c FROM enrollments WHERE student_id = ? AND (payment_status IN ('pending','review') OR status = 'pending_payment')
    `).get(uid)?.c || 0;

    const chMsgs = 'student.messages';
    counts[chMsgs] = db.prepare(`SELECT COUNT(*) as c FROM messages WHERE recipient_id = ? AND is_read = 0`).get(uid)?.c || 0;
  }

  if (role === 'instructor') {
    const chGrading = 'instructor.grading_room';
    counts[chGrading] = db.prepare(`
      SELECT COUNT(*) as c
      FROM essay_responses er
      JOIN enrollments e ON e.id = er.enrollment_id
      JOIN courses c ON c.id = e.course_id
      WHERE c.instructor_id = ? AND er.graded_at IS NULL
    `).get(uid)?.c || 0;

    const chGradeBook = 'instructor.grade_book';
    counts[chGradeBook] = db.prepare(`
      SELECT COUNT(*) as c
      FROM enrollments e
      JOIN courses c ON c.id = e.course_id
      WHERE c.instructor_id = ? AND (e.progress_percentage >= 100) AND (e.final_grade IS NULL)
    `).get(uid)?.c || 0;

    const chReopen = 'instructor.reopen_requests';
    counts[chReopen] = db.prepare(`
      SELECT COUNT(*) as c
      FROM reopen_requests rr
      JOIN courses c ON c.id = rr.course_id
      WHERE c.instructor_id = ? AND rr.status = 'pending'
    `).get(uid)?.c || 0;

    const chEnroll = 'instructor.enrollments';
    const lastSeenEnroll = getLastSeen(uid, chEnroll);
    counts[chEnroll] = db.prepare(`
      SELECT COUNT(*) as c FROM enrollments e
      JOIN courses c ON c.id = e.course_id
      WHERE c.instructor_id = ? AND datetime(e.enrolled_at) > datetime(?)
    `).get(uid, lastSeenEnroll)?.c || 0;

    const chInstCerts = 'instructor.certificates';
    const lastSeenInstCerts = getLastSeen(uid, chInstCerts);
    counts[chInstCerts] = db.prepare(`
      SELECT COUNT(*) as c FROM certificates ce
      JOIN courses c ON c.id = ce.course_id
      WHERE c.instructor_id = ? AND datetime(ce.issue_date) > datetime(?)
    `).get(uid, lastSeenInstCerts)?.c || 0;
  }

  if (role === 'admin') {
    counts['admin.approvals'] = db.prepare(`SELECT COUNT(*) as c FROM courses WHERE status = 'pending'`).get()?.c || 0;
    counts['admin.payments'] = db.prepare(`SELECT COUNT(*) as c FROM enrollments WHERE payment_status IN ('pending','review') OR status = 'pending_payment'`).get()?.c || 0;
    const lastSeenAudit = getLastSeen(uid, 'admin.audit');
    counts['admin.audit'] = db.prepare(`SELECT COUNT(*) as c FROM audit_logs WHERE datetime(created_at) > datetime(?)`).get(lastSeenAudit)?.c || 0;
  }

  return counts;
}

function sendCounts(user) {
  const client = sseClients.get(user.id);
  if (!client) return;
  const payload = { channels: computeCountsFor(user) };
  try {
    client.res.write(`data: ${JSON.stringify(payload)}\n\n`);
  } catch (_) {}
}

app.get('/api/notifications/channels', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    res.json({ channels: computeCountsFor(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin maintenance: reset student data (keeps instructors/admins)
app.post('/api/admin/maintenance/reset-students', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    if (user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    const studentIds = db.prepare(`SELECT id FROM users WHERE role = 'student'`).all().map(r => r.id);
    if (studentIds.length === 0) return res.json({ success: true, message: 'No student accounts to reset' });

    const idList = studentIds.map(() => '?').join(',');

    db.exec('BEGIN');
    try {
      db.prepare(`DELETE FROM lesson_progress WHERE enrollment_id IN (SELECT id FROM enrollments WHERE student_id IN (${idList}))`).run(...studentIds);
      db.prepare(`DELETE FROM quiz_results WHERE enrollment_id IN (SELECT id FROM enrollments WHERE student_id IN (${idList}))`).run(...studentIds);
      db.prepare(`DELETE FROM essay_responses WHERE enrollment_id IN (SELECT id FROM enrollments WHERE student_id IN (${idList}))`).run(...studentIds);
      db.prepare(`DELETE FROM certificates WHERE student_id IN (${idList})`).run(...studentIds);
      db.prepare(`DELETE FROM notifications WHERE user_id IN (${idList})`).run(...studentIds);
      db.prepare(`DELETE FROM recommendations WHERE user_id IN (${idList})`).run(...studentIds);
      db.prepare(`DELETE FROM messages WHERE sender_id IN (${idList}) OR recipient_id IN (${idList})`).run(...studentIds, ...studentIds);
      db.prepare(`DELETE FROM user_channel_state WHERE user_id IN (${idList})`).run(...studentIds);
      db.prepare(`DELETE FROM reopen_requests WHERE student_id IN (${idList})`).run(...studentIds);
      db.prepare(`DELETE FROM enrollments WHERE student_id IN (${idList})`).run(...studentIds);
      db.prepare(`DELETE FROM users WHERE role = 'student'`).run();
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }

    res.json({ success: true, message: `Removed ${studentIds.length} student account(s) and related data` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/notifications/channels/seen', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const { channels } = req.body || {};
    if (!Array.isArray(channels) || channels.length === 0) return res.json({ success: true });
    setSeenNow(user.id, channels);
    res.json({ success: true });
    sendCounts(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/notifications/subscribe', (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.write('\n');
  sseClients.set(user.id, { res });
  sendCounts(user);
  const interval = setInterval(() => sendCounts(user), 30000);
  req.on('close', () => {
    clearInterval(interval);
    sseClients.delete(user.id);
  });
});

// Serve uploaded files statically
app.use('/uploads', express.static(UPLOADS_DIR));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let sub = 'images';
    if (file.mimetype.startsWith('video/')) sub = 'videos';
    else if (file.mimetype.includes('presentation') || file.mimetype.includes('powerpoint') || file.originalname.match(/\.pptx?$/i)) sub = 'presentations';
    cb(null, path.join(UPLOADS_DIR, sub));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/octet-stream',
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    ];
    const allowedExts = /\.(mp4|webm|ogg|mov|ppt|pptx|jpg|jpeg|png|gif|webp|svg)$/i;
    if (allowedMimes.includes(file.mimetype) || allowedExts.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${file.mimetype} (${file.originalname})`));
    }
  },
});

// Upload endpoint — accepts up to 10 files at once
app.post('/api/upload', upload.array('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    const urls = req.files.map(f => {
      let sub = 'images';
      if (f.mimetype.startsWith('video/')) sub = 'videos';
      else if (f.mimetype.includes('presentation') || f.mimetype.includes('powerpoint') || f.originalname.match(/\.pptx?$/i)) sub = 'presentations';
      return `/uploads/${sub}/${f.filename}`;
    });
    res.json({ success: true, urls, files: req.files.map(f => ({ originalname: f.originalname, size: f.size, mimetype: f.mimetype })) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function getUserId(req) {
  return req.headers['x-mock-user-id'] || null;
}

function requireUser(req, res) {
  const id = getUserId(req);
  if (!id) {
    res.status(401).json({ error: 'Not authenticated' });
    return null;
  }
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) {
    res.status(401).json({ error: 'User not found. Please sign in again.' });
    return null;
  }
  user.badges = JSON.parse(user.badges || '[]');
  return user;
}

function parseCourse(c) {
  if (!c) return null;
  return {
    ...c,
    objectives: JSON.parse(c.objectives || '[]'),
    focus: JSON.parse(c.focus || '[]'),
    certificate_eligible: !!c.certificate_eligible,
    certificate_name_settings: safeJson(c.certificate_name_settings, {}),
  };
}

function safeJson(raw, fallback) {
  try { return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}

function sanitizeNameSettings(raw) {
  const fallback = { x: 50, y: 50, fontSize: 48, fontFamily: 'serif', fontWeight: 'bold', color: '#000000', textAlign: 'center' };
  const obj = typeof raw === 'string' ? safeJson(raw, {}) : (raw || {});
  const clamp = (v, min, max) => Math.min(max, Math.max(min, Number(v) || 0));
  return {
    x: clamp(obj.x ?? fallback.x, 0, 100),
    y: clamp(obj.y ?? fallback.y, 0, 100),
    fontSize: clamp(obj.fontSize ?? fallback.fontSize, 12, 120),
    fontFamily: String(obj.fontFamily || fallback.fontFamily),
    fontWeight: String(obj.fontWeight || fallback.fontWeight),
    color: String(obj.color || fallback.color),
    textAlign: ['left', 'center', 'right'].includes(obj.textAlign) ? obj.textAlign : fallback.textAlign,
  };
}

// Basic percentage → GWA mapping (mirrors frontend gwa-calculator)
function percentageToGWA(pct) {
  const p = Number(pct) || 0;
  if (p >= 97) return 1.0;
  if (p >= 94) return 1.25;
  if (p >= 91) return 1.5;
  if (p >= 88) return 1.75;
  if (p >= 85) return 2.0;
  if (p >= 82) return 2.25;
  if (p >= 79) return 2.5;
  if (p >= 76) return 2.75;
  if (p >= 75) return 3.0;
  return 5.0;
}

function parseLesson(l) {
  if (!l) return null;
  return {
    ...l,
    requires_submission: !!l.requires_submission,
    allow_resubmission: !!l.allow_resubmission,
    submission_types: JSON.parse(l.submission_types || '[]'),
    images: JSON.parse(l.images || '[]'),
    key_points: JSON.parse(l.key_points || '[]'),
  };
}

function calcProgress(enrollmentId, courseId) {
  const totalLessons = db.prepare('SELECT COUNT(*) as c FROM lessons WHERE course_id = ?').get(courseId)?.c || 0;
  if (totalLessons === 0) return 0;
  const completed = db.prepare('SELECT COUNT(*) as c FROM lesson_progress WHERE enrollment_id = ?').get(enrollmentId)?.c || 0;
  return Math.round((completed / totalLessons) * 100);
}

function enrichEnrollment(e) {
  const course = db.prepare('SELECT id, title, course_type, cpd_units, image, instructor_name, level, duration, rating FROM courses WHERE id = ?').get(e.course_id);
  const progress = calcProgress(e.id, e.course_id);
  const isExpired = e.expires_at ? new Date(e.expires_at) < new Date() : false;
  const quizScores = db.prepare(`
    SELECT qr.score FROM quiz_results qr
    JOIN quizzes q ON qr.quiz_id = q.id
    WHERE qr.enrollment_id = ?
      AND (q.assessment_type IS NULL OR q.assessment_type NOT IN ('pre_test'))
      AND (qr.total_questions IS NULL OR qr.total_questions > 0 OR qr.score > 0)
  `).all(e.id);
  const averageQuizScore = quizScores.length
    ? Math.round(quizScores.reduce((s, r) => s + (r.score || 0), 0) / quizScores.length)
    : null;
  return {
    ...e,
    progress_percentage: progress,
    is_expired: isExpired,
    average_quiz_score: averageQuizScore,
    course: course || { id: e.course_id, title: 'Unknown Course' },
  };
}

function logAudit(userId, action, details) {
  try {
    db.prepare('INSERT INTO audit_logs (id, user_id, action, details) VALUES (?, ?, ?, ?)')
      .run(uuidv4(), userId, action, typeof details === 'string' ? details : JSON.stringify(details));
  } catch (_) {}
}

// ─── AUTO-CERT ───────────────────────────────────────────────────────────────

function autoCertIfEligible(enrollmentId) {
  try {
    const enrollment = db.prepare('SELECT * FROM enrollments WHERE id = ?').get(enrollmentId);
    if (!enrollment) return;
    const isCertificatory = enrollment.enrollment_type === 'certificatory' || enrollment.enrollment_type === 'academe_paid';
    if (!isCertificatory) return;
    const alreadyExists = db.prepare('SELECT id FROM certificates WHERE enrollment_id = ?').get(enrollmentId);
    if (alreadyExists) return;
    const student = db.prepare('SELECT * FROM users WHERE id = ?').get(enrollment.student_id);
    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(enrollment.course_id);
    const verificationCode = `CCELL-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    const certId = uuidv4();
    db.prepare(`
      INSERT INTO certificates (id, enrollment_id, course_id, student_id, student_name, course_name, verification_code, cpd_units)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(certId, enrollmentId, enrollment.course_id, enrollment.student_id, student?.name || 'Student', course?.title || 'Course', verificationCode, course?.cpd_units || 0);
    db.prepare('UPDATE users SET total_certificates = total_certificates + 1 WHERE id = ?').run(enrollment.student_id);
    logAudit(enrollment.student_id, 'certificate_auto_issue', { course_id: enrollment.course_id, enrollment_id: enrollmentId });
    console.log(`[auto-cert] Issued for enrollment ${enrollmentId}, course ${course?.title}`);
  } catch (err) {
    console.warn('[auto-cert] Failed:', err.message);
  }
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────

function hashPassword(pw) {
  return crypto.createHash('sha256').update(pw + 'ccell-lnu-salt').digest('hex');
}

function safeUser(u) {
  if (!u) return null;
  const { password_hash, ...rest } = u;
  return { ...rest, badges: JSON.parse(rest.badges || '[]') };
}

app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) return res.status(409).json({ error: 'An account with this email already exists' });

    const id = uuidv4();
    const hash = hashPassword(password);
    db.prepare(`
      INSERT INTO users (id, email, name, role, password_hash, badges)
      VALUES (?, ?, ?, 'student', ?, '[]')
    `).run(id, email.toLowerCase().trim(), name.trim(), hash);

    const user = safeUser(db.prepare('SELECT * FROM users WHERE id = ?').get(id));
    logAudit(id, 'register', { email });
    res.json({ success: true, user });
  } catch (err) {
    console.error('[auth/register]', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!row) return res.status(401).json({ error: 'Invalid email or password' });
    if (row.is_suspended) return res.status(403).json({ error: 'Your account has been suspended' });

    if (!row.password_hash || row.password_hash !== hashPassword(password)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = safeUser(row);
    db.prepare('UPDATE users SET updated_at = datetime(\'now\') WHERE id = ?').run(row.id);
    logAudit(row.id, 'login', { email });
    res.json({ success: true, user });
  } catch (err) {
    console.error('[auth/login]', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/mock-auth/init', (req, res) => {
  try {
    const { id, email, name, role, badges } = req.body;
    if (!id || !email || !name) return res.status(400).json({ error: 'Missing required fields' });

    const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
    if (!existing) {
      db.prepare(`
        INSERT INTO users (id, email, name, role, badges)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, email, name, role || 'student', JSON.stringify(badges || []));
    } else {
      db.prepare('UPDATE users SET name = ?, role = ?, updated_at = datetime(\'now\') WHERE id = ?')
        .run(name, role || 'student', id);
    }
    logAudit(id, 'login', { email });
    res.json({ success: true });
  } catch (err) {
    console.error('[auth/init]', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!row) return res.status(404).json({ error: 'User not found' });
    res.json({ user: safeUser(row) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── COURSES ──────────────────────────────────────────────────────────────────

app.get('/api/courses', (req, res) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit || '500'), 10) || 500, 1000);
    const offset = Math.max(parseInt(String(req.query.offset || '0'), 10) || 0, 0);
    const total = db.prepare(`SELECT COUNT(*) as c FROM courses c WHERE c.status = 'approved'`).get()?.c || 0;
    const courses = db.prepare(`
      SELECT c.*,
        (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status NOT IN ('pending_payment','suspended')) as enrolled_count,
        (SELECT COUNT(*) FROM recommendations r WHERE r.course_id = c.id) as recommendation_count
      FROM courses c WHERE c.status = 'approved'
      ORDER BY enrolled_count DESC LIMIT ? OFFSET ?
    `).all(limit, offset);
    res.json({ courses: courses.map(parseCourse), total, page: { limit, offset } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/courses/:id', (req, res) => {
  try {
    const course = parseCourse(db.prepare(`
      SELECT c.*,
        (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status NOT IN ('pending_payment','suspended')) as enrolled_count,
        (SELECT COUNT(*) FROM recommendations r WHERE r.course_id = c.id) as recommendation_count,
        (SELECT COALESCE(SUM(e.payment_amount),0) FROM enrollments e WHERE e.course_id = c.id AND e.payment_status = 'verified') as total_revenue
      FROM courses c WHERE c.id = ?
    `).get(req.params.id));
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const modules = db.prepare('SELECT * FROM modules WHERE course_id = ? ORDER BY module_order').all(req.params.id);
    const lessons = db.prepare('SELECT * FROM lessons WHERE course_id = ? ORDER BY lesson_order').all(req.params.id).map(parseLesson);
    const quizzes = db.prepare('SELECT * FROM quizzes WHERE course_id = ?').all(req.params.id).map(q => ({
      ...q,
      allow_retakes: !!q.allow_retakes,
      questions: JSON.parse(q.questions || '[]'),
    }));

    const modulesWithContent = modules.map(m => ({
      ...m,
      lessons: lessons.filter(l => l.module_id === m.id),
      quiz: quizzes.find(q => q.module_id === m.id) || null,
    }));

    res.json({ course: { ...course, modules: modulesWithContent }, lessons });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/courses/:id/recommendations', (req, res) => {
  try {
    const userId = getUserId(req);
    const count = db.prepare('SELECT COUNT(*) as c FROM recommendations WHERE course_id = ?').get(req.params.id)?.c || 0;
    const hasRecommended = userId ? !!db.prepare('SELECT id FROM recommendations WHERE user_id = ? AND course_id = ?').get(userId, req.params.id) : false;
    res.json({ count, hasRecommended });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ENROLLMENTS ──────────────────────────────────────────────────────────────

app.post('/api/enrollments', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;

    const { course_id, enrollment_type, payment_method, payment_reference, payment_amount, class_code } = req.body;
    if (!course_id) return res.status(400).json({ error: 'course_id is required' });

    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(course_id);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const existing = db.prepare('SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?').get(user.id, course_id);
    if (existing) return res.status(409).json({ error: 'Already enrolled in this course' });

    const id = uuidv4();
    const type = enrollment_type || 'certificatory';
    const payStatus = (type === 'academe_student') ? 'verified' : (payment_amount ? 'pending' : 'verified');
    const expiresAt = type === 'certificatory' ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : null;

    // Resolve class_code_id if a class_code was provided
    let classCodeId = null;
    if (class_code) {
      const ccRow = db.prepare('SELECT id, max_uses, uses_count FROM class_codes WHERE code = ? AND is_active = 1').get(class_code);
      if (ccRow) {
        classCodeId = ccRow.id;
        if (ccRow.max_uses && ccRow.uses_count >= ccRow.max_uses) {
          return res.status(409).json({ error: 'Class code has reached maximum uses' });
        }
        db.prepare('UPDATE class_codes SET uses_count = uses_count + 1 WHERE id = ?').run(ccRow.id);
      }
    }

    db.prepare(`
      INSERT INTO enrollments (id, student_id, course_id, enrollment_type, status, payment_method, payment_reference, payment_amount, payment_status, class_code, class_code_id, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, user.id, course_id, type, payStatus === 'pending' ? 'pending_payment' : 'active', payment_method || null, payment_reference || null, payment_amount || null, payStatus, class_code || null, classCodeId, expiresAt);

    db.prepare('UPDATE courses SET enrolled_count = enrolled_count + 1 WHERE id = ?').run(course_id);
    logAudit(user.id, 'enrollment_create', { course_id, enrollment_type: type });

    const enrollment = enrichEnrollment(db.prepare('SELECT * FROM enrollments WHERE id = ?').get(id));
    res.json({ success: true, enrollment, message: 'Enrolled successfully' });
  } catch (err) {
    console.error('[enrollments POST]', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/enrollments/my', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const rows = db.prepare('SELECT * FROM enrollments WHERE student_id = ? ORDER BY enrolled_at DESC').all(user.id);
    res.json({ enrollments: rows.map(enrichEnrollment) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PROGRESS ─────────────────────────────────────────────────────────────────

app.post('/api/progress/lesson', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;

    const { enrollment_id, lesson_id, courseId, lessonId } = req.body;
    const eid = enrollment_id || req.body.enrollmentId;
    const lid = lesson_id || lessonId;

    if (!lid) return res.status(400).json({ error: 'lesson_id is required' });

    // If enrollment_id not provided, look it up by courseId
    let resolvedEnrollmentId = eid;
    if (!resolvedEnrollmentId && courseId) {
      const enrollment = db.prepare('SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?').get(user.id, courseId);
      resolvedEnrollmentId = enrollment?.id;
    }
    if (!resolvedEnrollmentId) return res.status(400).json({ error: 'enrollment_id is required' });

    try {
      db.prepare('INSERT INTO lesson_progress (id, enrollment_id, lesson_id) VALUES (?, ?, ?)')
        .run(uuidv4(), resolvedEnrollmentId, lid);
    } catch (_) { /* already completed, ignore */ }

    const enrollment = db.prepare('SELECT * FROM enrollments WHERE id = ?').get(resolvedEnrollmentId);
    const progress = calcProgress(resolvedEnrollmentId, enrollment?.course_id);

    db.prepare('UPDATE enrollments SET progress_percentage = ? WHERE id = ?').run(progress, resolvedEnrollmentId);

    if (progress >= 100) {
      db.prepare('UPDATE enrollments SET status = \'completed\', completed_at = datetime(\'now\') WHERE id = ?').run(resolvedEnrollmentId);
      autoCertIfEligible(resolvedEnrollmentId);
    }

    res.json({ success: true, progress, message: 'Lesson marked as complete' });
  } catch (err) {
    console.error('[progress/lesson]', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/progress/quiz', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;

    const { courseId, quizId, score, totalQuestions, correctAnswers } = req.body;
    const enrollment = db.prepare('SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?').get(user.id, courseId);

    if (enrollment) {
      const existing = db.prepare('SELECT id, attempts FROM quiz_results WHERE enrollment_id = ? AND quiz_id = ?').get(enrollment.id, quizId);
      if (existing) {
        db.prepare('UPDATE quiz_results SET score = ?, attempts = ?, submitted_at = datetime(\'now\') WHERE id = ?')
          .run(score, existing.attempts + 1, existing.id);
      } else {
        db.prepare('INSERT INTO quiz_results (id, enrollment_id, quiz_id, score, total_questions, correct_answers) VALUES (?, ?, ?, ?, ?, ?)')
          .run(uuidv4(), enrollment.id, quizId, score, totalQuestions || 0, correctAnswers || 0);
      }
    }

    res.json({ success: true, quizResult: { score, quizId }, newBadges: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ASSESSMENTS ──────────────────────────────────────────────────────────────

app.get('/api/assessments/:id', (req, res) => {
  const q = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(req.params.id);
  if (!q) return res.status(404).json({ error: 'Assessment not found' });
  const allQuestions = JSON.parse(q.questions || '[]');
  // Strip correct_answer before sending to client
  const questions = allQuestions.map(({ correct_answer, ...rest }) => rest);

  const enrollmentId = req.query.enrollment_id;
  const maxRetakes = Number(q.max_retake_attempts) || 0;
  const maxTotalAttempts = maxRetakes + 1;
  let attemptsUsed = 0;
  let hasPassed = false;
  if (enrollmentId) {
    const row = db.prepare('SELECT attempts, score FROM quiz_results WHERE enrollment_id = ? AND quiz_id = ?').get(enrollmentId, req.params.id);
    attemptsUsed = row?.attempts || 0;
    hasPassed = row ? (row.score >= (q.passing_score || 70)) : false;
  }
  const canRetake = (q.allow_retakes === 1 || q.allow_retakes === '1') && attemptsUsed < maxTotalAttempts;

  res.json({
    assessment: {
      ...q,
      questions,
      passing_score_percentage: q.passing_score || 70,
      max_retakes: maxRetakes,
      max_total_attempts: maxTotalAttempts,
      time_limit_minutes: q.time_limit || null,
    },
    attempt_number: attemptsUsed,
    can_retake: canRetake,
    has_passed: hasPassed,
  });
});

app.post('/api/assessments/submit', (req, res) => {
  const { assessment_id, enrollment_id, answers } = req.body;
  if (!assessment_id) return res.status(400).json({ error: 'assessment_id is required' });
  const q = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(assessment_id);
  if (!q) return res.status(404).json({ error: 'Assessment not found' });

  // Enforce retake limit before recording another attempt
  if (enrollment_id) {
    const existing = db.prepare('SELECT attempts FROM quiz_results WHERE enrollment_id = ? AND quiz_id = ?').get(enrollment_id, assessment_id);
    if (existing) {
      const maxRetakes = Number(q.max_retake_attempts) || 0;
      const maxTotalAttempts = maxRetakes + 1;
      if (existing.attempts >= maxTotalAttempts) {
        return res.status(403).json({ error: 'You have reached the maximum number of attempts for this assessment.' });
      }
    }
  }

  const questions = JSON.parse(q.questions || '[]');
  let totalPoints = 0;
  let earnedPoints = 0;
  let correctCount = 0;

  const question_results = [];
  for (const question of questions) {
    const qType = question.type || question.question_type || 'multiple_choice';
    if (qType === 'essay') {
      question_results.push({ id: question.id, type: 'essay', is_correct: null, correct_answer: null });
      continue;
    }
    totalPoints += question.points || 10;
    const isCorrect = !!(answers && answers[question.id] === question.correct_answer);
    if (isCorrect) { earnedPoints += question.points || 10; correctCount++; }
    question_results.push({
      id: question.id,
      type: qType,
      is_correct: isCorrect,
      correct_answer: isCorrect ? question.correct_answer : null,
    });
  }

  const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  const passingScore = q.passing_score || 70;
  const passed = score >= passingScore;
  const objectiveQCount = questions.filter(qq => (qq.type || qq.question_type) !== 'essay').length;

  // Persist attempt in quiz_results
  let attemptNumber = 1;
  if (enrollment_id) {
    try {
      const existing = db.prepare('SELECT id, attempts FROM quiz_results WHERE enrollment_id = ? AND quiz_id = ?').get(enrollment_id, assessment_id);
      if (existing) {
        attemptNumber = existing.attempts + 1;
        db.prepare('UPDATE quiz_results SET score = ?, correct_answers = ?, attempts = ?, submitted_at = datetime(\'now\') WHERE id = ?')
          .run(score, correctCount, attemptNumber, existing.id);
      } else {
        db.prepare('INSERT INTO quiz_results (id, enrollment_id, quiz_id, score, total_questions, correct_answers, attempts) VALUES (?, ?, ?, ?, ?, ?, 1)')
          .run(uuidv4(), enrollment_id, assessment_id, score, objectiveQCount, correctCount);
      }

      // Save essay answers for academe_student enrollments
      const enrollment = db.prepare('SELECT enrollment_type FROM enrollments WHERE id = ?').get(enrollment_id);
      if (enrollment?.enrollment_type === 'academe_student' && answers) {
        const essayQs = questions.filter(qq => (qq.type || qq.question_type) === 'essay');
        for (const eq of essayQs) {
          const ans = answers[eq.id];
          if (!ans) continue;
          try {
            db.prepare(`
              INSERT INTO essay_responses (id, enrollment_id, quiz_id, question_id, answer_text)
              VALUES (?, ?, ?, ?, ?)
              ON CONFLICT(enrollment_id, quiz_id, question_id) DO UPDATE SET answer_text = excluded.answer_text, submitted_at = datetime('now'), score = NULL, feedback = NULL, graded_by = NULL, graded_at = NULL
            `).run(uuidv4(), enrollment_id, assessment_id, eq.id, ans);
          } catch (_) {}
        }
      }
    } catch (_) {}
  }

  res.json({
    success: true,
    attempt: { score, status: passed ? 'passed' : 'failed', passed, attempt_number: attemptNumber },
    question_results,
    message: passed ? 'Well done! You passed the assessment.' : "You didn't pass. Review the material and try again.",
  });
});

app.get('/api/courses/:courseId/final-assessment', (req, res) => {
  const q = db.prepare("SELECT * FROM quizzes WHERE course_id = ? AND assessment_type = 'final_assessment'").get(req.params.courseId);
  if (!q) return res.json({ assessment: null });
  res.json({
    assessment: {
      ...q,
      questions: JSON.parse(q.questions || '[]'),
      passing_score_percentage: q.passing_score || 70,
      max_retakes: q.max_retake_attempts || 3,
      time_limit_minutes: q.time_limit || null,
    }
  });
});

// ─── CERTIFICATES ─────────────────────────────────────────────────────────────

app.post('/api/certificates/generate', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;

    const { enrollment_id, courseId } = req.body;
    let resolvedEnrollmentId = enrollment_id;
    let courseIdResolved = courseId;

    if (!resolvedEnrollmentId && courseIdResolved) {
      const enrollment = db.prepare('SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?').get(user.id, courseIdResolved);
      resolvedEnrollmentId = enrollment?.id;
    } else if (resolvedEnrollmentId) {
      const enrollment = db.prepare('SELECT course_id FROM enrollments WHERE id = ?').get(resolvedEnrollmentId);
      courseIdResolved = enrollment?.course_id;
    }

    const course = courseIdResolved ? db.prepare('SELECT * FROM courses WHERE id = ?').get(courseIdResolved) : null;
    const existing = resolvedEnrollmentId
      ? db.prepare('SELECT * FROM certificates WHERE enrollment_id = ?').get(resolvedEnrollmentId)
      : null;

    if (existing) return res.json({ success: true, certificate: existing, isNew: false });

    const verificationCode = `CCELL-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    const certId = uuidv4();

    db.prepare(`
      INSERT INTO certificates (id, enrollment_id, course_id, student_id, student_name, course_name, verification_code, cpd_units)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(certId, resolvedEnrollmentId || null, courseIdResolved || '', user.id, user.name, course?.title || 'Course', verificationCode, course?.cpd_units || 0);

    if (resolvedEnrollmentId) {
      db.prepare('UPDATE enrollments SET status = \'completed\' WHERE id = ?').run(resolvedEnrollmentId);
    }

    db.prepare('UPDATE users SET total_certificates = total_certificates + 1 WHERE id = ?').run(user.id);
    logAudit(user.id, 'certificate_issue', { course_id: courseIdResolved });

    const cert = db.prepare('SELECT * FROM certificates WHERE id = ?').get(certId);
    res.json({ success: true, certificate: cert, isNew: true });
  } catch (err) {
    console.error('[certificates/generate]', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/certificates/my', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const certs = db.prepare('SELECT * FROM certificates WHERE student_id = ? ORDER BY issue_date DESC').all(user.id);
    res.json({ certificates: certs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/certificates/verify/:code', (req, res) => {
  try {
    const cert = db.prepare('SELECT * FROM certificates WHERE verification_code = ?').get(req.params.code);
    if (!cert) return res.status(404).json({ valid: false, error: 'Certificate not found' });
    res.json({ valid: true, certificate: cert });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── RECOMMENDATIONS ──────────────────────────────────────────────────────────

app.post('/api/recommendations', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const { course_id } = req.body;
    try {
      db.prepare('INSERT INTO recommendations (id, user_id, course_id) VALUES (?, ?, ?)').run(uuidv4(), user.id, course_id);
    } catch (_) {}
    res.json({ success: true, message: 'Course recommended' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/recommendations/:courseId', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    db.prepare('DELETE FROM recommendations WHERE user_id = ? AND course_id = ?').run(user.id, req.params.courseId);
    res.json({ success: true, message: 'Recommendation removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── STUDENT NAMESPACE ────────────────────────────────────────────────────────

app.get('/api/student/enrollments', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const rows = db.prepare('SELECT * FROM enrollments WHERE student_id = ? ORDER BY enrolled_at DESC').all(user.id);
    res.json({ enrollments: rows.map(enrichEnrollment) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/student/enrollments/course/:courseId', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const e = db.prepare('SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?').get(user.id, req.params.courseId);
    if (!e) return res.status(404).json({ error: 'Enrollment not found' });
    res.json({ enrollment: enrichEnrollment(e) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/student/enrollments/:id/request-reopen', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const enrollment = db.prepare('SELECT * FROM enrollments WHERE id = ? AND student_id = ?').get(req.params.id, user.id);
    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });
    const existing = db.prepare("SELECT id FROM reopen_requests WHERE enrollment_id = ? AND status = 'pending'").get(req.params.id);
    if (existing) return res.status(409).json({ error: 'A pending request already exists' });
    const { reason } = req.body;
    const id = uuidv4();
    db.prepare('INSERT INTO reopen_requests (id, enrollment_id, student_id, course_id, reason) VALUES (?, ?, ?, ?, ?)')
      .run(id, req.params.id, user.id, enrollment.course_id, reason || null);
    logAudit(user.id, 'reopen_requested', { enrollment_id: req.params.id });
    res.json({ success: true, message: 'Reopen request submitted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/student/enrollments/reenroll', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const { course_id, payment_method, payment_reference, payment_amount } = req.body;
    db.prepare('UPDATE enrollments SET status = \'active\', payment_status = \'pending\', payment_method = ?, payment_reference = ?, payment_amount = ?, enrolled_at = datetime(\'now\') WHERE student_id = ? AND course_id = ?')
      .run(payment_method, payment_reference, payment_amount, user.id, course_id);
    const e = db.prepare('SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?').get(user.id, course_id);
    res.json({ success: true, enrollment: enrichEnrollment(e), message: 'Re-enrolled successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/student/courses/:courseId/lessons', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const enrollment = db.prepare('SELECT id, status FROM enrollments WHERE student_id = ? AND course_id = ?').get(user.id, req.params.courseId);
    if (enrollment?.status === 'pending_payment') {
      return res.status(403).json({ error: 'Course access is locked pending payment verification.' });
    }
    const rawLessons = db.prepare('SELECT * FROM lessons WHERE course_id = ? ORDER BY lesson_order').all(req.params.courseId);
    const completedIds = enrollment
      ? new Set(db.prepare('SELECT lesson_id FROM lesson_progress WHERE enrollment_id = ?').all(enrollment.id).map(r => r.lesson_id))
      : new Set();
    const lessons = rawLessons.map((l, idx) => ({
      ...parseLesson(l),
      is_completed: completedIds.has(l.id),
      is_locked: idx > 0 && !completedIds.has(rawLessons[idx - 1].id),
    }));
    res.json({ lessons });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/student/progress/lesson', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;

    const { enrollment_id, lesson_id, courseId, lessonId } = req.body;
    const eid = enrollment_id || req.body.enrollmentId;
    const lid = lesson_id || lessonId;

    if (!lid) return res.status(400).json({ error: 'lesson_id is required' });

    let resolvedEnrollmentId = eid;
    if (!resolvedEnrollmentId && courseId) {
      const enrollment = db.prepare('SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?').get(user.id, courseId);
      resolvedEnrollmentId = enrollment?.id;
    }
    if (!resolvedEnrollmentId) return res.status(400).json({ error: 'enrollment_id is required' });

    try {
      db.prepare('INSERT INTO lesson_progress (id, enrollment_id, lesson_id) VALUES (?, ?, ?)')
        .run(uuidv4(), resolvedEnrollmentId, lid);
    } catch (_) { /* already completed, ignore */ }

    const enrollment = db.prepare('SELECT * FROM enrollments WHERE id = ?').get(resolvedEnrollmentId);
    const progress = calcProgress(resolvedEnrollmentId, enrollment?.course_id);
    db.prepare('UPDATE enrollments SET progress_percentage = ? WHERE id = ?').run(progress, resolvedEnrollmentId);

    if (progress >= 100) {
      db.prepare("UPDATE enrollments SET status = 'completed', completed_at = datetime('now') WHERE id = ?").run(resolvedEnrollmentId);
      autoCertIfEligible(resolvedEnrollmentId);
    }

    res.json({ success: true, progress, message: 'Lesson marked as complete' });
  } catch (err) {
    console.error('[student/progress/lesson]', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/student/messages', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const msgs = db.prepare(`
      SELECT m.*,
        sender.name AS sender_name, sender.role AS sender_role,
        recipient.name AS recipient_name,
        c.title AS course_title
      FROM messages m
      LEFT JOIN users sender ON sender.id = m.sender_id
      LEFT JOIN users recipient ON recipient.id = m.recipient_id
      LEFT JOIN courses c ON c.id = m.course_id
      WHERE m.sender_id = ? OR m.recipient_id = ?
      ORDER BY m.created_at DESC
    `).all(user.id, user.id);
    res.json({ messages: msgs });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/student/messages', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const { course_id, subject, message, parent_message_id } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'message is required' });
    const id = uuidv4();
    // Route to instructor: find via course, or inherit from parent message
    let recipientId = null;
    let resolvedCourseId = course_id || null;
    if (parent_message_id) {
      const parent = db.prepare('SELECT sender_id, recipient_id, course_id FROM messages WHERE id = ?').get(parent_message_id);
      if (parent) {
        resolvedCourseId = resolvedCourseId || parent.course_id;
        recipientId = parent.sender_id !== user.id ? parent.sender_id : parent.recipient_id;
      }
    }
    if (!recipientId && resolvedCourseId) {
      const course = db.prepare('SELECT instructor_id FROM courses WHERE id = ?').get(resolvedCourseId);
      recipientId = course?.instructor_id || null;
    }
    db.prepare('INSERT INTO messages (id, sender_id, recipient_id, course_id, subject, message, parent_message_id) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, user.id, recipientId, resolvedCourseId, subject || null, message.trim(), parent_message_id || null);
    const saved = db.prepare(`SELECT m.*, s.name AS sender_name, r.name AS recipient_name, c.title AS course_title FROM messages m LEFT JOIN users s ON s.id = m.sender_id LEFT JOIN users r ON r.id = m.recipient_id LEFT JOIN courses c ON c.id = m.course_id WHERE m.id = ?`).get(id);
    res.json({ success: true, message: saved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/student/messages/:id/read', (req, res) => {
  db.prepare('UPDATE messages SET is_read = 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.get('/api/student/certificates', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const { search, enrollment_type } = req.query;
    const limit = Math.min(parseInt(String(req.query.limit || '500'), 10) || 500, 1000);
    const offset = Math.max(parseInt(String(req.query.offset || '0'), 10) || 0, 0);
    const conditions = ['c.student_id = ?'];
    const params = [user.id];
    if (search) {
      conditions.push('(c.course_name LIKE ? OR c.verification_code LIKE ? OR c.student_name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (enrollment_type) {
      conditions.push('e.enrollment_type = ?');
      params.push(enrollment_type);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const total = db.prepare(`
      SELECT COUNT(*) as c
      FROM certificates c
      LEFT JOIN enrollments e ON c.enrollment_id = e.id
      ${where}
    `).get(...params)?.c || 0;
    const certs = db.prepare(`
      SELECT c.*, e.enrollment_type
      FROM certificates c
      LEFT JOIN enrollments e ON c.enrollment_id = e.id
      ${where}
      ORDER BY c.issue_date DESC LIMIT ? OFFSET ?
    `).all(...params, limit, offset);
    res.json({ certificates: certs, total, page: { limit, offset } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/student/certificates/:id', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;

    const certId = req.params.id;
    let cert;

    if (user.role === 'admin') {
      cert = db.prepare('SELECT * FROM certificates WHERE id = ?').get(certId);
    } else if (user.role === 'instructor') {
      cert = db.prepare(
        `SELECT ce.*
         FROM certificates ce
         JOIN courses c ON c.id = ce.course_id
         WHERE ce.id = ? AND c.instructor_id = ?`
      ).get(certId, user.id);
    } else {
      cert = db.prepare('SELECT * FROM certificates WHERE id = ? AND student_id = ?').get(certId, user.id);
    }

    if (!cert) return res.status(404).json({ error: 'Certificate not found' });
    res.json({ certificate: cert });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/student/certificates/:id/download', (req, res) => {
  res.json({ url: `/certificate/${req.params.id}`, filename: `certificate-${req.params.id}.pdf` });
});

// Universal certificate fetch (admin/instructor/student)
app.get('/api/certificates/:id', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;

    const certId = req.params.id;
    let cert;

    if (user.role === 'admin') {
      cert = db.prepare('SELECT * FROM certificates WHERE id = ?').get(certId);
    } else if (user.role === 'instructor') {
      cert = db.prepare(
        `SELECT ce.*
         FROM certificates ce
         JOIN courses c ON c.id = ce.course_id
         WHERE ce.id = ? AND c.instructor_id = ?`
      ).get(certId, user.id);
    } else {
      cert = db.prepare('SELECT * FROM certificates WHERE id = ? AND student_id = ?').get(certId, user.id);
    }

    if (!cert) return res.status(404).json({ error: 'Certificate not found' });
    res.json({ certificate: cert });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Student certificate name settings (per enrollment)
app.get('/api/student/certificates/:enrollmentId/settings', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const enrollment = db.prepare('SELECT * FROM enrollments WHERE id = ? AND student_id = ?').get(req.params.enrollmentId, user.id);
    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });
    const baseCourse = db.prepare('SELECT certificate_name_settings FROM courses WHERE id = ?').get(enrollment.course_id);
    const baseSettings = sanitizeNameSettings(baseCourse?.certificate_name_settings || '{}');
    const override = sanitizeNameSettings(enrollment.certificate_name_settings_override || '{}');
    // If override is default (50/50 etc.) and no explicit overrides, return base
    const effective = override || baseSettings;
    res.json({ settings: { base: baseSettings, override, effective } });
  } catch (err) {
    console.error('[cert settings get]', err);
    res.status(500).json({ error: 'Failed to load settings' });
  }
});

app.put('/api/student/certificates/:enrollmentId/settings', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const enrollment = db.prepare('SELECT * FROM enrollments WHERE id = ? AND student_id = ?').get(req.params.enrollmentId, user.id);
    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });
    const settings = sanitizeNameSettings(req.body);
    db.prepare('UPDATE enrollments SET certificate_name_settings_override = ? WHERE id = ?').run(JSON.stringify(settings), enrollment.id);
    res.json({ success: true, settings });
  } catch (err) {
    console.error('[cert settings put]', err);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

app.get('/api/student/profile', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    let preferences = {};
    try { preferences = JSON.parse(user.preferences || '{}'); } catch (_) {}
    res.json({ profile: { ...user, badges: JSON.parse(user.badges || '[]'), preferences } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/student/profile', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const { full_name, email, profile_picture_url, preferences } = req.body;
    const sets = ["updated_at = datetime('now')"];
    const vals = [];
    if (full_name != null)          { sets.push('name = ?');                vals.push(full_name); }
    if (email != null)              { sets.push('email = ?');               vals.push(email); }
    if (profile_picture_url != null){ sets.push('profile_picture_url = ?'); vals.push(profile_picture_url); }
    if (preferences != null)        { sets.push('preferences = ?');         vals.push(JSON.stringify(preferences)); }
    db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).run(...vals, user.id);
    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
    let prefs = {};
    try { prefs = JSON.parse(updated.preferences || '{}'); } catch (_) {}
    res.json({ success: true, profile: { ...updated, badges: JSON.parse(updated.badges || '[]'), preferences: prefs } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/student/profile/password', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) return res.status(400).json({ error: 'current_password and new_password are required' });
    if (new_password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(user.id);
    if (!row?.password_hash || row.password_hash !== hashPassword(current_password)) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    db.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").run(hashPassword(new_password), user.id);
    logAudit(user.id, 'password_changed', {});
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/student/dashboard/stats', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const enrollments = db.prepare('SELECT * FROM enrollments WHERE student_id = ?').all(user.id);
    const certs = db.prepare('SELECT COUNT(*) as c FROM certificates WHERE student_id = ?').get(user.id)?.c || 0;
    const completed = enrollments.filter(e => e.status === 'completed').length;
    const avgProgress = enrollments.length
      ? Math.round(enrollments.reduce((s, e) => s + (e.progress_percentage || 0), 0) / enrollments.length)
      : 0;
    res.json({ stats: { total_enrollments: enrollments.length, completed_courses: completed, total_certificates: certs, average_progress: avgProgress } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/student/analytics/progress', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const enrollments = db.prepare('SELECT * FROM enrollments WHERE student_id = ?').all(user.id);
    const enrollmentIds = enrollments.map(e => e.id);

    let completedLessons = 0;
    let avgScore = 0;
    if (enrollmentIds.length > 0) {
      const ph = enrollmentIds.map(() => '?').join(',');
      completedLessons = db.prepare(`SELECT COUNT(*) as c FROM lesson_progress WHERE enrollment_id IN (${ph})`).get(...enrollmentIds)?.c || 0;
      const quizResults = db.prepare(`SELECT score FROM quiz_results WHERE enrollment_id IN (${ph})`).all(...enrollmentIds);
      avgScore = quizResults.length ? Math.round(quizResults.reduce((s, q) => s + (q.score || 0), 0) / quizResults.length) : 0;
    }

    const certs = db.prepare('SELECT COUNT(*) as c FROM certificates WHERE student_id = ?').get(user.id)?.c || 0;
    const coursesCompleted = enrollments.filter(e => e.status === 'completed' || (e.progress_percentage || 0) >= 100).length;
    const coursesInProgress = enrollments.filter(e => (e.progress_percentage || 0) > 0 && (e.progress_percentage || 0) < 100).length;
    const totalHours = Math.round(completedLessons * 0.5);
    res.json({
      analytics: {
        totalLessonsCompleted: completedLessons,
        totalHoursLearned: totalHours,
        currentStreak: 0,
        averageScore: avgScore,
        coursesInProgress,
        coursesCompleted,
        certificatesEarned: certs,
        upcomingDeadlines: 0,
        course_completion_rate: enrollments.length ? Math.round((coursesCompleted / enrollments.length) * 100) : 0,
        weekly_progress: [],
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/student/quiz-history', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const enrollments = db.prepare('SELECT id FROM enrollments WHERE student_id = ?').all(user.id);
    if (!enrollments.length) return res.json({ quizzes: [] });
    const ph = enrollments.map(() => '?').join(',');
    const rows = db.prepare(`
      SELECT qr.score, qr.submitted_at, qr.attempts,
        q.title AS quiz_title, c.title AS course_title
      FROM quiz_results qr
      JOIN quizzes q ON q.id = qr.quiz_id
      JOIN courses c ON c.id = q.course_id
      WHERE qr.enrollment_id IN (${ph})
      ORDER BY qr.submitted_at DESC
      LIMIT 10
    `).all(...enrollments.map(e => e.id));
    res.json({ quizzes: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/student/recent-activity', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const enrollments = db.prepare('SELECT id, course_id FROM enrollments WHERE student_id = ?').all(user.id);
    const enrollmentIds = enrollments.map(e => e.id);
    if (!enrollmentIds.length) return res.json({ activities: [] });
    const ph = enrollmentIds.map(() => '?').join(',');
    const rows = db.prepare(`
      SELECT lp.completed_at, l.title as lesson_title, c.title as course_title
      FROM lesson_progress lp
      JOIN lessons l ON l.id = lp.lesson_id
      JOIN courses c ON c.id = l.course_id
      WHERE lp.enrollment_id IN (${ph})
      ORDER BY lp.completed_at DESC
      LIMIT 8
    `).all(...enrollmentIds);
    const activities = rows.map(r => ({
      type: 'lesson_completed',
      title: 'Lesson completed',
      subtitle: `${r.lesson_title} — ${r.course_title}`,
      time: r.completed_at,
    }));
    res.json({ activities });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/popular-courses', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT c.*,
        (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status NOT IN ('pending_payment','suspended')) as enrollment_count,
        (SELECT COUNT(*) FROM recommendations r WHERE r.course_id = c.id) as recommendation_count
      FROM courses c
      WHERE c.status = 'approved'
      ORDER BY (
        (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status NOT IN ('pending_payment','suspended')) +
        (SELECT COUNT(*) FROM recommendations r WHERE r.course_id = c.id)
      ) DESC
      LIMIT 3
    `).all();
    res.json({
      courses: rows.map(c => ({
        ...parseCourse(c),
        enrollment_count: c.enrollment_count || 0,
        recommendation_count: c.recommendation_count || 0,
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/student/recommendations', (req, res) => {
  try {
    const courses = db.prepare('SELECT * FROM courses WHERE status = \'approved\' ORDER BY rating DESC LIMIT 4').all();
    res.json({ courses: courses.map(parseCourse) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/student/payment-history', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const rows = db.prepare(`
      SELECT e.id, e.course_id, e.enrollment_type, e.payment_method, e.payment_reference,
             e.payment_amount, e.payment_status, e.enrolled_at, e.class_code,
             c.title as course_title, c.course_type
      FROM enrollments e
      LEFT JOIN courses c ON c.id = e.course_id
      WHERE e.student_id = ?
      ORDER BY e.enrolled_at DESC
    `).all(user.id);
    res.json({ payments: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/student/notifications', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const notifs = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC').all(user.id);
    res.json({ notifications: notifs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/student/notifications/:id/read', (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.post('/api/student/notifications/read-all', (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(user.id);
  res.json({ success: true });
});

// ─── INSTRUCTOR NAMESPACE ─────────────────────────────────────────────────────

app.get('/api/instructor/courses', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const courses = db.prepare(`
      SELECT c.*,
        (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status NOT IN ('pending_payment','suspended')) as enrolled_count,
        (SELECT COUNT(*) FROM recommendations r WHERE r.course_id = c.id) as recommendation_count
      FROM courses c WHERE c.instructor_id = ? ORDER BY c.created_at DESC
    `).all(user.id);
    res.json({ courses: courses.map(parseCourse) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/instructor/courses', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const { title, description, category, level, duration, price, course_type, cpd_units, objectives, learning_objectives, focus_of_lesson } = req.body;
    const id = uuidv4();
    db.prepare(`
      INSERT INTO courses (id, title, description, instructor_id, instructor_name, category, level, duration, price, course_type, cpd_units, objectives, focus, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')
    `).run(id, title, description || '', user.id, user.name, category || '', level || 'Beginner', duration || '', price || 0, course_type || 'certificatory', cpd_units || 0, JSON.stringify(objectives || learning_objectives || []), JSON.stringify(focus_of_lesson ? [focus_of_lesson] : []));
    logAudit(user.id, 'course_create', { course_id: id });
    const course = parseCourse(db.prepare('SELECT * FROM courses WHERE id = ?').get(id));
    res.json({ success: true, course, message: 'Course created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/instructor/courses/:id', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const fields = req.body;
    const sets = Object.keys(fields).filter(k => !['id', 'instructor_id'].includes(k))
      .map(k => `${k} = ?`).join(', ');
    const vals = Object.keys(fields).filter(k => !['id', 'instructor_id'].includes(k))
      .map(k => typeof fields[k] === 'object' ? JSON.stringify(fields[k]) : fields[k]);
    if (sets) {
      db.prepare(`UPDATE courses SET ${sets}, updated_at = datetime('now') WHERE id = ? AND instructor_id = ?`).run(...vals, req.params.id, user.id);
    }
    res.json({ success: true, course: parseCourse(db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/instructor/courses/:id/submit-for-approval', (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  db.prepare('UPDATE courses SET status = \'pending_approval\' WHERE id = ? AND instructor_id = ?').run(req.params.id, user.id);
  res.json({ success: true, message: 'Course submitted for approval' });
});

app.post('/api/instructor/courses/:courseId/lessons', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const { title, description, lesson_order, video_url, powerpoint_url, key_points, images, estimated_duration_minutes, extra_media_url, pre_test_id, post_test_id } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'title is required' });
    const id = uuidv4();
    db.prepare(`
      INSERT INTO lessons (id, course_id, title, description, lesson_order, video_url, powerpoint_url, key_points, images, estimated_duration_minutes, extra_media_url, pre_test_id, post_test_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, req.params.courseId, title.trim(),
      description || null,
      lesson_order != null ? lesson_order : (db.prepare('SELECT COUNT(*) as c FROM lessons WHERE course_id = ?').get(req.params.courseId)?.c || 0) + 1,
      video_url || null,
      powerpoint_url || null,
      JSON.stringify(Array.isArray(key_points) ? key_points : []),
      JSON.stringify(Array.isArray(images) ? images : []),
      estimated_duration_minutes || 30,
      extra_media_url || null,
      pre_test_id || null,
      post_test_id || null
    );
    res.json({ success: true, lesson: parseLesson(db.prepare('SELECT * FROM lessons WHERE id = ?').get(id)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/instructor/lessons/:id', (req, res) => {
  try {
    const { title, description, lesson_order, video_url, powerpoint_url, key_points, images, estimated_duration_minutes, extra_media_url, pre_test_id, post_test_id } = req.body;
    const sets = [];
    const vals = [];
    if (title != null)                      { sets.push('title = ?');                      vals.push(title); }
    if (description != null)                { sets.push('description = ?');                vals.push(description || null); }
    if (lesson_order != null)               { sets.push('lesson_order = ?');               vals.push(lesson_order); }
    if (video_url !== undefined)            { sets.push('video_url = ?');                  vals.push(video_url || null); }
    if (powerpoint_url !== undefined)       { sets.push('powerpoint_url = ?');             vals.push(powerpoint_url || null); }
    if (key_points !== undefined)           { sets.push('key_points = ?');                 vals.push(JSON.stringify(Array.isArray(key_points) ? key_points : [])); }
    if (images !== undefined)               { sets.push('images = ?');                     vals.push(JSON.stringify(Array.isArray(images) ? images : [])); }
    if (estimated_duration_minutes != null) { sets.push('estimated_duration_minutes = ?'); vals.push(estimated_duration_minutes); }
    if (extra_media_url !== undefined)      { sets.push('extra_media_url = ?');            vals.push(extra_media_url || null); }
    if (pre_test_id !== undefined)          { sets.push('pre_test_id = ?');                vals.push(pre_test_id || null); }
    if (post_test_id !== undefined)         { sets.push('post_test_id = ?');               vals.push(post_test_id || null); }
    if (sets.length) {
      db.prepare(`UPDATE lessons SET ${sets.join(', ')} WHERE id = ?`).run(...vals, req.params.id);
    }
    res.json({ success: true, lesson: parseLesson(db.prepare('SELECT * FROM lessons WHERE id = ?').get(req.params.id)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/instructor/lessons/:id', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const lesson = db.prepare('SELECT l.* FROM lessons l JOIN courses c ON c.id = l.course_id WHERE l.id = ? AND c.instructor_id = ?').get(req.params.id, user.id);
    if (!lesson) return res.status(404).json({ error: 'Lesson not found or not authorized' });
    db.prepare('DELETE FROM lesson_progress WHERE lesson_id = ?').run(req.params.id);
    db.prepare('DELETE FROM lessons WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/instructor/courses/:courseId/assessments', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const { title, questions, passing_score_percentage, max_retakes, time_limit_minutes, assessment_type, lesson_id, allow_retakes } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'title is required' });
    const id = uuidv4();
    db.prepare('INSERT INTO quizzes (id, course_id, title, passing_score, time_limit, max_retake_attempts, allow_retakes, questions, assessment_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(id, req.params.courseId, title.trim(), passing_score_percentage || 70, time_limit_minutes || null, max_retakes ?? 3, allow_retakes !== false ? 1 : 0, JSON.stringify(questions || []), assessment_type || 'quiz');
    // Link to lesson if provided
    if (lesson_id) {
      const lessonFields = assessment_type === 'pre_test' ? 'pre_test_id' : 'post_test_id';
      db.prepare(`UPDATE lessons SET ${lessonFields} = ? WHERE id = ?`).run(id, lesson_id);
    }
    logAudit(user.id, 'assessment_created', { assessment_id: id, course_id: req.params.courseId });
    res.json({ success: true, assessment: db.prepare('SELECT * FROM quizzes WHERE id = ?').get(id) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/instructor/courses/:courseId/assessments', (req, res) => {
  try {
    const quizzes = db.prepare('SELECT * FROM quizzes WHERE course_id = ? ORDER BY rowid').all(req.params.courseId);
    res.json({ assessments: quizzes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/instructor/assessments/:id', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const { title, questions, passing_score_percentage, max_retakes, time_limit_minutes, allow_retakes } = req.body;
    const sets = [];
    const vals = [];
    if (title != null)                       { sets.push('title = ?');               vals.push(title); }
    if (questions !== undefined)             { sets.push('questions = ?');            vals.push(JSON.stringify(questions)); }
    if (passing_score_percentage != null)    { sets.push('passing_score = ?');        vals.push(passing_score_percentage); }
    if (max_retakes != null)                 { sets.push('max_retake_attempts = ?');  vals.push(max_retakes); }
    if (time_limit_minutes !== undefined)    { sets.push('time_limit = ?');           vals.push(time_limit_minutes || null); }
    if (allow_retakes !== undefined)         { sets.push('allow_retakes = ?');        vals.push(allow_retakes ? 1 : 0); }
    if (sets.length) {
      db.prepare(`UPDATE quizzes SET ${sets.join(', ')} WHERE id = ?`).run(...vals, req.params.id);
    }
    res.json({ success: true, assessment: db.prepare('SELECT * FROM quizzes WHERE id = ?').get(req.params.id) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/instructor/assessments/:id', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    // Clear any lesson references
    db.prepare('UPDATE lessons SET pre_test_id = NULL WHERE pre_test_id = ?').run(req.params.id);
    db.prepare('UPDATE lessons SET post_test_id = NULL WHERE post_test_id = ?').run(req.params.id);
    db.prepare('DELETE FROM quiz_results WHERE quiz_id = ?').run(req.params.id);
    db.prepare('DELETE FROM quizzes WHERE id = ?').run(req.params.id);
    logAudit(user.id, 'assessment_deleted', { assessment_id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/instructor/class-codes', (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  const codes = db.prepare('SELECT * FROM class_codes WHERE instructor_id = ? ORDER BY created_at DESC').all(user.id);
  const enriched = codes.map(cc => {
    const course = db.prepare('SELECT id, title FROM courses WHERE id = ?').get(cc.course_id);
    return { ...cc, current_uses: cc.uses_count, is_active: !!cc.is_active, course: course || null };
  });
  res.json({ class_codes: enriched });
});

app.post('/api/instructor/class-codes', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const { course_id, code, section, program, year_level, semester, school_year, max_uses, expires_at } = req.body;
    const id = uuidv4();
    db.prepare('INSERT INTO class_codes (id, course_id, instructor_id, code, section, program, year_level, semester, school_year, max_uses, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(id, course_id, user.id, code, section || null, program || null, year_level || null, semester || null, school_year || null, max_uses || null, expires_at || null);
    res.json({ success: true, class_code: db.prepare('SELECT * FROM class_codes WHERE id = ?').get(id) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/instructor/class-codes/:id/deactivate', (req, res) => {
  db.prepare('UPDATE class_codes SET is_active = 0 WHERE id = ?').run(req.params.id);
  res.json({ success: true, class_code: db.prepare('SELECT * FROM class_codes WHERE id = ?').get(req.params.id) });
});

app.post('/api/instructor/class-codes/:id/activate', (req, res) => {
  db.prepare('UPDATE class_codes SET is_active = 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true, class_code: db.prepare('SELECT * FROM class_codes WHERE id = ?').get(req.params.id) });
});

// ─── STUDENT JOIN CLASS ──────────────────────────────────────────────────────
app.post('/api/student/join-class', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const { code } = req.body;
    if (!code || !code.trim()) return res.status(400).json({ error: 'Class code is required' });

    const classCode = db.prepare('SELECT * FROM class_codes WHERE code = ?').get(code.trim().toUpperCase());
    if (!classCode) return res.status(404).json({ error: 'Invalid class code. Please check the code and try again.' });
    if (!classCode.is_active) return res.status(410).json({ error: 'This class code has been deactivated by the instructor.' });
    if (classCode.expires_at && new Date(classCode.expires_at) < new Date()) {
      return res.status(410).json({ error: 'This class code has expired.' });
    }
    if (classCode.max_uses && classCode.uses_count >= classCode.max_uses) {
      return res.status(409).json({ error: 'This class code has reached its maximum number of enrollments.' });
    }

    // Check if already enrolled in that course
    const existing = db.prepare('SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?').get(user.id, classCode.course_id);
    if (existing) return res.status(409).json({ error: 'You are already enrolled in this course.' });

    // Create enrollment (free, active, academe_student track)
    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(classCode.course_id);
    const enrollId = uuidv4();
    const expiresAt = new Date(Date.now() + 42 * 24 * 60 * 60 * 1000).toISOString(); // 6 weeks
    db.prepare(`
      INSERT INTO enrollments (id, student_id, course_id, enrollment_type, status, payment_status, class_code, class_code_id, expires_at)
      VALUES (?, ?, ?, 'academe_student', 'active', 'verified', ?, ?, ?)
    `).run(enrollId, user.id, classCode.course_id, classCode.code, classCode.id, expiresAt);

    // Increment uses
    db.prepare('UPDATE class_codes SET uses_count = uses_count + 1 WHERE id = ?').run(classCode.id);
    db.prepare('UPDATE courses SET enrolled_count = enrolled_count + 1 WHERE id = ?').run(classCode.course_id);
    logAudit(user.id, 'join_class', { class_code: classCode.code, course_id: classCode.course_id, section: classCode.section });

    res.json({
      success: true,
      message: `Successfully enrolled in ${course?.title || 'course'}`,
      enrollment: {
        id: enrollId,
        course_id: classCode.course_id,
        course_title: course?.title,
        section: classCode.section,
        enrollment_type: 'academe_student',
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── BULK FINALIZE SECTION GRADES ────────────────────────────────────────────
app.post('/api/instructor/class-codes/:id/finalize-section', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const classCode = db.prepare('SELECT * FROM class_codes WHERE id = ? AND instructor_id = ?').get(req.params.id, user.id);
    if (!classCode) return res.status(404).json({ error: 'Class code not found' });

    // Get all enrollments for this class code
    const enrollments = db.prepare(`
      SELECT e.*, u.name AS student_name
      FROM enrollments e
      JOIN users u ON u.id = e.student_id
      WHERE e.class_code_id = ? AND e.enrollment_type = 'academe_student'
    `).all(classCode.id);

    let certsIssued = 0;
    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(classCode.course_id);

    for (const enrollment of enrollments) {
      // Recalculate progress
      const progress = calcProgress(enrollment.id, enrollment.course_id);
      db.prepare('UPDATE enrollments SET progress_percentage = ? WHERE id = ?').run(progress, enrollment.id);

      // Only issue cert if 100% complete and no cert yet
      if (progress >= 100) {
        const alreadyCert = db.prepare('SELECT id FROM certificates WHERE enrollment_id = ?').get(enrollment.id);
        if (!alreadyCert) {
          const verificationCode = `CCELL-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
          const certId = uuidv4();
          db.prepare(`INSERT INTO certificates (id, enrollment_id, course_id, student_id, student_name, course_name, verification_code, cpd_units) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
            .run(certId, enrollment.id, enrollment.course_id, enrollment.student_id, enrollment.student_name, course?.title || 'Course', verificationCode, course?.cpd_units || 0);
          db.prepare('UPDATE users SET total_certificates = total_certificates + 1 WHERE id = ?').run(enrollment.student_id);
          certsIssued++;
        }
      }
    }

    logAudit(user.id, 'section_grades_finalized', { class_code_id: classCode.id, section: classCode.section, certs_issued: certsIssued });
    res.json({ success: true, message: `Section grades finalized. ${certsIssued} certificate(s) issued.`, certs_issued: certsIssued, total_students: enrollments.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/instructor/courses/:courseId/students', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT u.*, e.status, e.progress_percentage, e.enrolled_at, e.enrollment_type
      FROM enrollments e JOIN users u ON e.student_id = u.id
      WHERE e.course_id = ?
    `).all(req.params.courseId);
    res.json({ students: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/instructor/essays/pending', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const rows = db.prepare(`
      SELECT er.id, er.enrollment_id, er.quiz_id, er.question_id, er.answer_text,
             er.score, er.feedback, er.graded_at, er.submitted_at,
             u.name AS student_name, u.email AS student_email,
             e.class_code, e.enrollment_type,
             q.title AS quiz_title, q.questions,
             c.title AS course_title, c.id AS course_id,
             co.instructor_id
      FROM essay_responses er
      JOIN enrollments e ON e.id = er.enrollment_id
      JOIN users u ON u.id = e.student_id
      JOIN quizzes q ON q.id = er.quiz_id
      JOIN courses c ON c.id = e.course_id
      LEFT JOIN courses co ON co.id = e.course_id
      WHERE e.enrollment_type = 'academe_student'
        AND co.instructor_id = ?
      ORDER BY er.graded_at IS NULL DESC, er.submitted_at DESC
    `).all(user.id);

    const essays = rows.map(r => {
      const questions = JSON.parse(r.questions || '[]');
      const question = questions.find(q => q.id === r.question_id) || {};
      return {
        id: r.id,
        enrollment_id: r.enrollment_id,
        quiz_id: r.quiz_id,
        question_id: r.question_id,
        answer_text: r.answer_text,
        question_text: question.question || 'Essay Question',
        max_points: question.points || 10,
        score: r.score,
        feedback: r.feedback,
        graded_at: r.graded_at,
        submitted_at: r.submitted_at,
        class_code: r.class_code,
        student_name: r.student_name,
        student_email: r.student_email,
        quiz_title: r.quiz_title,
        course_title: r.course_title,
        course_id: r.course_id,
        is_graded: r.graded_at != null,
      };
    });
    res.json({ essays });
  } catch (err) {
    console.error('[essays/pending]', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/instructor/essays/:id/grade', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const { score, feedback } = req.body;
    if (score == null) return res.status(400).json({ error: 'score is required' });
    db.prepare(`
      UPDATE essay_responses SET score = ?, feedback = ?, graded_by = ?, graded_at = datetime('now') WHERE id = ?
    `).run(score, feedback || null, user.id, req.params.id);
    logAudit(user.id, 'essay_graded', { essay_id: req.params.id, score });
    try {
      const er = db.prepare('SELECT * FROM essay_responses WHERE id = ?').get(req.params.id);
      const e = db.prepare('SELECT * FROM enrollments WHERE id = ?').get(er?.enrollment_id);
      const studentUser = db.prepare('SELECT * FROM users WHERE id = ?').get(e?.student_id);
      if (studentUser) sendCounts(studentUser);
      const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(e?.course_id);
      if (course?.instructor_id) {
        const instUser = db.prepare('SELECT * FROM users WHERE id = ?').get(course.instructor_id);
        if (instUser) sendCounts(instUser);
      }
    } catch (_) {}
    res.json({ success: true, message: 'Essay graded' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/instructor/dashboard/stats', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const totalStudents = db.prepare(`SELECT COUNT(DISTINCT e.student_id) as c FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE c.instructor_id = ? AND e.status NOT IN ('pending_payment','suspended')`).get(user.id)?.c || 0;
    const academeStudents = db.prepare(`SELECT COUNT(DISTINCT e.student_id) as c FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE c.instructor_id = ? AND e.enrollment_type IN ('academe_student','academe_paid') AND e.status NOT IN ('pending_payment','suspended')`).get(user.id)?.c || 0;
    const certificatoryStudents = db.prepare(`SELECT COUNT(DISTINCT e.student_id) as c FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE c.instructor_id = ? AND e.enrollment_type = 'certificatory' AND e.status NOT IN ('pending_payment','suspended')`).get(user.id)?.c || 0;
    const totalRecommendations = db.prepare(`SELECT COUNT(*) as c FROM recommendations r JOIN courses c ON r.course_id = c.id WHERE c.instructor_id = ?`).get(user.id)?.c || 0;
    const pendingEssays = db.prepare(`SELECT COUNT(*) as c FROM essay_responses er JOIN enrollments e ON er.enrollment_id = e.id JOIN courses c ON e.course_id = c.id WHERE c.instructor_id = ? AND er.graded_at IS NULL`).get(user.id)?.c || 0;
    const pendingFinalizations = db.prepare(`SELECT COUNT(DISTINCT e.class_code_id) as c FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE c.instructor_id = ? AND e.enrollment_type = 'academe_student' AND e.final_assessment_passed = 1 AND e.status = 'active'`).get(user.id)?.c || 0;
    const reopenRequests = db.prepare(`SELECT COUNT(*) as c FROM reopen_requests rr JOIN enrollments e ON rr.enrollment_id = e.id JOIN courses c ON e.course_id = c.id WHERE c.instructor_id = ? AND rr.status = 'pending'`).get(user.id)?.c || 0;
    res.json({ stats: { totalStudents, academeStudents, certificatoryStudents, totalRecommendations, pendingEssays, pendingFinalizations, reopenRequests } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/instructor/analytics/progress', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const { course_id, class_code_id } = req.query;
    let sql = `
      SELECT u.id, u.name, u.email, e.id as enrollment_id, e.course_id, c.title as course_title,
             e.progress_percentage, e.status, e.enrolled_at, e.enrollment_type,
             e.expires_at, e.final_assessment_passed,
             cc.code as class_code, cc.section
      FROM enrollments e
      JOIN users u ON e.student_id = u.id
      JOIN courses c ON e.course_id = c.id
      LEFT JOIN class_codes cc ON e.class_code_id = cc.id
      WHERE c.instructor_id = ?
    `;
    const params = [user.id];
    if (course_id) { sql += ' AND e.course_id = ?'; params.push(course_id); }
    if (class_code_id) { sql += ' AND e.class_code_id = ?'; params.push(class_code_id); }
    sql += ' ORDER BY e.enrolled_at DESC';
    const rows = db.prepare(sql).all(...params);
    res.json({ students: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/instructor/grade-book', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const { course_id, class_code_id } = req.query;
    const conditions = ['c.instructor_id = ?'];
    const params = [user.id];
    if (course_id) { conditions.push('e.course_id = ?'); params.push(course_id); }
    if (class_code_id) { conditions.push('e.class_code_id = ?'); params.push(class_code_id); }
    const where = conditions.join(' AND ');
    const grades = db.prepare(`
      SELECT
        e.id AS enrollmentId,
        e.id AS id,
        u.name, u.email,
        e.course_id AS courseId,
        c.title AS course_title,
        e.enrollment_type AS enrollmentType,
        e.class_code AS classCode,
        e.class_code_id AS classCodeId,
        e.final_grade AS finalGrade,
        e.gwa,
        e.status,
        e.progress_percentage AS progressPercentage,
        e.enrolled_at AS enrolledAt,
        (SELECT ROUND(AVG(qr.score),1) FROM quiz_results qr WHERE qr.enrollment_id = e.id) AS averageScore,
        (SELECT COUNT(*) FROM essay_responses er WHERE er.enrollment_id = e.id AND er.graded_at IS NULL) AS pendingEssaysCount
      FROM enrollments e
      JOIN users u ON e.student_id = u.id
      JOIN courses c ON e.course_id = c.id
      WHERE ${where}
      ORDER BY u.name
    `).all(...params);
    res.json({ grades });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/instructor/enrollments/:id/finalize-grade', (req, res) => {
  const { final_grade, gwa, notes } = req.body;
  const finalGradeNum = Number.isFinite(Number(final_grade)) ? Number(final_grade) : 0;
  const gwaNum = Number.isFinite(Number(gwa)) ? Number(gwa) : percentageToGWA(finalGradeNum);

  db.prepare('UPDATE enrollments SET final_grade = ?, gwa = ? WHERE id = ?').run(finalGradeNum, gwaNum, req.params.id);
  logAudit(getUserId(req), 'grade_update', { enrollment_id: req.params.id, final_grade: finalGradeNum, gwa: gwaNum, notes: notes || '' });
  const enrollment = db.prepare('SELECT * FROM enrollments WHERE id = ?').get(req.params.id);
  if (enrollment?.enrollment_type === 'academe_student' && (enrollment.progress_percentage || 0) >= 100) {
    const alreadyExists = db.prepare('SELECT id FROM certificates WHERE enrollment_id = ?').get(req.params.id);
    if (!alreadyExists) {
      const student = db.prepare('SELECT * FROM users WHERE id = ?').get(enrollment.student_id);
      const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(enrollment.course_id);
      const verificationCode = `CCELL-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
      const certId = uuidv4();
      db.prepare(`INSERT INTO certificates (id, enrollment_id, course_id, student_id, student_name, course_name, verification_code, cpd_units) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(certId, req.params.id, enrollment.course_id, enrollment.student_id, student?.name || 'Student', course?.title || 'Course', verificationCode, course?.cpd_units || 0);
      db.prepare('UPDATE users SET total_certificates = total_certificates + 1 WHERE id = ?').run(enrollment.student_id);
      logAudit(getUserId(req), 'certificate_issue_on_finalize', { enrollment_id: req.params.id });
    }
  }
  const updated = db.prepare('SELECT final_grade, gwa, progress_percentage, status FROM enrollments WHERE id = ?').get(req.params.id);
  try {
    const e = db.prepare('SELECT * FROM enrollments WHERE id = ?').get(req.params.id);
    const studentUser = db.prepare('SELECT * FROM users WHERE id = ?').get(e?.student_id);
    if (studentUser) sendCounts(studentUser);
    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(e?.course_id);
    if (course?.instructor_id) {
      const instUser = db.prepare('SELECT * FROM users WHERE id = ?').get(course.instructor_id);
      if (instUser) sendCounts(instUser);
    }
  } catch (_) {}
  res.json({ success: true, message: 'Grade finalized', enrollment: updated });
});

app.get('/api/instructor/reopen-requests', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const rows = db.prepare(`
      SELECT rr.*, u.name AS student_name, u.email AS student_email,
             c.title AS course_name, e.class_code, e.progress_percentage, e.expires_at
      FROM reopen_requests rr
      JOIN users u ON u.id = rr.student_id
      JOIN courses c ON c.id = rr.course_id
      JOIN enrollments e ON e.id = rr.enrollment_id
      WHERE c.instructor_id = ?
      ORDER BY rr.status = 'pending' DESC, rr.requested_at DESC
    `).all(user.id);
    res.json({ requests: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/instructor/reopen-requests/:id/approve', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const { response_message, days = 30 } = req.body;
    const rr = db.prepare('SELECT * FROM reopen_requests WHERE id = ?').get(req.params.id);
    if (!rr) return res.status(404).json({ error: 'Request not found' });
    db.prepare("UPDATE reopen_requests SET status = 'approved', reviewed_by = ?, reviewed_at = datetime('now'), response_message = ? WHERE id = ?")
      .run(user.id, response_message || null, req.params.id);
    const enrollment = db.prepare('SELECT * FROM enrollments WHERE id = ?').get(rr.enrollment_id);
    const base = enrollment?.expires_at && new Date(enrollment.expires_at) > new Date()
      ? new Date(enrollment.expires_at) : new Date();
    const newExpiry = new Date(base.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
    db.prepare("UPDATE enrollments SET expires_at = ?, status = 'active' WHERE id = ?").run(newExpiry, rr.enrollment_id);
    logAudit(user.id, 'reopen_approved', { request_id: req.params.id });
    res.json({ success: true, message: 'Request approved and access extended' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/instructor/reopen-requests/:id/deny', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const { response_message } = req.body;
    db.prepare("UPDATE reopen_requests SET status = 'denied', reviewed_by = ?, reviewed_at = datetime('now'), response_message = ? WHERE id = ?")
      .run(user.id, response_message || null, req.params.id);
    logAudit(user.id, 'reopen_denied', { request_id: req.params.id });
    res.json({ success: true, message: 'Request denied' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/instructor/enrollments/:id/grant-extension', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const { days = 30 } = req.body;
    const enrollment = db.prepare('SELECT * FROM enrollments WHERE id = ?').get(req.params.id);
    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });
    const base = enrollment.expires_at && new Date(enrollment.expires_at) > new Date()
      ? new Date(enrollment.expires_at)
      : new Date();
    const newExpiry = new Date(base.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
    db.prepare("UPDATE enrollments SET expires_at = ?, status = 'active', is_expired = 0 WHERE id = ?").run(newExpiry, req.params.id);
    logAudit(user.id, 'extension_granted', { enrollment_id: req.params.id, days, new_expiry: newExpiry });
    res.json({ success: true, message: `Access extended by ${days} days`, new_expiry: newExpiry });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/instructor/messages', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const { unread_only, enrollment_type } = req.query;
    let sql = `
      SELECT m.*,
        sender.name AS sender_name, sender.role AS sender_role,
        recipient.name AS recipient_name,
        c.title AS course_title,
        e.enrollment_type AS student_enrollment_type
      FROM messages m
      LEFT JOIN users sender ON sender.id = m.sender_id
      LEFT JOIN users recipient ON recipient.id = m.recipient_id
      LEFT JOIN courses c ON c.id = m.course_id
      LEFT JOIN enrollments e ON e.student_id = m.sender_id AND e.course_id = m.course_id
      WHERE (m.recipient_id = ? OR m.sender_id = ?)
    `;
    const params = [user.id, user.id];
    if (unread_only === 'true') { sql += ' AND m.is_read = 0 AND m.recipient_id = ?'; params.push(user.id); }
    if (enrollment_type) { sql += ' AND e.enrollment_type = ?'; params.push(enrollment_type); }
    sql += ' ORDER BY m.created_at DESC';
    const msgs = db.prepare(sql).all(...params);
    res.json({ messages: msgs });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/instructor/messages', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const { student_id, message, parent_message_id, course_id } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'message is required' });
    if (!student_id) return res.status(400).json({ error: 'student_id is required' });
    const id = uuidv4();
    // Inherit course_id from parent message if not provided
    let resolvedCourseId = course_id || null;
    if (!resolvedCourseId && parent_message_id) {
      const parent = db.prepare('SELECT course_id FROM messages WHERE id = ?').get(parent_message_id);
      resolvedCourseId = parent?.course_id || null;
    }
    db.prepare('INSERT INTO messages (id, sender_id, recipient_id, course_id, message, parent_message_id) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, user.id, student_id, resolvedCourseId, message.trim(), parent_message_id || null);
    const saved = db.prepare('SELECT m.*, s.name AS sender_name, r.name AS recipient_name, c.title AS course_title FROM messages m LEFT JOIN users s ON s.id = m.sender_id LEFT JOIN users r ON r.id = m.recipient_id LEFT JOIN courses c ON c.id = m.course_id WHERE m.id = ?').get(id);
    res.json({ success: true, message: saved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/instructor/messages/:id/read', (req, res) => {
  db.prepare('UPDATE messages SET is_read = 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.get('/api/instructor/audit-log/certificates', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const { course_id } = req.query;
    let query = `
      SELECT al.*, u.name AS student_name, u.email AS student_email,
        c.title AS course_title, e.class_code_id,
        cc.code AS class_code
      FROM audit_logs al
      LEFT JOIN enrollments e ON json_extract(al.details, '$.enrollment_id') = e.id
      LEFT JOIN users u ON e.student_id = u.id
      LEFT JOIN courses c ON e.course_id = c.id
      WHERE al.action IN ('certificate_issue','certificate_issue_on_finalize','certificate_auto_issue')
        AND c.instructor_id = ?
    `;
    const params = [user.id];
    if (course_id) { query += ' AND c.id = ?'; params.push(course_id); }
    query += ' ORDER BY al.created_at DESC';
    const logs = db.prepare(query).all(...params);
    res.json({ logs });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/instructor/audit-log/export', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const rows = db.prepare(`
      SELECT al.created_at, u.name AS student_name, u.email AS student_email,
        c.title AS course_title, al.action, al.details
      FROM audit_logs al
      LEFT JOIN enrollments e ON json_extract(al.details, '$.enrollment_id') = e.id
      LEFT JOIN users u ON e.student_id = u.id
      LEFT JOIN courses c ON e.course_id = c.id
      WHERE al.action IN ('certificate_issue','certificate_issue_on_finalize','certificate_auto_issue')
        AND c.instructor_id = ?
      ORDER BY al.created_at DESC
    `).all(user.id);
    const escape = v => v == null ? '' : `"${String(v).replace(/"/g, '""')}"`;
    const header = 'Date,Student Name,Student Email,Course Title,Action';
    const lines = rows.map(r => [r.created_at, r.student_name, r.student_email, r.course_title, r.action].map(escape).join(','));
    const csv = [header, ...lines].join('\n');
    const b64 = Buffer.from(csv, 'utf8').toString('base64');
    res.json({ dataUrl: `data:text/csv;base64,${b64}`, filename: `audit-log-${Date.now()}.csv` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/instructor/courses/:courseId/enrollments/count', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as c FROM enrollments WHERE course_id = ?').get(req.params.courseId)?.c || 0;
  const active = db.prepare('SELECT COUNT(*) as c FROM enrollments WHERE course_id = ? AND status = \'active\'').get(req.params.courseId)?.c || 0;
  res.json({ count: total, active_count: active });
});

// ─── ADMIN NAMESPACE ──────────────────────────────────────────────────────────

app.get('/api/admin/users', (req, res) => {
  try {
    const users = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
    res.json({ users: users.map(u => ({ ...u, badges: JSON.parse(u.badges || '[]') })) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/users/:id', (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const enrollments = db.prepare('SELECT * FROM enrollments WHERE student_id = ?').all(req.params.id);
    const certs = db.prepare('SELECT * FROM certificates WHERE student_id = ?').all(req.params.id);
    res.json({ user: { ...user, badges: JSON.parse(user.badges || '[]') }, enrollments, certificates: certs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/users', (req, res) => {
  try {
    const { email, full_name, role, password, student_id, program, year_level } = req.body;
    if (!email || !full_name) return res.status(400).json({ error: 'email and full_name are required' });
    const id = uuidv4();
    const hash = password ? hashPassword(password) : null;
    db.prepare('INSERT INTO users (id, email, name, role, password_hash, student_id, program, year_level, badges) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(id, email.toLowerCase().trim(), full_name.trim(), role || 'student', hash, student_id || null, program || null, year_level || null, '[]');
    logAudit(getUserId(req), 'user_created', { created_user_id: id, role: role || 'student' });
    res.json({ success: true, user: safeUser(db.prepare('SELECT * FROM users WHERE id = ?').get(id)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/users/:id', (req, res) => {
  try {
    const { full_name, email, role } = req.body;
    db.prepare('UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email), role = COALESCE(?, role), updated_at = datetime(\'now\') WHERE id = ?')
      .run(full_name || null, email || null, role || null, req.params.id);
    res.json({ success: true, user: db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/users/:id', (req, res) => {
  try {
    const actor = requireUser(req, res);
    if (!actor) return;
    if (actor.id === req.params.id) return res.status(400).json({ error: 'Cannot delete your own account' });
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    logAudit(actor.id, 'user_deleted', { deleted_user_id: req.params.id });
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/users/:id/suspend', (req, res) => {
  const { suspended } = req.body;
  db.prepare('UPDATE users SET is_suspended = ? WHERE id = ?').run(suspended ? 1 : 0, req.params.id);
  res.json({ success: true, message: suspended ? 'User suspended' : 'User reactivated' });
});

app.get('/api/admin/courses/pending', (req, res) => {
  try {
    const courses = db.prepare('SELECT * FROM courses WHERE status = \'pending_approval\' ORDER BY created_at DESC').all();
    res.json({ courses: courses.map(parseCourse) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/courses/:id/approve', (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  db.prepare('UPDATE courses SET status = \'approved\', updated_at = datetime(\'now\') WHERE id = ?').run(req.params.id);
  logAudit(user.id, 'course_approve', { course_id: req.params.id });
  res.json({ success: true, course: parseCourse(db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id)), message: 'Course approved' });
});

app.post('/api/admin/courses/:id/reject', (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  const { rejection_reason } = req.body;
  db.prepare('UPDATE courses SET status = \'rejected\', rejection_reason = ?, updated_at = datetime(\'now\') WHERE id = ?').run(rejection_reason || '', req.params.id);
  logAudit(user.id, 'course_reject', { course_id: req.params.id });
  res.json({ success: true, course: parseCourse(db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id)), message: 'Course rejected' });
});

app.post('/api/admin/courses/:id/archive', (req, res) => {
  db.prepare('UPDATE courses SET status = \'archived\' WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Course archived' });
});

app.get('/api/admin/payments/pending', (req, res) => {
  try {
    const { status } = req.query;
    let sql = `
      SELECT e.*, u.name as student_name, u.email as student_email, c.title as course_title
      FROM enrollments e JOIN users u ON e.student_id = u.id JOIN courses c ON e.course_id = c.id
      WHERE e.payment_method IS NOT NULL
    `;
    const params = [];
    if (status && status !== 'all') {
      sql += ' AND e.payment_status = ?';
      params.push(status);
    }
    sql += ' ORDER BY e.enrolled_at DESC';
    const rows = db.prepare(sql).all(...params);
    res.json({ enrollments: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/payments/:id/verify', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const { approved } = req.body;
    const status = approved ? 'verified' : 'rejected';
    db.prepare('UPDATE enrollments SET payment_status = ?, status = ? WHERE id = ?')
      .run(status, approved ? 'active' : 'suspended', req.params.id);
    logAudit(user.id, 'payment_verified', { enrollment_id: req.params.id, approved });
    const enrollment = enrichEnrollment(db.prepare('SELECT * FROM enrollments WHERE id = ?').get(req.params.id));
    res.json({ success: true, enrollment, message: approved ? 'Payment approved' : 'Payment rejected' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/dashboard/stats', (req, res) => {
  try {
    const totalUsers = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
    const totalCourses = db.prepare('SELECT COUNT(*) as c FROM courses WHERE status = \'approved\'').get().c;
    const totalEnrollments = db.prepare('SELECT COUNT(*) as c FROM enrollments').get().c;
    const totalCerts = db.prepare('SELECT COUNT(*) as c FROM certificates').get().c;
    const pendingApprovals = db.prepare('SELECT COUNT(*) as c FROM courses WHERE status = \'pending_approval\'').get().c;
    const pendingPayments = db.prepare('SELECT COUNT(*) as c FROM enrollments WHERE payment_status = \'pending\'').get().c;
    res.json({ stats: { total_users: totalUsers, total_courses: totalCourses, total_enrollments: totalEnrollments, total_certificates: totalCerts, pending_approvals: pendingApprovals, pending_payments: pendingPayments } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/analytics', (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const quarter = parseInt(req.query.quarter) || 0; // 0 = all year

    const quarterRange = quarter > 0
      ? { startMonth: (quarter - 1) * 3 + 1, endMonth: quarter * 3 }
      : { startMonth: 1, endMonth: 12 };

    const dateStart = `${year}-${String(quarterRange.startMonth).padStart(2, '0')}-01`;
    const dateEnd = `${year}-${String(quarterRange.endMonth).padStart(2, '0')}-31`;

    // Overview totals (all-time)
    const totalUsers = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'student'").get().c;
    const totalCourses = db.prepare("SELECT COUNT(*) as c FROM courses WHERE status = 'approved'").get().c;
    const totalCerts = db.prepare('SELECT COUNT(*) as c FROM certificates').get().c;
    const activeLearners = db.prepare("SELECT COUNT(DISTINCT student_id) as c FROM enrollments WHERE status = 'active'").get().c;
    const totalRevenue = db.prepare("SELECT COALESCE(SUM(payment_amount), 0) as s FROM enrollments WHERE payment_status = 'verified'").get().s;

    // Monthly breakdown within selected period
    const months = [];
    for (let m = quarterRange.startMonth; m <= quarterRange.endMonth; m++) {
      const mStr = `${year}-${String(m).padStart(2, '0')}`;
      const enrollCount = db.prepare("SELECT COUNT(*) as c FROM enrollments WHERE strftime('%Y-%m', enrolled_at) = ?").get(mStr).c;
      const certCount = db.prepare("SELECT COUNT(*) as c FROM certificates WHERE strftime('%Y-%m', issue_date) = ?").get(mStr).c;
      const revenue = db.prepare("SELECT COALESCE(SUM(payment_amount), 0) as s FROM enrollments WHERE payment_status = 'verified' AND strftime('%Y-%m', enrolled_at) = ?").get(mStr).s;
      const monthName = new Date(year, m - 1, 1).toLocaleString('default', { month: 'short' });
      months.push({ month: monthName, enrollments: enrollCount, certificates: certCount, revenue: Math.round(revenue) });
    }

    const courseStatsBase = `
      SELECT c.title, c.category,
             u.name as instructor_name,
             COUNT(e.id) as enrollments,
             COALESCE(SUM(CASE WHEN e.payment_status = 'verified' THEN e.payment_amount ELSE 0 END), 0) as revenue,
             (SELECT COUNT(*) FROM recommendations r WHERE r.course_id = c.id) as recommendations
      FROM enrollments e
      JOIN courses c ON c.id = e.course_id
      LEFT JOIN users u ON u.id = c.instructor_id
      WHERE e.enrolled_at BETWEEN ? AND ?
      GROUP BY c.id
    `;
    const topByRevenue = db.prepare(courseStatsBase + ' ORDER BY revenue DESC, enrollments DESC LIMIT 5').all(dateStart, dateEnd + 'T23:59:59');
    const topByEnrollments = db.prepare(courseStatsBase + ' ORDER BY enrollments DESC, revenue DESC LIMIT 5').all(dateStart, dateEnd + 'T23:59:59');
    const topCourses = topByRevenue;

    // Category distribution for period
    const categories = db.prepare(`
      SELECT c.category,
             COUNT(DISTINCT c.id) as courses,
             COUNT(e.id) as enrollments
      FROM courses c
      LEFT JOIN enrollments e ON e.course_id = c.id AND e.enrolled_at BETWEEN ? AND ?
      WHERE c.status = 'approved' AND c.category IS NOT NULL
      GROUP BY c.category
      ORDER BY enrollments DESC
    `).all(dateStart, dateEnd + 'T23:59:59');

    // Recent audit activity
    const recentActivity = db.prepare(`
      SELECT al.action, al.details, al.created_at, u.name as user_name
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.user_id
      ORDER BY al.created_at DESC
      LIMIT 8
    `).all().map(a => {
      let detail = '';
      try { const d = JSON.parse(a.details || '{}'); detail = d.course_id || d.enrollment_id || ''; } catch (_) {}
      return { action: a.action.replace(/_/g, ' '), detail: `${a.user_name || 'System'} — ${detail}`, time: a.created_at, type: a.action.includes('cert') ? 'certificate' : a.action.includes('enroll') ? 'enrollment' : a.action.includes('payment') ? 'payment' : 'course' };
    });

    res.json({
      overview: { totalUsers, totalCourses, totalCerts, activeLearners, totalRevenue: Math.round(totalRevenue) },
      monthlyData: months,
      topCourses: topCourses.map(c => ({ title: c.title, instructor: c.instructor_name || 'Instructor', enrollments: c.enrollments, revenue: Math.round(c.revenue), recommendations: c.recommendations })),
      topByRevenue: topByRevenue.map(c => ({ title: c.title, instructor: c.instructor_name || 'Instructor', enrollments: c.enrollments, revenue: Math.round(c.revenue), recommendations: c.recommendations })),
      topByEnrollments: topByEnrollments.map(c => ({ title: c.title, instructor: c.instructor_name || 'Instructor', enrollments: c.enrollments, revenue: Math.round(c.revenue), recommendations: c.recommendations })),
      categoryData: categories.map(c => ({ category: c.category, courses: c.courses, enrollments: c.enrollments })),
      recentActivity,
    });
  } catch (err) {
    console.error('[admin/analytics]', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/courses', (req, res) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit || '500'), 10) || 500, 1000);
    const offset = Math.max(parseInt(String(req.query.offset || '0'), 10) || 0, 0);
    const total = db.prepare('SELECT COUNT(*) as c FROM courses').get()?.c || 0;
    const courses = db.prepare(`
      SELECT c.*,
        (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status NOT IN ('pending_payment','suspended')) as enrolled_count,
        (SELECT COUNT(*) FROM recommendations r WHERE r.course_id = c.id) as recommendation_count
      FROM courses c ORDER BY c.created_at DESC LIMIT ? OFFSET ?
    `).all(limit, offset);
    res.json({ courses: courses.map(parseCourse), total, page: { limit, offset } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/enrollments', (req, res) => {
  try {
    const { course_id } = req.query;
    const limit = Math.min(parseInt(String(req.query.limit || '500'), 10) || 500, 1000);
    const offset = Math.max(parseInt(String(req.query.offset || '0'), 10) || 0, 0);
    const where = course_id ? 'WHERE e.course_id = ?' : '';
    const params = course_id ? [course_id] : [];
    const total = db.prepare(`
      SELECT COUNT(*) as c
      FROM enrollments e JOIN users u ON e.student_id = u.id JOIN courses c ON e.course_id = c.id
      ${where}
    `).get(...params)?.c || 0;
    const rows = db.prepare(`
      SELECT e.*, u.name as student_name, u.email as student_email, c.title as course_title
      FROM enrollments e JOIN users u ON e.student_id = u.id JOIN courses c ON e.course_id = c.id
      ${where}
      ORDER BY e.enrolled_at DESC LIMIT ? OFFSET ?
    `).all(...params, limit, offset);
    res.json({ enrollments: rows, total, page: { limit, offset } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/certificates', (req, res) => {
  try {
    const { search, course_id } = req.query;
    const limit = Math.min(parseInt(String(req.query.limit || '500'), 10) || 500, 1000);
    const offset = Math.max(parseInt(String(req.query.offset || '0'), 10) || 0, 0);
    const conditions = [];
    const params = [];
    if (search) {
      conditions.push('(c.student_name LIKE ? OR c.course_name LIKE ? OR c.verification_code LIKE ? OR u.email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (course_id) { conditions.push('c.course_id = ?'); params.push(course_id); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const total = db.prepare(`
      SELECT COUNT(*) as c
      FROM certificates c
      LEFT JOIN users u ON u.id = c.student_id
      LEFT JOIN courses co ON co.id = c.course_id
      ${where}
    `).get(...params)?.c || 0;
    const certs = db.prepare(`
      SELECT c.*, u.email AS student_email,
        (SELECT name FROM users WHERE id = co.instructor_id) AS instructor_name
      FROM certificates c
      LEFT JOIN users u ON u.id = c.student_id
      LEFT JOIN courses co ON co.id = c.course_id
      ${where}
      ORDER BY c.issue_date DESC LIMIT ? OFFSET ?
    `).all(...params, limit, offset);
    res.json({ certificates: certs, total, page: { limit, offset } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/audit-logs', (req, res) => {
  try {
    const { limit = 100, offset = 0, action, search, from, to } = req.query;
    const conditions = [];
    const params = [];
    if (action) { conditions.push('al.action = ?'); params.push(action); }
    if (search) { conditions.push('(al.action LIKE ? OR u.name LIKE ? OR al.details LIKE ?)'); params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    if (from) { conditions.push("al.created_at >= ?"); params.push(from); }
    if (to) { conditions.push("al.created_at <= ?"); params.push(to); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const logs = db.prepare(`
      SELECT al.*, u.name AS user_name, u.email AS user_email, u.role AS user_role
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.user_id
      ${where}
      ORDER BY al.created_at DESC LIMIT ? OFFSET ?
    `).all(...params, Number(limit), Number(offset));
    const total = db.prepare(`SELECT COUNT(*) as c FROM audit_logs al LEFT JOIN users u ON u.id = al.user_id ${where}`).get(...params)?.c || 0;
    const actions = db.prepare('SELECT DISTINCT action FROM audit_logs ORDER BY action').all().map(r => r.action);
    res.json({ logs, total, actions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/maintenance/expire-enrollments', (req, res) => {
  try {
    const result = db.prepare("UPDATE enrollments SET status = 'expired', is_expired = 1 WHERE expires_at < datetime('now') AND status = 'active'").run();
    res.json({ success: true, expired_count: result.changes, message: `${result.changes} enrollments expired` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PROFILE (top-level, used by old api.ts) ──────────────────────────────────

app.get('/api/mock/profile', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    res.json({ profile: { ...user, badges: JSON.parse(user.badges || '[]') } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── HEALTH ───────────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── PLATFORM SETTINGS ───────────────────────────────────────────────────────

app.get('/api/admin/settings', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const rows = db.prepare('SELECT key, value FROM platform_settings').all();
    const settings = Object.fromEntries(rows.map(r => [r.key, r.value]));
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/settings', (req, res) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const updates = req.body;
    const upsert = db.prepare('INSERT INTO platform_settings (key, value, updated_at) VALUES (?, ?, datetime(\'now\')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at');
    db.transaction(() => {
      for (const [key, value] of Object.entries(updates)) {
        upsert.run(key, String(value));
      }
    })();
    logAudit(getUserId(req), 'settings_update', { keys: Object.keys(updates) });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── START ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[CCELL-LNU Server] Running on http://localhost:${PORT}`);
  console.log(`[CCELL-LNU Server] API base: http://localhost:${PORT}/api`);
});
