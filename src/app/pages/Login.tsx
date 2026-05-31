import { useAuth } from '../../lib/AuthContext';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { motion } from 'motion/react';
import lnuLogo from "@/assets/LNULOGO.png";
import ccellLogo from "@/assets/CCELLLOGO.png";

function redirectForRole(role: string, from: string | undefined, navigate: (p: string) => void) {
  if (from) navigate(from);
  else if (role === 'student') navigate('/student/dashboard');
  else if (role === 'instructor') navigate('/instructor/dashboard');
  else navigate('/admin/dashboard');
}

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithCredentials, user } = useAuth();
  const from = (location.state as any)?.from;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) redirectForRole(user.role, from, navigate);
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) { toast.error('Please enter your email and password'); return; }
    setLoading(true);
    try {
      await signInWithCredentials(email.trim(), password);
      toast.success('Welcome back!');
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
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
            <h1 className="text-xl font-bold text-[#FFB300] mb-1">LNU CCELL Portal</h1>
            <p className="text-blue-200/70 text-sm">Sign in to your account</p>
          </div>

          <CardContent className="p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input id="email" type="email" placeholder="you@example.com" value={email}
                    onChange={e => setEmail(e.target.value)} className="pl-9" autoComplete="email" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input id="password" type={showPw ? 'text' : 'password'} placeholder="••••••••" value={password}
                    onChange={e => setPassword(e.target.value)} className="pl-9 pr-10" autoComplete="current-password" required />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" size="lg" disabled={loading}
                className="w-full bg-gradient-to-r from-[#1A237E] to-[#283593] hover:opacity-90 text-white border-0 py-5">
                {loading
                  ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in...</span>
                  : <span className="flex items-center gap-2">Sign In <ArrowRight className="h-4 w-4" /></span>}
              </Button>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Don't have an account?{' '}
                  <Link to="/signup" className="text-[#1A237E] font-semibold hover:underline">Create one</Link>
                </span>
                <a href="mailto:ccell@lnu.edu.ph?subject=Password%20Reset%20Request"
                  className="text-gray-400 hover:text-[#1A237E] transition-colors text-xs">
                  Forgot password?
                </a>
              </div>

            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
