import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Input } from '../../components/ui/input';
import {
  Award,
  Download,
  Share2,
  Calendar,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Eye,
  AlertCircle,
  Star,
  Trophy,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import * as apiV2 from '../../lib/api-v2';
import { useAuth } from '../../../lib/AuthContext';

export function StudentCertificates() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [page, setPage] = useState({ limit: 12, offset: 0, total: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');

  useEffect(() => {
    loadCertificates(0);
  }, [filterType, sortBy]);

  const loadCertificates = async (nextOffset = 0) => {
    setLoading(true);
    try {
      const result = await apiV2.Student.getCertificates({
        search: searchQuery || undefined,
        enrollment_type: filterType === 'all' ? undefined : (filterType === 'academe' ? 'academe_student' : 'certificatory'),
        limit: page.limit,
        offset: nextOffset,
      });
      setCertificates((result.certificates || []).map((c: any) => ({
        ...c,
        course_title: c.course_name || c.course_title || 'Unknown Course',
        issued_at: c.issue_date || c.issued_at || new Date().toISOString(),
      })));
      setPage({
        limit: result.page?.limit ?? page.limit,
        offset: result.page?.offset ?? nextOffset,
        total: result.total ?? result.certificates?.length ?? 0,
      });
    } catch (error: any) {
      console.error('Failed to load certificates:', error);
      toast.error('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (certificateId: string) => {
    navigate(`/certificate/${certificateId}`);
  };

  const handleShare = (certificate: any) => {
    const shareUrl = `${window.location.origin}/certificate/${certificate.id}`;
    if (navigator.share) {
      navigator.share({
        title: 'My Certificate',
        text: `I completed ${certificate.course_title}!`,
        url: shareUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Certificate link copied to clipboard!');
    }
  };

  const filteredCertificates = certificates.sort((a, b) => {
    if (sortBy === 'date_asc') {
      return new Date(a.issued_at).getTime() - new Date(b.issued_at).getTime();
    }
    return new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime();
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[var(--royal-blue)] border-r-transparent"></div>
          <p className="mt-4" style={{ color: 'var(--muted-foreground)' }}>Loading certificates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8 bg-gradient-to-r from-[#090F2E] via-[#1A237E] to-[#283593] text-white p-6 rounded-2xl shadow-xl border-b-[3px] border-[#FFB300]">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Award className="h-7 w-7 text-[#FFB300]" />
              <h1 className="text-2xl font-bold">My Certificates</h1>
            </div>
            <p className="text-blue-200/70">View, download, and share your earned certificates</p>
          </div>
          <Badge className="bg-[#FFB300] text-[#1A237E] text-lg px-4 py-2">
            {(page.total || filteredCertificates.length)} {(page.total || filteredCertificates.length) === 1 ? 'Certificate' : 'Certificates'}
          </Badge>
        </div>
      </div>

      {/* Filters & Search */}
      <Card className="border-0 shadow-lg mb-6" style={{ background: 'var(--card)' }}>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
              <Input
                placeholder="Search certificates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') loadCertificates(0); }}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Certificates</SelectItem>
                <SelectItem value="academe">Academe Only</SelectItem>
                <SelectItem value="certificatory">Certificatory Only</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date_desc">Newest First</SelectItem>
                <SelectItem value="date_asc">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <div className="px-6 pb-6 flex justify-end">
          <Button size="sm" variant="outline" onClick={() => loadCertificates(0)} className="gap-2">
            <Search className="h-3.5 w-3.5" /> Apply
          </Button>
        </div>
      </Card>

      {/* Certificates Grid */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-32 rounded-xl animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : filteredCertificates.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="py-12">
            <div className="text-center">
              <Award className="h-16 w-16 mx-auto mb-4" style={{ color: 'var(--muted-foreground)' }} />
              <h3 className="font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                {searchQuery || filterType !== 'all' ? 'No certificates found' : 'No certificates yet'}
              </h3>
              <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
                {searchQuery || filterType !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Complete a course to earn your first certificate!'}
              </p>
              {!searchQuery && filterType === 'all' && (
                <Button onClick={() => navigate('/catalog')} style={{ background: 'var(--royal-blue)', color: 'white' }}>
                  Browse Courses
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCertificates.map((certificate) => (
            <Card key={certificate.id} className="border-0 shadow-lg hover:shadow-xl transition-all group">
              <CardHeader className="pb-3" style={{ background: 'linear-gradient(to br, var(--accent-blue-50), white)' }}>
                <div className="flex items-start justify-between mb-2">
                  <Badge style={{
                    background: certificate.enrollment_type === 'academe_student' ? 'var(--accent-blue-50)' : 'var(--accent-gold-50)',
                    color: certificate.enrollment_type === 'academe_student' ? 'var(--royal-blue)' : 'var(--gold)'
                  }}>
                    {certificate.enrollment_type === 'academe_student' ? 'Academe' : 'Certificatory'}
                  </Badge>
                  {certificate.status === 'verified' && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                </div>
                <CardTitle className="text-base line-clamp-2" style={{ color: 'var(--royal-blue)' }}>
                  {certificate.course_title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  <Calendar className="h-4 w-4" />
                  <span>Issued {new Date(certificate.issued_at).toLocaleDateString()}</span>
                </div>

                {certificate.cpd_units && (
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4" style={{ color: 'var(--gold)' }} />
                    <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                      {certificate.cpd_units} CPD Units
                    </span>
                  </div>
                )}

                <div className="pt-3 border-t flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1"
                    onClick={() => navigate(`/certificate/${certificate.id}`)}
                  >
                    <Eye className="h-3 w-3" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1"
                    style={{ background: 'var(--royal-blue)', color: 'white' }}
                    onClick={() => handleDownload(certificate.id)}
                  >
                    <Download className="h-3 w-3" />
                    Download
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleShare(certificate)}
                  >
                    <Share2 className="h-3 w-3" />
                  </Button>
                </div>

                <div className="pt-2 border-t">
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Verification:</p>
                  <code className="text-xs font-mono block mt-1" style={{ color: 'var(--foreground)' }}>
                    {certificate.verification_code}
                  </code>
                </div>
              </CardContent>
            </Card>
            ))}
          </div>
          {!loading && page.total > page.limit && (
            <div className="flex items-center justify-between mt-6 text-sm text-gray-600">
              <div>
                Showing {page.offset + 1} - {Math.min(page.offset + page.limit, page.total)} of {page.total}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page.offset === 0} onClick={() => loadCertificates(Math.max(page.offset - page.limit, 0))}>Prev</Button>
                <Button size="sm" variant="outline" disabled={page.offset + page.limit >= page.total} onClick={() => loadCertificates(page.offset + page.limit)}>Next</Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Badges Section */}
      <Card className="border-0 shadow-lg mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: 'var(--royal-blue)' }}>
            <Trophy className="h-5 w-5" style={{ color: 'var(--gold)' }} />
            Badges & Achievements
          </CardTitle>
          <CardDescription>Milestones you've unlocked on your learning journey</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {[
              { icon: Star, label: 'First Step', desc: 'Completed your first lesson', earned: true, color: 'var(--gold)' },
              { icon: Award, label: 'Course Completer', desc: 'Finished a full course', earned: certificates.length > 0, color: 'var(--royal-blue)' },
              { icon: Zap, label: 'Quick Learner', desc: 'Finished a module in one day', earned: certificates.length > 0, color: '#7C3AED' },
              { icon: Trophy, label: 'Top Scorer', desc: 'Scored 90%+ on a quiz', earned: false, color: '#059669' },
              { icon: CheckCircle, label: 'Consistent', desc: 'Logged in 7 days in a row', earned: false, color: '#0284C7' },
              { icon: Star, label: 'Academe Star', desc: 'Earned an Academe certificate', earned: certificates.some((c: any) => c.enrollment_type === 'academe_student'), color: '#EA580C' },
            ].map((badge, idx) => (
              <div
                key={idx}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all ${badge.earned ? 'opacity-100' : 'opacity-40 grayscale'}`}
                style={{ borderColor: badge.earned ? badge.color : 'var(--border)', background: badge.earned ? 'var(--accent-blue-50)' : 'transparent' }}
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: badge.earned ? badge.color + '22' : 'transparent', border: `2px solid ${badge.color}` }}>
                  <badge.icon className="h-6 w-6" style={{ color: badge.color }} />
                </div>
                <p className="text-xs font-semibold leading-tight" style={{ color: 'var(--foreground)' }}>{badge.label}</p>
                <p className="text-[10px] leading-tight" style={{ color: 'var(--muted-foreground)' }}>{badge.desc}</p>
                {badge.earned && <span className="text-[10px] font-bold text-green-600">Earned</span>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Certificates Section */}
      {user?.role === 'student' && (
        <Card className="border-2 shadow-lg mt-8" style={{ borderColor: 'var(--gold-light)', background: 'var(--accent-gold-50)' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: 'var(--gold)' }}>
              <Clock className="h-5 w-5" />
              Waiting for Certificates
            </CardTitle>
            <CardDescription style={{ color: 'var(--gold-dark)' }}>
              Certificates pending instructor finalization (Academe students only)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-white">
              <AlertCircle className="h-5 w-5 mt-0.5" style={{ color: 'var(--gold)' }} />
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                  Your instructor will finalize your grade after reviewing all essays
                </p>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  Once finalized, your certificate will appear here automatically. Check back soon!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
