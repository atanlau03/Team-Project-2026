import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMediaUrl } from '../lib/axios';
import { useTranslation } from 'react-i18next';

const baseLinks = [
  { path: '/dashboard', key: 'nav.dashboard' },
  { path: '/history', key: 'nav.history' },
];

const researcherLinks = [
  { path: '/new-analysis', key: 'nav.new_analysis' },
  { path: '/battle-mode', key: 'nav.simulator' },
];

const adminLinks = [
  { path: '/admin', key: 'nav.admin_panel' },
];

export default function TopNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, logout } = useAuth();
  const { t } = useTranslation();

  const navLinks = [
    ...baseLinks,
    ...(!isAdmin ? researcherLinks : []),
    ...(isAdmin ? adminLinks : []),
    { path: '/settings', key: 'nav.settings' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="bg-[#fcfaf9] dark:bg-[#1d1b18] text-[#513825] dark:text-[#f2e6d8] font-['Manrope'] tracking-tight font-semibold sticky top-0 z-50 bg-stone-100/50 dark:bg-stone-900/50 backdrop-blur-xl shadow-[0_32px_64px_-12px_rgba(29,27,24,0.06)] flex items-center justify-between px-12 h-20 w-full mx-auto flex-shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
        <span className="material-symbols-outlined fill text-3xl text-[#513825] dark:text-[#f2e6d8]">biotech</span>
        <span className="font-['Manrope'] text-2xl font-black text-[#513825] dark:text-[#f2e6d8] tracking-tighter">PlateSense</span>
      </div>

      {/* Navigation Links */}
      <div className="hidden md:flex items-center gap-8 h-full">
        {navLinks.map((link) => (
          <a
            key={link.path}
            className={
              isActive(link.path)
                ? 'h-full flex items-center text-[#513825] dark:text-white border-b-2 border-[#513825] dark:border-[#f2e6d8] pb-1 opacity-80 scale-[0.99] transition-transform'
                : 'h-full flex items-center text-stone-500 dark:text-stone-400 font-medium hover:text-[#513825] dark:hover:text-stone-200 transition-colors hover:bg-stone-200/30 dark:hover:bg-stone-800/30 transition-all duration-300 px-3 rounded-t-md mt-1'
            }
            href={link.path}
          >
            {link.path === '/admin' ? (
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                {t(link.key, { defaultValue: 'Admin Panel' })}
              </span>
            ) : (
              t(link.key)
            )}
          </a>
        ))}
      </div>

      {/* Trailing Action */}
      <div className="flex items-center gap-3">
        {/* Role Badge */}
        {isAdmin && (
          <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
            Admin
          </span>
        )}
        <div className="w-10 h-10 rounded-full bg-surface-container-low border border-outline-variant/15 flex items-center justify-center overflow-hidden">
          {user?.avatar_url ? (
            <img alt="User avatar" className="w-full h-full object-cover" src={getMediaUrl(user.avatar_url)} />
          ) : (
            <span className="font-headline font-bold text-sm text-primary">
              {user?.full_name?.charAt(0) || 'U'}
            </span>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-error px-3 py-1.5 rounded-full hover:bg-error-container/40 transition-all duration-200"
          title={t('nav.logout')}
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span className="hidden lg:inline">{t('nav.logout')}</span>
        </button>
      </div>
    </nav>
  );
}

