import { useEffect } from 'react';
import { useNavigate } from 'react-router';

export function InstructorAnalytics() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/instructor/students', { replace: true });
  }, [navigate]);

  return null;
}
