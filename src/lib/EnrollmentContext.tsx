import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as apiV2 from '../app/lib/api-v2';
import type { EnrollmentType } from '../types/database';
import { useAuth } from './AuthContext';

interface Enrollment {
  id: string;
  course_id: string;
  enrollment_type: EnrollmentType;
  status: string;
  progress_percentage: number;
  enrolled_at: string;
  expires_at?: string | null;
  is_expired: boolean;
  course?: {
    id: string;
    title: string;
  };
}

interface EnrollmentContextType {
  enrollments: Enrollment[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getEnrollmentByCourseId: (courseId: string) => Enrollment | undefined;
  isEnrolledInCourse: (courseId: string) => boolean;
}

const EnrollmentContext = createContext<EnrollmentContextType | undefined>(undefined);

export function EnrollmentProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEnrollments = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiV2.getMyEnrollments();
      setEnrollments(result.enrollments || []);
    } catch (err: any) {
      console.warn('[EnrollmentContext] Backend not available (expected in Make preview)');
      setEnrollments([]);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchEnrollments();
    } else {
      setEnrollments([]);
      setLoading(false);
    }
  }, [user?.id]);

  const getEnrollmentByCourseId = (courseId: string): Enrollment | undefined => {
    return enrollments.find(e => e.course_id === courseId || e.course?.id === courseId);
  };

  const isEnrolledInCourse = (courseId: string): boolean => {
    return !!getEnrollmentByCourseId(courseId);
  };

  return (
    <EnrollmentContext.Provider
      value={{
        enrollments,
        loading,
        error,
        refetch: fetchEnrollments,
        getEnrollmentByCourseId,
        isEnrolledInCourse,
      }}
    >
      {children}
    </EnrollmentContext.Provider>
  );
}

export function useEnrollments() {
  const context = useContext(EnrollmentContext);
  if (context === undefined) {
    throw new Error('useEnrollments must be used within EnrollmentProvider');
  }
  return context;
}
