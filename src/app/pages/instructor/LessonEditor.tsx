import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { toast } from 'sonner';
import * as apiV2 from '../../lib/api-v2';
import { RichTextEditor } from '../../components/RichTextEditor';
import {
  ArrowLeft, Save, BookOpen, Video, FileText, Plus, Trash2,
  MoreVertical, CheckCircle2, Circle, ChevronDown, ChevronRight,
  Upload, Loader2, X, ClipboardList, AlignLeft, ListChecks, Layers,
  Eye, LayoutList, Clock, Check,
} from 'lucide-react';

// ─── Local Types ──────────────────────────────────────────────────────────────

interface LocalQuestion {
  localId: string;
  question_type: 'multiple_choice' | 'true_false' | 'identification' | 'essay';
  question_text: string;
  options: string[];
  correct_answer: string;
  points: number;
}

interface QuizState {
  id?: string;
  title: string;
  questions: LocalQuestion[];
  max_retakes: number;
  passing_score_percentage: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 10); }

function emptyQuiz(type: 'Pre-Test' | 'Post-Test'): QuizState {
  return { title: type, questions: [], max_retakes: type === 'Pre-Test' ? 0 : 3, passing_score_percentage: 60 };
}

// ─── Block Wrapper ────────────────────────────────────────────────────────────

