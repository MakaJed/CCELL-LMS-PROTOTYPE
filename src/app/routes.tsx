// @refresh reset
import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router";
import { AuthProvider } from "../lib/AuthContext";
import { EnrollmentProvider } from "../lib/EnrollmentContext";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" role="status" aria-live="polite" aria-label="Loading page">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[#1A237E] border-t-[#FFB300] rounded-full animate-spin mx-auto mb-4" aria-hidden="true"></div>
        <p className="text-[#1A237E] font-medium">Loading...</p>
      </div>
    </div>
  );
}

// Lazy load page components for better performance and code splitting
const Landing = lazy(() => import("./pages/Landing").then(m => ({ default: m.Landing })));
const Login = lazy(() => import("./pages/Login").then(m => ({ default: m.Login })));
const StudentDashboard = lazy(() => import("./pages/student/Dashboard").then(m => ({ default: m.StudentDashboard })));
const MyEnrollments = lazy(() => import("./pages/student/MyEnrollments").then(m => ({ default: m.MyEnrollments })));
const StudentMessages = lazy(() => import("./pages/student/Messages").then(m => ({ default: m.StudentMessages })));
const ReenrollPayment = lazy(() => import("./pages/student/ReenrollPayment").then(m => ({ default: m.ReenrollPayment })));
const StudentCertificates = lazy(() => import("./pages/student/Certificates").then(m => ({ default: m.StudentCertificates })));
const StudentCertificateAdjuster = lazy(() => import("./pages/student/CertificateAdjuster").then(m => ({ default: m.CertificateAdjuster })));
const StudentProfile = lazy(() => import("./pages/student/Profile").then(m => ({ default: m.StudentProfile })));
const StudentProgress = lazy(() => import("./pages/student/Progress").then(m => ({ default: m.StudentProgress })));
const PaymentHistory = lazy(() => import("./pages/student/PaymentHistory").then(m => ({ default: m.PaymentHistory })));
const InstructorDashboard = lazy(() => import("./pages/instructor/Dashboard").then(m => ({ default: m.InstructorDashboard })));
const InstructorCoursesManager = lazy(() => import("./pages/instructor/CoursesManager").then(m => ({ default: m.CoursesManager })));
const CreateCourse = lazy(() => import("./pages/instructor/CreateCourse").then(m => ({ default: m.CreateCourse })));
const ManageLessons = lazy(() => import("./pages/instructor/ManageLessons").then(m => ({ default: m.ManageLessons })));
const LessonEditor = lazy(() => import("./pages/instructor/LessonEditor").then(m => ({ default: m.LessonEditor })));
const CreateAssessment = lazy(() => import("./pages/instructor/CreateAssessment").then(m => ({ default: m.CreateAssessment })));
const ManageClassCodes = lazy(() => import("./pages/instructor/ManageClassCodes").then(m => ({ default: m.ManageClassCodes })));
const GradeEssays = lazy(() => import("./pages/instructor/GradeEssays").then(m => ({ default: m.GradeEssays })));
const StudentSubmissions = lazy(() => import("./pages/instructor/StudentSubmissions").then(m => ({ default: m.StudentSubmissions })));
const SubmissionReview = lazy(() => import("./pages/instructor/SubmissionReview").then(m => ({ default: m.SubmissionReview })));
const CertificateIssuance = lazy(() => import("./pages/instructor/CertificateIssuance").then(m => ({ default: m.CertificateIssuance })));
const CertificateTemplateEditor = lazy(() => import("./pages/instructor/CertificateTemplateEditor").then(m => ({ default: m.CertificateTemplateEditor })));
const InstructorStudents = lazy(() => import("./pages/instructor/Students").then(m => ({ default: m.InstructorStudents })));
const InstructorGrading = lazy(() => import("./pages/instructor/Grading").then(m => ({ default: m.InstructorGrading })));
const InstructorCertificateTemplates = lazy(() => import("./pages/instructor/CertificateTemplates").then(m => ({ default: m.InstructorCertificateTemplates })));
const InstructorCourseRequests = lazy(() => import("./pages/instructor/CourseRequests").then(m => ({ default: m.InstructorCourseRequests })));
const InstructorGradeBook = lazy(() => import("./pages/instructor/GradeBook").then(m => ({ default: m.InstructorGradeBook })));
const InstructorInbox = lazy(() => import("./pages/instructor/Inbox").then(m => ({ default: m.InstructorInbox })));
const InstructorAuditLog = lazy(() => import("./pages/instructor/AuditLog").then(m => ({ default: m.InstructorAuditLog })));
const InstructorCertificateEditor = lazy(() => import("./pages/instructor/CertificateEditor").then(m => ({ default: m.InstructorCertificateEditor })));
const InstructorCourseDuration = lazy(() => import("./pages/instructor/CourseDuration").then(m => ({ default: m.InstructorCourseDuration })));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard").then(m => ({ default: m.AdminDashboard })));
const AdminAuditLog = lazy(() => import("./pages/admin/AuditLog").then(m => ({ default: m.AdminAuditLog })));
const CourseApproval = lazy(() => import("./pages/admin/CourseApproval").then(m => ({ default: m.CourseApproval })));
const PaymentVerification = lazy(() => import("./pages/admin/PaymentVerification").then(m => ({ default: m.PaymentVerification })));
const UserManagement = lazy(() => import("./pages/admin/UserManagement").then(m => ({ default: m.UserManagement })));
const SystemSettings = lazy(() => import("./pages/admin/SystemSettings").then(m => ({ default: m.SystemSettings })));
const CertificateManagement = lazy(() => import("./pages/admin/CertificateManagement").then(m => ({ default: m.CertificateManagement })));
const CourseManagement = lazy(() => import("./pages/admin/CourseManagement").then(m => ({ default: m.CourseManagement })));
const Analytics = lazy(() => import("./pages/admin/Analytics").then(m => ({ default: m.Analytics })));
const CourseCatalog = lazy(() => import("./pages/CourseCatalog").then(m => ({ default: m.CourseCatalog })));
const CourseDetail = lazy(() => import("./pages/CourseDetail").then(m => ({ default: m.CourseDetail })));
const LessonViewer = lazy(() => import("./pages/LessonViewer").then(m => ({ default: m.LessonViewer })));
const CertificateView = lazy(() => import("./pages/student/CertificateView").then(m => ({ default: m.CertificateView })));
const ProfilePage = lazy(() => import("./pages/ProfilePage").then(m => ({ default: m.ProfilePage })));
const NotFound = lazy(() => import("./pages/NotFound").then(m => ({ default: m.NotFound })));
const Signup = lazy(() => import("./pages/Signup").then(m => ({ default: m.Signup })));

