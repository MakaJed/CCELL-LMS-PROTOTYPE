import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Progress } from '../../components/ui/progress';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { BookOpen, Award, TrendingUp, Clock, Play, GraduationCap, CheckCircle } from 'lucide-react';
import { percentageToGWA, formatGWA, getGWAColorClass } from '../../lib/gwa-calculator';
import * as apiV2 from '../../lib/api-v2';
import { useAuth } from '../../../lib/AuthContext';
import { useEnrollments } from '../../../lib/EnrollmentContext';
import { StatCard } from '../../components/StatCard';
import { EmptyState } from '../../components/EmptyState';
import { EnrollmentTimer } from '../../components/EnrollmentTimer';
import { JoinClassModal } from '../../components/JoinClassModal';
import { motion } from 'motion/react';
import { DashboardStatsSkeleton, CardSkeleton } from '../../components/ui/skeleton';

export function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { enrollments, loading: enrollmentsLoading } = useEnrollments();
  const [isLoading, setIsLoading] = useState(true);
  const [joinClassOpen, setJoinClassOpen] = useState(false);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    apiV2.Student.getRecentActivity()
      .then(r => setRecentActivities(r.activities || []))
      .catch(() => {});
  }, []);

  const enrolledCourses = enrollments.filter(e => e.course);
  const inProgressCourses = enrolledCourses.filter(e => (e.progress_percentage || 0) > 0 && (e.progress_percentage || 0) < 100);
  const completedCourses = enrolledCourses.filter(e => (e.progress_percentage || 0) >= 100);
  const earnedBadges = user?.badges || [];
  const displayName = user?.name || 'Student';

  const avgProgress = enrollments.length > 0
    ? Math.round(enrollments.reduce((sum: number, e: any) => sum + (e.progress_percentage || 0), 0) / enrollments.length)
    : 0;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-8">
          <div className="h-32 bg-gray-200 animate-pulse rounded-2xl" />
        </div>
        <DashboardStatsSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-7 mt-8">
          <div className="lg:col-span-2 space-y-5">
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <div className="space-y-5">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8" role="main" aria-label="Student Dashboard">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6 sm:mb-8 bg-gradient-to-r from-[#090F2E] via-[#1A237E] to-[#0D1642] text-white p-5 sm:p-7 rounded-2xl shadow-xl border-b-[3px] border-[#FFB300] relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-48 sm:w-72 h-48 sm:h-72 bg-[#FFB300]/8 rounded-full blur-[80px] -mr-24 -mt-24" />
        <div className="absolute bottom-0 left-0 w-32 sm:w-48 h-32 sm:h-48 bg-blue-400/5 rounded-full blur-[60px] -ml-16 -mb-16" />

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-[#FFB300]/15 text-[#FFB300] border-[#FFB300]/30 text-xs">Student</Badge>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold mb-1">Welcome back, {displayName.split(' ')[0]}! 👋</h1>
              <p className="text-sm text-blue-200/70">Continue your learning journey</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => setJoinClassOpen(true)}
                className="bg-[#FFB300] hover:bg-[#FFC107] text-[#1A237E] font-bold gap-2 shadow-lg"
              >
                <GraduationCap className="h-4 w-4" />
                Join a Class
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      <JoinClassModal open={joinClassOpen} onOpenChange={setJoinClassOpen} />

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8"
      >
        <StatCard title="Enrolled" value={enrolledCourses.length} icon={BookOpen} trend="Total courses" trendUp={true} color="blue" />
        <StatCard title="In Progress" value={inProgressCourses.length} icon={TrendingUp} trend="Active now" trendUp={true} color="blue" />
        <StatCard title="Completed" value={completedCourses.length} icon={CheckCircle} trend="Finished" trendUp={true} color="blue" />
        <StatCard title="Avg. Score" value={`${avgProgress}%`} icon={Award} trend="Overall progress" trendUp={true} color="blue" />
      </motion.div>

      {/* Expiring Courses Alert */}
      {enrollments.some(e => {
        if (!e.expires_at) return false;
        const daysRemaining = Math.floor((new Date(e.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return daysRemaining <= 7 && daysRemaining > 0;
      }) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Card className="border-2 border-amber-200 bg-amber-50">
            <CardContent className="pt-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center shrink-0">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-amber-900 mb-1">Courses Expiring Soon</h3>
                  <p className="text-sm text-amber-700 mb-3">
                    You have courses that will expire within 7 days. Complete them before time runs out!
                  </p>
                  <div className="space-y-2">
                    {enrollments
                      .filter(e => {
                        if (!e.expires_at) return false;
                        const daysRemaining = Math.floor((new Date(e.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                        return daysRemaining <= 7 && daysRemaining > 0;
                      })
                      .map(enrollment => {
                        const courseTitle = enrollment.course?.title || 'Unknown Course';
                        return (
                          <div key={enrollment.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-amber-200">
                            <span className="text-sm font-medium text-gray-900">{courseTitle}</span>
                            <EnrollmentTimer
                              expiresAt={enrollment.expires_at}
                              enrollmentType={enrollment.enrollment_type}
                              variant="compact"
                            />
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-7">
        {/* My Courses */}
        <div className="lg:col-span-2 space-y-5">
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#1A237E] to-[#283593] text-white py-4">
              <CardTitle className="text-white flex items-center gap-2 text-base">
                <BookOpen className="h-5 w-5 text-[#FFB300]" />My Courses
              </CardTitle>
              <CardDescription className="text-blue-200/70 text-sm">Track your enrolled and in-progress courses</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 px-4 pb-4">
              <Tabs defaultValue="inprogress">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="inprogress" className="text-xs data-[state=active]:bg-[#1A237E] data-[state=active]:text-white">
                    In Progress ({inProgressCourses.length})
                  </TabsTrigger>
                  <TabsTrigger value="enrolled" className="text-xs data-[state=active]:bg-[#1A237E] data-[state=active]:text-white">
                    All Enrolled ({enrolledCourses.length})
                  </TabsTrigger>
                </TabsList>

                {(['inprogress', 'enrolled'] as const).map(tab => {
                  const list = tab === 'inprogress' ? inProgressCourses : enrolledCourses;
                  return (
                    <TabsContent key={tab} value={tab} className="space-y-3 mt-0">
                      {list.length === 0 ? (
                        <EmptyState
                          icon={BookOpen}
                          title={tab === 'inprogress' ? 'No courses in progress' : 'No courses yet'}
                          description={tab === 'inprogress' ? 'Start a lesson in any enrolled course to see it here' : 'Start your learning journey by enrolling in a course'}
                          actionLabel="Browse Courses"
                          onAction={() => navigate('/catalog')}
                        />
                      ) : (
                        list.map((enrollment: any, idx: number) => {
                          const course = enrollment.course || {};
                          const pct = enrollment.progress_percentage || 0;
                          return (
                            <motion.div
                              key={enrollment.id}
                              initial={{ opacity: 0, y: 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.07 }}
                              className="border border-gray-100 rounded-xl p-3.5 hover:border-[#1A237E]/20 hover:shadow-md transition-all group"
                            >
                              <div className="flex gap-3">
                                <img
                                  src={course.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200'}
                                  alt={course.title}
                                  className="w-20 h-16 object-cover rounded-lg shrink-0"
                                  loading="lazy"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2 mb-0.5">
                                    <h3 className="font-semibold text-[#1A237E] text-sm line-clamp-1">{course.title || 'Course'}</h3>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <EnrollmentTimer expiresAt={enrollment.expires_at} enrollmentType={enrollment.enrollment_type} variant="badge" />
                                      <Badge variant="outline" className="text-[10px] border-[#1A237E]/20 text-[#1A237E] hidden sm:block">{course.level || 'Course'}</Badge>
                                    </div>
                                  </div>
                                  <p className="text-xs text-gray-500 mb-2">by {course.instructor_name || course.instructor || 'Instructor'}</p>
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-gray-500">Progress</span>
                                      <div className="flex items-center gap-1.5">
                                        {enrollment.average_quiz_score != null && (
                                          <span className={`font-bold text-xs ${getGWAColorClass(percentageToGWA(enrollment.average_quiz_score))}`}>
                                            GWA {formatGWA(percentageToGWA(enrollment.average_quiz_score))}
                                          </span>
                                        )}
                                        <span className={`font-bold text-xs ${pct >= 100 ? 'text-green-600' : pct > 0 ? 'text-[#1A237E]' : 'text-gray-400'}`}>{pct}%</span>
                                      </div>
                                    </div>
                                    <Progress value={pct} className="h-2" />
                                  </div>
                                  <div className="mt-2 flex gap-2">
                                    <Link to={`/course/${enrollment.course_id}`} className="flex-1">
                                      <Button size="sm" className="w-full gap-1 text-xs bg-gradient-to-r from-[#FFB300] to-[#FF8F00] hover:from-[#FFC107] hover:to-[#FFB300] text-[#1A237E] font-semibold border-0" disabled={enrollment.is_expired}>
                                        <Play className="h-3 w-3" />{enrollment.is_expired ? 'Expired' : pct >= 100 ? 'Review' : pct > 0 ? 'Continue' : 'Start'}
                                      </Button>
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })
                      )}
                      {list.length > 0 && (
                        <Link to="/catalog">
                          <Button variant="outline" className="w-full border-dashed border-[#1A237E]/20 text-[#1A237E] hover:bg-[#1A237E]/5 text-sm mt-1">
                            + Browse More Courses
                          </Button>
                        </Link>
                      )}
                    </TabsContent>
                  );
                })}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Badges */}
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#FFB300] to-[#FF8F00] text-white py-4">
              <CardTitle className="flex items-center gap-2 text-white text-base">
                <Award className="h-5 w-5" />Your Badges
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {earnedBadges.length === 0 ? (
                <div className="text-center py-6">
                  <Award className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No badges earned yet</p>
                  <p className="text-xs text-gray-400 mt-1">Complete courses to earn badges!</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {earnedBadges.map((badge: any, index: number) => (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex flex-col items-center p-2.5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-[#FFB300]/20 hover:border-[#FFB300] hover:shadow transition-all cursor-pointer"
                    >
                      <span className="text-2xl mb-0.5">{badge.icon}</span>
                      <span className="text-[10px] font-semibold text-center text-[#1A237E] line-clamp-2">{badge.name}</span>
                    </motion.div>
                  ))}
                </div>
              )}
              <Link to="/profile">
                <Button variant="outline" size="sm" className="w-full border-[#FFB300]/30 text-[#1A237E] hover:bg-[#FFB300]/10 text-xs">
                  View All Achievements
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="py-4">
              <CardTitle className="flex items-center gap-2 text-[#1A237E] text-base">
                <Clock className="h-5 w-5" />Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentActivities.length === 0 ? (
                <div className="text-center py-4">
                  <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">No activity yet. Start a lesson!</p>
                </div>
              ) : (
                recentActivities.map((item, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.08 }} className="flex items-start gap-2.5">
                    <div className="w-2 h-2 bg-[#1A237E] ring-[#C5CAE9] rounded-full mt-1.5 ring-2" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-500 truncate">{item.subtitle}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{item.time ? new Date(item.time).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</p>
                    </div>
                  </motion.div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}
