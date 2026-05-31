import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { CheckCircle, CreditCard, Smartphone, Building2, Upload, ArrowRight, ArrowLeft, ShieldCheck, Loader2, GraduationCap, Users } from 'lucide-react';
import { useEnrollments } from '../../lib/EnrollmentContext';
import { toast } from 'sonner';
import * as apiV2 from '../lib/api-v2';
import type { EnrollmentType } from '../../types/database';

type PaymentMethod = 'gcash' | 'bank' | 'paymaya' | 'counter';
type Step = 'enrollment-type' | 'payment-method' | 'details' | 'confirm' | 'success';

interface CourseSummary {
  id: string;
  title: string;
  image: string;
  instructor: string;
  duration: string;
  price: number;
  courseType: 'academe' | 'certificatory';
}

interface EnrollmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: CourseSummary;
  onEnroll: () => void;
}

const paymentMethods: { id: PaymentMethod; name: string; icon: React.ReactNode; description: string; color: string }[] = [
  { id: 'gcash', name: 'GCash', icon: <Smartphone className="h-6 w-6" />, description: 'Pay via GCash e-wallet', color: 'bg-blue-500' },
  { id: 'bank', name: 'Bank Transfer', icon: <Building2 className="h-6 w-6" />, description: 'Direct bank deposit or transfer', color: 'bg-green-600' },
  { id: 'paymaya', name: 'PayMaya', icon: <CreditCard className="h-6 w-6" />, description: 'Pay via PayMaya e-wallet', color: 'bg-emerald-500' },
  { id: 'counter', name: 'Over-the-Counter', icon: <Building2 className="h-6 w-6" />, description: 'Pay at LNU cashier', color: 'bg-amber-600' },
];

