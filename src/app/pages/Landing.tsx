import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Award, TrendingUp, Users, BookOpen, Target, Rocket, Play, CheckCircle, Search, GraduationCap, Clock, ArrowRight, Heart } from 'lucide-react';
import { motion } from 'motion/react';
import lnuLogo from "@/assets/LNULOGO.png";
import ccellLogo from "@/assets/CCELLLOGO.png";
import landingBg from "@/assets/LANDINGPAGE.png";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
};

export function Landing() {
  const [popularCourses, setPopularCourses] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/popular-courses')
      .then(r => r.json())
      .then(d => { if (d.courses?.length) setPopularCourses(d.courses); })
      .catch(() => {});
  }, []);

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative text-white min-h-[85vh] flex items-center overflow-hidden">
        {/* Landing page background image */}
        <div
          className="absolute inset-0"
          style={{ backgroundImage: `url(${landingBg})`, backgroundSize: 'cover', backgroundPosition: 'center top' }}
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#090F2E]/90 via-[#1A237E]/80 to-[#0D1642]/85" />
        <div className="absolute top-20 left-10 w-[400px] h-[400px] bg-[#FFB300]/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative z-10 w-full">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="flex items-center justify-center gap-4 mb-8"
            >
              <img src={lnuLogo} alt="LNU" className="h-16 w-16 sm:h-20 sm:w-20 drop-shadow-2xl" />
              <img src={ccellLogo} alt="CCELL" className="h-16 w-16 sm:h-20 sm:w-20 drop-shadow-2xl" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-[1.1] tracking-tight text-[#ffffff]"
              style={{ fontFamily: "'Lora', serif" }}
            >Center for Continuing Education<br /><span className="text-white">& Lifelong Learning</span></motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-lg sm:text-xl mb-10 text-blue-200/80 max-w-2xl mx-auto leading-relaxed"
            >
              Advance your career with industry-standard certification programs.
              Track progress, earn badges, and gain recognized credentials from LNU.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="flex gap-4 justify-center flex-wrap"
            >
              <Link to="/catalog">
                <Button size="lg" className="bg-[#FFB300] text-[#1A237E] hover:bg-[#FFC107] shadow-lg shadow-[#FFB300]/20 font-bold border-0 text-base px-8 py-6 hover:scale-[1.03] transition-all">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Browse Courses
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" className="bg-white/10 text-white hover:bg-white/15 border border-white/20 font-bold transition-all text-base px-8 py-6 hover:scale-[1.03] backdrop-blur-sm">
                  <Rocket className="h-5 w-5 mr-2" />
                  Get Started
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#F8FAFC] to-transparent" />
      </section>

      {/* Features Section */}
      <section className="py-20 sm:py-24 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3 text-[#1A237E]">Why Choose LNU CCELL?</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">Professional development programs designed for educators, professionals, and lifelong learners</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {[
              { icon: <Award className="h-7 w-7 text-white" />, title: 'Verified Certifications', desc: 'Earn LNU-recognized certificates with unique QR verification codes accepted by employers nationwide.', gradient: 'from-[#FFB300] to-[#FF8F00]', border: 'border-[#FFB300]/20 hover:border-[#FFB300]' },
              { icon: <TrendingUp className="h-7 w-7 text-[#FFB300]" />, title: 'Track Your Progress', desc: 'Monitor your learning journey with detailed progress tracking and achievement milestones.', gradient: 'from-[#1A237E] to-[#283593]', border: 'border-[#1A237E]/15 hover:border-[#1A237E]' },
              { icon: <Users className="h-7 w-7 text-white" />, title: 'Expert Instructors', desc: 'Learn from LNU faculty and industry professionals with decades of real-world expertise.', gradient: 'from-[#1A237E] to-[#0D1642]', border: 'border-gray-200 hover:border-[#FFB300]' },
            ].map((item, idx) => (
              <motion.div key={idx} {...fadeUp} transition={{ duration: 0.5, delay: idx * 0.1 }}>
                <Card className={`border ${item.border} transition-all hover:shadow-xl hover:-translate-y-1 duration-300 group h-full`}>
                  <CardContent className="pt-8 pb-6">
                    <div className={`w-14 h-14 bg-gradient-to-br ${item.gradient} rounded-xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      {item.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-[#1A237E]">{item.title}</h3>
                    <p className="text-gray-500 leading-relaxed text-sm">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gradient-to-br from-[#0D1642] via-[#1A237E] to-[#0D1642] py-16 sm:py-20 border-y-[3px] border-[#FFB300] relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.h2 {...fadeUp} className="text-2xl sm:text-3xl font-bold text-center mb-12 text-white">Trusted by Thousands of Learners</motion.h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[
              { icon: <Users className="h-7 w-7 text-[#FFB300]" />, value: '5,000+', label: 'Active Learners' },
              { icon: <BookOpen className="h-7 w-7 text-[#FFB300]" />, value: '50+', label: 'Courses' },
              { icon: <Award className="h-7 w-7 text-[#FFB300]" />, value: '2,500+', label: 'Certificates Issued' },
              { icon: <TrendingUp className="h-7 w-7 text-[#FFB300]" />, value: '12,000+', label: 'Total Enrollments' },
            ].map((item, idx) => (
              <motion.div key={idx} {...fadeUp} transition={{ duration: 0.5, delay: idx * 0.1 }} className="text-center group">
                <div className="w-14 h-14 bg-[#FFB300]/10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform border border-[#FFB300]/20">
                  {item.icon}
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-[#FFB300] mb-1">{item.value}</div>
                <div className="text-blue-300/60 text-sm font-medium">{item.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works ? */}
      <section className="py-20 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3 text-[#1A237E]">How It Works?</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">Your journey to professional growth starts here</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: 1, title: 'Browse & Enroll', desc: 'Choose from our catalog of professional courses', icon: <Search className="h-8 w-8" />, color: 'from-[#1A237E] to-[#283593]' },
              { step: 2, title: 'Learn & Practice', desc: 'Access videos, documents, and interactive content', icon: <Play className="h-8 w-8" />, color: 'from-[#FFB300] to-[#FF8F00]' },
              { step: 3, title: 'Take Assessments', desc: 'Complete assessments and track your progress', icon: <CheckCircle className="h-8 w-8" />, color: 'from-[#1A237E] to-[#283593]' },
              { step: 4, title: 'Get Certified', desc: 'Receive verifiable certificates with QR codes', icon: <GraduationCap className="h-8 w-8" />, color: 'from-[#FFB300] to-[#FF8F00]' },
            ].map((item, idx) => (
              <motion.div key={item.step} {...fadeUp} transition={{ duration: 0.5, delay: idx * 0.1 }} className="text-center group relative">
                {item.step < 4 && (
                  <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-px bg-gradient-to-r from-[#FFB300]/30 to-transparent" />
                )}
                <div className={`relative w-20 h-20 bg-gradient-to-br ${item.color} text-white rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {item.icon}
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-[#FFB300] rounded-full flex items-center justify-center text-xs font-bold text-[#1A237E] border-[3px] border-white shadow">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2 text-[#1A237E]">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Course Types */}
      <section className="py-16 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3 text-[#1A237E]">What are the two learning paths?</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">Choose the learning path that best fits your career goals</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
            <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
              <Card className="border-2 border-[#1A237E]/15 hover:border-[#1A237E] transition-all hover:shadow-xl h-full group overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-[#1A237E] to-[#283593]" />
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#1A237E] to-[#283593] rounded-xl flex items-center justify-center shadow group-hover:scale-110 transition-transform">
                      <BookOpen className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#1A237E]">🎓 Academe</h3>
                      <p className="text-sm text-gray-500">Academic Programs</p>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">University-level academic programs designed to build foundational knowledge and professional skills.</p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    {['Self-paced learning modules', 'Expert faculty instruction', 'Research-based curriculum'].map((item, i) => (
                      <li key={i} className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-[#1A237E] shrink-0" />{item}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
              <Card className="border-2 border-[#FFB300]/20 hover:border-[#FFB300] transition-all hover:shadow-xl h-full group overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-[#FFB300] to-[#FF8F00]" />
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#FFB300] to-[#FF8F00] rounded-xl flex items-center justify-center shadow group-hover:scale-110 transition-transform">
                      <Award className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#1A237E]">🏅 Certificatory</h3>
                      <p className="text-sm text-gray-500">Professional Certifications</p>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">Industry-recognized certification paths that lead to verifiable professional credentials upon completion.</p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    {['QR-verified certificates', 'Industry-aligned content', 'CPD units included'].map((item, i) => (
                      <li key={i} className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-[#FFB300] shrink-0" />{item}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Top 3 Popular Courses */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3 text-[#1A237E]">Top 3 Popular Courses</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">Most recommended and enrolled courses by our learners</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {popularCourses.map((course, idx) => (
              <motion.div key={course.id} {...fadeUp} transition={{ duration: 0.5, delay: idx * 0.1 }}>
                <Card className="border border-gray-100 hover:border-[#FFB300]/40 transition-all hover:shadow-xl hover:-translate-y-1 duration-300 h-full overflow-hidden group">
                  <div className="relative">
                    <img
                      src={course.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=250&fit=crop'}
                      alt={course.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-3 left-3 w-12 h-12 bg-gradient-to-br from-[#FFB300] to-[#FF8F00] rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-xl">#{idx + 1}</span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full shadow-sm ${
                        (course.course_type || course.courseType) === 'academe' ? 'bg-[#1A237E] text-white' : 'bg-[#FFB300] text-[#1A237E]'
                      }`}>
                        {(course.course_type || course.courseType) === 'academe' ? '🎓 Academe' : '🏅 Certificatory'}
                      </span>
                    </div>
                  </div>
                  <CardContent className="pt-5 pb-6">
                    <h3 className="text-lg font-bold mb-1 text-[#1A237E] line-clamp-2">{course.title}</h3>
                    <p className="text-sm text-gray-500 mb-4">by {course.instructor_name || course.instructor}</p>

                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-blue-50 rounded-lg p-2 text-center">
                        <Users className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                        <p className="text-xs text-gray-600">Enrolled</p>
                        <p className="text-sm font-bold text-[#1A237E]">{(course.enrollment_count || 0).toLocaleString()}</p>
                      </div>
                      <div className="bg-red-50 rounded-lg p-2 text-center">
                        <Heart className="h-4 w-4 text-red-500 mx-auto mb-1" />
                        <p className="text-xs text-gray-600">Recommended</p>
                        <p className="text-sm font-bold text-[#1A237E]">{(course.recommendation_count || 0).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{course.duration}</span>
                      </div>
                      <div className="text-lg font-bold text-[#FFB300]">₱{(course.price || 0).toLocaleString()}</div>
                    </div>

                    <Link to={`/course/${course.id}`}>
                      <Button className="w-full bg-gradient-to-r from-[#1A237E] to-[#283593] hover:from-[#283593] hover:to-[#1A237E] text-white">
                        View Course
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            {popularCourses.length === 0 && [1,2,3].map(i => (
              <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-xl" />
            ))}
          </div>
          <motion.div {...fadeUp} className="text-center mt-12">
            <Link to="/catalog">
              <Button size="lg" variant="outline" className="gap-2 border-[#1A237E] text-[#1A237E] hover:bg-[#1A237E] hover:text-white">
                View All Courses
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-[#0D1642] via-[#1A237E] to-[#0D1642] text-white py-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#FFB300]/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]" />

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div {...fadeUp}>
            <div className="flex items-center justify-center gap-3 mb-6">
              <img src={lnuLogo} alt="LNU" className="h-12 w-12 drop-shadow-2xl" />
              <img src={ccellLogo} alt="CCELL" className="h-12 w-12 drop-shadow-2xl" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Start Learning?</h2>
            <p className="text-lg mb-8 text-blue-200/70 leading-relaxed">
              Join thousands of professionals advancing their careers at Leyte Normal University
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/login">
                <Button size="lg" className="bg-[#FFB300] text-[#1A237E] hover:bg-[#FFC107] shadow-lg shadow-[#FFB300]/20 font-bold text-base px-8 py-6 hover:scale-[1.03] transition-all w-full sm:w-auto">
                  <Rocket className="h-5 w-5 mr-2" />
                  Get Started Today
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link to="/catalog">
                <Button size="lg" className="bg-white/10 text-white hover:bg-white/15 border border-white/20 font-bold text-base px-8 py-6 hover:scale-[1.03] transition-all backdrop-blur-sm w-full sm:w-auto">
                  <BookOpen className="h-5 w-5 mr-2" />
                  View Courses
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}