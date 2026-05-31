import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { ArrowLeft, Download, Award, Calendar, User, CheckCircle2, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import * as apiV2 from '../../lib/api-v2';
import { useAuth } from '../../../lib/AuthContext';

interface Certificate {
  id: string;
  enrollment_id: string;
  issued_at: string;
  verification_code: string;
  certificate_data: {
    student_name: string;
    course_title: string;
    completion_date: string;
    cpd_units?: number;
  };
}

interface Course {
  id: string;
  title: string;
  certificate_template_url?: string;
  certificate_name_position?: {
    x: number;
    y: number;
    fontSize: number;
    fontFamily: string;
    fontWeight: string;
    color: string;
    textAlign: 'left' | 'center' | 'right';
  };
}

export function CertificateView() {
  const { certificateId } = useParams<{ certificateId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const viewAllHref = user?.role === 'admin' ? '/admin/certificates' : '/student/certificates';
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (certificateId) {
      loadCertificate();
    }
  }, [certificateId]);

  const loadCertificate = async () => {
    setLoading(true);
    try {
      // Use student endpoint for students; universal endpoint for admin/instructor
      const result = user?.role === 'student'
        ? await apiV2.Student.getCertificate(certificateId!)
        : await apiV2.getCertificateUniversal(certificateId!);
      const raw = result.certificate;

      const cert: Certificate = {
        id: raw.id,
        enrollment_id: raw.enrollment_id,
        issued_at: raw.issue_date || raw.issued_at || new Date().toISOString(),
        verification_code: raw.verification_code,
        certificate_data: {
          student_name: raw.student_name,
          course_title: raw.course_name,
          completion_date: raw.issue_date
            ? new Date(raw.issue_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
            : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          cpd_units: raw.cpd_units || undefined,
        },
      };

      let courseData: Course = {
        id: raw.course_id,
        title: raw.course_name,
        certificate_name_position: {
          x: 50, y: 45, fontSize: 48, fontFamily: 'Georgia',
          fontWeight: 'bold', color: '#1A237E', textAlign: 'center',
        },
      };

      if (raw.course_id) {
        try {
          const courseResult = await apiV2.getCourse(raw.course_id);
          const c = courseResult.course as any;
          courseData = {
            id: c.id,
            title: c.title,
            certificate_template_url: c.certificate_template_url || undefined,
            certificate_name_position: (c.certificate_name_settings as any) || courseData.certificate_name_position,
          };
          // Merge student per-enrollment overrides if available
          if (raw.enrollment_id) {
            try {
              const settingsRes = await apiV2.Student.getCertificateSettings(raw.enrollment_id);
              courseData.certificate_name_position = (settingsRes.settings?.effective as any) || courseData.certificate_name_position;
            } catch (_) {}
          }
        } catch (_) {}
      }

      setCertificate(cert);
      setCourse(courseData);

      setTimeout(() => {
        generateCertificatePreview(cert, courseData);
      }, 100);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load certificate');
    } finally {
      setLoading(false);
    }
  };

  const generateCertificatePreview = (cert: Certificate, courseData: Course) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size (standard certificate dimensions)
    canvas.width = 1056; // 11 inches at 96 DPI
    canvas.height = 816; // 8.5 inches at 96 DPI

    // If template exists, load and draw it
    if (courseData.certificate_template_url) {
      const image = new Image();
      image.onload = () => {
        // Draw template
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        // Draw student name using saved position
        drawStudentName(ctx, cert.certificate_data.student_name, courseData.certificate_name_position!, canvas.width, canvas.height);
      };
      image.src = courseData.certificate_template_url;
    } else {
      // Generate default certificate template
      drawDefaultTemplate(ctx, canvas.width, canvas.height);
      drawStudentName(ctx, cert.certificate_data.student_name, courseData.certificate_name_position!, canvas.width, canvas.height);
    }
  };

  const drawDefaultTemplate = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Border
    ctx.strokeStyle = '#1A237E';
    ctx.lineWidth = 12;
    ctx.strokeRect(40, 40, width - 80, height - 80);

    // Inner border
    ctx.strokeStyle = '#FFB300';
    ctx.lineWidth = 4;
    ctx.strokeRect(60, 60, width - 120, height - 120);

    // Title
    ctx.fillStyle = '#1A237E';
    ctx.font = 'bold 56px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('CERTIFICATE OF COMPLETION', width / 2, 150);

    // Subtitle
    ctx.font = '24px Georgia';
    ctx.fillStyle = '#666666';
    ctx.fillText('This certifies that', width / 2, 220);

    // Course info (below name position)
    ctx.font = '20px Georgia';
    ctx.fillStyle = '#666666';
    ctx.fillText('has successfully completed', width / 2, height / 2 + 80);

    ctx.font = 'bold 28px Georgia';
    ctx.fillStyle = '#1A237E';
    ctx.fillText(certificate?.certificate_data.course_title || '', width / 2, height / 2 + 130);

    // Date
    ctx.font = '18px Georgia';
    ctx.fillStyle = '#666666';
    ctx.fillText(`Completed on ${certificate?.certificate_data.completion_date || ''}`, width / 2, height - 150);

    // CPD Units
    if (certificate?.certificate_data.cpd_units) {
      ctx.font = 'bold 16px Arial';
      ctx.fillStyle = '#FFB300';
      ctx.fillText(`${certificate.certificate_data.cpd_units} CPD Units`, width / 2, height - 110);
    }

    // Verification code
    ctx.font = '14px monospace';
    ctx.fillStyle = '#999999';
    ctx.fillText(`Verification: ${certificate?.verification_code || ''}`, width / 2, height - 70);
  };

  const drawStudentName = (
    ctx: CanvasRenderingContext2D,
    name: string,
    position: { x: number; y: number; fontSize: number; fontFamily: string; fontWeight: string; color: string; textAlign: 'left' | 'center' | 'right' },
    canvasWidth: number,
    canvasHeight: number
  ) => {
    const x = (position.x / 100) * canvasWidth;
    const y = (position.y / 100) * canvasHeight;

    ctx.font = `${position.fontWeight} ${position.fontSize}px ${position.fontFamily}`;
    ctx.fillStyle = position.color;
    ctx.textAlign = position.textAlign;
    ctx.fillText(name, x, y);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setGenerating(true);
    try {
      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error('Failed to generate certificate');
          return;
        }

        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Certificate_${certificate?.verification_code}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success('Certificate downloaded successfully!');
      }, 'image/png');
    } catch (error: any) {
      toast.error('Failed to download certificate');
    } finally {
      setGenerating(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'My Certificate',
        text: `I completed ${certificate?.certificate_data.course_title}!`,
        url: window.location.href,
      }).catch(() => {
        // User cancelled share
      });
    } else {
      // Fallback: copy link to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Certificate link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#1A237E] border-t-[#FFB300] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#1A237E] font-medium">Loading certificate...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="text-center py-12">
          <Award className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Certificate Not Found</h2>
          <p className="text-gray-600 mb-6">The certificate you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate(viewAllHref)}>
            View All Certificates
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
          onClick={() => navigate(viewAllHref)}
          className="gap-2 mb-4 text-[#1A237E] hover:bg-[#E8EAF6]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Certificates
        </Button>

        <div className="bg-gradient-to-r from-[#090F2E] via-[#1A237E] to-[#283593] text-white p-6 rounded-2xl shadow-xl">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-6 w-6 text-[#FFB300]" />
                <Badge className="bg-green-600 text-white">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              </div>
              <h1 className="text-2xl font-bold mb-1">Certificate of Completion</h1>
              <p className="text-blue-200/70 text-sm">{certificate.certificate_data.course_title}</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleShare}
                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              <Button
                onClick={handleDownload}
                disabled={generating}
                className="gap-2 bg-[#FFB300] hover:bg-[#FFC107] text-[#1A237E] font-bold"
              >
                <Download className="h-4 w-4" />
                {generating ? 'Generating...' : 'Download'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Certificate Preview */}
        <div className="lg:col-span-2">
          <Card className="border-2 border-[#1A237E]/10">
            <CardHeader>
              <CardTitle className="text-[#1A237E]">Certificate Preview</CardTitle>
              <CardDescription>This is how your certificate will appear</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg">
                <canvas
                  ref={canvasRef}
                  className="w-full h-auto border-2 border-gray-200 rounded shadow-lg"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Certificate Details */}
        <div className="space-y-6">
          <Card className="border-2 border-[#FFB300]/20">
            <CardHeader className="bg-gradient-to-br from-[#FFF8E1] to-white">
              <CardTitle className="text-[#1A237E] text-lg">Certificate Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#E8EAF6] rounded-lg flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 text-[#1A237E]" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Recipient</p>
                  <p className="font-semibold text-[#1A237E]">{certificate.certificate_data.student_name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#FFF8E1] rounded-lg flex items-center justify-center shrink-0">
                  <Award className="h-5 w-5 text-[#FFB300]" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Course</p>
                  <p className="font-semibold text-[#1A237E]">{certificate.certificate_data.course_title}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Completion Date</p>
                  <p className="font-semibold text-[#1A237E]">{certificate.certificate_data.completion_date}</p>
                </div>
              </div>

              {certificate.certificate_data.cpd_units && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center shrink-0">
                    <Award className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">CPD Units Earned</p>
                    <p className="font-semibold text-[#1A237E]">{certificate.certificate_data.cpd_units} Units</p>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <p className="text-xs text-gray-500 mb-1">Verification Code</p>
                <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded text-[#1A237E] block">
                  {certificate.verification_code}
                </code>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
