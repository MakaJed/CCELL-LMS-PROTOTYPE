import { jsPDF } from 'jspdf';

export interface CertificateData {
  verificationCode: string;
  studentName: string;
  courseName: string;
  issueDate: string;
  cpdUnits?: number;
}

export function generateCertificatePDF(certificate: CertificateData) {
  // Create new PDF document (landscape A4)
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Background gradient effect (using rectangles)
  pdf.setFillColor(13, 22, 66); // Dark navy
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  // Decorative border
  pdf.setLineWidth(0.5);
  pdf.setDrawColor(255, 179, 0); // Gold
  pdf.rect(10, 10, pageWidth - 20, pageHeight - 20);
  pdf.rect(12, 12, pageWidth - 24, pageHeight - 24);

  // Decorative circles
  pdf.setFillColor(255, 179, 0, 0.1);
  pdf.circle(pageWidth - 40, 30, 20, 'F');
  pdf.circle(40, pageHeight - 30, 15, 'F');

  // Header - Logo placeholder
  pdf.setFillColor(255, 179, 0);
  pdf.circle(pageWidth / 2, 35, 8, 'F');

  // LNU CCELL Text
  pdf.setFontSize(14);
  pdf.setTextColor(255, 179, 0);
  pdf.setFont('helvetica', 'bold');
  pdf.text('CCELL-LNU', pageWidth / 2, 50, { align: 'center' });

  // Certificate Title
  pdf.setFontSize(12);
  pdf.setTextColor(255, 179, 0, 0.8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('CERTIFICATE OF COMPLETION', pageWidth / 2, 65, { align: 'center' });

  // Course Name
  pdf.setFontSize(20);
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');

  // Word wrap for long course names
  const courseNameLines = pdf.splitTextToSize(certificate.courseName, pageWidth - 80);
  pdf.text(courseNameLines, pageWidth / 2, 85, { align: 'center' });

  // "Awarded to" text
  pdf.setFontSize(11);
  pdf.setTextColor(200, 200, 255);
  pdf.setFont('helvetica', 'normal');
  pdf.text('This certificate is proudly awarded to', pageWidth / 2, 110, { align: 'center' });

  // Student Name
  pdf.setFontSize(24);
  pdf.setTextColor(255, 179, 0);
  pdf.setFont('helvetica', 'bold');
  pdf.text(certificate.studentName, pageWidth / 2, 125, { align: 'center' });

  // Completion text
  pdf.setFontSize(10);
  pdf.setTextColor(200, 200, 255);
  pdf.setFont('helvetica', 'normal');
  pdf.text(
    'for successfully completing all course requirements and demonstrating',
    pageWidth / 2,
    140,
    { align: 'center' }
  );
  pdf.text(
    'exceptional commitment to continuing education and professional development',
    pageWidth / 2,
    147,
    { align: 'center' }
  );

  // Issue Date
  pdf.setFontSize(10);
  pdf.setTextColor(255, 255, 255);
  const formattedDate = new Date(certificate.issueDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  pdf.text(`Issue Date: ${formattedDate}`, 40, pageHeight - 40);

  // Verification Code
  pdf.setFontSize(9);
  pdf.setFont('courier', 'bold');
  pdf.setTextColor(255, 179, 0);
  pdf.text(`Verification Code: ${certificate.verificationCode}`, 40, pageHeight - 30);

  // CPD Units (if applicable)
  if (certificate.cpdUnits && certificate.cpdUnits > 0) {
    pdf.setFillColor(255, 179, 0, 0.2);
    pdf.roundedRect(pageWidth - 80, pageHeight - 50, 50, 15, 3, 3, 'F');
    pdf.setFontSize(10);
    pdf.setTextColor(255, 179, 0);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${certificate.cpdUnits} CPD Units`, pageWidth - 55, pageHeight - 38, {
      align: 'center',
    });
  }

  // Footer
  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 200);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Center for Continuing Education and Lifelong Learning', pageWidth / 2, pageHeight - 25, {
    align: 'center',
  });
  pdf.text('Leyte Normal University', pageWidth / 2, pageHeight - 20, { align: 'center' });
  pdf.text(
    'Verify this certificate at: ccell-lnu.edu.ph/verify',
    pageWidth / 2,
    pageHeight - 15,
    { align: 'center' }
  );

  // Signature line
  pdf.setLineWidth(0.3);
  pdf.setDrawColor(255, 179, 0);
  pdf.line(pageWidth / 2 - 30, pageHeight - 45, pageWidth / 2 + 30, pageHeight - 45);
  pdf.setFontSize(8);
  pdf.setTextColor(200, 200, 255);
  pdf.text('Director, CCELL', pageWidth / 2, pageHeight - 40, { align: 'center' });

  return pdf;
}

export function downloadCertificate(certificate: CertificateData) {
  const pdf = generateCertificatePDF(certificate);
  const fileName = `CCELL_Certificate_${certificate.verificationCode}.pdf`;
  pdf.save(fileName);
}
