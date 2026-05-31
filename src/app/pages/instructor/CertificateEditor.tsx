import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Slider } from '../../components/ui/slider';
import {
  ArrowLeft,
  Move,
  Save,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Type,
  Award
} from 'lucide-react';
import { toast } from 'sonner';
import * as apiV2 from '../../lib/api-v2';

export function InstructorCertificateEditor() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<any>(null);
  const [templateUrl, setTemplateUrl] = useState('');
  const [saving, setSaving] = useState(false);

  // Name placement state
  const [namePosition, setNamePosition] = useState({ x: 50, y: 50, fontSize: 48, color: '#000000', fontFamily: 'serif', fontWeight: 'bold', textAlign: 'center' });
  const [fontSize, setFontSize] = useState(48);
  const [fontColor, setFontColor] = useState('#000000');

  const sanitizeSettings = (raw: any) => {
    const fallback = { x: 50, y: 50, fontSize: 48, color: '#000000', fontFamily: 'serif', fontWeight: 'bold', textAlign: 'center' };
    const obj = typeof raw === 'string' ? (() => { try { return JSON.parse(raw) || {}; } catch { return {}; } })() : (raw || {});
    const clamp = (v: any, min: number, max: number) => Math.min(max, Math.max(min, Number(v) || 0));
    const textAlign = ['left', 'center', 'right'].includes(obj.textAlign) ? obj.textAlign : fallback.textAlign;
    return {
      x: clamp(obj.x ?? fallback.x, 0, 100),
      y: clamp(obj.y ?? fallback.y, 0, 100),
      fontSize: clamp(obj.fontSize ?? fallback.fontSize, 12, 120),
      color: obj.color || fallback.color,
      fontFamily: obj.fontFamily || fallback.fontFamily,
      fontWeight: obj.fontWeight || fallback.fontWeight,
      textAlign,
    };
  };
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLDivElement>(null);

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
      setTemplateUrl(result.course.certificate_template_url || '');

      const settings = sanitizeSettings(result.course.certificate_name_settings);
      setNamePosition(settings);
      setFontSize(settings.fontSize);
      setFontColor(settings.color);
    } catch (error: any) {
      console.error('Failed to load course:', error);
      toast.error('Failed to load course');
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

      // Clamp values between 0 and 100
      setNamePosition(prev => ({
        ...prev,
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y))
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const settings = {
        x: namePosition.x,
        y: namePosition.y,
        fontSize,
        color: fontColor,
        fontFamily: namePosition.fontFamily,
        fontWeight: namePosition.fontWeight,
        textAlign: namePosition.textAlign,
      };
      await apiV2.Instructor.updateCourse(courseId!, {
        certificate_template_url: templateUrl,
        certificate_name_settings: JSON.stringify(settings),
      } as any);

      toast.success('Certificate template settings saved!');
      navigate(`/instructor/courses/${courseId}/lessons`);
    } catch (error: any) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    const reset = sanitizeSettings({});
    setNamePosition(reset);
    setFontSize(reset.fontSize);
    setFontColor(reset.color);
    toast.info('Position reset to center');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[var(--royal-blue)] border-r-transparent"></div>
          <p className="mt-4" style={{ color: 'var(--muted-foreground)' }}>Loading editor...</p>
        </div>
      </div>
    );
  }

  if (!templateUrl) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <Award className="h-12 w-12 mx-auto mb-3" style={{ color: 'var(--muted-foreground)' }} />
          <p className="font-semibold mb-2" style={{ color: 'var(--foreground)' }}>No Template Uploaded</p>
          <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
            Please upload a certificate template first
          </p>
          <Button onClick={() => navigate('/instructor/certificate-templates')}>
            Go to Templates
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
              <Award className="h-6 w-6" style={{ color: 'var(--royal-blue)' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Certificate Name Placer</h1>
              <p className="text-white/70">Adjust student name position on certificate template</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <Card className="border-0 shadow-lg" style={{ background: 'var(--card)' }}>
          <CardHeader>
            <CardTitle style={{ color: 'var(--royal-blue)' }}>Name Settings</CardTitle>
            <CardDescription>Customize name appearance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Font Size */}
            <div>
              <Label htmlFor="font-size" className="flex items-center gap-2 mb-3">
                <Type className="h-4 w-4" />
                Font Size: {fontSize}px
              </Label>
              <Slider
                id="font-size"
                min={24}
                max={96}
                step={2}
                value={[fontSize]}
                onValueChange={(value) => setFontSize(value[0])}
              />
            </div>

            {/* Font Color */}
            <div>
              <Label htmlFor="font-color">Font Color</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="font-color"
                  type="color"
                  value={fontColor}
                  onChange={(e) => setFontColor(e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={fontColor}
                  onChange={(e) => setFontColor(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            {/* Position Info */}
            <div className="p-4 rounded-lg" style={{ background: 'var(--accent-blue-50)' }}>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--royal-blue)' }}>Position:</p>
              <div className="text-sm space-y-1" style={{ color: 'var(--royal-blue-light)' }}>
                <p>X: {namePosition.x.toFixed(1)}%</p>
                <p>Y: {namePosition.y.toFixed(1)}%</p>
              </div>
            </div>

            {/* Instructions */}
            <div className="p-4 rounded-lg" style={{ background: 'var(--accent-gold-50)' }}>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--gold)' }}>Instructions:</p>
              <ul className="text-xs space-y-1 list-disc list-inside" style={{ color: 'var(--gold-dark)' }}>
                <li>Click and drag the name to reposition</li>
                <li>Adjust font size with the slider</li>
                <li>Change color using the color picker</li>
                <li>Click Save when satisfied</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Button
                onClick={handleReset}
                variant="outline"
                className="w-full gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset to Center
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full gap-2 text-white"
                style={{ background: 'var(--royal-blue)' }}
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-lg" style={{ background: 'var(--card)' }}>
            <CardHeader>
              <CardTitle style={{ color: 'var(--royal-blue)' }}>Preview</CardTitle>
              <CardDescription>Drag the sample name to adjust position</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                ref={containerRef}
                className="relative w-full aspect-[1.414/1] border-2 rounded-lg overflow-hidden cursor-move"
                style={{
                  borderColor: 'var(--border)',
                  backgroundImage: `url(${templateUrl})`,
                  backgroundSize: 'contain',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  backgroundColor: 'var(--muted)'
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* Sample Name */}
                <div
                  ref={nameRef}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-move select-none"
                  style={{
                    left: `${namePosition.x}%`,
                    top: `${namePosition.y}%`,
                    fontSize: `${fontSize}px`,
                    color: fontColor,
                    fontWeight: 'bold',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
                    pointerEvents: 'auto'
                  }}
                >
                  Juan Dela Cruz
                </div>

                {/* Drag Icon */}
                <div
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  style={{
                    left: `${namePosition.x}%`,
                    top: `${namePosition.y - 8}%`,
                  }}
                >
                  <Move className="h-5 w-5 opacity-50" style={{ color: fontColor }} />
                </div>
              </div>

              <div className="mt-4 p-3 rounded-lg" style={{ background: 'var(--muted)' }}>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  <strong>Note:</strong> This preview shows "Juan Dela Cruz" as a sample.
                  The actual student names will be automatically placed at this position when certificates are generated.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
