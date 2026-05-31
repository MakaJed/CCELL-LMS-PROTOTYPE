import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '../ui/dialog';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import {
  AlertTriangle, CheckCircle, XCircle, Clock, Award,
  FileText, ChevronLeft, ChevronRight, BookOpen, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import * as apiV2 from '../../lib/api-v2';

interface AssessmentPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessment: any;
  assessmentType: 'pre_test' | 'post_test' | 'final_assessment';
  enrollmentId: string;
  enrollmentType: 'academe_student' | 'certificatory' | 'academe_paid';
  onComplete: (passed: boolean, score: number) => void;
}

export function AssessmentPopup({
  open, onOpenChange, assessment, assessmentType,
  enrollmentId, enrollmentType, onComplete
}: AssessmentPopupProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [questionResults, setQuestionResults] = useState<any[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showWarning, setShowWarning] = useState(true);
  const [flashedItems, setFlashedItems] = useState<Set<string>>(new Set());

  const handleSubmitRef = useRef<(fromTimer?: boolean) => void>(() => {});

  useEffect(() => {
    if (open && assessment) {
      setCurrentQuestion(0);
      setAnswers({});
      setShowResult(false);
      setShowReview(false);
      setResult(null);
      setQuestionResults([]);
      setShowWarning(true);
      setFlashedItems(new Set());
      setTimeRemaining(assessment.time_limit_minutes ? assessment.time_limit_minutes * 60 : null);
    }
  }, [open, assessment]);

  useEffect(() => {
    handleSubmitRef.current = (fromTimer = false) => handleSubmit(fromTimer);
  });

  useEffect(() => {
    if (timeRemaining === null || showResult) return;
    if (timeRemaining <= 0) {
      handleSubmitRef.current(true);
      return;
    }
    const t = setTimeout(() => setTimeRemaining(prev => prev !== null ? prev - 1 : null), 1000);
    return () => clearTimeout(t);
  }, [timeRemaining, showResult]);

  if (!assessment || !open) return null;

  const questions = assessment.questions || [];
  const question = questions[currentQuestion];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const passingScore = assessment.passing_score_percentage || assessment.passing_score || 70;

  const getTypeLabel = () =>
    assessmentType === 'pre_test' ? 'Pre-Test' :
    assessmentType === 'post_test' ? 'Post-Test' : 'Final Assessment';

  const getColors = () => {
    if (assessmentType === 'pre_test') return { bg: '#F59E0B', text: '#1A237E', lightBg: '#FFFBEB', border: '#F59E0B' };
    if (assessmentType === 'post_test') return { bg: '#1A237E', text: 'white', lightBg: 'var(--accent-blue-50)', border: '#1A237E' };
    return { bg: '#7C3AED', text: 'white', lightBg: '#F5F3FF', border: '#7C3AED' };
  };
  const colors = getColors();

  const getRetakeInfo = () => {
    if (assessmentType === 'pre_test') return 'Baseline check — one attempt only';
    const maxRetakes = assessment.max_retakes ?? assessment.max_retake_attempts ?? 3;
    const maxTotal = assessment.max_total_attempts ?? (maxRetakes + 1);
    const used = assessment.attempt_number ?? 0;
    return `Retakes Used: ${used}/${maxTotal}`;
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const handleSubmit = async (fromTimer = false) => {
    if (submitting) return;
    const objectiveQs = questions.filter((q: any) => q.type !== 'essay');
    if (!fromTimer && objectiveQs.some((q: any) => !answers[q.id])) {
      toast.error('Please answer all questions before submitting');
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiV2.submitAssessment({
        assessment_id: assessment.id,
        enrollment_id: enrollmentId,
        answers,
        time_taken_seconds: assessment.time_limit_minutes && timeRemaining !== null
          ? (assessment.time_limit_minutes * 60) - timeRemaining : undefined
      });
      setResult(res.attempt);
      const qr = res.question_results || [];
      setQuestionResults(qr);
      // Trigger flash animation for each question
      const ids = new Set<string>(qr.map((r: any) => r.id));
      setFlashedItems(ids);
      setShowResult(true);
      if (assessmentType === 'pre_test') {
        toast.info(`Baseline recorded: ${res.attempt.score}%`);
      } else {
        const passed = res.attempt.score >= passingScore;
        if (passed) toast.success(`Passed! Score: ${res.attempt.score}%`);
        else toast.error(`Score: ${res.attempt.score}% — Need ${passingScore}% to pass`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (showResult && result) {
      const passed = assessmentType === 'pre_test' ? true : result.score >= passingScore;
      onComplete(passed, result.score);
    }
    onOpenChange(false);
  };

  // ── Per-Question Review View ─────────────────────────────────────────────────
  if (showResult && result && showReview) {
    const isPre = assessmentType === 'pre_test';
    const objectiveResults = questionResults.filter((r: any) => r.type !== 'essay');
    const objQuestions = questions.filter((q: any) => q.type !== 'essay');
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl w-full max-h-[90vh] p-0 overflow-hidden flex flex-col gap-0">
          <div className="px-6 py-4 border-b shrink-0 flex items-center justify-between"
            style={{ background: 'var(--accent-blue-50)' }}>
            <div>
              <p className="font-bold text-sm" style={{ color: 'var(--royal-blue)' }}>Answer Review — {assessment.title}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                Score: {result.score}% · {objectiveResults.filter((r: any) => r.is_correct).length}/{objectiveResults.length} correct
              </p>
            </div>
            <Badge style={{ background: result.score >= passingScore || isPre ? '#16a34a20' : '#dc262620', color: result.score >= passingScore || isPre ? '#16a34a' : '#dc2626' }}>
              {isPre ? 'Baseline' : result.score >= passingScore ? 'Passed' : 'Failed'}
            </Badge>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {objQuestions.map((q: any, idx: number) => {
              const qResult = objectiveResults.find((r: any) => r.id === q.id);
              const isCorrect = qResult?.is_correct;
              const studentAnswer = answers[q.id];
              const isIdentification = q.type === 'identification';
              const isFlashed = flashedItems.has(q.id);
              return (
                <div key={q.id}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    isCorrect
                      ? 'border-green-400 bg-green-50'
                      : 'border-red-400 bg-red-50'
                  } ${isFlashed ? (isCorrect ? 'animate-flash-green' : 'animate-flash-red') : ''}`}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${
                      isCorrect ? 'bg-green-500' : 'bg-red-500'
                    }`}>{idx + 1}</div>
                    <p className="font-semibold text-sm leading-snug flex-1" style={{ color: 'var(--foreground)' }}>{q.question}</p>
                    {isCorrect
                      ? <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                      : <XCircle className="h-5 w-5 text-red-500 shrink-0" />}
                  </div>
                  <div className="ml-10 space-y-1.5">
                    {isIdentification ? (
                      <div className={`text-sm px-3 py-2 rounded-lg font-medium border-2 ${
                        isCorrect
                          ? 'border-green-400 bg-green-50 text-green-800'
                          : 'border-red-400 bg-red-50 text-red-800'
                      }`}>
                        Your answer: <span className="font-bold font-mono">{studentAnswer || '—'}</span>
                      </div>
                    ) : (
                      <div className={`text-sm px-3 py-2 rounded-lg font-medium ${
                        isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        Your answer: <span className="font-bold">{studentAnswer || '—'}</span>
                      </div>
                    )}
                    {isCorrect && qResult?.correct_answer && (
                      <div className="text-sm px-3 py-2 rounded-lg bg-green-100 text-green-900 font-medium">
                        ✓ Correct answer: <span className="font-bold">{qResult.correct_answer}</span>
                      </div>
                    )}
                    {!isCorrect && (
                      <div className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-500 italic">
                        Correct answer is hidden. Review the lesson material.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="px-6 py-4 border-t shrink-0" style={{ background: 'var(--card)' }}>
            <Button onClick={handleClose} size="lg" className="w-full"
              style={{ background: 'var(--royal-blue)', color: 'white' }}>
              {assessmentType === 'pre_test' ? 'Continue with the Lesson' : result.score >= passingScore ? 'Continue Learning' : 'Close & Review'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Results View ────────────────────────────────────────────────────────────
  if (showResult && result) {
    const isPre = assessmentType === 'pre_test';
    const passed = isPre ? true : result.score >= passingScore;

    if (isPre) {
      return (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-xl p-0 overflow-hidden">
            <div className="p-8 text-center bg-gradient-to-br from-amber-400 to-amber-500 text-white">
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-12 w-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-1">Baseline Recorded!</h2>
              <p className="text-white/90 text-sm">{assessment.title}</p>
            </div>
            <div className="p-6 space-y-5">
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-500 mb-1 uppercase tracking-wide">Your Starting Score</p>
                <div className="text-6xl font-extrabold mb-1" style={{ color: '#D97706' }}>
                  {result.score}%
                </div>
                <Progress value={result.score} className="h-3 mt-3 max-w-sm mx-auto" />
              </div>
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-sm font-semibold text-amber-800 mb-1">This is your knowledge baseline</p>
                <p className="text-sm text-amber-700">
                  Pre-tests measure where you start, not where you end. Your score here helps your instructor understand your current level — there is no pass or fail.
                </p>
              </div>
              {enrollmentType === 'academe_student' && questions.some((q: any) => q.type === 'essay') && (
                <div className="p-4 rounded-xl border flex items-start gap-3" style={{ background: 'var(--accent-blue-50)', borderColor: 'var(--royal-blue)' }}>
                  <FileText className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--royal-blue)' }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--royal-blue)' }}>Essay Responses Recorded</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Your instructor will review your essay for baseline assessment.</p>
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowReview(true)} className="flex-1 gap-2">
                  <BookOpen className="h-4 w-4" /> Review Answers
                </Button>
                <Button onClick={handleClose} size="lg" className="flex-1 bg-amber-500 hover:bg-amber-600 text-white">
                  Continue
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      );
    }

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl p-0 overflow-hidden">
          <div className={`p-8 text-center ${passed ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-rose-600'} text-white`}>
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
              {passed ? <CheckCircle className="h-12 w-12 text-white" /> : <XCircle className="h-12 w-12 text-white" />}
            </div>
            <h2 className="text-2xl font-bold mb-1">{passed ? 'Excellent Work!' : 'Keep Trying!'}</h2>
            <p className="text-white/80 text-sm">{getTypeLabel()} — {assessment.title}</p>
          </div>
          <div className="p-6 space-y-5">
            <div className="text-center">
              <div className="text-6xl font-extrabold mb-1" style={{ color: passed ? '#16a34a' : '#dc2626' }}>
                {result.score}%
              </div>
              <p className="text-sm text-gray-500">Passing score: {passingScore}%</p>
              <Progress value={result.score} className="h-3 mt-3 max-w-sm mx-auto" />
            </div>
            {!passed && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center">
                <p className="text-sm font-semibold text-amber-800">Review the lesson material and try again.</p>
                <p className="text-xs text-amber-600 mt-1">{getRetakeInfo()}</p>
              </div>
            )}
            {enrollmentType === 'academe_student' && questions.some((q: any) => q.type === 'essay') && (
              <div className="p-4 rounded-xl border flex items-start gap-3" style={{ background: 'var(--accent-blue-50)', borderColor: 'var(--royal-blue)' }}>
                <FileText className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--royal-blue)' }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--royal-blue)' }}>Essay Questions Pending Review</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Your instructor will manually grade your essay responses.</p>
                </div>
              </div>
            )}
            <div className="flex gap-3">
              {questions.some((q: any) => q.type !== 'essay') && (
                <Button variant="outline" onClick={() => setShowReview(true)} className="flex-1 gap-2">
                  <BookOpen className="h-4 w-4" /> Review Answers
                </Button>
              )}
              <Button onClick={handleClose} size="lg" className="flex-1"
                style={{ background: passed ? '#16a34a' : 'var(--royal-blue)', color: 'white' }}>
                {passed ? 'Continue Learning' : 'Close & Review'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Pre-test Baseline Screen ─────────────────────────────────────────────────
  if (assessmentType === 'pre_test' && showWarning) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          <div className="p-6 bg-amber-500 text-white text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-3" />
            <h2 className="text-xl font-bold">Baseline Knowledge Check</h2>
            <p className="text-white/90 text-sm mt-1">{assessment.title}</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <p className="font-semibold text-amber-900 mb-3">What is a Pre-Test?</p>
              <ul className="text-sm text-amber-800 space-y-2">
                <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" /> Measures your <strong>starting knowledge</strong> — not a pass or fail exam</li>
                <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" /> Your score helps your instructor understand your baseline level</li>
                <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" /> Answer {totalQuestions} questions honestly — don't guess</li>
                <li className="flex items-start gap-2"><AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" /> One attempt only — this baseline cannot be re-taken</li>
              </ul>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">Cancel</Button>
              <Button onClick={() => setShowWarning(false)} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white">
                Start Baseline Check
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Main Assessment View ────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !showResult) toast.info('Assessment paused'); onOpenChange(v); }}>
      <DialogContent className="max-w-4xl w-full max-h-[92vh] p-0 overflow-hidden flex flex-col gap-0">

        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b shrink-0"
          style={{ background: colors.lightBg, borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: colors.bg, color: colors.text }}>
              {getTypeLabel()}
            </span>
            <div>
              <p className="font-semibold text-sm leading-tight" style={{ color: 'var(--foreground)' }}>{assessment.title}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{getRetakeInfo()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {timeRemaining !== null && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${
                timeRemaining < 60 ? 'bg-red-100 text-red-700' : 'bg-white text-gray-700 border'}`}>
                <Clock className="h-3.5 w-3.5" />
                {formatTime(timeRemaining)}
              </div>
            )}
            <span className="text-xs px-2 py-1 rounded-full bg-white border" style={{ color: 'var(--muted-foreground)' }}>
              {answeredCount}/{totalQuestions} answered
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-6 pt-3 pb-1 shrink-0">
          <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
            <span>Question {currentQuestion + 1} of {totalQuestions}</span>
            <span>{Math.round(((currentQuestion + 1) / totalQuestions) * 100)}% through</span>
          </div>
          <Progress value={((currentQuestion + 1) / totalQuestions) * 100} className="h-2" />
        </div>

        {/* Question body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Question card */}
          <div className="rounded-2xl border-2 p-5 mb-5" style={{ borderColor: colors.border, background: colors.lightBg }}>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
                style={{ background: colors.bg }}>
                {currentQuestion + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge variant="outline" className="text-xs border-current">
                    {question.type === 'multiple_choice' ? 'Multiple Choice' :
                     question.type === 'true_false' ? 'True / False' :
                     question.type === 'identification' ? 'Identification' : 'Essay'}
                  </Badge>
                  <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                    {question.points || 10} points
                  </span>
                </div>
                <p className="text-lg font-semibold leading-snug" style={{ color: 'var(--foreground)' }}>
                  {question.question}
                </p>
              </div>
            </div>
          </div>

          {/* Answer area */}
          {question.type === 'essay' ? (
            <div>
              <Textarea
                value={answers[question.id] || ''}
                onChange={(e) => setAnswers(prev => ({ ...prev, [question.id]: e.target.value }))}
                rows={8}
                placeholder={enrollmentType === 'certificatory'
                  ? 'Optional — this essay question will not affect your final score.'
                  : 'Type your answer here. Your instructor will grade this response.'}
                className="w-full text-sm resize-none"
              />
              {enrollmentType === 'academe_student' && (
                <p className="text-xs mt-2 flex items-center gap-1" style={{ color: 'var(--muted-foreground)' }}>
                  <FileText className="h-3 w-3" /> Manually graded by your instructor
                </p>
              )}
            </div>
          ) : question.type === 'identification' ? (
            <div>
              <input
                type="text"
                value={answers[question.id] || ''}
                onChange={(e) => setAnswers(prev => ({ ...prev, [question.id]: e.target.value }))}
                placeholder="Type your answer exactly as it should appear..."
                className="w-full px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all outline-none"
                style={{
                  borderColor: answers[question.id] ? colors.bg : 'var(--border)',
                  background: 'var(--card)',
                  color: 'var(--foreground)',
                }}
                autoComplete="off"
                spellCheck={false}
              />
              <p className="text-xs mt-2" style={{ color: 'var(--muted-foreground)' }}>
                Exact match required — capitalization and spelling must be precise.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {question.options?.map((option: string, idx: number) => {
                const isSelected = answers[question.id] === option;
                return (
                  <button
                    key={idx}
                    onClick={() => setAnswers(prev => ({ ...prev, [question.id]: option }))}
                    className="w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 group"
                    style={{
                      borderColor: isSelected ? colors.bg : 'var(--border)',
                      background: isSelected ? colors.lightBg : 'var(--card)',
                      boxShadow: isSelected ? `0 0 0 2px ${colors.bg}20` : 'none',
                    }}
                  >
                    <div className="w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center transition-all"
                      style={{ borderColor: isSelected ? colors.bg : 'var(--muted-foreground)', background: isSelected ? colors.bg : 'transparent' }}>
                      {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                    </div>
                    <span className="text-sm font-medium flex-1" style={{ color: isSelected ? colors.bg : 'var(--foreground)' }}>
                      {option}
                    </span>
                    {isSelected && <CheckCircle className="h-4 w-4 shrink-0" style={{ color: colors.bg }} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t shrink-0 flex items-center justify-between"
          style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <Button variant="outline" onClick={() => setCurrentQuestion(q => q - 1)}
            disabled={currentQuestion === 0} className="gap-2">
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>

          {/* Dot indicators */}
          <div className="flex gap-1.5 flex-wrap justify-center max-w-xs">
            {questions.map((_: any, i: number) => (
              <button key={i} onClick={() => setCurrentQuestion(i)}
                className="w-3 h-3 rounded-full transition-all hover:scale-125"
                style={{ background: i === currentQuestion ? colors.bg : answers[questions[i]?.id] ? '#16a34a' : 'var(--muted)' }} />
            ))}
          </div>

          {currentQuestion === totalQuestions - 1 ? (
            <Button onClick={() => handleSubmit()} disabled={submitting} className="gap-2"
              style={{ background: colors.bg, color: colors.text }}>
              <Award className="h-4 w-4" />
              {submitting ? 'Submitting...' : 'Submit'}
            </Button>
          ) : (
            <Button onClick={() => setCurrentQuestion(q => q + 1)} className="gap-2"
              style={{ background: colors.bg, color: colors.text }}>
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
