// seed-accounts.js — idempotent: sets passwords for all users and creates real instructor accounts
const crypto = require('crypto');

function hash(pw) {
  return crypto.createHash('sha256').update(pw + 'ccell-lnu-salt').digest('hex');
}

function seedAccounts(db) {
  // ── 1. Set passwords for all existing demo accounts ──────────────────────────
  const passwords = {
    'student-1':    { pw: 'Santos@2025',   email: 'student@lnu.edu.ph' },
    'instructor-1': { pw: 'Rivera@2025',   email: 'instructor@lnu.edu.ph' },
    'admin-1':      { pw: 'Admin@2025',    email: 'admin@lnu.edu.ph' },
  };

  for (const [id, { pw, email }] of Object.entries(passwords)) {
    db.prepare(`
      UPDATE users SET password_hash = ?, email = ?, updated_at = datetime('now')
      WHERE id = ? AND (password_hash IS NULL OR password_hash = '')
    `).run(hash(pw), email, id);
  }

  // ── 2. Create instructor accounts for each course ─────────────────────────────
  const instructors = [
    { id: 'instructor-2', name: 'Prof. Ana Cruz',         email: 'ana.cruz@lnu.edu.ph',         pw: 'Cruz@2025'     },
    { id: 'instructor-3', name: 'Dr. Carlos Mendoza',     email: 'carlos.mendoza@lnu.edu.ph',   pw: 'Mendoza@2025'  },
    { id: 'instructor-4', name: 'Engr. Lisa Reyes',       email: 'lisa.reyes@lnu.edu.ph',       pw: 'Reyes@2025'    },
    { id: 'instructor-5', name: 'Mark Tan',               email: 'mark.tan@lnu.edu.ph',         pw: 'MarkTan@2025'  },
    { id: 'instructor-6', name: 'CPA Maria Lopez',        email: 'maria.lopez@lnu.edu.ph',      pw: 'Lopez@2025'    },
    { id: 'instructor-7', name: 'Engr. Roberto Bautista', email: 'roberto.bautista@lnu.edu.ph', pw: 'Bautista@2025' },
  ];

  for (const { id, name, email, pw } of instructors) {
    db.prepare(`
      INSERT OR IGNORE INTO users
        (id, email, name, role, password_hash, badges, total_cpd_units, total_certificates, total_courses_completed)
      VALUES (?, ?, ?, 'instructor', ?, '[]', 0, 0, 0)
    `).run(id, email, name, hash(pw));

    // If already exists but no password, set it
    db.prepare(`
      UPDATE users SET password_hash = ?, name = ?, updated_at = datetime('now')
      WHERE id = ? AND (password_hash IS NULL OR password_hash = '')
    `).run(hash(pw), name, id);
  }

  // ── 3. Also ensure extra students have passwords ──────────────────────────────
  const studentPasswords = [
    ['student-demo-2', 'DelacruzPass@2025'],
    ['student-demo-3', 'ReyesPass@2025'],
    ['student-demo-4', 'SantosPass@2025'],
    ['student-demo-5', 'MendozaPass@2025'],
    ['student-demo-6', 'GarciaPass@2025'],
  ];
  for (const [id, pw] of studentPasswords) {
    db.prepare(`
      UPDATE users SET password_hash = ?, updated_at = datetime('now')
      WHERE id = ? AND (password_hash IS NULL OR password_hash = '')
    `).run(hash(pw), id);
  }

  // ── 4. Link courses to the correct instructor_id ──────────────────────────────
  // Course 1: Dr. John Rivera (instructor-1) — Introduction to Cybersecurity
  // Course 2: Prof. Ana Cruz (instructor-2)  — Digital Marketing
  // Course 3: Dr. Carlos Mendoza (instructor-3) — Data Science
  // Course 4: Engr. Lisa Reyes (instructor-4) — Project Management
  // Course 5: Mark Tan (instructor-5) — Web Development
  // Course 6: CPA Maria Lopez (instructor-6) — Financial Literacy
  // Course 7: Engr. Roberto Bautista (instructor-7) — Cisco CCNA
  // Course 8: Dr. John Rivera (instructor-1) — Ethical Hacking
  const courseInstructorMap = [
    ['1', 'instructor-1'],
    ['2', 'instructor-2'],
    ['3', 'instructor-3'],
    ['4', 'instructor-4'],
    ['5', 'instructor-5'],
    ['6', 'instructor-6'],
    ['7', 'instructor-7'],
    ['8', 'instructor-1'],
  ];
  for (const [courseId, instructorId] of courseInstructorMap) {
    db.prepare(`UPDATE courses SET instructor_id = ? WHERE id = ? AND (instructor_id IS NULL OR instructor_id = ?)`).run(instructorId, courseId, 'instructor-1');
    // Always set course 2-7 to their real instructor (override any previous instructor-1 assignment)
    if (courseId !== '1' && courseId !== '8') {
      db.prepare(`UPDATE courses SET instructor_id = ? WHERE id = ?`).run(instructorId, courseId);
    }
  }

  // ── 5. Update class_codes to correct instructor ────────────────────────────────
  // DIGMKT-2025 is for course 2 → instructor-2
  db.prepare(`UPDATE class_codes SET instructor_id = 'instructor-2' WHERE course_id = '2'`).run();

  console.log('[DB] Accounts and course-instructor links ensured.');
}

module.exports = { seedAccounts };
