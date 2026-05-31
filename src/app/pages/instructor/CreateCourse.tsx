import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { ArrowLeft, ArrowRight, Save, CheckCircle, Loader2, Upload, AlertCircle } from 'lucide-react';
import { RichTextEditor } from '../../components/RichTextEditor';
import { useAuth } from '../../../lib/AuthContext';
import { toast } from 'sonner';
import * as apiV2 from '../../lib/api-v2';

type Step = 'details' | 'settings' | 'review';

const steps: { id: Step; label: string; num: number }[] = [
  { id: 'details', label: 'Course Details', num: 1 },
  { id: 'settings', label: 'Settings & Pricing', num: 2 },
  { id: 'review', label: 'Review & Submit', num: 3 },
];

export function CreateCourse() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>('details');
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Course details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [courseType, setCourseType] = useState<'certificatory' | 'academe'>('certificatory');
  const [categoryId, setCategoryId] = useState('');

  // Settings
  const [price, setPrice] = useState('');
  const [durationWeeks, setDurationWeeks] = useState('');
  const [durationHours, setDurationHours] = useState('');
  const [focusOfLesson, setFocusOfLesson] = useState('');
  const [learningObjectives, setLearningObjectives] = useState(['']);
  const [cpdUnits, setCpdUnits] = useState('');
  const [certificateTemplateUrl, setCertificateTemplateUrl] = useState('');

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  const addLearningObjective = () => {
    setLearningObjectives([...learningObjectives, '']);
  };

  const updateLearningObjective = (index: number, value: string) => {
    const updated = [...learningObjectives];
    updated[index] = value;
    setLearningObjectives(updated);
  };

  const removeLearningObjective = (index: number) => {
    if (learningObjectives.length > 1) {
      setLearningObjectives(learningObjectives.filter((_, i) => i !== index));
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'details':
        return title.trim() && description.trim() && courseType;
      case 'settings':
        return durationWeeks && parseFloat(price) >= 0;
      default:
        return true;
    }
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const result = await apiV2.Instructor.createCourse({
        title,
        description: description || undefined,
        course_code: courseCode || undefined,
        course_type: courseType,
        category_id: categoryId || undefined,
        price: parseFloat(price) || 0,
        duration_weeks: parseInt(durationWeeks),
        duration_hours: parseInt(durationHours) || undefined,
        focus_of_lesson: focusOfLesson || undefined,
        learning_objectives: learningObjectives.filter(o => o.trim()),
        cpd_units: parseFloat(cpdUnits) || 0,
        certificate_template_url: certificateTemplateUrl || undefined,
      });

      if (result.success) {
        toast.success('Draft Saved!', {
          description: `"${title}" has been saved as draft.`,
        });
        navigate('/instructor/dashboard');
      }
    } catch (err: any) {
      console.error('Save draft error:', err);
      toast.error('Failed to save draft', {
        description: err.message || 'Please try again later.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForApproval = async () => {
    setSubmitting(true);
    try {
      // First create the course as draft
      const createResult = await apiV2.Instructor.createCourse({
        title,
        description: description || undefined,
        course_code: courseCode || undefined,
        course_type: courseType,
        category_id: categoryId || undefined,
        price: parseFloat(price) || 0,
        duration_weeks: parseInt(durationWeeks),
        duration_hours: parseInt(durationHours) || undefined,
        focus_of_lesson: focusOfLesson || undefined,
        learning_objectives: learningObjectives.filter(o => o.trim()),
        cpd_units: parseFloat(cpdUnits) || 0,
        certificate_template_url: certificateTemplateUrl || undefined,
      });

      if (createResult.success && createResult.course) {
        // Then submit for approval (with fallback if endpoint not implemented)
        try {
          const approvalResult = await apiV2.Instructor.submitCourseForApproval(createResult.course.id);

          if (approvalResult.success) {
            toast.success('Course Submitted for Approval!', {
              description: `"${title}" will be reviewed by an admin. You'll be notified once approved.`,
            });
          }
        } catch (approvalError: any) {
          // If approval endpoint isn't implemented, just show success for course creation
          console.warn('Course approval endpoint not available:', approvalError);
          toast.success('Course Created Successfully!', {
            description: `"${title}" has been created. Contact an admin for approval.`,
          });
        }
        navigate('/instructor/dashboard');
      }
    } catch (err: any) {
      console.error('Submit for approval error:', err);
      toast.error('Failed to submit course', {
        description: err.message || 'Please try again later.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate('/instructor/dashboard')} className="gap-2 mb-4" style={{ color: 'var(--royal-blue)' }}>
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--royal-blue)' }}>Create New Course</h1>
        <p className="mt-2" style={{ color: 'var(--muted-foreground)' }}>Set up your course structure and submit for approval</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center font-bold" style={{
                  borderRadius: '50%',
                  background: currentStepIndex >= idx ? 'var(--royal-blue)' : 'var(--muted)',
                  color: currentStepIndex >= idx ? 'white' : 'var(--muted-foreground)'
                }}>
                  {currentStepIndex > idx ? <CheckCircle className="h-5 w-5" /> : step.num}
                </div>
                <div className="hidden md:block">
                  <p className="font-semibold text-sm" style={{
                    color: currentStepIndex >= idx ? 'var(--royal-blue)' : 'var(--muted-foreground)'
                  }}>
                    {step.label}
                  </p>
                </div>
              </div>
              {idx < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-4" style={{
                  background: currentStepIndex > idx ? 'var(--royal-blue)' : 'var(--muted)'
                }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card className="border-0 shadow-lg" style={{ background: 'var(--card)' }}>
        <CardContent className="pt-6">
          {currentStep === 'details' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Course Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Introduction to Cybersecurity"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Course Description *</Label>
                <RichTextEditor
                  content={description}
                  onChange={setDescription}
                  placeholder="Describe what students will learn in this course..."
                  minHeight="160px"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="courseCode">Course Code</Label>
                  <Input
                    id="courseCode"
                    placeholder="e.g., CS-101"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="courseType">Course Type *</Label>
                  <Select value={courseType} onValueChange={(v) => setCourseType(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="certificatory">Certificatory (Paid, Time-Limited)</SelectItem>
                      <SelectItem value="academe">Academe (Class-Based)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="focusOfLesson">Focus of Lesson</Label>
                <Input
                  id="focusOfLesson"
                  placeholder="Main focus area or topic"
                  value={focusOfLesson}
                  onChange={(e) => setFocusOfLesson(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Learning Objectives</Label>
                {learningObjectives.map((obj, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      placeholder={`Objective ${idx + 1}`}
                      value={obj}
                      onChange={(e) => updateLearningObjective(idx, e.target.value)}
                    />
                    {learningObjectives.length > 1 && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => removeLearningObjective(idx)}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={addLearningObjective}
                  className="w-full"
                >
                  + Add Learning Objective
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'settings' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="durationWeeks">Duration (Weeks) *</Label>
                  <Input
                    id="durationWeeks"
                    type="number"
                    placeholder="e.g., 8"
                    value={durationWeeks}
                    onChange={(e) => setDurationWeeks(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="durationHours">Total Hours</Label>
                  <Input
                    id="durationHours"
                    type="number"
                    placeholder="e.g., 40"
                    value={durationHours}
                    onChange={(e) => setDurationHours(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₱) *</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="0 for free"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpdUnits">CPD Units</Label>
                  <Input
                    id="cpdUnits"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 15"
                    value={cpdUnits}
                    onChange={(e) => setCpdUnits(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="certificateTemplate">Certificate Template URL</Label>
                <Input
                  id="certificateTemplate"
                  placeholder="https://..."
                  value={certificateTemplateUrl}
                  onChange={(e) => setCertificateTemplateUrl(e.target.value)}
                />
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  Upload your certificate template and paste the URL here
                </p>
              </div>

              {courseType === 'certificatory' && (
                <div className="p-4 rounded-lg" style={{ background: 'var(--accent-blue-50)', borderColor: 'var(--royal-blue-light)' }}>
                  <p className="text-sm" style={{ color: 'var(--royal-blue)' }}>
                    <strong>Certificatory Track:</strong> This course will have time-limited access
                    based on the duration ({durationWeeks} weeks). Students will automatically receive
                    certificates upon completion.
                  </p>
                </div>
              )}

              {courseType === 'academe' && (
                <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                  <p className="text-sm text-green-900">
                    <strong>Academe Track:</strong> This course is for class-based learning. You'll
                    be able to create class codes for free student enrollment. Students can also
                    pay to enroll without time limits.
                  </p>
                </div>
              )}
            </div>
          )}

          {currentStep === 'review' && (
            <div className="space-y-6">
              <div className="p-6 border-2 rounded-xl" style={{
                background: 'linear-gradient(to bottom right, var(--accent-blue-50), var(--accent-gold-50))',
                borderColor: 'var(--royal-blue-light)'
              }}>
                <h3 className="font-bold text-xl mb-4" style={{ color: 'var(--royal-blue)' }}>Course Summary</h3>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--muted-foreground)' }}>Title:</span>
                    <span className="font-semibold text-right max-w-[60%]" style={{ color: 'var(--foreground)' }}>{title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--muted-foreground)' }}>Course Code:</span>
                    <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{courseCode || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--muted-foreground)' }}>Type:</span>
                    <Badge style={{
                      background: courseType === 'certificatory' ? 'var(--royal-blue)' : 'var(--accent-blue-50)',
                      color: courseType === 'certificatory' ? 'white' : 'var(--royal-blue)'
                    }}>
                      {courseType === 'certificatory' ? 'Certificatory' : 'Academe'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--muted-foreground)' }}>Duration:</span>
                    <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{durationWeeks} weeks ({durationHours || 'N/A'} hours)</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--muted-foreground)' }}>Price:</span>
                    <span className="font-semibold" style={{ color: 'var(--foreground)' }}>₱{parseFloat(price).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--muted-foreground)' }}>CPD Units:</span>
                    <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{cpdUnits || '0'}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span style={{ color: 'var(--muted-foreground)' }}>Learning Objectives:</span>
                    <span className="font-semibold text-right max-w-[60%]" style={{ color: 'var(--foreground)' }}>
                      {learningObjectives.filter(o => o.trim()).length} objectives
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg border-2" style={{ background: 'var(--accent-gold-50)', borderColor: 'var(--gold-light)' }}>
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" style={{ color: 'var(--gold)' }} />
                  <div className="text-sm" style={{ color: 'var(--gold-dark)' }}>
                    <p className="font-semibold mb-1">Course Approval Required</p>
                    <p>
                      Your course will be submitted to an admin for review. You'll be notified once it's
                      approved. You can add lessons and assessments after the course structure is approved.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <div>
          {currentStepIndex > 0 && (
            <Button
              variant="outline"
              onClick={() => setCurrentStep(steps[currentStepIndex - 1].id)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
          )}
        </div>

        <div className="flex gap-3">
          {currentStep !== 'review' && (
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={saving || !canProceed()}
            >
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Draft
            </Button>
          )}

          {currentStepIndex < steps.length - 1 ? (
            <Button
              onClick={() => setCurrentStep(steps[currentStepIndex + 1].id)}
              disabled={!canProceed()}
              className="text-white"
              style={{ background: 'var(--royal-blue)' }}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmitForApproval}
              disabled={submitting || !canProceed()}
              style={{ background: 'linear-gradient(to right, var(--gold), var(--gold-light))', color: 'var(--royal-blue)' }}
            >
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Submit for Approval
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
