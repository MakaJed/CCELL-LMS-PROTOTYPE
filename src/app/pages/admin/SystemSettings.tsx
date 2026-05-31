import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Settings, Shield, Database, Bell, Palette, Globe, Lock, Server,
  Mail, CheckCircle, Save, RotateCcw, Activity, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import * as apiV2 from '../../lib/api-v2';
import lnuLogo from "@/assets/LNULOGO.png";
import ccellLogo from "@/assets/CCELLLOGO.png";

const NOTIF_DEFS = [
  { id: 'notif_enroll', label: 'New enrollment notifications', desc: 'Email admins when a student enrolls' },
  { id: 'notif_payment', label: 'Payment verification alerts', desc: 'Notify when payment receipts are uploaded' },
  { id: 'notif_cert', label: 'Course completion emails', desc: 'Send certificate to students on completion' },
  { id: 'notif_digest', label: 'Weekly analytics digest', desc: 'Send weekly platform report to admins' },
  { id: 'notif_storage', label: 'Low storage warnings', desc: 'Alert when storage reaches 80%' },
];

export function SystemSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    apiV2.Admin.getSettings()
      .then(d => { if (d.settings) setSettings(d.settings); })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const set = (key: string, value: string) => setSettings(prev => ({ ...prev, [key]: value }));
  const toggle = (key: string) => set(key, settings[key] === '1' ? '0' : '1');

  const handleSave = async (keys: string[]) => {
    setSaving(true);
    try {
      const payload = Object.fromEntries(keys.map(k => [k, settings[k] ?? '']));
      await apiV2.Admin.saveSettings(payload);
      toast.success('Settings saved successfully!');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: <Settings className="h-4 w-4" /> },
    { id: 'branding', label: 'Branding', icon: <Palette className="h-4 w-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
    { id: 'security', label: 'Security', icon: <Lock className="h-4 w-4" /> },
    { id: 'system', label: 'System Health', icon: <Activity className="h-4 w-4" /> },
  ];

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-[#1A237E]" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 bg-gradient-to-r from-[#0D1642] via-[#1A237E] to-[#283593] text-white p-8 rounded-2xl shadow-xl border-b-4 border-[#FFB300] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFB300]/5 rounded-full -mr-32 -mt-32" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="h-7 w-7 text-[#FFB300]" />
            <h1 className="text-3xl font-bold">System Settings</h1>
          </div>
          <p className="text-blue-200">Configure platform behavior, branding, and security</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Tabs */}
        <div className="space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-[#1A237E] text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="lg:col-span-3 space-y-6">
          {activeTab === 'general' && (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#1A237E]">General Settings</CardTitle>
                <CardDescription>Basic platform configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Platform Name</Label>
                    <Input value={settings.platform_name || ''} onChange={e => set('platform_name', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Institution</Label>
                    <Input value={settings.institution || ''} onChange={e => set('institution', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Email</Label>
                    <Input value={settings.contact_email || ''} onChange={e => set('contact_email', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Support Phone</Label>
                    <Input value={settings.support_phone || ''} onChange={e => set('support_phone', e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Platform Description</Label>
                  <Textarea value={settings.description || ''} onChange={e => set('description', e.target.value)} rows={3} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Default Currency</Label>
                    <Input defaultValue="PHP (₱)" disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Input defaultValue="Asia/Manila (UTC+8)" disabled />
                  </div>
                </div>
                <Button onClick={() => handleSave(['platform_name','institution','contact_email','support_phone','description'])} disabled={saving} className="bg-[#1A237E] hover:bg-[#283593] text-white gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Changes
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'branding' && (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#1A237E]">Branding & Appearance</CardTitle>
                <CardDescription>Customize the platform look and feel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border-2 border-dashed border-gray-300 rounded-xl text-center">
                    <img src={lnuLogo} alt="LNU Logo" className="h-20 w-20 mx-auto mb-3" />
                    <p className="text-sm font-medium text-[#1A237E]">LNU Logo</p>
                    <p className="text-xs text-gray-400 mt-2">Managed via deployment</p>
                  </div>
                  <div className="p-4 border-2 border-dashed border-gray-300 rounded-xl text-center">
                    <img src={ccellLogo} alt="CCELL Logo" className="h-20 w-20 mx-auto mb-3" />
                    <p className="text-sm font-medium text-[#1A237E]">CCELL Logo</p>
                    <p className="text-xs text-gray-400 mt-2">Managed via deployment</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { key: 'brand_primary', label: 'Primary Color', fallback: '#1A237E' },
                    { key: 'brand_accent', label: 'Accent Color', fallback: '#FFB300' },
                    { key: 'brand_background', label: 'Background', fallback: '#F8FAFC' },
                    { key: 'brand_text', label: 'Text Color', fallback: '#0F172A' },
                  ].map(({ key, label, fallback }) => (
                    <div key={key} className="space-y-2">
                      <Label>{label}</Label>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg border-2 border-gray-200 shrink-0" style={{ background: settings[key] || fallback }} />
                        <Input
                          value={settings[key] || fallback}
                          onChange={e => set(key, e.target.value)}
                          className="font-mono text-sm"
                          maxLength={7}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <Button onClick={() => handleSave(['brand_primary','brand_accent','brand_background','brand_text'])} disabled={saving} className="bg-[#1A237E] hover:bg-[#283593] text-white gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Branding
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#1A237E]">Notification Settings</CardTitle>
                <CardDescription>Configure email and push notification preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {NOTIF_DEFS.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium text-[#1A237E] text-sm">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => toggle(item.id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        settings[item.id] === '1' ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        settings[item.id] === '1' ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                ))}
                <Button onClick={() => handleSave(NOTIF_DEFS.map(n => n.id))} disabled={saving} className="bg-[#1A237E] hover:bg-[#283593] text-white gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Preferences
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#1A237E]">Security Settings</CardTitle>
                <CardDescription>Platform security and access controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'Two-Factor Authentication', desc: 'Require 2FA for admin accounts', status: 'Enforced' },
                  { label: 'Session Timeout', desc: 'Auto-logout after inactivity', status: '30 minutes' },
                  { label: 'Password Policy', desc: 'Minimum requirements for passwords', status: 'Strong' },
                  { label: 'API Rate Limiting', desc: 'Max requests per minute', status: '100 req/min' },
                  { label: 'Row Level Security', desc: 'Supabase RLS policies active', status: 'Active' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium text-[#1A237E] text-sm">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800 gap-1">
                      <CheckCircle className="h-3 w-3" /> {item.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {activeTab === 'system' && (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#1A237E]">System Health</CardTitle>
                <CardDescription>Monitor platform infrastructure</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'SQLite Database', status: 'Online', color: 'green' },
                  { label: 'Express API Server', status: 'Operational', color: 'green' },
                  { label: 'File Storage', status: 'Active', color: 'green' },
                  { label: 'Auth Service (JWT)', status: 'Operational', color: 'green' },
                  { label: 'Static Assets', status: 'Served', color: 'green' },
                  { label: 'Vite Dev Server', status: 'Active', color: 'green' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${item.color === 'green' ? 'bg-green-500' : 'bg-amber-500'} ring-2 ${item.color === 'green' ? 'ring-green-200' : 'ring-amber-200'}`} />
                      <span className="font-medium text-sm text-[#1A237E]">{item.label}</span>
                    </div>
                    <Badge className={item.color === 'green' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                      {item.status}
                    </Badge>
                  </div>
                ))}
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-sm text-[#1A237E] font-medium">Database: server/lms.db (SQLite)</p>
                  <p className="text-xs text-gray-500 mt-1">To back up, copy lms.db from the server directory</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
