import { useState } from 'react';
import { Heart } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn } from './ui/utils';
import { toast } from 'sonner';
import * as apiV2 from '../lib/api-v2';

interface CourseRecommendationProps {
  courseId: string;
  initialRecommendations?: number;
  isEnrolled?: boolean;
  hasRecommended?: boolean;
  variant?: 'button' | 'count' | 'full';
  className?: string;
  onToggle?: (newCount: number, nowRecommended: boolean) => void;
}

/**
 * Course Recommendation Component
 * Allows enrolled students to recommend courses (like button)
 * Displays recommendation count for all users
 *
 * @param courseId - Course ID
 * @param initialRecommendations - Initial recommendation count
 * @param isEnrolled - Whether current user is enrolled
 * @param hasRecommended - Whether user has already recommended
 * @param variant - Display variant (button, count, full)
 */
export function CourseRecommendation({
  courseId,
  initialRecommendations = 0,
  isEnrolled = false,
  hasRecommended = false,
  variant = 'full',
  className,
  onToggle,
}: CourseRecommendationProps) {
  const [recommendations, setRecommendations] = useState(initialRecommendations);
  const [recommended, setRecommended] = useState(hasRecommended);
  const [loading, setLoading] = useState(false);

  const handleRecommend = async () => {
    if (!isEnrolled) {
      toast.error('You must be enrolled to recommend this course');
      return;
    }

    if (loading) return;

    setLoading(true);
    try {
      if (recommended) {
        await apiV2.unrecommendCourse(courseId);
        const newCount = recommendations - 1;
        setRecommended(false);
        setRecommendations(newCount);
        onToggle?.(newCount, false);
        toast.success('Recommendation removed');
      } else {
        await apiV2.recommendCourse(courseId);
        const newCount = recommendations + 1;
        setRecommended(true);
        setRecommendations(newCount);
        onToggle?.(newCount, true);
        toast.success('Course recommended! 👍');
      }
    } catch (error: any) {
      console.error('Recommendation error:', error);
      toast.error(error.message || 'Failed to update recommendation');
    } finally {
      setLoading(false);
    }
  };

  // Count only variant
  if (variant === 'count') {
    return (
      <div className={cn('flex items-center gap-1.5 text-sm text-gray-600', className)}>
        <Heart className="h-4 w-4 text-red-500" />
        <span className="font-medium">{recommendations}</span>
        <span className="text-gray-500">
          {recommendations === 1 ? 'recommendation' : 'recommendations'}
        </span>
      </div>
    );
  }

  // Button only variant
  if (variant === 'button') {
    if (!isEnrolled) return null;

    return (
      <Button
        onClick={handleRecommend}
        disabled={loading}
        size="sm"
        variant={recommended ? 'default' : 'outline'}
        className={cn(
          'gap-2',
          recommended
            ? 'bg-red-500 hover:bg-red-600 text-white border-0'
            : 'border-red-300 text-red-600 hover:bg-red-50',
          className
        )}
      >
        <Heart className={cn('h-4 w-4', recommended && 'fill-current')} />
        {recommended ? 'Recommended' : 'Recommend'}
      </Button>
    );
  }

  // Full variant (button + count)
  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Recommendation count */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-lg border border-red-100">
        <Heart className="h-4 w-4 text-red-500 fill-current" />
        <div className="text-center">
          <p className="text-lg font-bold text-red-600">{recommendations}</p>
          <p className="text-xs text-gray-500 leading-tight">
            {recommendations === 1 ? 'recommendation' : 'recommendations'}
          </p>
        </div>
      </div>

      {/* Recommend button (only show if enrolled) */}
      {isEnrolled && (
        <Button
          onClick={handleRecommend}
          disabled={loading}
          size="sm"
          variant={recommended ? 'default' : 'outline'}
          className={cn(
            'gap-2',
            recommended
              ? 'bg-red-500 hover:bg-red-600 text-white border-0'
              : 'border-red-300 text-red-600 hover:bg-red-50'
          )}
        >
          <Heart className={cn('h-4 w-4', recommended && 'fill-current')} />
          {recommended ? 'Recommended' : 'Recommend'}
        </Button>
      )}
    </div>
  );
}

/**
 * Recommendation Badge - compact display for course cards
 */
export function RecommendationBadge({
  count,
  showIcon = true,
  className,
}: {
  count: number;
  showIcon?: boolean;
  className?: string;
}) {
  if (count === 0) return null;

  return (
    <Badge variant="secondary" className={cn('gap-1 bg-red-50 text-red-600 border-red-200', className)}>
      {showIcon && <Heart className="h-3 w-3 fill-current" />}
      {count} {count === 1 ? 'recommendation' : 'recommendations'}
    </Badge>
  );
}
