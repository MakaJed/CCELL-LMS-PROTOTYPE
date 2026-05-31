import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Checkbox } from '../../components/ui/checkbox';
import { ArrowLeft, Plus, Trash2, Save, FileQuestion, CheckCircle2, XCircle, ListChecks, FileText, Edit } from 'lucide-react';
import { toast } from 'sonner';
import * as apiV2 from '../../lib/api-v2';

type QuestionType = 'multiple_choice' | 'true_false' | 'essay' | 'identification';

interface Question {
  id: string;
  type: QuestionType;
  question_text: string;
  points: number;
  options?: string[];
  correct_answer?: string;
}

export function CreateAssessment() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Assessment metadata
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [passingScore, setPassingScore] = useState('80');
  const [maxRetakes, setMaxRetakes] = useState('3');
  const [timeLimit, setTimeLimit] = useState('');
  const [showCorrectOnWrong, setShowCorrectOnWrong] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Questions
  const [questions, setQuestions] = useState<Question[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (courseId) {
      loadCourseAndLessons();
    }
  }, [courseId]);

  const loadCourseAndLessons = async () => {
    setLoading(true);
    try {
      const result = await apiV2.getCourse(courseId!);
      setCourse(result.course);
      setLessons(result.lessons || []);
      if (!title) setTitle(`${result.course?.title || 'Course'} — Final Assessment`);
      // Load existing final assessment if any
      const faResult = await apiV2.getCourseFinalAssessment(courseId!);
      if (faResult.assessment) {
        setIsEditing(true);
        setTitle(faResult.assessment.title || title);
        setDescription(faResult.assessment.description || '');
        setPassingScore(String(faResult.assessment.passing_score_percentage || 80));
        setMaxRetakes(String(faResult.assessment.max_retakes || faResult.assessment.max_retake_attempts || 3));
        setTimeLimit(String(faResult.assessment.time_limit_minutes || ''));
        // Parse questions and normalize field names
        const parsedQs = (faResult.assessment.questions || []).map((q: any) => ({
          id: q.id || `q-${Date.now()}-${Math.random()}`,
          type: q.type || q.question_type || 'multiple_choice',
          question_text: q.question || q.question_text || '',
          points: q.points || 10,
          options: q.options || [],
          correct_answer: q.correct_answer || '',
        }));
        setQuestions(parsedQs);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: `q-${Date.now()}`,
      type,
      question_text: '',
      points: 1,
      options: type === 'multiple_choice' ? ['', '', '', ''] : type === 'true_false' ? ['True', 'False'] : undefined,
      correct_answer: type === 'true_false' ? 'True' : '',
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const deleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.options) {
      const newOptions = [...question.options];
      newOptions[optionIndex] = value;
      updateQuestion(questionId, { options: newOptions });
    }
  };

  const addOption = (questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.options) {
      updateQuestion(questionId, { options: [...question.options, ''] });
    }
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.options && question.options.length > 2) {
      const newOptions = question.options.filter((_, i) => i !== optionIndex);
      updateQuestion(questionId, { options: newOptions });
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!title.trim()) {
      toast.error('Please enter an assessment title');
      return;
    }

    if (questions.length === 0) {
      toast.error('Please add at least one question');
      return;
    }

    // Validate each question
    for (const q of questions) {
      if (!q.question_text.trim()) {
        toast.error('All questions must have text');
        return;
      }

      if (q.type === 'multiple_choice') {
        if (!q.options || q.options.some(opt => !opt.trim())) {
          toast.error('All multiple choice options must be filled');
          return;
        }
        if (!q.correct_answer) {
          toast.error('Please set correct answer for all multiple choice questions');
          return;
        }
      }

      if (q.type === 'true_false' && !q.correct_answer) {
        toast.error('Please set correct answer for all true/false questions');
        return;
      }
    }

    setSubmitting(true);
    try {
      // Map questions to API format
      const apiQuestions = questions.map((q, i) => ({
        id: q.id,
        type: q.type,
        question: q.question_text,
        points: q.points,
        options: q.options,
        correct_answer: q.correct_answer,
        order_index: i,
      }));

      if (isEditing) {
        // Update existing assessment
        await apiV2.Instructor.updateAssessment(courseId!, {
          title: title.trim(),
          questions: apiQuestions,
          passing_score_percentage: parseInt(passingScore) || 80,
          max_retakes: parseInt(maxRetakes) || 3,
          time_limit_minutes: timeLimit ? parseInt(timeLimit) : undefined,
        });
        toast.success('Final Assessment updated successfully!');
      } else {
        // Create new assessment
        await apiV2.Instructor.createAssessment(courseId!, {
          assessment_type: 'final_assessment',
          title: title.trim(),
          description: description.trim() || undefined,
          questions: apiQuestions,
          passing_score_percentage: parseInt(passingScore) || 80,
          max_retakes: parseInt(maxRetakes) || 3,
          time_limit_minutes: timeLimit ? parseInt(timeLimit) : undefined,
        });
        toast.success('Final Assessment created successfully!');
      }

      navigate(`/instructor/courses/${courseId}/lessons`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create assessment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[var(--royal-blue)] border-r-transparent"></div>
          <p className="mt-4" style={{ color: 'var(--muted-foreground)' }}>Loading course...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
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
          <div className="flex items-center gap-3 mb-2">
            <FileQuestion className="h-6 w-6" style={{ color: 'var(--gold)' }} />
            <h1 className="text-2xl font-bold text-white">{isEditing ? 'Edit Final Assessment' : 'Create Final Assessment'}</h1>
          </div>
          <p className="text-white/70 text-sm">
            {course?.title}
          </p>
        </div>
      </div>

      {/* Assessment Settings */}
      <Card className="mb-6 border-0 shadow-lg" style={{ background: 'var(--card)' }}>
        <CardHeader>
          <CardTitle style={{ color: 'var(--royal-blue)' }}>Final Assessment Settings</CardTitle>
          <CardDescription>Configure grading rules for the end-of-course assessment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Title & Description */}
          <div>
            <Label htmlFor="title">Assessment Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Final Assessment"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description or instructions..."
              rows={2}
              className="mt-1.5"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Passing Score */}
            <div>
              <Label htmlFor="passing-score">Passing Score (%)</Label>
              <Input
                id="passing-score"
                type="number"
                min="0"
                max="100"
                value={passingScore}
                onChange={(e) => setPassingScore(e.target.value)}
                className="mt-1.5"
              />
            </div>

            {/* Max Retakes */}
            <div>
              <Label htmlFor="max-retakes">Max Retakes</Label>
              <Input
                id="max-retakes"
                type="number"
                min="0"
                value={maxRetakes}
                onChange={(e) => setMaxRetakes(e.target.value)}
                className="mt-1.5"
              />
            </div>

            {/* Time Limit */}
            <div>
              <Label htmlFor="time-limit">Time Limit (min)</Label>
              <Input
                id="time-limit"
                type="number"
                min="1"
                value={timeLimit}
                onChange={(e) => setTimeLimit(e.target.value)}
                placeholder="Optional"
                className="mt-1.5"
              />
            </div>
          </div>

          {/* Show Correct Answer on Wrong */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="show-correct"
              checked={showCorrectOnWrong}
              onCheckedChange={(checked) => setShowCorrectOnWrong(checked as boolean)}
            />
            <Label htmlFor="show-correct" className="cursor-pointer">
              Show correct answer when student answers incorrectly
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <Card className="mb-6 border-0 shadow-lg" style={{ background: 'var(--card)' }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle style={{ color: 'var(--royal-blue)' }}>Questions ({questions.length})</CardTitle>
              <CardDescription>Add and configure assessment questions</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => addQuestion('multiple_choice')}
                className="gap-2 text-white"
                style={{ background: 'var(--royal-blue)' }}
              >
                <Plus className="h-4 w-4" />
                Multiple Choice
              </Button>
              <Button
                size="sm"
                onClick={() => addQuestion('true_false')}
                className="gap-2"
                style={{ background: 'var(--gold)', color: 'var(--royal-blue)' }}
              >
                <Plus className="h-4 w-4" />
                True/False
              </Button>
              <Button
                size="sm"
                onClick={() => addQuestion('essay')}
                className="gap-2 bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="h-4 w-4" />
                Essay
              </Button>
              <Button
                size="sm"
                onClick={() => addQuestion('identification')}
                className="gap-2 bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Plus className="h-4 w-4" />
                Identification
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {questions.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-xl" style={{ borderColor: 'var(--border)' }}>
              <FileQuestion className="h-12 w-12 mx-auto mb-3" style={{ color: 'var(--muted-foreground)' }} />
              <p className="font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>No questions yet</p>
              <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
                Add questions using the buttons above
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <Card key={question.id} className="border-2" style={{ borderColor: 'var(--border)' }}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      {/* Question Number */}
                      <div className="shrink-0">
                        <div className="w-10 h-10 flex items-center justify-center" style={{
                          borderRadius: '50%',
                          background: 'var(--royal-blue)'
                        }}>
                          <span className="text-white font-bold text-sm">{index + 1}</span>
                        </div>
                      </div>

                      {/* Question Content */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <Badge
                            className={
                              question.type === 'multiple_choice'
                                ? 'bg-blue-100 text-blue-700 border-blue-300'
                                : question.type === 'true_false'
                                ? 'bg-amber-100 text-amber-700 border-amber-300'
                                : question.type === 'identification'
                                ? 'bg-purple-100 text-purple-700 border-purple-300'
                                : 'bg-green-100 text-green-700 border-green-300'
                            }
                          >
                            {question.type === 'multiple_choice' && <ListChecks className="h-3 w-3 mr-1" />}
                            {question.type === 'true_false' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                            {question.type === 'essay' && <FileText className="h-3 w-3 mr-1" />}
                            {question.type === 'identification' && <Edit className="h-3 w-3 mr-1" />}
                            {question.type.replace('_', ' ')}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteQuestion(question.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div>
                          <Label>Question Text *</Label>
                          <Textarea
                            value={question.question_text}
                            onChange={(e) => updateQuestion(question.id, { question_text: e.target.value })}
                            placeholder="Enter the question..."
                            rows={2}
                            className="mt-1.5"
                          />
                        </div>

                        {/* Multiple Choice Options */}
                        {question.type === 'multiple_choice' && question.options && (
                          <div>
                            <Label>Answer Options *</Label>
                            <div className="space-y-2 mt-1.5">
                              {question.options.map((option, optIndex) => (
                                <div key={optIndex} className="flex items-center gap-2">
                                  <Input
                                    value={option}
                                    onChange={(e) => updateOption(question.id, optIndex, e.target.value)}
                                    placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                                    className="flex-1"
                                  />
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => removeOption(question.id, optIndex)}
                                    disabled={question.options!.length <= 2}
                                    className="shrink-0 text-red-600"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => addOption(question.id)}
                                className="w-full"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Option
                              </Button>
                            </div>

                            <div className="mt-2">
                              <Label>Correct Answer *</Label>
                              <Select
                                value={question.correct_answer || ''}
                                onValueChange={(v) => updateQuestion(question.id, { correct_answer: v })}
                              >
                                <SelectTrigger className="mt-1.5">
                                  <SelectValue placeholder="Select correct answer..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {question.options.map((opt, i) => (
                                    <SelectItem key={i} value={opt}>
                                      {String.fromCharCode(65 + i)}: {opt}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}

                        {/* True/False Options */}
                        {question.type === 'true_false' && (
                          <div>
                            <Label>Correct Answer *</Label>
                            <Select
                              value={question.correct_answer || 'True'}
                              onValueChange={(v) => updateQuestion(question.id, { correct_answer: v })}
                            >
                              <SelectTrigger className="mt-1.5">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="True">True</SelectItem>
                                <SelectItem value="False">False</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {/* Essay (no options needed) */}
                        {question.type === 'essay' && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <p className="text-sm text-green-700">
                              <strong>Note:</strong> Essay questions require manual grading by the instructor.
                            </p>
                          </div>
                        )}

                        {/* Identification — exact-match text answer */}
                        {question.type === 'identification' && (
                          <div>
                            <Label>Expected Answer (exact match) *</Label>
                            <Input
                              value={question.correct_answer || ''}
                              onChange={(e) => updateQuestion(question.id, { correct_answer: e.target.value })}
                              placeholder="Enter the exact expected answer..."
                              className="mt-1.5"
                            />
                            <p className="text-xs mt-1 text-purple-700">Student answer must match exactly (case-sensitive).</p>
                          </div>
                        )}

                        {/* Points */}
                        <div className="w-32">
                          <Label>Points</Label>
                          <Input
                            type="number"
                            min="1"
                            value={question.points}
                            onChange={(e) => updateQuestion(question.id, { points: parseInt(e.target.value) || 1 })}
                            className="mt-1.5"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex gap-3 justify-end">
        <Button
          variant="outline"
          onClick={() => navigate(`/instructor/courses/${courseId}/lessons`)}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting || questions.length === 0 || !title.trim()}
          className="gap-2 text-white"
          style={{ background: 'var(--royal-blue)' }}
        >
          <Save className="h-4 w-4" />
          {submitting ? 'Creating...' : 'Create Assessment'}
        </Button>
      </div>
    </div>
  );
}
