import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Progress } from '../../components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  Clock,
  Award,
  AlertCircle,
  Play,
  RotateCcw,
  CreditCard,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';
import * as apiV2 from '../../lib/api-v2';
import { EnrollmentTimer } from '../../components/EnrollmentTimer';
import { percentageToGWA, formatGWA, getGWAColorClass } from '../../lib/gwa-calculator';

function enrollmentLabel(type: string) {
  return type === 'academe_student' ? 'Student' : 'Certificatory Client';
}

type EnrollmentStatus = 'active' | 'completed' | 'expired';

export function MyEnrollments() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<EnrollmentStatus>('active');
  const [filterType, setFilterType] = useState<'all' | 'academe_student' | 'certificatory'>('all');
  const [reopenDialogOpen, setReopenDialogOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<any>(null);
  const [reopenReason, setReopenReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadEnrollments();
  }, []);

  const loadEnrollments = async () => {
    setLoading(true);
    try {
      const result = await apiV2.Student.getMyEnrollments();
      setEnrollments(result.enrollments);
    } catch (error: any) {
      console.error('Failed to load enrollments:', error);
      toast.error('Failed to load enrollments');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReopen = (enrollment: any) => {
    setSelectedEnrollment(enrollment);
    setReopenReason('');
    setReopenDialogOpen(true);
  };

  const handleSubmitReopen = async () => {
    if (!reopenReason.trim()) {
      toast.error('Please provide a reason for reopening');
      return;
    }

    if (!selectedEnrollment) return;

    setSubmitting(true);
    try {
      await apiV2.Student.requestCourseReopen(selectedEnrollment.id, {
        reason: reopenReason.trim()
      });

      toast.success('Reopen request sent to instructor');
      setReopenDialogOpen(false);
      setSelectedEnrollment(null);
      await loadEnrollments();
    } catch (error: any) {
      toast.error('Failed to send request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReenroll = (courseId: string) => {
    navigate(`/enroll/${courseId}/payment`);
  };

  const filterEnrollments = (status: EnrollmentStatus) => {
    let filtered = enrollments.filter(e => {
      if (status === 'active') return !e.is_expired && e.progress_percentage < 100;
      if (status === 'completed') return e.progress_percentage >= 100;
      if (status === 'expired') return e.is_expired;
      return true;
    });

    if (filterType !== 'all') {
      filtered = filtered.filter(e => e.enrollment_type === filterType);
    }

    return filtered;
  };

  const getStatusBadge = (enrollment: any) => {
    if (enrollment.progress_percentage >= 100) {
      return (
        <Badge className="gap-1" style={{ background: 'var(--accent-green-50)', color: 'var(--success)' }}>
          <CheckCircle className="h-3 w-3" />
          Completed
        </Badge>
      );
    }

    if (enrollment.is_expired) {
      return (
        <Badge className="gap-1 bg-red-100 text-red-700">
          <AlertCircle className="h-3 w-3" />
          Expired
        </Badge>
      );
    }

    return (
      <Badge className="gap-1" style={{ background: 'var(--accent-blue-50)', color: 'var(--royal-blue)' }}>
          <Clock className="h-3 w-3" />
          In Progress
        </Badge>
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[var(--royal-blue)] border-r-transparent"></div>
          <p className="mt-4" style={{ color: 'var(--muted-foreground)' }}>Loading enrollments...</p>
        </div>
      </div>
    );
  }

  const activeEnrollments = filterEnrollments('active');
  const completedEnrollments = filterEnrollments('completed');
  const expiredEnrollments = filterEnrollments('expired');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/student/dashboard')}
          className="gap-2 mb-4"
          style={{ color: 'var(--royal-blue)' }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="p-6 shadow-xl" style={{
          background: 'linear-gradient(to right, var(--royal-blue-darker), var(--royal-blue), var(--royal-blue-light))',
          borderRadius: 'var(--radius-xl)',
          borderBottom: '3px solid var(--gold)'
        }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center" style={{ background: 'var(--gold)', borderRadius: 'var(--radius-lg)' }}>
              <BookOpen className="h-6 w-6" style={{ color: 'var(--royal-blue)' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">My Courses</h1>
              <p className="text-white/70">Manage your active and past courses</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <Card className="border-0 shadow-lg mb-6" style={{ background: 'var(--card)' }}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
            <Label>Filter by Type:</Label>
            <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Enrollments</SelectItem>
                <SelectItem value="academe_student">Academe Only</SelectItem>
                <SelectItem value="certificatory">Certificatory Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="active">
            Active ({activeEnrollments.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedEnrollments.length})
          </TabsTrigger>
          <TabsTrigger value="expired">
            Expired ({expiredEnrollments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <EnrollmentsList
            enrollments={activeEnrollments}
            onRequestReopen={handleRequestReopen}
            onReenroll={handleReenroll}
            navigate={navigate}
          />
        </TabsContent>

        <TabsContent value="completed">
          <EnrollmentsList
            enrollments={completedEnrollments}
            onRequestReopen={handleRequestReopen}
            onReenroll={handleReenroll}
            navigate={navigate}
          />
        </TabsContent>

        <TabsContent value="expired">
          <EnrollmentsList
            enrollments={expiredEnrollments}
            onRequestReopen={handleRequestReopen}
            onReenroll={handleReenroll}
            navigate={navigate}
          />
        </TabsContent>
      </Tabs>

      {/* Request Reopen Dialog */}
      <Dialog open={reopenDialogOpen} onOpenChange={setReopenDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--royal-blue)' }}>
              Request Course Reopen
            </DialogTitle>
            <DialogDescription>
              {selectedEnrollment?.course?.title || 'Course'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg" style={{ background: 'var(--accent-blue-50)' }}>
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--royal-blue)' }}>
                Important Information
              </p>
              <ul className="text-sm space-y-1 list-disc list-inside" style={{ color: 'var(--royal-blue-light)' }}>
                <li>This request will be sent to your instructor for approval</li>
                <li>The instructor may approve or deny your request</li>
                <li>If approved, you'll receive a new expiration date</li>
                <li>Only Academe students can request course reopening</li>
              </ul>
            </div>

            <div>
              <Label htmlFor="reopen-reason">Reason for Reopening *</Label>
              <Textarea
                id="reopen-reason"
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                rows={5}
                placeholder="Please explain why you need the course reopened (e.g., health issues, family emergency, technical difficulties)"
                className="mt-2"
              />
              <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                Be specific and honest. Your instructor will review this explanation.
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setReopenDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReopen}
              disabled={submitting || !reopenReason.trim()}
              className="gap-2"
              style={{ background: 'var(--royal-blue)', color: 'white' }}
            >
              <RotateCcw className="h-4 w-4" />
              {submitting ? 'Sending...' : 'Send Request'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface EnrollmentsListProps {
  enrollments: any[];
  onRequestReopen: (enrollment: any) => void;
  onReenroll: (courseId: string) => void;
  navigate: any;
}

function EnrollmentsList({ enrollments, onRequestReopen, onReenroll, navigate }: EnrollmentsListProps) {
  if (enrollments.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="py-12 text-center">
          <BookOpen className="h-12 w-12 mx-auto mb-3" style={{ color: 'var(--muted-foreground)' }} />
          <p className="text-gray-600 font-medium mb-1">No enrollments found</p>
          <p className="text-sm text-gray-400">Try a different tab or filter</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {enrollments.map((enrollment) => (
        <Card key={enrollment.id} className="border-0 shadow-lg hover:shadow-xl transition-all">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <img
                src={enrollment.course?.image || '/placeholder-course.jpg'}
                alt={enrollment.course?.title}
                className="w-32 h-24 object-cover rounded-lg"
              />
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-lg" style={{ color: 'var(--royal-blue)' }}>
                      {enrollment.course?.title}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                      by {enrollment.course?.instructor_name || 'Instructor'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge style={{
                      background: enrollment.enrollment_type === 'academe_student' ? 'var(--accent-blue-50)' : 'var(--accent-gold-50)',
                      color: enrollment.enrollment_type === 'academe_student' ? 'var(--royal-blue)' : 'var(--gold)'
                    }}>
                      {enrollmentLabel(enrollment.enrollment_type)}
                    </Badge>
                    {enrollment.expires_at && !enrollment.is_expired && (
                      <EnrollmentTimer
                        expiresAt={enrollment.expires_at}
                        enrollmentType={enrollment.enrollment_type}
                        variant="badge"
                      />
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span style={{ color: 'var(--muted-foreground)' }}>Progress</span>
                    <div className="flex items-center gap-2">
                      {enrollment.average_quiz_score != null && (
                        <span className={`text-xs font-bold ${getGWAColorClass(percentageToGWA(enrollment.average_quiz_score))}`}>
                          GWA {formatGWA(percentageToGWA(enrollment.average_quiz_score))}
                        </span>
                      )}
                      <span className="font-semibold" style={{ color: 'var(--royal-blue)' }}>
                        {enrollment.progress_percentage || 0}%
                      </span>
                    </div>
                  </div>
                  <Progress value={enrollment.progress_percentage || 0} className="h-2" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {!enrollment.is_expired ? (
                      <Button
                        size="sm"
                        onClick={() => navigate(`/course/${enrollment.course_id}`)}
                        className="gap-2"
                        style={{ background: 'var(--royal-blue)', color: 'white' }}
                      >
                        <Play className="h-4 w-4" />
                        {enrollment.progress_percentage > 0 ? 'Continue' : 'Start'} Learning
                      </Button>
                    ) : (
                      <>
                        {enrollment.enrollment_type === 'academe_student' ? (
                          <Button
                            size="sm"
                            onClick={() => onRequestReopen(enrollment)}
                            className="gap-2"
                            disabled={enrollment.reopen_request_pending}
                            style={{ background: 'var(--royal-blue)', color: 'white' }}
                          >
                            <RotateCcw className="h-4 w-4" />
                            {enrollment.reopen_request_pending ? 'Request Pending' : 'Request Reopen'}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => onReenroll(enrollment.course_id)}
                            className="gap-2"
                            style={{ background: 'var(--gold)', color: 'var(--royal-blue)' }}
                          >
                            <CreditCard className="h-4 w-4" />
                            Re-enroll Now
                          </Button>
                        )}
                      </>
                    )}

                    {enrollment.certificate_id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/certificate/${enrollment.certificate_id}`)}
                        className="gap-2"
                      >
                        <Award className="h-4 w-4" />
                        View Certificate
                      </Button>
                    )}
                  </div>

                  {enrollment.is_expired && (
                    <Badge className="gap-1 bg-red-100 text-red-700">
                      <AlertCircle className="h-3 w-3" />
                      Expired {new Date(enrollment.expires_at).toLocaleDateString()}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
