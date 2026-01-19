import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

/**
 * Handles Supabase OAuth and email confirmation redirects.
 * Add this URL to your Supabase project: Authentication > URL Configuration > Redirect URLs
 * - Development: http://localhost:5173/auth/callback
 * - Production: https://yourdomain.com/auth/callback
 */
export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/connect', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <p className="text-gray-600 dark:text-gray-400">Signing you in...</p>
    </div>
  );
}
