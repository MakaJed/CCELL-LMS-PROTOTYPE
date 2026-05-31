import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import {
  Award,
  Upload,
  ArrowLeft,
  Check,
  X,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  Loader2,
  ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';
import * as apiV2 from '../../lib/api-v2';

export function InstructorCertificateTemplates() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [templateUrl, setTemplateUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const result = await apiV2.Instructor.getMyCourses();
      setCourses(result.courses || []);
    } catch (error: any) {
      console.error('Failed to load courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenUpload = (course: any) => {
    setSelectedCourse(course);
    setTemplateUrl(course.certificate_template_url || '');
    setUploadDialogOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const result = await apiV2.uploadFiles(Array.from(files));
      setTemplateUrl(result.urls[0]);
      toast.success('Template image uploaded!');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmitTemplate = async () => {
    if (!templateUrl.trim()) {
      toast.error('Please provide a certificate template URL');
      return;
    }

    setSubmitting(true);
    try {
      await apiV2.Instructor.updateCourse(selectedCourse.id, {
        certificate_template_url: templateUrl.trim()
      });

      toast.success('Certificate template uploaded successfully!');
      setUploadDialogOpen(false);
      setSelectedCourse(null);
      await loadCourses();
    } catch (error: any) {
      toast.error('Failed to upload template');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[var(--royal-blue)] border-r-transparent"></div>
          <p className="mt-4" style={{ color: 'var(--muted-foreground)' }}>Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="p-6 shadow-xl" style={{
          background: 'linear-gradient(to right, var(--gold), var(--gold-light))',
          borderRadius: 'var(--radius-xl)',
          borderBottom: '3px solid var(--royal-blue)'
        }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center" style={{ background: 'var(--royal-blue)', borderRadius: 'var(--radius-lg)' }}>
              <Award className="h-6 w-6" style={{ color: 'var(--gold)' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--royal-blue)' }}>Certificate Templates</h1>
              <p style={{ color: 'var(--royal-blue-light)' }}>Upload and manage certificate templates for your courses</p>
            </div>
          </div>
        </div>
      </div>

      {/* Requirements Banner */}
      <Card className="border-2 border-red-200 bg-red-50 mb-6 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 mt-0.5 text-red-600" />
            <div>
              <p className="font-semibold text-red-900 mb-1">Certificate Template Required</p>
              <p className="text-sm text-red-700">
                Each course <strong>must</strong> have a certificate template uploaded before students can receive certificates.
                The system will automatically place student names on your template when certificates are generated.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Courses List */}
      <Card className="border-0 shadow-lg" style={{ background: 'var(--card)' }}>
        <CardHeader>
          <CardTitle style={{ color: 'var(--royal-blue)' }}>Your Courses</CardTitle>
          <CardDescription>
            Upload certificate templates for each course
          </CardDescription>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <div className="text-center py-12">
              <Award className="h-12 w-12 mx-auto mb-3" style={{ color: 'var(--muted-foreground)' }} />
              <p style={{ color: 'var(--muted-foreground)' }}>No courses yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {courses.map(course => (
                <div key={course.id} className="border-2 p-4 hover:shadow-md transition-all" style={{
                  borderColor: course.certificate_template_url ? 'var(--border)' : 'rgba(239, 68, 68, 0.3)',
                  background: course.certificate_template_url ? 'var(--card)' : 'rgba(254, 242, 242, 0.5)',
                  borderRadius: 'var(--radius-lg)'
                }}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>{course.title}</h3>
                      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{course.course_code || ''}</p>
                    </div>
                    {course.certificate_template_url ? (
                      <Badge className="gap-1" style={{ background: 'var(--accent-blue-50)', color: 'var(--royal-blue)' }}>
                        <Check className="h-3 w-3" />
                        Template Uploaded
                      </Badge>
                    ) : (
                      <Badge className="gap-1 bg-red-100 text-red-700">
                        <AlertCircle className="h-3 w-3" />
                        Missing Template
                      </Badge>
                    )}
                  </div>

                  {course.certificate_template_url ? (
                    <div className="mb-3 p-3 rounded-lg" style={{ background: 'var(--accent-blue-50)' }}>
                      <p className="text-sm font-semibold mb-1" style={{ color: 'var(--royal-blue)' }}>Template URL:</p>
                      <p className="text-sm font-mono break-all" style={{ color: 'var(--royal-blue-light)' }}>
                        {course.certificate_template_url}
                      </p>
                    </div>
                  ) : (
                    <div className="mb-3 p-3 rounded-lg bg-red-50">
                      <p className="text-sm font-semibold text-red-900">
                        No template uploaded yet. Students cannot receive certificates until you upload a template.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="gap-1"
                      style={{ background: course.certificate_template_url ? 'var(--royal-blue)' : 'var(--gold)', color: course.certificate_template_url ? 'white' : 'var(--royal-blue)' }}
                      onClick={() => handleOpenUpload(course)}
                    >
                      {course.certificate_template_url ? (
                        <>
                          <Edit className="h-3.5 w-3.5" />
                          Update Template
                        </>
                      ) : (
                        <>
                          <Upload className="h-3.5 w-3.5" />
                          Upload Template
                        </>
                      )}
                    </Button>
                    {course.certificate_template_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => window.open(course.certificate_template_url, '_blank')}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Preview
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--royal-blue)' }}>
              {selectedCourse?.certificate_template_url ? 'Update' : 'Upload'} Certificate Template
            </DialogTitle>
            <DialogDescription>
              Upload a certificate template image for <strong>{selectedCourse?.title}</strong>. Student names will be placed automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* File upload zone */}
            <div>
              <Label className="text-sm font-semibold mb-2 block">Certificate Template Image *</Label>
              <label
                className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors hover:border-amber-400 hover:bg-amber-50/30"
                style={{ borderColor: uploading ? 'var(--gold)' : 'var(--border)' }}
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
                    <Loader2 className="h-10 w-10 animate-spin" style={{ color: 'var(--gold)' }} />
                    <span className="text-sm font-medium" style={{ color: 'var(--gold)' }}>Uploading…</span>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-gold-50)' }}>
                      <Upload className="h-7 w-7" style={{ color: 'var(--gold)' }} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Click to upload template image</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>PNG, JPG, WebP — landscape orientation recommended</p>
                    </div>
                  </>
                )}
              </label>
            </div>

            {/* Preview of uploaded / existing template */}
            {templateUrl && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Preview</Label>
                <div className="relative rounded-xl overflow-hidden border-2 bg-gray-50" style={{ borderColor: 'var(--border)' }}>
                  <img
                    src={templateUrl}
                    alt="Certificate template"
                    className="w-full object-contain max-h-52"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <button
                    onClick={() => setTemplateUrl('')}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-xs font-mono truncate" style={{ color: 'var(--muted-foreground)' }}>{templateUrl}</p>
              </div>
            )}

            {/* URL fallback */}
            <details className="group">
              <summary className="text-xs font-medium cursor-pointer select-none" style={{ color: 'var(--royal-blue)' }}>
                Or paste a hosted image URL instead
              </summary>
              <div className="mt-2">
                <Input
                  type="url"
                  value={templateUrl}
                  onChange={(e) => setTemplateUrl(e.target.value)}
                  placeholder="https://example.com/certificate-template.png"
                />
              </div>
            </details>

            {/* Note */}
            <div className="p-3 rounded-lg" style={{ background: 'var(--accent-blue-50)' }}>
              <p className="text-sm" style={{ color: 'var(--royal-blue)' }}>
                <strong>Note:</strong> After saving, adjust the student name placement in the certificate editor.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setUploadDialogOpen(false);
                setSelectedCourse(null);
              }}
              disabled={submitting}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSubmitTemplate}
              disabled={submitting || !templateUrl.trim()}
              style={{ background: 'var(--gold)', color: 'var(--royal-blue)' }}
            >
              <Upload className="h-4 w-4 mr-2" />
              {submitting ? 'Saving...' : 'Save Template'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
