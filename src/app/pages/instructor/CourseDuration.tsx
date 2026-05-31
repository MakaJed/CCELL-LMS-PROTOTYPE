import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import {
  ArrowLeft,
  Clock,
  Save,
  AlertTriangle,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import * as apiV2 from '../../lib/api-v2';

export function InstructorCourseDuration() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<any>(null);
  const [durationWeeks, setDurationWeeks] = useState('');
  const [durationHours, setDurationHours] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [enrolledStudents, setEnrolledStudents] = useState(0);

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
      setDurationWeeks(String(result.course.duration_weeks || ''));
      setDurationHours(String(result.course.duration_hours || ''));

      // Load enrolled students count
      const countResult = await apiV2.Instructor.getEnrolledStudentsCount(courseId!);
      setEnrolledStudents(countResult.active_count);
    } catch (error: any) {
      console.error('Failed to load course:', error);
      toast.error('Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!durationWeeks || parseInt(durationWeeks) < 1) {
      toast.error('Please enter a valid duration in weeks');
      return;
    }

    if (enrolledStudents > 0) {
      setConfirmDialogOpen(true);
    } else {
      saveDuration();
    }
  };

  const saveDuration = async () => {
    setSaving(true);
    try {
      await apiV2.Instructor.updateCourse(courseId!, {
        duration_weeks: parseInt(durationWeeks),
        duration_hours: durationHours ? parseInt(durationHours) : undefined
      });

      toast.success('Course duration updated successfully!');
      setConfirmDialogOpen(false);
      navigate(`/instructor/courses/${courseId}/lessons`);
    } catch (error: any) {
      toast.error('Failed to update duration');
    } finally {
      setSaving(false);
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(`/instructor/courses/${courseId}/lessons`)}
          className="gap-2 mb-4"
          style={{ color: 'var(--royal-blue)' }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Course
        </Button>

        <div className="p-6 shadow-xl" style={{
          background: 'linear-gradient(to right, var(--royal-blue-darker), var(--royal-blue), var(--royal-blue-light))',
          borderRadius: 'var(--radius-xl)',
          borderBottom: '3px solid var(--gold)'
        }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center" style={{ background: 'var(--gold)', borderRadius: 'var(--radius-lg)' }}>
              <Clock className="h-6 w-6" style={{ color: 'var(--royal-blue)' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Course Duration Settings</h1>
              <p className="text-white/70">Modify the total duration for {course?.title}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <Card className="border-2 shadow-lg mb-6" style={{ borderColor: 'var(--royal-blue-light)', background: 'var(--accent-blue-50)' }}>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 mt-0.5" style={{ color: 'var(--royal-blue)' }} />
            <div>
              <p className="font-semibold mb-1" style={{ color: 'var(--royal-blue)' }}>Current Duration</p>
              <p className="text-sm" style={{ color: 'var(--royal-blue-light)' }}>
                This course is currently set to <strong>{course?.duration_weeks} weeks</strong>
                {course?.duration_hours && ` (${course.duration_hours} hours)`}.
                {enrolledStudents > 0 && ` There are ${enrolledStudents} students currently enrolled.`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Duration Settings */}
      <Card className="border-0 shadow-lg" style={{ background: 'var(--card)' }}>
        <CardHeader>
          <CardTitle style={{ color: 'var(--royal-blue)' }}>Update Duration</CardTitle>
          <CardDescription>Set the new course duration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="duration-weeks">Duration (Weeks) *</Label>
              <Input
                id="duration-weeks"
                type="number"
                min="1"
                value={durationWeeks}
                onChange={(e) => setDurationWeeks(e.target.value)}
                placeholder="e.g., 8"
                className="mt-2"
              />
              <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                Required. Minimum 1 week.
              </p>
            </div>

            <div>
              <Label htmlFor="duration-hours">Total Hours (Optional)</Label>
              <Input
                id="duration-hours"
                type="number"
                min="1"
                value={durationHours}
                onChange={(e) => setDurationHours(e.target.value)}
                placeholder="e.g., 40"
                className="mt-2"
              />
              <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                Optional. Total estimated hours for completion.
              </p>
            </div>
          </div>

          {enrolledStudents > 0 && (
            <div className="p-4 rounded-lg border-2" style={{ background: 'var(--accent-gold-50)', borderColor: 'var(--gold-light)' }}>
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 mt-0.5" style={{ color: 'var(--gold)' }} />
                <div>
                  <p className="font-semibold mb-1" style={{ color: 'var(--gold)' }}>Active Enrollments Warning</p>
                  <p className="text-sm" style={{ color: 'var(--gold-dark)' }}>
                    There are <strong>{enrolledStudents} students</strong> currently enrolled in this course.
                    Changing the duration will update their access timers. Students will be notified of this change.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => navigate(`/instructor/courses/${courseId}/lessons`)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="gap-2 text-white"
              style={{ background: 'var(--royal-blue)' }}
            >
              <Save className="h-4 w-4" />
              Save Duration
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--gold)' }}>
              Confirm Duration Change
            </DialogTitle>
            <DialogDescription>
              This will affect all enrolled students
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg" style={{ background: 'var(--accent-gold-50)' }}>
              <p className="text-sm" style={{ color: 'var(--gold-dark)' }}>
                You are changing the course duration from <strong>{course?.duration_weeks} weeks</strong> to <strong>{durationWeeks} weeks</strong>.
              </p>
              <p className="text-sm mt-2" style={{ color: 'var(--gold-dark)' }}>
                This will update the access timers for all <strong>{enrolledStudents} currently enrolled students</strong>.
              </p>
            </div>

            <div className="p-4 rounded-lg" style={{ background: 'var(--accent-blue-50)' }}>
              <p className="text-sm" style={{ color: 'var(--royal-blue)' }}>
                <strong>Note:</strong> Students will receive an email notification about this change, and their course expiration dates will be automatically adjusted.
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={saveDuration}
              disabled={saving}
              style={{ background: 'var(--gold)', color: 'var(--royal-blue)' }}
            >
              {saving ? 'Updating...' : 'Confirm Update'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
