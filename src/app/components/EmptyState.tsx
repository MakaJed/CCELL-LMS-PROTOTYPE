import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';
import { Button } from './ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: LucideIcon;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon: ActionIcon,
  className = '',
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col items-center justify-center py-12 sm:py-16 px-4 text-center ${className}`}
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#E8EAF6] to-[#C5CAE9] rounded-2xl flex items-center justify-center mb-4 sm:mb-6 shadow-lg"
      >
        <Icon className="h-8 w-8 sm:h-10 sm:w-10 text-[#1A237E]" aria-hidden="true" />
      </motion.div>
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm sm:text-base text-gray-600 mb-6 max-w-md">{description}</p>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="gap-2 bg-[#1A237E] hover:bg-[#283593] text-white font-semibold"
        >
          {ActionIcon && <ActionIcon className="h-4 w-4" />}
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}
