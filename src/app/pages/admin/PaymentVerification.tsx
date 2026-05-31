import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import {
  DollarSign, Search, CheckCircle, XCircle, Clock, Eye, ArrowLeft,
  Smartphone, Building2, CreditCard, AlertTriangle, Filter, RotateCcw, Loader2, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import * as apiV2 from '../../lib/api-v2';

interface PaymentRecord {
  id: string;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  courseId: string;
  amount: number;
  method: 'gcash' | 'bank' | 'paymaya';
  referenceNumber: string;
  notes: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedAt?: string;
  reviewNotes?: string;
}


const methodLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  gcash: { label: 'GCash', icon: <Smartphone className="h-4 w-4" />, color: 'bg-blue-500' },
  bank: { label: 'Bank Transfer', icon: <Building2 className="h-4 w-4" />, color: 'bg-green-600' },
  paymaya: { label: 'PayMaya', icon: <CreditCard className="h-4 w-4" />, color: 'bg-emerald-500' },
};

const statusStyles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  pending: { bg: 'bg-amber-100', text: 'text-amber-800', icon: <Clock className="h-3.5 w-3.5" /> },
  approved: { bg: 'bg-green-100', text: 'text-green-800', icon: <CheckCircle className="h-3.5 w-3.5" /> },
  rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: <XCircle className="h-3.5 w-3.5" /> },
};

