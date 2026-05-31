import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { sanitize } from '../../lib/sanitize';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { CheckCircle, XCircle, Eye, Clock, BookOpen, User, Calendar, DollarSign, Award, ArrowLeft, Search } from 'lucide-react';
import { toast } from 'sonner';
import * as apiV2 from '../../lib/api-v2';

interface PendingCourse {
  id: string;
  title: string;
  description?: string;
  course_code?: string;
  course_type: 'certificatory' | 'academe';
  category_id?: string;
  price: number;
  duration_weeks: number;
  duration_hours?: number;
  focus_of_lesson?: string;
  learning_objectives?: string[];
  cpd_units?: number;
  status: string;
  created_at: string;
  instructor: {
    id: string;
    full_name: string;
    email: string;
  };
}

export function CourseApproval() {
  const navigate = useNavigate();

  const [courses, setCourses] = useState<PendingCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<PendingCourse | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadPendingCourses();
  }, []);

  const loadPendingCourses = async () => {
    setLoading(true);
    try {
      const result = await apiV2.Admin.getPendingCourses();
      setCourses(result.courses || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load pending courses');
    } finally {
      setLoading(false);
    }
  };

  const openViewDialog = (course: PendingCourse) => {
    setSelectedCourse(course);
    setViewDialogOpen(true);
  };

  const closeViewDialog = () => {
    setViewDialogOpen(false);
    setSelectedCourse(null);
  };

  const openRejectDialog = (course: PendingCourse) => {
    setSelectedCourse(course);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const closeRejectDialog = () => {
    setRejectDialogOpen(false);
    setSelectedCourse(null);
    setRejectionReason('');
  };

  const handleApprove = async (courseId: string) => {
    setProcessing(true);
    try {
      await apiV2.Admin.approveCourse(courseId);
      toast.success('Course approved successfully!');
      await loadPendingCourses();
      closeViewDialog();
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve course');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedCourse) return;

    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setProcessing(true);
    try {
      await apiV2.Admin.rejectCourse(selectedCourse.id, rejectionReason.trim());
      toast.success('Course rejected');
      closeRejectDialog();
      closeViewDialog();
      await loadPendingCourses();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject course');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#1A237E] border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading pending courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin/dashboard')}
          className="gap-2 mb-4 text-[#1A237E] hover:bg-[#E8EAF6]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="bg-gradient-to-r from-[#090F2E] via-[#1A237E] to-[#283593] text-white p-6 rounded-2xl shadow-xl">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="h-6 w-6 text-[#FFB300]" />
            <h1 className="text-2xl font-bold">Course Approval Queue</h1>
          </div>
          <p className="text-blue-200/70 text-sm">
            Review and approve courses submitted by instructors
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-amber-200 bg-amber-50/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-700 font-medium">Pending Review</p>
                <p className="text-3xl font-bold text-amber-900">{courses.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-medium">Certificatory</p>
                <p className="text-3xl font-bold text-blue-900">
                  {courses.filter(c => c.course_type === 'certificatory').length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Award className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium">Academe</p>
                <p className="text-3xl font-bold text-green-900">
                  {courses.filter(c => c.course_type === 'academe').length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Courses List */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-[#1A237E]">Pending Courses ({courses.length})</CardTitle>
          <CardDescription>
            Click on a course to review details and approve or reject
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-32 rounded-xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
              <Search className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium mb-1">No pending courses</p>
              <p className="text-sm text-gray-400">All submitted courses have been reviewed</p>
            </div>
          ) : (
            <div className="space-y-3">
              {courses.map((course) => (
                <Card
                  key={course.id}
                  className="border-2 border-amber-200 bg-amber-50/20 cursor-pointer transition-all hover:shadow-md"
                  onClick={() => openViewDialog(course)}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="shrink-0">
                        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                          <BookOpen className="h-6 w-6 text-amber-600" />
                        </div>
                      </div>

                      {/* Course Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                className={
                                  course.course_type === 'certificatory'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-green-600 text-white'
                                }
                              >
                                {course.course_type === 'certificatory' ? '🏅 Certificatory' : '🎓 Academe'}
                              </Badge>
                              {course.course_code && (
                                <Badge variant="outline" className="font-mono text-xs">
                                  {course.course_code}
                                </Badge>
                              )}
                            </div>
                            <h3 className="font-semibold text-[#1A237E] text-lg mb-1">
                              {course.title}
                            </h3>
                            {course.description && (
                              <p className="text-sm text-gray-600 line-clamp-2 mb-2" dangerouslySetInnerHTML={{ __html: sanitize(course.description) }} />
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm mb-3">
                          <div className="flex items-center gap-2 text-gray-600">
                            <User className="h-4 w-4" />
                            <span className="truncate">{course.instructor.full_name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(course.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span>{course.duration_weeks} weeks</span>
                          </div>
                          {course.course_type === 'certificatory' && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <DollarSign className="h-4 w-4" />
                              <span>₱{course.price.toLocaleString()}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openViewDialog(course);
                            }}
                            className="gap-2 bg-[#1A237E] hover:bg-[#283593] text-white"
                          >
                            <Eye className="h-4 w-4" />
                            Review
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApprove(course.id);
                            }}
                            disabled={processing}
                            className="gap-2 border-green-200 text-green-700 hover:bg-green-50"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Quick Approve
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={(open) => !open && closeViewDialog()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedCourse && (
            <>
              <DialogHeader>
                <DialogTitle className="text-[#1A237E]">Review Course</DialogTitle>
                <DialogDescription>
                  Submitted by {selectedCourse.instructor.full_name}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Course Type & Code */}
                <div className="flex items-center gap-2">
                  <Badge
                    className={
                      selectedCourse.course_type === 'certificatory'
                        ? 'bg-blue-600 text-white'
                        : 'bg-green-600 text-white'
                    }
                  >
                    {selectedCourse.course_type === 'certificatory' ? '🏅 Certificatory' : '🎓 Academe'}
                  </Badge>
                  {selectedCourse.course_code && (
                    <Badge variant="outline" className="font-mono">
                      {selectedCourse.course_code}
                    </Badge>
                  )}
                </div>

                {/* Title */}
                <div>
                  <Label className="text-base font-semibold">Course Title</Label>
                  <p className="mt-1 text-lg text-gray-900">{selectedCourse.title}</p>
                </div>

                {/* Description */}
                {selectedCourse.description && (
                  <div>
                    <Label className="text-base font-semibold">Description</Label>
                    <p className="mt-1 text-gray-700" dangerouslySetInnerHTML={{ __html: sanitize(selectedCourse.description) }} />
                  </div>
                )}

                {/* Focus of Lesson */}
                {selectedCourse.focus_of_lesson && (
                  <div>
                    <Label className="text-base font-semibold">Focus of Lesson</Label>
                    <p className="mt-1 text-gray-700">{selectedCourse.focus_of_lesson}</p>
                  </div>
                )}

                {/* Learning Objectives */}
                {selectedCourse.learning_objectives && selectedCourse.learning_objectives.length > 0 && (
                  <div>
                    <Label className="text-base font-semibold">Learning Objectives</Label>
                    <ul className="mt-1 list-disc list-inside space-y-1">
                      {selectedCourse.learning_objectives.map((obj, idx) => (
                        <li key={idx} className="text-gray-700">{obj}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Course Details Grid */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <Label className="text-sm">Duration</Label>
                    <p className="font-medium text-gray-900">
                      {selectedCourse.duration_weeks} weeks
                      {selectedCourse.duration_hours && ` (${selectedCourse.duration_hours} hours)`}
                    </p>
                  </div>
                  {selectedCourse.course_type === 'certificatory' && (
                    <>
                      <div>
                        <Label className="text-sm">Price</Label>
                        <p className="font-medium text-gray-900">
                          ₱{selectedCourse.price.toLocaleString()}
                        </p>
                      </div>
                      {selectedCourse.cpd_units && (
                        <div>
                          <Label className="text-sm">CPD Units</Label>
                          <p className="font-medium text-gray-900">{selectedCourse.cpd_units}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Instructor Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <Label className="text-sm font-semibold text-blue-900">Instructor Information</Label>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-blue-800">
                      <strong>Name:</strong> {selectedCourse.instructor.full_name}
                    </p>
                    <p className="text-sm text-blue-800">
                      <strong>Email:</strong> {selectedCourse.instructor.email}
                    </p>
                    <p className="text-sm text-blue-800">
                      <strong>Submitted:</strong>{' '}
                      {new Date(selectedCourse.created_at).toLocaleString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end border-t pt-4">
                <Button variant="outline" onClick={closeViewDialog} disabled={processing}>
                  Close
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    openRejectDialog(selectedCourse);
                  }}
                  disabled={processing}
                  className="gap-2 border-red-200 text-red-600 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleApprove(selectedCourse.id)}
                  disabled={processing}
                  className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="h-4 w-4" />
                  {processing ? 'Approving...' : 'Approve Course'}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={(open) => !open && closeRejectDialog()}>
        <DialogContent>
          {selectedCourse && (
            <>
              <DialogHeader>
                <DialogTitle className="text-red-600">Reject Course</DialogTitle>
                <DialogDescription>
                  Please provide a reason for rejecting "{selectedCourse.title}"
                </DialogDescription>
              </DialogHeader>

              <div className="py-4">
                <Label htmlFor="rejection-reason">Rejection Reason *</Label>
                <Textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this course is being rejected..."
                  rows={5}
                  className="mt-1.5"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will be sent to the instructor via email
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={closeRejectDialog} disabled={processing}>
                  Cancel
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={processing || !rejectionReason.trim()}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {processing ? 'Rejecting...' : 'Confirm Rejection'}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
