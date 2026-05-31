import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import {
  ChevronLeft, ChevronRight, CheckCircle, BookOpen, Loader2, Clock,
  Lock, Play, AlertTriangle, Award, FileText, Monitor, FolderOpen, Eye
} from 'lucide-react';
import { useEnrollments } from '../../lib/EnrollmentContext';
import { useAuth } from '../../lib/AuthContext';
import { toast } from 'sonner';
import * as apiV2 from '../lib/api-v2';
import { AssessmentPopup } from '../components/student/AssessmentPopup';
import { sanitize } from '../lib/sanitize';
import { EnrollmentTimer } from '../components/EnrollmentTimer';

export function LessonViewer() {
  const { courseId, lessonId } = useParams();
  const { user } = useAuth();
  const { getEnrollmentByCourseId } = useEnrollments();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [preTestDone, setPreTestDone] = useState(false);
  const [postTestPassed, setPostTestPassed] = useState(false);
  const [assessmentData, setAssessmentData] = useState<any>(null);
  const [assessmentType, setAssessmentType] = useState<'pre_test' | 'post_test' | 'final_assessment'>('pre_test');
  const [assessmentOpen, setAssessmentOpen] = useState(false);
  const [loadingAssessmentId, setLoadingAssessmentId] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) return;
    setIsCompleted(false);
    setPreTestDone(false);
    setPostTestPassed(false);
    setLoading(true);
    const isPreviewMode = user?.role === 'admin' || user?.role === 'instructor';
    if (isPreviewMode) {
      apiV2.getCourse(courseId).then(r => {
        setCourse(r.course);
        setLessons((r.lessons || []).map((l: any) => ({ ...l, is_locked: false, is_completed: false })));
      }).catch(err => console.error('[LessonViewer] preview load error:', err))
        .finally(() => setLoading(false));
      return;
    }
    Promise.all([
      apiV2.getCourse(courseId),
      apiV2.Student.getCourseLessons(courseId).catch(() => ({ lessons: [] })),
    ]).then(async ([courseResult, lessonsResult]) => {
      setCourse(courseResult.course);
      const ls = lessonsResult.lessons || [];
      setLessons(ls);
      const current = ls.find((l: any) => String(l.id) === String(lessonId));
      if (current?.is_completed) setIsCompleted(true);

      // Restore pre/post-test state from the server
      const enrollment = getEnrollmentByCourseId(courseId);
      const enrollId = enrollment?.id;
      if (enrollId && current) {
        const checks: Promise<void>[] = [];
        if (current.pre_test_id) {
          checks.push(
            apiV2.getAssessment(current.pre_test_id, enrollId)
              .then(r => { if (r.attempt_number > 0) setPreTestDone(true); })
              .catch(() => {})
          );
        }
        if (current.post_test_id) {
          checks.push(
            apiV2.getAssessment(current.post_test_id, enrollId)
              .then(r => { if (r.has_passed) setPostTestPassed(true); })
              .catch(() => {})
          );
        }
        await Promise.all(checks);
      }
    }).catch(err => console.error('[LessonViewer] load error:', err))
      .finally(() => setLoading(false));
  }, [courseId, lessonId, user?.role]);

  const isPreview = user?.role === 'admin' || user?.role === 'instructor';
  const enrollment = getEnrollmentByCourseId(courseId!);
  const progress = enrollment?.progress_percentage || 0;
  const lessonIndex = lessons.findIndex(l => String(l.id) === String(lessonId));
  const currentLesson = lessons[lessonIndex];
  const prevLesson = lessonIndex > 0 ? lessons[lessonIndex - 1] : null;
  const nextLesson = lessonIndex < lessons.length - 1 ? lessons[lessonIndex + 1] : null;

  const rawModules = Array.isArray(course?.modules) ? course.modules : [];
  const moduleGroups = rawModules.length > 0
    ? rawModules.map((m: any) => ({
        ...m,
        enrichedLessons: (m.lessons || []).map((ml: any) =>
          lessons.find((l: any) => String(l.id) === String(ml.id)) || { ...ml, is_completed: false, is_locked: true }
        )
      }))
    : [{ title: 'All Lessons', id: 'all', enrichedLessons: lessons }];

  const handleStartAssessment = async (assessmentId: string, type: 'pre_test' | 'post_test') => {
    if (!assessmentId) return;
    setLoadingAssessmentId(assessmentId);
    try {
      const result = await apiV2.getAssessment(assessmentId, enrollment?.id);
      setAssessmentData({ ...result.assessment, attempt_number: result.attempt_number, can_retake: result.can_retake });
      setAssessmentType(type);
      setAssessmentOpen(true);
    } catch (err: any) {
      toast.error('Failed to load assessment', { description: err.message });
    } finally {
      setLoadingAssessmentId(null);
    }
  };

  const handleMarkComplete = async () => {
    if (!enrollment) {
      toast.error('You must be enrolled to mark lessons complete.');
      return;
    }
    setCompleting(true);
    try {
      const result = await apiV2.Student.completeLesson({ enrollment_id: enrollment.id, lesson_id: String(lessonId!) });
      setIsCompleted(true);
      setLessons(prev => {
        const updated = prev.map(l =>
          String(l.id) === String(lessonId) ? { ...l, is_completed: true } : l
        );
        const idx = updated.findIndex(l => String(l.id) === String(lessonId));
        if (idx >= 0 && idx + 1 < updated.length) {
          updated[idx + 1] = { ...updated[idx + 1], is_locked: false };
        }
        return updated;
      });
      toast.success('Lesson marked as complete!', { description: result.message || 'Progress saved.' });
    } catch (err: any) {
      toast.error('Failed to save progress', { description: err.message });
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" style={{ color: 'var(--royal-blue)' }} />
          <p style={{ color: 'var(--muted-foreground)' }}>Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (!course || !currentLesson) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--muted-foreground)' }} />
          <p className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Lesson not found</p>
          <Link to={`/course/${courseId}`}><Button>Back to Course</Button></Link>
        </div>
      </div>
    );
  }

  const preTestId = currentLesson.pre_test_id;
  const postTestId = currentLesson.post_test_id;

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <div className="border-b" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm mb-3" style={{ color: 'var(--muted-foreground)' }}>
            <Link to={isPreview ? (user?.role === 'admin' ? '/admin/dashboard' : '/instructor/dashboard') : '/student/dashboard'} className="hover:underline" style={{ color: 'var(--royal-blue)' }}>Dashboard</Link>
            <span>/</span>
            <Link to={`/course/${courseId}`} className="hover:underline" style={{ color: 'var(--royal-blue)' }}>{course.title}</Link>
            <span>/</span>
            <span className="truncate max-w-[200px]">{currentLesson.title}</span>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <Badge className="mb-1" style={{ background: 'var(--royal-blue)', color: 'white' }}>
                Lesson {currentLesson.lesson_order || lessonIndex + 1}
              </Badge>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--royal-blue)' }}>{currentLesson.title}</h1>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {isCompleted && (
                <div className="flex items-center gap-2 text-green-600 font-medium text-sm">
                  <CheckCircle className="h-5 w-5" /> Completed
                </div>
              )}
              {currentLesson.estimated_duration_minutes && (
                <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  <Clock className="h-4 w-4" /> {currentLesson.estimated_duration_minutes} min
                </div>
              )}
              {!isPreview && enrollment?.expires_at && !enrollment?.is_expired && (
                <EnrollmentTimer
                  expiresAt={enrollment.expires_at}
                  enrollmentType={enrollment.enrollment_type}
                  variant="compact"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {isPreview && (
        <div className="border-b" style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-2">
            <Eye className="h-4 w-4 shrink-0" style={{ color: '#d97706' }} />
            <p className="text-sm font-medium" style={{ color: '#92400e' }}>
              Preview Mode — viewing as a student. Assessments and progress tracking are disabled.
            </p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* ── Sidebar Accordion ── */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4 border-0 shadow-lg" style={{ background: 'var(--card)' }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold" style={{ color: 'var(--royal-blue)' }}>
                  {isPreview ? 'Course Outline' : 'Course Progress'}
                </CardTitle>
                {!isPreview && (
                  <div className="space-y-1 mt-1">
                    <div className="flex justify-between text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      <span>Overall</span>
                      <span className="font-semibold">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                  </div>
                )}
              </CardHeader>
              <CardContent className="px-2 pb-3 max-h-[60vh] overflow-y-auto">
                <Accordion type="multiple" defaultValue={moduleGroups.map((_: any, i: number) => `mod-${i}`)}>
                  {moduleGroups.map((mod: any, modIdx: number) => (
                    <AccordionItem key={modIdx} value={`mod-${modIdx}`} className="border-b last:border-b-0">
                      <AccordionTrigger className="py-2 px-2 hover:no-underline hover:bg-[var(--accent-blue-50)] rounded-lg text-xs">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 text-white" style={{ background: 'var(--royal-blue)' }}>
                            {modIdx + 1}
                          </div>
                          <span className="font-semibold text-left truncate" style={{ color: 'var(--royal-blue)' }}>{mod.title}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-1">
                        <div className="space-y-0.5 pl-1">
                          {mod.enrichedLessons.map((lesson: any) => {
                            const isActive = String(lesson.id) === String(lessonId);
                            return (
                              <div key={lesson.id}>
                                <Link
                                  to={lesson.is_locked ? '#' : `/course/${courseId}/lesson/${lesson.id}`}
                                  onClick={(e) => { if (lesson.is_locked) e.preventDefault(); }}
                                  className={`flex items-center gap-2 p-2 rounded-lg text-xs transition-all ${
                                    isActive ? 'text-white' : lesson.is_locked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[var(--accent-blue-50)]'
                                  }`}
                                  style={isActive ? { background: 'var(--royal-blue)' } : {}}
                                >
                                  <div className="shrink-0">
                                    {lesson.is_completed
                                      ? <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                                      : lesson.is_locked
                                      ? <Lock className="h-3.5 w-3.5" />
                                      : <div className="h-3.5 w-3.5 rounded-full border-2" style={{ borderColor: isActive ? 'white' : 'var(--muted-foreground)' }} />
                                    }
                                  </div>
                                  <span className="truncate font-medium flex-1">{lesson.title}</span>
                                </Link>
                                {lesson.pre_test_id && (
                                  <div className="flex items-center gap-1.5 pl-8 py-0.5 text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
                                    <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                                    <span>Pre-test</span>
                                  </div>
                                )}
                                {lesson.post_test_id && (
                                  <div className="flex items-center gap-1.5 pl-8 py-0.5 text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
                                    <Award className="h-3 w-3 text-green-500 shrink-0" />
                                    <span>Post-test</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>

          {/* ── Main Content — Strict Sequence ── */}
          <div className="lg:col-span-3 space-y-5">

            {/* 1. Contextual Description & Visuals */}
            <Card className="border-0 shadow-lg" style={{ background: 'var(--card)' }}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base" style={{ color: 'var(--royal-blue)' }}>
                  <BookOpen className="h-5 w-5" /> Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentLesson.description ? (
                  <div className="prose prose-sm max-w-none leading-relaxed mb-4" style={{ color: 'var(--foreground)' }} dangerouslySetInnerHTML={{ __html: sanitize(currentLesson.description) }} />
                ) : (
                  <p className="leading-relaxed mb-4 text-sm" style={{ color: 'var(--muted-foreground)' }}>No description available.</p>
                )}
                {currentLesson.images && currentLesson.images.length > 0 && (
                  <div className="space-y-3 mt-2">
                    {currentLesson.images.map((img: string, i: number) => (
                      <img key={i} src={img} alt={`Visual ${i + 1}`} className="w-full rounded-xl object-cover shadow-sm" draggable={false} onContextMenu={e => e.preventDefault()} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 2. Pre-test Trigger */}
            {!isPreview && preTestId && (
              <Card className="border-2 shadow-lg overflow-hidden" style={{ borderColor: '#F59E0B', background: 'var(--card)' }}>
                <CardHeader className="pb-3" style={{ background: 'linear-gradient(to right, #FFF8E1, transparent)' }}>
                  <CardTitle className="flex items-center gap-2 text-base text-amber-700">
                    <BookOpen className="h-5 w-5 text-amber-500" /> Baseline Check
                    {preTestDone && (
                      <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Submitted
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-semibold mb-1" style={{ color: 'var(--foreground)' }}>Pre-Test — Measure Your Starting Knowledge</p>
                      <p className="text-sm mb-3" style={{ color: 'var(--muted-foreground)' }}>
                        This is a <span className="font-semibold text-amber-600">diagnostic check</span>, not a graded exam. Your score tells the instructor where you're starting from — no pass or fail.
                      </p>
                      {preTestDone ? (
                        <div className="flex items-center gap-2 text-sm font-medium text-amber-700">
                          <CheckCircle className="h-4 w-4" /> Baseline recorded — proceed with the lesson
                        </div>
                      ) : (
                        <Button
                          onClick={() => handleStartAssessment(preTestId, 'pre_test')}
                          disabled={loadingAssessmentId === preTestId}
                          className="gap-2"
                          style={{ background: '#F59E0B', color: '#1A237E' }}
                        >
                          {loadingAssessmentId === preTestId
                            ? <><Loader2 className="h-4 w-4 animate-spin" /> Loading...</>
                            : <><Play className="h-4 w-4" /> Start Baseline Check</>}
                        </Button>
                      )}
                    </div>
                    <div className="p-3 rounded-xl shrink-0 bg-amber-50">
                      <BookOpen className="h-8 w-8 text-amber-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 3. Key Points */}
            {currentLesson.key_points && currentLesson.key_points.length > 0 && (
              <Card className="border-0 shadow-lg" style={{ background: 'var(--card)' }}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base" style={{ color: 'var(--royal-blue)' }}>
                    <CheckCircle className="h-5 w-5 text-green-500" /> Key Points
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--accent-blue-50)' }}>
                    {currentLesson.key_points.map((point: string, i: number) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 text-white mt-0.5" style={{ background: 'var(--royal-blue)' }}>
                          {i + 1}
                        </div>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--royal-blue)' }}>{point}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 4. Video Content */}
            {currentLesson.video_url ? (
              <Card className="border-0 shadow-lg overflow-hidden" style={{ background: 'var(--card)' }}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base" style={{ color: 'var(--royal-blue)' }}>
                    <Monitor className="h-5 w-5" /> Video Content
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <video src={currentLesson.video_url} controls controlsList="nodownload nofullscreen" className="w-full" onContextMenu={e => e.preventDefault()} />
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-sm border-dashed" style={{ background: 'var(--muted)' }}>
                <CardContent className="py-8 text-center">
                  <Monitor className="h-10 w-10 mx-auto mb-2" style={{ color: 'var(--muted-foreground)' }} />
                  <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>No video uploaded for this lesson</p>
                </CardContent>
              </Card>
            )}

            {/* 5. PowerPoint Viewer */}
            {currentLesson.powerpoint_url ? (
              <Card className="border-0 shadow-lg" style={{ background: 'var(--card)' }}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base" style={{ color: 'var(--royal-blue)' }}>
                    <FileText className="h-5 w-5" /> Presentation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-6 rounded-xl border-2 flex items-center gap-4" style={{ background: 'var(--accent-blue-50)', borderColor: 'var(--royal-blue-light)' }}>
                    <div className="p-3 rounded-xl shrink-0" style={{ background: 'white' }}>
                      <FileText className="h-10 w-10" style={{ color: 'var(--royal-blue)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: 'var(--royal-blue)' }}>
                        {currentLesson.powerpoint_url.split('/').pop() || 'Presentation'}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>PowerPoint Presentation</p>
                    </div>
                    <a
                      href={currentLesson.powerpoint_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
                      style={{ background: 'var(--royal-blue)' }}
                      onContextMenu={e => e.preventDefault()}
                    >
                      <Play className="h-4 w-4" /> View Presentation
                    </a>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-sm border-dashed" style={{ background: 'var(--muted)' }}>
                <CardContent className="py-8 text-center">
                  <FileText className="h-10 w-10 mx-auto mb-2" style={{ color: 'var(--muted-foreground)' }} />
                  <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>No presentation uploaded</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>Only PowerPoint (.pptx) files are supported</p>
                </CardContent>
              </Card>
            )}

            {/* 6. Additional Materials */}
            {currentLesson.extra_media_url ? (
              <Card className="border-0 shadow-lg" style={{ background: 'var(--card)' }}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base" style={{ color: 'var(--royal-blue)' }}>
                    <FolderOpen className="h-5 w-5" /> Additional Materials
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <iframe
                    src={currentLesson.extra_media_url}
                    className="w-full rounded-b-xl"
                    style={{ height: '360px', border: 'none' }}
                    title="Additional Material"
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen={false}
                    sandbox="allow-scripts allow-same-origin"
                    onContextMenu={(e) => e.preventDefault()}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-sm border-dashed" style={{ background: 'var(--muted)' }}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base" style={{ color: 'var(--muted-foreground)' }}>
                    <FolderOpen className="h-5 w-5" /> Additional Materials
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No additional materials for this lesson.</p>
                </CardContent>
              </Card>
            )}

            {/* 7. Post-test Trigger */}
            {!isPreview && postTestId && (
              <Card className="border-2 shadow-lg overflow-hidden" style={{ borderColor: postTestPassed ? '#16a34a' : 'var(--royal-blue)', background: 'var(--card)' }}>
                <CardHeader className="pb-3" style={{ background: postTestPassed ? 'linear-gradient(to right, #f0fdf4, transparent)' : 'linear-gradient(to right, var(--accent-blue-50), transparent)' }}>
                  <CardTitle className="flex items-center gap-2 text-base" style={{ color: postTestPassed ? '#16a34a' : 'var(--royal-blue)' }}>
                    <Award className="h-5 w-5" /> Post-Test
                    {postTestPassed && (
                      <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Passed
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-semibold mb-1" style={{ color: 'var(--foreground)' }}>Comprehension Check — After the Lesson</p>
                      <p className="text-sm mb-3" style={{ color: 'var(--muted-foreground)' }}>
                        Demonstrate your understanding. <span className="font-semibold" style={{ color: postTestPassed ? '#16a34a' : 'var(--royal-blue)' }}>
                          {postTestPassed ? 'You passed — well done!' : 'Passing score: 70% — up to 3 retakes.'}
                        </span>
                      </p>
                      <Button
                        onClick={() => handleStartAssessment(postTestId, 'post_test')}
                        disabled={loadingAssessmentId === postTestId}
                        className="gap-2"
                        style={{ background: postTestPassed ? '#16a34a' : 'var(--royal-blue)', color: 'white' }}
                      >
                        {loadingAssessmentId === postTestId
                          ? <><Loader2 className="h-4 w-4 animate-spin" /> Loading...</>
                          : postTestPassed
                            ? <><CheckCircle className="h-4 w-4" /> Review Post-test</>
                            : <><Play className="h-4 w-4" /> Take Post-Test</>}
                      </Button>
                    </div>
                    <div className="p-3 rounded-xl shrink-0" style={{ background: postTestPassed ? '#dcfce7' : 'var(--accent-blue-50)' }}>
                      <Award className="h-8 w-8" style={{ color: postTestPassed ? '#16a34a' : 'var(--royal-blue)' }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Mark as Complete / Completion Banner */}
            {isPreview ? (
              <Card className="border-0 shadow-sm" style={{ background: 'var(--muted)' }}>
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <Eye className="h-5 w-5 shrink-0" style={{ color: 'var(--muted-foreground)' }} />
                    <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Preview mode — progress tracking is not available for instructors or admins.</p>
                  </div>
                </CardContent>
              </Card>
            ) : isCompleted ? (
              <Card className="border-2 shadow-lg" style={{ borderColor: '#16a34a', background: 'linear-gradient(to right, #f0fdf4, var(--card))' }}>
                <CardContent className="py-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-green-800">Lesson Complete</p>
                        <p className="text-xs text-green-600">Your progress has been saved</p>
                      </div>
                    </div>
                    {nextLesson && (
                      <Link to={`/course/${courseId}/lesson/${nextLesson.id}`}>
                        <Button className="gap-2 shrink-0" style={{ background: '#16a34a', color: 'white' }}>
                          Next Lesson <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : postTestId && !postTestPassed ? (
              <Card className="border-2 shadow-lg" style={{ borderColor: 'var(--border)', background: 'var(--muted)' }}>
                <CardContent className="py-5">
                  <div className="flex items-center gap-3">
                    <Lock className="h-5 w-5 shrink-0" style={{ color: 'var(--muted-foreground)' }} />
                    <div>
                      <p className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>Post-test required to continue</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Pass the post-test above to mark this lesson complete and unlock the next one.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2 shadow-lg" style={{ borderColor: '#16a34a', background: 'var(--card)' }}>
                <CardContent className="py-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold" style={{ color: 'var(--foreground)' }}>Finished reading this lesson?</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Mark it complete to track your progress and unlock the next lesson.</p>
                    </div>
                    <Button onClick={handleMarkComplete} disabled={completing} className="gap-2 shrink-0 bg-green-600 hover:bg-green-700 text-white">
                      {completing ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><CheckCircle className="h-4 w-4" /> Mark as Complete</>}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-1">
              {prevLesson ? (
                <Link to={`/course/${courseId}/lesson/${prevLesson.id}`}>
                  <Button variant="outline" className="gap-2">
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </Button>
                </Link>
              ) : <div />}
              {nextLesson ? (
                <Link to={`/course/${courseId}/lesson/${nextLesson.id}`}>
                  <Button variant="outline" className="gap-2">
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <Link to={`/course/${courseId}`}>
                  <Button variant="outline" className="gap-2">
                    Back to Course <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Assessment Popup */}
      {assessmentData && (
        <AssessmentPopup
          open={assessmentOpen}
          onOpenChange={setAssessmentOpen}
          assessment={assessmentData}
          assessmentType={assessmentType}
          enrollmentId={enrollment?.id || ''}
          enrollmentType={enrollment?.enrollment_type || 'certificatory'}
          onComplete={(passed, score) => {
            if (assessmentType === 'pre_test') {
              setPreTestDone(true);
            } else if (assessmentType === 'post_test') {
              if (passed) setPostTestPassed(true);
              toast[passed ? 'success' : 'info'](`Post-test: ${score}% — ${passed ? 'Passed!' : 'Keep studying and retry.'}`);
            }
          }}
        />
      )}
    </div>
  );
}