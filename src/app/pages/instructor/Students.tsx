import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Users,
  Search,
  ArrowLeft,
  RotateCcw,
  Eye,
  GraduationCap,
} from 'lucide-react';
import { toast } from 'sonner';
import * as apiV2 from '../../lib/api-v2';

export function InstructorStudents() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const res = await apiV2.Instructor.getStudentProgress();
      setStudents(res.students || []);
    } catch (error: any) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  }

  const filtered = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.course_title?.toLowerCase().includes(q);

    const status = s.status || 'active';
    const isExpired = s.expires_at ? new Date(s.expires_at) < new Date() : false;
    const atRisk = !isExpired && s.expires_at && new Date(s.expires_at) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    let matchesTab = true;
    if (activeTab === 'active') matchesTab = status === 'active' && !isExpired;
    else if (activeTab === 'completed') matchesTab = status === 'completed';
    else if (activeTab === 'expired') matchesTab = isExpired;
    else if (activeTab === 'at_risk') matchesTab = atRisk;
    else if (activeTab === 'inactive') matchesTab = status === 'suspended';

    return matchesSearch && matchesTab;
  });

  const handleReopen = async (enrollmentId: string) => {
    try {
      await apiV2.Instructor.grantExtension(enrollmentId, 30);
      toast.success('Course access extended by 30 days.');
      await loadData();
    } catch (error: any) {
      toast.error('Failed to reopen course access');
    }
  };

  const statusBadge = (s: any) => {
    const isExpired = s.expires_at ? new Date(s.expires_at) < new Date() : false;
    if (s.status === 'completed') return <Badge className="bg-green-100 text-green-700 border-green-200">Completed</Badge>;
    if (s.status === 'suspended') return <Badge className="bg-gray-100 text-gray-700 border-gray-200">Inactive</Badge>;
    if (isExpired) return <Badge className="bg-red-100 text-red-700 border-red-200">Expired</Badge>;
    if (s.expires_at && new Date(s.expires_at) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) {
      return <Badge className="bg-amber-100 text-amber-700 border-amber-200">At Risk</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Active</Badge>;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="mb-6 sm:mb-8 bg-gradient-to-r from-[#090F2E] via-[#1A237E] to-[#283593] text-white p-6 rounded-2xl shadow-xl border-b-[3px] border-[#FFB300]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => navigate('/instructor/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Students</h1>
              <p className="text-white/80 text-sm">Manage and monitor your students</p>
            </div>
          </div>
          <Users className="h-10 w-10 text-[#FFB300] opacity-80" />
        </div>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-gray-100">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="at_risk">At Risk</TabsTrigger>
                <TabsTrigger value="expired">Expired</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="inactive">Inactive</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading students...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No students found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((s) => {
                const isExpired = s.expires_at ? new Date(s.expires_at) < new Date() : false;
                return (
                  <div key={s.enrollment_id} className="flex items-center justify-between p-4 rounded-xl border bg-white hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#1A237E]/10 flex items-center justify-center">
                        <GraduationCap className="h-5 w-5 text-[#1A237E]" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#1A237E]">{s.name}</p>
                        <p className="text-sm text-gray-500">{s.email}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{s.course_title} {s.class_code ? `· ${s.class_code}` : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">{s.progress_percentage || 0}%</div>
                        <div className="text-xs text-gray-400">progress</div>
                      </div>
                      {statusBadge(s)}
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => navigate(`/instructor/grading?enrollment=${s.enrollment_id}`)}>
                          <Eye className="h-3.5 w-3.5" />Details
                        </Button>
                        {isExpired && (
                          <Button size="sm" variant="outline" className="gap-1" onClick={() => handleReopen(s.enrollment_id)}>
                            <RotateCcw className="h-3.5 w-3.5" />Reopen
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
