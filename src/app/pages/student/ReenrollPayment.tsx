import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Badge } from '../../components/ui/badge';
import {
  ArrowLeft,
  CreditCard,
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';
import * as apiV2 from '../../lib/api-v2';

export function ReenrollPayment() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('gcash');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paymentProofUrl, setPaymentProofUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (courseId) {
      loadCourse();
    }
  }, [courseId]);

  const loadCourse = async () => {
    setLoading(true);
    try {
      const result = await apiV2.getCourse(courseId!);
      setCourse(result.course);
    } catch (error: any) {
      console.error('Failed to load course:', error);
      toast.error('Failed to load course');
      navigate('/student/my-courses');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setPaymentProof(file);

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPaymentProofUrl(url);
    }
  };

  const handleSubmit = async () => {
    if (!paymentReference.trim()) {
      toast.error('Please enter payment reference number');
      return;
    }

    if (!paymentProof) {
      toast.error('Please upload payment proof');
      return;
    }

    setSubmitting(true);
    try {
      // In real implementation, upload file to storage first
      // For now, we'll use a placeholder URL
      const proofUrl = paymentProofUrl; // Replace with actual upload URL

      await apiV2.Student.reenrollCourse({
        course_id: courseId!,
        payment_method: paymentMethod,
        payment_reference: paymentReference.trim(),
        payment_amount: course.price,
        payment_proof_url: proofUrl
      });

      toast.success('Re-enrollment request submitted! Awaiting admin approval.');
      navigate('/student/my-courses');
    } catch (error: any) {
      toast.error('Failed to submit payment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[var(--royal-blue)] border-r-transparent"></div>
          <p className="mt-4" style={{ color: 'var(--muted-foreground)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="border-2 border-red-200 bg-red-50">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 text-red-600" />
            <p className="text-red-900">Course not found</p>
            <Button onClick={() => navigate('/student/my-courses')} className="mt-4">
              Back to My Courses
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/student/my-courses')}
          className="gap-2 mb-4"
          style={{ color: 'var(--royal-blue)' }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Courses
        </Button>

        <div className="p-6 shadow-xl" style={{
          background: 'linear-gradient(to right, var(--royal-blue-darker), var(--royal-blue), var(--royal-blue-light))',
          borderRadius: 'var(--radius-xl)',
          borderBottom: '3px solid var(--gold)'
        }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center" style={{ background: 'var(--gold)', borderRadius: 'var(--radius-lg)' }}>
              <CreditCard className="h-6 w-6" style={{ color: 'var(--royal-blue)' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Re-enroll in Course</h1>
              <p className="text-white/70">Complete payment to regain access</p>
            </div>
          </div>
        </div>
      </div>

      {/* Course Info */}
      <Card className="border-0 shadow-lg mb-6" style={{ background: 'var(--card)' }}>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <img
              src={course.image || '/placeholder-course.jpg'}
              alt={course.title}
              className="w-32 h-24 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--royal-blue)' }}>
                {course.title}
              </h3>
              <p className="text-sm mb-2" style={{ color: 'var(--muted-foreground)' }}>
                by {course.instructor_name || 'Instructor'}
              </p>
              <div className="flex items-center gap-4">
                <Badge style={{ background: 'var(--accent-gold-50)', color: 'var(--gold)' }}>
                  Certificatory
                </Badge>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
                  <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    {course.duration_weeks} weeks access
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Course Price</p>
              <p className="text-3xl font-bold" style={{ color: 'var(--royal-blue)' }}>
                ₱{course.price?.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Banner */}
      <Card className="border-2 mb-6" style={{ borderColor: 'var(--royal-blue-light)', background: 'var(--accent-blue-50)' }}>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 mt-0.5" style={{ color: 'var(--royal-blue)' }} />
            <div>
              <p className="font-semibold mb-1" style={{ color: 'var(--royal-blue)' }}>
                Payment Verification Required
              </p>
              <ul className="text-sm space-y-1 list-disc list-inside" style={{ color: 'var(--royal-blue-light)' }}>
                <li>Your payment will be verified by our admin team</li>
                <li>Access will be restored once payment is approved</li>
                <li>You'll receive an email notification when approved</li>
                <li>Verification usually takes 1-2 business days</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Form */}
      <Card className="border-0 shadow-lg" style={{ background: 'var(--card)' }}>
        <CardHeader>
          <CardTitle style={{ color: 'var(--royal-blue)' }}>Payment Details</CardTitle>
          <CardDescription>Choose your payment method and upload proof</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Payment Method */}
          <div>
            <Label className="mb-3 block">Payment Method *</Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  paymentMethod === 'gcash' ? 'border-[var(--royal-blue)] bg-[var(--accent-blue-50)]' : 'border-[var(--border)]'
                }`}>
                  <RadioGroupItem value="gcash" id="gcash" />
                  <Label htmlFor="gcash" className="flex-1 cursor-pointer">
                    <span className="font-semibold">GCash</span>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      Mobile wallet payment
                    </p>
                  </Label>
                </div>

                <div className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  paymentMethod === 'bank' ? 'border-[var(--royal-blue)] bg-[var(--accent-blue-50)]' : 'border-[var(--border)]'
                }`}>
                  <RadioGroupItem value="bank" id="bank" />
                  <Label htmlFor="bank" className="flex-1 cursor-pointer">
                    <span className="font-semibold">Bank Transfer</span>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      Direct bank deposit
                    </p>
                  </Label>
                </div>

                <div className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  paymentMethod === 'paymaya' ? 'border-[var(--royal-blue)] bg-[var(--accent-blue-50)]' : 'border-[var(--border)]'
                }`}>
                  <RadioGroupItem value="paymaya" id="paymaya" />
                  <Label htmlFor="paymaya" className="flex-1 cursor-pointer">
                    <span className="font-semibold">PayMaya</span>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      Digital wallet
                    </p>
                  </Label>
                </div>

                <div className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  paymentMethod === 'card' ? 'border-[var(--royal-blue)] bg-[var(--accent-blue-50)]' : 'border-[var(--border)]'
                }`}>
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card" className="flex-1 cursor-pointer">
                    <span className="font-semibold">Credit/Debit Card</span>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      Visa, Mastercard
                    </p>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Reference Number */}
          <div>
            <Label htmlFor="reference">Payment Reference Number *</Label>
            <Input
              id="reference"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              placeholder="Enter your transaction/reference number"
              className="mt-2"
            />
            <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
              This can be found in your payment confirmation receipt
            </p>
          </div>

          {/* Payment Proof */}
          <div>
            <Label htmlFor="proof">Payment Proof (Screenshot/Receipt) *</Label>
            <div className="mt-2">
              <input
                id="proof"
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="proof"
                className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer hover:bg-[var(--accent-blue-50)] transition-colors"
                style={{ borderColor: 'var(--border)' }}
              >
                {paymentProofUrl ? (
                  <div className="text-center">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-600" />
                    <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                      File uploaded: {paymentProof?.name}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                      Click to change file
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="h-12 w-12 mx-auto mb-2" style={{ color: 'var(--muted-foreground)' }} />
                    <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                      Click to upload file
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                      PNG, JPG, PDF up to 5MB
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Security Note */}
          <div className="p-4 rounded-lg" style={{ background: 'var(--accent-green-50)' }}>
            <div className="flex items-start gap-2">
              <Shield className="h-5 w-5 mt-0.5 text-green-600" />
              <div>
                <p className="font-semibold text-sm text-green-900 mb-1">Secure Payment</p>
                <p className="text-xs text-green-700">
                  Your payment information is securely processed. We never store your card details.
                </p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 justify-end pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <Button
              variant="outline"
              onClick={() => navigate('/student/my-courses')}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !paymentReference.trim() || !paymentProof}
              className="gap-2"
              style={{ background: 'var(--royal-blue)', color: 'white' }}
            >
              <CreditCard className="h-4 w-4" />
              {submitting ? 'Submitting...' : 'Submit Payment'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
