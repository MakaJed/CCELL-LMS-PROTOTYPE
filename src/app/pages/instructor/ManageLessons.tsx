import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../components/ui/alert-dialog';
import { BookOpen, Plus, Edit, Trash2, Video, FileText, ChevronUp, ChevronDown, Save, X, ArrowLeft, GripVertical, FileQuestion, Award, AlertTriangle, Clock, Image, Upload, Loader2, Eye } from 'lucide-react';
import { RichTextEditor } from '../../components/RichTextEditor';
import { sanitize } from '../../lib/sanitize';
import { toast } from 'sonner';
import * as apiV2 from '../../lib/api-v2';
import type { Lesson } from '../../../types/database';

export function ManageLessons() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [powerpointUrl, setPowerpointUrl] = useState('');
  const [keyPointsText, setKeyPointsText] = useState('');
  const [extraMediaUrl, setExtraMediaUrl] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('30');
  const [lessonImages, setLessonImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingPpt, setUploadingPpt] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [finalAssessment, setFinalAssessment] = useState<any>(null);

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
      // Load final assessment
      const faResult = await apiV2.getCourseFinalAssessment(courseId!);
      setFinalAssessment(faResult.assessment || null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingLesson(null);
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setTitle(lesson.title);
    setDescription(lesson.description || '');
    setVideoUrl(lesson.video_url || '');
    setPowerpointUrl(lesson.powerpoint_url || '');
    setKeyPointsText((lesson.key_points || []).join('\n'));
    setEstimatedDuration(String(lesson.estimated_duration_minutes || 30));
    setExtraMediaUrl((lesson as any).extra_media_url || '');
    setLessonImages(lesson.images || []);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setVideoUrl('');
    setPowerpointUrl('');
    setKeyPointsText('');
    setEstimatedDuration('30');
    setExtraMediaUrl('');
    setLessonImages([]);
  };

  const handleFileUpload = async (files: FileList | null, type: 'video' | 'ppt' | 'images') => {
    if (!files || files.length === 0) return;
    const setUploading = type === 'video' ? setUploadingVideo : type === 'ppt' ? setUploadingPpt : setUploadingImages;
    setUploading(true);
    try {
      const result = await apiV2.uploadFiles(Array.from(files));
      if (type === 'video') {
        setVideoUrl(result.urls[0]);
        toast.success('Video uploaded successfully');
      } else if (type === 'ppt') {
        setPowerpointUrl(result.urls[0]);
        toast.success('Presentation uploaded successfully');
      } else {
        setLessonImages(prev => [...prev, ...result.urls]);
        toast.success(`${result.urls.length} image(s) uploaded`);
      }
    } catch (err: any) {
      toast.error(err.message || `Failed to upload ${type}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Please enter a lesson title');
      return;
    }

    // Validate lesson structure order
    const hasDescription = description.trim().length > 0;
    const hasKeyPoints = keyPointsText.trim().length > 0;
    const hasVideo = videoUrl.trim().length > 0;
    const hasPowerpoint = powerpointUrl.trim().length > 0;

    // Warn if not following recommended order
    if (!hasDescription) {
      toast.error('Description/Visuals are required as the first component');
      return;
    }

    if ((hasVideo || hasPowerpoint) && !hasKeyPoints) {
      toast.error('Key Points must be added before Video/PowerPoint materials');
      return;
    }

    setSubmitting(true);
    try {
      const keyPoints = keyPointsText
        .split('\n')
        .map(p => p.trim())
        .filter(p => p.length > 0);

      const lessonData = {
        title: title.trim(),
        description: description.trim() || undefined,
        lesson_order: editingLesson ? editingLesson.lesson_order : lessons.length + 1,
        video_url: videoUrl.trim() || undefined,
        powerpoint_url: powerpointUrl.trim() || undefined,
        key_points: keyPoints.length > 0 ? keyPoints : undefined,
        estimated_duration_minutes: parseInt(estimatedDuration) || 30,
        extra_media_url: extraMediaUrl.trim() || undefined,
        images: lessonImages.length > 0 ? lessonImages : undefined,
      };

      if (editingLesson) {
        await apiV2.Instructor.updateLesson(editingLesson.id, lessonData);
        toast.success('Lesson updated successfully!');
      } else {
        await apiV2.Instructor.createLesson(courseId!, lessonData);
        toast.success('Lesson created successfully!');
      }

      setDialogOpen(false);
      resetForm();
      await loadCourseAndLessons();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save lesson');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    try {
      await apiV2.Instructor.deleteLesson(lessonId);
      toast.success('Lesson deleted');
      await loadCourseAndLessons();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete lesson');
    }
  };

  const handleReorder = async (lessonId: string, direction: 'up' | 'down') => {
    const currentIndex = lessons.findIndex(l => l.id === lessonId);
    if (currentIndex === -1) return;

    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === lessons.length - 1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const reordered = [...lessons];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(newIndex, 0, moved);

    // Update lesson_order for affected lessons
    try {
      // Optimistically update UI
      setLessons(reordered);

      // Update both affected lessons in the backend
      const lesson1 = reordered[currentIndex];
      const lesson2 = reordered[newIndex];

      await Promise.all([
        apiV2.Instructor.updateLesson(lesson1.id, { lesson_order: currentIndex + 1 }),
        apiV2.Instructor.updateLesson(lesson2.id, { lesson_order: newIndex + 1 }),
      ]);

      toast.success('Lesson order updated');
    } catch (error: any) {
      toast.error('Failed to reorder lessons');
      await loadCourseAndLessons(); // Reload to restore correct order
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

  if (!course) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p style={{ color: 'var(--muted-foreground)' }}>Course not found</p>
          <Button onClick={() => navigate('/instructor/dashboard')} className="mt-4">
            Back to Dashboard
          </Button>
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
          className="gap-2 mb-4"
          style={{ color: 'var(--royal-blue)' }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="p-6 shadow-xl" style={{
          background: 'linear-gradient(to right, var(--royal-blue-darker), var(--royal-blue), var(--royal-blue-light))',
          borderRadius: 'var(--radius-xl)',
          borderBottom: '3px solid var(--gold)'
        }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-5 w-5" style={{ color: 'var(--gold)' }} />
                <Badge style={{ background: 'var(--accent-gold-50)', color: 'var(--gold)' }}>
                  {course.course_type === 'certificatory' ? 'Certificatory' : 'Academe'}
                </Badge>
              </div>
              <h1 className="text-2xl font-bold mb-1 text-white">{course.title}</h1>
              <p className="text-white/70 text-sm" dangerouslySetInnerHTML={{ __html: sanitize(course.description || '') }} />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => navigate(`/instructor/courses/${courseId}/duration`)}
                className="gap-2"
                style={{ background: 'var(--gold)', color: 'var(--royal-blue)' }}
              >
                <Clock className="h-4 w-4" />
                Duration
              </Button>
              <Button
                onClick={() => navigate(`/instructor/courses/${courseId}/certificate-editor`)}
                className="gap-2 text-white"
                style={{ background: 'var(--royal-blue)' }}
              >
                <Award className="h-4 w-4" />
                Certificate
              </Button>
              <Button
                onClick={() => navigate(`/instructor/courses/${courseId}/create-assessment`)}
                className="gap-2 text-white"
                style={{ background: 'var(--royal-blue)' }}
              >
                <FileQuestion className="h-4 w-4" />
                {finalAssessment ? 'Edit Final Assessment' : 'Create Final Assessment'}
              </Button>
              <Button
                  onClick={() => navigate(`/instructor/courses/${courseId}/lesson-editor/new`)}
                  className="gap-2"
                  style={{ background: 'var(--gold)', color: 'var(--royal-blue)' }}
                >
                  <Plus className="h-4 w-4" />
                  Add Lesson
                </Button>
              {/* Dialog content removed — editing uses full-screen LessonEditor */}
              {false && <div className="max-w-6xl w-[95vw] max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl" style={{ color: 'var(--royal-blue)' }}>
                    {editingLesson ? 'Edit Lesson' : 'Create New Lesson'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingLesson
                      ? 'Update the lesson details below'
                      : 'Add a new lesson to your course. Fill in the content sections following the required structure.'}
                  </DialogDescription>
                </DialogHeader>

                {/* Structure Order Notice */}
                <div className="p-3 rounded-lg border-2" style={{ background: 'var(--accent-blue-50)', borderColor: 'var(--royal-blue-light)' }}>
                  <div className="flex items-start gap-2 mb-1.5">
                    <AlertTriangle className="h-4 w-4 mt-0.5" style={{ color: 'var(--royal-blue)' }} />
                    <p className="text-xs font-semibold" style={{ color: 'var(--royal-blue)' }}>Required Lesson Structure Order:</p>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 ml-6 text-xs" style={{ color: 'var(--royal-blue-light)' }}>
                    <span>1. Description/Visuals</span>
                    <span>2. Pre-test (Quiz Builder)</span>
                    <span>3. Key Points</span>
                    <span>4. Video</span>
                    <span>5. PowerPoint</span>
                    <span>6. Additional Materials</span>
                    <span>7. Post-test (Quiz Builder)</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
                  {/* ── LEFT COLUMN ── */}
                  <div className="space-y-5">
                    {/* Title */}
                    <div>
                      <Label htmlFor="title" className="text-sm font-semibold">Lesson Title *</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Introduction to Web Security"
                        className="mt-1.5"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <Label className="text-sm font-semibold">Description *</Label>
                      <div className="mt-1.5">
                        <RichTextEditor
                          key={editingLesson?.id ?? 'new-lesson'}
                          content={description}
                          onChange={setDescription}
                          placeholder="Brief overview of what students will learn..."
                          minHeight="180px"
                        />
                      </div>
                    </div>

                    {/* Key Points */}
                    <div>
                      <Label htmlFor="keyPoints" className="text-sm font-semibold">Key Points</Label>
                      <Textarea
                        id="keyPoints"
                        value={keyPointsText}
                        onChange={(e) => setKeyPointsText(e.target.value)}
                        placeholder="Enter each key point on a new line..."
                        rows={6}
                        className="mt-1.5 font-mono text-sm"
                      />
                      <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                        One key point per line. Displayed as bullet points to students.
                      </p>
                    </div>

                    {/* Estimated Duration */}
                    <div>
                      <Label htmlFor="duration" className="text-sm font-semibold">Estimated Duration (minutes)</Label>
                      <Input
                        id="duration"
                        type="number"
                        min="1"
                        value={estimatedDuration}
                        onChange={(e) => setEstimatedDuration(e.target.value)}
                        className="mt-1.5 w-32"
                      />
                    </div>
                  </div>

                  {/* ── RIGHT COLUMN ── */}
                  <div className="space-y-5">
                    {/* Video Upload */}
                    <div>
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <Video className="h-4 w-4" /> Video
                      </Label>
                      {videoUrl ? (
                        <div className="mt-1.5 space-y-2">
                          <div className="rounded-lg overflow-hidden border bg-black">
                            <video
                              src={videoUrl}
                              controls
                              controlsList="nodownload"
                              className="w-full max-h-[200px]"
                              onContextMenu={e => e.preventDefault()}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs truncate flex-1 mr-2 font-mono" style={{ color: 'var(--muted-foreground)' }}>{videoUrl.split('/').pop()}</span>
                            <Button size="sm" variant="outline" className="gap-1 text-red-600 border-red-200 hover:bg-red-50" onClick={() => setVideoUrl('')}>
                              <X className="h-3 w-3" /> Remove
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <label className="mt-1.5 flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors" style={{ borderColor: 'var(--border)' }}>
                          <input type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime" className="hidden" onChange={(e) => handleFileUpload(e.target.files, 'video')} disabled={uploadingVideo} />
                          {uploadingVideo ? (
                            <><Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--royal-blue)' }} /><span className="text-sm font-medium" style={{ color: 'var(--royal-blue)' }}>Uploading video...</span></>
                          ) : (
                            <><Upload className="h-8 w-8" style={{ color: 'var(--muted-foreground)' }} /><span className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Click to upload video</span><span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>MP4, WebM, OGG — max 500MB</span></>
                          )}
                        </label>
                      )}
                    </div>

                    {/* PowerPoint Upload */}
                    <div>
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <FileText className="h-4 w-4" /> PowerPoint Presentation
                      </Label>
                      {powerpointUrl ? (
                        <div className="mt-1.5 space-y-2">
                          <div className="p-4 rounded-lg border-2 flex items-center gap-3" style={{ background: 'var(--accent-blue-50)', borderColor: 'var(--royal-blue-light)' }}>
                            <FileText className="h-10 w-10 shrink-0" style={{ color: 'var(--royal-blue)' }} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate" style={{ color: 'var(--royal-blue)' }}>{powerpointUrl.split('/').pop()}</p>
                              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>PowerPoint presentation uploaded</p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline" className="gap-1 text-red-600 border-red-200 hover:bg-red-50" onClick={() => setPowerpointUrl('')}>
                            <X className="h-3 w-3" /> Remove
                          </Button>
                        </div>
                      ) : (
                        <label className="mt-1.5 flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors" style={{ borderColor: 'var(--border)' }}>
                          <input type="file" accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation" className="hidden" onChange={(e) => handleFileUpload(e.target.files, 'ppt')} disabled={uploadingPpt} />
                          {uploadingPpt ? (
                            <><Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--royal-blue)' }} /><span className="text-sm font-medium" style={{ color: 'var(--royal-blue)' }}>Uploading presentation...</span></>
                          ) : (
                            <><Upload className="h-8 w-8" style={{ color: 'var(--muted-foreground)' }} /><span className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Click to upload PowerPoint</span><span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>PPT, PPTX format</span></>
                          )}
                        </label>
                      )}
                    </div>

                    {/* Lesson Images Upload */}
                    <div>
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <Image className="h-4 w-4" /> Lesson Images
                      </Label>
                      {lessonImages.length > 0 && (
                        <div className="mt-1.5 grid grid-cols-3 gap-2">
                          {lessonImages.map((img, idx) => (
                            <div key={idx} className="relative group rounded-lg overflow-hidden border">
                              <img src={img} alt={`Lesson image ${idx + 1}`} className="w-full h-24 object-cover" />
                              <button
                                onClick={() => setLessonImages(prev => prev.filter((_, i) => i !== idx))}
                                className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <label className="mt-2 flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors" style={{ borderColor: 'var(--border)' }}>
                        <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" multiple className="hidden" onChange={(e) => handleFileUpload(e.target.files, 'images')} disabled={uploadingImages} />
                        {uploadingImages ? (
                          <><Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--royal-blue)' }} /><span className="text-xs font-medium" style={{ color: 'var(--royal-blue)' }}>Uploading images...</span></>
                        ) : (
                          <><Upload className="h-6 w-6" style={{ color: 'var(--muted-foreground)' }} /><span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Click to add images (JPG, PNG, GIF, WebP)</span></>
                        )}
                      </label>
                    </div>

                    {/* Additional Media URL */}
                    <div>
                      <Label htmlFor="extraMedia" className="text-sm font-semibold flex items-center gap-2">
                        <Image className="h-4 w-4" />
                        Additional Media URL
                      </Label>
                      <Input
                        id="extraMedia"
                        type="url"
                        value={extraMediaUrl}
                        onChange={(e) => setExtraMediaUrl(e.target.value)}
                        placeholder="https://example.com/extra-resource"
                        className="mt-1.5"
                      />
                      <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                        Optional link to supplementary material
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      resetForm();
                    }}
                    disabled={submitting}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting || !title.trim()}
                    className="text-white px-6"
                    style={{ background: 'var(--royal-blue)' }}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {submitting ? 'Saving...' : editingLesson ? 'Update Lesson' : 'Create Lesson'}
                  </Button>
                </div>
              </div>}
          </div>
        </div>
      </div>
      </div>

      {/* Lessons List */}
      <Card className="border-0 shadow-lg" style={{ background: 'var(--card)' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: 'var(--royal-blue)' }}>
            <BookOpen className="h-5 w-5" />
            Course Lessons ({lessons.length})
          </CardTitle>
          <CardDescription>
            Manage lesson content, order, and materials
          </CardDescription>
        </CardHeader>
        <CardContent>
          {lessons.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-xl" style={{ borderColor: 'var(--border)' }}>
              <BookOpen className="h-12 w-12 mx-auto mb-3" style={{ color: 'var(--muted-foreground)' }} />
              <p className="font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>No lessons yet</p>
              <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
                Create your first lesson to get started
              </p>
              <Button
                onClick={() => navigate(`/instructor/courses/${courseId}/lesson-editor/new`)}
                className="gap-2"
                style={{ background: 'var(--gold)', color: 'var(--royal-blue)' }}
              >
                <Plus className="h-4 w-4" />
                Add First Lesson
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {lessons
                .sort((a, b) => a.lesson_order - b.lesson_order)
                .map((lesson, index) => (
                  <div
                    key={lesson.id}
                    className="p-4 hover:shadow-md transition-all"
                    style={{
                      border: '2px solid var(--border)',
                      borderRadius: 'var(--radius-lg)'
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Drag Handle & Order Controls */}
                      <div className="flex flex-col items-center gap-1 pt-1">
                        <GripVertical className="h-5 w-5" style={{ color: 'var(--muted-foreground)' }} />
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => handleReorder(lesson.id, 'up')}
                            disabled={index === 0}
                            className="p-0.5 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                            style={{ background: 'var(--muted)' }}
                          >
                            <ChevronUp className="h-4 w-4" style={{ color: 'var(--foreground)' }} />
                          </button>
                          <button
                            onClick={() => handleReorder(lesson.id, 'down')}
                            disabled={index === lessons.length - 1}
                            className="p-0.5 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                            style={{ background: 'var(--muted)' }}
                          >
                            <ChevronDown className="h-4 w-4" style={{ color: 'var(--foreground)' }} />
                          </button>
                        </div>
                      </div>

                      {/* Lesson Number Badge */}
                      <div className="shrink-0">
                        <div className="w-10 h-10 flex items-center justify-center" style={{
                          borderRadius: '50%',
                          background: 'linear-gradient(to bottom right, var(--royal-blue-darker), var(--royal-blue))'
                        }}>
                          <span className="text-white font-bold text-sm">
                            {lesson.lesson_order}
                          </span>
                        </div>
                      </div>

                      {/* Lesson Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold mb-1" style={{ color: 'var(--royal-blue)' }}>
                          {lesson.title}
                        </h3>
                        {lesson.description && (
                          <p className="text-sm mb-2 line-clamp-2" style={{ color: 'var(--muted-foreground)' }}>
                            {lesson.description.replace(/<[^>]*>/g, '')}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-2 mb-2">
                          {lesson.video_url && (
                            <Badge variant="outline" className="gap-1 bg-red-50 border-red-200 text-red-700">
                              <Video className="h-3 w-3" />
                              Video
                            </Badge>
                          )}
                          {lesson.powerpoint_url && (
                            <Badge variant="outline" className="gap-1 bg-blue-50 border-blue-200 text-blue-700">
                              <FileText className="h-3 w-3" />
                              PowerPoint
                            </Badge>
                          )}
                          {lesson.images && lesson.images.length > 0 && (
                            <Badge variant="outline" className="gap-1 bg-purple-50 border-purple-200 text-purple-700">
                              <Image className="h-3 w-3" />
                              {lesson.images.length} Image{lesson.images.length > 1 ? 's' : ''}
                            </Badge>
                          )}
                          {lesson.key_points && lesson.key_points.length > 0 && (
                            <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                              {lesson.key_points.length} Key Points
                            </Badge>
                          )}
                          <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-700">
                            {lesson.estimated_duration_minutes || 30} min
                          </Badge>
                        </div>

                        {lesson.key_points && lesson.key_points.length > 0 && (
                          <details className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                            <summary className="cursor-pointer font-medium" style={{ color: 'var(--royal-blue)' }}>
                              Show key points
                            </summary>
                            <ul className="list-disc list-inside mt-1 space-y-0.5 ml-2">
                              {lesson.key_points.map((point, idx) => (
                                <li key={idx}>{point}</li>
                              ))}
                            </ul>
                          </details>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/course/${courseId}/lesson/${lesson.id}`)}
                          className="gap-1"
                          style={{ color: 'var(--muted-foreground)' }}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Preview
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/instructor/courses/${courseId}/lesson-editor/${lesson.id}`)}
                          className="gap-1"
                          style={{ color: 'var(--royal-blue)' }}
                        >
                          <Edit className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Lesson?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{lesson.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteLesson(lesson.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