function Block({
  step, label, icon, children, onClear,
}: {
  step: number; label: string; icon: React.ReactNode; children: React.ReactNode; onClear?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  return (
    <div className="relative group/block rounded-2xl border-2 transition-all"
      style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
      {/* Step header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b" style={{ borderColor: 'var(--border)', background: 'var(--accent-blue-50)' }}>
        <span className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold text-white shrink-0"
          style={{ background: 'var(--royal-blue)' }}>{step}</span>
        <span className="flex items-center gap-2 font-semibold text-sm" style={{ color: 'var(--royal-blue)' }}>
          {icon} {label}
        </span>
        <div className="ml-auto relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="opacity-0 group-hover/block:opacity-100 p-1.5 rounded-lg hover:bg-black/10 transition-all"
          >
            <MoreVertical className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border z-50 overflow-hidden min-w-[160px]"
              style={{ borderColor: 'var(--border)' }}>
              {onClear && (
                <button
                  onClick={() => { onClear(); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-4 w-4" /> Clear content
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Quiz Builder ─────────────────────────────────────────────────────────────

function QuizBuilder({ quiz, onChange }: { quiz: QuizState; onChange: (q: QuizState) => void }) {
  function addQuestion() {
    const q: LocalQuestion = {
      localId: uid(),
      question_type: 'multiple_choice',
      question_text: '',
      options: ['', '', '', ''],
      correct_answer: '',
      points: 1,
    };
    onChange({ ...quiz, questions: [...quiz.questions, q] });
  }

  function updateQ(localId: string, patch: Partial<LocalQuestion>) {
    onChange({ ...quiz, questions: quiz.questions.map(q => q.localId === localId ? { ...q, ...patch } : q) });
  }

  function removeQ(localId: string) {
    onChange({ ...quiz, questions: quiz.questions.filter(q => q.localId !== localId) });
  }

  return (
    <div className="space-y-4">
      {quiz.questions.length === 0 && (
        <div className="py-8 text-center rounded-xl border-2 border-dashed" style={{ borderColor: 'var(--border)' }}>
          <ClipboardList className="h-8 w-8 mx-auto mb-2" style={{ color: 'var(--muted-foreground)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>No questions yet</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Click below to add your first question</p>
        </div>
      )}

      {quiz.questions.map((q, idx) => (
        <div key={q.localId} className="rounded-xl border-2 overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          {/* Question header */}
          <div className="flex items-center gap-3 px-4 py-2.5 border-b" style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}>
            <span className="text-xs font-bold" style={{ color: 'var(--muted-foreground)' }}>Q{idx + 1}</span>
            <select
              value={q.question_type}
              onChange={e => updateQ(q.localId, {
                question_type: e.target.value as LocalQuestion['question_type'],
                options: e.target.value === 'multiple_choice' ? ['', '', '', ''] : e.target.value === 'true_false' ? ['True', 'False'] : [],
                correct_answer: '',
              })}
              className="text-xs rounded-lg border px-2 py-1 font-medium"
              style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}
            >
              <option value="multiple_choice">Multiple Choice</option>
              <option value="true_false">True / False</option>
              <option value="identification">Identification</option>
              <option value="essay">Essay / Open-Ended</option>
            </select>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>pts:</span>
              <input
                type="number" min="1" value={q.points}
                onChange={e => updateQ(q.localId, { points: parseInt(e.target.value) || 1 })}
                className="w-14 text-xs rounded-lg border px-2 py-1 text-center"
                style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}
              />
              <button onClick={() => removeQ(q.localId)} className="p-1 rounded-lg hover:bg-red-50 text-red-500">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {/* Question text */}
            <textarea
              value={q.question_text}
              onChange={e => updateQ(q.localId, { question_text: e.target.value })}
              placeholder="Type your question here..."
              rows={2}
              className="w-full text-sm rounded-xl border px-3 py-2 resize-none focus:outline-none focus:ring-2"
              style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
            />

            {/* MCQ options */}
            {(q.question_type === 'multiple_choice' || q.question_type === 'true_false') && (
              <div className="space-y-2">
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <button onClick={() => updateQ(q.localId, { correct_answer: String(oi) })} title="Mark as correct">
                      {q.correct_answer === String(oi)
                        ? <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                        : <Circle className="h-5 w-5 shrink-0" style={{ color: 'var(--muted-foreground)' }} />}
                    </button>
                    {q.question_type === 'true_false' ? (
                      <span className="flex-1 text-sm px-3 py-1.5 rounded-xl border font-medium"
                        style={{ borderColor: 'var(--border)', background: 'var(--muted)', color: 'var(--foreground)' }}>
                        {opt}
                      </span>
                    ) : (
                      <input
                        value={opt}
                        onChange={e => {
                          const newOpts = [...q.options];
                          newOpts[oi] = e.target.value;
                          updateQ(q.localId, { options: newOpts });
                        }}
                        placeholder={`Option ${oi + 1}`}
                        className="flex-1 text-sm rounded-xl border px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                      />
                    )}
                    {q.question_type !== 'true_false' && q.options.length > 2 && (
                      <button onClick={() => updateQ(q.localId, { options: q.options.filter((_, i) => i !== oi) })} className="text-red-400 hover:text-red-600">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                {q.question_type !== 'true_false' && (
                  <button
                    onClick={() => updateQ(q.localId, { options: [...q.options, ''] })}
                    className="text-xs font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                    style={{ color: 'var(--royal-blue)' }}
                  >
                    <Plus className="h-3.5 w-3.5" /> Add option
                  </button>
                )}
              </div>
            )}

            {/* Identification answer */}
            {q.question_type === 'identification' && (
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--muted-foreground)' }}>
                  Exact answer (case-insensitive match)
                </label>
                <input
                  value={q.correct_answer}
                  onChange={e => updateQ(q.localId, { correct_answer: e.target.value })}
                  placeholder="Type the exact correct answer..."
                  className="w-full text-sm rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                />
              </div>
            )}

            {q.question_type === 'essay' && (
              <p className="text-xs italic" style={{ color: 'var(--muted-foreground)' }}>
                Essay responses are graded manually by the instructor.
              </p>
            )}
          </div>
        </div>
      ))}

      <button
        onClick={addQuestion}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed font-semibold text-sm transition-colors hover:border-blue-400 hover:bg-blue-50/40"
        style={{ borderColor: 'var(--border)', color: 'var(--royal-blue)' }}
      >
        <Plus className="h-4 w-4" /> Add Question
      </button>

      {/* Quiz settings */}
      <div className="grid grid-cols-2 gap-4 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
        <div>
          <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--muted-foreground)' }}>
            Max retakes
          </label>
          <input
            type="number" min="0" value={quiz.max_retakes}
            onChange={e => onChange({ ...quiz, max_retakes: parseInt(e.target.value) || 0 })}
            className="w-full text-sm rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
            style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
          />
        </div>
        <div>
          <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--muted-foreground)' }}>
            Passing score (%)
          </label>
          <input
            type="number" min="0" max="100" value={quiz.passing_score_percentage}
            onChange={e => onChange({ ...quiz, passing_score_percentage: parseInt(e.target.value) || 60 })}
            className="w-full text-sm rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
            style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Upload Zone ──────────────────────────────────────────────────────────────

