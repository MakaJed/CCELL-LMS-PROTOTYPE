import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { FileText, ArrowLeft, CheckCircle, Clock, User, BookOpen, Calendar, Save } from 'lucide-react';
import { toast } from 'sonner';
import * as apiV2 from '../../lib/api-v2';

interface PendingEssay {
  id: string;
  question_text: string;
  answer_text: string;
  max_points: number;
  score?: number;
  feedback?: string;
  submitted_at: string;
  graded_at?: string;
  student: {
    id: string;
    full_name: string;
    email: string;
  };
  assessment: {
    id: string;
    title: string;
  };
  course: {
    id: string;
    title: string;
  };
}

export function GradeEssays() {
  const navigate = useNavigate();

  const [essays, setEssays] = useState<PendingEssay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEssay, setSelectedEssay] = useState<PendingEssay | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Grading form
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
      setEssays(result.essays || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load essays');
    } finally {
      setLoading(false);
    }
  };

  const openGradingDialog = (essay: PendingEssay) => {
    setSelectedEssay(essay);
    setScore(essay.score !== undefined ? String(essay.score) : '');
    setFeedback(essay.feedback || '');
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedEssay(null);
    setScore('');
    setFeedback('');
  };

  const handleGrade = async () => {
    if (!selectedEssay) return;

    const scoreValue = parseFloat(score);
    if (isNaN(scoreValue) || scoreValue < 0 || scoreValue > selectedEssay.max_points) {
      toast.error(`Score must be between 0 and ${selectedEssay.max_points}`);
      return;
    }

    setSubmitting(true);
    try {
      await apiV2.Instructor.gradeEssay(selectedEssay.id, {
        score: scoreValue,
        feedback: feedback.trim() || undefined,
      });

      toast.success('Essay graded successfully!');
      closeDialog();
      await loadPendingEssays();
    } catch (error: any) {
      toast.error(error.message || 'Failed to grade essay');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = essays.filter(e => e.score === undefined || e.score === null).length;
  const gradedCount = essays.filter(e => e.score !== undefined && e.score !== null).length;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#1A237E] border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading essays...</p>
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
          onClick={() => navigate('/instructor/dashboard')}
          className="gap-2 mb-4 text-[#1A237E] hover:bg-[#E8EAF6]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="bg-gradient-to-r from-[#090F2E] via-[#1A237E] to-[#283593] text-white p-6 rounded-2xl shadow-xl">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-6 w-6 text-[#FFB300]" />
            <h1 className="text-2xl font-bold">Grade Essay Submissions</h1>
          </div>
          <p className="text-blue-200/70 text-sm">
            Review and grade student essay responses
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-amber-200 bg-amber-50/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-700 font-medium">Pending</p>
                <p className="text-3xl font-bold text-amber-900">{pendingCount}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium">Graded</p>
                <p className="text-3xl font-bold text-green-900">{gradedCount}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-medium">Total</p>
                <p className="text-3xl font-bold text-blue-900">{essays.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Essays List */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-[#1A237E]">Essay Submissions</CardTitle>
          <CardDescription>
            Click on an essay to review and grade
          </CardDescription>
        </CardHeader>
        <CardContent>
          {essays.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium mb-1">No essay submissions yet</p>
              <p className="text-sm text-gray-400">
                Essay submissions will appear here when students complete assessments
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {essays.map((essay) => {
                const isGraded = essay.score !== undefined && essay.score !== null;

                return (
                  <Card
                    key={essay.id}
                    className={`border-2 cursor-pointer transition-all hover:shadow-md ${
                      isGraded
                        ? 'border-green-200 bg-green-50/20'
                        : 'border-amber-200 bg-amber-50/20'
                    }`}
                    onClick={() => openGradingDialog(essay)}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-4">
                        {/* Status Icon */}
                        <div className="shrink-0">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              isGraded
                                ? 'bg-green-100'
                                : 'bg-amber-100'
                            }`}
                          >
                            {isGraded ? (
                              <CheckCircle className="h-6 w-6 text-green-600" />
                            ) : (
                              <Clock className="h-6 w-6 text-amber-600" />
                            )}
                          </div>
                        </div>

                        {/* Essay Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1">
                              <Badge
                                className={
                                  isGraded
                                    ? 'bg-green-600 text-white mb-2'
                                    : 'bg-amber-600 text-white mb-2'
                                }
                              >
                                {isGraded ? 'Graded' : 'Pending'}
                              </Badge>
                              <h3 className="font-semibold text-[#1A237E] mb-1">
                                {essay.assessment.title}
                              </h3>
                              <p className="text-sm text-gray-600 mb-2">
                                {essay.course.title}
                              </p>
                            </div>
                            {isGraded && (
                              <div className="text-right">
                                <p className="text-2xl font-bold text-green-600">
                                  {essay.score}/{essay.max_points}
                                </p>
                                <p className="text-xs text-gray-500">points</p>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mb-3">
                            <div className="flex items-center gap-2 text-gray-600">
                              <User className="h-4 w-4" />
                              <span>{essay.student.full_name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {new Date(essay.submitted_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                          </div>

                          <details className="text-sm">
                            <summary className="cursor-pointer text-[#1A237E] font-medium hover:underline">
                              Question
                            </summary>
                            <p className="mt-2 p-3 bg-white border rounded-lg text-gray-700">
                              {essay.question_text}
                            </p>
                          </details>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grading Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedEssay && (
            <>
              <DialogHeader>
                <DialogTitle className="text-[#1A237E]">Grade Essay Submission</DialogTitle>
                <DialogDescription>
                  {selectedEssay.student.full_name} • {selectedEssay.assessment.title}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Course & Assessment Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm text-blue-900">
                    <BookOpen className="h-4 w-4" />
                    <span className="font-medium">{selectedEssay.course.title}</span>
                    <span className="text-blue-600">•</span>
                    <span>{selectedEssay.assessment.title}</span>
                  </div>
                </div>

                {/* Question */}
                <div>
                  <Label className="text-base font-semibold">Question</Label>
                  <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-gray-800">{selectedEssay.question_text}</p>
                  </div>
                </div>

                {/* Student Answer */}
                <div>
                  <Label className="text-base font-semibold">Student's Answer</Label>
                  <div className="mt-2 p-4 bg-white border-2 border-[#1A237E]/20 rounded-lg">
                    <p className="text-gray-800 whitespace-pre-wrap">
                      {selectedEssay.answer_text}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Submitted on{' '}
                    {new Date(selectedEssay.submitted_at).toLocaleString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold text-[#1A237E] mb-3">Grading</h3>

                  {/* Score */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label htmlFor="score">
                        Score * (Max: {selectedEssay.max_points} points)
                      </Label>
                      <Input
                        id="score"
                        type="number"
                        min="0"
                        max={selectedEssay.max_points}
                        step="0.5"
                        value={score}
                        onChange={(e) => setScore(e.target.value)}
                        placeholder={`0-${selectedEssay.max_points}`}
                        className="mt-1.5"
                      />
                    </div>
                    {score && (
                      <div className="flex items-end">
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg w-full">
                          <p className="text-sm text-blue-700 font-medium">Percentage</p>
                          <p className="text-2xl font-bold text-blue-900">
                            {((parseFloat(score) / selectedEssay.max_points) * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Feedback */}
                  <div>
                    <Label htmlFor="feedback">Feedback (Optional)</Label>
                    <Textarea
                      id="feedback"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Provide constructive feedback to help the student improve..."
                      rows={5}
                      className="mt-1.5"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This feedback will be shown to the student
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end border-t pt-4">
                <Button variant="outline" onClick={closeDialog} disabled={submitting}>
                  Cancel
                </Button>
                <Button
                  onClick={handleGrade}
                  disabled={submitting || !score}
                  className="gap-2 bg-[#1A237E] hover:bg-[#283593] text-white"
                >
                  <Save className="h-4 w-4" />
                  {submitting ? 'Saving...' : 'Submit Grade'}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
