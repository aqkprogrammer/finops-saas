import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function AuthVerify() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      navigate('/login?error=missing_token');
      return;
    }

    // Call backend to verify magic link token and get JWT
    const verifyToken = async () => {
      try {
        const response = await fetch(`/api/v1/auth/verify?token=${token}`, {
          method: 'GET',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.token) {
            // Store JWT and redirect to connect
            localStorage.setItem('authToken', data.token);
            navigate('/connect');
          } else {
            setError('No token in response');
            setTimeout(() => navigate('/login?error=invalid_token'), 2000);
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          setError(errorData.message || 'Token verification failed');
          setTimeout(() => navigate('/login?error=invalid_token'), 2000);
        }
      } catch (err) {
        setError('Failed to verify token');
        setTimeout(() => navigate('/login?error=server_error'), 2000);
      }
    };

    verifyToken();
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <p className="text-gray-600 dark:text-gray-400">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <p className="text-gray-600 dark:text-gray-400">Verifying magic link...</p>
      </div>
    </div>
  );
}
