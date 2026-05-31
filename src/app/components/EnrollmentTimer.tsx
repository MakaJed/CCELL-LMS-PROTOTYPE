import { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { Badge } from './ui/badge';
import { cn } from './ui/utils';

interface EnrollmentTimerProps {
  expiresAt: string | null | undefined;
  enrollmentType: string;
  variant?: 'compact' | 'full' | 'badge';
  className?: string;
}

/**
 * EnrollmentTimer Component
 * Shows countdown timer for time-limited enrollments (certificatory)
 *
 * @param expiresAt - ISO timestamp when enrollment expires
 * @param enrollmentType - Type of enrollment (certificatory, academe_student, academe_paid)
 * @param variant - Display variant (compact, full, badge)
 */
export function EnrollmentTimer({
  expiresAt,
  enrollmentType,
  variant = 'compact',
  className
}: EnrollmentTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  } | null>(null);

  useEffect(() => {
    if (!expiresAt) {
      setTimeRemaining(null);
      return;
    }

    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true,
        };
      }

      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        isExpired: false,
      };
    };

    // Initial calculation
    setTimeRemaining(calculateTimeRemaining());

    // Update every second
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  // Don't show timer for non-expiring enrollments
  if (enrollmentType === 'academe_paid' || !expiresAt) {
    return null;
  }

  if (!timeRemaining) {
    return null;
  }

  const { days, hours, minutes, seconds, isExpired } = timeRemaining;

  // Determine urgency level
  const isUrgent = days < 7 && !isExpired; // Less than 7 days
  const isCritical = days < 3 && !isExpired; // Less than 3 days

  // Badge variant
  if (variant === 'badge') {
    if (isExpired) {
      return (
        <Badge variant="destructive" className={cn("gap-1", className)}>
          <AlertCircle className="h-3 w-3" />
          Expired
        </Badge>
      );
    }

    return (
      <Badge
        variant={isCritical ? "destructive" : isUrgent ? "default" : "secondary"}
        className={cn("gap-1", isCritical ? "bg-red-600" : isUrgent ? "bg-amber-600" : "", className)}
      >
        <Clock className="h-3 w-3" />
        {days > 0 ? `${days}d left` : `${hours}h ${minutes}m`}
      </Badge>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    if (isExpired) {
      return (
        <div className={cn("flex items-center gap-2 text-red-600 text-sm font-medium", className)}>
          <AlertCircle className="h-4 w-4" />
          <span>Expired</span>
        </div>
      );
    }

    return (
      <div className={cn(
        "flex items-center gap-2 text-sm font-medium",
        isCritical ? "text-red-600" : isUrgent ? "text-amber-600" : "text-gray-600",
        className
      )}>
        <Clock className="h-4 w-4" />
        <span>
          {days > 0 && `${days}d `}
          {hours}h {minutes}m {seconds}s
        </span>
      </div>
    );
  }

  // Full variant
  if (isExpired) {
    return (
      <div className={cn(
        "border-2 border-red-200 bg-red-50 rounded-lg p-4",
        className
      )}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-bold text-red-900">Enrollment Expired</p>
            <p className="text-sm text-red-700">Re-enroll to continue accessing this course</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "border-2 rounded-lg p-4",
      isCritical
        ? "border-red-200 bg-red-50"
        : isUrgent
        ? "border-amber-200 bg-amber-50"
        : "border-blue-200 bg-blue-50",
      className
    )}>
      <div className="flex items-center gap-3 mb-3">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center",
          isCritical
            ? "bg-red-600"
            : isUrgent
            ? "bg-amber-600"
            : "bg-blue-600"
        )}>
          <Clock className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className={cn(
            "font-bold",
            isCritical
              ? "text-red-900"
              : isUrgent
              ? "text-amber-900"
              : "text-blue-900"
          )}>
            {isCritical
              ? "Urgent: Complete Soon!"
              : isUrgent
              ? "Time Running Out"
              : "Time Remaining"}
          </p>
          <p className={cn(
            "text-xs",
            isCritical
              ? "text-red-700"
              : isUrgent
              ? "text-amber-700"
              : "text-blue-700"
          )}>
            Your enrollment expires on {new Date(expiresAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Countdown Display */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Days', value: days },
          { label: 'Hours', value: hours },
          { label: 'Minutes', value: minutes },
          { label: 'Seconds', value: seconds },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-white rounded-lg p-2 text-center"
          >
            <div className={cn(
              "text-2xl font-bold",
              isCritical
                ? "text-red-600"
                : isUrgent
                ? "text-amber-600"
                : "text-blue-600"
            )}>
              {String(item.value).padStart(2, '0')}
            </div>
            <div className="text-xs text-gray-500 mt-1">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
