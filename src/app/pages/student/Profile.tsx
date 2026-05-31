import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import {
  User,
  Mail,
  Save,
  Camera,
  GraduationCap,
  CreditCard,
  Bell,
  Globe,
  Clock,
  Shield,
  Key,
  Building,
  BookOpen,
  Award
} from 'lucide-react';
import { toast } from 'sonner';
import * as apiV2 from '../../lib/api-v2';
import { useAuth } from '../../../lib/AuthContext';

export function StudentProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  // Profile fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [profilePicture, setProfilePicture] = useState('');

  // Preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState('Asia/Manila');

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const result = await apiV2.Student.getProfile();
      setProfile(result.profile);
      setFullName(result.profile.name || result.profile.full_name || '');
      setEmail(result.profile.email || '');
      setProfilePicture(result.profile.profile_picture_url || '');
      setEmailNotifications(result.profile.preferences?.email_notifications ?? true);
      setLanguage(result.profile.preferences?.language || 'en');
      setTimezone(result.profile.preferences?.timezone || 'Asia/Manila');
    } catch (error: any) {
      console.error('Failed to load profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await apiV2.Student.updateProfile({
        full_name: fullName,
        email,
        profile_picture_url: profilePicture,
        preferences: {
          email_notifications: emailNotifications,
          language,
          timezone
        }
      });
      toast.success('Profile updated successfully!');
      await loadProfile();
    } catch (error: any) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    try {
      await apiV2.Student.changePassword({
        current_password: currentPassword,
        new_password: newPassword
      });
      toast.success('Password changed successfully!');
      setPasswordDialogOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error('Failed to change password');
    }
  };

  const isAcademeStudent = profile?.enrollment_type === 'academe_student';

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[var(--royal-blue)] border-r-transparent"></div>
          <p className="mt-4" style={{ color: 'var(--muted-foreground)' }}>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8 bg-gradient-to-r from-[#090F2E] via-[#1A237E] to-[#283593] text-white p-6 rounded-2xl shadow-xl border-b-[3px] border-[#FFB300]">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center overflow-hidden">
            {profilePicture ? (
              <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="h-10 w-10 text-[#1A237E]" />
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-1">{fullName || 'Student'}</h1>
            <p className="text-blue-200/70">{email}</p>
            <div className="flex gap-2 mt-2">
              <Badge style={{
                background: isAcademeStudent ? 'var(--accent-blue-50)' : 'var(--accent-gold-50)',
                color: isAcademeStudent ? 'var(--royal-blue)' : 'var(--gold)'
              }}>
                {isAcademeStudent ? 'Student' : 'Certificatory Client'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Personal Information */}
        <TabsContent value="personal" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle style={{ color: 'var(--royal-blue)' }}>Personal Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative mt-2">
                  <Input
                    id="fullName"
                    value={fullName}
                    readOnly
                    disabled
                    className="pr-10 bg-gray-50 cursor-not-allowed"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" title="Name is locked after registration">
                    🔒
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Your name is locked — it is printed on your certificates.</p>
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <div className="relative mt-2">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="pl-10"
                  />
                </div>
              </div>

              {isAcademeStudent && profile && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Student ID</Label>
                      <Input value={profile.student_id || 'N/A'} disabled className="mt-2" />
                    </div>
                    <div>
                      <Label>Program</Label>
                      <Input value={profile.program || 'N/A'} disabled className="mt-2" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Year Level</Label>
                      <Input value={profile.year_level ? `Year ${profile.year_level}` : 'N/A'} disabled className="mt-2" />
                    </div>
                    <div>
                      <Label>Institution</Label>
                      <Input value="Leyte Normal University" disabled className="mt-2" />
                    </div>
                  </div>
                </>
              )}

              <div className="pt-4">
                <Button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="gap-2"
                  style={{ background: 'var(--royal-blue)', color: 'white' }}
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {isAcademeStudent && profile?.class_codes && (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ color: 'var(--royal-blue)' }}>
                  <GraduationCap className="h-5 w-5" />
                  My Class Codes
                </CardTitle>
                <CardDescription>Active class enrollments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {profile.class_codes.map((classCode: any) => (
                    <div key={classCode.id} className="p-3 rounded-lg border-2" style={{ borderColor: 'var(--border)' }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold" style={{ color: 'var(--foreground)' }}>{classCode.code}</p>
                          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                            {classCode.section} • {classCode.course_title}
                          </p>
                        </div>
                        <Badge style={{ background: 'var(--accent-green-50)', color: 'var(--success)' }}>
                          Active
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Preferences */}
        <TabsContent value="preferences" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle style={{ color: 'var(--royal-blue)' }}>Preferences</CardTitle>
              <CardDescription>Customize your learning experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'var(--accent-blue-50)' }}>
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5" style={{ color: 'var(--royal-blue)' }} />
                  <div>
                    <p className="font-medium" style={{ color: 'var(--foreground)' }}>Email Notifications</p>
                    <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                      Receive updates about your courses and certificates
                    </p>
                  </div>
                </div>
                <Button
                  variant={emailNotifications ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEmailNotifications(!emailNotifications)}
                  style={emailNotifications ? { background: 'var(--royal-blue)', color: 'white' } : {}}
                >
                  {emailNotifications ? 'On' : 'Off'}
                </Button>
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Globe className="h-4 w-4" />
                  Language
                </Label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <option value="en">English</option>
                  <option value="fil">Filipino</option>
                </select>
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4" />
                  Timezone
                </Label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <option value="Asia/Manila">Asia/Manila (PHT)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>

              <div className="pt-4">
                <Button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="gap-2"
                  style={{ background: 'var(--royal-blue)', color: 'white' }}
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Preferences'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: 'var(--royal-blue)' }}>
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg" style={{ background: 'var(--accent-blue-50)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Key className="h-5 w-5" style={{ color: 'var(--royal-blue)' }} />
                    <div>
                      <p className="font-medium" style={{ color: 'var(--foreground)' }}>Password</p>
                      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                        Last changed {new Date().toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setPasswordDialogOpen(true)}
                  >
                    Change Password
                  </Button>
                </div>
              </div>

              <div className="p-4 rounded-lg border-2" style={{ borderColor: 'var(--border)' }}>
                <p className="text-sm mb-2" style={{ color: 'var(--muted-foreground)' }}>Account created:</p>
                <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                  {new Date(profile?.created_at || Date.now()).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--royal-blue)' }}>Change Password</DialogTitle>
            <DialogDescription>Enter your current and new password</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-2"
              />
              <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                Must be at least 8 characters
              </p>
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleChangePassword}
              style={{ background: 'var(--royal-blue)', color: 'white' }}
            >
              Change Password
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
