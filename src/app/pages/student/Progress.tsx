import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Progress as ProgressBar } from '../../components/ui/progress';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  BookOpen,
  Clock,
  Award,
  Target,
  Calendar,
  BarChart3,
  CheckCircle,
  Play
} from 'lucide-react';
import { toast } from 'sonner';
import * as apiV2 from '../../lib/api-v2';
import { useEnrollments } from '../../../lib/EnrollmentContext';

export function StudentProgress() {
  const { enrollments } = useEnrollments();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const result = await apiV2.Student.getProgressAnalytics();
      setAnalytics(result.analytics);
    } catch (error: any) {
      console.error('Failed to load analytics:', error);
      toast.error('Failed to load progress analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[var(--royal-blue)] border-r-transparent"></div>
          <p className="mt-4" style={{ color: 'var(--muted-foreground)' }}>Loading analytics...</p>
        </div>
      </div>
    );
  }

  const stats = analytics || {
    totalLessonsCompleted: 0,
    totalHoursLearned: 0,
    averageScore: 0,
    coursesInProgress: 0,
    coursesCompleted: 0,
    certificatesEarned: 0,
  };

  const activeEnrollments = enrollments.filter(e => !e.is_expired && (e.progress_percentage || 0) < 100);
  const expiringEnrollments = activeEnrollments
    .filter(e => e.expires_at)
    .map(e => ({
      ...e,
      daysLeft: Math.ceil((new Date(e.expires_at!).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    }))
    .filter(e => e.daysLeft > 0 && e.daysLeft <= 30)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8 bg-gradient-to-r from-[#090F2E] via-[#1A237E] to-[#283593] text-white p-6 rounded-2xl shadow-xl border-b-[3px] border-[#FFB300]">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-7 w-7 text-[#FFB300]" />
          <div>
            <h1 className="text-2xl font-bold">Learning Analytics</h1>
            <p className="text-blue-200/70">Track your progress and achievements</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Lessons Completed</p>
                <p className="text-3xl font-bold" style={{ color: 'var(--royal-blue)' }}>
                  {stats.totalLessonsCompleted}
                </p>
              </div>
              <BookOpen className="h-8 w-8" style={{ color: 'var(--royal-blue)', opacity: 0.3 }} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Hours Learned</p>
                <p className="text-3xl font-bold" style={{ color: 'var(--royal-blue)' }}>
                  {stats.totalHoursLearned}
                </p>
              </div>
              <Clock className="h-8 w-8" style={{ color: 'var(--royal-blue)', opacity: 0.3 }} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Certificates</p>
                <p className="text-3xl font-bold" style={{ color: 'var(--gold)' }}>
                  {stats.certificatesEarned}
                </p>
              </div>
              <Award className="h-8 w-8" style={{ color: 'var(--gold)', opacity: 0.3 }} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Avg Score</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.averageScore}%
                </p>
              </div>
              <Target className="h-8 w-8 text-green-600" style={{ opacity: 0.3 }} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course Progress */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle style={{ color: 'var(--royal-blue)' }}>Course Progress</CardTitle>
              <CardDescription>Your enrolled courses and completion status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {enrollments.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-10 w-10 mx-auto mb-2" style={{ color: 'var(--muted-foreground)' }} />
                  <p style={{ color: 'var(--muted-foreground)' }}>No enrolled courses yet</p>
                </div>
              ) : (
                enrollments.map((enrollment: any) => {
                  const pct = enrollment.progress_percentage || 0;
                  const statusLabel = pct >= 100 ? 'Completed' : pct >= 60 ? 'On Track' : pct > 0 ? 'In Progress' : 'Not Started';
                  return (
                    <div key={enrollment.id} className="p-4 border-2 rounded-lg" style={{ borderColor: 'var(--border)' }}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0 mr-2">
                          <p className="font-semibold truncate" style={{ color: 'var(--foreground)' }}>{enrollment.course?.title || 'Course'}</p>
                          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                            by {enrollment.course?.instructor_name || 'Instructor'}
                          </p>
                        </div>
                        <Badge style={{
                          background: pct >= 100 ? 'var(--accent-green-50)' : pct >= 60 ? 'var(--accent-gold-50)' : pct > 0 ? 'var(--accent-blue-50)' : 'var(--muted)',
                          color: pct >= 100 ? 'var(--success)' : pct >= 60 ? 'var(--gold)' : pct > 0 ? 'var(--royal-blue)' : 'var(--muted-foreground)'
                        }}>
                          {statusLabel}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span style={{ color: 'var(--muted-foreground)' }}>Progress</span>
                          <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{pct}%</span>
                        </div>
                        <ProgressBar value={pct} />
                      </div>
                      {pct < 100 && !enrollment.is_expired && (
                        <div className="mt-2">
                          <Link to={`/course/${enrollment.course_id}`}>
                            <Button size="sm" variant="outline" className="gap-1 text-xs" style={{ color: 'var(--royal-blue)', borderColor: 'var(--royal-blue)' }}>
                              <Play className="h-3 w-3" />{pct > 0 ? 'Continue' : 'Start'}
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Learning Summary */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle style={{ color: 'var(--royal-blue)' }}>Learning Summary</CardTitle>
              <CardDescription>Your overall performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--accent-green-50)' }}>
                  <div className="flex items-center gap-3">
                    <Target className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">Average Quiz Score</p>
                      <p className="text-sm text-green-700">Across all assessments</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{stats.averageScore}%</p>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--accent-blue-50)' }}>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5" style={{ color: 'var(--royal-blue)' }} />
                    <div>
                      <p className="font-medium" style={{ color: 'var(--royal-blue)' }}>Total Hours Learned</p>
                      <p className="text-sm" style={{ color: 'var(--royal-blue-light)' }}>Estimated from lessons</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: 'var(--royal-blue)' }}>{stats.totalHoursLearned}h</p>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--accent-gold-50)' }}>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5" style={{ color: 'var(--gold)' }} />
                    <div>
                      <p className="font-medium" style={{ color: 'var(--gold)' }}>Completion Rate</p>
                      <p className="text-sm" style={{ color: 'var(--gold)' }}>Courses finished vs enrolled</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: 'var(--gold)' }}>
                    {enrollments.length > 0 ? Math.round((stats.coursesCompleted / enrollments.length) * 100) : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Expiring Courses */}
          <Card className="border-2 shadow-lg" style={{ borderColor: 'var(--gold-light)' }}>
            <CardHeader className="pb-3" style={{ background: 'var(--accent-gold-50)' }}>
              <CardTitle className="text-base flex items-center gap-2" style={{ color: 'var(--gold)' }}>
                <Calendar className="h-5 w-5" />
                Expiring Soon
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {expiringEnrollments.length === 0 ? (
                <p className="text-sm text-center py-2" style={{ color: 'var(--muted-foreground)' }}>No upcoming expirations</p>
              ) : (
                expiringEnrollments.map((e: any) => (
                  <div key={e.id} className="p-3 rounded-lg border" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-medium text-sm truncate" style={{ color: 'var(--foreground)' }}>{e.course?.title || 'Course'}</p>
                      {e.daysLeft <= 7 && (
                        <Badge className="bg-red-100 text-red-700 text-xs shrink-0 ml-1">Urgent</Badge>
                      )}
                    </div>
                    <p className="text-xs font-medium mt-1" style={{ color: 'var(--gold)' }}>
                      {e.daysLeft} day{e.daysLeft !== 1 ? 's' : ''} remaining
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Milestones */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2" style={{ color: 'var(--royal-blue)' }}>
                <Award className="h-5 w-5" />
                Milestones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {[
                { icon: '📚', title: 'Lessons Completed', value: `${stats.totalLessonsCompleted}`, met: stats.totalLessonsCompleted > 0 },
                { icon: '🏅', title: 'Certificates Earned', value: `${stats.certificatesEarned}`, met: stats.certificatesEarned > 0 },
                { icon: '🎓', title: 'Courses Completed', value: `${stats.coursesCompleted}`, met: stats.coursesCompleted > 0 },
              ].map((m, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: m.met ? 'var(--accent-blue-50)' : 'var(--muted)' }}>
                  <span className="text-2xl">{m.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium text-sm" style={{ color: 'var(--royal-blue)' }}>{m.title}</p>
                  </div>
                  <span className="font-bold text-sm" style={{ color: m.met ? 'var(--royal-blue)' : 'var(--muted-foreground)' }}>{m.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Overview */}
          <Card className="border-2 shadow-lg" style={{ borderColor: 'var(--royal-blue-light)', background: 'var(--accent-blue-50)' }}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <BarChart3 className="h-5 w-5 mt-0.5" style={{ color: 'var(--royal-blue)' }} />
                <div>
                  <p className="font-semibold mb-1" style={{ color: 'var(--royal-blue)' }}>Overall Status</p>
                  <p className="text-sm" style={{ color: 'var(--royal-blue-light)' }}>
                    {stats.coursesInProgress > 0
                      ? `${stats.coursesInProgress} course${stats.coursesInProgress !== 1 ? 's' : ''} in progress · ${stats.coursesCompleted} completed`
                      : stats.coursesCompleted > 0
                        ? `All ${stats.coursesCompleted} enrolled course${stats.coursesCompleted !== 1 ? 's' : ''} completed!`
                        : 'Enroll in a course to start tracking your progress.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
