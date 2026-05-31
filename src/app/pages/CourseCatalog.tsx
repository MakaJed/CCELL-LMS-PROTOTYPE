import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Search, Star, Users, Clock, Edit, Eye, Plus, CheckCircle, Lock, BookOpen, Award, Heart } from 'lucide-react';
import * as apiV2 from '../lib/api-v2';
import { useAuth } from '../../lib/AuthContext';
import { useEnrollments } from '../../lib/EnrollmentContext';
import { motion } from 'motion/react';
import { CourseSkeleton } from '../components/ui/skeleton';
import { sanitize } from '../lib/sanitize';

type CourseTypeTab = 'all' | 'academe' | 'certificatory';

function normalizeCourse(c: any) {
  return {
    ...c,
    courseType: c.course_type || c.courseType || 'certificatory',
    instructor: c.instructor_name || c.instructor || 'Unknown Instructor',
    enrolled: c.enrolled_count ?? c.enrolled ?? 0,
    recommendationCount: c.recommendation_count ?? 0,
    image: c.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&auto=format&fit=crop',
  };
}

export function CourseCatalog() {
  const { user } = useAuth();
  const { isEnrolledInCourse } = useEnrollments();
  const [isLoading, setIsLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<CourseTypeTab>('all');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const result = await apiV2.getCourses();
        if (!cancelled) setCourses((result.courses || []).map(normalizeCourse));
      } catch (err) {
        console.error('[CourseCatalog] Failed to load courses:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (user?.role !== 'student') return;
    apiV2.Student.getRecommendedCourses()
      .then(r => setRecommendations((r.courses || []).map(normalizeCourse).slice(0, 3)))
      .catch(() => {});
  }, [user?.role]);

  const isEnrolled = (courseId: string) => user?.role === 'student' && isEnrolledInCourse(String(courseId));

  const categories = ['all', ...Array.from(new Set(courses.map(c => c.category)))];
  const levels = ['all', 'Beginner', 'Intermediate', 'Advanced'];

  const tabCounts = {
    all: courses.length,
    academe: courses.filter(c => c.courseType === 'academe').length,
    certificatory: courses.filter(c => c.courseType === 'certificatory').length,
  };

  const filteredCourses = courses.filter(course => {
    const desc = course.description || '';
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) || desc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || course.category === categoryFilter;
    const matchesLevel = levelFilter === 'all' || course.level === levelFilter;
    const matchesTab = activeTab === 'all' || course.courseType === activeTab;
    return matchesSearch && matchesCategory && matchesLevel && matchesTab;
  });

  const isInstructorCourse = (course: typeof courses[0]) => user?.role === 'instructor' && course.instructor.includes(user?.name || '');

  const tabs: { key: CourseTypeTab; label: string; icon: React.ReactNode }[] = [
    { key: 'all', label: 'All Courses', icon: <BookOpen className="h-4 w-4" /> },
    { key: 'academe', label: '🎓 Academe', icon: <BookOpen className="h-4 w-4" /> },
    { key: 'certificatory', label: '🏅 Certificatory', icon: <Award className="h-4 w-4" /> },
  ];

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6">
          <div className="h-8 w-48 bg-gray-200 animate-pulse rounded mb-2" />
          <div className="h-4 w-64 bg-gray-200 animate-pulse rounded" />
        </div>
        <div className="mb-6">
          <div className="h-12 bg-gray-200 animate-pulse rounded-xl mb-4" />
          <div className="h-16 bg-gray-200 animate-pulse rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <CourseSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8" role="main" aria-label="Course Catalog">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1A237E]">
            {user?.role === 'admin' ? 'All Courses' : 'Browse Courses'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {user?.role === 'admin' ? 'Manage and oversee all platform courses' :
              user?.role === 'instructor' ? 'Explore courses and manage your own' :
              'Explore academic programs and professional certification paths'}
          </p>
        </div>
        {user?.role === 'instructor' && (
          <Link to="/instructor/create-course">
            <Button className="bg-[#FFB300] hover:bg-[#FFC107] text-[#1A237E] font-bold shadow-md">
              <Plus className="h-4 w-4 mr-2" />
              Create Course
            </Button>
          </Link>
        )}
      </motion.div>

      {/* Recommended Courses — students only */}
      {user?.role === 'student' && recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-bold text-[#1A237E] flex items-center gap-2">
                <Star className="h-4 w-4 text-[#FFB300]" />
                Recommended for You
              </h2>
              <p className="text-xs text-gray-500">Based on your interests and learning history</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {recommendations.map((course, idx) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
              >
                <Link to={`/course/${course.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-all group border-[#1A237E]/10 hover:border-[#1A237E]/25">
                    <div className="aspect-video overflow-hidden relative">
                      <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400" loading="lazy" />
                      <Badge className="absolute top-2 left-2 bg-[#FFB300] text-[#1A237E] font-bold text-[10px]">{course.level}</Badge>
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-semibold text-[#1A237E] text-sm mb-1 line-clamp-2">{course.title}</h3>
                      <p className="text-xs text-gray-500 mb-2">by {course.instructor}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Users className="h-3 w-3" />{(course.enrolled || 0).toLocaleString()}
                        </div>
                        <span className="text-sm font-bold text-[#1A237E]">₱{(course.price || 0).toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
          <div className="mt-2 border-b border-gray-100" />
        </motion.div>
      )}

      {/* Tab Navigation */}
      <div className="mb-5">
        <div className="flex gap-1.5 bg-white rounded-xl p-1 shadow-sm border border-gray-100 w-fit">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab.key
                  ? tab.key === 'certificatory'
                    ? 'text-[#1A237E]'
                    : 'text-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {activeTab === tab.key && (
                <motion.div
                  layoutId="catalog-tab"
                  className={`absolute inset-0 rounded-lg shadow-sm ${
                    tab.key === 'certificatory' ? 'bg-[#FFB300]' : 'bg-[#1A237E]'
                  }`}
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
              <span className={`relative z-10 text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                activeTab === tab.key
                  ? tab.key === 'certificatory' ? 'bg-[#1A237E]/15 text-[#1A237E]' : 'bg-white/20 text-white'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {tabCounts[tab.key]}
              </span>
            </button>
          ))}
        </div>

        {activeTab !== 'all' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className={`mt-3 px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 ${
              activeTab === 'academe' ? 'bg-[#E8EAF6] text-[#1A237E]' : 'bg-[#FFF8E1] text-[#7B5800]'
            }`}
          >
            {activeTab === 'academe' ? (
              <><BookOpen className="h-4 w-4 shrink-0" /><span><strong>Academe</strong> courses are university-level academic programs.</span></>
            ) : (
              <><Award className="h-4 w-4 shrink-0" /><span><strong>Certificatory</strong> courses lead to industry-recognized certifications.</span></>
            )}
          </motion.div>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search courses..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              {categories.map(cat => {
                const val = cat && cat.trim() !== '' ? cat : 'uncategorized';
                return (
                  <SelectItem key={val} value={val}>{val === 'all' ? 'All Categories' : val}</SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger><SelectValue placeholder="Level" /></SelectTrigger>
            <SelectContent>
              {levels.map(level => {
                const val = level && level.trim() !== '' ? level : 'all';
                return (
                  <SelectItem key={val} value={val}>{val === 'all' ? 'All Levels' : val}</SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results & Legend */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <p className="text-sm text-gray-500">
          Showing <span className="font-semibold text-gray-700">{filteredCourses.length}</span>{' '}
          {activeTab !== 'all' && <span className="capitalize">{activeTab} </span>}
          course{filteredCourses.length !== 1 ? 's' : ''}
        </p>
        {user?.role === 'student' && (
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-green-500" /><span>Enrolled</span></div>
            <div className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 text-gray-400" /><span>Not enrolled</span></div>
          </div>
        )}
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCourses.map((course, idx) => {
          const enrolled = isEnrolled(course.id);
          return (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.04 }}
            >
              <Card className={`overflow-hidden hover:shadow-lg transition-all duration-300 h-full flex flex-col group ${
                enrolled ? 'ring-2 ring-green-400/60 ring-offset-1' : 'border-gray-100'
              }`}>
                <div className="aspect-video overflow-hidden relative">
                  <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  {/* Course type pill */}
                  <div className="absolute top-2.5 left-2.5">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full shadow-sm ${
                      course.courseType === 'certificatory' ? 'bg-[#FFB300] text-[#1A237E]' : 'bg-[#1A237E] text-white'
                    }`}>
                      {course.courseType === 'certificatory' ? '🏅 Certificatory' : '🎓 Academe'}
                    </span>
                  </div>
                  {user?.role === 'student' && (
                    <div className="absolute top-2.5 right-2.5">
                      {enrolled ? (
                        <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-green-500 text-white shadow-sm">
                          <CheckCircle className="h-3 w-3" />Enrolled
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-black/50 text-white/80 shadow-sm backdrop-blur-sm">
                          <Lock className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <CardHeader className={`pb-2 ${enrolled ? 'bg-green-50/30' : ''}`}>
                  <div className="flex items-start justify-between mb-1.5 flex-wrap gap-1.5">
                    <div className="flex gap-1.5 flex-wrap">
                      <Badge variant="secondary" className="text-xs">{course.category}</Badge>
                      <Badge variant="outline" className="text-xs">{course.level}</Badge>
                    </div>
                    {isInstructorCourse(course) && <Badge className="bg-[#FFB300] text-[#1A237E] text-xs">My Course</Badge>}
                  </div>
                  <CardTitle className="line-clamp-2 text-base">{course.title}</CardTitle>
                  <CardDescription className="line-clamp-2 text-xs" dangerouslySetInnerHTML={{ __html: sanitize(course.description || '') }} />
                </CardHeader>

                <CardContent className={`mt-auto ${enrolled ? 'bg-green-50/30' : ''}`}>
                  <div className="space-y-3">
                    <p className="text-xs text-gray-500">by {course.instructor}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <div className="flex items-center gap-1"><Users className="h-3.5 w-3.5 text-[#1A237E]" />{course.enrolled.toLocaleString()}</div>
                      <div className="flex items-center gap-1"><Heart className="h-3.5 w-3.5 text-red-500" />{course.recommendationCount.toLocaleString()}</div>
                      <div className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{course.duration}</div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <span className="text-xl font-bold text-[#1A237E]">₱{course.price.toLocaleString()}</span>
                      <Link to={`/course/${course.id}`}>
                        {enrolled ? (
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1 text-xs">
                            <BookOpen className="h-3.5 w-3.5" />Continue
                          </Button>
                        ) : (
                          <Button size="sm" className="bg-[#1A237E] hover:bg-[#283593] text-white gap-1 text-xs">
                            <Eye className="h-3.5 w-3.5" />View
                          </Button>
                        )}
                      </Link>
                    </div>

                    {(user?.role === 'admin' || isInstructorCourse(course)) && (
                      <div className="flex gap-2 pt-2 border-t border-gray-100">
                        {isInstructorCourse(course) && (
                          <Link to={`/instructor/create-course?edit=${course.id}`} className="flex-1">
                            <Button size="sm" variant="outline" className="w-full gap-1 text-xs border-[#FFB300]/30 text-[#FFB300] hover:bg-[#FFF8E1]">
                              <Edit className="h-3 w-3" />Edit
                            </Button>
                          </Link>
                        )}
                        {user?.role === 'admin' && (
                          <Link to={`/admin/courses?selected=${course.id}`} className="flex-1">
                            <Button size="sm" variant="outline" className="w-full gap-1 text-xs border-[#1A237E]/15 text-[#1A237E] hover:bg-[#E8EAF6]">
                              <Edit className="h-3 w-3" />Manage
                            </Button>
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {filteredCourses.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search className="h-7 w-7 text-gray-400" />
          </div>
          <p className="text-gray-500 mb-4 font-medium">No courses found matching your criteria</p>
          <Button
            variant="outline"
            onClick={() => { setSearchQuery(''); setCategoryFilter('all'); setLevelFilter('all'); setActiveTab('all'); }}
            className="border-[#1A237E]/20 text-[#1A237E]"
          >
            Clear Filters
          </Button>
        </motion.div>
      )}
    </div>
  );
}
