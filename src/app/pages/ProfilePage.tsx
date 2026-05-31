import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Progress } from '../components/ui/progress';
import { User, GraduationCap, Crown, BookOpen, Save, Key, Loader2 } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import * as apiV2 from '../lib/api-v2';

export function ProfilePage() {
  const { user: authUser } = useAuth();
  const displayRole = authUser?.role || 'student';
  const isStaff = displayRole === 'admin' || displayRole === 'instructor';

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const [analytics, setAnalytics] = useState<any>(null);
  const [quizHistory, setQuizHistory] = useState<any[]>([]);
  const [notifCourseUpdates, setNotifCourseUpdates] = useState(true);
  const [notifBadges, setNotifBadges] = useState(true);
  const [notifWeekly, setNotifWeekly] = useState(false);

  useEffect(() => {
    if (!isStaff) {
      apiV2.Student.getProfile()
        .then(r => {
          setProfile(r.profile);
          setFullName(r.profile.name || r.profile.full_name || '');
          setEmail(r.profile.email || '');
          const prefs = r.profile.preferences || {};
          if (prefs.notif_course_updates !== undefined) setNotifCourseUpdates(!!prefs.notif_course_updates);
          if (prefs.notif_badges !== undefined) setNotifBadges(!!prefs.notif_badges);
          if (prefs.notif_weekly !== undefined) setNotifWeekly(!!prefs.notif_weekly);
        })
        .catch(() => toast.error('Failed to load profile'))
        .finally(() => setLoading(false));
      apiV2.Student.getProgressAnalytics()
        .then(r => setAnalytics(r.analytics))
        .catch(() => {});
      apiV2.Student.getQuizHistory()
        .then(r => setQuizHistory(r.quizzes || []))
        .catch(() => {});
    } else {
      apiV2.Student.getProfile()
        .then(r => {
          setFullName(r.profile.name || r.profile.full_name || '');
          setEmail(r.profile.email || '');
        })
        .catch(() => {
          setFullName(authUser?.name || '');
          setEmail(authUser?.email || '');
        })
        .finally(() => setLoading(false));
    }
  }, [isStaff]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiV2.Student.updateProfile({
        full_name: fullName,
        email,
        ...(!isStaff && { preferences: { notif_course_updates: notifCourseUpdates, notif_badges: notifBadges, notif_weekly: notifWeekly } }),
      });
      toast.success('Profile updated successfully!');
    } catch (e: any) {
      toast.error(e.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) return toast.error('Fill in all password fields');
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match');
    if (newPassword.length < 8) return toast.error('Password must be at least 8 characters');
    setChangingPassword(true);
    try {
      await apiV2.Student.changePassword({ current_password: currentPassword, new_password: newPassword });
      toast.success('Password changed successfully!');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (e: any) {
      toast.error(e.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const displayName = fullName || authUser?.name || 'User';
  const earnedBadges: any[] = profile?.badges || authUser?.badges || [];
  const displayEmail = email || authUser?.email || '';

  const roleConfig = {
    student: { icon: User, color: 'from-[#1A237E] to-[#283593]', label: 'Student', bgLight: 'bg-[#E8EAF6]' },
    instructor: { icon: GraduationCap, color: 'from-[#92400E] to-[#78350F]', label: 'Instructor', bgLight: 'bg-amber-50' },
    admin: { icon: Crown, color: 'from-[#1A237E] to-[#0D1642]', label: 'Administrator', bgLight: 'bg-purple-50' },
  }[displayRole];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Profile Header */}
      <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="mb-6 border-0 shadow-lg overflow-hidden">
          <div className={`bg-gradient-to-r ${roleConfig.color} p-6 sm:p-8 text-white relative`}>
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-[60px] -mr-24 -mt-24" />
            <div className="relative z-10 flex flex-col sm:flex-row gap-5 items-start sm:items-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/15 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-bold border-2 border-white/20 backdrop-blur-sm">
                {displayName.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-white/15 text-white border-white/20 text-xs capitalize">{roleConfig.label}</Badge>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold mb-0.5">{displayName}</h1>
                <p className="text-sm text-white/60">{displayEmail}</p>
              </div>
              <Button variant="outline" className="gap-2 border-white/20 text-white hover:bg-white/10 text-sm bg-transparent" onClick={() => document.getElementById('profile-settings-tab')?.click()}>
                <Save className="h-4 w-4" />Edit Profile
              </Button>
            </div>
          </div>

          {!isStaff && (
            <CardContent className="pt-5 pb-5">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: BookOpen, value: analytics?.coursesInProgress ?? '—', label: 'In Progress', color: 'text-[#1A237E]', bg: 'bg-[#E8EAF6]' },
                  { icon: BookOpen, value: analytics?.averageScore ? `${analytics.averageScore}%` : '—', label: 'Avg. Score', color: 'text-orange-600', bg: 'bg-orange-50' },
                ].map((stat, idx) => (
                  <div key={idx} className={`text-center p-3 ${stat.bg} rounded-xl`}>
                    <stat.icon className={`h-5 w-5 ${stat.color} mx-auto mb-1.5`} />
                    <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-[11px] text-gray-500">{stat.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue={isStaff ? "settings" : "badges"} className="space-y-5">
        <TabsList className="bg-white shadow-sm border border-gray-100 p-1 gap-1">
          {!isStaff && (
            <TabsTrigger
              value="badges"
              className="data-[state=active]:bg-[#1A237E] data-[state=active]:text-white data-[state=active]:shadow hover:bg-gray-100 transition-colors"
            >
              Badges & Achievements
            </TabsTrigger>
          )}
          <TabsTrigger
            id="profile-settings-tab"
            value="settings"
            className="data-[state=active]:bg-[#1A237E] data-[state=active]:text-white data-[state=active]:shadow hover:bg-gray-100 transition-colors"
          >
            Account Settings
          </TabsTrigger>
          {!isStaff && (
            <TabsTrigger
              value="stats"
              className="data-[state=active]:bg-[#1A237E] data-[state=active]:text-white data-[state=active]:shadow hover:bg-gray-100 transition-colors"
            >
              Statistics
            </TabsTrigger>
          )}
        </TabsList>

        {!isStaff && (
          <TabsContent value="badges" className="space-y-5">
            <Card className="border-0 shadow-lg">
              <CardHeader className="py-4">
                <CardTitle className="text-[#1A237E] text-base">Earned Badges ({earnedBadges.length})</CardTitle>
                <CardDescription className="text-sm">Your achievements and milestones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {earnedBadges.map((badge, idx) => (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-[#FFB300]/20 rounded-xl text-center hover:shadow-md hover:border-[#FFB300] transition-all"
                    >
                      <div className="text-4xl mb-2">{badge.icon}</div>
                      <h3 className="font-semibold text-sm text-[#1A237E] mb-0.5">{badge.name}</h3>
                      <p className="text-[10px] text-gray-500">{badge.description}</p>
                      {badge.earnedDate && (
                        <Badge variant="secondary" className="mt-2 text-[10px]">{new Date(badge.earnedDate).toLocaleDateString()}</Badge>
                      )}
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="py-4">
                <CardTitle className="text-[#1A237E] text-base">Available Badges</CardTitle>
                <CardDescription className="text-sm">Complete challenges to unlock these badges</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {earnedBadges.length === 0 && <p className="text-sm text-gray-400 col-span-4">No badges yet. Complete courses to earn badges!</p>}
                  {[].map((badge: any) => (
                    <div key={badge.id} className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center opacity-70 hover:opacity-100 transition-opacity">
                      <div className="text-4xl mb-2 grayscale">{badge.icon}</div>
                      <h3 className="font-semibold text-sm text-gray-600 mb-0.5">{badge.name}</h3>
                      <p className="text-[10px] text-gray-500">{badge.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="py-4"><CardTitle className="text-[#1A237E] text-base">Badge Progress</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {['completion', 'achievement', 'mastery'].map((category) => {
                  const earnedInCategory = earnedBadges.filter((b: any) => b.category === category).length;
                  const percentage = Math.min(earnedInCategory * 25, 100);
                  return (
                    <div key={category}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium capitalize text-[#1A237E]">{category} Badges</span>
                        <span className="text-xs text-gray-500">{earnedInCategory} earned</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="settings" className="space-y-5">
          <Card className="border-0 shadow-lg">
            <CardHeader className="py-4">
              <CardTitle className="text-[#1A237E] text-base">Personal Information</CardTitle>
              <CardDescription className="text-sm">Update your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="fullname">Full Name</Label><Input id="fullname" value={fullName} onChange={e => setFullName(e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={displayEmail} onChange={e => setEmail(e.target.value)} /></div>
              </div>
              <Button onClick={handleSave} disabled={saving} className="bg-[#1A237E] hover:bg-[#283593] text-white gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Changes
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="py-4">
              <CardTitle className="text-[#1A237E] text-base">Security Settings</CardTitle>
              <CardDescription className="text-sm">Manage your password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>Current Password</Label><Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} /></div>
              <div className="space-y-2"><Label>New Password</Label><Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} /></div>
              <div className="space-y-2"><Label>Confirm Password</Label><Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} /></div>
              <Button onClick={handleChangePassword} disabled={changingPassword} className="bg-[#1A237E] hover:bg-[#283593] text-white gap-2">
                {changingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />} Update Password
              </Button>
            </CardContent>
          </Card>

          {!isStaff && <Card className="border-0 shadow-lg">
            <CardHeader className="py-4">
              <CardTitle className="text-[#1A237E] text-base">Notifications</CardTitle>
              <CardDescription className="text-sm">Choose what updates you receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {([
                { title: 'Course Updates', desc: 'New content and announcements', value: notifCourseUpdates, setter: setNotifCourseUpdates },
                { title: 'Badge Achievements', desc: 'When you earn new badges', value: notifBadges, setter: setNotifBadges },
                { title: 'Weekly Progress', desc: 'Summary of your learning activity', value: notifWeekly, setter: setNotifWeekly },
              ] as const).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-[#1A237E]">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                  <input type="checkbox" checked={item.value} onChange={e => item.setter(e.target.checked)} className="w-4 h-4 accent-[#1A237E]" />
                </div>
              ))}
            </CardContent>
          </Card>}
        </TabsContent>

        {!isStaff && (
          <TabsContent value="stats" className="space-y-5">
            <Card className="border-0 shadow-lg">
              <CardHeader className="py-4">
                <CardTitle className="text-[#1A237E] text-base">Learning Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  {[
                    { value: analytics?.totalHoursLearned ?? '—', label: 'Study Hours', color: 'text-[#1A237E]', bg: 'bg-[#E8EAF6]' },
                    { value: analytics?.totalLessonsCompleted ?? '—', label: 'Lessons Done', color: 'text-green-600', bg: 'bg-green-50' },
                    { value: analytics?.certificatesEarned ?? '—', label: 'Certificates', color: 'text-amber-600', bg: 'bg-amber-50' },
                  ].map((stat, idx) => (
                    <div key={idx} className={`text-center p-5 ${stat.bg} rounded-xl`}>
                      <p className={`text-3xl font-bold ${stat.color} mb-1`}>{stat.value}</p>
                      <p className="text-xs text-gray-500">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="py-4"><CardTitle className="text-[#1A237E] text-base">Quiz Performance</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {quizHistory.length === 0 && <p className="text-sm text-gray-400">No quiz results yet. Start a course to take assessments!</p>}
                {quizHistory.map((quiz, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3.5 border border-gray-100 rounded-xl hover:border-[#1A237E]/15 transition-all">
                    <div>
                      <p className="font-medium text-sm text-[#1A237E]">{quiz.quiz_title}</p>
                      <p className="text-xs text-gray-500">{quiz.course_title} &bull; {new Date(quiz.submitted_at).toLocaleDateString()}</p>
                    </div>
                    <p className={`text-xl font-bold ${quiz.score >= 90 ? 'text-green-600' : quiz.score >= 80 ? 'text-[#1A237E]' : 'text-orange-600'}`}>
                      {Math.round(quiz.score)}%
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
