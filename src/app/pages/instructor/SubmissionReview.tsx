import { useEffect } from 'react';
import { useNavigate } from 'react-router';

export function SubmissionReview() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/instructor/grading', { replace: true }); }, [navigate]);
  return null;
}
