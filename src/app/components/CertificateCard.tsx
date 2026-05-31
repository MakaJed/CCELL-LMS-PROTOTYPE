import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Award, Download, Share2, ExternalLink, QrCode, CheckCircle, Clock, Linkedin, Facebook, Twitter, Link as LinkIcon, Copy } from 'lucide-react';
import { downloadCertificate } from '../lib/certificatePDF';
import { toast } from 'sonner';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface CertificateCardProps {
  certificate: {
    id: string;
    courseId?: string;
    courseName: string;
    studentName: string;
    issueDate: string;
    verificationCode: string;
    cpdUnits?: number;
    status?: string;
  };
  onDownload?: () => void;
  onShare?: () => void;
  onVerify?: () => void;
  showActions?: boolean;
  compact?: boolean;
}

export function CertificateCard({
  certificate,
  onDownload,
  onShare,
  onVerify,
  showActions = true,
  compact = false
}: CertificateCardProps) {
  const [shareMenuOpen, setShareMenuOpen] = useState(false);

  const handleDownload = () => {
    try {
      downloadCertificate({
        verificationCode: certificate.verificationCode,
        studentName: certificate.studentName,
        courseName: certificate.courseName,
        issueDate: certificate.issueDate,
        cpdUnits: certificate.cpdUnits,
      });
      toast.success('Certificate downloaded successfully');
      if (onDownload) onDownload();
    } catch (error) {
      console.error('PDF download error:', error);
      toast.error('Failed to download certificate');
    }
  };

  const handleShareLinkedIn = () => {
    const text = `I've completed ${certificate.courseName} and earned a certificate from LNU CCELL!`;
    const url = `https://ccell-lnu.edu.ph/verify?code=${certificate.verificationCode}`;
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      '_blank'
    );
    toast.success('Sharing to LinkedIn');
    setShareMenuOpen(false);
  };

  const handleShareFacebook = () => {
    const url = `https://ccell-lnu.edu.ph/verify?code=${certificate.verificationCode}`;
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      '_blank'
    );
    toast.success('Sharing to Facebook');
    setShareMenuOpen(false);
  };

  const handleShareTwitter = () => {
    const text = `I've completed ${certificate.courseName} and earned a certificate from LNU CCELL! Verify: `;
    const url = `https://ccell-lnu.edu.ph/verify?code=${certificate.verificationCode}`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      '_blank'
    );
    toast.success('Sharing to Twitter');
    setShareMenuOpen(false);
  };

  const handleCopyLink = () => {
    const url = `https://ccell-lnu.edu.ph/verify?code=${certificate.verificationCode}`;
    navigator.clipboard.writeText(url);
    toast.success('Verification link copied to clipboard');
    setShareMenuOpen(false);
  };
  const getStatusBadge = () => {
    const status = certificate.status?.toLowerCase() || 'active';
    const statusConfig = {
      active: { label: 'Verified', className: 'bg-green-600 text-white', icon: CheckCircle },
      pending: { label: 'Pending', className: 'bg-yellow-600 text-white', icon: Clock },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    const Icon = config.icon;

    return (
      <Badge className={`${config.className} gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (compact) {
    return (
      <Card className="border-l-4 border-l-[#FFB300] hover:shadow-md transition-all">
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#FFB300] to-[#FF8F00] rounded-lg flex items-center justify-center shrink-0">
                <Award className="h-5 w-5 text-[#1A237E]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#1A237E] text-sm">{certificate.courseName}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Issued {new Date(certificate.issueDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
            {getStatusBadge()}
          </div>
          {certificate.cpdUnits && certificate.cpdUnits > 0 && (
            <div className="flex items-center gap-1 text-xs text-[#FFB300] font-medium mt-2">
              <CheckCircle className="h-3 w-3" />
              {certificate.cpdUnits} CPD Units
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all">
      <div className="md:flex">
        {/* Certificate Preview */}
        <div className="md:w-2/5 bg-gradient-to-br from-[#0D1642] via-[#1A237E] to-[#283593] p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFB300]/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#FFB300]/10 rounded-full -ml-12 -mb-12"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <Award className="h-8 w-8 text-[#FFB300]" />
              <span className="font-bold text-lg">CCELL-LNU</span>
            </div>
            <div className="mb-4">
              <p className="text-sm opacity-90 mb-2 text-[#FFB300]">Certificate of Completion</p>
              <h3 className="text-2xl font-bold mb-4 leading-tight">{certificate.courseName}</h3>
              <p className="text-lg opacity-90">Awarded to</p>
              <p className="text-2xl font-bold mb-4">{certificate.studentName}</p>
            </div>
          </div>
          <div className="border-t border-white/20 pt-4 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-75">Issue Date</p>
                <p className="font-semibold">
                  {new Date(certificate.issueDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <QrCode className="h-12 w-12 opacity-75" />
            </div>
          </div>
        </div>

        {/* Certificate Details */}
        <div className="md:w-3/5 p-6">
          <div className="mb-6">
            <h4 className="font-semibold text-lg mb-3 text-[#1A237E]">Certificate Details</h4>
            <div className="space-y-3">
              <div className="flex items-start justify-between py-2 border-b">
                <span className="text-gray-600">Certificate ID</span>
                <span className="font-mono font-semibold text-[#1A237E]">{certificate.verificationCode}</span>
              </div>
              <div className="flex items-start justify-between py-2 border-b">
                <span className="text-gray-600">Recipient</span>
                <span className="font-medium">{certificate.studentName}</span>
              </div>
              <div className="flex items-start justify-between py-2 border-b">
                <span className="text-gray-600">Course</span>
                <span className="font-medium text-right max-w-xs">{certificate.courseName}</span>
              </div>
              <div className="flex items-start justify-between py-2 border-b">
                <span className="text-gray-600">Issue Date</span>
                <span className="font-medium">
                  {new Date(certificate.issueDate).toLocaleDateString()}
                </span>
              </div>
              {certificate.cpdUnits && certificate.cpdUnits > 0 && (
                <div className="flex items-start justify-between py-2 border-b">
                  <span className="text-gray-600">CPD Units</span>
                  <span className="font-bold text-[#FFB300]">{certificate.cpdUnits}</span>
                </div>
              )}
              <div className="flex items-start justify-between py-2">
                <span className="text-gray-600">Status</span>
                {getStatusBadge()}
              </div>
            </div>
          </div>

          {/* Verification Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Award className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 mb-1">Verification</p>
                <p className="text-blue-800">
                  This certificate can be verified using the verification tool or at ccell-lnu.edu.ph/verify.
                  Employers can enter the verification code to confirm authenticity.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="space-y-3">
              <div className="flex gap-3 flex-wrap">
                <Button
                  onClick={handleDownload}
                  className="gap-2 bg-gradient-to-r from-[#1A237E] to-[#283593] hover:from-[#283593] hover:to-[#1A237E] text-white"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
                <div className="relative">
                  <Button
                    onClick={() => setShareMenuOpen(!shareMenuOpen)}
                    variant="outline"
                    className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                  <AnimatePresence>
                    {shareMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full mt-2 left-0 bg-white rounded-lg shadow-xl border border-gray-200 p-2 z-50 min-w-[180px]"
                      >
                        <button
                          onClick={handleShareLinkedIn}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-blue-50 text-sm text-gray-700"
                        >
                          <Linkedin className="h-4 w-4 text-blue-600" />
                          LinkedIn
                        </button>
                        <button
                          onClick={handleShareFacebook}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-blue-50 text-sm text-gray-700"
                        >
                          <Facebook className="h-4 w-4 text-blue-700" />
                          Facebook
                        </button>
                        <button
                          onClick={handleShareTwitter}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-blue-50 text-sm text-gray-700"
                        >
                          <Twitter className="h-4 w-4 text-blue-400" />
                          Twitter
                        </button>
                        <div className="border-t border-gray-200 my-1"></div>
                        <button
                          onClick={handleCopyLink}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-50 text-sm text-gray-700"
                        >
                          <Copy className="h-4 w-4 text-gray-600" />
                          Copy Link
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {onVerify && (
                  <Button
                    onClick={onVerify}
                    variant="outline"
                    className="gap-2 border-green-200 text-green-700 hover:bg-green-50"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Verify
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
