import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import {
  ArrowLeft,
  Shield,
  Award,
  CheckCircle,
  Calendar,
  User,
  BookOpen,
  Search,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import * as apiV2 from '../../lib/api-v2';

export function InstructorAuditLog() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedClassCode, setSelectedClassCode] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, [selectedCourse, selectedClassCode]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load courses
      const coursesResult = await apiV2.Instructor.getMyCourses();
      setCourses(coursesResult.courses);

      // Load audit log with filters
      const filters: any = {};
      if (selectedCourse !== 'all') {
        filters.course_id = selectedCourse;
      }

      const auditResult = await apiV2.Instructor.getCertificateAuditLog(filters);
      setLogs(auditResult.logs);
    } catch (error: any) {
      console.error('Failed to load audit log:', error);
      toast.error('Failed to load audit log');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadLog = async () => {
    try {
      const result = await apiV2.Instructor.exportAuditLog('csv');
      if (result.dataUrl) {
        const link = document.createElement('a');
        link.href = result.dataUrl;
        link.download = result.filename || 'audit-log.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Audit log exported successfully.');
      }
    } catch (error: any) {
      toast.error('Failed to export audit log');
    }
  };

  const filteredLogs = logs.filter(log => {
    if (selectedCourse !== 'all' && log.courseId !== selectedCourse) return false;
    if (selectedClassCode !== 'all' && log.classCode !== selectedClassCode) return false;
    if (searchQuery && !log.studentName.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !log.studentEmail.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const classCodes = Array.from(new Set(logs.map(l => l.classCode)));

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[var(--royal-blue)] border-r-transparent"></div>
          <p className="mt-4" style={{ color: 'var(--muted-foreground)' }}>Loading audit log...</p>
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
          onClick={() => navigate('/instructor/dashboard')}
          className="gap-2 mb-4"
          style={{ color: 'var(--royal-blue)' }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="p-6 shadow-xl" style={{
          background: 'linear-gradient(to right, var(--royal-blue-darker), var(--royal-blue), var(--royal-blue-light))',
          borderRadius: 'var(--radius-xl)',
          borderBottom: '3px solid var(--gold)'
        }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 flex items-center justify-center" style={{ background: 'var(--gold)', borderRadius: 'var(--radius-lg)' }}>
                <Shield className="h-6 w-6" style={{ color: 'var(--royal-blue)' }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Certificate Audit Log</h1>
                <p className="text-white/70">Historical record of grade finalizations and certificate issuances</p>
              </div>
            </div>
            <Button className="gap-2 bg-white text-[var(--royal-blue)]" onClick={handleDownloadLog}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg mb-6" style={{ background: 'var(--card)' }}>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>Search Students</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>Filter by Course</label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>Filter by Class Code</label>
              <Select value={selectedClassCode} onValueChange={setSelectedClassCode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Class Codes</SelectItem>
                  {classCodes.map(code => (
                    <SelectItem key={code} value={code}>{code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card className="border-0 shadow-lg" style={{ background: 'var(--card)' }}>
        <CardHeader>
          <CardTitle style={{ color: 'var(--royal-blue)' }}>Audit Records</CardTitle>
          <CardDescription>
            {filteredLogs.length} record{filteredLogs.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 mx-auto mb-3" style={{ color: 'var(--muted-foreground)' }} />
              <p style={{ color: 'var(--muted-foreground)' }}>No audit records found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map(log => (
                <div key={log.id} className="border-2 p-4" style={{ borderColor: 'var(--border)', borderRadius: 'var(--radius-lg)' }}>
                  {/* Student Info */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 flex items-center justify-center" style={{ background: 'var(--accent-blue-50)', borderRadius: 'var(--radius-lg)' }}>
                        <User className="h-5 w-5" style={{ color: 'var(--royal-blue)' }} />
                      </div>
                      <div>
                        <p className="font-semibold" style={{ color: 'var(--foreground)' }}>{log.studentName}</p>
                        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{log.studentEmail}</p>
                      </div>
                    </div>
                    <Badge style={{
                      background: log.certificateIssuedAt ? 'var(--accent-green-50)' : log.status === 'disputed' ? 'var(--accent-red-50)' : 'var(--accent-gold-50)',
                      color: log.certificateIssuedAt ? 'var(--success)' : log.status === 'disputed' ? 'var(--destructive)' : 'var(--gold)'
                    }}>
                      {log.certificateIssuedAt ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Issued
                        </>
                      ) : log.status === 'disputed' ? (
                        'Disputed'
                      ) : (
                        'Pending'
                      )}
                    </Badge>
                  </div>

                  {/* Course & Grade Info */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <BookOpen className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
                        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Course</p>
                      </div>
                      <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{log.courseName}</p>
                      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{log.classCode}</p>
                    </div>

                    <div>
                      <p className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Final Grade</p>
                      <p className="text-lg font-bold" style={{ color: 'var(--royal-blue)' }}>{log.finalGrade.toFixed(2)}%</p>
                      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>GWA: {log.gwa}</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
                        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Grade Finalized</p>
                      </div>
                      <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                        {new Date(log.gradeFinalizedAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        {new Date(log.gradeFinalizedAt).toLocaleTimeString()}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Award className="h-4 w-4" style={{ color: log.certificateIssuedAt ? 'var(--success)' : 'var(--muted-foreground)' }} />
                        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Certificate Issued</p>
                      </div>
                      {log.certificateIssuedAt ? (
                        <>
                          <p className="text-sm" style={{ color: 'var(--success)' }}>
                            {new Date(log.certificateIssuedAt).toLocaleDateString()}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                            {new Date(log.certificateIssuedAt).toLocaleTimeString()}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                          {log.status === 'disputed' ? 'Disputed' : 'Not yet issued'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Certificate ID */}
                  {log.certificateId && (
                    <div className="p-3 rounded-lg mb-3" style={{ background: 'var(--accent-green-50)' }}>
                      <p className="text-xs mb-1" style={{ color: 'var(--success)' }}>Certificate ID:</p>
                      <p className="text-sm font-mono" style={{ color: 'var(--success)' }}>{log.certificateId}</p>
                    </div>
                  )}

                  {/* Dispute Note */}
                  {log.status === 'disputed' && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                      <p className="text-sm text-red-900">
                        <strong>Dispute:</strong> Student claims they did not receive certificate. Please verify completion status and essay grades.
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  {log.certificateId && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => navigate(`/certificate/${log.certificateId}`)}>
                        View Certificate
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
