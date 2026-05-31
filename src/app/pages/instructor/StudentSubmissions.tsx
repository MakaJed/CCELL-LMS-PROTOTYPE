import { useEffect } from 'react';
import { useNavigate } from 'react-router';

export function StudentSubmissions() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/instructor/grading', { replace: true }); }, [navigate]);
  return null;
}
