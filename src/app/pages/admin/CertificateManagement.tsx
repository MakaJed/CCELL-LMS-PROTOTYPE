import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import {
  Award, Search, Download, CheckCircle, FileText,
  Users, TrendingUp, Calendar, Eye, RefreshCcw, Shield, ExternalLink, Loader2
} from 'lucide-react';
import lnuLogo from "@/assets/LNULOGO.png";
import ccellLogo from "@/assets/CCELLLOGO.png";
import { toast } from 'sonner';
import * as apiV2 from '../../lib/api-v2';

export function CertificateManagement() {
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState<any[]>([]);
  const [page, setPage] = useState({ limit: 20, offset: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCert, setSelectedCert] = useState<any | null>(null);

  const loadCertificates = useCallback(async (nextOffset = 0) => {
    setLoading(true);
    try {
      const result = await apiV2.Admin.getAllCertificates({
        search: searchQuery || undefined,
        limit: page.limit,
        offset: nextOffset,
      });
      setCertificates(result.certificates || []);
      setPage({
        limit: result.page?.limit ?? page.limit,
        offset: result.page?.offset ?? nextOffset,
        total: result.total ?? result.certificates?.length ?? 0,
      });
    } catch (err: any) {
      toast.error('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  }, [page.limit, searchQuery]);

  useEffect(() => { loadCertificates(0); }, [loadCertificates]);

  const filtered = certificates; // server-side filtering

  const now = new Date();
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const stats = {
    total: certificates.length,
    thisMonth: certificates.filter(c => (c.issue_date || '').startsWith(thisMonthKey)).length,
    withCpd: certificates.filter(c => c.cpd_units > 0).length,
    today: certificates.filter(c => (c.issue_date || '').startsWith(now.toISOString().slice(0, 10))).length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 bg-gradient-to-r from-[#0D1642] via-[#1A237E] to-[#283593] text-white p-8 rounded-2xl shadow-xl border-b-4 border-[#FFB300] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFB300]/5 rounded-full -mr-32 -mt-32" />
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <img src={lnuLogo} alt="LNU" className="h-12 w-12" />
              <img src={ccellLogo} alt="CCELL" className="h-12 w-12" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-5 w-5 text-[#FFB300]" />
                <Badge className="bg-[#FFB300]/20 text-[#FFB300] border-[#FFB300]/50">Admin</Badge>
              </div>
              <h1 className="text-3xl font-bold">Certificate Management</h1>
              <p className="text-blue-200">View and verify all issued certificates</p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Issued', value: stats.total, icon: <Award className="h-6 w-6 text-[#1A237E]" />, color: 'border-blue-200', textColor: 'text-[#1A237E]', bg: 'from-[#E8EAF6] to-[#C5CAE9]' },
          { label: 'This Month', value: stats.thisMonth, icon: <TrendingUp className="h-6 w-6 text-[#FFB300]" />, color: 'border-[#FFB300]/30', textColor: 'text-[#FFB300]', bg: 'from-[#FFF8E1] to-[#FFECB3]' },
          { label: 'With CPD Units', value: stats.withCpd, icon: <CheckCircle className="h-6 w-6 text-green-600" />, color: 'border-green-200', textColor: 'text-green-600', bg: 'from-green-50 to-green-100' },
          { label: 'Today', value: stats.today, icon: <Calendar className="h-6 w-6 text-purple-600" />, color: 'border-purple-200', textColor: 'text-purple-600', bg: 'from-purple-50 to-purple-100' },
        ].map((s, i) => (
          <Card key={i} className={`border-2 ${s.color} shadow-md`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">{s.label}</p>
                  <p className={`text-3xl font-bold ${s.textColor}`}>{s.value}</p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-br ${s.bg} rounded-xl flex items-center justify-center`}>
                  {s.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Certificate List */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-[#1A237E] to-[#283593] text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <FileText className="h-5 w-5 text-[#FFB300]" />
                    All Certificates
                  </CardTitle>
                  <CardDescription className="text-blue-200">
                    {loading ? 'Loading...' : `${page.total || filtered.length} certificate${(page.total || filtered.length) !== 1 ? 's' : ''}`}
                  </CardDescription>
                </div>
                <Button size="sm" variant="ghost" onClick={() => loadCertificates(page.offset)} className="text-white hover:bg-white/10 gap-1">
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by student, course, or verification code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') loadCertificates(0); }}
                  className="pl-10"
                />
                <div className="flex justify-end mt-2">
                  <Button size="sm" variant="outline" onClick={() => loadCertificates(0)} className="gap-2">
                    <Search className="h-3.5 w-3.5" /> Apply
                  </Button>
                </div>
              </div>

              {/* Certificates */}
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 rounded-xl animate-pulse bg-gray-100" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12">
                  <Award className="h-12 w-12 mx-auto mb-3 opacity-30 text-gray-400" />
                  <p className="text-gray-500">
                    {searchQuery ? 'No certificates match your search' : 'No certificates issued yet'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {filtered.map((cert) => (
                    <div
                      key={cert.id}
                      className={`border-2 rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${
                        selectedCert?.id === cert.id
                          ? 'border-[#1A237E] bg-[#E8EAF6]/40'
                          : 'border-gray-100 hover:border-[#1A237E]/20'
                      }`}
                      onClick={() => setSelectedCert(cert)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-[#1A237E] text-sm font-mono">{cert.verification_code}</p>
                            <Badge className="bg-green-100 text-green-800 text-xs">Active</Badge>
                          </div>
                          <p className="font-semibold text-sm text-gray-800 truncate">{cert.student_name}</p>
                          <p className="text-xs text-gray-500 truncate">{cert.student_email || '—'}</p>
                        </div>
                        <Button
                          size="sm" variant="ghost"
                          className="text-[#1A237E] shrink-0"
                          onClick={(e) => { e.stopPropagation(); navigate(`/certificate/${cert.id}`); }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="bg-[#E8EAF6] rounded-lg px-3 py-2 mb-2">
                        <p className="font-semibold text-sm text-[#1A237E] truncate">{cert.course_name}</p>
                        {cert.instructor_name && (
                          <p className="text-xs text-gray-600">by {cert.instructor_name}</p>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Issued: {cert.issue_date ? new Date(cert.issue_date).toLocaleDateString('en-PH') : '—'}</span>
                        {cert.cpd_units > 0 && (
                          <Badge className="bg-[#FFF8E1] text-[#FFB300] border-[#FFB300]/30 text-xs">
                            {cert.cpd_units} CPD Units
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* Pagination */}
              {!loading && page.total > page.limit && (
                <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
                  <div>
                    Showing {page.offset + 1} - {Math.min(page.offset + page.limit, page.total)} of {page.total}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={page.offset === 0} onClick={() => loadCertificates(Math.max(page.offset - page.limit, 0))}>Prev</Button>
                    <Button size="sm" variant="outline" disabled={page.offset + page.limit >= page.total} onClick={() => loadCertificates(page.offset + page.limit)}>Next</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {selectedCert ? (
            <>
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-[#FFB300] to-[#FF8F00] rounded-t-lg">
                  <CardTitle className="text-[#1A237E] font-bold">Certificate Details</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">Verification Code</p>
                    <p className="font-bold text-[#1A237E] font-mono text-sm">{selectedCert.verification_code}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">Student</p>
                    <p className="font-semibold">{selectedCert.student_name}</p>
                    <p className="text-sm text-gray-500">{selectedCert.student_email || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">Course</p>
                    <p className="font-semibold">{selectedCert.course_name}</p>
                    {selectedCert.instructor_name && (
                      <p className="text-sm text-gray-500">by {selectedCert.instructor_name}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">Issue Date</p>
                      <p className="text-sm font-medium">
                        {selectedCert.issue_date
                          ? new Date(selectedCert.issue_date).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
                          : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">CPD Units</p>
                      <p className="text-sm font-bold text-[#FFB300]">{selectedCert.cpd_units || 0}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">Status</p>
                    <Badge className="bg-green-100 text-green-800 gap-1">
                      <CheckCircle className="h-3 w-3" /> Active
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-[#1A237E] text-base">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    className="w-full justify-start gap-2 bg-[#1A237E] hover:bg-[#283593] text-white"
                    onClick={() => navigate(`/certificate/${selectedCert.id}`)}
                  >
                    <Eye className="h-4 w-4" />
                    View Certificate
                  </Button>
                  <Button
                    className="w-full justify-start gap-2 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => window.open(`/certificate/${selectedCert.id}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open in New Tab
                  </Button>
                  <Button
                    className="w-full justify-start gap-2"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedCert.verification_code);
                      toast.success('Verification code copied!');
                    }}
                  >
                    <FileText className="h-4 w-4" />
                    Copy Verify Code
                  </Button>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="border-0 shadow-lg">
              <CardContent className="py-12 text-center text-gray-500">
                <Award className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Select a certificate to view details</p>
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-[#1A237E] text-base flex items-center gap-2">
                <Users className="h-4 w-4" /> Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: 'Today', value: stats.today, color: 'text-[#1A237E]', bg: 'bg-blue-50' },
                { label: 'This Month', value: stats.thisMonth, color: 'text-[#FFB300]', bg: 'bg-[#FFF8E1]' },
                { label: 'With CPD', value: stats.withCpd, color: 'text-green-600', bg: 'bg-green-50' },
              ].map((item, i) => (
                <div key={i} className={`flex justify-between items-center p-3 ${item.bg} rounded-lg`}>
                  <span className="text-sm text-gray-700">{item.label}</span>
                  <span className={`font-bold ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
