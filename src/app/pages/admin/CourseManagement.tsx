import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import {
  BookOpen, Search, CheckCircle, XCircle, Clock, Eye, Trash2,
  Users, AlertCircle, Shield, Heart, Loader2, X, GraduationCap, Mail, Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import * as apiV2 from '../../lib/api-v2';
import { sanitize } from '../../lib/sanitize';
import lnuLogo from "@/assets/LNULOGO.png";
import ccellLogo from "@/assets/CCELLLOGO.png";

type ApprovalStatus = 'all' | 'pending' | 'approved' | 'rejected';

function normalizeCourse(c: any) {
  const statusMap: Record<string, string> = {
    pending_approval: 'pending',
    approved: 'approved',
    rejected: 'rejected',
    archived: 'rejected',
  };
  return {
    ...c,
    instructor: c.instructor_name || c.instructor || 'Unknown',
    enrolled: c.enrolled_count ?? c.enrolled ?? 0,
    recommendationCount: c.recommendation_count ?? 0,
    image: c.thumbnail_url || c.image || '',
    approvalStatus: statusMap[c.status] || c.status || 'pending',
    submittedDate: c.created_at ? new Date(c.created_at).toLocaleDateString() : '—',
    rejectionReason: c.rejection_reason || null,
    price: c.price || 0,
    category: c.category || '—',
    level: c.level || '—',
    duration: c.duration || '—',
    description: c.description || '',
  };
}

export function CourseManagement() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<ApprovalStatus>('all');
  const [page, setPage] = useState({ limit: 20, offset: 0, total: 0 });
  const [enrollPage, setEnrollPage] = useState({ limit: 20, offset: 0, total: 0 });
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectCourseId, setRejectCourseId] = useState<string | null>(null);
  const [enrollmentsOpen, setEnrollmentsOpen] = useState(false);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);

  const loadEnrollments = async (course: any, nextOffset = 0) => {
    setEnrollmentsOpen(true);
    setEnrollments([]);
    setLoadingEnrollments(true);
    try {
      const result = await apiV2.Admin.getCourseEnrollments(course.id, { limit: enrollPage.limit, offset: nextOffset });
      setEnrollments(result.enrollments || []);
      setEnrollPage({
        limit: result.page?.limit ?? enrollPage.limit,
        offset: result.page?.offset ?? nextOffset,
        total: result.total ?? (result.enrollments ? result.enrollments.length : 0),
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to load enrollments');
    } finally {
      setLoadingEnrollments(false);
    }
  };

  const handleViewEnrollments = async (course: any) => {
    await loadEnrollments(course, 0);
  };

  const loadCourses = async (nextOffset = 0) => {
    setLoading(true);
    try {
      const result = await apiV2.Admin.getAllCourses({ limit: page.limit, offset: nextOffset });
      setCourses((result.courses || []).map(normalizeCourse));
      setPage({
        limit: result.page?.limit ?? page.limit,
        offset: result.page?.offset ?? nextOffset,
        total: result.total ?? result.courses?.length ?? 0,
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCourses(0); }, []);

  const filteredCourses = courses.filter(course => {
    const matchesSearch =
      course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || course.approvalStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: courses.length,
    pending: courses.filter(c => c.approvalStatus === 'pending').length,
    approved: courses.filter(c => c.approvalStatus === 'approved').length,
    rejected: courses.filter(c => c.approvalStatus === 'rejected').length,
  };

  const handleApprove = async (courseId: string) => {
    setProcessing(true);
    try {
      await apiV2.Admin.approveCourse(courseId);
      toast.success('Course approved successfully');
      await loadCourses();
      setSelectedCourse(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve course');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = (courseId: string) => {
    setRejectCourseId(courseId);
    setRejectReason('');
    setRejectDialogOpen(true);
  };

  const confirmReject = async () => {
    if (!rejectCourseId || !rejectReason.trim()) { toast.error('Please enter a rejection reason'); return; }
    setProcessing(true);
    try {
      await apiV2.Admin.rejectCourse(rejectCourseId, rejectReason.trim());
      toast.success('Course rejected');
      setRejectDialogOpen(false);
      setRejectCourseId(null);
      await loadCourses();
      setSelectedCourse(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject course');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeactivate = async (courseId: string) => {
    if (!window.confirm('Deactivate this course? Students will lose access.')) return;
    setProcessing(true);
    try {
      await apiV2.Admin.archiveCourse(courseId);
      toast.success('Course deactivated');
      await loadCourses();
      setSelectedCourse(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to deactivate course');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 bg-gradient-to-r from-[#0D1642] via-[#1A237E] to-[#283593] text-white p-8 rounded-2xl shadow-xl border-b-4 border-[#FFB300] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFB300]/5 rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/5 rounded-full -ml-24 -mb-24" />
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <img src={lnuLogo} alt="LNU" className="h-12 w-12" />
              <img src={ccellLogo} alt="CCELL" className="h-12 w-12" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-5 w-5 text-[#FFB300]" />
                <Badge className="bg-[#FFB300]/20 text-[#FFB300] border-[#FFB300]/50">Admin</Badge>
              </div>
              <h1 className="text-3xl font-bold">Course Management & Approval</h1>
              <p className="text-blue-200">Review, approve, and manage all courses</p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-2 border-blue-200 hover:border-[#1A237E]/40 transition-all shadow-md hover:shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Courses</p>
                <p className="text-3xl font-bold text-[#1A237E]">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-[#E8EAF6] to-[#C5CAE9] rounded-xl flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-[#1A237E]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-[#FFB300]/30 hover:border-[#FFB300] transition-all shadow-md hover:shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Pending Review</p>
                <p className="text-3xl font-bold text-[#FFB300]">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-[#FFF8E1] to-[#FFECB3] rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-[#FFB300]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 hover:border-green-400 transition-all shadow-md hover:shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Approved</p>
                <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-50 to-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-200 hover:border-red-400 transition-all shadow-md hover:shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Rejected</p>
                <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-red-50 to-red-100 rounded-xl flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Course List */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-[#1A237E] to-[#283593] text-white rounded-t-lg">
              <CardTitle className="text-white flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#FFB300]" />
                All Courses
              </CardTitle>
              <CardDescription className="text-blue-200">Review and manage course submissions</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by title, instructor, or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant={filterStatus === 'all' ? 'default' : 'outline'}
                    onClick={() => setFilterStatus('all')}
                    className={filterStatus === 'all' ? 'bg-[#1A237E]' : ''}
                  >
                    All
                  </Button>
                  <Button
                    size="sm"
                    variant={filterStatus === 'pending' ? 'default' : 'outline'}
                    onClick={() => setFilterStatus('pending')}
                    className={filterStatus === 'pending' ? 'bg-[#FFB300] text-[#1A237E]' : ''}
                  >
                    Pending
                  </Button>
                  <Button
                    size="sm"
                    variant={filterStatus === 'approved' ? 'default' : 'outline'}
                    onClick={() => setFilterStatus('approved')}
                    className={filterStatus === 'approved' ? 'bg-green-600' : ''}
                  >
                    Approved
                  </Button>
                  <Button
                    size="sm"
                    variant={filterStatus === 'rejected' ? 'default' : 'outline'}
                    onClick={() => setFilterStatus('rejected')}
                    className={filterStatus === 'rejected' ? 'bg-red-600' : ''}
                  >
                    Rejected
                  </Button>
                </div>
              </div>

              {/* Course Cards */}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="h-44 rounded-xl bg-gray-100 animate-pulse" />
                  ))}
                </div>
              ) : filteredCourses.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                  <Search className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium mb-1">No courses found</p>
                  <p className="text-sm text-gray-400">Try adjusting filters or search keywords</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {filteredCourses.map((course) => (
                      <div
                        key={course.id}
                        className={`border-2 rounded-xl p-4 transition-all cursor-pointer ${
                          selectedCourse?.id === course.id
                            ? 'border-[#1A237E] bg-[#E8EAF6]/30'
                            : 'border-gray-100 hover:border-[#1A237E]/20 hover:shadow-md'
                        }`}
                        onClick={() => setSelectedCourse(course)}
                      >
                        <div className="flex gap-4 mb-3">
                          <img src={course.image} alt={course.title} className="w-32 h-24 object-cover rounded-lg shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-[#1A237E] truncate">{course.title}</h3>
                                <p className="text-sm text-gray-600">by {course.instructor}</p>
                              </div>
                              <Badge
                                variant={
                                  course.approvalStatus === 'approved'
                                    ? 'default'
                                    : course.approvalStatus === 'rejected'
                                    ? 'destructive'
                                    : 'secondary'
                                }
                                className={
                                  course.approvalStatus === 'approved'
                                    ? 'bg-green-600'
                                    : course.approvalStatus === 'pending'
                                    ? 'bg-[#FFB300] text-[#1A237E]'
                                    : ''
                                }
                              >
                                {course.approvalStatus}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
                              <span className="bg-[#E8EAF6] px-2 py-1 rounded">{course.category}</span>
                              <span className="bg-[#FFF8E1] px-2 py-1 rounded">{course.level}</span>
                              <span>&#8369;{course.price.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 mb-3">
                          <div>
                            <p className="text-gray-500">Submitted</p>
                            <p className="font-medium">{course.submittedDate}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Students</p>
                            <p className="font-medium">{course.enrolled}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Recommendations</p>
                            <p className="font-medium flex items-center gap-1"><Heart className="h-3 w-3 fill-red-500 text-red-500" />{course.recommendationCount}</p>
                          </div>
                        </div>

                        {course.approvalStatus === 'rejected' && course.rejectionReason && (
                          <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 mb-3">
                            <strong>Rejection Reason:</strong> {course.rejectionReason}
                          </div>
                        )}

                        {course.approvalStatus === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApprove(course.id);
                              }}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckCircle className="h-3.5 w-3.5 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReject(course.id);
                              }}
                              variant="outline"
                              className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {!loading && page.total > page.limit && (
                    <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
                      <div>
                        Showing {page.offset + 1} - {Math.min(page.offset + page.limit, page.total)} of {page.total}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" disabled={page.offset === 0} onClick={() => loadCourses(Math.max(page.offset - page.limit, 0))}>Prev</Button>
                        <Button size="sm" variant="outline" disabled={page.offset + page.limit >= page.total} onClick={() => loadCourses(page.offset + page.limit)}>Next</Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Course Details / Actions */}
        <div className="space-y-6">
          {selectedCourse ? (
            <>
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-[#FFB300] to-[#FF8F00] rounded-t-lg">
                  <CardTitle className="text-[#1A237E] font-bold">Course Details</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">Course Title</p>
                    <p className="font-bold text-[#1A237E]">{selectedCourse.title}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">Instructor</p>
                    <p className="font-semibold">{selectedCourse.instructor}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">Category</p>
                      <p className="text-sm font-medium">{selectedCourse.category}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">Level</p>
                      <p className="text-sm font-medium">{selectedCourse.level}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">Price</p>
                      <p className="text-sm font-bold text-green-600">&#8369;{selectedCourse.price.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">Duration</p>
                      <p className="text-sm font-medium">{selectedCourse.duration}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">Description</p>
                    <p className="text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: sanitize(selectedCourse.description || '') }} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">Status</p>
                    <Badge
                      variant={
                        selectedCourse.approvalStatus === 'approved'
                          ? 'default'
                          : selectedCourse.approvalStatus === 'rejected'
                          ? 'destructive'
                          : 'secondary'
                      }
                      className={
                        selectedCourse.approvalStatus === 'approved'
                          ? 'bg-green-600'
                          : selectedCourse.approvalStatus === 'pending'
                          ? 'bg-[#FFB300] text-[#1A237E]'
                          : ''
                      }
                    >
                      {selectedCourse.approvalStatus}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">Enrolled</p>
                      <p className="text-sm font-bold">{selectedCourse.enrolled}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">Recommendations</p>
                      <p className="text-sm font-bold flex items-center gap-1"><Heart className="h-3 w-3 fill-red-500 text-red-500" />{selectedCourse.recommendationCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-[#1A237E]">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full justify-start gap-2 bg-[#1A237E] hover:bg-[#283593] text-white" onClick={() => navigate(`/course/${selectedCourse.id}`)}>
                    <Eye className="h-4 w-4" />
                    View Full Details
                  </Button>
                  {selectedCourse.approvalStatus === 'pending' && (
                    <>
                      <Button
                        className="w-full justify-start gap-2 bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleApprove(selectedCourse.id)}
                      >
                        <CheckCircle className="h-4 w-4" />
                        Approve Course
                      </Button>
                      <Button
                        className="w-full justify-start gap-2 bg-red-600 hover:bg-red-700 text-white"
                        onClick={() => handleReject(selectedCourse.id)}
                      >
                        <XCircle className="h-4 w-4" />
                        Reject Course
                      </Button>
                    </>
                  )}
                  <Button className="w-full justify-start gap-2" variant="outline" onClick={() => handleViewEnrollments(selectedCourse)}>
                    <Users className="h-4 w-4" />
                    View Enrollments
                  </Button>
                  {selectedCourse.approvalStatus === 'approved' && (
                    <Button className="w-full justify-start gap-2 border-red-300 text-red-600 hover:bg-red-50" variant="outline" onClick={() => handleDeactivate(selectedCourse.id)} disabled={processing}>
                      <Trash2 className="h-4 w-4" />
                      Deactivate Course
                    </Button>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6 text-center text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Select a course to view details and actions</p>
              </CardContent>
            </Card>
          )}

          {/* Review Guidelines */}
          <Card className="border-0 shadow-lg bg-blue-50">
            <CardHeader>
              <CardTitle className="text-[#1A237E] text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Review Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-gray-700 space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <p>Verify course content is complete and accurate</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <p>Ensure pricing is appropriate for content level</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <p>Check that learning outcomes are clearly defined</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <p>Confirm instructor credentials match course level</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>

      {/* Reject Dialog */}
      {rejectDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-[#1A237E] mb-1">Reject Course</h2>
            <p className="text-sm text-gray-500 mb-4">Provide a reason so the instructor can make improvements.</p>
            <Textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Describe what needs to be fixed or improved..."
              className="min-h-[100px] mb-4"
            />
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)} disabled={processing}>Cancel</Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={confirmReject} disabled={processing || !rejectReason.trim()}>
                {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Enrollments Modal */}
      {enrollmentsOpen && selectedCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-lg font-bold text-[#1A237E]">Enrolled Students</h2>
                <p className="text-sm text-gray-500">{selectedCourse.title}</p>
              </div>
              <button onClick={() => setEnrollmentsOpen(false)} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-6">
              {loadingEnrollments ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-[#1A237E]" />
                </div>
              ) : enrollments.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No students enrolled yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-600 mb-4">{enrollments.length} student{enrollments.length !== 1 ? 's' : ''} enrolled</p>
                  {enrollments.map((e: any) => (
                    <div key={e.id} className="flex items-center justify-between p-3 border-2 border-gray-100 rounded-xl hover:border-[#1A237E]/20 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1A237E] to-[#283593] flex items-center justify-center text-white font-semibold text-sm">
                          {(e.student_name || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-[#1A237E]">{e.student_name}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1"><Mail className="h-3 w-3" />{e.student_email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          className={
                            e.status === 'active' ? 'bg-green-600 text-white' :
                            e.status === 'completed' ? 'bg-blue-600 text-white' :
                            e.status === 'expired' ? 'bg-gray-500 text-white' :
                            'bg-[#FFB300] text-[#1A237E]'
                          }
                        >
                          {e.status}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1 justify-end">
                          <Calendar className="h-3 w-3" />
                          {e.enrolled_at ? new Date(e.enrolled_at).toLocaleDateString() : '—'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {!loadingEnrollments && enrollPage.total > enrollPage.limit && (
                <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
                  <div>
                    Showing {enrollPage.offset + 1} - {Math.min(enrollPage.offset + enrollPage.limit, enrollPage.total)} of {enrollPage.total}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={enrollPage.offset === 0} onClick={() => loadEnrollments(selectedCourse, Math.max(enrollPage.offset - enrollPage.limit, 0))}>Prev</Button>
                    <Button size="sm" variant="outline" disabled={enrollPage.offset + enrollPage.limit >= enrollPage.total} onClick={() => loadEnrollments(selectedCourse, enrollPage.offset + enrollPage.limit)}>Next</Button>
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t">
              <Button variant="outline" className="w-full" onClick={() => setEnrollmentsOpen(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