function RootLayout() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <EnrollmentProvider>
          <Layout />
        </EnrollmentProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

// Route protection wrappers with Suspense for lazy loading
function ProtectedStudentDashboard() {
  return <Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute></Suspense>;
}
function ProtectedMyEnrollments() {
  return <Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['student']}><MyEnrollments /></ProtectedRoute></Suspense>;
}
function ProtectedStudentMessages() {
  return <Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['student']}><StudentMessages /></ProtectedRoute></Suspense>;
}
function ProtectedReenrollPayment() {
  return <Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['student']}><ReenrollPayment /></ProtectedRoute></Suspense>;
}
function ProtectedStudentCertificates() {
  return <Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['student']}><StudentCertificates /></ProtectedRoute></Suspense>;
}
function ProtectedStudentProfile() {
  return <Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['student']}><StudentProfile /></ProtectedRoute></Suspense>;
}
function ProtectedStudentProgress() {
  return <Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['student']}><StudentProgress /></ProtectedRoute></Suspense>;
}
function ProtectedStudentCertificateAdjuster() {
  return <Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['student']}><StudentCertificateAdjuster /></ProtectedRoute></Suspense>;
}
function ProtectedPaymentHistory() {
  return <Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['student']}><PaymentHistory /></ProtectedRoute></Suspense>;
}
function ProtectedInstructorDashboard() {
  return <Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['instructor']}><InstructorDashboard /></ProtectedRoute></Suspense>;
}
function ProtectedInstructorCoursesManager() {
  return <Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['instructor']}><InstructorCoursesManager /></ProtectedRoute></Suspense>;
}
function ProtectedCreateCourse() {
  return <Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['instructor']}><CreateCourse /></ProtectedRoute></Suspense>;
}
function ProtectedManageLessons() {
  return <Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['instructor']}><ManageLessons /></ProtectedRoute></Suspense>;
}
function ProtectedLessonEditor() {
  return <Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['instructor']}><LessonEditor /></ProtectedRoute></Suspense>;
}
function ProtectedCreateAssessment() {
  return <Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['instructor']}><CreateAssessment /></ProtectedRoute></Suspense>;
}
function ProtectedManageClassCodes() {
  return <Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['instructor']}><ManageClassCodes /></ProtectedRoute></Suspense>;
}
function ProtectedGradeEssays() {
  return <Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['instructor']}><GradeEssays /></ProtectedRoute></Suspense>;
}
function ProtectedStudentSubmissions() {
  return <Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['instructor']}><StudentSubmissions /></ProtectedRoute></Suspense>;
}
function ProtectedSubmissionReview() {
  return <Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['instructor']}><SubmissionReview /></ProtectedRoute></Suspense>;
}
function ProtectedCertificateIssuance() {
  return <Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['instructor']}><CertificateIssuance /></ProtectedRoute></Suspense>;
}
function ProtectedCertificateTemplateEditor() {
  return <Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['instructor']}><CertificateTemplateEditor /></ProtectedRoute></Suspense>;
}
function ProtectedInstructorStudents() {
  return <Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['instructor']}><InstructorStudents /></ProtectedRoute></Suspense>;
}
function ProtectedInstructorGrading() {
  return <Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['instructor']}><InstructorGrading /></ProtectedRoute></Suspense>;
}
function ProtectedInstructorCertificateTemplates() {
  return <Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['instructor']}><InstructorCertificateTemplates /></ProtectedRoute></Suspense>;
}
function ProtectedInstructorCourseRequests() {
  return <Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['instructor']}><InstructorCourseRequests /></ProtectedRoute></Suspense>;
}
function ProtectedInstructorGradeBook() {
  return <Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['instructor']}><InstructorGradeBook /></ProtectedRoute></Suspense>;
}
function ProtectedInstructorInbox() {
  return <Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['instructor']}><InstructorInbox /></ProtectedRoute></Suspense>;
}
function ProtectedInstructorAuditLog() {
  return <Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['instructor']}><InstructorAuditLog /></ProtectedRoute></Suspense>;
}
function ProtectedInstructorCertificateEditor() {
  return <Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['instructor']}><InstructorCertificateEditor /></ProtectedRoute></Suspense>;
}
function ProtectedInstructorCourseDuration() {
  return <Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['instructor']}><InstructorCourseDuration /></ProtectedRoute></Suspense>;
}
function ProtectedAdminDashboard() {
  return <Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute></Suspense>;
}
function ProtectedAdminAuditLog() {
  return <Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['admin']}><AdminAuditLog /></ProtectedRoute></Suspense>;
}
function ProtectedCourseApproval() {
  return <Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['admin']}><CourseApproval /></ProtectedRoute></Suspense>;
}
function ProtectedPaymentVerification() {
  return <Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['admin']}><PaymentVerification /></ProtectedRoute></Suspense>;
}
function ProtectedUserManagement() {
  return <Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['admin']}><UserManagement /></ProtectedRoute></Suspense>;
}
function ProtectedSystemSettings() {
  return <Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['admin']}><SystemSettings /></ProtectedRoute></Suspense>;
}
function ProtectedCertificateManagement() {
  return <Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['admin']}><CertificateManagement /></ProtectedRoute></Suspense>;
}
function ProtectedCourseManagement() {
  return <Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['admin']}><CourseManagement /></ProtectedRoute></Suspense>;
}
function ProtectedAnalytics() {
  return <Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['admin']}><Analytics /></ProtectedRoute></Suspense>;
}
function ProtectedLessonViewer() {
  return <Suspense fallback={<PageLoader />}><ProtectedRoute><LessonViewer /></ProtectedRoute></Suspense>;
}
// Removed shared CertificatesPage in favor of student-specific Certificates
function ProtectedCertificateView() {
  return <Suspense fallback={<PageLoader />}><ProtectedRoute><CertificateView /></ProtectedRoute></Suspense>;
}
function ProtectedProfile() {
  return <Suspense fallback={<PageLoader />}><ProtectedRoute><ProfilePage /></ProtectedRoute></Suspense>;
}

