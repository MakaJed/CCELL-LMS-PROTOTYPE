import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { GraduationCap, KeyRound, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import * as apiV2 from '../lib/api-v2';
import { useEnrollments } from '../../lib/EnrollmentContext';

interface JoinClassModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJoinSuccess?: (classCode: string) => void;
}

export function JoinClassModal({ open, onOpenChange, onJoinSuccess }: JoinClassModalProps) {
  const { refetch } = useEnrollments();
  const [classCode, setClassCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleJoin = async () => {
    if (!classCode.trim()) {
      toast.error('Please enter a class code');
      return;
    }

    setLoading(true);
    try {
      const result = await apiV2.Student.joinClass(classCode.trim());
      await refetch();

      setSuccess(true);
      toast.success(result.message || 'Successfully joined the class!', {
        description: `Enrolled in ${result.enrollment?.course_title || 'course'} — Section: ${result.enrollment?.section || 'N/A'}`,
      });

      onJoinSuccess?.(classCode.trim().toUpperCase());

      setTimeout(() => {
        setSuccess(false);
        setClassCode('');
        onOpenChange(false);
      }, 1500);
    } catch (error: any) {
      toast.error('Failed to join class', {
        description: error.message || 'Invalid or expired class code. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setClassCode('');
      setSuccess(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-[#1A237E] to-[#283593] rounded-xl flex items-center justify-center shrink-0">
              <GraduationCap className="h-6 w-6 text-[#FFB300]" />
            </div>
            <div>
              <DialogTitle className="text-[#1A237E]">Join a Class</DialogTitle>
              <DialogDescription>
                Enter your class code to enroll automatically
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-8 text-center"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-[#1A237E] mb-2">Welcome to the class!</h3>
            <p className="text-sm text-gray-600">
              You've been successfully enrolled and sorted into your section.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
              <p className="text-sm text-blue-900">
                <strong>How it works:</strong> Your class code will automatically enroll you in the course and sort you into the correct section based on your block.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="class-code" className="text-[#1A237E] font-semibold">
                Class Code
              </Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="class-code"
                  placeholder="e.g., COMP-1A-7X9Z"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleJoin();
                  }}
                  className="pl-10 uppercase tracking-wider font-mono"
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-gray-500">
                Enter the code provided by your instructor
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleJoin}
                disabled={loading || !classCode.trim()}
                className="flex-1 bg-gradient-to-r from-[#FFB300] to-[#FF8F00] hover:from-[#FFC107] hover:to-[#FFB300] text-[#1A237E] font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Join Class
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