function UploadZone({ accept, label, hint, uploading, onFiles }: {
  accept: string; label: string; hint: string; uploading: boolean; onFiles: (files: FileList) => void;
}) {
  return (
    <label className="flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors"
      style={{ borderColor: 'var(--border)' }}>
      <input type="file" accept={accept} className="hidden" onChange={e => e.target.files && onFiles(e.target.files)} disabled={uploading} />
      {uploading
        ? <><Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--royal-blue)' }} /><span className="text-sm font-medium" style={{ color: 'var(--royal-blue)' }}>Uploading…</span></>
        : <><Upload className="h-8 w-8" style={{ color: 'var(--muted-foreground)' }} /><span className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>{label}</span><span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{hint}</span></>
      }
    </label>
  );
}

// ─── Main Editor ──────────────────────────────────────────────────────────────

export function LessonEditor() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId?: string }>();
  const navigate = useNavigate();
  const isNew = !lessonId || lessonId === 'new';

  // Course & lesson tree
  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Lesson fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [keyPoints, setKeyPoints] = useState<string[]>(['']);
  const [images, setImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [powerpointUrl, setPowerpointUrl] = useState('');
  const [extraMediaUrl, setExtraMediaUrl] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState(30);
  const [preTest, setPreTest] = useState<QuizState>(emptyQuiz('Pre-Test'));
  const [postTest, setPostTest] = useState<QuizState>(emptyQuiz('Post-Test'));

  // Upload loading
  const [upVideo, setUpVideo] = useState(false);
  const [upPpt, setUpPpt] = useState(false);
  const [upImages, setUpImages] = useState(false);

  // UI
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [activeView, setActiveView] = useState<'structure' | 'canvas'>('canvas');
  const [treeOpen, setTreeOpen] = useState(true);
  const [currentLessonId, setCurrentLessonId] = useState<string | undefined>(lessonId === 'new' ? undefined : lessonId);

  const mark = useCallback(() => setDirty(true), []);

  // Ctrl+S keyboard shortcut
  const handleSaveRef = useRef<() => void>(() => {});
  useEffect(() => {
    handleSaveRef.current = handleSave;
  });
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveRef.current();
      }
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, []);

  // Load course + lessons + current lesson data
  useEffect(() => {
    if (!courseId) return;
    async function load() {
      setLoading(true);
      setTitle('');
      setDescription('');
      setKeyPoints(['']);
      setImages([]);
      setVideoUrl('');
      setPowerpointUrl('');
      setExtraMediaUrl('');
      setEstimatedDuration(30);
      setPreTest(emptyQuiz('Pre-Test'));
      setPostTest(emptyQuiz('Post-Test'));
      setCurrentLessonId(lessonId === 'new' ? undefined : lessonId);
      try {
        const courseRes = await apiV2.getCourse(courseId!);
        setCourse(courseRes.course);
        const ls = courseRes.lessons || [];
        setLessons(ls);

        if (!isNew && lessonId) {
          const lesson = ls.find((l: any) => l.id === lessonId);
          if (lesson) {
            setTitle(lesson.title || '');
            setDescription(lesson.description || '');
            setKeyPoints((lesson.key_points || []).length > 0 ? lesson.key_points : ['']);
            setImages(lesson.images || []);
            setVideoUrl(lesson.video_url || '');
            setPowerpointUrl(lesson.powerpoint_url || '');
            setExtraMediaUrl((lesson as any).extra_media_url || '');
            setEstimatedDuration(lesson.estimated_duration_minutes || 30);

            // Load linked assessments
            if (lesson.pre_test_id || lesson.post_test_id) {
              const assRes = await apiV2.Instructor.getCourseAssessments(courseId!);
              const assessments: any[] = assRes.assessments || [];
              const pre = assessments.find((a: any) => a.id === lesson.pre_test_id);
              const post = assessments.find((a: any) => a.id === lesson.post_test_id);
              const parseQs = (raw: any): any[] => {
                let arr: any[];
                if (Array.isArray(raw)) arr = raw;
                else if (typeof raw === 'string') { try { arr = JSON.parse(raw) || []; } catch { arr = []; } }
                else arr = [];
                return arr.map((q: any) => ({
                  ...q,
                  question_text: q.question_text ?? q.question ?? '',
                  question_type: q.question_type ?? q.type ?? 'multiple_choice',
                }));
              };
              if (pre) setPreTest({
                id: pre.id,
                title: pre.title || 'Pre-Test',
                questions: parseQs(pre.questions).map((q: any) => ({ ...q, localId: q.id || uid() })),
                max_retakes: pre.max_retakes ?? 0,
                passing_score_percentage: pre.passing_score_percentage ?? 60,
              });
              if (post) setPostTest({
                id: post.id,
                title: post.title || 'Post-Test',
                questions: parseQs(post.questions).map((q: any) => ({ ...q, localId: q.id || uid() })),
                max_retakes: post.max_retakes ?? 3,
                passing_score_percentage: post.passing_score_percentage ?? 60,
              });
            }
          }
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to load');
      } finally {
        setLoading(false);
        setDirty(false);
      }
    }
    load();
  }, [courseId, lessonId, isNew]);

  // Upload handler
  async function handleUpload(files: FileList, type: 'video' | 'ppt' | 'images') {
    const set = type === 'video' ? setUpVideo : type === 'ppt' ? setUpPpt : setUpImages;
    set(true);
    try {
      const result = await apiV2.uploadFiles(Array.from(files));
      if (type === 'video') { setVideoUrl(result.urls[0]); toast.success('Video uploaded'); }
      else if (type === 'ppt') { setPowerpointUrl(result.urls[0]); toast.success('Presentation uploaded'); }
      else { setImages(prev => [...prev, ...result.urls]); toast.success(`${result.urls.length} image(s) uploaded`); }
      mark();
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally { set(false); }
  }

  // Save quiz helper
  async function saveQuiz(quiz: QuizState, type: 'pre_test' | 'post_test', lessonSavedId: string): Promise<string> {
    const payload = {
      assessment_type: type,
      lesson_id: lessonSavedId,
      title: quiz.title,
      questions: quiz.questions.map((q, i) => ({
        id: q.localId,
        type: q.question_type,
        question: q.question_text,
        options: q.options,
        correct_answer: q.correct_answer,
        points: q.points,
        order_index: i,
      })),
      max_retakes: quiz.max_retakes,
      passing_score_percentage: quiz.passing_score_percentage,
      allow_retakes: quiz.max_retakes > 0,
    };

    if (quiz.id) {
      const r = await apiV2.Instructor.updateAssessment(quiz.id, payload);
      return r.assessment?.id || quiz.id;
    } else if (quiz.questions.length > 0) {
      const r = await apiV2.Instructor.createAssessment(courseId!, payload);
      return r.assessment?.id;
    }
    return quiz.id || '';
  }

  // Main save
  async function handleSave() {
    if (!title.trim()) { toast.error('Lesson title is required'); return; }
    setSaving(true);
    try {
      const kp = keyPoints.filter(k => k.trim());
      const lessonData: any = {
        title: title.trim(),
        description: description || undefined,
        video_url: videoUrl || undefined,
        powerpoint_url: powerpointUrl || undefined,
        key_points: kp.length > 0 ? kp : undefined,
        images: images.length > 0 ? images : undefined,
        extra_media_url: extraMediaUrl || undefined,
        estimated_duration_minutes: estimatedDuration,
      };

      let savedId = currentLessonId;
      if (isNew || !savedId) {
        lessonData.lesson_order = lessons.length + 1;
        const r = await apiV2.Instructor.createLesson(courseId!, lessonData);
        savedId = r.lesson?.id;
        setCurrentLessonId(savedId);
      } else {
        await apiV2.Instructor.updateLesson(savedId, lessonData);
      }

      // Save assessments
      const [preId, postId] = await Promise.all([
        saveQuiz(preTest, 'pre_test', savedId!),
        saveQuiz(postTest, 'post_test', savedId!),
      ]);

      // Link assessment IDs back to lesson
      const links: any = {};
      if (preId && preId !== preTest.id) links.pre_test_id = preId;
      if (postId && postId !== postTest.id) links.post_test_id = postId;
      if (Object.keys(links).length > 0) await apiV2.Instructor.updateLesson(savedId!, links);

      if (preId && !preTest.id) setPreTest(p => ({ ...p, id: preId }));
      if (postId && !postTest.id) setPostTest(p => ({ ...p, id: postId }));

      // Refresh lesson list
      const lr = await apiV2.getCourse(courseId!);
      setLessons(lr.lessons || []);

      setDirty(false);
      toast.success(isNew ? 'Lesson created!' : 'Lesson saved!');

      // If new, update URL to the saved lesson ID
      if (isNew && savedId) {
        navigate(`/instructor/courses/${courseId}/lesson-editor/${savedId}`, { replace: true });
      }
    } catch (err: any) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  // Switch to a different lesson in the sidebar
  async function switchLesson(targetId: string) {
    if (targetId === currentLessonId) return;
    if (dirty) {
      const ok = window.confirm('You have unsaved changes. Save before switching?');
      if (ok) { await handleSave(); }
    }
    navigate(`/instructor/courses/${courseId}/lesson-editor/${targetId}`, { replace: false });
  }

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'var(--background)' }}>
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-3" style={{ color: 'var(--royal-blue)' }} />
          <p className="font-medium" style={{ color: 'var(--royal-blue)' }}>Loading editor…</p>
        </div>
      </div>
    );
  }

  const canvasContent = (
    <div className="max-w-3xl mx-auto py-8 px-6 space-y-5">

      {/* Lesson Title */}
      <div className="rounded-2xl border-2 overflow-hidden" style={{ borderColor: 'var(--royal-blue)', background: 'var(--card)' }}>
        <div className="px-5 py-3 border-b" style={{ background: 'var(--royal-blue)', borderColor: 'var(--royal-blue)' }}>
          <span className="text-white font-bold text-sm">Lesson Title</span>
        </div>
        <div className="p-4">
          <input
            value={title}
            onChange={e => { setTitle(e.target.value); mark(); }}
            placeholder="Enter lesson title…"
            className="w-full text-xl font-bold bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-200 rounded-lg px-1"
            style={{ color: 'var(--royal-blue)' }}
          />
          <div className="flex items-center gap-4 mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
            <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
              <Clock className="h-4 w-4" />
              <span>Duration:</span>
            </label>
            <input
              type="number" min="1" value={estimatedDuration}
              onChange={e => { setEstimatedDuration(parseInt(e.target.value) || 30); mark(); }}
              className="w-20 text-sm rounded-lg border px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-200"
              style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
            />
            <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>minutes</span>
          </div>
        </div>
      </div>

      {/* Step 1: Description & Visuals */}
      <Block step={1} label="Description & Visuals" icon={<AlignLeft className="h-4 w-4" />}
        onClear={() => { setDescription(''); setImages([]); mark(); }}>
        <div className="space-y-4">
          <RichTextEditor
            key={`desc-${currentLessonId ?? 'new'}`}
            content={description}
            onChange={v => { setDescription(v); mark(); }}
            placeholder="Write a contextual description of what students will learn in this lesson…"
            minHeight="160px"
          />
          {/* Image grid */}
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {images.map((img, i) => (
                <div key={i} className="relative group rounded-xl overflow-hidden border aspect-video">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => { setImages(prev => prev.filter((_, j) => j !== i)); mark(); }}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <UploadZone
            accept="image/jpeg,image/png,image/gif,image/webp"
            label="Click to add images"
            hint="JPG, PNG, GIF, WebP — multiple allowed"
            uploading={upImages}
            onFiles={f => handleUpload(f, 'images')}
          />
        </div>
      </Block>

      {/* Step 2: Pre-Test */}
      <Block step={2} label="Pre-Test" icon={<ClipboardList className="h-4 w-4" />}
        onClear={() => { setPreTest(emptyQuiz('Pre-Test')); mark(); }}>
        <div className="mb-3 p-3 rounded-xl text-xs font-medium" style={{ background: 'var(--accent-blue-50)', color: 'var(--royal-blue)' }}>
          Pre-Test has <strong>0 retakes</strong> — taken before the lesson content is revealed.
        </div>
        <QuizBuilder quiz={preTest} onChange={q => { setPreTest(q); mark(); }} />
      </Block>

      {/* Step 3: Key Points */}
      <Block step={3} label="Key Points Summary" icon={<ListChecks className="h-4 w-4" />}
        onClear={() => { setKeyPoints(['']); mark(); }}>
        <div className="space-y-2">
          {keyPoints.map((kp, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="mt-2.5 shrink-0" style={{ color: 'var(--royal-blue)' }}>•</span>
              <input
                value={kp}
                onChange={e => {
                  const next = [...keyPoints];
                  next[i] = e.target.value;
                  setKeyPoints(next);
                  mark();
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const next = [...keyPoints];
                    next.splice(i + 1, 0, '');
                    setKeyPoints(next);
                  }
                  if (e.key === 'Backspace' && kp === '' && keyPoints.length > 1) {
                    e.preventDefault();
                    const next = keyPoints.filter((_, j) => j !== i);
                    setKeyPoints(next);
                    mark();
                  }
                }}
                placeholder={`Key point ${i + 1} — press Enter to add another`}
                className="flex-1 text-sm rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
              />
              {keyPoints.length > 1 && (
                <button onClick={() => { setKeyPoints(keyPoints.filter((_, j) => j !== i)); mark(); }}
                  className="mt-2 p-1 text-red-400 hover:text-red-600">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => { setKeyPoints([...keyPoints, '']); mark(); }}
            className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors mt-1"
            style={{ color: 'var(--royal-blue)' }}
          >
            <Plus className="h-4 w-4" /> Add key point
          </button>
        </div>
      </Block>

      {/* Step 4: Video */}
      <Block step={4} label="Video Lecture" icon={<Video className="h-4 w-4" />}
        onClear={() => { setVideoUrl(''); mark(); }}>
        {videoUrl ? (
          <div className="space-y-3">
            <div className="rounded-xl overflow-hidden border bg-black">
              <video src={videoUrl} controls controlsList="nodownload" className="w-full max-h-[360px]"
                onContextMenu={e => e.preventDefault()} />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono truncate flex-1" style={{ color: 'var(--muted-foreground)' }}>
                {videoUrl.split('/').pop()}
              </span>
              <button onClick={() => { setVideoUrl(''); mark(); }}
                className="flex items-center gap-1 text-xs text-red-600 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 border border-red-200">
                <X className="h-3.5 w-3.5" /> Remove
              </button>
            </div>
          </div>
        ) : (
          <UploadZone accept="video/mp4,video/webm,video/ogg,video/quicktime"
            label="Click to upload video" hint="MP4, WebM, OGG — max 500 MB"
            uploading={upVideo} onFiles={f => handleUpload(f, 'video')} />
        )}
      </Block>

      {/* Step 5: PowerPoint */}
      <Block step={5} label="PowerPoint Slide Dock" icon={<FileText className="h-4 w-4" />}
        onClear={() => { setPowerpointUrl(''); mark(); }}>
        {powerpointUrl ? (
          <div className="space-y-3">
            <div className="p-5 rounded-xl border-2 flex items-center gap-4" style={{ background: 'var(--accent-blue-50)', borderColor: 'var(--royal-blue-light)' }}>
              <div className="p-3 rounded-xl bg-white shrink-0">
                <FileText className="h-10 w-10" style={{ color: 'var(--royal-blue)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate" style={{ color: 'var(--royal-blue)' }}>
                  {powerpointUrl.split('/').pop()}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                  PowerPoint presentation — ready for students
                </p>
              </div>
              <button onClick={() => { setPowerpointUrl(''); mark(); }}
                className="flex items-center gap-1 text-xs text-red-600 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 border border-red-200 shrink-0">
                <X className="h-3.5 w-3.5" /> Remove
              </button>
            </div>
          </div>
        ) : (
          <UploadZone accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
            label="Click to upload PowerPoint" hint="PPT or PPTX format"
            uploading={upPpt} onFiles={f => handleUpload(f, 'ppt')} />
        )}
      </Block>

      {/* Step 6: Additional Media */}
      <Block step={6} label="Additional Materials" icon={<Layers className="h-4 w-4" />}
        onClear={() => { setExtraMediaUrl(''); mark(); }}>
        <div>
          <label className="text-sm font-medium block mb-2" style={{ color: 'var(--muted-foreground)' }}>
            Supplementary resource URL
          </label>
          <input
            type="url"
            value={extraMediaUrl}
            onChange={e => { setExtraMediaUrl(e.target.value); mark(); }}
            placeholder="https://example.com/supplementary-resource"
            className="w-full text-sm rounded-xl border px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-200"
            style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
          />
        </div>
      </Block>

      {/* Step 7: Post-Test */}
      <Block step={7} label="Post-Test" icon={<ClipboardList className="h-4 w-4" />}
        onClear={() => { setPostTest(emptyQuiz('Post-Test')); mark(); }}>
        <div className="mb-3 p-3 rounded-xl text-xs font-medium" style={{ background: 'var(--accent-blue-50)', color: 'var(--royal-blue)' }}>
          Post-Test may allow retakes — configure the retake limit and passing score below.
        </div>
        <QuizBuilder quiz={postTest} onChange={q => { setPostTest(q); mark(); }} />
      </Block>

      {/* Bottom spacer */}
      <div className="h-16" />
    </div>
  );

  const structureContent = (
    <div className="max-w-3xl mx-auto py-8 px-6">
      <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--royal-blue)' }}>
        Course Structure — {course?.title}
      </h2>
      <div className="space-y-3">
        {lessons.map((l, i) => (
          <button
            key={l.id}
            onClick={() => switchLesson(l.id)}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all hover:shadow-md ${l.id === currentLessonId ? 'border-current' : ''}`}
            style={{
              borderColor: l.id === currentLessonId ? 'var(--royal-blue)' : 'var(--border)',
              background: l.id === currentLessonId ? 'var(--accent-blue-50)' : 'var(--card)',
            }}
          >
            <span className="flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold text-white shrink-0"
              style={{ background: 'var(--royal-blue)' }}>{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate" style={{ color: 'var(--royal-blue)' }}>{l.title}</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {l.video_url && <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">Video</span>}
                {l.powerpoint_url && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">PPT</span>}
                {l.images?.length > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">{l.images.length} Image{l.images.length > 1 ? 's' : ''}</span>}
                {l.key_points?.length > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">{l.key_points.length} Key Pts</span>}
                {l.pre_test_id && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Pre-Test</span>}
                {l.post_test_id && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Post-Test</span>}
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                  {l.estimated_duration_minutes || 30} min
                </span>
              </div>
            </div>
            {l.id === currentLessonId && <Check className="h-5 w-5 shrink-0" style={{ color: 'var(--royal-blue)' }} />}
          </button>
        ))}
        {lessons.length === 0 && (
          <div className="py-12 text-center rounded-2xl border-2 border-dashed" style={{ borderColor: 'var(--border)' }}>
            <BookOpen className="h-10 w-10 mx-auto mb-3" style={{ color: 'var(--muted-foreground)' }} />
            <p className="font-medium" style={{ color: 'var(--muted-foreground)' }}>No lessons yet</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 flex flex-col z-50 overflow-hidden" style={{ background: 'var(--background)' }}>

      {/* ── Top Header Bar ─────────────────────────────────────────────────── */}
      <header className="shrink-0 flex items-center gap-3 px-4 py-3 border-b shadow-sm z-10"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        {/* Back */}
        <button
          onClick={() => navigate(`/instructor/courses/${courseId}/lessons`)}
          className="flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors shrink-0"
          style={{ color: 'var(--royal-blue)' }}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Lessons
        </button>

        <div className="w-px h-6 shrink-0" style={{ background: 'var(--border)' }} />

        {/* View tabs */}
        <div className="flex items-center rounded-xl p-1 gap-1" style={{ background: 'var(--muted)' }}>
          <button
            onClick={() => setActiveView('structure')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeView === 'structure' ? 'text-white shadow-sm' : ''}`}
            style={{
              background: activeView === 'structure' ? 'var(--royal-blue)' : 'transparent',
              color: activeView === 'structure' ? 'white' : 'var(--muted-foreground)',
            }}
          >
            <LayoutList className="h-3.5 w-3.5" /> Module Structure
          </button>
          <button
            onClick={() => setActiveView('canvas')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all`}
            style={{
              background: activeView === 'canvas' ? 'var(--royal-blue)' : 'transparent',
              color: activeView === 'canvas' ? 'white' : 'var(--muted-foreground)',
            }}
          >
            <Eye className="h-3.5 w-3.5" /> Live Canvas
          </button>
        </div>

        {/* Lesson title preview */}
        <div className="flex-1 min-w-0 px-2">
          <p className="text-sm font-bold truncate" style={{ color: 'var(--royal-blue)' }}>
            {title || (isNew ? 'New Lesson' : 'Untitled Lesson')}
          </p>
          {dirty && (
            <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#d97706' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
              Unsaved changes
            </span>
          )}
        </div>

        {/* Preview (only for saved lessons) */}
        {currentLessonId && (
          <a
            href={`/course/${courseId}/lesson/${currentLessonId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90 shrink-0 border"
            style={{ color: 'var(--royal-blue)', borderColor: 'var(--border)', background: 'var(--card)' }}
          >
            <Eye className="h-4 w-4" />
            Preview
          </a>
        )}

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60 shrink-0"
          style={{ background: dirty ? '#FFB300' : '#9CA3AF', color: dirty ? '#1A237E' : 'white' }}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving…' : 'Save Lesson'}
        </button>
      </header>

      {/* ── Body: Sidebar + Canvas ──────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left sidebar — lesson tree */}
        <aside className="shrink-0 border-r flex flex-col overflow-hidden transition-all"
          style={{ width: treeOpen ? 280 : 48, borderColor: 'var(--border)', background: 'var(--card)' }}>
          {/* Sidebar header */}
          <div className="flex items-center gap-2 px-3 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <button
              onClick={() => setTreeOpen(v => !v)}
              className="p-1.5 rounded-lg hover:bg-gray-100 shrink-0"
            >
              {treeOpen ? <ChevronDown className="h-4 w-4" style={{ color: 'var(--royal-blue)' }} /> : <ChevronRight className="h-4 w-4" style={{ color: 'var(--royal-blue)' }} />}
            </button>
            {treeOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate" style={{ color: 'var(--royal-blue)' }}>
                  {course?.title || 'Course'}
                </p>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  {lessons.length} lesson{lessons.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>

          {/* Lesson list */}
          {treeOpen && (
            <div className="flex-1 overflow-y-auto py-2">
              {lessons.map((l, i) => (
                <button
                  key={l.id}
                  onClick={() => switchLesson(l.id)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-blue-50/50"
                  style={{
                    background: l.id === currentLessonId ? 'var(--accent-blue-50)' : 'transparent',
                    borderLeft: l.id === currentLessonId ? '3px solid var(--royal-blue)' : '3px solid transparent',
                  }}
                >
                  <span className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white shrink-0"
                    style={{ background: l.id === currentLessonId ? 'var(--royal-blue)' : 'var(--muted-foreground)' }}>
                    {i + 1}
                  </span>
                  <span className="text-xs font-medium truncate flex-1" style={{ color: l.id === currentLessonId ? 'var(--royal-blue)' : 'var(--foreground)' }}>
                    {l.title}
                  </span>
                </button>
              ))}

              {/* Add new lesson shortcut */}
              <button
                onClick={() => navigate(`/instructor/courses/${courseId}/lesson-editor/new`)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-blue-50/50 transition-colors mt-1 border-t"
                style={{ borderColor: 'var(--border)' }}
              >
                <span className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-dashed shrink-0"
                  style={{ borderColor: 'var(--royal-blue)' }}>
                  <Plus className="h-3 w-3" style={{ color: 'var(--royal-blue)' }} />
                </span>
                <span className="text-xs font-medium" style={{ color: 'var(--royal-blue)' }}>New Lesson</span>
              </button>
            </div>
          )}
        </aside>

        {/* Right canvas */}
        <main className="flex-1 overflow-y-auto" style={{ background: 'var(--background)' }}>
          {activeView === 'canvas' ? canvasContent : structureContent}
        </main>
      </div>
    </div>
  );
}
