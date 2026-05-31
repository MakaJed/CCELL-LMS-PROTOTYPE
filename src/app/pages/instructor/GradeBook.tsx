import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import {
  ArrowLeft,
  BookOpen,
  Award,
  CheckCircle,
  AlertTriangle,
  Search,
  FileText,
  Calculator
} from 'lucide-react';
import { toast } from 'sonner';
import { percentageToGWA } from '../../lib/gwa-calculator';
import * as apiV2 from '../../lib/api-v2';

export function InstructorGradeBook() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedClassCode, setSelectedClassCode] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    loadData();
  }, [selectedCourse, selectedClassCode]);

  useEffect(() => {
    const targetId = searchParams.get('enrollmentId');
    if (!targetId || students.length === 0) return;
    const match = students.find(s => String(s.enrollmentId) === targetId || String(s.id) === targetId);
    if (match) {
      handleViewDetails(match);
      const el = document.getElementById(`student-${match.id}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [students, searchParams]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load courses
      const coursesResult = await apiV2.Instructor.getMyCourses();
      setCourses(coursesResult.courses);

      // Load grade book with filters
      const filters: any = {};
      if (selectedCourse !== 'all') {
        filters.course_id = selectedCourse;
      }
      if (selectedClassCode !== 'all') {
        filters.class_code_id = selectedClassCode;
      }

      const gradeBookResult = await apiV2.Instructor.getGradeBook(filters);
      const normalized = (gradeBookResult.grades || []).map((g: any) => ({
        ...g,
        classCode: g.classCode || g.class_code || '',
        classCodeId: g.classCodeId || g.class_code_id || '',
      }));
      setStudents(normalized);
    } catch (error: any) {
      console.error('Failed to load grade book:', error);
      toast.error('Failed to load grade book data');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (student: any) => {
    setSelectedStudent(student);
    setDetailsDialogOpen(true);
  };

  const handleFinalizeGrade = async (student: any) => {
    try {
      const finalGradeVal = student.finalGrade ?? student.averageScore ?? 0;
      await apiV2.Instructor.finalizeGrade(student.enrollmentId || student.id, {
        final_grade: finalGradeVal,
        gwa: student.gwa,
        notes: `Finalized on ${new Date().toLocaleDateString()}`
      });
      toast.success('Grade finalized successfully!');
      await loadData();
    } catch (error: any) {
      toast.error('Failed to finalize grade');
    }
  };

  const filteredStudents = students.filter(student => {
    if (selectedCourse !== 'all' && student.courseId !== selectedCourse) return false;
    if (selectedClassCode !== 'all' && student.classCodeId !== selectedClassCode) return false;
    if (searchQuery && !student.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !student.email.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const classCodes = Array.from(new Map(students
    .filter(s => s.classCodeId && s.classCode)
    .map(s => [s.classCodeId, s.classCode])
  ).entries()).map(([id, code]) => ({ id, code }));

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[var(--royal-blue)] border-r-transparent"></div>
          <p className="mt-4" style={{ color: 'var(--muted-foreground)' }}>Loading grade book...</p>
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
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center" style={{ background: 'var(--gold)', borderRadius: 'var(--radius-lg)' }}>
              <BookOpen className="h-6 w-6" style={{ color: 'var(--royal-blue)' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Grade Book Ledger</h1>
              <p className="text-white/70">View automated and manual scores for Class Code students</p>
            </div>
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
                  {classCodes.map(cc => (
                    <SelectItem key={cc.id} value={cc.id}>{cc.code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grade Book Table */}
      <Card className="border-0 shadow-lg" style={{ background: 'var(--card)' }}>
        <CardHeader>
          <CardTitle style={{ color: 'var(--royal-blue)' }}>Student Grades</CardTitle>
          <CardDescription>
            {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} in ledger
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto mb-3" style={{ color: 'var(--muted-foreground)' }} />
              <p style={{ color: 'var(--muted-foreground)' }}>No students found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredStudents.map(student => (
                <div key={student.id} id={`student-${student.id}`} className="border-2 p-4" style={{ borderColor: 'var(--border)', borderRadius: 'var(--radius-lg)' }}>
                  {/* Student Info */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="font-semibold" style={{ color: 'var(--foreground)' }}>{student.name}</p>
                      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{student.email}</p>
                      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                        {student.course_title}{student.classCode ? ` • ${student.classCode}` : ''}
                      </p>
                    </div>
                    {(() => {
                      const readyToFinalize = (student.progressPercentage || 0) >= 100 && !student.finalGrade && student.enrollmentType === 'academe_student';
                      const hasPendingEssays = (student.pendingEssaysCount || 0) > 0;
                      if (student.finalGrade) return <Badge style={{ background: 'var(--accent-green-50)', color: 'var(--success)' }}><CheckCircle className="h-3 w-3 mr-1" />Finalized</Badge>;
                      if (hasPendingEssays) return <Badge style={{ background: 'var(--accent-gold-50)', color: 'var(--gold)' }}><AlertTriangle className="h-3 w-3 mr-1" />Pending Essays ({student.pendingEssaysCount})</Badge>;
                      if (readyToFinalize) return <Badge style={{ background: 'var(--accent-green-50)', color: 'var(--success)' }}><CheckCircle className="h-3 w-3 mr-1" />Ready to Finalize</Badge>;
                      return <Badge style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>In Progress</Badge>;
                    })()}
                  </div>

                  {/* Scores Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="p-3 rounded-lg" style={{ background: 'var(--accent-blue-50)' }}>
                      <div className="flex items-center gap-2 mb-1">
                        <Calculator className="h-4 w-4" style={{ color: 'var(--royal-blue)' }} />
                        <p className="text-xs" style={{ color: 'var(--royal-blue)' }}>Avg Quiz Score</p>
                      </div>
                      <p className="text-xl font-bold" style={{ color: 'var(--royal-blue)' }}>
                        {student.averageScore != null ? `${student.averageScore}%` : '—'}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--royal-blue-light)' }}>Automated</p>
                    </div>

                    <div className="p-3 rounded-lg" style={{ background: 'var(--accent-gold-50)' }}>
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="h-4 w-4" style={{ color: 'var(--gold)' }} />
                        <p className="text-xs" style={{ color: 'var(--gold)' }}>Essays</p>
                      </div>
                      <p className="text-xl font-bold" style={{ color: 'var(--gold)' }}>
                        {student.pendingEssaysCount > 0 ? `${student.pendingEssaysCount} pending` : 'Graded'}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--gold-dark)' }}>Manual</p>
                    </div>

                    <div className="p-3 rounded-lg" style={{ background: 'var(--muted)' }}>
                      <p className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Final Grade</p>
                      <p className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
                        {student.finalGrade !== null ? `${student.finalGrade.toFixed(2)}%` : 'N/A'}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Percentage</p>
                    </div>

                    {(() => {
                      const displayGwa = student.gwa ?? (student.finalGrade != null ? percentageToGWA(student.finalGrade) : null);
                      return (
                        <div className="p-3 rounded-lg" style={{ background: displayGwa ? 'var(--accent-green-50)' : 'var(--muted)' }}>
                          <div className="flex items-center gap-2 mb-1">
                            <Award className="h-4 w-4" style={{ color: displayGwa ? 'var(--success)' : 'var(--muted-foreground)' }} />
                            <p className="text-xs" style={{ color: displayGwa ? 'var(--success)' : 'var(--muted-foreground)' }}>GWA</p>
                          </div>
                          <p className="text-xl font-bold" style={{ color: displayGwa ? 'var(--success)' : 'var(--muted-foreground)' }}>
                            {displayGwa !== null && displayGwa !== undefined ? displayGwa.toFixed(2) : 'N/A'}
                          </p>
                          <p className="text-xs" style={{ color: displayGwa ? 'var(--success)' : 'var(--muted-foreground)' }}>Grade Point</p>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleViewDetails(student)}>
                      View Breakdown
                    </Button>
                    {(student.pendingEssaysCount || 0) > 0 && (
                      <Button size="sm" onClick={() => navigate('/instructor/grading')}>
                        Grade Essays ({student.pendingEssaysCount})
                      </Button>
                    )}
                    {(student.progressPercentage || 0) >= 100 && !student.finalGrade && student.enrollmentType === 'academe_student' && (
                      <Button size="sm" className="gap-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => handleFinalizeGrade(student)}>
                        <CheckCircle className="h-4 w-4" />
                        Finalize Grade
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--royal-blue)' }}>Grade Breakdown</DialogTitle>
            <DialogDescription>Detailed score breakdown for {selectedStudent?.name}</DialogDescription>
          </DialogHeader>
          {selectedStudent && (() => {
            const displayGwa = selectedStudent.gwa ?? (selectedStudent.finalGrade != null ? percentageToGWA(selectedStudent.finalGrade) : null);
            return (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-3">
                  {[['Course', selectedStudent.course_title], ['Class Code', selectedStudent.classCode || '—'], ['Enrollment Type', selectedStudent.enrollmentType === 'academe_student' ? 'Student' : 'Certificatory Client'], ['Status', selectedStudent.status], ['Progress', `${selectedStudent.progressPercentage || 0}%`], ['Enrolled', selectedStudent.enrolledAt ? new Date(selectedStudent.enrolledAt).toLocaleDateString() : '—']].map(([label, val]) => (
                    <div key={label} className="p-3 rounded-lg" style={{ background: 'var(--muted)' }}>
                      <p className="text-xs mb-0.5" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
                      <p className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>{val}</p>
                    </div>
                  ))}
                </div>
                <div className="p-4 rounded-lg" style={{ background: 'var(--accent-blue-50)' }}>
                  <p className="font-semibold mb-2" style={{ color: 'var(--royal-blue)' }}>Quiz Performance</p>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--royal-blue-light)' }}>Average Quiz Score:</span>
                    <span className="font-bold" style={{ color: 'var(--royal-blue)' }}>
                      {selectedStudent.averageScore != null ? `${selectedStudent.averageScore}%` : 'No quizzes taken'}
                    </span>
                  </div>
                </div>
                <div className="p-4 rounded-lg" style={{ background: 'var(--accent-gold-50)' }}>
                  <p className="font-semibold mb-2" style={{ color: 'var(--gold)' }}>Essay Grading</p>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--gold-dark)' }}>Pending Essays:</span>
                    <span className="font-bold" style={{ color: 'var(--gold)' }}>{selectedStudent.pendingEssaysCount || 0}</span>
                  </div>
                </div>
                {selectedStudent.finalGrade && (
                  <div className="p-4 rounded-lg" style={{ background: 'var(--accent-green-50)' }}>
                    <p className="font-semibold mb-2" style={{ color: 'var(--success)' }}>Finalized Grade</p>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: 'var(--success)' }}>Final Grade:</span>
                      <span className="font-bold text-lg" style={{ color: 'var(--success)' }}>
                        {selectedStudent.finalGrade.toFixed(2)}%{displayGwa ? ` (GWA: ${displayGwa.toFixed(2)})` : ''}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
