import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { Button } from './ui/button';
import {
  Home, User, Award, BookOpen, Menu, X, LogOut, Crown, GraduationCap,
  Users, DollarSign, Settings, Brain, ClipboardCheck, ChevronDown, Phone, Mail, MapPin, TrendingUp, ShieldCheck, FileText, Clock,
  MessageSquare, Calculator, Shield, CreditCard
} from 'lucide-react';
import { useState, useRef, useEffect, createContext, useContext } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { Toaster } from './ui/sonner';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import lnuLogo from "@/assets/LNULOGO.png";
import ccellLogo from "@/assets/CCELLLOGO.png";
import { SkipToContent } from './SkipToContent';
import { ScrollToTop } from './ScrollToTop';
import * as apiV2 from '../lib/api-v2';

type ChannelsMap = Record<string, number>;
const NotifCtx = createContext<{ channels: ChannelsMap; markSeen: (keys: string[]) => void }>({ channels: {}, markSeen: () => {} });

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [channels, setChannels] = useState<ChannelsMap>({});
  useEffect(() => {
    let es: EventSource | null = null;
    let poll: any = null;
    let fallbackNotified = false;
    const connect = async () => {
      try {
        const res = await apiV2.Notifications.getChannels();
        setChannels(res.channels || {});
      } catch {}
      try {
        es = apiV2.Notifications.openStream((payload) => {
          if (payload?.channels) setChannels(payload.channels);
        });
        es.onerror = () => {
          es?.close();
          es = null;
          if (!fallbackNotified) {
            fallbackNotified = true;
            console.info('[Notifications] SSE failed, falling back to polling');
            toast.info('Live notifications degraded — using slower refresh', { duration: 2500 });
          }
        };
      } catch {
        poll = setInterval(async () => {
          try { const res = await apiV2.Notifications.getChannels(); setChannels(res.channels || {}); } catch {}
        }, 30000);
      }
    };
    connect();
    return () => { es?.close(); if (poll) clearInterval(poll); };
  }, []);
  const markSeen = (keys: string[]) => {
    apiV2.Notifications.markSeen(keys).catch(() => {});
  };
  return <NotifCtx.Provider value={{ channels, markSeen }}>{children}</NotifCtx.Provider>;
}

