import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import {
  FileText,
  CheckCircle,
  ArrowLeft,
  Save,
  X,
  User,
  BookOpen,
  Clock,
  Award
} from 'lucide-react';
import { toast } from 'sonner';
import * as apiV2 from '../../lib/api-v2';

export function InstructorGrading() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [essays, setEssays] = useState<any[]>([]);
  const [selectedEssay, setSelectedEssay] = useState<any | null>(null);
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPendingEssays();
  }, []);

  const loadPendingEssays = async () => {
    setLoading(true);
    try {
      const result = await apiV2.Instructor.getPendingEssays();
      setEssays((result.essays || []).filter((e: any) => e.class_code).map((e: any) => ({
        id: e.id,
        studentName: e.student_name || 'Unknown Student',
        studentEmail: e.student_email || '',
        courseName: e.course_title || 'Unknown Course',
        quizTitle: e.quiz_title || '',
        questionText: e.question_text || '',
        answer: e.answer_text || '',
        submittedAt: e.submitted_at || '',
        maxScore: e.max_points || 10,
        classCode: e.class_code || '',
        score: e.score,
        feedback: e.feedback,
        isGraded: e.is_graded,
      })));
    } catch (error: any) {
      console.error('Failed to load essays:', error);
      toast.error('Failed to load essays');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenGrading = (essay: any) => {
    setSelectedEssay(essay);
    setScore('');
    setFeedback('');
    setGradeDialogOpen(true);
  };

  const handleSubmitGrade = async () => {
    if (!score || parseFloat(score) < 0 || parseFloat(score) > selectedEssay.maxScore) {
      toast.error(`Score must be between 0 and ${selectedEssay.maxScore}`);
      return;
    }

    setSubmitting(true);
    try {
      await apiV2.Instructor.gradeEssay(selectedEssay.id, {
        score: parseFloat(score),
        feedback: feedback || undefined,
      });
      toast.success('Grade submitted successfully!');
      setGradeDialogOpen(false);
      setSelectedEssay(null);
      await loadPendingEssays();
    } catch (error: any) {
      toast.error('Failed to submit grade');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[var(--royal-blue)] border-r-transparent"></div>
          <p className="mt-4" style={{ color: 'var(--muted-foreground)' }}>Loading essays...</p>
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
            <div className="w-12 h-12 flex items-center justify-center" style={{ background: 'var(--gold)', borderRadius: 'var(--radius-lg)' }}>
              <FileText className="h-6 w-6" style={{ color: 'var(--royal-blue)' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Grading & Assessments</h1>
              <p className="text-white/70">Review and grade Class Code student essays</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <Card className="border-0 shadow-lg mb-6" style={{ background: 'var(--accent-blue-50)' }}>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 mt-0.5" style={{ color: 'var(--royal-blue)' }} />
            <div>
              <p className="font-semibold mb-1" style={{ color: 'var(--royal-blue)' }}>Class Code Students Only</p>
              <p className="text-sm" style={{ color: 'var(--royal-blue-light)' }}>
                Essays from paid students are automatically excluded from grading. You only need to review and grade essays from students enrolled via class codes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Essays */}
      <Card className="border-0 shadow-lg" style={{ background: 'var(--card)' }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle style={{ color: 'var(--royal-blue)' }}>Pending Essay Reviews</CardTitle>
              <CardDescription>
                {essays.length} essay{essays.length !== 1 ? 's' : ''} waiting for your review
              </CardDescription>
            </div>
            <Badge className="text-lg px-4 py-1" style={{ background: 'var(--gold)', color: 'var(--royal-blue)' }}>
              {essays.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {essays.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
              <p className="font-semibold" style={{ color: 'var(--foreground)' }}>All caught up!</p>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No essays pending review</p>
            </div>
          ) : (
            <div className="space-y-4">
              {essays.map(essay => (
                <div key={essay.id} className="border-2 p-4 hover:shadow-md transition-all" style={{ borderColor: 'var(--border)', borderRadius: 'var(--radius-lg)' }}>
                  {/* Student Info */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 flex items-center justify-center" style={{ background: 'var(--accent-blue-50)', borderRadius: 'var(--radius-lg)' }}>
                        <User className="h-5 w-5" style={{ color: 'var(--royal-blue)' }} />
                      </div>
                      <div>
                        <p className="font-semibold" style={{ color: 'var(--foreground)' }}>{essay.studentName}</p>
                        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{essay.studentEmail}</p>
                      </div>
                    </div>
                    <Badge style={{ background: 'var(--accent-blue-50)', color: 'var(--royal-blue)' }}>
                      {essay.classCode}
                    </Badge>
                  </div>

                  {/* Course & Lesson Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 text-sm">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
                      <div>
                        <p style={{ color: 'var(--muted-foreground)' }}>Course</p>
                        <p className="font-medium" style={{ color: 'var(--foreground)' }}>{essay.courseName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
                      <div>
                        <p style={{ color: 'var(--muted-foreground)' }}>Lesson</p>
                        <p className="font-medium" style={{ color: 'var(--foreground)' }}>{essay.lessonName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
                      <div>
                        <p style={{ color: 'var(--muted-foreground)' }}>Submitted</p>
                        <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                          {new Date(essay.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Question */}
                  <div className="mb-3 p-3 rounded-lg" style={{ background: 'var(--muted)' }}>
                    <p className="text-sm font-semibold mb-1" style={{ color: 'var(--foreground)' }}>Question:</p>
                    <p className="text-sm" style={{ color: 'var(--foreground)' }}>{essay.questionText}</p>
                  </div>

                  {/* Answer Preview */}
                  <div className="mb-3 p-3 rounded-lg" style={{ background: 'var(--card)' }}>
                    <p className="text-sm font-semibold mb-1" style={{ color: 'var(--foreground)' }}>Student Answer:</p>
                    <p className="text-sm line-clamp-3" style={{ color: 'var(--muted-foreground)' }}>{essay.answer}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4" style={{ color: 'var(--gold)' }} />
                      <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                        Max Score: <span className="font-semibold" style={{ color: 'var(--gold)' }}>{essay.maxScore}</span>
                      </span>
                    </div>
                    <Button className="gap-2" style={{ background: 'var(--royal-blue)', color: 'white' }} onClick={() => handleOpenGrading(essay)}>
                      Grade Essay
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grading Dialog */}
      <Dialog open={gradeDialogOpen} onOpenChange={setGradeDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--royal-blue)' }}>Grade Essay</DialogTitle>
            <DialogDescription>
              Review the student's answer and provide a score and feedback
            </DialogDescription>
          </DialogHeader>

          {selectedEssay && (
            <div className="space-y-4 py-4">
              {/* Student Info */}
              <div className="p-4 rounded-lg" style={{ background: 'var(--accent-blue-50)' }}>
                <p className="font-semibold" style={{ color: 'var(--royal-blue)' }}>{selectedEssay.studentName}</p>
                <p className="text-sm" style={{ color: 'var(--royal-blue-light)' }}>{selectedEssay.studentEmail}</p>
                <p className="text-sm mt-1" style={{ color: 'var(--royal-blue-light)' }}>
                  {selectedEssay.courseName} • {selectedEssay.lessonName}
                </p>
              </div>

              {/* Question */}
              <div>
                <Label className="font-semibold">Question</Label>
                <div className="mt-2 p-3 rounded-lg" style={{ background: 'var(--muted)' }}>
                  <p style={{ color: 'var(--foreground)' }}>{selectedEssay.questionText}</p>
                </div>
              </div>

              {/* Answer */}
              <div>
                <Label className="font-semibold">Student Answer</Label>
                <div className="mt-2 p-3 rounded-lg" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                  <p style={{ color: 'var(--foreground)' }}>{selectedEssay.answer}</p>
                </div>
              </div>

              {/* Score Input */}
              <div>
                <Label htmlFor="score">
                  Score (out of {selectedEssay.maxScore}) *
                </Label>
                <Input
                  id="score"
                  type="number"
                  min="0"
                  max={selectedEssay.maxScore}
                  step="0.5"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  className="mt-2"
                  placeholder={`Enter score (0-${selectedEssay.maxScore})`}
                />
              </div>

              {/* Feedback */}
              <div>
                <Label htmlFor="feedback">Feedback (optional)</Label>
                <Textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="mt-2"
                  rows={4}
                  placeholder="Provide constructive feedback to help the student improve..."
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setGradeDialogOpen(false);
                setSelectedEssay(null);
              }}
              disabled={submitting}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSubmitGrade}
              disabled={submitting || !score}
              style={{ background: 'var(--royal-blue)', color: 'white' }}
            >
              <Save className="h-4 w-4 mr-2" />
              {submitting ? 'Saving...' : 'Submit Grade'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
