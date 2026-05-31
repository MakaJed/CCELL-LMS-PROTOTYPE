import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Award, QrCode, CheckCircle, X, Download } from 'lucide-react';
import { Badge } from './ui/badge';

interface CertificatePreviewModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  certificate: {
    studentName: string;
    courseName: string;
    issueDate: string;
    verificationCode?: string;
    cpdUnits?: number;
  };
  isIssuing?: boolean;
}

export function CertificatePreviewModal({
  open,
  onClose,
  onConfirm,
  certificate,
  isIssuing = false,
}: CertificatePreviewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#1A237E] flex items-center gap-2">
            <Award className="h-5 w-5 text-[#FFB300]" />
            Certificate Preview
          </DialogTitle>
          <DialogDescription>
            Review the certificate details before issuing. Make sure all information is correct.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Certificate Preview */}
          <div className="border-2 border-[#FFB300]/30 rounded-xl overflow-hidden">
            <div className="bg-gradient-to-br from-[#0D1642] via-[#1A237E] to-[#283593] p-8 text-white relative overflow-hidden">
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
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <QrCode className="h-12 w-12 opacity-75" />
                </div>
              </div>
            </div>

            {/* Details Section */}
            <div className="bg-white p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Certificate Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Recipient Name</p>
                  <p className="font-semibold text-gray-900">{certificate.studentName}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Course Name</p>
                  <p className="font-semibold text-gray-900">{certificate.courseName}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Issue Date</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(certificate.issueDate).toLocaleDateString()}
                  </p>
                </div>
                {certificate.cpdUnits && certificate.cpdUnits > 0 && (
                  <div className="bg-gradient-to-r from-[#FFB300]/10 to-[#FF8F00]/10 rounded-lg p-3 border border-[#FFB300]/30">
                    <p className="text-xs text-gray-600 mb-1">CPD Units</p>
                    <p className="font-bold text-[#FFB300] text-lg">{certificate.cpdUnits}</p>
                  </div>
                )}
                {certificate.verificationCode && (
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 col-span-2">
                    <p className="text-xs text-gray-600 mb-1">Verification Code</p>
                    <p className="font-mono font-semibold text-blue-900">{certificate.verificationCode}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Verification Checklist */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Pre-Issuance Checklist
            </h4>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Student name is spelled correctly
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Course name is accurate
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Issue date is correct
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Student has completed all course requirements
              </li>
            </ul>
          </div>

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-900">
              <strong>Important:</strong> Once issued, certificates cannot be revoked. Please ensure all
              information is correct before confirming.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button onClick={onClose} variant="outline" className="gap-2">
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isIssuing}
              className="gap-2 bg-gradient-to-r from-[#FFB300] to-[#FF8F00] hover:from-[#FF8F00] hover:to-[#FFB300] text-[#1A237E] font-bold"
            >
              <Award className="h-4 w-4" />
              {isIssuing ? 'Issuing Certificate...' : 'Confirm & Issue Certificate'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
