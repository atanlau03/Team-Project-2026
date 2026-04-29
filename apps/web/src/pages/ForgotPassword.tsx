import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from '../lib/axios';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      await axios.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err: any) {
      // We don't want to reveal if a user exists or not for security reasons
      // but if it's a validation error, we show it
      if (err.response?.status === 422) {
        setError(t('auth.forgot.invalid_email', { defaultValue: 'Please enter a valid email address.' }));
      } else {
        // For other errors, we still show success to prevent email enumeration
        setSuccess(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-surface-container to-surface-bright min-h-screen flex items-center justify-center p-4 w-full">
      <main className="w-full max-w-md bg-surface-container-lowest rounded-2xl p-10 shadow-[0_32px_64px_-12px_rgba(29,27,24,0.06)] relative z-10">
        <header className="text-center mb-10">
          <h1 className="font-headline text-3xl font-black text-primary tracking-tighter mb-2">{t('auth.forgot.title', { defaultValue: 'Reset Password' })}</h1>
          <p className="text-on-surface-variant text-sm">
            {success 
              ? t('auth.forgot.success_msg', { defaultValue: 'If an account exists with this email, you will receive reset instructions shortly.' })
              : t('auth.forgot.subtitle', { defaultValue: 'Enter your email to receive a password reset link.' })}
          </p>
        </header>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-error-container text-on-error-container text-sm font-body text-center">
            {error}
          </div>
        )}

        {!success ? (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-on-surface-variant" htmlFor="email">{t('auth.login.email')}</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant" style={{ fontSize: '20px' }}>mail</span>
                <input
                  className="w-full bg-surface-container-low border-0 rounded-lg pl-11 pr-4 py-3.5 text-on-surface placeholder:text-outline-variant focus:bg-surface-container-lowest focus:ring-1 focus:ring-outline-variant/40 transition-colors"
                  id="email"
                  placeholder="researcher@lab.edu"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <button
              className="w-full py-4 mt-4 rounded-[1.5rem] bg-gradient-to-br from-primary to-primary-container text-on-primary font-body font-semibold text-base hover:opacity-90 active:scale-[0.98] transition-all duration-200 shadow-[0_8px_16px_-4px_rgba(81,56,37,0.2)] disabled:opacity-60 flex items-center justify-center gap-2"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
              ) : t('auth.forgot.submit', { defaultValue: 'Send Reset Link' })}
            </button>
          </form>
        ) : (
          <div className="mt-8">
            <Link 
              to="/login"
              className="w-full py-4 rounded-[1.5rem] border border-outline-variant/30 text-primary font-body font-semibold text-base flex items-center justify-center gap-2 hover:bg-surface-container-low transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              {t('auth.forgot.back_login', { defaultValue: 'Back to Login' })}
            </Link>
          </div>
        )}

        {!success && (
          <div className="mt-10 text-center">
            <Link className="font-medium text-primary hover:text-primary-container hover:underline underline-offset-4 transition-colors text-sm" to="/login">
              {t('auth.forgot.back_login', { defaultValue: 'Back to Login' })}
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
