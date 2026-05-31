import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import {
  Users,
  GraduationCap,
  CreditCard,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Award,
  ArrowLeft,
  FileText,
  Eye,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import * as apiV2 from '../../lib/api-v2';

export function InstructorStudents() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedClassCode, setSelectedClassCode] = useState('all');
  const [academeStudents, setAcademeStudents] = useState<any[]>([]);
  const [certificatoryStudents, setCertificatoryStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [classCodes, setClassCodes] = useState<string[]>([]);

  const activeTab = searchParams.get('tab') || 'academe';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load instructor's courses
      const coursesResult = await apiV2.Instructor.getMyCourses();
      setCourses(coursesResult.courses || []);

      const studentsResult = await apiV2.Instructor.getStudentProgress();
      const allStudents = (studentsResult.students || []).map((s: any) => ({
        id: s.id,
        enrollmentId: s.enrollment_id,
        name: s.name,
        email: s.email,
        courseId: s.course_id,
        courseName: s.course_title,
        classCode: s.class_code || '',
        section: s.section || '',
        progress: s.progress_percentage || 0,
        status: s.status,
        enrolledAt: s.enrolled_at,
        expiresAt: s.expires_at,
        enrollmentType: s.enrollment_type,
        enrollMonth: s.enrolled_at ? new Date(s.enrolled_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '',
        hasUngradedEssays: false,
        readyForFinalization: s.status === 'completed' || s.progress_percentage >= 100,
      }));

      setAcademeStudents(allStudents.filter((s: any) => s.enrollmentType === 'academe_student' && s.classCode));
      setCertificatoryStudents(allStudents.filter((s: any) => s.enrollmentType === 'certificatory' || s.enrollmentType === 'academe_paid'));

      const codes = [...new Set(allStudents.filter((s: any) => s.classCode).map((s: any) => s.classCode))] as string[];
      setClassCodes(codes);
    } catch (error: any) {
      console.error('Failed to load students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  const handleReopenCourse = async (enrollmentId: string) => {
    try {
      await apiV2.Instructor.grantExtension(enrollmentId, 30);
      toast.success('Course access extended by 30 days.');
      await loadData();
    } catch (error: any) {
      toast.error('Failed to reopen course access');
    }
  };

  const handleFinalizeGrade = async (enrollmentId: string) => {
    try {
      await apiV2.Instructor.finalizeGrade(enrollmentId, { final_grade: 100 });
      toast.success('Grade finalized! Certificate issued if student has 100% progress.');
      await loadData();
    } catch (error: any) {
      toast.error('Failed to finalize grade');
    }
  };

  const filteredAcademe = academeStudents.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse = selectedCourse === 'all' || student.courseId === selectedCourse;
    const matchesClassCode = selectedClassCode === 'all' || student.classCode === selectedClassCode;
    return matchesSearch && matchesCourse && matchesClassCode;
  });

  // Group academe students by class code (section/block)
  const academeBySection = filteredAcademe.reduce((acc: Record<string, any[]>, s) => {
    const key = s.classCode || 'No Class Code';
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  const filteredCertificatory = certificatoryStudents
    .filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           student.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCourse = selectedCourse === 'all' || student.courseId === selectedCourse;
      return matchesSearch && matchesCourse;
    })
    .sort((a, b) => new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime());

  // Group certificatory students by enrollment month
  const certByMonth = filteredCertificatory.reduce((acc: Record<string, any[]>, s) => {
    const key = s.enrollMonth || 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[var(--royal-blue)] border-r-transparent"></div>
          <p className="mt-4" style={{ color: 'var(--muted-foreground)' }}>Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="p-6 shadow-xl" style={{
          background: 'linear-gradient(to right, var(--royal-blue-darker), var(--royal-blue), var(--royal-blue-light))',
          borderRadius: 'var(--radius-xl)',
          borderBottom: '3px solid var(--gold)'
        }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center" style={{ background: 'var(--gold)', borderRadius: 'var(--radius-lg)' }}>
              <Users className="h-6 w-6" style={{ color: 'var(--royal-blue)' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Student Management</h1>
              <p className="text-white/70">Manage students across all your courses</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg mb-6" style={{ background: 'var(--card)' }}>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
              <Input
                placeholder="Search students by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                style={{ background: 'var(--input-background)' }}
              />
            </div>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="All Courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map(course => (
                  <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {activeTab === 'academe' && (
              <Select value={selectedClassCode} onValueChange={setSelectedClassCode}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="All Class Codes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Class Codes</SelectItem>
                  {classCodes.map(code => (
                    <SelectItem key={code} value={code}>{code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="academe" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            Academe (Class Code)
            <Badge className="ml-2" style={{ background: 'var(--accent-blue-50)', color: 'var(--royal-blue)' }}>
              {academeStudents.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="certificatory" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Paid Students
            <Badge className="ml-2" style={{ background: 'var(--accent-gold-50)', color: 'var(--gold)' }}>
              {certificatoryStudents.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Academe Students Tab */}
        <TabsContent value="academe">
          <Card className="border-0 shadow-lg" style={{ background: 'var(--card)' }}>
            <CardHeader style={{ background: 'linear-gradient(to right, var(--royal-blue), var(--royal-blue-light))', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0' }}>
              <CardTitle className="text-white flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Class Code Students
              </CardTitle>
              <CardDescription className="text-white/70">
                Students enrolled via class codes - manage by section
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {filteredAcademe.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto mb-3" style={{ color: 'var(--muted-foreground)' }} />
                  <p style={{ color: 'var(--muted-foreground)' }}>No students found</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(academeBySection).map(([sectionCode, sectionStudents]) => (
                    <div key={sectionCode}>
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b-2" style={{ borderColor: 'var(--royal-blue)' }}>
                        <GraduationCap className="h-4 w-4" style={{ color: 'var(--royal-blue)' }} />
                        <span className="font-bold text-sm font-mono" style={{ color: 'var(--royal-blue)' }}>Class Code: {sectionCode}</span>
                        <span className="text-xs ml-auto" style={{ color: 'var(--muted-foreground)' }}>{(sectionStudents as any[]).length} students</span>
                      </div>
                      <div className="space-y-4">
                  {(sectionStudents as any[]).map(student => (
                    <div key={student.id} className="border-2 p-4 hover:shadow-md transition-all" style={{ borderColor: 'var(--border)', borderRadius: 'var(--radius-lg)' }}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>{student.name}</h3>
                          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{student.email}</p>
                        </div>
                        <Badge style={{ background: student.status === 'active' ? 'var(--accent-blue-50)' : 'var(--muted)', color: student.status === 'active' ? 'var(--royal-blue)' : 'var(--muted-foreground)' }}>
                          {student.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-sm">
                        <div>
                          <p style={{ color: 'var(--muted-foreground)' }}>Course</p>
                          <p className="font-medium" style={{ color: 'var(--foreground)' }}>{student.courseName}</p>
                        </div>
                        <div>
                          <p style={{ color: 'var(--muted-foreground)' }}>Class Code</p>
                          <p className="font-mono font-medium" style={{ color: 'var(--royal-blue)' }}>{student.classCode}</p>
                        </div>
                        <div>
                          <p style={{ color: 'var(--muted-foreground)' }}>Progress</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 rounded-full" style={{ background: 'var(--muted)' }}>
                              <div className="h-full rounded-full" style={{ background: 'var(--royal-blue)', width: `${student.progress}%` }} />
                            </div>
                            <span className="font-medium" style={{ color: 'var(--royal-blue)' }}>{student.progress}%</span>
                          </div>
                        </div>
                        <div>
                          <p style={{ color: 'var(--muted-foreground)' }}>Expires</p>
                          <p className="font-medium" style={{ color: 'var(--foreground)' }}>{new Date(student.expiresAt).toLocaleDateString()}</p>
                        </div>
                      </div>

                      {student.hasUngradedEssays && (
                        <div className="mb-3 p-2 rounded-lg flex items-center gap-2" style={{ background: 'var(--accent-gold-50)' }}>
                          <FileText className="h-4 w-4" style={{ color: 'var(--gold)' }} />
                          <p className="text-sm font-medium" style={{ color: 'var(--gold)' }}>Has ungraded essays</p>
                        </div>
                      )}

                      {student.readyForFinalization && (
                        <div className="mb-3 p-2 rounded-lg flex items-center gap-2 bg-green-50">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <p className="text-sm font-medium text-green-700">Ready for grade finalization</p>
                        </div>
                      )}

                      <div className="flex gap-2 flex-wrap">
                        {student.hasUngradedEssays && (
                          <Button size="sm" className="gap-1" style={{ background: 'var(--gold)', color: 'var(--royal-blue)' }}>
                            <FileText className="h-3.5 w-3.5" />
                            Grade Essays
                          </Button>
                        )}
                        {student.readyForFinalization && (
                          <Button size="sm" className="gap-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => handleFinalizeGrade(student.id)}>
                            <CheckCircle className="h-3.5 w-3.5" />
                            Finalize Grade
                          </Button>
                        )}
                        {student.status === 'expired' && (
                          <Button size="sm" variant="outline" className="gap-1" onClick={() => handleReopenCourse(student.id)}>
                            <RotateCcw className="h-3.5 w-3.5" />
                            Reopen Access
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="gap-1">
                          <Eye className="h-3.5 w-3.5" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Certificatory Students Tab */}
        <TabsContent value="certificatory">
          <Card className="border-0 shadow-lg" style={{ background: 'var(--card)' }}>
            <CardHeader style={{ background: 'linear-gradient(to right, var(--gold), var(--gold-light))', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0' }}>
              <CardTitle className="flex items-center gap-2" style={{ color: 'var(--royal-blue)' }}>
                <CreditCard className="h-5 w-5" />
                Paid Students
              </CardTitle>
              <CardDescription style={{ color: 'var(--royal-blue-light)' }}>
                Students who paid for courses - sorted by enrollment month
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {filteredCertificatory.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto mb-3" style={{ color: 'var(--muted-foreground)' }} />
                  <p style={{ color: 'var(--muted-foreground)' }}>No paid students found</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(certByMonth).map(([month, monthStudents]) => (
                    <div key={month}>
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b-2" style={{ borderColor: 'var(--gold)' }}>
                        <CreditCard className="h-4 w-4" style={{ color: 'var(--gold)' }} />
                        <span className="font-bold text-sm" style={{ color: 'var(--gold)' }}>{month}</span>
                        <span className="text-xs ml-auto" style={{ color: 'var(--muted-foreground)' }}>{(monthStudents as any[]).length} students</span>
                      </div>
                      <div className="space-y-4">
                        {(monthStudents as any[]).map(student => (
                          <div key={student.id} className="border-2 p-4" style={{ borderColor: 'var(--border)', borderRadius: 'var(--radius-lg)' }}>
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>{student.name}</h3>
                                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{student.email}</p>
                              </div>
                              <Badge style={{ background: 'var(--accent-gold-50)', color: 'var(--gold)' }}>
                                Certificatory Client
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3 text-sm">
                              <div>
                                <p style={{ color: 'var(--muted-foreground)' }}>Course</p>
                                <p className="font-medium" style={{ color: 'var(--foreground)' }}>{student.courseName}</p>
                              </div>
                              <div>
                                <p style={{ color: 'var(--muted-foreground)' }}>Enrolled</p>
                                <p className="font-medium" style={{ color: 'var(--foreground)' }}>{student.enrollMonth}</p>
                              </div>
                              <div>
                                <p style={{ color: 'var(--muted-foreground)' }}>Progress</p>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-2 rounded-full" style={{ background: 'var(--muted)' }}>
                                    <div className="h-full rounded-full" style={{ background: 'var(--gold)', width: `${student.progress}%` }} />
                                  </div>
                                  <span className="font-medium" style={{ color: 'var(--gold)' }}>{student.progress}%</span>
                                </div>
                              </div>
                            </div>

                            <div className="p-3 rounded-lg mb-3" style={{ background: 'var(--accent-gold-50)' }}>
                              <p className="text-sm" style={{ color: 'var(--gold)' }}>
                                <strong>Note:</strong> Essays are non-graded. Certificate issued automatically at 100%.
                              </p>
                            </div>

                            <Button size="sm" variant="outline" className="gap-1" onClick={() => navigate(`/instructor/grade-book?enrollmentId=${student.enrollmentId || student.id}`)}>
                              <Eye className="h-3.5 w-3.5" />
                              View Progress
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
