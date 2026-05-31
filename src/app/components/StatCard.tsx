import { Card, CardContent } from './ui/card';
import { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  color?: 'blue' | 'amber' | 'green' | 'purple' | 'red';
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendUp,
  color = 'blue',
  onClick,
}: StatCardProps) {
  const colorStyles = {
    blue: {
      border: 'border-blue-200 hover:border-blue-400',
      bg: 'from-blue-100 to-blue-200',
      text: 'text-blue-900',
      icon: 'text-blue-900',
      trend: trendUp ? 'text-green-600' : 'text-red-600',
    },
    amber: {
      border: 'border-amber-200 hover:border-amber-400',
      bg: 'from-amber-100 to-amber-200',
      text: 'text-amber-900',
      icon: 'text-amber-600',
      trend: trendUp ? 'text-green-600' : 'text-red-600',
    },
    green: {
      border: 'border-green-200 hover:border-green-400',
      bg: 'from-green-100 to-green-200',
      text: 'text-green-900',
      icon: 'text-green-600',
      trend: trendUp ? 'text-green-600' : 'text-red-600',
    },
    purple: {
      border: 'border-purple-200 hover:border-purple-400',
      bg: 'from-purple-100 to-purple-200',
      text: 'text-purple-900',
      icon: 'text-purple-600',
      trend: trendUp ? 'text-green-600' : 'text-red-600',
    },
    red: {
      border: 'border-red-200 hover:border-red-400',
      bg: 'from-red-100 to-red-200',
      text: 'text-red-900',
      icon: 'text-red-600',
      trend: trendUp ? 'text-green-600' : 'text-red-600',
    },
  };

  const styles = colorStyles[color];

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={`border-2 ${styles.border} transition-all shadow-md hover:shadow-xl group cursor-pointer overflow-hidden relative`}
        onClick={onClick}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white to-transparent opacity-50" />
        <CardContent className="pt-6 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-600 font-medium mb-1">{title}</p>
              <p className={`text-3xl font-bold ${styles.text} mb-1`}>
                {typeof value === 'number' ? value.toLocaleString() : value}
              </p>
              {trend && (
                <p className={`text-xs font-semibold ${styles.trend}`}>{trend}</p>
              )}
            </div>
            <motion.div
              className={`w-14 h-14 bg-gradient-to-br ${styles.bg} rounded-2xl flex items-center justify-center shadow-lg`}
              whileHover={{ rotate: 5, scale: 1.1 }}
              transition={{ duration: 0.2 }}
            >
              <Icon className={`h-7 w-7 ${styles.icon}`} />
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