export function EnrollmentModal({ open, onOpenChange, course, onEnroll }: EnrollmentModalProps) {
  const { refetch } = useEnrollments();
  const [step, setStep] = useState<Step>('enrollment-type');
  const [enrollmentType, setEnrollmentType] = useState<EnrollmentType | null>(null);
  const [classCode, setClassCode] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleReset = () => {
    setStep('enrollment-type');
    setEnrollmentType(null);
    setClassCode('');
    setSelectedMethod(null);
    setReferenceNumber('');
    setNotes('');
    setProcessing(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(handleReset, 300);
  };

  const handleSubmitEnrollment = async () => {
    setProcessing(true);
    try {
      let result;

      if (enrollmentType === 'certificatory') {
        result = await apiV2.enrollInCourse({
          course_id: course.id,
          enrollment_type: 'certificatory',
          payment_method: selectedMethod || 'gcash',
          payment_reference: referenceNumber || undefined,
          payment_amount: course.price,
        });
      } else if (enrollmentType === 'academe_student') {
        result = await apiV2.enrollInCourse({
          course_id: course.id,
          enrollment_type: 'academe_student',
          class_code: classCode,
        });
      } else if (enrollmentType === 'academe_paid') {
        result = await apiV2.enrollInCourse({
          course_id: course.id,
          enrollment_type: 'academe_paid',
          payment_method: selectedMethod || 'gcash',
          payment_reference: referenceNumber || undefined,
          payment_amount: course.price,
        });
      }

      setStep('success');
      onEnroll();

      // Refetch enrollments to update context
      await refetch();

      const statusMsg = enrollmentType === 'academe_student'
        ? 'You\'re now enrolled and can start learning!'
        : 'Your payment is being verified. You have immediate access!';

      toast.success('Enrollment Successful!', {
        description: statusMsg,
      });
    } catch (err: any) {
      console.error('Enrollment API error:', err);
      toast.error('Enrollment Failed', {
        description: err.message || 'Please check your details and try again.',
      });
      setProcessing(false);
    } finally {
      if (step === 'success') {
        setProcessing(false);
      }
    }
  };

  const selectedMethodInfo = paymentMethods.find(m => m.id === selectedMethod);
  const isEnrollmentOpen = true;

  // Auto-select enrollment type for certificatory courses
  useEffect(() => {
    if (open && course.courseType === 'certificatory') {
      setEnrollmentType('certificatory');
    }
  }, [open, course.courseType]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        {step === 'enrollment-type' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-blue-950 text-xl">
                {course.courseType === 'certificatory' ? 'Enroll in Course' : 'Choose Enrollment Type'}
              </DialogTitle>
              <DialogDescription>
                {course.courseType === 'certificatory'
                  ? <>Pay to enroll in <span className="font-semibold">{course.title}</span></>
                  : <>Select how you'd like to enroll in <span className="font-semibold">{course.title}</span></>
                }
              </DialogDescription>
            </DialogHeader>

            {/* Course Summary */}
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-amber-50 rounded-xl border border-blue-200">
              <img src={course.image} alt={course.title} className="w-16 h-16 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-blue-950 truncate">{course.title}</p>
                <p className="text-sm text-gray-600">{course.instructor} • {course.duration}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-bold text-blue-900">₱{course.price.toLocaleString()}</p>
              </div>
            </div>

            {/* Enrollment Type Options */}
            <div className="space-y-4 mt-2">
              {/* For Academe Course: Show Class Code Option */}
              {course.courseType === 'academe' && (
                <div className="space-y-2">
                  <Label htmlFor="class-code-input" className="text-base font-semibold text-gray-700">
                    Do you have a class code?
                  </Label>
                  <Input
                    id="class-code-input"
                    placeholder="Enter your class code"
                    value={classCode}
                    onChange={(e) => setClassCode(e.target.value)}
                    className="font-mono text-base"
                  />
                  <p className="text-xs text-gray-600">
                    If you have a class code from your instructor, enter it above
                  </p>
                </div>
              )}

              {/* Divider */}
              {course.courseType === 'academe' && (
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">or</span>
                  </div>
                </div>
              )}

              {/* Payment Option */}
              <div className="space-y-3">
                <p className="text-base font-semibold text-gray-700">Pay for this course</p>
                <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-700">Course Price:</span>
                    <span className="text-3xl font-bold text-blue-900">₱{course.price.toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    One-time payment for {course.duration} of access
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              {/* If Academe course and has class code, show Continue with Class Code button */}
              {course.courseType === 'academe' && classCode.trim() && (
                <Button
                  onClick={() => {
                    setEnrollmentType('academe_student');
                    setStep('confirm');
                  }}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white gap-2"
                  size="lg"
                >
                  Continue with Class Code
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}

              {/* Pay Button - always visible */}
              <Button
                onClick={() => {
                  if (course.courseType === 'certificatory') {
                    setEnrollmentType('certificatory');
                  } else {
                    setEnrollmentType('academe_paid');
                  }
                  setStep('payment-method');
                }}
                className={`bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-800 hover:to-blue-700 text-white gap-2 ${
                  course.courseType === 'academe' && classCode.trim() ? 'flex-1' : 'w-full'
                }`}
                size="lg"
              >
                <CreditCard className="h-4 w-4" />
                {course.courseType === 'academe' && classCode.trim() ? 'Pay Instead' : 'Continue to Payment'}
              </Button>
            </div>
          </>
        )}

        {step === 'payment-method' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-blue-950 text-xl">Select Payment Method</DialogTitle>
              <DialogDescription>
                Choose how you'd like to pay for {course.title}
              </DialogDescription>
            </DialogHeader>

            {!isEnrollmentOpen && (
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-red-900">Enrollment Closed</p>
                    <p className="text-sm text-red-700 mt-1">
                      The enrollment period for this course has ended. Contact your instructor to reopen enrollment.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3 mt-2">
              <p className="text-sm font-semibold text-gray-700">Select Payment Method</p>
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                    selectedMethod === method.id
                      ? 'border-blue-900 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-12 h-12 ${method.color} rounded-xl flex items-center justify-center text-white shrink-0`}>
                    {method.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-blue-950">{method.name}</p>
                    <p className="text-sm text-gray-600">{method.description}</p>
                  </div>
                  {selectedMethod === method.id && (
                    <CheckCircle className="h-6 w-6 text-blue-900 shrink-0" />
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-3 mt-2">
              <Button variant="outline" onClick={() => setStep('enrollment-type')} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={() => setStep('details')}
                disabled={!selectedMethod || !isEnrollmentOpen}
                className="flex-1 bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-800 hover:to-blue-700 text-white gap-2"
                size="lg"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}

        {step === 'details' && selectedMethodInfo && (
          <>
            <DialogHeader>
              <DialogTitle className="text-blue-950 text-xl">Payment Details</DialogTitle>
              <DialogDescription>
                Complete your {selectedMethodInfo.name} payment
              </DialogDescription>
            </DialogHeader>

            <Card className="border-2 border-amber-200 bg-amber-50">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 ${selectedMethodInfo.color} rounded-lg flex items-center justify-center text-white shrink-0`}>
                    {selectedMethodInfo.icon}
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold text-amber-900 mb-2">Payment Instructions</p>
                    {selectedMethod === 'gcash' && (
                      <div className="text-amber-800 space-y-1">
                        <p>1. Open your GCash app</p>
                        <p>2. Send payment to: <span className="font-bold">0917-123-4567</span></p>
                        <p>3. Amount: <span className="font-bold">₱{course.price.toLocaleString()}</span></p>
                        <p>4. Enter the reference number below</p>
                      </div>
                    )}
                    {selectedMethod === 'bank' && (
                      <div className="text-amber-800 space-y-1">
                        <p>1. Transfer to: <span className="font-bold">BPI Account #1234-5678-90</span></p>
                        <p>2. Account Name: <span className="font-bold">CCELL-LNU</span></p>
                        <p>3. Amount: <span className="font-bold">₱{course.price.toLocaleString()}</span></p>
                        <p>4. Enter the transaction reference number below</p>
                      </div>
                    )}
                    {selectedMethod === 'paymaya' && (
                      <div className="text-amber-800 space-y-1">
                        <p>1. Open your PayMaya app</p>
                        <p>2. Send payment to: <span className="font-bold">0918-987-6543</span></p>
                        <p>3. Amount: <span className="font-bold">₱{course.price.toLocaleString()}</span></p>
                        <p>4. Enter the reference number below</p>
                      </div>
                    )}
                    {selectedMethod === 'counter' && (
                      <div className="text-amber-800 space-y-1">
                        <p>1. Visit the LNU Cashier at the Administration Building</p>
                        <p>2. Present Course ID: <span className="font-bold">{course.id}</span></p>
                        <p>3. Pay: <span className="font-bold">₱{course.price.toLocaleString()}</span></p>
                        <p>4. Enter the Official Receipt (OR) number below</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="reference">
                  {selectedMethod === 'counter' ? 'Official Receipt Number' : 'Reference / Transaction Number'} *
                </Label>
                <Input
                  id="reference"
                  placeholder={selectedMethod === 'counter' ? 'e.g., OR-2026-001234' : 'e.g., TXN123456789'}
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional information about your payment..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Upload className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-800">
                  Screenshot of payment proof is optional but helps speed up verification. Upload support coming soon.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-2">
              <Button variant="outline" onClick={() => setStep('payment-method')} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={() => setStep('confirm')}
                disabled={!referenceNumber.trim()}
                className="flex-1 bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-800 hover:to-blue-700 text-white gap-2"
              >
                Review Payment
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}

        {step === 'confirm' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-blue-950 text-xl">Confirm Enrollment</DialogTitle>
              <DialogDescription>
                {enrollmentType === 'academe_student'
                  ? 'Review your enrollment details before submitting'
                  : 'Review your payment details before submitting'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Card className="border-2 border-blue-200">
                <CardContent className="pt-4 pb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Course</span>
                    <span className="font-semibold text-blue-950 text-right text-sm max-w-[60%] truncate">{course.title}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Duration</span>
                    <span className="font-medium">{course.duration}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Enrollment Method</span>
                    <span className="font-semibold text-blue-950">
                      {enrollmentType === 'academe_student' ? 'Class Code' : 'Payment'}
                    </span>
                  </div>

                  {enrollmentType === 'academe_student' ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Class Code</span>
                        <span className="font-mono font-semibold text-green-900">{classCode}</span>
                      </div>
                      <div className="border-t pt-3 flex items-center justify-between">
                        <span className="font-semibold text-blue-950">Total</span>
                        <span className="text-2xl font-bold text-green-600">FREE</span>
                      </div>
                    </>
                  ) : selectedMethodInfo && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Payment Method</span>
                        <Badge className={`${selectedMethodInfo.color} text-white`}>{selectedMethodInfo.name}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Reference Number</span>
                        <span className="font-mono font-semibold text-blue-900">{referenceNumber}</span>
                      </div>
                      {notes && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Notes</span>
                          <span className="text-sm text-right max-w-[60%] truncate">{notes}</span>
                        </div>
                      )}
                      <div className="border-t pt-3 flex items-center justify-between">
                        <span className="font-semibold text-blue-950">Total</span>
                        <span className="text-2xl font-bold text-blue-900">₱{course.price.toLocaleString()}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <div className={`flex items-start gap-2 p-3 rounded-lg border ${
                enrollmentType === 'academe_student' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'
              }`}>
                <ShieldCheck className={`h-5 w-5 mt-0.5 shrink-0 ${
                  enrollmentType === 'academe_student' ? 'text-green-600' : 'text-blue-600'
                }`} />
                <div className={`text-xs ${
                  enrollmentType === 'academe_student' ? 'text-green-800' : 'text-blue-800'
                }`}>
                  {enrollmentType === 'academe_student' ? (
                    <>
                      <p className="font-semibold mb-1">Free Class Enrollment</p>
                      <p>Your class code will be validated and you'll get immediate access to start learning with your section.</p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold mb-1">Secure Payment Verification</p>
                      <p>Your payment will be verified by an admin within 24 hours. You'll get immediate access to the course while verification is in progress.</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-2">
              <Button variant="outline" onClick={() => {
                if (enrollmentType === 'academe_student') {
                  setStep('enrollment-type');
                } else {
                  setStep('details');
                }
              }} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleSubmitEnrollment}
                disabled={processing}
                className={`flex-1 bg-gradient-to-r gap-2 shadow-lg text-white border-2 ${
                  enrollmentType === 'academe_student'
                    ? 'from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 border-green-400'
                    : 'from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 border-amber-400'
                }`}
                size="lg"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Confirm & Enroll
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {step === 'success' && (
          <div className="text-center py-4">
            <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-blue-950 mb-2">Enrollment Successful! 🎉</h2>
            <p className="text-gray-600 mb-6">
              You're now enrolled in <span className="font-semibold">{course.title}</span>.
              {enrollmentType === 'academe_student'
                ? ' You can start learning immediately!'
                : ' Your payment receipt has been submitted. An admin will verify it within 24 hours — you\'ll gain full access once confirmed.'}
            </p>

            <div className="bg-gradient-to-r from-blue-50 to-amber-50 rounded-xl p-4 mb-6 border border-blue-200">
              {enrollmentType === 'academe_student' ? (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-gray-600">Enrollment Method</p>
                    <p className="font-semibold text-green-900 mt-1">Class Code</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600">Course Access</p>
                    <p className="font-semibold text-green-900 mt-1">Active</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-gray-600">Payment Status</p>
                    <p className="font-semibold text-amber-700 mt-1">Pending Verification</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600">Course Access</p>
                    <p className="font-semibold text-amber-700 mt-1">Locked</p>
                  </div>
                </div>
              )}
            </div>

            {enrollmentType !== 'academe_student' && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4 text-left">
                <ShieldCheck className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-800">An admin will review your payment receipt. You will receive access to the course once it is confirmed.</p>
              </div>
            )}

            <div className="flex gap-3">
              {enrollmentType === 'academe_student' ? (
                <>
                  <Button variant="outline" onClick={handleClose} className="flex-1">Back to Course</Button>
                  <Button onClick={handleClose} className="flex-1 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white">
                    Start Learning
                  </Button>
                </>
              ) : (
                <Button onClick={handleClose} className="w-full" style={{ background: 'var(--royal-blue)', color: 'white' }}>
                  Close
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
