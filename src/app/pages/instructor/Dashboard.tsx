import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  BookOpen,
  Users,
  Heart,
  AlertCircle,
  FileText,
  Award,
  Clock,
  CheckCircle,
  Upload,
  Eye,
  Edit,
  GraduationCap,
  TrendingUp,
  Calculator,
  MessageSquare,
  Shield
} from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import * as apiV2 from '../../lib/api-v2';
import { toast } from 'sonner';
import lnuLogo from "@/assets/LNULOGO.png";
import ccellLogo from "@/assets/CCELLLOGO.png";

export function InstructorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCourses: 0,
    activeCourses: 0,
    totalStudents: 0,
    academeStudents: 0,
    certificatoryStudents: 0,
    totalRecommendations: 0,
    pendingEssays: 0,
    pendingFinalizations: 0,
    reopenRequests: 0,
    coursesWithoutTemplates: 0
  });
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load instructor's courses
      const coursesResult = await apiV2.Instructor.getMyCourses();
      setCourses(coursesResult.courses || []);

      // Load dashboard statistics
      const dashboardStats = await apiV2.Instructor.getDashboardStats();

      setStats({
        totalCourses: coursesResult.courses?.length || 0,
        activeCourses: coursesResult.courses?.filter((c: any) => c.status === 'approved').length || 0,
        totalStudents: dashboardStats.stats?.totalStudents || 0,
        academeStudents: dashboardStats.stats?.academeStudents || 0,
        certificatoryStudents: dashboardStats.stats?.certificatoryStudents || 0,
        totalRecommendations: dashboardStats.stats?.totalRecommendations || 0,
        pendingEssays: dashboardStats.stats?.pendingEssays || 0,
        pendingFinalizations: dashboardStats.stats?.pendingFinalizations || 0,
        reopenRequests: dashboardStats.stats?.reopenRequests || 0,
        coursesWithoutTemplates: coursesResult.courses?.filter((c: any) => !c.certificate_template_url).length || 0
      });
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[var(--royal-blue)] border-r-transparent"></div>
          <p className="mt-4" style={{ color: 'var(--muted-foreground)' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8 text-white p-5 sm:p-7 shadow-xl relative overflow-hidden" style={{
        background: 'linear-gradient(to right, var(--royal-blue-darker), var(--royal-blue), var(--royal-blue-light))',
        borderRadius: 'var(--radius-xl)',
        borderBottom: '3px solid var(--gold)'
      }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] -mr-32 -mt-32" style={{ background: 'rgba(255, 179, 0, 0.05)' }} />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5">
              <img src={lnuLogo} alt="LNU" className="h-10 w-10" />
              <img src={ccellLogo} alt="CCELL" className="h-10 w-10" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <GraduationCap className="h-4 w-4" style={{ color: 'var(--gold)' }} />
                <Badge style={{ background: 'rgba(255, 179, 0, 0.15)', color: 'var(--gold)', borderColor: 'rgba(255, 179, 0, 0.3)' }} className="text-xs">
                  Instructor
                </Badge>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold mb-0.5">
                Welcome, {user?.name || 'Instructor'}!
              </h1>
              <p className="text-sm text-blue-200/70">Manage your courses and track student progress</p>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="border-0 shadow-lg" style={{ background: 'var(--card)' }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Total Courses</p>
                <p className="text-3xl font-bold" style={{ color: 'var(--royal-blue)' }}>
                  {stats.totalCourses}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                  {stats.activeCourses} active
                </p>
              </div>
              <div className="w-12 h-12 flex items-center justify-center" style={{ background: 'var(--accent-blue-50)', borderRadius: 'var(--radius-lg)' }}>
                <BookOpen className="h-6 w-6" style={{ color: 'var(--royal-blue)' }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg" style={{ background: 'var(--card)' }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Total Students</p>
                <p className="text-3xl font-bold" style={{ color: 'var(--royal-blue)' }}>
                  {stats.totalStudents}
                </p>
                <div className="flex gap-2 mt-1">
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {stats.academeStudents} Academe
                  </span>
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>•</span>
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {stats.certificatoryStudents} Paid
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 flex items-center justify-center" style={{ background: 'var(--accent-blue-50)', borderRadius: 'var(--radius-lg)' }}>
                <Users className="h-6 w-6" style={{ color: 'var(--royal-blue)' }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg" style={{ background: 'var(--card)' }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Recommendations</p>
                <p className="text-3xl font-bold text-red-500">
                  {stats.totalRecommendations}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                  Total likes received
                </p>
              </div>
              <div className="w-12 h-12 flex items-center justify-center bg-red-50" style={{ borderRadius: 'var(--radius-lg)' }}>
                <Heart className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg" style={{ background: 'var(--card)' }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Action Items</p>
                <p className="text-3xl font-bold" style={{ color: 'var(--gold)' }}>
                  {stats.pendingEssays + stats.pendingFinalizations + stats.reopenRequests}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                  Require attention
                </p>
              </div>
              <div className="w-12 h-12 flex items-center justify-center" style={{ background: 'var(--accent-gold-50)', borderRadius: 'var(--radius-lg)' }}>
                <AlertCircle className="h-6 w-6" style={{ color: 'var(--gold)' }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Action Items */}
      <Card className="border-0 shadow-lg mb-8" style={{ background: 'var(--card)' }}>
        <CardHeader style={{ background: 'linear-gradient(to right, var(--royal-blue-darker), var(--royal-blue))', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0' }}>
          <CardTitle className="text-white">Pending Action Items</CardTitle>
          <CardDescription className="text-white/70">
            Tasks that require your immediate attention
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Ungraded Essays */}
            <Link to="/instructor/grading">
              <div className="flex items-center justify-between p-4 border-2 hover:shadow-md transition-all cursor-pointer" style={{ borderColor: 'var(--border)', borderRadius: 'var(--radius-lg)' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--royal-blue)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 flex items-center justify-center" style={{ background: 'var(--accent-blue-50)', borderRadius: 'var(--radius-lg)' }}>
                    <FileText className="h-5 w-5" style={{ color: 'var(--royal-blue)' }} />
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: 'var(--foreground)' }}>
                      Ungraded Essays
                    </p>
                    <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                      Class Code students awaiting manual review
                    </p>
                  </div>
                </div>
                <Badge className="text-lg px-4 py-1" style={{ background: stats.pendingEssays > 0 ? 'var(--gold)' : 'var(--muted)', color: stats.pendingEssays > 0 ? 'var(--royal-blue)' : 'var(--muted-foreground)' }}>
                  {stats.pendingEssays}
                </Badge>
              </div>
            </Link>

            {/* Pending Finalizations */}
            <Link to="/instructor/students?tab=academe">
              <div className="flex items-center justify-between p-4 border-2 hover:shadow-md transition-all cursor-pointer" style={{ borderColor: 'var(--border)', borderRadius: 'var(--radius-lg)' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--royal-blue)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 flex items-center justify-center bg-green-50" style={{ borderRadius: 'var(--radius-lg)' }}>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: 'var(--foreground)' }}>
                      Pending Finalizations
                    </p>
                    <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                      Class Code students ready for grade finalization
                    </p>
                  </div>
                </div>
                <Badge className="text-lg px-4 py-1 bg-green-500 text-white">
                  {stats.pendingFinalizations}
                </Badge>
              </div>
            </Link>

            {/* Reopen Requests */}
            <Link to="/instructor/course-requests">
              <div className="flex items-center justify-between p-4 border-2 hover:shadow-md transition-all cursor-pointer" style={{ borderColor: 'var(--border)', borderRadius: 'var(--radius-lg)' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--royal-blue)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 flex items-center justify-center bg-orange-50" style={{ borderRadius: 'var(--radius-lg)' }}>
                    <Clock className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: 'var(--foreground)' }}>
                      Reopen Requests
                    </p>
                    <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                      Class Code students requesting course access
                    </p>
                  </div>
                </div>
                <Badge className="text-lg px-4 py-1 bg-orange-500 text-white">
                  {stats.reopenRequests}
                </Badge>
              </div>
            </Link>

            {/* Missing Certificate Templates */}
            {stats.coursesWithoutTemplates > 0 && (
              <Link to="/instructor/certificate-templates">
                <div className="flex items-center justify-between p-4 border-2 bg-red-50 hover:shadow-md transition-all cursor-pointer" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-lg)' }}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 flex items-center justify-center bg-red-100" style={{ borderRadius: 'var(--radius-lg)' }}>
                      <Upload className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-red-900">
                        Missing Certificate Templates
                      </p>
                      <p className="text-sm text-red-700">
                        Courses require certificate template upload
                      </p>
                    </div>
                  </div>
                  <Badge className="text-lg px-4 py-1 bg-red-600 text-white">
                    {stats.coursesWithoutTemplates}
                  </Badge>
                </div>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* My Courses */}
      <Card className="border-0 shadow-lg mb-8" style={{ background: 'var(--card)' }}>
        <CardHeader style={{ background: 'linear-gradient(to right, var(--royal-blue), var(--royal-blue-light))', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0' }}>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <BookOpen className="h-5 w-5" style={{ color: 'var(--gold)' }} />
                My Courses
              </CardTitle>
              <CardDescription className="text-white/70">
                Manage and update your course content
              </CardDescription>
            </div>
            <Link to="/instructor/create-course">
              <Button className="gap-2" style={{ background: 'var(--gold)', color: 'var(--royal-blue)' }}>
                Create New Course
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {courses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto mb-3" style={{ color: 'var(--muted-foreground)' }} />
              <p style={{ color: 'var(--muted-foreground)' }}>No courses yet</p>
              <Link to="/instructor/create-course">
                <Button className="mt-4 gap-2" style={{ background: 'var(--gold)', color: 'var(--royal-blue)' }}>
                  Create Your First Course
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {courses.map((course: any) => (
                <div key={course.id} className="border-2 p-4 hover:shadow-md transition-all" style={{ borderColor: 'var(--border)', borderRadius: 'var(--radius-lg)' }}>
                  <div className="flex gap-4">
                    <img src={course.image || '/placeholder-course.jpg'} alt={course.title} className="w-32 h-24 object-cover" style={{ borderRadius: 'var(--radius-md)' }} />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold" style={{ color: 'var(--royal-blue)' }}>{course.title}</h3>
                          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{course.course_code || ''}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge style={{
                            background: (course.approval_status === 'approved' || course.status === 'approved') ? 'var(--accent-green-50)' :
                                       (course.approval_status === 'pending' || course.status === 'pending_approval') ? 'var(--accent-gold-50)' :
                                       course.approval_status === 'needs_revision' ? 'var(--accent-red-50)' :
                                       'var(--muted)',
                            color: (course.approval_status === 'approved' || course.status === 'approved') ? 'var(--success)' :
                                   (course.approval_status === 'pending' || course.status === 'pending_approval') ? 'var(--gold)' :
                                   course.approval_status === 'needs_revision' ? 'var(--destructive)' :
                                   'var(--muted-foreground)'
                          }}>
                            {(course.approval_status === 'approved' || course.status === 'approved') ? 'Live' :
                             (course.approval_status === 'pending' || course.status === 'pending_approval') ? 'Pending' :
                             course.approval_status === 'needs_revision' ? 'Needs Revision' :
                             'Draft'}
                          </Badge>
                        </div>
                      </div>
                      {course.admin_feedback && (
                        <div className="mb-3 p-3 rounded-lg bg-red-50 border border-red-200">
                          <p className="text-xs font-semibold text-red-900 mb-1">Admin Feedback:</p>
                          <p className="text-xs text-red-700">{course.admin_feedback}</p>
                        </div>
                      )}
                      <div className="flex gap-2 mb-3">
                        <Link to={`/instructor/courses/${course.id}/lessons`}>
                          <Button size="sm" variant="outline" className="gap-1" style={{ borderColor: 'var(--border)', color: 'var(--royal-blue)' }}>
                            <Edit className="h-3.5 w-3.5" />
                            Edit Lessons
                          </Button>
                        </Link>
                        <Link to={`/course/${course.id}`}>
                          <Button size="sm" variant="outline" className="gap-1" style={{ borderColor: 'var(--border)' }}>
                            <Eye className="h-3.5 w-3.5" />
                            Preview
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Link to="/instructor/students">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer" style={{ background: 'var(--card)' }}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 flex items-center justify-center bg-green-50" style={{ borderRadius: 'var(--radius-lg)' }}>
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold" style={{ color: 'var(--foreground)' }}>Student Management</p>
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    View & manage students
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/instructor/grading">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer" style={{ background: 'var(--card)' }}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 flex items-center justify-center" style={{ background: 'var(--accent-blue-50)', borderRadius: 'var(--radius-lg)' }}>
                  <FileText className="h-6 w-6" style={{ color: 'var(--royal-blue)' }} />
                </div>
                <div>
                  <p className="font-semibold" style={{ color: 'var(--foreground)' }}>Grading & Assessments</p>
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    Review essays & finalize grades
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/instructor/certificate-templates">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer" style={{ background: 'var(--card)' }}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 flex items-center justify-center" style={{ background: 'var(--accent-gold-50)', borderRadius: 'var(--radius-lg)' }}>
                  <Award className="h-6 w-6" style={{ color: 'var(--gold)' }} />
                </div>
                <div>
                  <p className="font-semibold" style={{ color: 'var(--foreground)' }}>Certificate Templates</p>
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    Upload & manage templates
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/instructor/analytics">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer" style={{ background: 'var(--card)' }}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 flex items-center justify-center bg-purple-50" style={{ borderRadius: 'var(--radius-lg)' }}>
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold" style={{ color: 'var(--foreground)' }}>Analytics & Progress</p>
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    Monitor student progress
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/instructor/grade-book">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer" style={{ background: 'var(--card)' }}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 flex items-center justify-center bg-indigo-50" style={{ borderRadius: 'var(--radius-lg)' }}>
                  <Calculator className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <p className="font-semibold" style={{ color: 'var(--foreground)' }}>Grade Book Ledger</p>
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    View scores & finalize grades
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/instructor/inbox">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer" style={{ background: 'var(--card)' }}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 flex items-center justify-center bg-cyan-50" style={{ borderRadius: 'var(--radius-lg)' }}>
                  <MessageSquare className="h-6 w-6 text-cyan-600" />
                </div>
                <div>
                  <p className="font-semibold" style={{ color: 'var(--foreground)' }}>Support Inbox</p>
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    Student messages & Q&A
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/instructor/audit-log">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer" style={{ background: 'var(--card)' }}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 flex items-center justify-center bg-slate-50" style={{ borderRadius: 'var(--radius-lg)' }}>
                  <Shield className="h-6 w-6 text-slate-600" />
                </div>
                <div>
                  <p className="font-semibold" style={{ color: 'var(--foreground)' }}>Certificate Audit Log</p>
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    Grade & certificate history
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/instructor/course-requests">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer" style={{ background: 'var(--card)' }}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 flex items-center justify-center bg-orange-50" style={{ borderRadius: 'var(--radius-lg)' }}>
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="font-semibold" style={{ color: 'var(--foreground)' }}>Course Requests</p>
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    Reopen expired courses
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
