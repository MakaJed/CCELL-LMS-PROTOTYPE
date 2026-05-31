import { useState, useEffect } from 'react';
import { sanitize } from '../lib/sanitize';
import { useParams, Link, useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { Star, Users, Clock, Award, BookOpen, Video, FileText, CheckCircle, Lock, Play, ShieldCheck, Edit, Trash2, Eye, Settings, Download, Sparkles, Heart, Target } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { useEnrollments } from '../../lib/EnrollmentContext';
import { EnrollmentModal } from '../components/EnrollmentModal';
import { AssessmentPopup } from '../components/student/AssessmentPopup';
import { CourseRecommendation } from '../components/CourseRecommendation';
import { toast } from 'sonner';
import * as apiV2 from '../lib/api-v2';

function normalizeCourse(c: any) {
  return {
    ...c,
    courseType: c.course_type || c.courseType || 'certificatory',
    instructor: c.instructor_name || c.instructor || 'Unknown Instructor',
    enrolled: c.enrolled_count ?? c.enrolled ?? 0,
    totalRevenue: c.total_revenue ?? 0,
    recommendationCount: c.recommendation_count ?? 0,
    cpdUnits: c.cpd_units ?? c.cpdUnits ?? 0,
    certificateEligible: !!(c.certificate_eligible ?? c.certificateEligible),
    image: c.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&auto=format&fit=crop',
    modules: Array.isArray(c.modules) ? c.modules : [],
    objectives: Array.isArray(c.objectives) ? c.objectives : [],
    focus: Array.isArray(c.focus) ? c.focus : [],
  };
}

export function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user, enrollInCourse } = useAuth();
  const { getEnrollmentByCourseId, isEnrolledInCourse, refetch } = useEnrollments();
  const [course, setCourse] = useState<any>(null);
  const [courseLoading, setCourseLoading] = useState(true);
  const enrollment = getEnrollmentByCourseId(courseId!);
  const isEnrolled = isEnrolledInCourse(courseId!);
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [generatingCertificate, setGeneratingCertificate] = useState(false);
  const [hasCertificate, setHasCertificate] = useState(false);
  const [firstLessonId, setFirstLessonId] = useState<string | null>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
  const [finalAssessment, setFinalAssessment] = useState<any>(null);
  const [finalAssessmentOpen, setFinalAssessmentOpen] = useState(false);
  const [loadingFinalAssessment, setLoadingFinalAssessment] = useState(false);
  const [recommendCount, setRecommendCount] = useState(0);
  const [hasRecommended, setHasRecommended] = useState(false);

  const overallProgress = enrollment?.progress_percentage || 0;
  const totalLessons = course ? course.modules.reduce((s: number, m: any) => s + (m.lessons?.length || 0), 0) : 0;
  const completedLessonsCount = Math.round(totalLessons * overallProgress / 100);
  const isCourseCompleted = overallProgress >= 100 || enrollment?.status === 'completed';

  useEffect(() => {
    if (!courseId) return;
    setCourseLoading(true);
    apiV2.getCourse(courseId)
      .then(result => setCourse(normalizeCourse(result.course)))
      .catch(err => console.error('[CourseDetail] load error:', err))
      .finally(() => setCourseLoading(false));
    apiV2.getCourseRecommendations(courseId)
      .then(d => { setRecommendCount(d.count || 0); setHasRecommended(!!d.hasRecommended); })
      .catch(() => {});
  }, [courseId]);

  useEffect(() => {
    if (!isEnrolled || !courseId) return;
    apiV2.getCourseFinalAssessment(courseId)
      .then(result => { if (result.assessment) setFinalAssessment(result.assessment); })
      .catch(() => {});
  }, [isEnrolled, courseId]);

  useEffect(() => {
    if (!isEnrolled || !courseId) return;
    apiV2.Student.getCourseLessons(courseId)
      .then(result => {
        const ls: any[] = result.lessons || [];
        const first = ls.find((l: any) => !l.is_locked) || ls[0];
        if (first) setFirstLessonId(String(first.id));
        setCompletedLessonIds(new Set(ls.filter((l: any) => l.is_completed).map((l: any) => String(l.id))));
      })
      .catch(() => {});
  }, [isEnrolled, courseId]);

  useEffect(() => {
    async function checkCertificate() {
      if (!user || !courseId) return;
      try {
        const result = await apiV2.getMyCertificates();
        const cert = result.certificates?.find((c: any) => c.course?.id === courseId || c.courseId === courseId);
        setHasCertificate(!!cert);
      } catch (error) {
        console.error('Error checking certificate:', error);
      }
    }
    checkCertificate();
  }, [user, courseId]);

  const isInstructor = user?.role === 'instructor' && (course?.instructor_id === user?.id || course?.instructor?.includes?.(user?.name || ''));
  const isAdmin = user?.role === 'admin';

  if (courseLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-16">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#1A237E] border-r-transparent mb-4" />
          <p className="text-gray-500">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-16">
          <p className="text-2xl font-bold text-gray-400 mb-4">Course not found</p>
          <Link to="/catalog"><Button>Browse Courses</Button></Link>
        </div>
      </div>
    );
  }

  const handleEnroll = async () => {
    enrollInCourse(course.id);
    // Refetch enrollments after enrollment
    await refetch();
  };

  const handleEnrollClick = () => {
    if (!user) {
      navigate('/login', { state: { from: `/course/${courseId}` } });
      return;
    }
    setEnrollModalOpen(true);
  };

  const handleGenerateCertificate = async () => {
    if (!isCourseCompleted) {
      toast.error('Complete all lessons to generate certificate');
      return;
    }

    if (!enrollment) {
      toast.error('Enrollment Required', {
        description: 'You must be enrolled in this course to generate a certificate.',
      });
      return;
    }

    setGeneratingCertificate(true);
    try {
      const result = await apiV2.generateCertificate(enrollment.id);

      if (result.success) {
        toast.success('Certificate Generated!', {
          description: result.message || 'Your certificate is ready to download',
        });
        navigate('/certificates');
      }
    } catch (error: any) {
      console.error('Certificate generation error:', error);
      toast.error('Failed to generate certificate', {
        description: error.message || 'Please try again later',
      });
    } finally {
      setGeneratingCertificate(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Admin/Instructor Management Bar */}
      {(isAdmin || isInstructor) && (
        <Card className="mb-6 border-2 border-[#FFB300]/30 bg-gradient-to-r from-[#FFF8E1] to-[#FFECB3]/30">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FFB300] rounded-full flex items-center justify-center">
                  <Settings className="h-5 w-5 text-[#1A237E]" />
                </div>
                <div>
                  <p className="font-bold text-[#1A237E]">
                    {isAdmin ? 'Admin Management Mode' : 'Instructor Management Mode'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {isAdmin ? 'You have full access to manage this course' : 'You are the instructor of this course'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {isInstructor && (
                  <>
                    <Link to={`/instructor/create-course?edit=${courseId}`}>
                      <Button size="sm" className="bg-[#1A237E] hover:bg-[#283593] text-white">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit Course
                      </Button>
                    </Link>
                    <Link to={`/instructor/students?course=${courseId}`}>
                      <Button size="sm" variant="outline" className="border-[#1A237E]/20 text-[#1A237E]">
                        <Users className="h-4 w-4 mr-1" />
                        View Students
                      </Button>
                    </Link>
                  </>
                )}
                {isAdmin && (
                  <>
                    <Link to={`/admin/courses?selected=${courseId}`}>
                      <Button size="sm" className="bg-[#1A237E] hover:bg-[#283593] text-white">
                        <Settings className="h-4 w-4 mr-1" />
                        Manage
                      </Button>
                    </Link>
                    <Button size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-4">
              <Badge className="bg-blue-900 text-white">{course.category}</Badge>
              <Badge variant="outline" className="border-amber-400 text-amber-700">{course.level}</Badge>
              {isEnrolled && user?.role === 'student' && (
                <Badge className="bg-green-600 text-white gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Enrolled
                </Badge>
              )}
              {isInstructor && (
                <Badge className="bg-[#FFB300] text-[#1A237E] gap-1">
                  <Award className="h-3 w-3" />
                  Your Course
                </Badge>
              )}
              {isAdmin && (
                <Badge className="bg-[#1A237E] text-white gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  Admin
                </Badge>
              )}
            </div>
            <h1 className="text-4xl font-bold mb-4 text-blue-950">{course.title}</h1>
            <p className="text-xl text-gray-600 mb-6" dangerouslySetInnerHTML={{ __html: sanitize(course.description || '') }} />
            
            <div className="flex items-center gap-6 text-sm mb-6">
              <div className="flex items-center gap-2">
                <img
                  src={`https://ui-avatars.com/api/?name=${course.instructor.replace(' ', '+')}&background=1e3a8a&color=fbbf24`}
                  alt={course.instructor}
                  className="w-10 h-10 rounded-full border-2 border-amber-400"
                />
                <div>
                  <p className="font-medium text-blue-950">{course.instructor}</p>
                  <p className="text-gray-600">Course by Instructor</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-gray-600">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-[#1A237E]" />
                <span className="font-semibold text-blue-950">{course.enrolled.toLocaleString()}</span>
                <span>students enrolled</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                <span className="font-semibold text-blue-950">{recommendCount.toLocaleString()}</span>
                <span>recommendations</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-700" />
                <span>{course.duration}</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-600" />
                <span>Certificate included</span>
              </div>
            </div>

            {/* Course Type Badge & Recommendation Button */}
            <div className="mt-4 flex items-center justify-between gap-4">
              <Badge className={`text-sm px-3 py-1 ${course.courseType === 'certificatory' ? 'bg-[#FFB300] text-[#1A237E]' : 'bg-[#1A237E] text-white'}`}>
                {course.courseType === 'certificatory' ? '🏅 Certificatory Course' : '🎓 Academe Course'}
              </Badge>
              {isEnrolled && user?.role === 'student' && (
                <CourseRecommendation courseId={course.id} isEnrolled={isEnrolled} variant="button" initialRecommendations={recommendCount} hasRecommended={hasRecommended} onToggle={(n, r) => { setRecommendCount(n); setHasRecommended(r); }} />
              )}
            </div>
          </div>

          <div className="aspect-video bg-gray-200 rounded-2xl overflow-hidden mb-8 shadow-lg">
            <img
              src={course.image}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Course Description */}
          <Card className="mb-8 border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-[#1A237E] to-[#283593] text-white">
              <CardTitle className="text-white flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: sanitize(course.description || '') }} />
            </CardContent>
          </Card>

          {/* Learning Objectives */}
          {course.objectives && course.objectives.length > 0 && (
            <Card className="mb-8 border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-[#FFB300] to-[#FF8F00] text-[#1A237E]">
                <CardTitle className="text-[#1A237E] flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Learning Objectives
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-3">
                  {course.objectives.map((objective, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-gray-700">{objective}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Focus of Lessons */}
          {course.focus && course.focus.length > 0 && (
            <Card className="mb-8 border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-[#1A237E] to-[#283593] text-white">
                <CardTitle className="text-white flex items-center gap-2">
                  <Target className="h-5 w-5 text-[#FFB300]" />
                  Focus of Lessons
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {course.focus.map((focusItem, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="w-6 h-6 bg-[#1A237E] rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {idx + 1}
                      </div>
                      <span className="text-sm text-gray-700">{focusItem}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Total Duration Breakdown */}
          <Card className="mb-8 border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Course Duration Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <BookOpen className="h-5 w-5 text-[#1A237E] mx-auto mb-1" />
                  <p className="text-2xl font-bold text-[#1A237E]">{course.modules.length}</p>
                  <p className="text-xs text-gray-600">Modules</p>
                </div>
                <div className="text-center p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <Play className="h-5 w-5 text-[#FFB300] mx-auto mb-1" />
                  <p className="text-2xl font-bold text-[#FFB300]">
                    {course.modules.reduce((sum, m) => sum + m.lessons.length, 0)}
                  </p>
                  <p className="text-xs text-gray-600">Lessons</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg border border-green-100">
                  <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-green-600">
                    {course.modules.filter(m => m.quiz).length}
                  </p>
                  <p className="text-xs text-gray-600">Quizzes</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-100">
                  <Clock className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-purple-600">{course.duration}</p>
                  <p className="text-xs text-gray-600">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Course Progress (if enrolled) */}
          {isEnrolled && enrollment && (
            <Card className="mb-8 border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-[#0D1642] via-[#1A237E] to-[#283593] text-white rounded-t-lg">
                <CardTitle className="text-white">Your Progress</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Overall Completion</span>
                    <span className="font-bold text-[#1A237E]">{overallProgress}%</span>
                  </div>
                  <Progress value={overallProgress} className="h-3" />
                  <p className="text-sm text-gray-600 mt-2">
                    {completedLessonsCount} of {totalLessons} lessons completed
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Certificate Eligibility Card (if enrolled but not completed) */}
          {isEnrolled && !isCourseCompleted && enrollment && (
            <Card className="mb-8 border-2 border-[#FFB300]/30 shadow-lg bg-gradient-to-br from-blue-50 via-white to-amber-50">
              <CardHeader className="border-b bg-gradient-to-r from-[#1A237E]/5 to-[#FFB300]/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#FFB300] to-[#FF8F00] rounded-lg flex items-center justify-center">
                    <Award className="h-5 w-5 text-[#1A237E]" />
                  </div>
                  <div>
                    <CardTitle className="text-[#1A237E]">Certificate Eligibility</CardTitle>
                    <CardDescription>Complete all requirements to earn your certificate</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Progress Bar */}
                  <div className="bg-white rounded-lg p-4 border border-[#FFB300]/20">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                      <span className="text-sm font-bold text-[#1A237E]">{overallProgress}%</span>
                    </div>
                    <Progress value={overallProgress} className="h-2" />
                  </div>

                  {/* Requirements Checklist */}
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Requirements:</p>

                    {/* All Lessons Requirement */}
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-gray-200">
                      {overallProgress >= 100 ? (
                        <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      ) : (
                        <div className="w-5 h-5 border-2 border-gray-300 rounded-full shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Complete all lessons</p>
                        <p className="text-sm text-gray-600">
                          {completedLessonsCount} of {totalLessons} lessons completed
                        </p>
                      </div>
                    </div>

                    {/* Quiz Requirement */}
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-gray-200">
                      {isCourseCompleted ? (
                        <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      ) : (
                        <div className="w-5 h-5 border-2 border-gray-300 rounded-full shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Pass all quizzes with 80% or higher</p>
                        <p className="text-sm text-gray-600">Complete all lessons to unlock quizzes</p>
                      </div>
                    </div>
                  </div>

                  {/* CPD Units Info */}
                  {(course.cpdUnits ?? 0) > 0 && (
                    <div className="bg-gradient-to-r from-[#FFB300]/10 to-[#FF8F00]/10 border border-[#FFB300]/30 rounded-lg p-4 mt-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-[#FFB300]" />
                        <div>
                          <p className="font-semibold text-[#1A237E]">Upon Completion</p>
                          <p className="text-sm text-gray-700">
                            You will earn <span className="font-bold text-[#FFB300]">{course.cpdUnits} CPD Units</span> and a verified LNU certificate
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Certificate Section (if course completed) */}
          {isEnrolled && isCourseCompleted && (
            <Card className="mb-8 border-0 shadow-xl bg-gradient-to-br from-amber-50 via-white to-blue-50 border-2 border-[#FFB300]">
              <CardHeader className="bg-gradient-to-r from-[#FFB300] to-[#FF8F00] text-[#1A237E] rounded-t-lg">
                <div className="flex items-center gap-3">
                  <Award className="h-6 w-6" />
                  <div>
                    <CardTitle className="text-[#1A237E]">Course Completed! 🎉</CardTitle>
                    <CardDescription className="text-[#1A237E]/70">
                      Congratulations on completing this course
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {enrollment?.enrollment_type === 'academe_student' ? (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
                    <ShieldCheck className="h-6 w-6 text-[#1A237E] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-[#1A237E] mb-1">Certificate Pending Grade Finalization</p>
                      <p className="text-sm text-gray-600">
                        Your instructor must finalize and submit grades before your certificate can be issued.
                        Please check back after your class session ends.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#1A237E] to-[#283593] rounded-xl flex items-center justify-center shrink-0">
                        <ShieldCheck className="h-6 w-6 text-[#FFB300]" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#1A237E] mb-1">
                          {hasCertificate ? 'Certificate Issued' : 'Ready for Certification'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {hasCertificate
                            ? 'Your certificate has been automatically issued'
                            : 'Generate your official certificate of completion with CPD units'}
                        </p>
                        {(course.cpdUnits ?? 0) > 0 && (
                          <div className="flex items-center gap-1 mt-2">
                            <Sparkles className="h-4 w-4 text-[#FFB300]" />
                            <span className="text-sm font-medium text-[#FFB300]">
                              {course.cpdUnits} CPD Units Earned
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {hasCertificate ? (
                        <Link to="/student/certificates">
                          <Button className="gap-2 bg-gradient-to-r from-[#1A237E] to-[#283593] hover:from-[#283593] hover:to-[#1A237E] text-white">
                            <Eye className="h-4 w-4" />
                            View Certificate
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          onClick={handleGenerateCertificate}
                          disabled={generatingCertificate}
                          className="gap-2 bg-gradient-to-r from-[#FFB300] to-[#FF8F00] hover:from-[#FF8F00] hover:to-[#FFB300] text-[#1A237E] font-bold shadow-lg"
                        >
                          <Award className="h-4 w-4" />
                          {generatingCertificate ? 'Generating...' : 'Generate Certificate'}
                        </Button>
                      )}
                      {/* Student adjuster: allow layout tweaks post-completion */}
                      <Link to={`/student/courses/${courseId}/certificate-adjuster`}>
                        <Button variant="outline" className="gap-2">
                          Adjust Certificate
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Course Curriculum - Show if enrolled OR admin */}
          {(isEnrolled || isAdmin) && (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-blue-950">Course Curriculum</CardTitle>
                <CardDescription>
                  {course.modules.length} modules • {course.modules.reduce((sum, m) => sum + m.lessons.length, 0)} lessons
                </CardDescription>
              </CardHeader>
              <CardContent>
              {course.modules.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Course curriculum is being prepared</p>
                </div>
              ) : (
                <Accordion type="single" collapsible className="w-full">
                  {course.modules.map((module, idx) => (
                    <AccordionItem key={module.id} value={module.id}>
                      <AccordionTrigger>
                        <div className="flex items-center gap-3 text-left">
                          <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-900 to-blue-700 text-amber-400 rounded-full font-semibold text-sm shrink-0">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-blue-950">{module.title}</p>
                            <p className="text-sm text-gray-600">{module.lessons.length} lessons</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="pl-11 space-y-2">
                          {module.lessons.map((lesson) => {
                            const isCompleted = completedLessonIds.has(String(lesson.id));
                            const Icon = lesson.type === 'video' ? Video :
                                         lesson.type === 'document' ? FileText :
                                         BookOpen;

                            return (
                              <div
                                key={lesson.id}
                                className="flex items-center justify-between p-3 border-2 border-gray-100 rounded-xl hover:border-blue-200 hover:bg-blue-50/30 transition-all"
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                    isCompleted ? 'bg-green-100' : 'bg-gray-100'
                                  }`}>
                                    <Icon className={`h-4 w-4 ${isCompleted ? 'text-green-600' : 'text-gray-500'}`} />
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">{lesson.title}</p>
                                    <p className="text-xs text-gray-500">{lesson.duration}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {isCompleted ? (
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                  ) : (isAdmin || (isEnrolled && enrollment?.status !== 'pending_payment')) ? (
                                    <Link to={`/course/${courseId}/lesson/${lesson.id}`}>
                                      <Button size="sm" variant="ghost" className="text-blue-700 hover:text-blue-900 hover:bg-blue-100">
                                        <Play className="h-4 w-4" />
                                      </Button>
                                    </Link>
                                  ) : (
                                    <Lock className="h-4 w-4 text-gray-300" />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20 border-0 shadow-xl">
            <CardContent className="pt-6">
              {/* Show enrollment options only for students */}
              {user?.role === 'student' && (
                <>
                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold text-blue-900 mb-1">
                      ₱{course.price.toLocaleString()}
                    </div>
                    <p className="text-gray-500 text-sm">One-time payment</p>
                  </div>

                  {isEnrolled ? (
                    <div className="space-y-3">
                      {enrollment?.status === 'pending_payment' ? (
                        <div className="w-full rounded-xl border-2 border-amber-300 bg-amber-50 p-4 text-center space-y-2">
                          <div className="flex items-center justify-center gap-2 text-amber-700 font-semibold text-sm">
                            <Lock className="h-4 w-4" />
                            Awaiting Payment Confirmation
                          </div>
                          <p className="text-xs text-amber-600">An admin will verify your payment within 24 hours. You'll receive full course access once confirmed.</p>
                        </div>
                      ) : (
                      <Button className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white border-2 border-amber-400 shadow-lg" size="lg" asChild disabled={!firstLessonId}>
                        <Link to={firstLessonId ? `/course/${courseId}/lesson/${firstLessonId}` : '#'}>
                          <Play className="h-4 w-4 mr-2" />
                          {firstLessonId ? 'Continue Learning' : 'Loading...'}
                        </Link>
                      </Button>
                      )}

                      {finalAssessment && (
                        <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                          <Button
                            className="w-full gap-2"
                            size="lg"
                            disabled={loadingFinalAssessment}
                            onClick={async () => {
                              setLoadingFinalAssessment(true);
                              try {
                                const result = await apiV2.getCourseFinalAssessment(courseId!);
                                if (result.assessment) {
                                  setFinalAssessment(result.assessment);
                                  setFinalAssessmentOpen(true);
                                } else {
                                  toast.error('Final assessment not available');
                                }
                              } catch { toast.error('Failed to load assessment'); }
                              finally { setLoadingFinalAssessment(false); }
                            }}
                            style={{ background: '#7C3AED', color: 'white' }}
                          >
                            <Award className="h-4 w-4" />
                            {loadingFinalAssessment ? 'Loading...' : 'Take Final Assessment'}
                          </Button>
                          <p className="text-xs text-center mt-1.5" style={{ color: 'var(--muted-foreground)' }}>
                            Up to {finalAssessment.max_retakes ?? finalAssessment.max_retake_attempts ?? 3} retakes available
                          </p>
                        </div>
                      )}

                      <div className="text-center text-sm text-green-600 font-medium flex items-center justify-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        You are enrolled in this course
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Button
                        onClick={handleEnrollClick}
                        className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white border-2 border-amber-400 shadow-lg hover:shadow-xl transition-all"
                        size="lg"
                      >
                        Enroll Now
                      </Button>
                      {!user && (
                        <p className="text-center text-xs text-gray-500">
                          You'll need to log in first
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Instructor/Admin quick stats */}
              {(isInstructor || isAdmin) && (
                <div className="space-y-4 mb-6 pb-6 border-b">
                  <h3 className="font-semibold text-[#1A237E]">Course Statistics</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 p-3 rounded-lg text-center">
                      <Users className="h-5 w-5 text-[#1A237E] mx-auto mb-1" />
                      <p className="text-2xl font-bold text-[#1A237E]">{course.enrolled}</p>
                      <p className="text-xs text-gray-600">Enrolled</p>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg text-center">
                      <Heart className="h-5 w-5 text-red-500 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-red-500">{recommendCount}</p>
                      <p className="text-xs text-gray-600">Recommended</p>
                    </div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600">
                      ₱{(course.totalRevenue ?? 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {!user && (
                <>
                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold text-blue-900 mb-1">
                      ₱{course.price.toLocaleString()}
                    </div>
                    <p className="text-gray-500 text-sm">One-time payment</p>
                  </div>
                  <Button
                    onClick={handleEnrollClick}
                    className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white border-2 border-amber-400 shadow-lg hover:shadow-xl transition-all mb-3"
                    size="lg"
                  >
                    Enroll Now
                  </Button>
                  <p className="text-center text-xs text-gray-500 mb-6">
                    You'll need to log in first
                  </p>
                </>
              )}

              <div className="mt-6 pt-6 border-t space-y-4">
                <h3 className="font-semibold text-blue-950 mb-4">This course includes:</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <Video className="h-5 w-5 text-blue-700 flex-shrink-0" />
                    <span>On-demand video content</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-blue-700 flex-shrink-0" />
                    <span>Interactive pre & post tests</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Award className="h-5 w-5 text-amber-600 flex-shrink-0" />
                    <span>Certificate of completion</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-blue-700 flex-shrink-0" />
                    <span>Time-limited access ({course.duration})</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-blue-700 flex-shrink-0" />
                    <span>Access to instructor support</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="h-5 w-5 text-[#1A237E] flex-shrink-0" />
                    <span>Verified LNU certificate</span>
                  </div>
                  {(course.cpdUnits ?? 0) > 0 && (
                    <div className="flex items-start gap-3">
                      <Sparkles className="h-5 w-5 text-[#FFB300] flex-shrink-0" />
                      <span>{course.cpdUnits} CPD Units upon completion</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold text-blue-950 mb-3">Payment Options:</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span className="text-gray-700">GCash</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-gray-700">Bank Transfer</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                    <span className="text-gray-700">PayMaya</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg">
                    <div className="w-2 h-2 bg-amber-500 rounded-full" />
                    <span className="text-gray-700">Over-the-counter</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enrollment Modal */}
      <EnrollmentModal
        open={enrollModalOpen}
        onOpenChange={setEnrollModalOpen}
        course={course}
        onEnroll={handleEnroll}
      />

      {/* Final Assessment Popup */}
      {finalAssessment && (
        <AssessmentPopup
          open={finalAssessmentOpen}
          onOpenChange={setFinalAssessmentOpen}
          assessment={finalAssessment}
          assessmentType="final_assessment"
          enrollmentId={enrollment?.id || ''}
          enrollmentType={enrollment?.enrollment_type || 'certificatory'}
          onComplete={(passed, score) => {
            if (passed) toast.success(`Final Assessment Passed! Score: ${score}%`);
            else toast.error(`Score: ${score}% — Review material and retake when ready.`);
          }}
        />
      )}
    </div>
  );
}