import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import {
  TrendingUp, Users, BookOpen, Award, DollarSign, Calendar,
  ArrowUp, Shield, Target, Heart, Loader2, Download
} from 'lucide-react';
import lnuLogo from "@/assets/LNULOGO.png";
import ccellLogo from "@/assets/CCELLLOGO.png";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import * as apiV2 from '../../lib/api-v2';

function downloadCSV(filename: string, rows: string[][]) {
  const escape = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = rows.map(r => r.map(escape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function Analytics() {
  const COLORS = ['#1A237E', '#FFB300', '#16A34A', '#9333EA', '#EF4444', '#3B82F6'];
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(String(currentYear));
  const [quarter, setQuarter] = useState('0');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    apiV2.Admin.getAnalytics(Number(year), Number(quarter))
      .then(d => setData(d))
      .catch(() => toast.error('Failed to load analytics data'))
      .finally(() => setLoading(false));
  }, [year, quarter]);

  const overviewStats = data?.overview || { totalUsers: 0, totalCourses: 0, totalCerts: 0, activeLearners: 0, totalRevenue: 0 };
  const monthlyData = data?.monthlyData || [];
  const topCourses = data?.topCourses || [];
  const topByRevenue = data?.topByRevenue || topCourses;
  const topByEnrollments = data?.topByEnrollments || topCourses;
  const categoryPerformance = data?.categoryData || [];
  const recentActivity = data?.recentActivity || [];
  const periodTotals = monthlyData.reduce((acc: any, m: any) => ({
    enrollments: acc.enrollments + (m.enrollments || 0),
    certificates: acc.certificates + (m.certificates || 0),
    revenue: acc.revenue + (m.revenue || 0),
  }), { enrollments: 0, certificates: 0, revenue: 0 });
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1].map(String);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 bg-gradient-to-r from-[#0D1642] via-[#1A237E] to-[#283593] text-white p-8 rounded-2xl shadow-xl border-b-4 border-[#FFB300] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFB300]/5 rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/5 rounded-full -ml-24 -mb-24" />
        <div className="relative z-10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <img src={lnuLogo} alt="LNU" className="h-12 w-12" />
                <img src={ccellLogo} alt="CCELL" className="h-12 w-12" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="h-5 w-5 text-[#FFB300]" />
                  <Badge className="bg-[#FFB300]/20 text-[#FFB300] border-[#FFB300]/50">Admin</Badge>
                </div>
                <h1 className="text-3xl font-bold">Analytics & Reports</h1>
                <p className="text-blue-200">Platform performance and insights</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="w-28 bg-white/10 text-white border-white/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={quarter} onValueChange={setQuarter}>
                <SelectTrigger className="w-28 bg-white/10 text-white border-white/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Full Year</SelectItem>
                  <SelectItem value="1">Q1 (Jan–Mar)</SelectItem>
                  <SelectItem value="2">Q2 (Apr–Jun)</SelectItem>
                  <SelectItem value="3">Q3 (Jul–Sep)</SelectItem>
                  <SelectItem value="4">Q4 (Oct–Dec)</SelectItem>
                </SelectContent>
              </Select>
              {loading && <Loader2 className="h-5 w-5 text-white animate-spin" />}
            </div>
          </div>
        </div>
      </div>

      {/* Overview Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-2 border-blue-200 hover:border-[#1A237E]/40 transition-all shadow-md hover:shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Users</p>
                <p className="text-3xl font-bold text-[#1A237E]">{overviewStats.totalUsers.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-[#E8EAF6] to-[#C5CAE9] rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-[#1A237E]" />
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <ArrowUp className="h-4 w-4 text-green-600" />
              <span className="text-gray-500">all-time students</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-[#FFB300]/30 hover:border-[#FFB300] transition-all shadow-md hover:shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Courses</p>
                <p className="text-3xl font-bold text-[#FFB300]">{overviewStats.totalCourses}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-[#FFF8E1] to-[#FFECB3] rounded-xl flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-[#FFB300]" />
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <ArrowUp className="h-4 w-4 text-green-600" />
              <span className="text-gray-500">approved courses</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 hover:border-green-400 transition-all shadow-md hover:shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Revenue</p>
                <p className="text-3xl font-bold text-green-600">&#8369;{overviewStats.totalRevenue >= 1000000 ? (overviewStats.totalRevenue / 1000000).toFixed(1) + 'M' : (overviewStats.totalRevenue / 1000).toFixed(0) + 'K'}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-50 to-green-100 rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <ArrowUp className="h-4 w-4 text-green-600" />
              <span className="text-gray-500">verified payments</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 hover:border-purple-400 transition-all shadow-md hover:shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-gray-600 font-medium">Active Learners</p>
                <p className="text-3xl font-bold text-purple-600">{overviewStats.activeLearners.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl flex items-center justify-center">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <ArrowUp className="h-4 w-4 text-green-600" />
              <span className="text-gray-500">active enrollments</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* User Growth Chart */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-[#1A237E] to-[#283593] text-white rounded-t-lg">
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[#FFB300]" />
                User Growth Trends
              </CardTitle>
              <CardDescription className="text-blue-200">Monthly user acquisition and activity</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#1A237E"
                    strokeWidth={3}
                    name="Total Users"
                    dot={{ fill: '#1A237E', r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="enrollments"
                    stroke="#9333EA"
                    strokeWidth={2}
                    name="Enrollments"
                    dot={{ fill: '#9333EA', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue & Certificates Chart */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-[#1A237E]">Revenue & Certificates Issued</CardTitle>
              <CardDescription>Financial performance and certification trends</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: '12px' }} />
                  <YAxis yAxisId="left" stroke="#6B7280" style={{ fontSize: '12px' }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#6B7280" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                    formatter={(value: any, name: string) => {
                      if (name === 'Revenue') return [`₱${(value / 1000).toLocaleString()}K`, name];
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="revenue"
                    fill="#16A34A"
                    name="Revenue"
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="certificates"
                    fill="#FFB300"
                    name="Certificates"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Performing Courses — two separate rankings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* By Revenue */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#1A237E] flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Top by Revenue
                </CardTitle>
                <CardDescription>Highest verified revenue generators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {topByRevenue.map((course: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-white rounded-xl border border-green-100">
                      <div className="w-7 h-7 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-[#1A237E] truncate">{course.title}</h4>
                        <p className="text-xs text-gray-500">by {course.instructor}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-green-600 text-sm">&#8369;{course.revenue.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{course.enrollments} students</p>
                      </div>
                    </div>
                  ))}
                  {topByRevenue.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No data for this period</p>}
                </div>
              </CardContent>
            </Card>

            {/* By Enrollments */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#1A237E] flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#1A237E]" />
                  Top by Enrollments
                </CardTitle>
                <CardDescription>Most enrolled courses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {topByEnrollments.map((course: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-gradient-to-r from-[#E8EAF6] to-white rounded-xl border border-[#1A237E]/10">
                      <div className="w-7 h-7 bg-[#1A237E] text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-[#1A237E] truncate">{course.title}</h4>
                        <p className="text-xs text-gray-500">by {course.instructor}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-[#1A237E] text-sm">{course.enrollments} students</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 justify-end"><Heart className="h-3 w-3 fill-red-500 text-red-500" />{course.recommendations}</p>
                      </div>
                    </div>
                  ))}
                  {topByEnrollments.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No data for this period</p>}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category Distribution Chart */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-[#1A237E]">Enrollment Distribution by Category</CardTitle>
              <CardDescription>Course enrollment breakdown across categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={categoryPerformance}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="enrollments"
                    >
                      {categoryPerformance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {categoryPerformance.map((cat, idx) => (
                    <div key={cat.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                        <div>
                          <span className="font-semibold text-sm text-[#1A237E]">{cat.category}</span>
                          <p className="text-xs text-gray-600">{cat.courses} courses</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">{cat.enrollments.toLocaleString()}</p>
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <ArrowUp className="h-3 w-3" /> {cat.growth}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-[#FFB300] to-[#FF8F00] rounded-t-lg">
              <CardTitle className="text-[#1A237E] font-bold">Export Reports</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-[#E8EAF6] text-[#1A237E] hover:bg-[#C5CAE9] rounded-lg transition-colors font-medium"
                onClick={() => {
                  downloadCSV(`enrollment-report-${year}.csv`, [
                    ['Month', 'Enrollments', 'Certificates'],
                    ...monthlyData.map((m: any) => [m.month, m.enrollments, m.certificates]),
                  ]);
                  toast.success('Enrollment report downloaded');
                }}
              >
                <Download className="h-4 w-4" />
                Enrollment Report (CSV)
              </button>
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-[#FFF8E1] text-[#1A237E] hover:bg-[#FFECB3] rounded-lg transition-colors font-medium"
                onClick={() => {
                  downloadCSV(`revenue-report-${year}.csv`, [
                    ['Month', 'Revenue (PHP)', 'Enrollments'],
                    ...monthlyData.map((m: any) => [m.month, m.revenue, m.enrollments]),
                  ]);
                  toast.success('Revenue report downloaded');
                }}
              >
                <Download className="h-4 w-4" />
                Revenue Report (CSV)
              </button>
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors font-medium"
                onClick={() => {
                  downloadCSV(`course-analytics-${year}.csv`, [
                    ['Course', 'Enrollments', 'Completions', 'Category'],
                    ...topCourses.map((c: any) => [c.title, c.enrollments, c.completions, c.category]),
                  ]);
                  toast.success('Course analytics downloaded');
                }}
              >
                <Download className="h-4 w-4" />
                Course Analytics (CSV)
              </button>
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg transition-colors font-medium"
                onClick={() => {
                  downloadCSV(`platform-report-${year}.csv`, [
                    ['Metric', 'Value'],
                    ['Total Users', overviewStats.totalUsers],
                    ['Active Learners', overviewStats.activeLearners],
                    ['Total Courses', overviewStats.totalCourses],
                    ['Total Certificates', overviewStats.totalCerts],
                    ['Total Revenue (PHP)', overviewStats.totalRevenue],
                    ['Period Enrollments', periodTotals.enrollments],
                    ['Period Certificates', periodTotals.certificates],
                    ['Period Revenue (PHP)', periodTotals.revenue],
                  ]);
                  toast.success('Full platform report downloaded');
                }}
              >
                <Download className="h-4 w-4" />
                Full Platform Report (CSV)
              </button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-[#1A237E]">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentActivity.map((activity, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${
                      activity.type === 'enrollment'
                        ? 'bg-blue-600'
                        : activity.type === 'certificate'
                        ? 'bg-green-600'
                        : activity.type === 'course'
                        ? 'bg-[#FFB300]'
                        : 'bg-purple-600'
                    }`}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-600">{activity.detail}</p>
                    <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Period Totals */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-[#1A237E]">{quarter === '0' ? year : `Q${quarter} ${year}`} Totals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-700">Revenue</span>
                </div>
                <p className="font-bold text-green-600">&#8369;{periodTotals.revenue.toLocaleString()}</p>
              </div>
              <div className="flex justify-between items-center p-3 bg-[#FFF8E1] rounded-lg">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-[#FFB300]" />
                  <span className="text-sm text-gray-700">Certificates</span>
                </div>
                <p className="font-bold text-[#FFB300]">{periodTotals.certificates.toLocaleString()}</p>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-gray-700">Enrollments</span>
                </div>
                <p className="font-bold text-purple-600">{periodTotals.enrollments.toLocaleString()}</p>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-700">Total Certs (all-time)</span>
                </div>
                <p className="font-bold text-blue-600">{overviewStats.totalCerts.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
