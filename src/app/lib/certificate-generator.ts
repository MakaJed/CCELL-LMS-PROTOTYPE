/**
 * Certificate Generation Service
 *
 * Handles the generation of certificate images using:
 * 1. Course certificate template (uploaded by instructor)
 * 2. Name position configuration (set by instructor)
 * 3. Student data (name, completion date, etc.)
 *
 * This service is used for:
 * - Auto-generating certificates on course completion
 * - Manual certificate issuance by instructors
 * - Certificate preview in the certificate editor
 */

export interface CertificateData {
  studentName: string;
  courseTitle: string;
  completionDate: string;
  cpdUnits?: number;
  verificationCode: string;
}

export interface NamePosition {
  x: number; // percentage from left
  y: number; // percentage from top
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  color: string;
  textAlign: 'left' | 'center' | 'right';
}

export interface CertificateTemplate {
  templateUrl?: string;
  namePosition: NamePosition;
}

/**
 * Generate a certificate image blob
 * @param data Certificate data (student name, course, etc.)
 * @param template Template configuration
 * @returns Promise<Blob> PNG image blob
 */
export async function generateCertificateBlob(
  data: CertificateData,
  template: CertificateTemplate
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    // Standard certificate dimensions (11" x 8.5" at 96 DPI)
    canvas.width = 1056;
    canvas.height = 816;

    const drawCertificate = () => {
      // Draw student name
      drawStudentName(ctx, data.studentName, template.namePosition, canvas.width, canvas.height);

      // Convert to blob
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to generate certificate blob'));
          return;
        }
        resolve(blob);
      }, 'image/png');
    };

    // If template image exists, load and draw it first
    if (template.templateUrl) {
      const image = new Image();
      image.crossOrigin = 'anonymous'; // Handle CORS

      image.onload = () => {
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        drawCertificate();
      };

      image.onerror = () => {
        // Fallback to default template if image fails to load
        console.warn('Template image failed to load, using default template');
        drawDefaultTemplate(ctx, canvas.width, canvas.height, data);
        drawCertificate();
      };

      image.src = template.templateUrl;
    } else {
      // No template, use default
      drawDefaultTemplate(ctx, canvas.width, canvas.height, data);
      drawCertificate();
    }
  });
}

/**
 * Generate a certificate and trigger download
 */
export async function downloadCertificate(
  data: CertificateData,
  template: CertificateTemplate
): Promise<void> {
  try {
    const blob = await generateCertificateBlob(data, template);

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Certificate_${data.verificationCode}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download certificate:', error);
    throw error;
  }
}

/**
 * Generate a certificate and return as data URL
 */
export async function generateCertificateDataURL(
  data: CertificateData,
  template: CertificateTemplate
): Promise<string> {
  const blob = await generateCertificateBlob(data, template);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Upload certificate to Supabase Storage
 * This would be called after generating the certificate blob
 */
export async function uploadCertificateToStorage(
  blob: Blob,
  certificateId: string
): Promise<string> {
  // In a real implementation, this would:
  // 1. Upload blob to Supabase Storage
  // 2. Return the public URL

  // For now, return a placeholder URL
  console.log('[Certificate Generator] Upload certificate to storage:', certificateId);
  return `https://storage.supabase.co/certificates/${certificateId}.png`;
}

/**
 * Draw student name on canvas using position configuration
 */
function drawStudentName(
  ctx: CanvasRenderingContext2D,
  name: string,
  position: NamePosition,
  canvasWidth: number,
  canvasHeight: number
): void {
  const x = (position.x / 100) * canvasWidth;
  const y = (position.y / 100) * canvasHeight;

  ctx.font = `${position.fontWeight} ${position.fontSize}px ${position.fontFamily}`;
  ctx.fillStyle = position.color;
  ctx.textAlign = position.textAlign;
  ctx.fillText(name, x, y);
}

/**
 * Draw default certificate template
 * Used when instructor hasn't uploaded a custom template
 */
function drawDefaultTemplate(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  data: CertificateData
): void {
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

  // Course info (below name position - typically around 50% height)
  ctx.font = '20px Georgia';
  ctx.fillStyle = '#666666';
  ctx.fillText('has successfully completed', width / 2, height / 2 + 80);

  ctx.font = 'bold 28px Georgia';
  ctx.fillStyle = '#1A237E';
  ctx.fillText(data.courseTitle, width / 2, height / 2 + 130);

  // Date
  ctx.font = '18px Georgia';
  ctx.fillStyle = '#666666';
  ctx.fillText(`Completed on ${data.completionDate}`, width / 2, height - 150);

  // CPD Units
  if (data.cpdUnits) {
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#FFB300';
    ctx.fillText(`${data.cpdUnits} CPD Units`, width / 2, height - 110);
  }

  // Verification code
  ctx.font = '14px monospace';
  ctx.fillStyle = '#999999';
  ctx.fillText(`Verification: ${data.verificationCode}`, width / 2, height - 70);

  // La Nouvelle University branding
  ctx.font = 'italic 16px Georgia';
  ctx.fillStyle = '#1A237E';
  ctx.fillText('La Nouvelle University', width / 2, height - 35);
}

/**
 * Auto-generate certificate on course completion
 * This function would be called by the backend when:
 * 1. Student completes all required lessons
 * 2. Student passes final assessment (if required)
 * 3. For certificatory courses: payment verified and not expired
 */
export async function autoGenerateCertificate(
  studentId: string,
  enrollmentId: string,
  courseId: string
): Promise<{ success: boolean; certificateId?: string; error?: string }> {
  try {
    // In a real implementation, this would:
    // 1. Fetch student data from database
    // 2. Fetch course data and template configuration
    // 3. Generate certificate blob
    // 4. Upload to Supabase Storage
    // 5. Create certificate record in database
    // 6. Send notification to student
    // 7. Return certificate ID

    console.log('[Certificate Generator] Auto-generating certificate:', {
      studentId,
      enrollmentId,
      courseId,
    });

    // Mock implementation
    const certificateId = `cert-${Date.now()}`;

    return {
      success: true,
      certificateId,
    };
  } catch (error: any) {
    console.error('[Certificate Generator] Auto-generation failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate certificate',
    };
  }
}

/**
 * Check if student is eligible for certificate
 * Called before auto-generating to verify requirements
 */
export function checkCertificateEligibility(
  enrollment: {
    progress_percentage: number;
    enrollment_type: string;
    is_expired: boolean;
    final_assessment_passed?: boolean;
  },
  course: {
    course_type: string;
    requires_final_assessment: boolean;
  }
): { eligible: boolean; reason?: string } {
  // Must complete all content
  if (enrollment.progress_percentage < 100) {
    return {
      eligible: false,
      reason: 'Course not completed (progress < 100%)',
    };
  }

  // For certificatory courses: must not be expired
  if (course.course_type === 'certificatory' && enrollment.is_expired) {
    return {
      eligible: false,
      reason: 'Enrollment has expired',
    };
  }

  // If course requires final assessment, must pass it
  if (course.requires_final_assessment && !enrollment.final_assessment_passed) {
    return {
      eligible: false,
      reason: 'Final assessment not passed',
    };
  }

  return { eligible: true };
}
