import { Badge } from './ui/badge';
import { Crown, GraduationCap, User } from 'lucide-react';
import { motion } from 'motion/react';
import lnuLogo from "../../../imports/LEYTE_NORMAL_UNIVERSITY-removebg-preview.png";
import ccellLogo from "../../../imports/ccell-logo.svg";
import { ReactNode } from 'react';

interface RoleBasedHeaderProps {
  role: 'student' | 'instructor' | 'admin';
  name: string;
  subtitle: string;
  actions?: ReactNode;
}

export function RoleBasedHeader({ role, name, subtitle, actions }: RoleBasedHeaderProps) {
  const getRoleConfig = () => {
    switch (role) {
      case 'admin':
        return { icon: <Crown className="h-4 w-4 text-[#FFB300]" />, label: 'Admin' };
      case 'instructor':
        return { icon: <GraduationCap className="h-4 w-4 text-[#FFB300]" />, label: 'Instructor' };
      default:
        return { icon: <User className="h-4 w-4 text-[#FFB300]" />, label: 'Student' };
    }
  };

  const config = getRoleConfig();

  return (
    <motion.div
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-6 sm:mb-8 bg-gradient-to-r from-[#090F2E] via-[#1A237E] to-[#283593] text-white p-5 sm:p-7 rounded-2xl shadow-xl border-b-[3px] border-[#FFB300] relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-48 sm:w-72 h-48 sm:h-72 bg-[#FFB300]/8 rounded-full blur-[80px] -mr-24 -mt-24" />
      <div className="absolute bottom-0 left-0 w-32 sm:w-48 h-32 sm:h-48 bg-blue-400/5 rounded-full blur-[60px] -ml-16 -mb-16" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5">
            <img src={lnuLogo} alt="LNU" className="h-10 w-10" />
            <img src={ccellLogo} alt="CCELL" className="h-10 w-10" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              {config.icon}
              <Badge className="bg-[#FFB300]/15 text-[#FFB300] border-[#FFB300]/30 text-xs">
                {config.label}
              </Badge>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold mb-0.5">Welcome, {name.split(' ')[0]}!</h1>
            <p className="text-sm text-blue-200/70">{subtitle}</p>
          </div>
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </motion.div>
  );
}
