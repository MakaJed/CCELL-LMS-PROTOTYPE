import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Shield, Search, RefreshCw, ChevronLeft, ChevronRight, User, Clock, Activity } from 'lucide-react';
import { toast } from 'sonner';
import * as apiV2 from '../../lib/api-v2';
import lnuLogo from '@/assets/LNULOGO.png';
import ccellLogo from '@/assets/CCELLLOGO.png';

const PAGE_SIZE = 50;

const ACTION_COLORS: Record<string, string> = {
  enroll: 'bg-blue-100 text-blue-700',
  certificate_issued: 'bg-green-100 text-green-700',
  certificate_issue_on_finalize: 'bg-green-100 text-green-700',
  payment_verified: 'bg-emerald-100 text-emerald-700',
  essay_graded: 'bg-purple-100 text-purple-700',
  grade_update: 'bg-purple-100 text-purple-700',
  reopen_approved: 'bg-teal-100 text-teal-700',
  reopen_denied: 'bg-red-100 text-red-700',
  reopen_requested: 'bg-amber-100 text-amber-700',
  extension_granted: 'bg-teal-100 text-teal-700',
  login: 'bg-gray-100 text-gray-700',
  register: 'bg-indigo-100 text-indigo-700',
  role_promoted: 'bg-orange-100 text-orange-700',
};

function actionColor(action: string) {
  return ACTION_COLORS[action] || 'bg-gray-100 text-gray-600';
}

function formatDetails(details: any) {
  if (!details) return '—';
  try {
    const parsed = typeof details === 'string' ? JSON.parse(details) : details;
    return Object.entries(parsed)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' · ');
  } catch {
    return String(details);
  }
}

export function AdminAuditLog() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [actions, setActions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [page, setPage] = useState(0);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiV2.Admin.getAuditLogs({
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        search: search || undefined,
        action: actionFilter !== 'all' ? actionFilter : undefined,
      });
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      if (data.actions?.length) setActions(data.actions);
    } catch {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [search, actionFilter, page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 bg-gradient-to-r from-[#0D1642] via-[#1A237E] to-[#283593] text-white p-8 rounded-2xl shadow-xl border-b-4 border-[#FFB300] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFB300]/5 rounded-full -mr-32 -mt-32" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <img src={lnuLogo} alt="LNU" className="h-12 w-12" />
            <img src={ccellLogo} alt="CCELL" className="h-12 w-12" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-5 w-5 text-[#FFB300]" />
              <Badge className="bg-[#FFB300]/20 text-[#FFB300] border-[#FFB300]/50">Admin</Badge>
            </div>
            <h1 className="text-3xl font-bold">Audit Logs</h1>
            <p className="text-blue-200">Full platform activity trail</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-md mb-6">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(0); }}
                placeholder="Search users, actions, details..."
                className="pl-9"
              />
            </div>
            <Select value={actionFilter} onValueChange={v => { setActionFilter(v); setPage(0); }}>
              <SelectTrigger className="w-52">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {actions.map(a => (
                  <SelectItem key={a} value={a}>{a.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchLogs} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-[#1A237E] flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Log
            <span className="ml-auto text-sm font-normal text-gray-500">{total.toLocaleString()} entries</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#1A237E] border-r-transparent" />
            </div>
          ) : logs.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No audit entries found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left">
                    <th className="px-4 py-3 font-semibold text-gray-600 w-40">Time</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 w-36">Action</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 w-44">User</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 shrink-0" />
                          {new Date(log.created_at).toLocaleString('en-PH', {
                            month: 'short', day: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`text-xs font-medium ${actionColor(log.action)}`}>
                          {log.action.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {log.user_name ? (
                          <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                            <div>
                              <p className="font-medium text-gray-800 leading-tight">{log.user_name}</p>
                              <p className="text-xs text-gray-400 capitalize">{log.user_role}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">System</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">
                        {formatDetails(log.details)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-gray-500">
                Page {page + 1} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setPage(p => p - 1)} disabled={page === 0}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
