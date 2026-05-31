import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../../lib/AuthContext';
import { toast } from 'sonner';
import { User, Mail, Lock, Eye, EyeOff, AlertTriangle, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import lnuLogo from "@/assets/LNULOGO.png";
import ccellLogo from "@/assets/CCELLLOGO.png";

export function Signup() {
  const navigate = useNavigate();
  const { signUpStudent } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Full name is required'); return; }
    if (!email.trim()) { toast.error('Email is required'); return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (password !== confirm) { toast.error('Passwords do not match'); return; }

    setLoading(true);
    try {
      await signUpStudent(name.trim(), email.trim(), password);
      toast.success('Account created! Welcome to LNU CCELL.');
      navigate('/student/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-10 px-4 bg-gradient-to-br from-[#E8EAF6]/60 via-[#F8FAFC] to-[#FFF8E1]/40 relative overflow-hidden">
      <div className="absolute top-20 left-20 w-72 h-72 bg-[#1A237E]/5 rounded-full blur-[80px]" />
      <div className="absolute bottom-20 right-20 w-72 h-72 bg-[#FFB300]/5 rounded-full blur-[80px]" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10">
        <Card className="shadow-2xl border-0 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0D1642] via-[#1A237E] to-[#0D1642] p-6 text-center text-white">
            <div className="flex justify-center gap-2 mb-3">
              <img src={lnuLogo} alt="LNU" className="h-11 w-11" />
              <img src={ccellLogo} alt="CCELL" className="h-11 w-11" />
            </div>
            <h1 className="text-xl font-bold text-[#FFB300] mb-1">Create Student Account</h1>
            <p className="text-blue-200/70 text-sm">Join LNU CCELL — student enrolments only</p>
          </div>

          <CardContent className="p-6">
            {/* Name lock notice */}
            <div className="flex items-start gap-3 p-3 mb-5 rounded-xl bg-amber-50 border border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                <strong>Your full name will be printed on certificates</strong> and cannot be changed after registration. Please enter it exactly as it should appear.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full name */}
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input id="name" type="text" placeholder="e.g. Maria Santos" value={name}
                    onChange={e => setName(e.target.value)} className="pl-9"
                    autoComplete="name" required />
                </div>
                <p className="text-xs text-gray-400">As it will appear on your certificates</p>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input id="email" type="email" placeholder="you@example.com" value={email}
                    onChange={e => setEmail(e.target.value)} className="pl-9"
                    autoComplete="email" required />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input id="password" type={showPw ? 'text' : 'password'} placeholder="Min. 6 characters" value={password}
                    onChange={e => setPassword(e.target.value)} className="pl-9 pr-10"
                    autoComplete="new-password" required />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div className="space-y-1.5">
                <Label htmlFor="confirm">Confirm Password <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input id="confirm" type={showCf ? 'text' : 'password'} placeholder="Re-enter password" value={confirm}
                    onChange={e => setConfirm(e.target.value)} className="pl-9 pr-10"
                    autoComplete="new-password" required />
                  <button type="button" onClick={() => setShowCf(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showCf ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirm && password !== confirm && (
                  <p className="text-xs text-red-500">Passwords do not match</p>
                )}
              </div>

              <Button type="submit" size="lg" disabled={loading}
                className="w-full bg-gradient-to-r from-[#1A237E] to-[#283593] hover:opacity-90 text-white border-0 py-5">
                {loading
                  ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating account...</span>
                  : <span className="flex items-center gap-2">Create Account <ArrowRight className="h-4 w-4" /></span>}
              </Button>

              <p className="text-center text-sm text-gray-500">
                Already have an account?{' '}
                <Link to="/login" className="text-[#1A237E] font-semibold hover:underline">Sign in</Link>
              </p>
            </form>
          </CardContent>
        </Card>

        <div className="mt-4 text-center">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#1A237E] transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
