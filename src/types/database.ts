// CCELL-LNU Database Types
// Auto-generated from Supabase schema
// Phase 1: Type Definitions
// Date: May 9, 2026

// ============================================================
// ENUMS
// ============================================================

export type UserRole = 'student' | 'instructor' | 'admin';

export type CourseStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'archived';

export type EnrollmentType = 'certificatory' | 'academe_student' | 'academe_paid';

export type EnrollmentStatus = 'pending_payment' | 'active' | 'expired' | 'completed' | 'suspended';

export type PaymentStatus = 'pending' | 'verified' | 'rejected';

export type AssessmentType = 'pre_test' | 'post_test' | 'final_assessment';

export type QuestionType = 'multiple_choice' | 'identification' | 'essay';

export type AttemptStatus = 'in_progress' | 'submitted' | 'graded';

export type GradingStatus = 'pending' | 'graded';

export type AuditAction =
  | 'login'
  | 'logout'
  | 'user_create'
  | 'user_update'
  | 'user_delete'
  | 'course_create'
  | 'course_update'
  | 'course_approve'
  | 'course_reject'
  | 'enrollment_create'
  | 'payment_verify'
  | 'certificate_issue'
  | 'grade_update';

// ============================================================
// BADGE SYSTEM
// ============================================================

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned_at: string;
}

// ============================================================
// CORE TABLES
// ============================================================

export interface Profile {
  id: string; // UUID
  email: string;
  full_name: string;
  role: UserRole;

  // Student-specific
  student_id?: string | null;
  program?: string | null;
  year_level?: number | null;

  // Stats
  total_cpd_units: number;
  total_certificates: number;
  total_courses_completed: number;

  // Badges
  badges: Badge[];

  // Timestamps
  created_at: string;
  updated_at: string;
  last_login_at?: string | null;
}

export interface AuditLog {
  id: string;
  user_id?: string | null;
  action: AuditAction;
  entity_type?: string | null;
  entity_id?: string | null;
  details: Record<string, any>;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}

export interface UserActivity {
  id: string;
  user_id: string;
  course_id?: string | null;
  lesson_id?: string | null;
  time_spent_seconds: number;
  last_active_at: string;
  session_date: string;
}

// ============================================================
// COURSE SYSTEM
// ============================================================

export interface CourseType {
  id: string;
  code: 'certificatory' | 'academe';
  name: string;
  description?: string | null;
  is_paid_by_default: boolean;
  allows_class_codes: boolean;
  has_time_limit: boolean;
  created_at: string;
}

export interface CourseCategory {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  display_order: number;
  created_at: string;
}

export interface Course {
  id: string;

  // Basic info
  title: string;
  description?: string | null;
  course_code?: string | null;

  // Type and category
  course_type_id: string;
  category_id?: string | null;

  // Instructor
  instructor_id: string;

  // Pricing
  price: number;
  currency: string;

  // Duration
  duration_weeks: number;
  duration_hours?: number | null;

  // Content metadata
  focus_of_lesson?: string | null;
  learning_objectives: string[]; // JSONB array
  prior_knowledge?: string | null;

  // Certificate template
  certificate_template_url?: string | null;
  certificate_name_x?: number | null;
  certificate_name_y?: number | null;
  certificate_name_font_size: number;
  certificate_name_font_family: string;
  certificate_name_settings?: Record<string, any> | null;

  // CPD units
  cpd_units: number;

  // Approval workflow
  status: CourseStatus;
  approved_by?: string | null;
  approved_at?: string | null;
  rejection_reason?: string | null;

  // Visibility
  is_published: boolean;
  published_at?: string | null;

  // Social proof
  total_enrollments: number;
  total_recommendations: number;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface CourseRecommendation {
  id: string;
  user_id: string;
  course_id: string;
  created_at: string;
}

// ============================================================
// CLASS CODES
// ============================================================

export interface ClassCode {
  id: string;
  course_id: string;

  // Code
  code: string;

  // Section information
  section: string;
  program?: string | null;
  year_level?: number | null;
  semester?: string | null;
  school_year?: string | null;

  // Limits
  max_uses?: number | null;
  current_uses: number;
  expires_at?: string | null;

  // Creator
  created_by: string;

  // Status
  is_active: boolean;

