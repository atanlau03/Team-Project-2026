import { useState, type FormEvent } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { getGoogleOAuthUrl } from '../api/auth';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const justRegistered = searchParams.get('registered') === 'true';
  const { login, loginError, isLoginPending } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch {
      // Error is captured by AuthContext
    }
  };

  const [googleError, setGoogleError] = useState('');

  const handleGoogleLogin = async () => {
    try {
      setGoogleError('');
      const url = await getGoogleOAuthUrl();
      window.location.href = url;
    } catch (err: unknown) {
      setGoogleError((err as Error)?.message || t('auth.login.google_error', { defaultValue: 'Google OAuth is not available.' }));
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-surface transition-colors duration-500 overflow-hidden">
      {/* Left Panel: Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-20 py-12 relative z-10 bg-surface">
        <div className="max-w-md w-full mx-auto space-y-10 animate-in fade-in slide-in-from-left-4 duration-700">
          {/* Logo & Brand */}
          <Link to="/" className="inline-flex items-center gap-2.5 group transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-[#5D4037] flex items-center justify-center shadow-lg shadow-[#5D4037]/20 group-hover:scale-110 transition-transform duration-300">
              <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>biotech</span>
            </div>
            <span className="text-2xl font-black tracking-tighter text-on-surface font-headline">PlateSense</span>
          </Link>

          {/* Header */}
          <header className="space-y-3">
            <h1 className="text-4xl font-black text-on-surface tracking-tight">{t('auth.login.title')}</h1>
            <p className="text-on-surface-variant text-lg font-body">{t('auth.login.subtitle')}</p>
          </header>

          {/* Messages */}
          <div className="space-y-4">
            {justRegistered && (
              <div className="p-4 rounded-2xl bg-tertiary/10 border border-tertiary/20 text-tertiary text-sm font-body flex items-center gap-3 animate-in zoom-in duration-300">
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                {t('auth.login.success_reg')}
              </div>
            )}

            {(loginError || googleError) && (
              <div className="p-4 rounded-2xl bg-error/10 border border-error/20 text-error text-sm font-body flex items-center gap-3 animate-in zoom-in duration-300">
                <span className="material-symbols-outlined text-[20px]">error</span>
                {loginError || googleError}
              </div>
            )}
          </div>

          {/* Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-5">
              {/* Email Input */}
              <div className="group">
                <label className="block text-sm font-bold text-on-surface-variant mb-2 ml-1" htmlFor="email">{t('auth.login.email')}</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" style={{ fontSize: '22px' }}>mail</span>
                  <input
                    className="w-full bg-surface-container border border-outline-variant/30 rounded-2xl pl-12 pr-4 py-4 text-on-surface placeholder:text-outline focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                    id="email"
                    name="email"
                    placeholder="researcher@lab.edu"
                    required={true}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="group">
                <div className="flex items-center justify-between mb-2 px-1">
                  <label className="text-sm font-bold text-on-surface-variant" htmlFor="password">{t('auth.login.password')}</label>
                  <Link className="text-xs font-bold text-primary hover:underline underline-offset-4 transition-all" to="/forgot-password">{t('auth.login.forgot')}</Link>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" style={{ fontSize: '22px' }}>lock</span>
                  <input
                    className="w-full bg-surface-container border border-outline-variant/30 rounded-2xl pl-12 pr-12 py-4 text-on-surface placeholder:text-outline focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    required={true}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    aria-label="Toggle password visibility"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                      {showPassword ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center pt-1">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center">
                  <input className="peer h-5 w-5 rounded-lg border-outline-variant/50 bg-surface-container text-primary focus:ring-primary transition-all" type="checkbox" />
                </div>
                <span className="text-sm font-medium text-on-surface-variant group-hover:text-on-surface transition-colors">{t('auth.login.remember')}</span>
              </label>
            </div>

            <button
              className="w-full py-4.5 rounded-2xl bg-[#5D4037] text-white font-bold text-lg hover:bg-[#4E342E] active:scale-[0.98] transition-all duration-300 shadow-xl shadow-[#5D4037]/20 disabled:opacity-50 flex items-center justify-center gap-3"
              type="submit"
              disabled={isLoginPending}
            >
              {isLoginPending ? (
                <>
                  <div className="w-5 h-5 border-3 border-on-primary border-t-transparent rounded-full animate-spin" />
                  {t('auth.login.submitting')}
                </>
              ) : (
                <>
                  {t('auth.login.submit')}
                  <span className="material-symbols-outlined text-[20px]">login</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-4 py-2">
              <div className="h-px flex-1 bg-outline-variant/30"></div>
              <span className="text-xs font-black uppercase tracking-widest text-outline">{t('auth.login.or')}</span>
              <div className="h-px flex-1 bg-outline-variant/30"></div>
            </div>

            <button
              className="w-full py-4 rounded-2xl border-2 border-outline-variant/20 text-on-surface font-bold text-base flex items-center justify-center gap-3 hover:bg-surface-container hover:border-outline-variant/40 transition-all active:scale-[0.98]"
              type="button"
              onClick={handleGoogleLogin}
            >
              <svg aria-hidden="true" className="w-6 h-6" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
              </svg>
              {t('auth.login.google')}
            </button>
          </form>

          <p className="text-center text-on-surface-variant font-medium">
            {t('auth.login.no_account')}
            <Link className="text-primary font-bold hover:underline underline-offset-4 ml-2 transition-all" to="/register">{t('auth.login.register_link')}</Link>
          </p>
        </div>
      </div>

      {/* Right Panel: Visual Section */}
      <div className="hidden lg:block lg:w-1/2 relative bg-stone-50 overflow-hidden border-l border-outline-variant/10">
        {/* Background Image / Texture */}
        <div className="absolute inset-0 opacity-10 bg-[url('/hero.jpg')] bg-cover bg-center grayscale scale-110"></div>
        
        {/* Decorative Gradients */}
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-[#5D4037]/5 via-transparent to-transparent"></div>

        <div className="relative h-full flex flex-col justify-center p-20 space-y-10 max-w-3xl animate-in fade-in slide-in-from-right-8 duration-1000">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#5D4037]/10 rounded-full border border-[#5D4037]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5D4037]"></span>
            <span className="text-[10px] uppercase font-black text-[#5D4037] tracking-[0.2em]">{t('landing.hero.tag')}</span>
          </div>
          <div className="space-y-6">
            <h2 className="text-6xl font-black text-stone-900 leading-[1.1] tracking-tight">
              {t('auth.panel.login_hero_title1')}<br />
              <span className="text-[#5D4037]">{t('auth.panel.login_hero_title2')}</span><br />
              {t('auth.panel.login_hero_title3')}
            </h2>
            <div className="w-20 h-1.5 bg-[#5D4037] rounded-full"></div>
          </div>
          <p className="text-stone-600 text-xl font-body leading-relaxed max-w-xl">
            {t('landing.hero.subtitle')}
          </p>
          <div className="pt-8 flex items-center gap-6">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-12 h-12 rounded-full border-2 border-white bg-stone-100 shadow-sm flex items-center justify-center overflow-hidden">
                  <img src={`https://i.pravatar.cc/100?img=${i + 15}`} alt="User" />
                </div>
              ))}
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-black text-stone-900">{t('auth.panel.join_researchers')}</p>
              <p className="text-xs text-stone-500 font-medium tracking-wide uppercase">{t('auth.panel.trusted_by')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
