import { Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Home, ArrowLeft, BookOpen } from 'lucide-react';
import { motion } from 'motion/react';
import lnuLogo from "@/assets/LNULOGO.png";
import ccellLogo from "@/assets/CCELLLOGO.png";

export function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-gradient-to-br from-[#E8EAF6]/40 via-[#F8FAFC] to-[#FFF8E1]/30">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center max-w-md"
      >
        <div className="flex items-center justify-center gap-2 mb-6">
          <img src={lnuLogo} alt="LNU" className="h-10 w-10 opacity-50" />
          <img src={ccellLogo} alt="CCELL" className="h-10 w-10 opacity-50" />
        </div>
        <div className="text-8xl sm:text-9xl font-bold bg-gradient-to-br from-[#1A237E] to-[#FFB300] bg-clip-text text-transparent mb-4">
          404
        </div>
        <h1 className="text-2xl font-bold mb-2 text-[#1A237E]">Page Not Found</h1>
        <p className="text-gray-500 mb-8 text-sm">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Button variant="outline" onClick={() => window.history.back()} className="gap-2 border-[#1A237E]/15 text-[#1A237E] hover:bg-[#E8EAF6]">
            <ArrowLeft className="h-4 w-4" />Go Back
          </Button>
          <Link to="/">
            <Button className="gap-2 bg-[#1A237E] hover:bg-[#283593] text-white">
              <Home className="h-4 w-4" />Home
            </Button>
          </Link>
          <Link to="/catalog">
            <Button variant="outline" className="gap-2 border-[#FFB300]/30 text-[#FFB300] hover:bg-[#FFF8E1]">
              <BookOpen className="h-4 w-4" />Browse Courses
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