  // Timestamps
  created_at: string;
  updated_at: string;
}

// ============================================================
// ENROLLMENTS
// ============================================================

export interface Enrollment {
  id: string;

  // References
  user_id: string;
  course_id: string;

  // Enrollment type
  enrollment_type: EnrollmentType;

  // Class code (for academe students)
  class_code_id?: string | null;
  section?: string | null;

  // Payment
  payment_method?: string | null;
  payment_reference?: string | null;
  payment_amount?: number | null;
  payment_proof_url?: string | null;
  payment_status: PaymentStatus;
  payment_verified_by?: string | null;
  payment_verified_at?: string | null;

  // Time limits (for certificatory)
  enrolled_at: string;
  enrolled_month?: string | null;
  expires_at?: string | null;
  is_expired: boolean;

  // Progress
  progress_percentage: number;
  completed_lessons: string[]; // JSONB array of lesson IDs

  // Completion
  is_completed: boolean;
  completed_at?: string | null;

  // Certificate
  certificate_issued: boolean;
  certificate_id?: string | null;

  // Status
  status: EnrollmentStatus;

  // Timestamps
  created_at: string;
  updated_at: string;
}

// ============================================================
// COURSE CONTENT
// ============================================================

export interface Lesson {
  id: string;
  course_id: string;

  // Order and basic info
  lesson_order: number;
  title: string;
  description?: string | null;

  // Visuals
  images: string[]; // JSONB array of URLs

  // Content
  key_points: string[]; // JSONB array
  video_url?: string | null;
  powerpoint_url?: string | null;

  // Assessments
  pre_test_id?: string | null;
  post_test_id?: string | null;

  // Duration
  estimated_duration_minutes?: number | null;

  // Visibility
  is_published: boolean;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[]; // for multiple choice
  correct_answer?: string; // for auto-grading
  points: number;
  order: number;
}

export interface Assessment {
  id: string;

  // Type
  assessment_type: AssessmentType;

  // Associated with
  course_id: string;
  lesson_id?: string | null;

  // Basic info
  title: string;
  description?: string | null;

  // Questions
  questions: Question[];

  // Grading
  total_points: number;
  passing_score_percentage: number;

  // Retake rules
  max_retakes: number;
  show_correct_on_wrong: boolean;

  // Timing
  time_limit_minutes?: number | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface AssessmentAttempt {
  id: string;

  // References
  user_id: string;
  assessment_id: string;
  enrollment_id: string;

  // Attempt info
  attempt_number: number;

  // Answers
  answers: Record<string, string>; // question_id -> answer

  // Scoring
  auto_graded_score?: number | null;
  essay_score: number;
  total_score?: number | null;
  percentage?: number | null;
  is_passing?: boolean | null;

  // Timing
  started_at: string;
  submitted_at?: string | null;
  time_taken_seconds?: number | null;

  // Status
  status: AttemptStatus;

  // Timestamps
  created_at: string;
}

export interface EssaySubmission {
  id: string;

  // References
  attempt_id: string;
  question_id: string;
  user_id: string;

  // Answer
  answer: string;

  // Grading
  instructor_score?: number | null;
  instructor_feedback?: string | null;
  graded_by?: string | null;
  graded_at?: string | null;

  // Status
  grading_status: GradingStatus;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface LessonProgress {
  id: string;

  // References
  user_id: string;
  enrollment_id: string;
  lesson_id: string;

  // Progress
  is_completed: boolean;
  completed_at?: string | null;

  // Test tracking
  pre_test_passed: boolean;
  post_test_passed: boolean;

  // Timestamps
  created_at: string;
  updated_at: string;
}

// ============================================================
// CERTIFICATES
// ============================================================

export interface Certificate {
  id: string;

  // References
  user_id: string;
  course_id: string;
  enrollment_id: string;

  // Verification
  verification_code: string;

  // Certificate data
  recipient_name: string;
  course_title: string;
  instructor_name: string;
  cpd_units: number;

  // Issuance
  issued_by?: string | null;
  issued_at: string;

  // PDF
  pdf_url?: string | null;

  // Status
  is_active: boolean;