export function PaymentVerification() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const result = await apiV2.Admin.getPendingPayments();
      const apiPayments: PaymentRecord[] = (result.enrollments || []).map((e: any) => ({
          id: e.id,
          studentName: e.student_name || e.student?.full_name || 'Unknown',
          studentEmail: e.student_email || e.student?.email || '',
          courseTitle: e.course_title || e.course?.title || 'Unknown Course',
          courseId: e.course_id,
          amount: e.payment_amount || 0,
          method: e.payment_method || 'gcash',
          referenceNumber: e.payment_reference || '',
          notes: e.payment_notes || '',
          submittedAt: e.enrolled_at || new Date().toISOString(),
          status: e.payment_status === 'verified' ? 'approved' : e.payment_status === 'rejected' ? 'rejected' : 'pending',
          reviewedAt: e.payment_verified_at,
          reviewNotes: '',
        }));
        setPayments(apiPayments);
      } catch (err) {
        toast.error('Failed to load payments');
      } finally {
        setLoading(false);
      }
  };

  // Fetch on mount + auto-poll every 30s
  useEffect(() => {
    fetchPayments();
    const interval = setInterval(fetchPayments, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredPayments = payments.filter(p => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (filterMethod !== 'all' && p.method !== filterMethod) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.studentName.toLowerCase().includes(q) ||
             p.referenceNumber.toLowerCase().includes(q) ||
             p.courseTitle.toLowerCase().includes(q);
    }
    return true;
  });

  const pendingCount = payments.filter(p => p.status === 'pending').length;
  const approvedCount = payments.filter(p => p.status === 'approved').length;
  const rejectedCount = payments.filter(p => p.status === 'rejected').length;
  const totalVerified = payments.filter(p => p.status === 'approved').reduce((s, p) => s + p.amount, 0);

  const handleAction = async (paymentId: string, action: 'approved' | 'rejected') => {
    setProcessing(true);
    try {
      // Call V2 backend API
      await apiV2.Admin.verifyPayment(paymentId, action === 'approved');

      setSelectedPayment(null);
      setReviewNotes('');
      await fetchPayments();

      if (action === 'approved') {
        toast.success('Payment Approved', {
          description: `Payment has been verified and student access confirmed.`,
        });
      } else {
        toast.error('Payment Rejected', {
          description: `Payment has been rejected. Student will be notified.`,
        });
      }
    } catch (err: any) {
      console.error('[Payments] V2 Verify API error:', err);
      setSelectedPayment(null);
      setReviewNotes('');
      toast.error('Action failed', { description: err.message || 'Could not process payment.' });
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-PH', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link to="/admin/dashboard">
          <Button variant="ghost" className="gap-2 text-gray-600 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800 text-white p-8 rounded-2xl shadow-xl border-b-4 border-amber-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full -mr-32 -mt-32" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="h-7 w-7 text-amber-400" />
              <h1 className="text-3xl font-bold">Payment Verification</h1>
            </div>
            <p className="text-blue-200">Review and verify student payment submissions</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="border-2 border-amber-200 shadow-md">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
                <p className="text-xs text-gray-600">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-green-200 shadow-md">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
                <p className="text-xs text-gray-600">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-red-200 shadow-md">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-500">{rejectedCount}</p>
                <p className="text-xs text-gray-600">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-blue-200 shadow-md">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-900">₱{totalVerified.toLocaleString()}</p>
                <p className="text-xs text-gray-600">Verified Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg mb-6">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by student, course, or reference number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="h-4 w-4 mr-2 text-gray-400" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterMethod} onValueChange={setFilterMethod}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="gcash">GCash</SelectItem>
                <SelectItem value="bank">Bank Transfer</SelectItem>
                <SelectItem value="paymaya">PayMaya</SelectItem>
              </SelectContent>
            </Select>
            {(filterStatus !== 'all' || filterMethod !== 'all' || searchQuery) && (
              <Button
                variant="outline"
                onClick={() => { setFilterStatus('all'); setFilterMethod('all'); setSearchQuery(''); }}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-700 mx-auto mb-3" />
          <p className="text-gray-500">Loading payment records...</p>
        </div>
      )}

      {/* Payment List */}
      {!loading && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-950 to-blue-900 text-white rounded-t-lg">
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-amber-400" />
              Payment Submissions ({filteredPayments.length})
            </CardTitle>
            <CardDescription className="text-blue-200">Click on a payment to review details</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {filteredPayments.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No payments match your filters</p>
                <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filter criteria</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPayments.map((payment) => {
                  const method = methodLabels[payment.method] || methodLabels.gcash;
                  const status = statusStyles[payment.status] || statusStyles.pending;
                  return (
                    <div
                      key={payment.id}
                      className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                        payment.status === 'pending'
                          ? 'border-amber-200 bg-gradient-to-r from-amber-50/50 to-orange-50/50 hover:border-amber-400'
                          : payment.status === 'approved'
                          ? 'border-green-200 bg-green-50/30 hover:border-green-400'
                          : 'border-red-200 bg-red-50/30 hover:border-red-400'
                      }`}
                      onClick={() => { setSelectedPayment(payment); setReviewNotes(''); }}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-900 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0">
                          {payment.studentName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-blue-950">{payment.studentName}</p>
                            <Badge className={`${status.bg} ${status.text} gap-1 text-xs`}>
                              {status.icon}
                              {payment.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 truncate">{payment.courseTitle}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 sm:gap-6">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 ${method.color} rounded-lg flex items-center justify-center text-white`}>
                            {method.icon}
                          </div>
                          <span className="text-xs text-gray-600 hidden sm:inline">{method.label}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-blue-900">₱{payment.amount.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">{formatDate(payment.submittedAt)}</p>
                        </div>
                        <Button size="sm" variant="ghost" className="shrink-0">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment Detail Modal */}
      <Dialog open={!!selectedPayment} onOpenChange={(v) => { if (!v) { setSelectedPayment(null); setReviewNotes(''); } }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedPayment && (() => {
            const method = methodLabels[selectedPayment.method] || methodLabels.gcash;
            const status = statusStyles[selectedPayment.status] || statusStyles.pending;
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="text-blue-950 text-xl">Payment Details</DialogTitle>
                  <DialogDescription>
                    Review payment #{selectedPayment.id}
                  </DialogDescription>
                </DialogHeader>

                {/* Student & Course Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-amber-50 rounded-xl border border-blue-200">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-900 to-blue-700 rounded-full flex items-center justify-center text-white font-bold">
                      {selectedPayment.studentName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-semibold text-blue-950">{selectedPayment.studentName}</p>
                      <p className="text-sm text-gray-600">{selectedPayment.studentEmail}</p>
                    </div>
                    <div className="ml-auto">
                      <Badge className={`${status.bg} ${status.text} gap-1`}>
                        {status.icon}
                        {selectedPayment.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Payment Details Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">Course</p>
                      <p className="font-semibold text-sm text-blue-950">{selectedPayment.courseTitle}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">Amount</p>
                      <p className="font-bold text-lg text-blue-900">₱{selectedPayment.amount.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">Payment Method</p>
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 ${method.color} rounded flex items-center justify-center text-white`}>
                          {method.icon}
                        </div>
                        <span className="font-medium text-sm">{method.label}</span>
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">Submitted</p>
                      <p className="font-medium text-sm">{formatDate(selectedPayment.submittedAt)}</p>
                    </div>
                  </div>

                  {/* Reference Number */}
                  <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
                    <p className="text-xs text-amber-600 font-semibold mb-1">Reference / Transaction Number</p>
                    <p className="font-mono font-bold text-lg text-amber-900">{selectedPayment.referenceNumber}</p>
                    {selectedPayment.notes && (
                      <p className="text-sm text-amber-700 mt-2">Notes: {selectedPayment.notes}</p>
                    )}
                  </div>

                  {/* Review History (for already reviewed) */}
                  {selectedPayment.reviewedAt && (
                    <div className={`p-4 rounded-xl border-2 ${
                      selectedPayment.status === 'approved'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <p className={`text-xs font-semibold mb-1 ${selectedPayment.status === 'approved' ? 'text-green-700' : 'text-red-700'}`}>
                        Review Decision
                      </p>
                      <p className="text-sm">{selectedPayment.reviewNotes}</p>
                      <p className="text-xs text-gray-500 mt-2">Reviewed: {formatDate(selectedPayment.reviewedAt)}</p>
                    </div>
                  )}

                  {/* Admin Action (for pending payments) */}
                  {selectedPayment.status === 'pending' && (
                    <div className="space-y-3 border-t pt-4">
                      <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                        <p className="text-xs text-blue-800">
                          Verify the reference number against your {method.label} records before approving. Contact the student if the information doesn't match.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="review-notes">Review Notes (optional)</Label>
                        <Textarea
                          id="review-notes"
                          placeholder="Add notes about your verification decision..."
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                          rows={3}
                        />
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleAction(selectedPayment.id, 'rejected')}
                          disabled={processing}
                          variant="outline"
                          className="flex-1 border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 gap-2"
                        >
                          {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                          Reject
                        </Button>
                        <Button
                          onClick={() => handleAction(selectedPayment.id, 'approved')}
                          disabled={processing}
                          className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white gap-2 shadow-lg"
                        >
                          {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                          Approve Payment
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
