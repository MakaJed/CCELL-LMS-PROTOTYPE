import { motion } from 'motion/react';

interface PageLoaderProps {
  message?: string;
  fullScreen?: boolean;
}

export function PageLoader({ message = 'Loading...', fullScreen = false }: PageLoaderProps) {
  const containerClass = fullScreen
    ? 'min-h-screen flex items-center justify-center bg-gray-50'
    : 'flex items-center justify-center py-12';

  return (
    <div className={containerClass} role="status" aria-live="polite" aria-label={message}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="text-center"
      >
        <div className="relative w-16 h-16 mx-auto mb-4">
          <motion.div
            className="absolute inset-0 border-4 border-[#1A237E] border-t-[#FFB300] rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            aria-hidden="true"
          />
        </div>
        <p className="text-[#1A237E] font-medium">{message}</p>
      </motion.div>
    </div>
  );
}
