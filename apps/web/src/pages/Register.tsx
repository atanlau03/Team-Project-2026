import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { getGoogleOAuthUrl } from '../api/auth';

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register, registerError, isRegisterPending } = useAuth();

  const [fullName, setFullName] = useState('');
  const [organization, setOrganization] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (password !== confirmPassword) {
      setLocalError(t('auth.register.password_mismatch', { defaultValue: 'Passwords do not match.' }));
      return;
    }
    if (password.length < 8) {
      setLocalError(t('auth.register.password_length', { defaultValue: 'Password must be at least 8 characters.' }));
      return;
    }

    try {
      await register({
        email,
        password,
        full_name: fullName,
        organization_name: organization || undefined,
      });
      // Redirect to login with success indicator
      navigate('/login?registered=true', { replace: true });
    } catch {
      // Error is captured by AuthContext
    }
  };

  const handleGoogleRegister = async () => {
    try {
      setLocalError('');
      const url = await getGoogleOAuthUrl();
      window.location.href = url;
    } catch (err: unknown) {
      setLocalError((err as Error)?.message || t('auth.register.google_error', { defaultValue: 'Google OAuth is not available.' }));
    }
  };

  const error = localError || registerError;

  return (
    <div className="min-h-screen flex w-full bg-surface transition-colors duration-500 overflow-hidden">
      {/* Left Panel: Visual Section */}
      <div className="hidden lg:block lg:w-1/2 relative bg-stone-50 overflow-hidden border-r border-outline-variant/10">
        <div className="absolute inset-0 opacity-10 bg-[url('/hero.jpg')] bg-cover bg-center grayscale scale-110"></div>
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-[#5D4037]/5 via-transparent to-transparent"></div>

        <div className="relative h-full flex flex-col justify-center p-20 space-y-10 max-w-3xl animate-in fade-in slide-in-from-left-8 duration-1000">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#5D4037]/10 rounded-full border border-[#5D4037]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5D4037]"></span>
            <span className="text-[10px] uppercase font-black text-[#5D4037] tracking-[0.2em]">{t('landing.hero.tag')}</span>
          </div>
          <div className="space-y-6">
            <h2 className="text-6xl font-black text-stone-900 leading-[1.1] tracking-tight">
              {t('auth.panel.register_hero_title1')}<br />
              {t('auth.panel.register_hero_title2')} <span className="text-[#5D4037]">{t('auth.panel.register_hero_title3')}</span>
            </h2>
            <div className="w-20 h-1.5 bg-[#5D4037] rounded-full"></div>
          </div>
          <p className="text-stone-600 text-xl font-body leading-relaxed max-w-xl">
            {t('landing.hero.subtitle')}
          </p>
          <div className="space-y-6">
            <div className="flex items-start gap-4 text-stone-800 group transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-[#5D4037]/5 flex items-center justify-center group-hover:bg-[#5D4037] group-hover:text-white transition-all duration-500">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>biotech</span>
              </div>
              <div>
                <p className="font-bold text-lg">{t('auth.panel.feature_ai_title')}</p>
                <p className="text-sm text-stone-500 font-medium">{t('auth.panel.feature_ai_desc')}</p>
              </div>
            </div>
            <div className="flex items-start gap-4 text-stone-800 group transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-[#5D4037]/5 flex items-center justify-center group-hover:bg-[#5D4037] group-hover:text-white transition-all duration-500">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>sports_esports</span>
              </div>
              <div>
                <p className="font-bold text-lg">{t('auth.panel.feature_battle_title')}</p>
                <p className="text-sm text-stone-500 font-medium">{t('auth.panel.feature_battle_desc')}</p>
              </div>
            </div>
            <div className="flex items-start gap-4 text-stone-800 group transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-[#5D4037]/5 flex items-center justify-center group-hover:bg-[#5D4037] group-hover:text-white transition-all duration-500">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
              </div>
              <div>
                <p className="font-bold text-lg">{t('auth.panel.feature_lab_title')}</p>
                <p className="text-sm text-stone-500 font-medium">{t('auth.panel.feature_lab_desc')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Register Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-20 py-12 relative z-10 bg-surface overflow-y-auto border-l border-outline-variant/10">
        <div className="max-w-md w-full mx-auto space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
          {/* Logo & Brand */}
          <Link to="/" className="inline-flex items-center gap-2.5 group transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-[#5D4037] flex items-center justify-center shadow-lg shadow-[#5D4037]/20 group-hover:scale-110 transition-transform duration-300">
              <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>biotech</span>
            </div>
            <span className="text-2xl font-black tracking-tighter text-on-surface font-headline">PlateSense</span>
          </Link>

          {/* Header */}
          <header className="space-y-2">
            <h1 className="text-4xl font-black text-on-surface tracking-tight">{t('auth.register.title')}</h1>
            <p className="text-on-surface-variant text-lg font-body">{t('auth.register.subtitle')}</p>
          </header>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-2xl bg-error/10 border border-error/20 text-error text-sm font-body flex items-center gap-3 animate-in zoom-in duration-300">
              <span className="material-symbols-outlined text-[20px]">error</span>
              {error}
            </div>
          )}

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="group">
                <label className="block text-sm font-bold text-on-surface-variant mb-2 ml-1" htmlFor="fullName">{t('auth.register.full_name')}</label>
                <input
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-2xl px-4 py-3.5 text-on-surface placeholder:text-outline focus:border-[#5D4037] focus:ring-4 focus:ring-[#5D4037]/10 transition-all outline-none"
                  id="fullName"
                  name="fullName"
                  placeholder="Dr. Jane Doe"
                  required
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              {/* Lab Name */}
              <div className="group">
                <label className="block text-sm font-bold text-on-surface-variant mb-2 ml-1" htmlFor="organization">{t('auth.register.lab_name')}</label>
                <input
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-2xl px-4 py-3.5 text-on-surface placeholder:text-outline focus:border-[#5D4037] focus:ring-4 focus:ring-[#5D4037]/10 transition-all outline-none"
                  id="organization"
                  name="organization"
                  placeholder="Advanced Labs"
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="group">
              <label className="block text-sm font-bold text-on-surface-variant mb-2 ml-1" htmlFor="email">{t('auth.register.email')}</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-[#5D4037] transition-colors" style={{ fontSize: '20px' }}>mail</span>
                <input
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-2xl pl-12 pr-4 py-3.5 text-on-surface placeholder:text-outline focus:border-[#5D4037] focus:ring-4 focus:ring-[#5D4037]/10 transition-all outline-none"
                  id="email"
                  name="email"
                  placeholder="jane.doe@lab.edu"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="group relative">
                <label className="block text-sm font-bold text-on-surface-variant mb-2 ml-1" htmlFor="password">{t('auth.register.password')}</label>
                <input
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-2xl px-4 py-3.5 text-on-surface placeholder:text-outline focus:border-[#5D4037] focus:ring-4 focus:ring-[#5D4037]/10 transition-all outline-none"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  className="absolute right-3 top-[38px] text-outline hover:text-on-surface transition-colors focus:outline-none"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>
              <div className="group">
                <label className="block text-sm font-bold text-on-surface-variant mb-2 ml-1" htmlFor="confirmPassword">{t('auth.register.password')}</label>
                <input
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-2xl px-4 py-3.5 text-on-surface placeholder:text-outline focus:border-[#5D4037] focus:ring-4 focus:ring-[#5D4037]/10 transition-all outline-none"
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="••••••••"
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              className="w-full py-4 rounded-2xl bg-[#5D4037] text-white font-bold text-lg hover:bg-[#4E342E] active:scale-[0.98] transition-all duration-300 shadow-xl shadow-[#5D4037]/20 disabled:opacity-50 flex items-center justify-center gap-3 mt-4"
              type="submit"
              disabled={isRegisterPending}
            >
              {isRegisterPending ? (
                <>
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  {t('auth.register.submitting')}
                </>
              ) : (
                <>
                  <span>{t('auth.register.submit')}</span>
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-4 py-1">
              <div className="h-px flex-1 bg-outline-variant/30"></div>
              <span className="text-xs font-black uppercase tracking-widest text-outline">{t('auth.login.or')}</span>
              <div className="h-px flex-1 bg-outline-variant/30"></div>
            </div>

            <button
              className="w-full py-3.5 rounded-2xl border-2 border-outline-variant/20 text-on-surface font-bold text-base flex items-center justify-center gap-3 hover:bg-surface-container transition-all active:scale-[0.98]"
              type="button"
              onClick={handleGoogleRegister}
            >
              <svg aria-hidden="true" className="w-6 h-6" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
              </svg>
              {t('auth.register.google')}
            </button>
          </form>

          <p className="text-center text-on-surface-variant font-medium">
            {t('auth.register.has_account')}
            <Link className="text-[#5D4037] font-bold hover:underline underline-offset-4 ml-2 transition-all" to="/login">{t('auth.register.login_link')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
