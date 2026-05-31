// CCELL-LNU API Client V2.0
// Frontend API client using relational database endpoints
// Date: May 10, 2026

import type {
  Course,
  Enrollment,
  EnrollmentType,
  Certificate,
  Lesson,
  Assessment,
  AssessmentAttempt,
  LessonProgress,
} from '../../types/database';

const BASE_URL = '/api';

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add mock user ID from localStorage (temporary during migration)
  const storedUser = localStorage.getItem('ccell-user');
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      if (user.id) {
        headers['X-Mock-User-Id'] = user.id;
      }
    } catch {}
  }

  return headers;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        ...getHeaders(),
        ...options?.headers,
      },
    });
  } catch {
    throw new Error('Cannot reach the server. Make sure the backend is running.');
  }

  // Check if response is JSON
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');

  let data: any;
  try {
    data = isJson ? await response.json() : await response.text();
  } catch (parseError) {
    console.error(`Failed to parse response from ${path}:`, parseError);
    throw new Error('Invalid response from server (expected JSON)');
  }

  if (!response.ok) {
    const errorMessage = isJson && data.error
      ? data.error
      : `API error ${response.status} — endpoint may not exist`;
    console.error(`API Error [${response.status}] ${path}:`, data);
    throw new Error(errorMessage);
  }

  return data;
}

// ============================================================
// FILE UPLOADS
// ============================================================

export async function uploadFiles(files: File[]): Promise<{ success: boolean; urls: string[]; files: { originalname: string; size: number; mimetype: string }[] }> {
  const formData = new FormData();
  files.forEach(f => formData.append('files', f));

  // Get user ID header but don't set Content-Type (browser sets it for FormData)
  const storedUser = localStorage.getItem('ccell-user');
  const headers: Record<string, string> = {};
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      if (user.id) headers['X-Mock-User-Id'] = user.id;
    } catch {}
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
  } catch {
    throw new Error('Cannot reach the server. Make sure the backend is running.');
  }

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');

  let data: any;
  try {
    data = isJson ? await response.json() : await response.text();
  } catch {
    throw new Error('Invalid response from server (expected JSON)');
  }

  if (!response.ok) {
    throw new Error((isJson && data?.error) ? data.error : `Upload failed (${response.status})`);
  }
  return data;
}

// ============================================================
// COURSES
// ============================================================

export async function getCourses() {
  return request<{ courses: Course[] }>('/courses');
}

export async function getCourse(courseId: string) {
  return request<{ course: Course; lessons: Lesson[] }>(`/courses/${courseId}`);
}

// ============================================================
// ENROLLMENTS (V2.0 - Two-Track System)
// ============================================================

export interface EnrollCertificatoryParams {
  course_id: string;
  enrollment_type: 'certificatory';
  payment_method: string;
  payment_reference?: string;
  payment_amount: number;
  payment_proof_url?: string;
}

export interface EnrollAcademeStudentParams {
  course_id: string;
  enrollment_type: 'academe_student';
  class_code: string;
}

export interface EnrollAcademePaidParams {
  course_id: string;
  enrollment_type: 'academe_paid';
  payment_method: string;
  payment_reference?: string;
  payment_amount: number;
  payment_proof_url?: string;
}

export type EnrollParams =
  | EnrollCertificatoryParams
  | EnrollAcademeStudentParams
  | EnrollAcademePaidParams;

