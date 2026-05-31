import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import {
  Clock,
  ArrowLeft,
  CheckCircle,
  X,
  User,
  BookOpen,
  Calendar,
  MessageSquare,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import * as apiV2 from '../../lib/api-v2';

export function InstructorCourseRequests() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'deny'>('approve');
  const [responseMessage, setResponseMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const result = await apiV2.Instructor.getReopenRequests();
      setRequests((result.requests || []).map((r: any) => ({
        id: r.id,
        enrollmentId: r.enrollment_id,
        studentName: r.student_name,
        studentEmail: r.student_email,
        courseName: r.course_name,
        classCode: r.class_code || '',
        progress: r.progress_percentage || 0,
        originalExpiry: r.expires_at || '',
        requestedAt: r.requested_at,
        reason: r.reason || 'No reason provided',
        status: r.status,
      })));
    } catch (error: any) {
      console.error('Failed to load requests:', error);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAction = (request: any, action: 'approve' | 'deny') => {
    setSelectedRequest(request);
    setActionType(action);
    setResponseMessage('');
    setActionDialogOpen(true);
  };

  const handleSubmitAction = async () => {
    setSubmitting(true);
    try {
      if (actionType === 'approve') {
        await apiV2.Instructor.approveReopenRequest(selectedRequest.id, responseMessage || undefined);
        toast.success(`Course access reopened for ${selectedRequest.studentName}`);
      } else {
        await apiV2.Instructor.denyReopenRequest(selectedRequest.id, responseMessage || undefined);
        toast.success('Request denied and student has been notified');
      }

      setActionDialogOpen(false);
      setSelectedRequest(null);
      await loadRequests();
    } catch (error: any) {
      toast.error(`Failed to ${actionType} request`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[var(--royal-blue)] border-r-transparent"></div>
          <p className="mt-4" style={{ color: 'var(--muted-foreground)' }}>Loading requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="p-6 shadow-xl" style={{
          background: 'linear-gradient(to right, var(--royal-blue-darker), var(--royal-blue), var(--royal-blue-light))',
          borderRadius: 'var(--radius-xl)',
          borderBottom: '3px solid var(--gold)'
        }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center bg-orange-500" style={{ borderRadius: 'var(--radius-lg)' }}>
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Course Reopen Requests</h1>
              <p className="text-white/70">Manage requests from Class Code students to reopen expired courses</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <Card className="border-0 shadow-lg mb-6" style={{ background: 'var(--accent-blue-50)' }}>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 mt-0.5" style={{ color: 'var(--royal-blue)' }} />
            <div>
              <p className="font-semibold mb-1" style={{ color: 'var(--royal-blue)' }}>Class Code Students Only</p>
              <p className="text-sm" style={{ color: 'var(--royal-blue-light)' }}>
                Only students enrolled via class codes can request course reopening. Paid students must re-enroll and pay again if their access expires.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <Card className="border-0 shadow-lg" style={{ background: 'var(--card)' }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle style={{ color: 'var(--royal-blue)' }}>Pending Requests</CardTitle>
              <CardDescription>
                {requests.length} request{requests.length !== 1 ? 's' : ''} awaiting your review
              </CardDescription>
            </div>
            <Badge className="text-lg px-4 py-1 bg-orange-500 text-white">
              {requests.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
              <p className="font-semibold" style={{ color: 'var(--foreground)' }}>No pending requests</p>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>All requests have been processed</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map(request => (
                <div key={request.id} className="border-2 p-4 hover:shadow-md transition-all" style={{ borderColor: 'var(--border)', borderRadius: 'var(--radius-lg)' }}>
                  {/* Student Info */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 flex items-center justify-center bg-orange-50" style={{ borderRadius: 'var(--radius-lg)' }}>
                        <User className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-semibold" style={{ color: 'var(--foreground)' }}>{request.studentName}</p>
                        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{request.studentEmail}</p>
                      </div>
                    </div>
                    <Badge style={{ background: 'var(--accent-blue-50)', color: 'var(--royal-blue)' }}>
                      {request.classCode}
                    </Badge>
                  </div>

                  {/* Course & Progress Info */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3 text-sm">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
                      <div>
                        <p style={{ color: 'var(--muted-foreground)' }}>Course</p>
                        <p className="font-medium" style={{ color: 'var(--foreground)' }}>{request.courseName}</p>
                      </div>
                    </div>
                    <div>
                      <p style={{ color: 'var(--muted-foreground)' }}>Progress</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-2 rounded-full" style={{ background: 'var(--muted)' }}>
                          <div className="h-full rounded-full bg-orange-500" style={{ width: `${request.progress}%` }} />
                        </div>
                        <span className="font-medium text-orange-600">{request.progress}%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
                      <div>
                        <p style={{ color: 'var(--muted-foreground)' }}>Expired On</p>
                        <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                          {new Date(request.originalExpiry).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
                      <div>
                        <p style={{ color: 'var(--muted-foreground)' }}>Requested</p>
                        <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                          {new Date(request.requestedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Student's Reason */}
                  <div className="mb-4 p-3 rounded-lg" style={{ background: 'var(--muted)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4" style={{ color: 'var(--foreground)' }} />
                      <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Student's Reason:</p>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--foreground)' }}>{request.reason}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      className="gap-1 flex-1 bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleOpenAction(request, 'approve')}
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approve & Reopen
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-1 flex-1 border-red-300 text-red-600 hover:bg-red-50"
                      onClick={() => handleOpenAction(request, 'deny')}
                    >
                      <X className="h-4 w-4" />
                      Deny Request
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ color: actionType === 'approve' ? 'rgb(22, 163, 74)' : 'rgb(220, 38, 38)' }}>
              {actionType === 'approve' ? 'Approve Reopen Request' : 'Deny Reopen Request'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve'
                ? 'Grant access to this student to complete the course'
                : 'Deny this request and notify the student'}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4 py-4">
              {/* Student Info */}
              <div className="p-4 rounded-lg" style={{ background: actionType === 'approve' ? 'rgba(220, 252, 231, 0.5)' : 'rgba(254, 242, 242, 0.5)' }}>
                <p className="font-semibold" style={{ color: 'var(--foreground)' }}>{selectedRequest.studentName}</p>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{selectedRequest.studentEmail}</p>
                <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
                  {selectedRequest.courseName} • {selectedRequest.classCode}
                </p>
              </div>

              {/* Message Input */}
              <div>
                <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>
                  {actionType === 'approve' ? 'Message to Student (optional)' : 'Reason for Denial (optional)'}
                </label>
                <Textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  rows={4}
                  placeholder={actionType === 'approve'
                    ? 'Add a message for the student...'
                    : 'Explain why the request is being denied...'}
                />
              </div>

              {actionType === 'approve' && (
                <div className="p-3 rounded-lg bg-green-50">
                  <p className="text-sm text-green-900">
                    <strong>Note:</strong> The course will be reopened for this student, and they will have additional time to complete it.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setActionDialogOpen(false);
                setSelectedRequest(null);
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitAction}
              disabled={submitting}
              style={{
                background: actionType === 'approve' ? 'rgb(22, 163, 74)' : 'rgb(220, 38, 38)',
                color: 'white'
              }}
            >
              {submitting ? 'Processing...' : (actionType === 'approve' ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve & Reopen
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Deny Request
                </>
              ))}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
