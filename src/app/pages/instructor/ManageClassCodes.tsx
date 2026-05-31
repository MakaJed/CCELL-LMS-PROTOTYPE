import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../components/ui/alert-dialog';
import { QrCode, Plus, Users, Calendar, Hash, X, Save, Ban, Copy, Check, BookOpen, ArrowLeft, Award } from 'lucide-react';
import { toast } from 'sonner';
import * as apiV2 from '../../lib/api-v2';

interface ClassCode {
  id: string;
  code: string;
  course_id: string;
  section: string;
  program?: string;
  year_level?: number;
  semester?: string;
  school_year?: string;
  max_uses?: number;
  current_uses: number;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
  course?: {
    id: string;
    title: string;
  };
}

export function ManageClassCodes() {
  const navigate = useNavigate();

  const [classCodes, setClassCodes] = useState<ClassCode[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [code, setCode] = useState('');
  const [section, setSection] = useState('');
  const [program, setProgram] = useState('');
  const [yearLevel, setYearLevel] = useState('');
  const [semester, setSemester] = useState('');
  const [schoolYear, setSchoolYear] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [classCodesResult, coursesResult] = await Promise.all([
        apiV2.Instructor.getMyClassCodes(),
        apiV2.Instructor.getMyCourses(),
      ]);

      setClassCodes(classCodesResult.class_codes || []);

      // Filter only academe courses
      const academeCourses = (coursesResult.courses || []).filter(
        (c: any) => c.course_type === 'academe'
      );
      setCourses(academeCourses);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load class codes');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedCourseId('');
    setCode('');
    setSection('');
    setProgram('');
    setYearLevel('');
    setSemester('');
    setSchoolYear('');
    setMaxUses('');
    setExpiresAt('');
  };

  const generateCode = () => {
    const selectedCourse = courses.find(c => c.id === selectedCourseId);
    if (!selectedCourse || !section.trim()) {
      toast.error('Please select a course and enter a section first');
      return;
    }

    const programPart = (program || '').trim().toUpperCase();
    const sectionPart = section.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!sectionPart) {
      toast.error('Section must contain letters/numbers');
      return;
    }

    const syEnd = schoolYear && schoolYear.includes('-')
      ? schoolYear.split('-')[1].trim()
      : (schoolYear || '').trim();
    const semesterCode = semester || 'S1';

    const generatedCode = `${programPart}${sectionPart}${programPart && sectionPart ? '' : ''}-${syEnd || new Date().getFullYear()}-${semesterCode}`;
    setCode(generatedCode);
  };

  const handleSubmit = async () => {
    if (!selectedCourseId) {
      toast.error('Please select a course');
      return;
    }

    if (!code.trim() || !section.trim()) {
      toast.error('Code and section are required');
      return;
    }

    setSubmitting(true);
    try {
      await apiV2.Instructor.createClassCode({
        course_id: selectedCourseId,
        code: code.trim(),
        section: section.trim(),
        program: program.trim() || undefined,
        year_level: yearLevel ? parseInt(yearLevel) : undefined,
        semester: semester || undefined,
        school_year: schoolYear || undefined,
        max_uses: maxUses ? parseInt(maxUses) : undefined,
        expires_at: expiresAt || undefined,
      });

      toast.success('Class code created successfully!');
      setDialogOpen(false);
      resetForm();
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create class code');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (codeId: string) => {
    try {
      await apiV2.Instructor.deactivateClassCode(codeId);
      toast.success('Class code deactivated');
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to deactivate class code');
    }
  };

  const handleActivate = async (codeId: string) => {
    try {
      await apiV2.Instructor.activateClassCode(codeId);
      toast.success('Class code reactivated');
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to activate class code');
    }
  };

  const handleFinalizeSection = async (codeId: string, sectionName: string) => {
    try {
      const result = await apiV2.Instructor.finalizeSectionGrades(codeId);
      toast.success(result.message || 'Section grades finalized', {
        description: `${result.certs_issued} certificate(s) issued for ${result.total_students} student(s) in ${sectionName}`,
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to finalize section grades');
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#1A237E] border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading class codes...</p>
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
          className="gap-2 mb-4 text-[#1A237E] hover:bg-[#E8EAF6]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="bg-gradient-to-r from-[#090F2E] via-[#1A237E] to-[#283593] text-white p-6 rounded-2xl shadow-xl">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <QrCode className="h-6 w-6 text-[#FFB300]" />
                <h1 className="text-2xl font-bold">Class Code Management</h1>
              </div>
              <p className="text-blue-200/70 text-sm">
                Create and manage class codes for free student enrollment in academe courses
              </p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={resetForm}
                  className="gap-2 bg-[#FFB300] hover:bg-[#FFC107] text-[#1A237E] font-bold"
                >
                  <Plus className="h-4 w-4" />
                  Create Class Code
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-[#1A237E]">Create New Class Code</DialogTitle>
                  <DialogDescription>
                    Generate a unique code for your students to enroll for free
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  {/* Course Selection */}
                  <div>
                    <Label htmlFor="course">Academe Course *</Label>
                    <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                      <SelectTrigger id="course" className="mt-1.5">
                        <SelectValue placeholder="Select a course..." />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.length === 0 ? (
                          <div className="p-2 text-sm text-gray-500">
                            No academe courses found. Create one first.
                          </div>
                        ) : (
                          courses.map(course => (
                            <SelectItem key={course.id} value={course.id}>
                              {course.title}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Section */}
                    <div>
                      <Label htmlFor="section">Section *</Label>
                      <Input
                        id="section"
                        value={section}
                        onChange={(e) => setSection(e.target.value)}
                        placeholder="e.g., BSIT3A"
                        className="mt-1.5"
                      />
                    </div>

                    {/* Program */}
                    <div>
                      <Label htmlFor="program">Program</Label>
                      <Input
                        id="program"
                        value={program}
                        onChange={(e) => setProgram(e.target.value)}
                        placeholder="e.g., BSIT"
                        className="mt-1.5"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Year Level */}
                    <div>
                      <Label htmlFor="year-level">Year Level</Label>
                      <Select value={yearLevel} onValueChange={setYearLevel}>
                        <SelectTrigger id="year-level" className="mt-1.5">
                          <SelectValue placeholder="Select year..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1st Year</SelectItem>
                          <SelectItem value="2">2nd Year</SelectItem>
                          <SelectItem value="3">3rd Year</SelectItem>
                          <SelectItem value="4">4th Year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Semester */}
                    <div>
                      <Label htmlFor="semester">Semester</Label>
                      <Select value={semester} onValueChange={setSemester}>
                        <SelectTrigger id="semester" className="mt-1.5">
                          <SelectValue placeholder="Select semester..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="S1">1st Semester</SelectItem>
                          <SelectItem value="S2">2nd Semester</SelectItem>
                          <SelectItem value="Summer">Summer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* School Year */}
                  <div>
                    <Label htmlFor="school-year">School Year</Label>
                    <Input
                      id="school-year"
                      value={schoolYear}
                      onChange={(e) => setSchoolYear(e.target.value)}
                      placeholder="e.g., 2025-2026"
                      className="mt-1.5"
                    />
                  </div>

                  {/* Class Code */}
                  <div>
                    <Label htmlFor="code">Class Code *</Label>
                    <div className="flex gap-2 mt-1.5">
                      <Input
                        id="code"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="e.g., BSIT3A-2026-S1"
                        className="flex-1 font-mono"
                      />
                      <Button
                        type="button"
                        onClick={generateCode}
                        variant="outline"
                        className="gap-2"
                      >
                        <Hash className="h-4 w-4" />
                        Generate
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Generate code format: Program + Section + School Year end + Semester (e.g., BSIT3A-2026-S1)
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Max Uses */}
                    <div>
                      <Label htmlFor="max-uses">Max Uses</Label>
                      <Input
                        id="max-uses"
                        type="number"
                        min="1"
                        value={maxUses}
                        onChange={(e) => setMaxUses(e.target.value)}
                        placeholder="Unlimited"
                        className="mt-1.5"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Leave empty for unlimited
                      </p>
                    </div>

                    {/* Expires At */}
                    <div>
                      <Label htmlFor="expires-at">Expiration Date</Label>
                      <Input
                        id="expires-at"
                        type="date"
                        value={expiresAt}
                        onChange={(e) => setExpiresAt(e.target.value)}
                        className="mt-1.5"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Optional expiration
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      resetForm();
                    }}
                    disabled={submitting}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting || !selectedCourseId || !code.trim() || !section.trim()}
                    className="bg-[#1A237E] hover:bg-[#283593] text-white"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {submitting ? 'Creating...' : 'Create Class Code'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Class Codes List */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-[#1A237E] flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Active Class Codes ({classCodes.filter(c => c.is_active).length})
          </CardTitle>
          <CardDescription>
            Share these codes with your students for free enrollment
          </CardDescription>
        </CardHeader>
        <CardContent>
          {classCodes.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
              <QrCode className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium mb-1">No class codes yet</p>
              <p className="text-sm text-gray-400 mb-4">
                Create your first class code to enable free student enrollment
              </p>
              <Button
                onClick={() => setDialogOpen(true)}
                className="gap-2 bg-[#FFB300] hover:bg-[#FFC107] text-[#1A237E] font-bold"
              >
                <Plus className="h-4 w-4" />
                Create First Class Code
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {classCodes.map((classCode) => {
                const isExpired = classCode.expires_at
                  ? new Date(classCode.expires_at) < new Date()
                  : false;
                const isMaxedOut = classCode.max_uses
                  ? classCode.current_uses >= classCode.max_uses
                  : false;

                return (
                  <Card
                    key={classCode.id}
                    className={`border-2 ${
                      !classCode.is_active || isExpired || isMaxedOut
                        ? 'border-gray-200 bg-gray-50'
                        : 'border-green-200 bg-green-50/30'
                    }`}
                  >
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        {/* Code and Copy */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                className={
                                  classCode.is_active && !isExpired && !isMaxedOut
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-500 text-white'
                                }
                              >
                                {classCode.is_active && !isExpired && !isMaxedOut
                                  ? 'Active'
                                  : isExpired
                                  ? 'Expired'
                                  : isMaxedOut
                                  ? 'Max Uses'
                                  : 'Inactive'}
                              </Badge>
                              <Badge variant="outline" className="font-mono text-xs">
                                {classCode.code}
                              </Badge>
                            </div>
                            <p className="text-sm font-semibold text-[#1A237E]">
                              {classCode.section}
                              {classCode.program && ` • ${classCode.program}`}
                              {classCode.year_level && ` • Year ${classCode.year_level}`}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(classCode.code, classCode.id)}
                            className="gap-2 text-[#1A237E] hover:bg-[#E8EAF6]"
                          >
                            {copiedId === classCode.id ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>

                        {/* Course Info */}
                        {classCode.course && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <BookOpen className="h-4 w-4" />
                            <span className="truncate">{classCode.course.title}</span>
                          </div>
                        )}

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-white rounded-lg p-2 border">
                            <div className="flex items-center gap-1.5 text-gray-500 mb-0.5">
                              <Users className="h-3.5 w-3.5" />
                              <span className="text-xs">Enrolled</span>
                            </div>
                            <p className="text-lg font-bold text-[#1A237E]">
                              {classCode.current_uses}
                              {classCode.max_uses && ` / ${classCode.max_uses}`}
                            </p>
                          </div>
                          <div className="bg-white rounded-lg p-2 border">
                            <div className="flex items-center gap-1.5 text-gray-500 mb-0.5">
                              <Calendar className="h-3.5 w-3.5" />
                              <span className="text-xs">Expires</span>
                            </div>
                            <p className="text-xs font-medium text-gray-700">
                              {classCode.expires_at
                                ? new Date(classCode.expires_at).toLocaleDateString()
                                : 'Never'}
                            </p>
                          </div>
                        </div>

                        {/* Additional Info */}
                        {(classCode.semester || classCode.school_year) && (
                          <div className="text-xs text-gray-500 pt-1 border-t">
                            {classCode.semester && <span>Semester: {classCode.semester}</span>}
                            {classCode.semester && classCode.school_year && <span> • </span>}
                            {classCode.school_year && <span>SY: {classCode.school_year}</span>}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 pt-1">
                          {classCode.is_active && !isExpired && !isMaxedOut ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 gap-2 border-red-200 text-red-600 hover:bg-red-50"
                                >
                                  <Ban className="h-4 w-4" />
                                  Deactivate
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Deactivate Class Code?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Students will no longer be able to use "{classCode.code}" to enroll.
                                    You can reactivate it later if needed.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeactivate(classCode.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Deactivate
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          ) : !isExpired && !isMaxedOut ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleActivate(classCode.id)}
                              className="flex-1 gap-2 border-green-200 text-green-700 hover:bg-green-50"
                            >
                              <Check className="h-4 w-4" />
                              Reactivate
                            </Button>
                          ) : null}

                          {/* Finalize Section Grades */}
                          {classCode.current_uses > 0 && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
                                >
                                  <Award className="h-4 w-4" />
                                  Finalize
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Finalize Section Grades?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will recalculate progress for all students in "{classCode.section}" and issue certificates to those who have completed 100% of the course.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleFinalizeSection(classCode.id, classCode.section)}
                                    className="bg-[#1A237E] hover:bg-[#283593]"
                                  >
                                    Finalize & Issue Certificates
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="mt-6 border-blue-200 bg-blue-50/30">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="shrink-0">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <QrCode className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">How Class Codes Work</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Students use class codes to enroll in academe courses for <strong>free</strong></li>
                <li>• Each code is tied to a specific section and course</li>
                <li>• You can set enrollment limits and expiration dates</li>
                <li>• Deactivate codes to prevent new enrollments</li>
                <li>• Students already enrolled keep their access even if code is deactivated</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
