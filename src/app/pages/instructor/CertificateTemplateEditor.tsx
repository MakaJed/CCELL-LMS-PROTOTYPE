import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Slider } from '../../components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Award, Upload, Download, Save, ArrowLeft, Eye, Move, Type, Palette, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import * as apiV2 from '../../lib/api-v2';

interface NamePosition {
  x: number; // percentage from left
  y: number; // percentage from top
  fontSize: number; // in pixels
  fontFamily: string;
  fontWeight: string;
  color: string;
  textAlign: 'left' | 'center' | 'right';
}

export function CertificateTemplateEditor() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Template state
  const [templateUrl, setTemplateUrl] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Name position state
  const [namePosition, setNamePosition] = useState<NamePosition>({
    x: 50, // center
    y: 45, // slightly above center
    fontSize: 48,
    fontFamily: 'serif',
    fontWeight: 'bold',
    color: '#1A237E',
    textAlign: 'center',
  });

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [previewName, setPreviewName] = useState('Juan Dela Cruz');

  useEffect(() => {
    if (courseId) {
      loadCourse();
    }
  }, [courseId]);

  useEffect(() => {
    if (imageLoaded) {
      drawCanvas();
    }
  }, [imageLoaded, namePosition, previewName]);

  const loadCourse = async () => {
    setLoading(true);
    try {
      const result = await apiV2.getCourse(courseId!);
      setCourse(result.course);

      if (result.course.certificate_template_url) {
        setTemplateUrl(result.course.certificate_template_url);
      }

      const saved = result.course.certificate_name_settings;
      if (saved && typeof saved === 'object' && saved.x !== undefined) {
        setNamePosition({
          x: saved.x ?? 50,
          y: saved.y ?? 45,
          fontSize: saved.fontSize ?? 48,
          fontFamily: saved.fontFamily ?? 'serif',
          fontWeight: saved.fontWeight ?? 'bold',
          color: saved.color ?? '#1A237E',
          textAlign: saved.textAlign ?? 'center',
        });
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, WebP)');
      return;
    }
    setUploading(true);
    try {
      const result = await apiV2.uploadFiles([file]);
      setTemplateUrl(result.urls[0]);
      setImageLoaded(false);
      toast.success('Template uploaded!');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    drawCanvas();
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image || !imageLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match image
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    // Draw template image
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    // Calculate name position
    const x = (namePosition.x / 100) * canvas.width;
    const y = (namePosition.y / 100) * canvas.height;

    // Draw student name
    ctx.font = `${namePosition.fontWeight} ${namePosition.fontSize}px ${namePosition.fontFamily}`;
    ctx.fillStyle = namePosition.color;
    ctx.textAlign = namePosition.textAlign;
    ctx.textBaseline = 'middle';
    ctx.fillText(previewName, x, y);

    // Draw crosshair at position
    ctx.strokeStyle = '#FFB300';
    ctx.lineWidth = 2;
    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(x - 50, y);
    ctx.lineTo(x + 50, y);
    ctx.stroke();
    // Vertical line
    ctx.beginPath();
    ctx.moveTo(x, y - 50);
    ctx.lineTo(x, y + 50);
    ctx.stroke();

    // Draw drag handle
    ctx.fillStyle = '#FFB300';
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Update position
    setNamePosition({
      ...namePosition,
      x: (clickX / canvas.width) * 100,
      y: (clickY / canvas.height) * 100,
    });
  };

  const handleAutoPosition = () => {
    // Simple auto-positioning: center horizontally, 45% from top
    setNamePosition({
      ...namePosition,
      x: 50,
      y: 45,
    });
    toast.success('Name positioned automatically');
  };

  const handleSave = async () => {
    if (!templateUrl) {
      toast.error('Please upload a certificate template first');
      return;
    }

    setSaving(true);
    try {
      await apiV2.Instructor.updateCourse(courseId!, {
        certificate_template_url: templateUrl,
        certificate_name_settings: JSON.stringify(namePosition),
      } as any);

      toast.success('Certificate template saved!');
      navigate(`/instructor/courses/${courseId}/lessons`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPreview = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-preview-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Preview downloaded!');
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#1A237E] border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading course...</p>
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
          className="gap-2 mb-4 text-[#1A237E] hover:bg-[#E8EAF6]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Course
        </Button>

        <div className="bg-gradient-to-r from-[#090F2E] via-[#1A237E] to-[#283593] text-white p-6 rounded-2xl shadow-xl">
          <div className="flex items-center gap-3 mb-2">
            <Award className="h-6 w-6 text-[#FFB300]" />
            <h1 className="text-2xl font-bold">Certificate Template Editor</h1>
          </div>
          <p className="text-blue-200/70 text-sm">{course?.title}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Controls */}
        <div className="lg:col-span-1 space-y-6">
          {/* Upload Template */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[#1A237E] flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Template
              </CardTitle>
              <CardDescription>Upload a certificate background image</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <label
                className="flex flex-col items-center justify-center gap-3 p-5 border-2 border-dashed rounded-xl cursor-pointer transition-colors hover:border-amber-400 hover:bg-amber-50/30"
                style={{ borderColor: uploading ? '#FFB300' : undefined }}
              >
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                {uploading ? (
                  <>
                    <Loader2 className="h-8 w-8 animate-spin text-[#FFB300]" />
                    <span className="text-sm font-medium text-[#FFB300]">Uploading…</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-[#FFB300]" />
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-700">
                        {templateUrl ? 'Click to replace template' : 'Click to upload template'}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">PNG, JPG, WebP — 1920×1080 recommended</p>
                    </div>
                  </>
                )}
              </label>

              {templateUrl && (
                <div className="relative rounded-lg overflow-hidden border border-green-200 bg-green-50">
                  <img
                    src={templateUrl}
                    alt="Template preview"
                    className="w-full h-20 object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <button
                    onClick={() => { setTemplateUrl(''); setImageLoaded(false); }}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 hover:bg-red-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <p className="text-xs text-green-700 font-medium px-2 py-1">Template ready</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Name Position Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[#1A237E] flex items-center gap-2">
                <Move className="h-5 w-5" />
                Position Controls
              </CardTitle>
              <CardDescription>Adjust student name placement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Preview Name</Label>
                <Input
                  value={previewName}
                  onChange={(e) => setPreviewName(e.target.value)}
                  placeholder="Student name"
                  className="mt-1.5"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label>Horizontal Position</Label>
                  <Badge variant="outline">{namePosition.x.toFixed(0)}%</Badge>
                </div>
                <Slider
                  value={[namePosition.x]}
                  onValueChange={([x]) => setNamePosition({ ...namePosition, x })}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label>Vertical Position</Label>
                  <Badge variant="outline">{namePosition.y.toFixed(0)}%</Badge>
                </div>
                <Slider
                  value={[namePosition.y]}
                  onValueChange={([y]) => setNamePosition({ ...namePosition, y })}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>

              <Button
                onClick={handleAutoPosition}
                variant="outline"
                className="w-full gap-2"
              >
                <Move className="h-4 w-4" />
                Auto Position (Center)
              </Button>
            </CardContent>
          </Card>

          {/* Text Styling */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[#1A237E] flex items-center gap-2">
                <Type className="h-5 w-5" />
                Text Styling
              </CardTitle>
              <CardDescription>Customize name appearance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label>Font Size</Label>
                  <Badge variant="outline">{namePosition.fontSize}px</Badge>
                </div>
                <Slider
                  value={[namePosition.fontSize]}
                  onValueChange={([fontSize]) => setNamePosition({ ...namePosition, fontSize })}
                  min={24}
                  max={96}
                  step={2}
                />
              </div>

              <div>
                <Label>Font Family</Label>
                <Select
                  value={namePosition.fontFamily}
                  onValueChange={(fontFamily) => setNamePosition({ ...namePosition, fontFamily })}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="serif">Serif (Times New Roman)</SelectItem>
                    <SelectItem value="sans-serif">Sans Serif (Arial)</SelectItem>
                    <SelectItem value="monospace">Monospace</SelectItem>
                    <SelectItem value="cursive">Cursive</SelectItem>
                    <SelectItem value="Georgia">Georgia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Font Weight</Label>
                <Select
                  value={namePosition.fontWeight}
                  onValueChange={(fontWeight) => setNamePosition({ ...namePosition, fontWeight })}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="bold">Bold</SelectItem>
                    <SelectItem value="lighter">Lighter</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Text Align</Label>
                <Select
                  value={namePosition.textAlign}
                  onValueChange={(textAlign: any) => setNamePosition({ ...namePosition, textAlign })}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="color" className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Text Color
                </Label>
                <div className="flex gap-2 mt-1.5">
                  <Input
                    id="color"
                    type="color"
                    value={namePosition.color}
                    onChange={(e) => setNamePosition({ ...namePosition, color: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    value={namePosition.color}
                    onChange={(e) => setNamePosition({ ...namePosition, color: e.target.value })}
                    placeholder="#1A237E"
                    className="flex-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleDownloadPreview}
              variant="outline"
              className="flex-1 gap-2"
              disabled={!imageLoaded}
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !templateUrl}
              className="flex-1 gap-2 bg-[#1A237E] hover:bg-[#283593] text-white"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Template'}
            </Button>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-[#1A237E] flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Certificate Preview
              </CardTitle>
              <CardDescription>
                Click on the certificate to reposition the name
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!templateUrl ? (
                <div className="aspect-video border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <Award className="h-16 w-16 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No template uploaded</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Upload a certificate template to begin
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 overflow-auto">
                    <div className="relative inline-block">
                      <canvas
                        ref={canvasRef}
                        onClick={handleCanvasClick}
                        className="max-w-full h-auto cursor-crosshair shadow-lg"
                        style={{ maxHeight: '600px' }}
                      />
                      <img
                        ref={imageRef}
                        src={templateUrl}
                        alt="Certificate template"
                        onLoad={handleImageLoad}
                        className="hidden"
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>💡 Tip:</strong> Click anywhere on the certificate to reposition the name, or use the sliders for precise control.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
