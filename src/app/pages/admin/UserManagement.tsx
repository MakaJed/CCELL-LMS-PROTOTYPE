import { useState, useEffect } from 'react';
import * as apiV2 from '../../lib/api-v2';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import {
  Users, Search, Filter, MoreHorizontal, UserCheck, UserX, Shield, GraduationCap,
  BookOpen, Mail, Calendar, RotateCcw, Plus, Edit, Trash2, Eye, Crown
} from 'lucide-react';
import { toast } from 'sonner';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
  status: 'active' | 'suspended' | 'pending';
  joinDate: string;
  courses: number;
  lastActive: string;
}


const roleIcons: Record<string, React.ReactNode> = {
  student: <BookOpen className="h-3.5 w-3.5" />,
  instructor: <GraduationCap className="h-3.5 w-3.5" />,
  admin: <Crown className="h-3.5 w-3.5" />,
};

const roleColors: Record<string, string> = {
  student: 'bg-blue-100 text-blue-800',
  instructor: 'bg-[#FFB300]/20 text-[#1A237E]',
  admin: 'bg-purple-100 text-purple-800',
};

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  suspended: 'bg-red-100 text-red-800',
  pending: 'bg-amber-100 text-amber-800',
};

export function UserManagement() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const result = await apiV2.Admin.getUsers();
      const mapped: UserRecord[] = (result.users || []).map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.is_suspended ? 'suspended' : 'active',
        joinDate: u.created_at || new Date().toISOString(),
        courses: u.total_courses_completed || 0,
        lastActive: u.updated_at ? new Date(u.updated_at).toLocaleDateString() : 'Unknown',
      }));
      setUsers(mapped);
    } catch (err: any) {
      toast.error('Failed to load users: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'instructor' as 'student' | 'instructor' | 'admin' });
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = users.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (statusFilter !== 'all' && u.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    }
    return true;
  });

  const promoteUser = async (userId: string, newRole: 'student' | 'instructor' | 'admin') => {
    const u = users.find(x => x.id === userId);
    if (!u || u.role === newRole) return;
    try {
      await apiV2.Admin.updateUser(userId, { role: newRole });
      setUsers(prev => prev.map(x => x.id === userId ? { ...x, role: newRole } : x));
      if (selectedUser?.id === userId) setSelectedUser(prev => prev ? { ...prev, role: newRole } : null);
      toast.success('Role updated', { description: `${u.name} is now ${newRole}.` });
    } catch (err: any) {
      toast.error('Failed to update role: ' + (err.message || 'Unknown error'));
    }
  };

  const toggleStatus = async (userId: string) => {
    const u = users.find(x => x.id === userId);
    if (!u) return;
    const shouldSuspend = u.status === 'active';
    try {
      await apiV2.Admin.suspendUser(userId, shouldSuspend);
      setUsers(prev => prev.map(x =>
        x.id === userId ? { ...x, status: shouldSuspend ? 'suspended' : 'active' } : x
      ));
      toast.success(`User ${shouldSuspend ? 'suspended' : 'activated'}`, {
        description: `${u.name} has been ${shouldSuspend ? 'suspended' : 'reactivated'}.`,
      });
    } catch (err: any) {
      toast.error('Failed to update user: ' + (err.message || 'Unknown error'));
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.password.trim()) {
      toast.error('Name, email, and password are required');
      return;
    }
    setCreating(true);
    try {
      await apiV2.Admin.createUser({ full_name: newUser.name, email: newUser.email, password: newUser.password, role: newUser.role });
      toast.success(`${newUser.name} has been provisioned as ${newUser.role}`);
      setCreateOpen(false);
      setNewUser({ name: '', email: '', password: '', role: 'instructor' });
      await loadUsers();
    } catch (err: any) {
      toast.error('Failed to create user: ' + (err.message || 'Unknown error'));
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = (userId: string, name: string) => {
    setDeleteTarget({ id: userId, name });
    setSelectedUser(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiV2.Admin.deleteUser(deleteTarget.id);
      setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
      toast.success(`${deleteTarget.name} has been deleted`);
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error('Failed to delete user: ' + (err.message || 'Unknown error'));
    } finally {
      setDeleting(false);
    }
  };

  const studentCount = users.filter(u => u.role === 'student').length;
  const instructorCount = users.filter(u => u.role === 'instructor').length;
  const activeCount = users.filter(u => u.status === 'active').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Header */}
      <div className="mb-8 bg-gradient-to-r from-[#0D1642] via-[#1A237E] to-[#283593] text-white p-8 rounded-2xl shadow-xl border-b-4 border-[#FFB300] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFB300]/5 rounded-full -mr-32 -mt-32" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-7 w-7 text-[#FFB300]" />
            <h1 className="text-3xl font-bold">User Management</h1>
          </div>
          <p className="text-blue-200">Manage students, instructors, and administrators</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="border-2 border-blue-200">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="h-5 w-5 text-[#1A237E]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1A237E]">{users.length}</p>
                <p className="text-xs text-gray-600">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-blue-200">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">{studentCount}</p>
                <p className="text-xs text-gray-600">Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-[#FFB300]/30">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#FFB300]/10 rounded-xl flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-[#FFB300]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1A237E]">{instructorCount}</p>
                <p className="text-xs text-gray-600">Instructors</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-green-200">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{activeCount}</p>
                <p className="text-xs text-gray-600">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg mb-6">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="student">Students</SelectItem>
                <SelectItem value="instructor">Instructors</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            {(roleFilter !== 'all' || statusFilter !== 'all' || search) && (
              <Button variant="outline" onClick={() => { setRoleFilter('all'); setStatusFilter('all'); setSearch(''); }} className="gap-2">
                <RotateCcw className="h-4 w-4" /> Clear
              </Button>
            )}
            <Button onClick={() => setCreateOpen(true)} className="gap-2 text-white" style={{ background: 'var(--royal-blue)' }}>
              <Plus className="h-4 w-4" /> Add User
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* User Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-[#1A237E] to-[#283593] text-white rounded-t-lg">
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-[#FFB300]" />
            Users ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-2">
            {filtered.map(user => (
              <div
                key={user.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border-2 border-gray-100 hover:border-[#1A237E]/20 transition-all hover:shadow-sm cursor-pointer"
                onClick={() => setSelectedUser(user)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#1A237E] to-[#283593] rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {user.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-[#1A237E]">{user.name}</p>
                      <Badge className={`${roleColors[user.role]} gap-1 text-xs`}>
                        {roleIcons[user.role]} {user.role}
                      </Badge>
                      <Badge className={`${statusColors[user.status]} text-xs`}>{user.status}</Badge>
                    </div>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="hidden md:inline">{user.courses} courses</span>
                  <span className="hidden md:inline text-xs">{user.lastActive}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className={user.status === 'active' ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}
                    onClick={(e) => { e.stopPropagation(); toggleStatus(user.id); }}
                  >
                    {user.status === 'active' ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User Detail Modal */}
      <Dialog open={!!selectedUser} onOpenChange={v => { if (!v) setSelectedUser(null); }}>
        <DialogContent className="sm:max-w-md">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle className="text-[#1A237E]">User Details</DialogTitle>
                <DialogDescription>Manage {selectedUser.name}'s account</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-[#E8EAF6] to-[#FFF8E1] rounded-xl">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#1A237E] to-[#283593] rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {selectedUser.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </div>
                  <div>
                    <p className="font-bold text-[#1A237E]">{selectedUser.name}</p>
                    <p className="text-sm text-gray-600">{selectedUser.email}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge className={`${roleColors[selectedUser.role]} gap-1 text-xs`}>{roleIcons[selectedUser.role]} {selectedUser.role}</Badge>
                      <Badge className={`${statusColors[selectedUser.status]} text-xs`}>{selectedUser.status}</Badge>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500">Joined</p>
                    <p className="font-medium text-sm">{new Date(selectedUser.joinDate).toLocaleDateString()}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500">Courses</p>
                    <p className="font-bold text-sm text-[#1A237E]">{selectedUser.courses}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500">Last Active</p>
                    <p className="font-medium text-sm">{selectedUser.lastActive}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500">User ID</p>
                    <p className="font-mono text-xs">{selectedUser.id}</p>
                  </div>
                </div>
                {/* Role Promotion */}
                <div className="p-3 rounded-xl border-2" style={{ borderColor: 'var(--border)', background: 'var(--accent-blue-50)' }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: 'var(--royal-blue)' }}>
                    <Crown className="h-3.5 w-3.5 inline mr-1" />Assign Role
                  </p>
                  <Select value={selectedUser.role} onValueChange={(v) => promoteUser(selectedUser.id, v as any)}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="instructor">Instructor</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button
                    className="flex-1 gap-2"
                    variant="outline"
                    onClick={() => { toggleStatus(selectedUser.id); setSelectedUser(null); }}
                  >
                    {selectedUser.status === 'active' ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                    {selectedUser.status === 'active' ? 'Suspend' : 'Activate'}
                  </Button>
                  <Button className="flex-1 gap-2 bg-[#1A237E] hover:bg-[#283593] text-white" onClick={() => { window.location.href = `mailto:${selectedUser.email}?subject=CCELL-LNU Platform Notice`; setSelectedUser(null); }}>
                    <Mail className="h-4 w-4" /> Email User
                  </Button>
                  <Button
                    className="w-full gap-2"
                    variant="outline"
                    onClick={() => handleDeleteUser(selectedUser.id, selectedUser.name)}
                    style={{ borderColor: 'rgb(239,68,68)', color: 'rgb(239,68,68)' }}
                  >
                    <Trash2 className="h-4 w-4" /> Delete User
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete User</DialogTitle>
            <DialogDescription>
              Permanently delete <strong>{deleteTarget?.name}</strong>? This removes all their data and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
            <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={confirmDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1A237E]">Provision Staff Account</DialogTitle>
            <DialogDescription>Directly create an Instructor or Admin account. Students must register themselves via the public sign-up page.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Full Name *</Label>
              <Input
                value={newUser.name}
                onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Maria Santos"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={newUser.email}
                onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))}
                placeholder="user@lnu.edu.ph"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Temporary Password *</Label>
              <Input
                type="password"
                value={newUser.password}
                onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))}
                placeholder="Minimum 8 characters"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Role *</Label>
              <Select value={newUser.role} onValueChange={v => setNewUser(p => ({ ...p, role: v as any }))}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instructor">Instructor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button
                className="flex-1 text-white"
                style={{ background: 'var(--royal-blue)' }}
                onClick={handleCreateUser}
                disabled={creating}
              >
                {creating ? 'Creating...' : `Provision ${newUser.role.charAt(0).toUpperCase() + newUser.role.slice(1)}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
