const BASE_URL = '/api';

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add mock user ID from localStorage
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
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options?.headers,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    console.error(`API Error [${response.status}] ${path}:`, data);
    throw new Error(data.error || `Request failed: ${response.status}`);
  }
  return data;
}

// ============= AUTH =============

export async function initMockUser(userData: any) {
  return request('/mock-auth/init', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

// ============= ENROLLMENTS =============

export async function enrollInCourse(data: {
  courseId: string;
  courseTitle: string;
  paymentMethod: string;
  referenceNumber?: string;
  amount: number;
}) {
  return request<{ success: boolean; enrollment: any }>('/enrollments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getMyEnrollments() {
  return request<{ enrollments: any[] }>('/enrollments/my');
}

// ============= PROGRESS =============

export async function completeLesson(data: {
  courseId: string;
  lessonId: string;
  totalLessons: number;
}) {
  return request<{
    success: boolean;
    progress: number;
    completedLessons: string[];
    newBadges: string[];
    isNewCompletion: boolean;
    courseCompleted: boolean;
  }>('/progress/lesson', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function submitQuizResult(data: {
  courseId: string;
  quizId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
}) {
  return request<{
    success: boolean;
    quizResult: any;
    newBadges: string[];
  }>('/progress/quiz', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============= CERTIFICATES =============

export async function generateCertificate(data: {
  courseId: string;
  courseName: string;
}) {
  return request<{
    success: boolean;
    certificate: any;
    isNew: boolean;
  }>('/certificates/generate', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getMyCertificates() {
  return request<{ certificates: any[] }>('/certificates/my');
}

export async function verifyCertificate(code: string) {
  const raw = await request<any>(`/certificates/verify/${encodeURIComponent(code)}`);
  if (!raw.valid || !raw.certificate) return raw;
  const c = raw.certificate;
  return {
    valid: true,
    certificate: {
      courseName: c.course_name || c.courseName || '',
      studentName: c.student_name || c.studentName || '',
      issueDate: c.issue_date || c.issueDate || '',
      verificationCode: c.verification_code || c.verificationCode || '',
      cpdUnits: c.cpd_units ?? c.cpdUnits ?? 0,
      status: c.status || '',
    },
  };
}

// ============= PROFILE =============

export async function getMyProfile() {
  return request<{ profile: any }>('/student/profile');
}

// ============= ADMIN =============

export async function getAdminPayments() {
  return request<{ payments: any[] }>('/admin/payments/pending');
}

export async function verifyPayment(enrollmentId: string, status: 'approved' | 'rejected', reviewNotes?: string) {
  return request<{ success: boolean; enrollment: any }>(`/admin/payments/${encodeURIComponent(enrollmentId)}/verify`, {
    method: 'POST',
    body: JSON.stringify({ approved: status === 'approved' }),
  });
}
