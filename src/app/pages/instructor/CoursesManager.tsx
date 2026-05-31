import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { BookOpen, Plus, Edit, FileText, Eye, Users, Award } from 'lucide-react';
import * as apiV2 from '../../lib/api-v2';
import { toast } from 'sonner';

export function CoursesManager() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiV2.Instructor.getMyCourses()
      .then(r => setCourses(r.courses || []))
      .catch(() => toast.error('Failed to load courses'))
      .finally(() => setLoading(false));
  }, []);

  const statusStyle = (status: string) => {
    if (status === 'approved') return { background: 'var(--accent-green-50)', color: 'var(--success)' };
    if (status === 'pending' || status === 'pending_approval') return { background: 'var(--accent-gold-50)', color: 'var(--gold)' };
    if (status === 'needs_revision') return { background: 'var(--accent-red-50)', color: 'var(--destructive)' };
    return { background: 'var(--muted)', color: 'var(--muted-foreground)' };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="p-6 shadow-xl" style={{
          background: 'linear-gradient(to right, var(--royal-blue-darker), var(--royal-blue), var(--royal-blue-light))',
          borderRadius: 'var(--radius-xl)',
          borderBottom: '3px solid var(--gold)',
        }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 flex items-center justify-center" style={{ background: 'var(--gold)', borderRadius: 'var(--radius-lg)' }}>
                <BookOpen className="h-6 w-6" style={{ color: 'var(--royal-blue)' }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">My Courses Manager</h1>
                <p className="text-white/70">Create and manage your courses</p>
              </div>
            </div>
            <Link to="/instructor/create-course">
              <Button className="gap-2 font-bold" style={{ background: 'var(--gold)', color: 'var(--royal-blue)' }}>
                <Plus className="h-4 w-4" /> New Course
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[var(--royal-blue)] border-r-transparent" />
          <p className="mt-4" style={{ color: 'var(--muted-foreground)' }}>Loading courses...</p>
        </div>
      ) : courses.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="py-16 text-center">
            <BookOpen className="h-14 w-14 mx-auto mb-4" style={{ color: 'var(--muted-foreground)' }} />
            <p className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>No courses yet</p>
            <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>Create your first course to get started.</p>
            <Link to="/instructor/create-course">
              <Button className="gap-2" style={{ background: 'var(--royal-blue)', color: 'white' }}>
                <Plus className="h-4 w-4" /> Create Course
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {courses.map((course: any) => (
            <Card key={course.id} className="border-0 shadow-md hover:shadow-lg transition-all">
              <CardContent className="pt-5 pb-5">
                <div className="flex gap-4">
                  <img
                    src={course.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200'}
                    alt={course.title}
                    className="w-36 h-24 object-cover shrink-0"
                    style={{ borderRadius: 'var(--radius-md)' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-bold text-base leading-snug" style={{ color: 'var(--royal-blue)' }}>{course.title}</h3>
                      <Badge style={statusStyle(course.approval_status || course.status)}>
                        {course.approval_status === 'approved' || course.status === 'approved'
                          ? 'Live'
                          : (course.approval_status === 'pending' || course.status === 'pending_approval')
                          ? 'Pending'
                          : course.approval_status === 'needs_revision'
                          ? 'Needs Revision'
                          : course.status || 'Draft'}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs mb-3" style={{ color: 'var(--muted-foreground)' }}>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {course.enrolled_count ?? 0} enrolled
                      </span>
                      {course.cpd_units && (
                        <span className="flex items-center gap-1">
                          <Award className="h-3.5 w-3.5" style={{ color: 'var(--gold)' }} />
                          {course.cpd_units} CPD units
                        </span>
                      )}
                      <span className="capitalize">{course.course_type || 'Certificatory'}</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link to={`/instructor/courses/${course.id}/lessons`}>
                        <Button size="sm" variant="outline" className="gap-1">
                          <Edit className="h-3.5 w-3.5" /> Edit Lessons
                        </Button>
                      </Link>
                      <Link to={`/instructor/class-codes`}>
                        <Button size="sm" variant="outline" className="gap-1">
                          <Users className="h-3.5 w-3.5" /> Class Codes
                        </Button>
                      </Link>
                      <Link to={`/course/${course.id}`}>
                        <Button size="sm" variant="outline" className="gap-1">
                          <Eye className="h-3.5 w-3.5" /> Preview
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
