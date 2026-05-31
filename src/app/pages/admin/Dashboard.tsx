import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Users, BookOpen, Award, DollarSign, TrendingUp, UserCheck, Settings, FileText, Shield, Activity, Plus, X, Heart } from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import * as apiV2 from '../../lib/api-v2';
import lnuLogo from "@/assets/LNULOGO.png";
import ccellLogo from "@/assets/CCELLLOGO.png";

export function AdminDashboard() {
  const { user } = useAuth();
  const displayName = user?.name || 'Admin';
  const [fabOpen, setFabOpen] = useState(false);
  const [recentCourses, setRecentCourses] = useState<any[]>([]);
  const [recentEnrollments, setRecentEnrollments] = useState<any[]>([]);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [topInstructors, setTopInstructors] = useState<any[]>([]);
  const [dashStats, setDashStats] = useState({ totalUsers: 0, totalCourses: 0, totalEnrollments: 0, pendingPayments: 0, pendingApprovals: 0, totalCerts: 0 });

  useEffect(() => {
    (async () => {
      try {
        const [statsResult, coursesResult, enrollmentsResult, usersResult] = await Promise.all([
          apiV2.Admin.getDashboardStats(),
          apiV2.getCourses(),
          apiV2.Admin.getAllEnrollments(),
          apiV2.Admin.getUsers(),
        ]);
        const s = statsResult.stats || {};
        const courses = (coursesResult.courses || []);
        const enrollments = (enrollmentsResult.enrollments || []);
        const users = (usersResult.users || []);

        setDashStats({
          totalUsers: s.total_users || 0,
          totalCourses: s.total_courses || 0,
          totalEnrollments: s.total_enrollments || 0,
          pendingPayments: s.pending_payments || 0,
          pendingApprovals: s.pending_approvals || 0,
          totalCerts: s.total_certificates || 0,
        });

        setRecentCourses(courses.slice(0, 4));

        const sorted = [...enrollments].sort((a, b) =>
          new Date(b.enrolled_at || 0).getTime() - new Date(a.enrolled_at || 0).getTime()
        );
        setRecentEnrollments(sorted.slice(0, 5));
        setPendingPayments(enrollments.filter((e: any) => e.payment_status === 'pending').slice(0, 3));

        const instructors = users.filter((u: any) => u.role === 'instructor');
        const instrWithCounts = instructors.map((ins: any) => ({
          ...ins,
          courseCount: courses.filter((c: any) => c.instructor_id === ins.id).length,
          studentCount: enrollments.filter((e: any) =>
            courses.some((c: any) => c.id === e.course_id && c.instructor_id === ins.id)
          ).length,
        }));
        setTopInstructors(instrWithCounts.sort((a, b) => b.studentCount - a.studentCount).slice(0, 3));
      } catch (err) {
        console.error('[AdminDashboard] Failed to load stats:', err);
      }
    })();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 sm:mb-8 bg-gradient-to-r from-[#090F2E] via-[#1A237E] to-[#283593] text-white p-5 sm:p-7 rounded-2xl shadow-xl border-b-[3px] border-[#FFB300] relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFB300]/5 rounded-full blur-[80px] -mr-32 -mt-32" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5">
              <img src={lnuLogo} alt="LNU" className="h-10 w-10" />
              <img src={ccellLogo} alt="CCELL" className="h-10 w-10" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-4 w-4 text-[#FFB300]" />
                <Badge className="bg-[#FFB300]/15 text-[#FFB300] border-[#FFB300]/30 text-xs">Administrator</Badge>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold mb-0.5">Welcome, {displayName.split(' ')[0]}!</h1>
              <p className="text-sm text-blue-200/70">System overview and platform management</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-green-500/10 backdrop-blur-sm rounded-xl border border-green-400/20">
            <Activity className="h-4 w-4 text-green-400" />
            <div>
              <p className="text-[10px] text-green-200/70">System Status</p>
              <p className="text-xs font-bold text-green-400">All Systems Operational</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-6 sm:mb-8">
        {[
          { label: 'Total Users', value: dashStats.totalUsers.toLocaleString(), sub: `${dashStats.pendingApprovals} courses pending`, icon: Users, border: 'border-[#1A237E]/15', bg: 'from-[#E8EAF6] to-[#C5CAE9]', iconColor: 'text-[#1A237E]', valueColor: 'text-[#1A237E]' },
          { label: 'Active Courses', value: dashStats.totalCourses, sub: `${dashStats.pendingApprovals} pending approval`, icon: BookOpen, border: 'border-[#FFB300]/20', bg: 'from-[#FFF8E1] to-[#FFECB3]', iconColor: 'text-[#FFB300]', valueColor: 'text-[#FFB300]' },
          { label: 'Enrollments', value: dashStats.totalEnrollments.toLocaleString(), sub: `${dashStats.pendingPayments} pending payment`, icon: UserCheck, border: 'border-[#1A237E]/15', bg: 'from-[#E8EAF6] to-[#C5CAE9]', iconColor: 'text-[#1A237E]', valueColor: 'text-[#1A237E]' },
          { label: 'Certificates Issued', value: dashStats.totalCerts.toLocaleString(), sub: 'All time', icon: Award, border: 'border-[#FFB300]/20', bg: 'from-[#FFF8E1] to-[#FFECB3]', iconColor: 'text-[#FFB300]', valueColor: 'text-[#FFB300]' },
        ].map((stat, idx) => (
          <Card key={idx} className={`border ${stat.border} hover:shadow-md transition-all group`}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                  <p className={`text-xl sm:text-2xl font-bold ${stat.valueColor}`}>{stat.value}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{stat.sub}</p>
                </div>
                <div className={`w-10 h-10 bg-gradient-to-br ${stat.bg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-7">
        <div className="lg:col-span-2 space-y-5">
          {/* Recent Enrollments */}
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#1A237E] to-[#283593] text-white py-4">
              <CardTitle className="text-white flex items-center gap-2 text-base">
                <TrendingUp className="h-5 w-5 text-[#FFB300]" />Recent Enrollments
              </CardTitle>
              <CardDescription className="text-blue-200/70 text-sm">Latest course registrations</CardDescription>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="space-y-2.5">
                {recentEnrollments.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No recent enrollments</p>
                ) : recentEnrollments.map((enrollment: any, idx: number) => (
                  <motion.div
                    key={enrollment.id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-[#E8EAF6]/20 rounded-xl border border-gray-100 hover:border-[#1A237E]/15 transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 bg-gradient-to-br from-[#1A237E] to-[#283593] rounded-full flex items-center justify-center text-white font-bold text-[10px] shrink-0">
                        {(enrollment.student_name || 'S').split(' ').map((n: string) => n[0]).join('').slice(0,2)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-[#1A237E] truncate">{enrollment.student_name || '—'}</p>
                        <p className="text-xs text-gray-500 truncate">{enrollment.course_title || '—'}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="font-bold text-sm text-green-600">{enrollment.payment_amount ? `₱${Number(enrollment.payment_amount).toLocaleString()}` : enrollment.class_code ? 'Class Code' : '—'}</p>
                      <p className="text-[10px] text-gray-400">{enrollment.enrolled_at ? new Date(enrollment.enrolled_at).toLocaleDateString('en-PH') : '—'}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pending Payments */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-[#1A237E] flex items-center gap-2 text-base">
                    <DollarSign className="h-5 w-5 text-[#FFB300]" />Pending Payments
                  </CardTitle>
                  <CardDescription className="text-sm">Manual payment confirmations needed</CardDescription>
                </div>
                <Link to="/admin/payments">
                  <Button size="sm" variant="outline" className="border-[#FFB300]/30 text-[#FFB300] hover:bg-[#FFF8E1] text-xs">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                {pendingPayments.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No pending payments</p>
                ) : pendingPayments.map((payment: any, idx: number) => (
                  <div key={payment.id || idx} className="flex items-center justify-between p-3.5 bg-gradient-to-r from-[#FFF8E1] to-[#FFECB3]/20 border border-[#FFB300]/20 rounded-xl">
                    <div>
                      <p className="font-semibold text-sm text-[#1A237E]">{payment.student_name || '—'}</p>
                      <p className="text-xs text-gray-500">{payment.course_title || '—'} &bull; {payment.payment_method || 'Unknown'} &bull; <span className="font-medium text-[#FFB300]">{payment.payment_amount ? `₱${Number(payment.payment_amount).toLocaleString()}` : '—'}</span></p>
                    </div>
                    <Link to="/admin/payments"><Button size="sm" className="bg-[#1A237E] hover:bg-[#283593] text-white text-xs">Review</Button></Link>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Course Management */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="py-4">
              <div className="flex items-center justify-between">
                <div><CardTitle className="text-[#1A237E] text-base">Course Management</CardTitle><CardDescription className="text-sm">All platform courses</CardDescription></div>
                <Link to="/catalog"><Button size="sm" className="bg-[#FFB300] hover:bg-[#FFC107] text-[#1A237E] font-bold text-xs">View Catalog</Button></Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                {recentCourses.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">Loading courses...</p>
                ) : recentCourses.map((course) => (
                  <div key={course.id} className="flex items-center gap-3 p-2.5 border border-gray-100 rounded-xl hover:border-[#1A237E]/15 transition-all">
                    <img src={course.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100'} alt={course.title} className="w-12 h-12 object-cover rounded-lg" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-[#1A237E] truncate">{course.title}</p>
                      <div className="flex gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{course.enrolled_count || 0}</span>
                        <span className="font-medium text-[#FFB300]">₱{(course.price || 0).toLocaleString()}</span>
                      </div>
                    </div>
                    <Badge variant={course.status === 'approved' ? 'default' : 'secondary'} className={`shrink-0 text-[10px] ${course.status === 'approved' ? 'bg-green-600' : ''}`}>
                      {course.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <Card className="border-0 shadow-lg">
            <CardHeader className="py-4"><CardTitle className="text-[#1A237E] text-base">System Health</CardTitle></CardHeader>
            <CardContent className="space-y-2.5">
              {[
                { label: 'Server Status', value: <Badge className="bg-green-600 text-white text-[10px]">Online</Badge>, bg: 'bg-green-50' },
                { label: 'Pending Payments', value: <span className="font-bold text-sm text-[#FFB300]">{dashStats.pendingPayments}</span>, bg: 'bg-[#FFF8E1]' },
                { label: 'Pending Approvals', value: <span className="font-bold text-sm text-purple-600">{dashStats.pendingApprovals}</span>, bg: 'bg-purple-50' },
                { label: 'API Status', value: <Badge className="bg-green-600 text-white text-[10px]">Healthy</Badge>, bg: 'bg-green-50' },
              ].map((item, idx) => (
                <div key={idx} className={`flex justify-between items-center p-2.5 ${item.bg} rounded-lg`}>
                  <span className="text-xs text-gray-600 font-medium">{item.label}</span>
                  {item.value}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="py-4">
              <CardTitle className="text-[#1A237E] text-base">Top Instructors</CardTitle>
              <CardDescription className="text-sm">By student enrollment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {topInstructors.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No instructors yet</p>
              ) : topInstructors.map((instructor: any, idx: number) => (
                <div key={instructor.id || idx} className="flex items-center gap-2.5 p-2.5 bg-gradient-to-r from-gray-50 to-[#E8EAF6]/20 rounded-xl">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                    idx === 0 ? 'bg-[#FFB300] text-[#1A237E]' :
                    idx === 1 ? 'bg-gray-300 text-gray-700' : 'bg-amber-700 text-white'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs text-[#1A237E] truncate">{instructor.name || '—'}</p>
                    <p className="text-[10px] text-gray-500">{instructor.studentCount.toLocaleString()} students · {instructor.courseCount} course{instructor.courseCount !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="py-4">
              <CardTitle className="text-[#1A237E] text-base">Platform Overview</CardTitle>
              <CardDescription className="text-sm">Live stats</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                {[
                  { label: 'Total Users', value: dashStats.totalUsers, icon: Users, color: 'text-[#1A237E]' },
                  { label: 'Active Courses', value: dashStats.totalCourses, icon: BookOpen, color: 'text-[#FFB300]' },
                  { label: 'Total Enrollments', value: dashStats.totalEnrollments, icon: UserCheck, color: 'text-green-600' },
                  { label: 'Certificates Issued', value: dashStats.totalCerts, icon: Award, color: 'text-purple-600' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <item.icon className={`h-4 w-4 ${item.color}`} />
                      <span className="text-xs text-gray-600 font-medium">{item.label}</span>
                    </div>
                    <span className={`text-sm font-bold ${item.color}`}>{item.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {fabOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-20 right-0 bg-white rounded-2xl shadow-2xl border border-gray-100 p-3 min-w-[240px]"
            >
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                <h3 className="font-bold text-sm text-[#1A237E]">Quick Actions</h3>
                <button
                  onClick={() => setFabOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              </div>
              <div className="space-y-1">
                {[
                  { to: '/admin/users', icon: Users, label: 'Manage Users', bg: 'bg-[#E8EAF6]' },
                  { to: '/admin/courses', icon: BookOpen, label: 'Manage Courses', bg: 'bg-[#FFF8E1]' },
                  { to: '/admin/payments', icon: DollarSign, label: 'Verify Payments', bg: 'bg-green-50' },
                  { to: '/admin/certificates', icon: Award, label: 'Issue Certificates', bg: 'bg-[#E8EAF6]' },
                  { to: '/admin/analytics', icon: FileText, label: 'Generate Reports', bg: 'bg-[#FFF8E1]' },
                  { to: '/admin/settings', icon: Settings, label: 'System Settings', bg: 'bg-[#E8EAF6]' },
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Link to={item.to} className="block" onClick={() => setFabOpen(false)}>
                      <Button className={`w-full justify-start gap-2 ${item.bg} text-[#1A237E] hover:opacity-80 border-0 text-xs font-medium h-9`} variant="outline">
                        <item.icon className="h-4 w-4" />{item.label}
                      </Button>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main FAB Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setFabOpen(!fabOpen)}
          className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
            fabOpen
              ? 'bg-gray-800 rotate-45'
              : 'bg-gradient-to-br from-[#FFB300] to-[#FF8F00]'
          }`}
        >
          <Plus className={`h-7 w-7 ${fabOpen ? 'text-white' : 'text-[#1A237E]'}`} />
        </motion.button>
      </div>
    </div>
  );
}