// Wrapper components for public routes with Suspense
function SuspenseLanding() {
  return <Suspense fallback={<PageLoader />}><Landing /></Suspense>;
}
function SuspenseLogin() {
  return <Suspense fallback={<PageLoader />}><Login /></Suspense>;
}
function SuspenseSignup() {
  return <Suspense fallback={<PageLoader />}><Signup /></Suspense>;
}
function SuspenseCourseCatalog() {
  return <Suspense fallback={<PageLoader />}><CourseCatalog /></Suspense>;
}
function SuspenseCourseDetail() {
  return <Suspense fallback={<PageLoader />}><CourseDetail /></Suspense>;
}
function SuspenseNotFound() {
  return <Suspense fallback={<PageLoader />}><NotFound /></Suspense>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: SuspenseLanding },
      { path: "login", Component: SuspenseLogin },
      { path: "signup", Component: SuspenseSignup },
      { path: "catalog", Component: SuspenseCourseCatalog },
      { path: "course/:courseId", Component: SuspenseCourseDetail },
      { path: "course/:courseId/lesson/:lessonId", Component: ProtectedLessonViewer },
      // Student
      { path: "student/dashboard", Component: ProtectedStudentDashboard },
      { path: "student/my-courses", Component: ProtectedMyEnrollments },
      { path: "student/messages", Component: ProtectedStudentMessages },
      { path: "student/certificates", Component: ProtectedStudentCertificates },
      { path: "student/courses/:courseId/certificate-adjuster", Component: ProtectedStudentCertificateAdjuster },
      { path: "student/profile", Component: ProtectedStudentProfile },
      { path: "student/progress", Component: ProtectedStudentProgress },
      { path: "student/payment-history", Component: ProtectedPaymentHistory },
      { path: "enroll/:courseId/payment", Component: ProtectedReenrollPayment },
      // Instructor
      { path: "instructor/dashboard", Component: ProtectedInstructorDashboard },
      { path: "instructor/courses", Component: ProtectedInstructorCoursesManager },
      { path: "instructor/create-course", Component: ProtectedCreateCourse },
      { path: "instructor/courses/:courseId/lessons", Component: ProtectedManageLessons },
      { path: "instructor/courses/:courseId/lesson-editor/:lessonId", Component: ProtectedLessonEditor },
      { path: "instructor/courses/:courseId/lesson-editor", Component: ProtectedLessonEditor },
      { path: "instructor/courses/:courseId/create-assessment", Component: ProtectedCreateAssessment },
      { path: "instructor/class-codes", Component: ProtectedManageClassCodes },
      { path: "instructor/grade-essays", Component: ProtectedGradeEssays },
      { path: "instructor/submissions", Component: ProtectedStudentSubmissions },
      { path: "instructor/submission-review", Component: ProtectedSubmissionReview },
      { path: "instructor/students", Component: ProtectedInstructorStudents },
      { path: "instructor/grading", Component: ProtectedInstructorGrading },
      { path: "instructor/certificate-templates", Component: ProtectedInstructorCertificateTemplates },
      { path: "instructor/course-requests", Component: ProtectedInstructorCourseRequests },
      { path: "instructor/grade-book", Component: ProtectedInstructorGradeBook },
      { path: "instructor/inbox", Component: ProtectedInstructorInbox },
      { path: "instructor/audit-log", Component: ProtectedInstructorAuditLog },
      { path: "instructor/courses/:courseId/certificate-editor", Component: ProtectedInstructorCertificateEditor },
      { path: "instructor/courses/:courseId/duration", Component: ProtectedInstructorCourseDuration },
      { path: "instructor/certificates", Component: ProtectedCertificateIssuance },
      { path: "instructor/courses/:courseId/certificate-template", Component: ProtectedCertificateTemplateEditor },
      // Admin
      { path: "admin/dashboard", Component: ProtectedAdminDashboard },
      { path: "admin/audit-log", Component: ProtectedAdminAuditLog },
      { path: "admin/course-approval", Component: ProtectedCourseApproval },
      { path: "admin/payments", Component: ProtectedPaymentVerification },
      { path: "admin/users", Component: ProtectedUserManagement },
      { path: "admin/settings", Component: ProtectedSystemSettings },
      { path: "admin/certificates", Component: ProtectedCertificateManagement },
      { path: "admin/courses", Component: ProtectedCourseManagement },
      { path: "admin/analytics", Component: ProtectedAnalytics },
      // Shared
      { path: "certificate/:certificateId", Component: ProtectedCertificateView },
      { path: "profile", Component: ProtectedProfile },
      { path: "*", Component: SuspenseNotFound },
    ],
  },
]);