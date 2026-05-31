import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { CreditCard, Search, CheckCircle, XCircle, Clock, BookOpen } from 'lucide-react';
import * as apiV2 from '../../lib/api-v2';
import { toast } from 'sonner';

function enrollmentLabel(type: string) {
  return type === 'academe_student' ? 'Student' : 'Certificatory Client';
}

function statusIcon(status: string) {
  if (status === 'verified') return <CheckCircle className="h-4 w-4 text-green-500" />;
  if (status === 'rejected') return <XCircle className="h-4 w-4 text-red-500" />;
  return <Clock className="h-4 w-4 text-amber-500" />;
}

function statusLabel(status: string) {
  if (status === 'verified') return { label: 'Verified', bg: 'bg-green-100', text: 'text-green-700' };
  if (status === 'rejected') return { label: 'Rejected', bg: 'bg-red-100', text: 'text-red-700' };
  return { label: 'Pending', bg: 'bg-amber-100', text: 'text-amber-700' };
}

export function PaymentHistory() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    apiV2.Student.getPaymentHistory()
      .then(r => setPayments(r.payments || []))
      .catch(() => toast.error('Failed to load payment history'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = payments.filter(p => {
    const matchesSearch =
      (p.course_title || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.payment_reference || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || p.payment_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalPaid = payments
    .filter(p => p.payment_status === 'verified' && p.payment_amount)
    .reduce((s, p) => s + (p.payment_amount || 0), 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 bg-gradient-to-r from-[#090F2E] via-[#1A237E] to-[#283593] text-white p-6 rounded-2xl shadow-xl border-b-[3px] border-[#FFB300]">
        <div className="flex items-center gap-3">
          <CreditCard className="h-7 w-7 text-[#FFB300]" />
          <div>
            <h1 className="text-2xl font-bold">Payment History</h1>
            <p className="text-blue-200/70">Your enrollment and payment records</p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Total Enrollments</p>
                <p className="text-3xl font-bold" style={{ color: 'var(--royal-blue)' }}>{payments.length}</p>
              </div>
              <BookOpen className="h-8 w-8 opacity-20" style={{ color: 'var(--royal-blue)' }} />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Verified Payments</p>
                <p className="text-3xl font-bold text-green-600">
                  {payments.filter(p => p.payment_status === 'verified').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 opacity-20 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Total Paid</p>
                <p className="text-3xl font-bold" style={{ color: 'var(--gold)' }}>
                  ₱{totalPaid.toLocaleString()}
                </p>
              </div>
              <CreditCard className="h-8 w-8 opacity-20" style={{ color: 'var(--gold)' }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle style={{ color: 'var(--royal-blue)' }}>Transaction Records</CardTitle>
          <CardDescription>All enrollment payments and class code registrations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
              <Input
                placeholder="Search by course or reference..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: 'var(--muted)' }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-20" style={{ color: 'var(--muted-foreground)' }} />
              <p className="font-medium" style={{ color: 'var(--muted-foreground)' }}>
                {payments.length === 0 ? 'No payment records yet' : 'No records match your search'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((p: any) => {
                const st = statusLabel(p.payment_status || 'pending');
                const isClassCode = !!p.class_code;
                return (
                  <div
                    key={p.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border-2 gap-3"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="mt-0.5 shrink-0">{statusIcon(p.payment_status || 'pending')}</div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate" style={{ color: 'var(--foreground)' }}>
                          {p.course_title || 'Unknown Course'}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <Badge
                            className="text-xs"
                            style={{
                              background: p.enrollment_type === 'academe_student' ? 'var(--accent-blue-50)' : 'var(--accent-gold-50)',
                              color: p.enrollment_type === 'academe_student' ? 'var(--royal-blue)' : 'var(--gold)'
                            }}
                          >
                            {enrollmentLabel(p.enrollment_type)}
                          </Badge>
                          {isClassCode && (
                            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                              Class Code: <span className="font-mono font-semibold">{p.class_code}</span>
                            </span>
                          )}
                          {p.payment_reference && (
                            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                              Ref: <span className="font-mono">{p.payment_reference}</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                          {p.enrolled_at ? new Date(p.enrolled_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="font-bold text-sm" style={{ color: 'var(--royal-blue)' }}>
                          {p.payment_amount ? `₱${Number(p.payment_amount).toLocaleString()}` : isClassCode ? 'Free (Class Code)' : '—'}
                        </p>
                        {p.payment_method && (
                          <p className="text-xs capitalize" style={{ color: 'var(--muted-foreground)' }}>
                            {p.payment_method.replace('_', ' ')}
                          </p>
                        )}
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${st.bg} ${st.text}`}>
                        {st.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
