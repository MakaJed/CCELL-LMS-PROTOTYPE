import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Slider } from '../../components/ui/slider';
import { ArrowLeft, Save, Move, Type, Palette, Eye } from 'lucide-react';
import { toast } from 'sonner';
import * as apiV2 from '../../lib/api-v2';
import { useAuth } from '../../../lib/AuthContext';
import { useEnrollments } from '../../../lib/EnrollmentContext';

export function CertificateAdjuster() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getEnrollmentByCourseId } = useEnrollments();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templateUrl, setTemplateUrl] = useState<string>('');
  const [courseTitle, setCourseTitle] = useState<string>('');

  // Settings state (name locked, styling adjustable)
  const [namePosition, setNamePosition] = useState({ x: 50, y: 50, fontSize: 48, fontFamily: 'serif', fontWeight: 'bold', color: '#000000', textAlign: 'center' as 'left'|'center'|'right' });

  const containerRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    load();
  }, [courseId]);

  const sanitize = (raw: any) => {
    const fb = { x: 50, y: 50, fontSize: 48, fontFamily: 'serif', fontWeight: 'bold', color: '#000000', textAlign: 'center' as const };
    const obj = typeof raw === 'string' ? (() => { try { return JSON.parse(raw)||{} } catch { return {} } })() : (raw||{});
    const clamp = (v: any, min: number, max: number) => Math.min(max, Math.max(min, Number(v)||0));
    const textAlign = ['left','center','right'].includes(obj.textAlign) ? obj.textAlign : fb.textAlign;
    return { x: clamp(obj.x ?? fb.x,0,100), y: clamp(obj.y ?? fb.y,0,100), fontSize: clamp(obj.fontSize ?? fb.fontSize,12,120), fontFamily: obj.fontFamily||fb.fontFamily, fontWeight: obj.fontWeight||fb.fontWeight, color: obj.color||fb.color, textAlign } as typeof fb;
  };

  const load = async () => {
    const enrollment = getEnrollmentByCourseId(courseId!);
    if (!enrollment) {
      toast.error('You must be enrolled in this course');
      navigate(`/course/${courseId}`);
      return;
    }
    setLoading(true);
    try {
      const course = await apiV2.getCourse(courseId!);
      setCourseTitle(course.course?.title || 'Course');
      setTemplateUrl(course.course?.certificate_template_url || '');

      const res = await apiV2.Student.getCertificateSettings(enrollment.id);
      setNamePosition(sanitize(res.settings?.effective || {}));
    } catch (err: any) {
      toast.error(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === nameRef.current || nameRef.current?.contains(e.target as Node)) {
      setIsDragging(true);
      e.preventDefault();
    }
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setNamePosition(prev => ({ ...prev, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) }));
    }
  };
  const handleMouseUp = () => setIsDragging(false);

  const handleSave = async () => {
    const enrollment = getEnrollmentByCourseId(courseId!);
    if (!enrollment) return;
    setSaving(true);
    try {
      await apiV2.Student.saveCertificateSettings(enrollment.id, namePosition);
      toast.success('Saved! Your layout will be used for this course.');
      navigate('/student/certificates');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[var(--royal-blue)] border-r-transparent"></div>
          <p className="mt-4" style={{ color: 'var(--muted-foreground)' }}>Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate(`/course/${courseId}`)} className="gap-2 mb-4" style={{ color: 'var(--royal-blue)' }}>
          <ArrowLeft className="h-4 w-4" /> Back to Course
        </Button>
        <div className="p-6 shadow-xl" style={{ background: 'linear-gradient(to right, var(--royal-blue-darker), var(--royal-blue), var(--royal-blue-light))', borderRadius: 'var(--radius-xl)', borderBottom: '3px solid var(--gold)' }}>
          <div className="flex items-center gap-3 mb-2">
            <Eye className="h-6 w-6" style={{ color: 'var(--gold)' }} />
            <h1 className="text-2xl font-bold text-white">Adjust Certificate Layout</h1>
          </div>
          <p className="text-white/70 text-sm">{courseTitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg" style={{ background: 'var(--card)' }}>
          <CardHeader>
            <CardTitle style={{ color: 'var(--royal-blue)' }}>Style Controls</CardTitle>
            <CardDescription>Change size, color, font, alignment. Name text is locked.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label className="flex items-center gap-2 mb-2"><Type className="h-4 w-4"/> Font Size: {namePosition.fontSize}px</Label>
              <Slider min={24} max={96} step={2} value={[namePosition.fontSize]} onValueChange={([v]) => setNamePosition(prev => ({ ...prev, fontSize: v }))} />
            </div>
            <div>
              <Label>Font Family</Label>
              <select className="w-full mt-1.5 border rounded-md px-3 py-2" value={namePosition.fontFamily} onChange={e => setNamePosition(prev => ({ ...prev, fontFamily: e.target.value }))}>
                <option value="serif">Serif (Times New Roman)</option>
                <option value="sans-serif">Sans Serif (Arial)</option>
                <option value="monospace">Monospace</option>
                <option value="cursive">Cursive</option>
                <option value="Georgia">Georgia</option>
              </select>
            </div>
            <div>
              <Label>Font Weight</Label>
              <select className="w-full mt-1.5 border rounded-md px-3 py-2" value={namePosition.fontWeight} onChange={e => setNamePosition(prev => ({ ...prev, fontWeight: e.target.value }))}>
                <option value="normal">Normal</option>
                <option value="bold">Bold</option>
                <option value="lighter">Lighter</option>
              </select>
            </div>
            <div>
              <Label className="flex items-center gap-2"><Palette className="h-4 w-4"/> Text Color</Label>
              <div className="flex gap-2 mt-1.5">
                <Input type="color" value={namePosition.color} onChange={e => setNamePosition(prev => ({ ...prev, color: e.target.value }))} className="w-20 h-10" />
                <Input value={namePosition.color} onChange={e => setNamePosition(prev => ({ ...prev, color: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Text Align</Label>
              <select className="w-full mt-1.5 border rounded-md px-3 py-2" value={namePosition.textAlign} onChange={e => setNamePosition(prev => ({ ...prev, textAlign: e.target.value as any }))}>
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full gap-2 text-white" style={{ background: 'var(--royal-blue)' }}>
              <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save Layout'}
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Card className="border-0 shadow-lg" style={{ background: 'var(--card)' }}>
            <CardHeader>
              <CardTitle style={{ color: 'var(--royal-blue)' }}>Preview</CardTitle>
              <CardDescription>Drag the name to reposition</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                ref={containerRef}
                className="relative w-full aspect-[1.414/1] border-2 rounded-lg overflow-hidden cursor-move"
                style={{ borderColor: 'var(--border)', backgroundImage: `url(${templateUrl})`, backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundColor: 'var(--muted)' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <div
                  ref={nameRef}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-move select-none"
                  style={{ left: `${namePosition.x}%`, top: `${namePosition.y}%`, fontSize: `${namePosition.fontSize}px`, color: namePosition.color, fontWeight: namePosition.fontWeight, textShadow: '2px 2px 4px rgba(0,0,0,0.2)', textAlign: namePosition.textAlign as any, pointerEvents: 'auto' }}
                >
                  {user?.name || 'Student Name'}
                </div>

                <div className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ left: `${namePosition.x}%`, top: `${namePosition.y}%` }}>
                  <Move className="h-6 w-6 text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default CertificateAdjuster;