  // Timestamps
  created_at: string;
}

// ============================================================
// VIEW TYPES (for reporting)
// ============================================================

export interface CourseStats {
  id: string;
  title: string;
  course_code: string | null;
  instructor_name: string;
  course_type: string;
  category: string | null;
  price: number;
  duration_weeks: number;
  cpd_units: number;
  total_enrollments: number;
  total_recommendations: number;
  status: CourseStatus;
  is_published: boolean;
  active_enrollments: number;
  completed_enrollments: number;
  certificates_issued: number;
  created_at: string;
  published_at: string | null;
}

export interface StudentEnrollment {
  enrollment_id: string;
  user_id: string;
  student_name: string;
  student_email: string;
  course_id: string;
  course_title: string;
  course_code: string | null;
  enrollment_type: EnrollmentType;
  section: string | null;
  class_code: string | null;
  class_section: string | null;
  payment_status: PaymentStatus;
  payment_amount: number | null;
  progress_percentage: number;
  is_completed: boolean;
  is_expired: boolean;
  enrolled_at: string;
  expires_at: string | null;
  completed_at: string | null;
  status: EnrollmentStatus;
  status_label: string;
  days_remaining: number | null;
}

export interface InstructorCourse {
  course_id: string;
  instructor_id: string;
  title: string;
  course_code: string | null;
  description: string | null;
  course_type: string;
  category: string | null;
  price: number;
  duration_weeks: number;
  cpd_units: number;
  status: CourseStatus;
  is_published: boolean;
  total_lessons: number;
  active_students: number;
  certificatory_students: number;
  academe_students: number;
  paid_outsiders: number;
  certificates_issued: number;
  pending_essays: number;
  created_at: string;
  updated_at: string;
}

export interface AdminDashboardStats {
  total_students: number;
  total_instructors: number;
  total_published_courses: number;
  pending_approvals: number;
  active_enrollments: number;
  pending_payments: number;
  total_certificates_issued: number;
  pending_essay_grading: number;
  total_revenue: number;
  enrollments_last_30_days: number;
  certificates_last_30_days: number;
}

export interface CourseCompletionRequirement {
  enrollment_id: string;
  user_id: string;
  course_id: string;
  course_title: string;
  total_lessons: number;
  completed_lessons: number;
  remaining_lessons: number;
  total_assessments: number;
  passed_assessments: number;
  eligible_for_certificate: boolean;
}

// ============================================================
// REQUEST/RESPONSE TYPES
// ============================================================

export interface EnrollmentRequest {
  course_id: string;
  enrollment_type: EnrollmentType;
  class_code?: string;
  payment_method?: string;
  payment_reference?: string;
  payment_amount?: number;
  payment_proof_url?: string;
}

export interface AssessmentSubmission {
  assessment_id: string;
  enrollment_id: string;
  answers: Record<string, string>;
}

export interface GradeEssayRequest {
  essay_submission_id: string;
  score: number;
  feedback?: string;
}

export interface CourseApprovalRequest {
  course_id: string;
  approved: boolean;
  rejection_reason?: string;
}

// ============================================================
// HELPER TYPES
// ============================================================

export type DatabaseTables =
  | 'profiles'
  | 'audit_logs'
  | 'user_activity'
  | 'course_types'
  | 'course_categories'
  | 'courses'
  | 'course_recommendations'
  | 'class_codes'
  | 'enrollments'
  | 'lessons'
  | 'assessments'
  | 'assessment_attempts'
  | 'essay_submissions'
  | 'lesson_progress'
  | 'certificates';

export type InsertProfile = Omit<Profile, 'id' | 'created_at' | 'updated_at' | 'last_login_at'>;
export type UpdateProfile = Partial<InsertProfile>;

export type InsertCourse = Omit<Course, 'id' | 'created_at' | 'updated_at' | 'total_enrollments' | 'total_recommendations'>;
export type UpdateCourse = Partial<InsertCourse>;

export type InsertEnrollment = Omit<Enrollment, 'id' | 'created_at' | 'updated_at' | 'enrolled_at'>;
export type UpdateEnrollment = Partial<InsertEnrollment>;

export type InsertLesson = Omit<Lesson, 'id' | 'created_at' | 'updated_at'>;
export type UpdateLesson = Partial<InsertLesson>;

export type InsertAssessment = Omit<Assessment, 'id' | 'created_at' | 'updated_at'>;
export type UpdateAssessment = Partial<InsertAssessment>;
