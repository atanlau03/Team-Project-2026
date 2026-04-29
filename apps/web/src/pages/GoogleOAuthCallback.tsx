import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TOKEN_KEY } from '../lib/axios';
import { useQueryClient } from '@tanstack/react-query';
import { userKeys } from '../hooks/useAuth';
import { googleOAuthCallback } from '../api/auth';

export default function GoogleOAuthCallback() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const hasAttemptedRef = useRef(false);

  useEffect(() => {
    if (hasAttemptedRef.current) return;
    hasAttemptedRef.current = true;
    
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (code) {
      googleOAuthCallback(code, state || undefined)
        .then((data) => {
          localStorage.setItem(TOKEN_KEY, data.access_token);
          queryClient.invalidateQueries({ queryKey: userKeys.me });
          navigate('/dashboard', { replace: true });
        })
        .catch((err) => {
          console.error('OAuth Error:', err);
          navigate('/login?error=oauth_failed', { replace: true });
        });
    } else {
      const accessToken = searchParams.get('access_token');
      if (accessToken) {
        localStorage.setItem(TOKEN_KEY, accessToken);
        queryClient.invalidateQueries({ queryKey: userKeys.me });
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/login?error=oauth_failed', { replace: true });
      }
    }
  }, [searchParams, navigate, queryClient]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="font-body text-on-surface-variant text-sm">{t('common.loading')}</p>
      </div>
    </div>
  );
}