function NotificationDot({ count }: { count?: number }) {
  if (!count || count <= 0) return null;
  const label = count > 9 ? '9+' : String(count);
  return (
    <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-red-600 text-white text-[10px] rounded-full flex items-center justify-center border border-white">
      {label}
    </span>
  );
}

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const isLoggedIn = !!user;

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'student') return '/student/dashboard';
    if (user.role === 'instructor') return '/instructor/dashboard';
    return '/admin/dashboard';
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout. Please try again.');
    }
  };

  const getNavItems = (): NavItem[] => {
    if (!user) return [];
    if (user.role === 'admin') {
      return [
        { to: '/admin/dashboard', label: 'Dashboard', icon: <Home className="h-4 w-4" /> },
        { to: '/admin/users', label: 'Users', icon: <Users className="h-4 w-4" /> },
        { to: '/admin/courses', label: 'Courses', icon: <BookOpen className="h-4 w-4" /> },
        { to: '/admin/certificates', label: 'Certificates', icon: <Award className="h-4 w-4" /> },
        { to: '/admin/analytics', label: 'Analytics', icon: <TrendingUp className="h-4 w-4" /> },
        { to: '/admin/payments', label: 'Payments', icon: <DollarSign className="h-4 w-4" /> },
        { to: '/admin/audit-log', label: 'Audit Log', icon: <FileText className="h-4 w-4" /> },
        { to: '/admin/settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
      ];
    }
    if (user.role === 'instructor') {
      return [
        { to: '/instructor/dashboard', label: 'Dashboard', icon: <Home className="h-4 w-4" /> },
        { to: '/instructor/courses', label: 'My Courses', icon: <BookOpen className="h-4 w-4" /> },
        { to: '/instructor/students', label: 'Students', icon: <Users className="h-4 w-4" /> },
        { to: '/instructor/inbox', label: 'Inbox', icon: <MessageSquare className="h-4 w-4" /> },
        { to: '/instructor/grade-book', label: 'Grading Room', icon: <FileText className="h-4 w-4" /> },
      ];
    }
    return [
      { to: '/student/dashboard', label: 'Dashboard', icon: <Home className="h-4 w-4" /> },
      { to: '/student/my-courses', label: 'My Courses', icon: <BookOpen className="h-4 w-4" /> },
      { to: '/catalog', label: 'Browse', icon: <BookOpen className="h-4 w-4" /> },
      { to: '/student/progress', label: 'Progress', icon: <TrendingUp className="h-4 w-4" /> },
      { to: '/student/messages', label: 'Messages', icon: <MessageSquare className="h-4 w-4" /> },
      { to: '/student/certificates', label: 'Certificates', icon: <Award className="h-4 w-4" /> },
      { to: '/student/payment-history', label: 'Payments', icon: <CreditCard className="h-4 w-4" /> },
    ];
  };

  const navItems = getNavItems();
  const { channels, markSeen } = useContext(NotifCtx);
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  // Auto mark seen on route change
  useEffect(() => {
    if (!user) return;
    const role = user.role as 'student'|'instructor'|'admin';
    const path = location.pathname;
    const map: Record<string, string[]> = {
      student: [
        path.startsWith('/student/my-courses') ? 'student.courses' : '',
        path.startsWith('/student/certificates') ? 'student.certificates' : '',
        path.startsWith('/student/payment') ? 'student.payments' : '',
        path.startsWith('/student/messages') ? 'student.messages' : '',
        path.startsWith('/student/dashboard') ? 'student.grades' : '',
      ].filter(Boolean) as string[],
      instructor: [
        path.startsWith('/instructor/grade-book') ? 'instructor.grade_book' : '',
        path.startsWith('/instructor/course-requests') ? 'instructor.reopen_requests' : '',
        path.startsWith('/instructor/courses') ? 'instructor.enrollments' : '',
        path.startsWith('/instructor/certificates') ? 'instructor.certificates' : '',
      ].filter(Boolean) as string[],
      admin: [
        path.startsWith('/admin/course-approval') ? 'admin.approvals' : '',
        path.startsWith('/admin/payments') ? 'admin.payments' : '',
        path.startsWith('/admin/audit-log') ? 'admin.audit' : '',
      ].filter(Boolean) as string[],
    };
    if (map[role]?.length) markSeen(map[role]);
  }, [location.pathname]);

  const getRoleIcon = () => {
    if (user?.role === 'admin') return <Crown className="h-4 w-4 text-[#FFB300]" />;
    if (user?.role === 'instructor') return <GraduationCap className="h-4 w-4 text-[#FFB300]" />;
    return <User className="h-4 w-4 text-[#FFB300]" />;
  };

  const getRoleLabel = () => {
    if (user?.role === 'admin') return 'Admin';
    if (user?.role === 'instructor') return 'Instructor';
    return 'Student';
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <SkipToContent />
      <ScrollToTop />
      {/* Header */}
      <header className="bg-gradient-to-r from-[#0D1642] via-[#1A237E] to-[#0D1642] border-b-[3px] border-[#FFB300] sticky top-0 z-50 shadow-xl backdrop-blur-sm" role="banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to={isLoggedIn ? getDashboardPath() : "/"} className="flex items-center gap-2 shrink-0 group">
              <img src={lnuLogo} alt="LNU Logo" className="h-9 w-9 group-hover:scale-105 transition-transform" />
              <img src={ccellLogo} alt="CCELL Logo" className="h-9 w-9 group-hover:scale-105 transition-transform" />
              <div className="hidden sm:block ml-1">
                <div className="font-bold text-[#FFB300] leading-tight tracking-wide" style={{ fontSize: '1.05rem' }}>LNU CCELL</div>

              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-0.5">
              {isLoggedIn ? (
                <>
                  {navItems.map((item) => (
                    <Link key={item.to + item.label} to={item.to} onClick={() => {
                      // Auto mark seen for a few known channels based on route
                      const role = user?.role;
                      const map: Record<string, string[]> = {
                        student: [
                          item.to.startsWith('/student/my-courses') ? 'student.courses' : '',
                          item.to.startsWith('/student/certificates') ? 'student.certificates' : '',
                          item.to.startsWith('/student/payment') ? 'student.payments' : '',
                          item.to.startsWith('/student/messages') ? 'student.messages' : '',
                          item.to.startsWith('/student/dashboard') ? 'student.grades' : '',
                        ].filter(Boolean) as string[],
                        instructor: [
                          item.to.startsWith('/instructor/grade-book') ? 'instructor.grade_book' : '',
                          item.to.startsWith('/instructor/course-requests') ? 'instructor.reopen_requests' : '',
                          item.to.startsWith('/instructor/courses') ? 'instructor.enrollments' : '',
                          item.to.startsWith('/instructor/certificates') ? 'instructor.certificates' : '',
                        ].filter(Boolean) as string[],
                        admin: [
                          item.to.startsWith('/admin/course-approval') ? 'admin.approvals' : '',
                          item.to.startsWith('/admin/payments') ? 'admin.payments' : '',
                          item.to.startsWith('/admin/audit-log') ? 'admin.audit' : '',
                        ].filter(Boolean) as string[],
                      };
                      if (role && map[role]?.length) markSeen(map[role]);
                    }}>
                      <button
                        className={`relative flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg transition-all duration-200 ${
                          isActive(item.to)
                            ? 'text-[#FFB300]'
                            : 'text-white/70 hover:text-white hover:bg-white/8'
                        }`}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                        <NotificationDot count={
                          user?.role === 'student' && item.to.startsWith('/student/my-courses') ? channels['student.courses']
                          : user?.role === 'student' && item.to.startsWith('/student/certificates') ? channels['student.certificates']
                          : user?.role === 'student' && item.to.startsWith('/student/payment') ? channels['student.payments']
                          : user?.role === 'student' && item.to.startsWith('/student/messages') ? channels['student.messages']
                          : user?.role === 'student' && item.to.startsWith('/student/dashboard') ? channels['student.grades']
                          : user?.role === 'instructor' && item.to.startsWith('/instructor/grade-book') ? channels['instructor.grade_book']
                          : user?.role === 'instructor' && item.to.startsWith('/instructor/course-requests') ? channels['instructor.reopen_requests']
                          : user?.role === 'instructor' && item.to.startsWith('/instructor/courses') ? channels['instructor.enrollments']
                          : user?.role === 'instructor' && item.to.startsWith('/instructor/certificates') ? channels['instructor.certificates']
                          : user?.role === 'admin' && item.to.startsWith('/admin/course-approval') ? channels['admin.approvals']
                          : user?.role === 'admin' && item.to.startsWith('/admin/payments') ? channels['admin.payments']
                          : user?.role === 'admin' && item.to.startsWith('/admin/audit-log') ? channels['admin.audit']
                          : 0
                        } />
                        {isActive(item.to) && (
                          <motion.div
                            layoutId="nav-indicator"
                            className="absolute inset-0 bg-[#FFB300]/15 rounded-lg border border-[#FFB300]/30"
                            transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                          />
                        )}
                      </button>
                    </Link>
                  ))}


                  {/* Profile Dropdown */}
                  <div className="relative ml-3" ref={profileRef}>
                    <button
                      onClick={() => setProfileOpen(!profileOpen)}
                      className="flex items-center gap-2 px-2.5 py-1.5 bg-white/8 hover:bg-white/15 rounded-xl border border-white/15 transition-all duration-200"
                    >
                      <div className="w-7 h-7 bg-gradient-to-br from-[#FFB300] to-[#FF8F00] rounded-full flex items-center justify-center text-xs font-bold text-[#1A237E] shadow-inner">
                        {user?.name?.charAt(0) || 'U'}
                      </div>
                      <span className="text-xs text-white/80 capitalize hidden xl:inline">{getRoleLabel()}</span>
                      <ChevronDown className={`h-3 w-3 text-white/50 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {profileOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.96 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50"
                        >
                          <div className="p-4 bg-gradient-to-r from-[#1A237E] to-[#283593] text-white">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-[#FFB300] to-[#FF8F00] rounded-full flex items-center justify-center text-sm font-bold text-[#1A237E]">
                                {user?.name?.charAt(0) || 'U'}
                              </div>
                              <div>
                                <p className="font-semibold text-sm">{user?.name}</p>
                                <p className="text-xs text-blue-200 capitalize flex items-center gap-1">
                                  {getRoleIcon()} {user?.role}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="p-1.5">
                            <Link to="/profile" onClick={() => setProfileOpen(false)}>
                              <button className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                                <User className="h-4 w-4 text-gray-400" />
                                My Profile
                              </button>
                            </Link>
                            <Link to={getDashboardPath()} onClick={() => setProfileOpen(false)}>
                              <button className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                                <Home className="h-4 w-4 text-gray-400" />
                                Dashboard
                              </button>
                            </Link>
                            <hr className="my-1 border-gray-100" />
                            <button
                              onClick={() => { setProfileOpen(false); handleLogout(); }}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <LogOut className="h-4 w-4" />
                              Sign Out
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <>
                  <Link to="/catalog">
                    <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10 text-sm">Browse Courses</Button>
                  </Link>
                  <Link to="/login">
                    <Button className="bg-[#FFB300] text-[#1A237E] hover:bg-[#FFC107] font-bold shadow-md ml-2 text-sm">Sign In</Button>
                  </Link>
                </>
              )}
            </nav>

            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 text-white hover:text-[#FFB300] transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-[300px] max-w-[85vw] bg-gradient-to-b from-[#0D1642] to-[#1A237E] z-50 lg:hidden shadow-2xl flex flex-col"
            >
              {/* Mobile header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <Link to={isLoggedIn ? getDashboardPath() : "/"} className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                  <img src={lnuLogo} alt="LNU" className="h-8 w-8" />
                  <span className="font-bold text-[#FFB300] text-sm">LNU CCELL</span>
                </Link>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-white/60 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 px-3">
                {isLoggedIn ? (
                  <>
                    {/* User info */}
                    <div className="flex items-center gap-3 px-3 py-3 mb-4 bg-white/8 rounded-xl">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#FFB300] to-[#FF8F00] rounded-full flex items-center justify-center font-bold text-[#1A237E]">
                        {user?.name?.charAt(0) || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-medium text-sm truncate">{user?.name}</p>
                        <p className="text-blue-300 text-xs capitalize flex items-center gap-1">
                          {getRoleIcon()} {getRoleLabel()}
                        </p>
                      </div>
                    </div>

                    {/* Nav items */}
                    <div className="space-y-1">
                      {navItems.map((item) => (
                        <Link key={item.to + item.label} to={item.to} onClick={() => setMobileMenuOpen(false)}>
                          <button
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                              isActive(item.to)
                                ? 'bg-[#FFB300]/15 text-[#FFB300] font-medium'
                                : 'text-white/70 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            {item.icon}
                            {item.label}
                          </button>
                        </Link>
                      ))}
                    </div>

                    <hr className="border-white/10 my-4" />
                    <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
                      <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5">
                        <User className="h-4 w-4" />
                        My Profile
                      </button>
                    </Link>
                    <button
                      onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-300 hover:text-red-200 hover:bg-red-500/10 mt-1"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Link to="/catalog" onClick={() => setMobileMenuOpen(false)}>
                      <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5">
                        <BookOpen className="h-4 w-4" />
                        Browse Courses
                      </button>
                    </Link>
                    <div className="pt-4">
                      <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                        <Button className="w-full bg-[#FFB300] text-[#1A237E] hover:bg-[#FFC107] font-bold">Sign In</Button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main id="main-content" className="flex-1" tabIndex={-1}>
        <NotificationProvider>
          <Outlet />
        </NotificationProvider>
      </main>
      <Toaster />

      {/* Footer */}
      <footer className="bg-gradient-to-b from-[#0D1642] to-[#090F2E] text-white border-t-[3px] border-[#FFB300]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <Link to={isLoggedIn ? getDashboardPath() : "/"} className="flex items-center gap-2 mb-4 w-fit hover:opacity-80 transition-opacity">
                <img src={lnuLogo} alt="LNU" className="h-8 w-8" />
                <img src={ccellLogo} alt="CCELL" className="h-8 w-8" />
                <span className="font-bold text-[#FFB300]">LNU CCELL</span>
              </Link>
              <p className="text-blue-300/70 text-sm leading-relaxed">
                Center for Continuing Education and Lifelong Learning at Leyte Normal University
              </p>
              <div className="mt-4 flex gap-2">


              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-[#FFB300] text-sm tracking-wider uppercase">Quick Links</h3>
              <ul className="space-y-2.5 text-sm text-blue-300/70">
                <li><Link to="/catalog" className="hover:text-[#FFB300] transition-colors flex items-center gap-2"><BookOpen className="h-3.5 w-3.5" />Course Catalog</Link></li>
                <li><Link to="/student/certificates" className="hover:text-[#FFB300] transition-colors flex items-center gap-2"><Award className="h-3.5 w-3.5" />Certificates</Link></li>
                <li><a href="https://lnu.edu.ph" target="_blank" rel="noopener noreferrer" className="hover:text-[#FFB300] transition-colors">About LNU</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-[#FFB300] text-sm tracking-wider uppercase">Support</h3>
              <ul className="space-y-2.5 text-sm text-blue-300/70">
                <li><a href="mailto:ccell@lnu.edu.ph?subject=Help%20Center%20Inquiry" className="hover:text-[#FFB300] transition-colors">Help Center</a></li>
                <li><a href="mailto:ccell@lnu.edu.ph" className="hover:text-[#FFB300] transition-colors">Contact Us</a></li>
                <li><a href="mailto:ccell@lnu.edu.ph?subject=FAQ%20Inquiry" className="hover:text-[#FFB300] transition-colors">FAQs</a></li>
                <li><a href="mailto:ccell@lnu.edu.ph?subject=Privacy%20Policy%20Inquiry" className="hover:text-[#FFB300] transition-colors">Privacy Policy</a></li>
                <li><a href="mailto:ccell@lnu.edu.ph?subject=Refund%20Policy%20Inquiry" className="hover:text-[#FFB300] transition-colors font-medium">Refund Policy</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-[#FFB300] text-sm tracking-wider uppercase">Contact</h3>
              <ul className="space-y-3 text-sm text-blue-300/70">
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-[#FFB300]/60 mt-0.5 shrink-0" />
                  <span>P. Paterno St., Tacloban City<br />Leyte, Philippines 6500</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-[#FFB300]/60 shrink-0" />
                  <a href="tel:+6353832320" className="hover:text-[#FFB300] transition-colors">+63 (53) 832 3205</a>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-[#FFB300]/60 shrink-0" />
                  <a href="mailto:ccell@lnu.edu.ph" className="hover:text-[#FFB300] transition-colors">ccell@lnu.edu.ph</a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/8 mt-10 pt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm text-blue-400/50 text-center sm:text-left">
                <p>&copy; 2026 Center for Continuing Education and Lifelong Learning</p>
                <p className="text-xs mt-1">Leyte Normal University. All rights reserved.</p>
              </div>
              <div className="flex items-center gap-3">
                
                
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}