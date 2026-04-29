import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from '../lib/axios';

export default function ResetPassword() {
  console.log("ResetPassword component mounted");
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  console.log("Token from URL:", token);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError(t('auth.reset.mismatch', { defaultValue: 'Passwords do not match.' }));
      return;
    }
    if (!token) {
      setError(t('auth.reset.invalid_token', { defaultValue: 'Invalid or missing token.' }));
      return;
    }

    setIsSubmitting(true);
    setError('');
    
    try {
      await axios.post('/auth/reset-password', {
        token,
        password
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || t('auth.reset.error', { defaultValue: 'Failed to reset password. The link may have expired.' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-surface-container to-surface-bright min-h-screen flex items-center justify-center p-4 w-full">
      <main className="w-full max-w-md bg-surface-container-lowest rounded-2xl p-10 shadow-[0_32px_64px_-12px_rgba(29,27,24,0.06)] relative z-10">
        <header className="text-center mb-10">
          <h1 className="font-headline text-3xl font-black text-primary tracking-tighter mb-2">{t('auth.reset.title', { defaultValue: 'New Password' })}</h1>
          <p className="text-on-surface-variant text-sm">
            {success 
              ? t('auth.reset.success_msg', { defaultValue: 'Password reset successful. Redirecting to login...' })
              : t('auth.reset.subtitle', { defaultValue: 'Please enter your new password below.' })}
          </p>
        </header>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-error-container text-on-error-container text-sm font-body text-center">
            {error}
          </div>
        )}

        {success ? (
          <div className="flex justify-center py-4">
            <div className="w-12 h-12 rounded-full bg-success/10 text-success flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">check_circle</span>
            </div>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-on-surface-variant" htmlFor="password">{t('auth.reset.new_password', { defaultValue: 'New Password' })}</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant" style={{ fontSize: '20px' }}>lock</span>
                <input
                  className="w-full bg-surface-container-low border-0 rounded-lg pl-11 pr-4 py-3.5 text-on-surface placeholder:text-outline-variant focus:bg-surface-container-lowest focus:ring-1 focus:ring-outline-variant/40 transition-colors"
                  id="password"
                  required
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-on-surface-variant" htmlFor="confirmPassword">{t('auth.reset.confirm_password', { defaultValue: 'Confirm New Password' })}</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant" style={{ fontSize: '20px' }}>lock_reset</span>
                <input
                  className="w-full bg-surface-container-low border-0 rounded-lg pl-11 pr-4 py-3.5 text-on-surface placeholder:text-outline-variant focus:bg-surface-container-lowest focus:ring-1 focus:ring-outline-variant/40 transition-colors"
                  id="confirmPassword"
                  required
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              className="w-full py-4 mt-4 rounded-[1.5rem] bg-gradient-to-br from-primary to-primary-container text-on-primary font-body font-semibold text-base hover:opacity-90 active:scale-[0.98] transition-all duration-200 shadow-[0_8px_16px_-4px_rgba(81,56,37,0.2)] disabled:opacity-60 flex items-center justify-center gap-2"
              type="submit"
              disabled={isSubmitting || !token}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
              ) : t('auth.reset.submit', { defaultValue: 'Update Password' })}
            </button>
          </form>
        )}

        <div className="mt-10 text-center">
          <Link className="font-medium text-primary hover:text-primary-container hover:underline underline-offset-4 transition-colors text-sm" to="/login">
            {t('auth.reset.back_login', { defaultValue: 'Back to Login' })}
          </Link>
        </div>
      </main>
    </div>
  );
}
