import { Trophy, Award } from 'lucide-react';
import { Badge } from './ui/badge';
import { cn } from './ui/utils';
import {
  formatGWA,
  getGWADescriptor,
  getGWAColorClass,
  isPassingGWA,
} from '../lib/gwa-calculator';

interface GWADisplayProps {
  gwa: number;
  percentage?: number;
  variant?: 'full' | 'compact' | 'badge';
  showDescriptor?: boolean;
  className?: string;
}

/**
 * GWA Display Component
 * Shows GWA grade with optional percentage and descriptor
 *
 * @param gwa - GWA grade (1.0-5.0)
 * @param percentage - Optional percentage grade
 * @param variant - Display variant (full, compact, badge)
 * @param showDescriptor - Show descriptor text (Excellent, Good, etc.)
 */
export function GWADisplay({
  gwa,
  percentage,
  variant = 'compact',
  showDescriptor = true,
  className,
}: GWADisplayProps) {
  const descriptor = getGWADescriptor(gwa);
  const colorClass = getGWAColorClass(gwa);
  const isPassing = isPassingGWA(gwa);

  // Badge variant
  if (variant === 'badge') {
    return (
      <Badge
        variant={isPassing ? 'default' : 'destructive'}
        className={cn(
          'gap-1',
          isPassing ? 'bg-green-600' : 'bg-red-600',
          className
        )}
      >
        <Trophy className="h-3 w-3" />
        GWA: {formatGWA(gwa)}
      </Badge>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="text-center">
          <div className="flex items-center gap-1.5">
            {percentage !== undefined && (
              <span className="text-sm text-gray-600">{percentage}%</span>
            )}
            <span className="text-xs text-gray-400">•</span>
            <span className={cn('text-sm font-bold', colorClass)}>
              GWA: {formatGWA(gwa)}
            </span>
          </div>
          {showDescriptor && (
            <p className="text-xs text-gray-500 mt-0.5">{descriptor}</p>
          )}
        </div>
      </div>
    );
  }

  // Full variant
  return (
    <div className={cn('space-y-3', className)}>
      <div className="grid grid-cols-2 gap-4">
        {/* Percentage Card */}
        {percentage !== undefined && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <Award className="h-4 w-4 text-blue-600" />
              <p className="text-xs font-medium text-blue-700">Percentage</p>
            </div>
            <p className="text-3xl font-bold text-blue-900">{percentage}%</p>
          </div>
        )}

        {/* GWA Card */}
        <div
          className={cn(
            'rounded-lg p-4 border',
            isPassing
              ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
              : 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200'
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            <Trophy
              className={cn('h-4 w-4', isPassing ? 'text-green-600' : 'text-red-600')}
            />
            <p
              className={cn(
                'text-xs font-medium',
                isPassing ? 'text-green-700' : 'text-red-700'
              )}
            >
              GWA
            </p>
          </div>
          <p
            className={cn(
              'text-3xl font-bold',
              isPassing ? 'text-green-900' : 'text-red-900'
            )}
          >
            {formatGWA(gwa)}
          </p>
          {showDescriptor && (
            <p
              className={cn(
                'text-xs mt-1',
                isPassing ? 'text-green-700' : 'text-red-700'
              )}
            >
              {descriptor}
            </p>
          )}
        </div>
      </div>

      {/* Grade Scale Reference */}
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
        <p className="text-xs font-medium text-gray-700 mb-2">GWA Scale:</p>
        <div className="grid grid-cols-2 gap-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">1.0-1.5:</span>
            <span className="font-medium text-green-700">Excellent/Very Good</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">1.75-2.5:</span>
            <span className="font-medium text-blue-700">Good/Satisfactory</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">2.75-3.0:</span>
            <span className="font-medium text-amber-700">Passing</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">5.0:</span>
            <span className="font-medium text-red-700">Failed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