export async function enrollInCourse(params: EnrollParams) {
  return request<{ success: boolean; enrollment: Enrollment; message: string }>('/enrollments', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function getMyEnrollments() {
  return request<{ enrollments: any[] }>('/enrollments/my');
}

// ============================================================
// PROGRESS TRACKING
// ============================================================

export async function completeLesson(data: { enrollment_id: string; lesson_id: string }) {
  return request<{ success: boolean; progress: LessonProgress; message: string }>(
    '/progress/lesson',
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}

// ============================================================
// ASSESSMENTS/QUIZZES (V2.0 - Interactive)
// ============================================================

export async function getAssessment(assessmentId: string, enrollmentId?: string) {
  const query = enrollmentId ? `?enrollment_id=${encodeURIComponent(enrollmentId)}` : '';
  return request<{
    assessment: Assessment & { max_retakes: number; max_total_attempts: number };
    attempt_number: number;
    can_retake: boolean;
    has_passed: boolean;
  }>(`/assessments/${assessmentId}${query}`);
}

export async function submitAssessment(data: {
  assessment_id: string;
  enrollment_id: string;
  answers: Record<string, string>;
  time_taken_seconds?: number;
}) {
  return request<{
    success: boolean;
    attempt: { score: number; passed: boolean; attempt_number: number; status: string };
    question_results: { id: string; type: string; is_correct: boolean | null; correct_answer: string | null }[];
    message: string;
  }>(
    '/assessments/submit',
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}

export async function getCourseFinalAssessment(courseId: string) {
  return request<{ assessment: any | null }>(`/courses/${courseId}/final-assessment`);
}

// ============================================================
// CERTIFICATES
// ============================================================

export async function generateCertificate(enrollmentId: string) {
  return request<{ success: boolean; certificate: Certificate; message: string }>(
    '/certificates/generate',
    {
      method: 'POST',
      body: JSON.stringify({ enrollment_id: enrollmentId }),
    }
  );
}

export async function getMyCertificates() {
  return request<{ certificates: any[] }>('/certificates/my');
}

export async function verifyCertificate(code: string) {
  const raw = await request<any>(`/certificates/verify/${encodeURIComponent(code)}`);
  if (!raw.valid || !raw.certificate) return raw as { valid: false };
  const c = raw.certificate;
  return {
    valid: true as const,
    certificate: {
      id: c.id || '',
      courseName: c.course_name || c.courseName || '',
      studentName: c.student_name || c.studentName || '',
      issueDate: c.issue_date || c.issueDate || '',
      verificationCode: c.verification_code || c.verificationCode || '',
      cpdUnits: c.cpd_units ?? c.cpdUnits ?? 0,
      status: c.status || '',
    },
  };
}

// ============================================================
// INSTRUCTOR ENDPOINTS
// ============================================================

export namespace Instructor {
  // Course Management
  export async function createCourse(data: {
    title: string;
    description?: string;
    course_code?: string;
    course_type: 'certificatory' | 'academe';
    category_id?: string;
    price?: number;
    duration_weeks: number;
    duration_hours?: number;
    focus_of_lesson?: string;
    learning_objectives?: string[];
    cpd_units?: number;
    certificate_template_url?: string;
  }) {
    return request<{ success: boolean; course: Course; message: string }>(
      '/instructor/courses',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  export async function updateCourse(courseId: string, data: Partial<Course>) {
    return request<{ success: boolean; course: Course }>(`/instructor/courses/${courseId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  export async function submitCourseForApproval(courseId: string) {
    return request<{ success: boolean; course: Course; message: string }>(
      `/instructor/courses/${courseId}/submit-for-approval`,
      {
        method: 'POST',
      }
    );
  }

  export async function getMyCourses() {
    return request<{ courses: Course[] }>('/instructor/courses');
  }

  // Lesson Management
  export async function createLesson(courseId: string, data: {
    title: string;
    description?: string;
    lesson_order: number;
    images?: string[];
    key_points?: string[];
    video_url?: string;
    powerpoint_url?: string;
    estimated_duration_minutes?: number;
  }) {
    return request<{ success: boolean; lesson: Lesson }>(
      `/instructor/courses/${courseId}/lessons`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  export async function updateLesson(lessonId: string, data: Partial<Lesson>) {
    return request<{ success: boolean; lesson: Lesson }>(`/instructor/lessons/${lessonId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  export async function deleteLesson(lessonId: string) {
    return request<{ success: boolean }>(`/instructor/lessons/${lessonId}`, {
      method: 'DELETE',
    });
  }

  // Assessment Management
  export async function createAssessment(courseId: string, data: {
    assessment_type: 'pre_test' | 'post_test' | 'final_assessment';
    lesson_id?: string;
    title: string;
    description?: string;
    questions: any[];
    passing_score_percentage?: number;
    max_retakes?: number;
    allow_retakes?: boolean;
    show_correct_on_wrong?: boolean;
    time_limit_minutes?: number;
  }) {
    return request<{ success: boolean; assessment: Assessment }>(
      `/instructor/courses/${courseId}/assessments`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  export async function getCourseAssessments(courseId: string) {
    return request<{ assessments: any[] }>(`/instructor/courses/${courseId}/assessments`);
  }

  export async function updateAssessment(assessmentId: string, data: {
    title?: string;
    questions?: any[];
    passing_score_percentage?: number;
    max_retakes?: number;
    time_limit_minutes?: number;
    allow_retakes?: boolean;
  }) {
    return request<{ success: boolean; assessment: any }>(`/instructor/assessments/${assessmentId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  export async function deleteAssessment(assessmentId: string) {
    return request<{ success: boolean }>(`/instructor/assessments/${assessmentId}`, {
      method: 'DELETE',
    });
  }

  // Class Code Management
  export async function createClassCode(data: {
    course_id: string;
    code: string;
    section: string;
    program?: string;
    year_level?: number;
    semester?: string;
    school_year?: string;
    max_uses?: number;
    expires_at?: string;
  }) {
    return request<{ success: boolean; class_code: any }>('/instructor/class-codes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  export async function getMyClassCodes() {
    return request<{ class_codes: any[] }>('/instructor/class-codes');
  }

  export async function deactivateClassCode(codeId: string) {
    return request<{ success: boolean; class_code: any }>(
      `/instructor/class-codes/${codeId}/deactivate`,
      {
        method: 'POST',
      }
    );
  }

  export async function activateClassCode(codeId: string) {
    return request<{ success: boolean; class_code: any }>(
      `/instructor/class-codes/${codeId}/activate`,
      {
        method: 'POST',
      }
    );
  }

  export async function finalizeSectionGrades(codeId: string) {
    return request<{ success: boolean; message: string; certs_issued: number; total_students: number }>(
      `/instructor/class-codes/${codeId}/finalize-section`,
      {
        method: 'POST',
      }
    );
  }

  // Student Management
  export async function getCourseStudents(courseId: string) {
    return request<{ students: any[] }>(`/instructor/courses/${courseId}/students`);
  }

  // Essay Grading
  export async function getPendingEssays() {
    return request<{ essays: any[] }>('/instructor/essays/pending');
  }

  export async function gradeEssay(essayId: string, data: { score: number; feedback?: string }) {
    return request<{ success: boolean; essay: any; message: string }>(
      `/instructor/essays/${essayId}/grade`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  // Dashboard Analytics
  export async function getDashboardStats() {
    return request<{ stats: any }>('/instructor/dashboard/stats');
  }

  // Student Progress & Analytics
  export async function getStudentProgress(filters?: {
    course_id?: string;
    class_code_id?: string;
  }) {
    const params = new URLSearchParams();
    if (filters?.course_id) params.append('course_id', filters.course_id);
    if (filters?.class_code_id) params.append('class_code_id', filters.class_code_id);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<{ students: any[] }>(`/instructor/analytics/progress${query}`);
  }

  // Grade Book
  export async function getGradeBook(filters?: {
    course_id?: string;
    class_code_id?: string;
  }) {
    const params = new URLSearchParams();
    if (filters?.course_id) params.append('course_id', filters.course_id);
    if (filters?.class_code_id) params.append('class_code_id', filters.class_code_id);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<{ grades: any[] }>(`/instructor/grade-book${query}`);
  }

  export async function finalizeGrade(enrollmentId: string, data: {
    final_grade: number;
    gwa?: number;
    notes?: string;
  }) {
    return request<{ success: boolean; message: string }>(
      `/instructor/enrollments/${enrollmentId}/finalize-grade`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  export async function grantExtension(enrollmentId: string, days = 30) {
    return request<{ success: boolean; message: string; new_expiry: string }>(
      `/instructor/enrollments/${enrollmentId}/grant-extension`,
      { method: 'POST', body: JSON.stringify({ days }) }
    );
  }

  export async function getReopenRequests() {
    return request<{ requests: any[] }>('/instructor/reopen-requests');
  }

  export async function approveReopenRequest(requestId: string, responseMessage?: string, days = 30) {
    return request<{ success: boolean; message: string }>(
      `/instructor/reopen-requests/${requestId}/approve`,
      { method: 'POST', body: JSON.stringify({ response_message: responseMessage, days }) }
    );
  }

  export async function denyReopenRequest(requestId: string, responseMessage?: string) {
    return request<{ success: boolean; message: string }>(
      `/instructor/reopen-requests/${requestId}/deny`,
      { method: 'POST', body: JSON.stringify({ response_message: responseMessage }) }
    );
  }

  // Messaging/Inbox
  export async function getMessages(filters?: {
    unread_only?: boolean;
    enrollment_type?: 'academe_student' | 'certificatory';
  }) {
    const params = new URLSearchParams();
    if (filters?.unread_only) params.append('unread_only', 'true');
    if (filters?.enrollment_type) params.append('enrollment_type', filters.enrollment_type);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<{ messages: any[] }>(`/instructor/messages${query}`);
  }

  export async function sendMessage(data: {
    student_id: string;
    parent_message_id?: string;
    message: string;
  }) {
    return request<{ success: boolean; message: any }>(
      '/instructor/messages',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  export async function markMessageAsRead(messageId: string) {
    return request<{ success: boolean }>(
      `/instructor/messages/${messageId}/read`,
      {
        method: 'POST',
      }
    );
  }

  // Certificate Audit Log
  export async function getCertificateAuditLog(filters?: {
    course_id?: string;
    start_date?: string;
    end_date?: string;
  }) {
    const params = new URLSearchParams();
    if (filters?.course_id) params.append('course_id', filters.course_id);
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<{ logs: any[] }>(`/instructor/audit-log/certificates${query}`);
  }

  export async function exportAuditLog(format: 'csv' | 'json' = 'csv') {
    return request<{ dataUrl: string; filename: string }>(
      `/instructor/audit-log/export?format=${format}`
    );
  }

  // Enrolled Students Count
  export async function getEnrolledStudentsCount(courseId: string) {
    return request<{ count: number; active_count: number }>(
      `/instructor/courses/${courseId}/enrollments/count`
    );
  }
}

// ============================================================
// STUDENT ENDPOINTS
// ============================================================

export namespace Student {
  // Join a Class (via class code)
  export async function joinClass(code: string) {
    return request<{ success: boolean; message: string; enrollment: { id: string; course_id: string; course_title: string; section: string; enrollment_type: string } }>(
      '/student/join-class',
      {
        method: 'POST',
        body: JSON.stringify({ code }),
      }
    );
  }

  // Enrollments
  export async function getMyEnrollments() {
    return request<{ enrollments: any[] }>('/student/enrollments');
  }

  export async function getEnrollment(courseId: string) {
    return request<{ enrollment: any }>(`/student/enrollments/course/${courseId}`);
  }

  export async function requestCourseReopen(enrollmentId: string, data: { reason: string }) {
    return request<{ success: boolean; message: string }>(
      `/student/enrollments/${enrollmentId}/request-reopen`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  export async function reenrollCourse(data: {
    course_id: string;
    payment_method: string;
    payment_reference: string;
    payment_amount: number;
    payment_proof_url: string;
  }) {
    return request<{ success: boolean; enrollment: any; message: string }>(
      '/student/enrollments/reenroll',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  // Learning
  export async function getCourseLessons(courseId: string) {
    return request<{ lessons: any[] }>(`/student/courses/${courseId}/lessons`);
  }

  export async function completeLesson(data: { enrollment_id: string; lesson_id: string }) {
    return request<{ success: boolean; message: string }>(
      '/student/progress/lesson',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  // Messages
  export async function getMessages() {
    return request<{ messages: any[] }>('/student/messages');
  }

  export async function sendMessage(data: {
    course_id: string;
    subject?: string;
    parent_message_id?: string;
    message: string;
  }) {
    return request<{ success: boolean; message: any }>(
      '/student/messages',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  export async function markMessageAsRead(messageId: string) {
    return request<{ success: boolean }>(
      `/student/messages/${messageId}/read`,
      {
        method: 'POST',
      }
    );
  }

  // Certificates
  export async function getCertificates(params?: { search?: string; enrollment_type?: string; limit?: number; offset?: number }) {
    const p = new URLSearchParams();
    if (params?.search) p.set('search', params.search);
    if (params?.enrollment_type) p.set('enrollment_type', params.enrollment_type);
    if (params?.limit != null) p.set('limit', String(params.limit));
    if (params?.offset != null) p.set('offset', String(params.offset));
    const qs = p.toString() ? `?${p}` : '';
    return request<{ certificates: any[]; total?: number; page?: { limit: number; offset: number } }>(`/student/certificates${qs}`);
  }

  export async function getCertificate(certificateId: string) {
    return request<{ certificate: any }>(`/student/certificates/${certificateId}`);
  }

  export async function downloadCertificate(certificateId: string) {
    return request<{ url: string; filename: string }>(
      `/student/certificates/${certificateId}/download`
    );
  }

  // Certificate name settings (per-enrollment)
  export async function getCertificateSettings(enrollmentId: string) {
    return request<{ settings: { base: any; override: any; effective: any } }>(
      `/student/certificates/${enrollmentId}/settings`
    );
  }

  export async function saveCertificateSettings(enrollmentId: string, settings: {
    x: number; y: number; fontSize: number; fontFamily: string; fontWeight: string; color: string; textAlign: 'left'|'center'|'right'
  }) {
    return request<{ success: boolean; settings: any }>(
      `/student/certificates/${enrollmentId}/settings`,
      {
        method: 'PUT',
        body: JSON.stringify(settings),
      }
    );
  }

  // Profile
  export async function getProfile() {
    return request<{ profile: any }>('/student/profile');
  }

  export async function updateProfile(data: {
    full_name?: string;
    email?: string;
    profile_picture_url?: string;
    preferences?: {
      email_notifications?: boolean;
      language?: string;
      timezone?: string;
      notif_course_updates?: boolean;
      notif_badges?: boolean;
      notif_weekly?: boolean;
      [key: string]: unknown;
    };
  }) {
    return request<{ success: boolean; profile: any }>(
      '/student/profile',
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
  }

  export async function changePassword(data: {
    current_password: string;
    new_password: string;
  }) {
    return request<{ success: boolean; message: string }>(
      '/student/profile/password',
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
  }

  // Dashboard & Analytics
  export async function getDashboardStats() {
    return request<{ stats: any }>('/student/dashboard/stats');
  }

  export async function getProgressAnalytics() {
    return request<{ analytics: any }>('/student/analytics/progress');
  }

  export async function getQuizHistory() {
    return request<{ quizzes: { quiz_title: string; course_title: string; score: number; attempts: number; submitted_at: string }[] }>(
      '/student/quiz-history'
    );
  }

  export async function getRecommendedCourses() {
    return request<{ courses: any[] }>('/student/recommendations');
  }

  export async function getRecentActivity() {
    return request<{ activities: { type: string; title: string; subtitle: string; time: string }[] }>(
      '/student/recent-activity'
    );
  }

  export async function getPaymentHistory() {
    return request<{ payments: any[] }>('/student/payment-history');
  }

  // Notifications
  export async function getNotifications() {
    return request<{ notifications: any[] }>('/student/notifications');
  }

  export async function markNotificationAsRead(notificationId: string) {
    return request<{ success: boolean }>(
      `/student/notifications/${notificationId}/read`,
      {
        method: 'POST',
      }
    );
  }

  export async function markAllNotificationsAsRead() {
    return request<{ success: boolean }>(
      '/student/notifications/read-all',
      {
        method: 'POST',
      }
    );
  }
}

// Cross-role channel notifications (red dots)
export namespace Notifications {
  export async function getChannels() {
    return request<{ channels: Record<string, number> }>(`/notifications/channels`);
  }
  export async function markSeen(channels: string[]) {
    return request<{ success: boolean }>(`/notifications/channels/seen`, {
      method: 'PUT',
      body: JSON.stringify({ channels }),
    });
  }
  export function openStream(onData: (payload: { channels: Record<string, number> }) => void) {
    const es = new EventSource(`/api/notifications/subscribe`);
    es.onmessage = (ev) => {
      try { onData(JSON.parse(ev.data)); } catch {}
    };
    return es;
  }
}

// Universal certificate fetch (any role)
export async function getCertificateUniversal(certificateId: string) {
  return request<{ certificate: any }>(`/certificates/${certificateId}`);
}

// ============================================================
// ADMIN ENDPOINTS
// ============================================================

export namespace Admin {
  // User Management
  export async function getUsers() {
    return request<{ users: any[] }>('/admin/users');
  }

  export async function getUser(userId: string) {
    return request<{ user: any; enrollments: any[]; certificates: any[] }>(
      `/admin/users/${userId}`
    );
  }

  export async function createUser(data: {
    email: string;
    full_name: string;
    role: 'student' | 'instructor' | 'admin';
    password?: string;
    student_id?: string;
    program?: string;
    year_level?: number;
  }) {
    return request<{ success: boolean; user: any }>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  export async function updateUser(userId: string, data: any) {
    return request<{ success: boolean; user: any }>(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  export async function suspendUser(userId: string, suspended: boolean) {
    return request<{ success: boolean; message: string }>(
      `/admin/users/${userId}/suspend`,
      {
        method: 'POST',
        body: JSON.stringify({ suspended }),
      }
    );
  }

  export async function deleteUser(userId: string) {
    return request<{ success: boolean; message: string }>(`/admin/users/${userId}`, { method: 'DELETE' });
  }

  // Course Approval
  export async function getPendingCourses() {
    return request<{ courses: any[] }>('/admin/courses/pending');
  }

  export async function approveCourse(courseId: string) {
    return request<{ success: boolean; course: Course; message: string }>(
      `/admin/courses/${courseId}/approve`,
      {
        method: 'POST',
      }
    );
  }

  export async function rejectCourse(courseId: string, rejection_reason: string) {
    return request<{ success: boolean; course: Course; message: string }>(
      `/admin/courses/${courseId}/reject`,
      {
        method: 'POST',
        body: JSON.stringify({ rejection_reason }),
      }
    );
  }

  export async function archiveCourse(courseId: string) {
    return request<{ success: boolean; course: Course; message: string }>(
      `/admin/courses/${courseId}/archive`,
      {
        method: 'POST',
      }
    );
  }

  // Payment Verification
  export async function getPendingPayments() {
    return request<{ enrollments: any[] }>('/admin/payments/pending');
  }

  export async function verifyPayment(enrollmentId: string, approved: boolean) {
    return request<{ success: boolean; enrollment: Enrollment; message: string }>(
      `/admin/payments/${enrollmentId}/verify`,
      {
        method: 'POST',
        body: JSON.stringify({ approved }),
      }
    );
  }

  // Analytics
  export async function getDashboardStats() {
    return request<{ stats: any }>('/admin/dashboard/stats');
  }

  export async function getAllCourses(params?: { limit?: number; offset?: number }) {
    const p = new URLSearchParams();
    if (params?.limit != null) p.set('limit', String(params.limit));
    if (params?.offset != null) p.set('offset', String(params.offset));
    const qs = p.toString() ? `?${p}` : '';
    return request<{ courses: any[]; total?: number; page?: { limit: number; offset: number } }>(`/admin/courses${qs}`);
  }

  export async function getAllEnrollments(params?: { course_id?: string; limit?: number; offset?: number }) {
    const p = new URLSearchParams();
    if (params?.course_id) p.set('course_id', params.course_id);
    if (params?.limit != null) p.set('limit', String(params.limit));
    if (params?.offset != null) p.set('offset', String(params.offset));
    const qs = p.toString() ? `?${p}` : '';
    return request<{ enrollments: any[]; total?: number; page?: { limit: number; offset: number } }>(`/admin/enrollments${qs}`);
  }

  export async function getCourseEnrollments(courseId: string, params?: { limit?: number; offset?: number }) {
    const p = new URLSearchParams();
    p.set('course_id', courseId);
    if (params?.limit != null) p.set('limit', String(params.limit));
    if (params?.offset != null) p.set('offset', String(params.offset));
    const qs = p.toString() ? `?${p}` : '';
    return request<{ enrollments: any[]; total?: number; page?: { limit: number; offset: number } }>(`/admin/enrollments${qs}`);
  }

  export async function getAllCertificates(params?: { search?: string; course_id?: string; limit?: number; offset?: number }) {
    const p = new URLSearchParams();
    if (params?.search) p.set('search', params.search);
    if (params?.course_id) p.set('course_id', params.course_id);
    if (params?.limit != null) p.set('limit', String(params.limit));
    if (params?.offset != null) p.set('offset', String(params.offset));
    const qs = p.toString() ? `?${p}` : '';
    return request<{ certificates: any[]; total?: number; page?: { limit: number; offset: number } }>(`/admin/certificates${qs}`);
  }

  // Analytics
  export async function getAnalytics(year: number, quarter: number) {
    return request<any>(`/admin/analytics?year=${year}&quarter=${quarter}`);
  }

  // Audit Logs
  export async function getAuditLogs(params?: {
    limit?: number;
    offset?: number;
    search?: string;
    action?: string;
  }) {
    const p = new URLSearchParams({ limit: String(params?.limit ?? 100), offset: String(params?.offset ?? 0) });
    if (params?.search) p.set('search', params.search);
    if (params?.action) p.set('action', params.action);
    return request<{ logs: any[]; total: number; actions: string[] }>(`/admin/audit-logs?${p}`);
  }

  // Platform Settings
  export async function getSettings() {
    return request<{ settings: Record<string, string> }>('/admin/settings');
  }

  export async function saveSettings(data: Record<string, string>) {
    return request<{ success: boolean }>('/admin/settings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Maintenance
  export async function expireEnrollments() {
    return request<{ success: boolean; expired_count: number; message: string }>(
      '/admin/maintenance/expire-enrollments',
      {
        method: 'POST',
      }
    );
  }
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Public
  getCourses,
  getCourse,
  verifyCertificate,

  // Student
  enrollInCourse,
  getMyEnrollments,
  completeLesson,
  getAssessment,
  submitAssessment,
  generateCertificate,
  getMyCertificates,
  recommendCourse,
  unrecommendCourse,
  getCourseRecommendations,

  // Student namespace
  Student,

  // Instructor namespace
  Instructor,

  // Admin namespace
  Admin,
};

// ============================================================
// COURSE RECOMMENDATIONS API
// ============================================================

/**
 * Recommend a course (like button)
 */
export async function recommendCourse(courseId: string): Promise<{ success: boolean; message: string }> {
  return request('/recommendations', {
    method: 'POST',
    body: JSON.stringify({ course_id: courseId }),
  });
}

/**
 * Remove recommendation from a course
 */
export async function unrecommendCourse(courseId: string): Promise<{ success: boolean; message: string }> {
  return request(`/recommendations/${courseId}`, {
    method: 'DELETE',
  });
}

/**
 * Get recommendation statistics for a course
 */
export async function getCourseRecommendations(courseId: string): Promise<{
  count: number;
  hasRecommended: boolean;
}> {
  return request(`/courses/${courseId}/recommendations`);
}
