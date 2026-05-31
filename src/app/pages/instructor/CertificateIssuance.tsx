import { useEffect } from 'react';
import { useNavigate } from 'react-router';

export function CertificateIssuance() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/instructor/certificate-templates', { replace: true }); }, [navigate]);
  return null;
}
