import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import TopNav from '../components/TopNav';
import { useAdminUsers, useAdminStats, useUpdateUserRole, useUpdateUserStatus } from '../hooks/useAdmin';
import { getMediaUrl } from '../lib/axios';
import type { AdminUserItem } from '../api/admin';

export default function AdminPanel() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const { data: users, isLoading } = useAdminUsers({
    search: debouncedSearch || undefined,
    role: roleFilter,
    page,
    page_size: 10,
  });
  const { data: stats } = useAdminStats();
  const updateRole = useUpdateUserRole();
  const updateStatus = useUpdateUserStatus();

  const handleRoleToggle = (user: AdminUserItem) => {
    const newRole = user.role === 'admin' ? 'researcher' : 'admin';
    updateRole.mutate({ userId: user.id, role: newRole });
  };

  const handleStatusToggle = (user: AdminUserItem) => {
    updateStatus.mutate({ userId: user.id, is_active: !user.is_active });
  };

  return (
    <div className="bg-surface flex flex-col flex-grow w-full min-h-screen selection:bg-primary-container selection:text-on-primary-container overflow-x-hidden">
      <TopNav />

      <main className="flex-1 w-full max-w-[1600px] mx-auto min-h-screen relative py-12 px-6 md:px-12">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -z-10 pointer-events-none translate-x-1/2 -translate-y-1/4 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-tertiary/5 rounded-full blur-[100px] -z-10 pointer-events-none -translate-x-1/4 translate-y-1/4"></div>

        <div className="max-w-7xl mx-auto w-full">
          {/* Stats Cards remain as the primary visual entry point */}

          {/* Premium Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-16">
            {[
              { label: t('panel.stats.total_users'), value: stats?.total_users ?? 0, icon: 'groups', color: 'primary', trend: '+12%' },
              { label: t('panel.stats.researchers'), value: stats?.total_researchers ?? 0, icon: 'biotech', color: 'secondary', trend: '+5' },
              { label: t('panel.stats.admins'), value: stats?.total_admins ?? 0, icon: 'admin_panel_settings', color: 'tertiary', trend: 'Stable' },
              { label: t('panel.stats.analyses'), value: stats?.total_analyses ?? 0, icon: 'analytics', color: 'primary', trend: '+142' },
              { label: t('panel.stats.finalized'), value: stats?.total_finalized ?? 0, icon: 'verified', color: 'success', trend: '98%' },
              { label: t('panel.stats.organizations'), value: stats?.total_organizations ?? 0, icon: 'hub', color: 'secondary', trend: '+2' },
            ].map((stat, idx) => (
              <div 
                key={stat.label} 
                className="bg-surface-container-lowest rounded-[2rem] p-6 shadow-[0_20px_40px_-12px_rgba(29,27,24,0.04)] border border-outline-variant/10 group hover:shadow-[0_32px_64px_-12px_rgba(29,27,24,0.08)] hover:-translate-y-1 transition-all duration-500 relative overflow-hidden"
                style={{ transitionDelay: `${idx * 50}ms` }}
              >
                <div className={`w-12 h-12 rounded-2xl bg-${stat.color}/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                  <span className={`material-symbols-outlined text-${stat.color} text-2xl`}>{stat.icon}</span>
                </div>
                <div className="space-y-1">
                  <p className="font-headline text-3xl font-black text-on-surface tracking-tighter">{stat.value.toLocaleString()}</p>
                  <p className="font-label text-[10px] text-outline uppercase tracking-widest font-bold">{stat.label}</p>
                </div>
                <div className="absolute top-6 right-6">
                   <span className="text-[10px] font-bold text-on-surface-variant/40">{stat.trend}</span>
                </div>
              </div>
            ))}
          </div>

          {/* User Management Section */}
          <section className="bg-surface-container-lowest rounded-[2.5rem] p-8 md:p-10 shadow-[0_32px_64px_-24px_rgba(29,27,24,0.06)] border border-outline-variant/10 relative overflow-hidden">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/2 rounded-full blur-[100px] pointer-events-none"></div>

            {/* Controls Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12 relative z-10">
              {/* Titles removed per user request */}
              <div></div>

              <div className="flex flex-wrap items-center gap-4">
                {/* Modern Search */}
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl group-focus-within:text-primary transition-colors">search</span>
                  <input
                    className="bg-surface-container-low text-on-surface font-body pl-12 pr-6 py-3.5 rounded-2xl border-2 border-transparent focus:border-primary/20 focus:bg-white focus:outline-none transition-all w-full md:w-80 text-sm shadow-inner"
                    placeholder={t('panel.directory.search_placeholder')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                {/* Styled Select */}
                <div className="relative">
                  <select
                    className="bg-surface-container-low text-on-surface font-body pl-6 pr-12 py-3.5 rounded-2xl border-2 border-transparent focus:border-primary/20 focus:bg-white focus:outline-none transition-all text-sm appearance-none cursor-pointer shadow-inner min-w-[160px]"
                    value={roleFilter || ''}
                    onChange={(e) => { setRoleFilter(e.target.value || undefined); setPage(1); }}
                  >
                    <option value="">{t('panel.directory.all_roles')}</option>
                    <option value="researcher">{t('panel.directory.researchers')}</option>
                    <option value="admin">{t('panel.directory.administrators')}</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
                </div>
              </div>
            </div>

            {/* Sophisticated Table */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 border-4 border-primary/10 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
                </div>
                <p className="font-label text-sm text-outline animate-pulse">{t('panel.directory.syncing')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-2">
                <table className="w-full border-separate border-spacing-y-3">
                  <thead>
                    <tr>
                      <th className="text-left font-mono-tech text-[10px] uppercase tracking-widest text-outline font-black py-4 px-6">{t('panel.directory.col_user')}</th>
                      <th className="text-left font-mono-tech text-[10px] uppercase tracking-widest text-outline font-black py-4 px-6">{t('panel.directory.col_group')}</th>
                      <th className="text-center font-mono-tech text-[10px] uppercase tracking-widest text-outline font-black py-4 px-6">{t('panel.directory.col_privilege')}</th>
                      <th className="text-center font-mono-tech text-[10px] uppercase tracking-widest text-outline font-black py-4 px-6">{t('panel.directory.col_verification')}</th>
                      <th className="text-right font-mono-tech text-[10px] uppercase tracking-widest text-outline font-black py-4 px-6">{t('panel.directory.col_actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users?.items.map((user) => (
                      <tr key={user.id} className="group/row">
                        {/* User Info */}
                        <td className="py-4 px-6 bg-surface-container-low/30 first:rounded-l-[1.5rem] group-hover/row:bg-surface-container-low transition-colors duration-300">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white overflow-hidden shadow-sm ring-1 ring-outline-variant/10 group-hover/row:ring-primary/20 transition-all">
                              {user.avatar_url ? (
                                <img src={getMediaUrl(user.avatar_url)} alt={user.full_name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-primary-container text-primary font-black text-lg">
                                  {user.full_name.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-headline font-bold text-on-surface text-base truncate">{user.full_name}</p>
                              <p className="font-body text-xs text-on-surface-variant truncate">{user.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Org */}
                        <td className="py-4 px-6 bg-surface-container-low/30 group-hover/row:bg-surface-container-low transition-colors duration-300">
                          <div className="flex flex-col">
                            <span className="font-body font-bold text-sm text-on-surface">{user.organization_name || t('panel.directory.individual')}</span>
                            <span className="font-label text-[10px] text-outline uppercase tracking-tight">{t('panel.directory.joined')} {new Date(user.created_at).toLocaleDateString()}</span>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="py-4 px-6 bg-surface-container-low/30 text-center group-hover/row:bg-surface-container-low transition-colors duration-300">
                          <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ${
                            user.role === 'admin'
                              ? 'bg-primary text-on-primary'
                              : 'bg-surface-container-high text-on-surface-variant ring-1 ring-outline-variant/10'
                          }`}>
                            <span className="material-symbols-outlined text-[14px]">{user.role === 'admin' ? 'verified_user' : 'person'}</span>
                            {user.role === 'admin' ? t('panel.directory.administrators') : t('panel.directory.researchers')}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-6 bg-surface-container-low/30 text-center group-hover/row:bg-surface-container-low transition-colors duration-300">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                            user.is_active
                              ? 'bg-success/10 text-success'
                              : 'bg-error/10 text-error'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full bg-current ${user.is_active ? 'animate-pulse' : ''}`}></span>
                            {user.is_active ? t('panel.directory.authenticated') : t('panel.directory.revoked')}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 bg-surface-container-low/30 last:rounded-r-[1.5rem] text-right group-hover/row:bg-surface-container-low transition-colors duration-300">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => handleRoleToggle(user)}
                              disabled={updateRole.isPending}
                              className={`p-2.5 rounded-xl border-2 transition-all duration-300 ${
                                user.role === 'admin'
                                  ? 'border-transparent bg-primary/5 text-primary hover:bg-primary/10'
                                  : 'border-transparent bg-surface-container-high text-on-surface-variant hover:border-primary/20 hover:text-primary'
                              }`}
                              title={user.role === 'admin' ? t('panel.directory.revoke_admin') : t('panel.directory.grant_admin')}
                            >
                              <span className="material-symbols-outlined text-xl">
                                {user.role === 'admin' ? 'person_remove' : 'verified_user'}
                              </span>
                            </button>
                            <button
                              onClick={() => handleStatusToggle(user)}
                              disabled={updateStatus.isPending}
                              className={`p-2.5 rounded-xl border-2 transition-all duration-300 ${
                                user.is_active
                                  ? 'border-transparent bg-surface-container-high text-on-surface-variant hover:border-error/20 hover:text-error'
                                  : 'border-transparent bg-error/10 text-error hover:bg-error/20'
                              }`}
                              title={user.is_active ? t('panel.directory.deactivate') : t('panel.directory.activate')}
                            >
                              <span className="material-symbols-outlined text-xl">
                                {user.is_active ? 'block' : 'check_circle'}
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {users?.items.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-32 text-center bg-surface-container-low/10 rounded-[2rem]">
                          <div className="flex flex-col items-center">
                            <div className="w-20 h-20 rounded-full bg-surface-container-low flex items-center justify-center mb-6">
                              <span className="material-symbols-outlined text-4xl text-outline opacity-40">person_search</span>
                            </div>
                            <h4 className="font-headline text-xl font-bold text-on-surface mb-2">{t('panel.directory.no_results')}</h4>
                            <p className="font-body text-sm text-on-surface-variant">{t('panel.directory.no_results_desc')}</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Enhanced Pagination */}
                {users && users.total_pages > 1 && (
                  <div className="flex flex-col md:flex-row items-center justify-between mt-10 px-4 gap-6">
                    <p className="font-label text-xs text-outline uppercase tracking-widest font-bold">
                      {t('panel.pagination.viewing_index')} <span className="text-on-surface">{users.page}</span> {t('panel.pagination.of')} <span className="text-on-surface">{users.total_pages}</span> {t('panel.pagination.master_pages')}
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high transition-all disabled:opacity-20 shadow-sm"
                      >
                        <span className="material-symbols-outlined text-lg">chevron_left</span>
                        {t('panel.pagination.prev')}
                      </button>
                      <button
                        onClick={() => setPage(Math.min(users.total_pages, page + 1))}
                        disabled={page === users.total_pages}
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold bg-primary text-on-primary shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-20"
                      >
                        {t('panel.pagination.next')}
                        <span className="material-symbols-outlined text-lg">chevron_right</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          <footer className="mt-24 text-center pb-12">
            <div className="inline-flex flex-col items-center gap-4">
              <div className="w-12 h-[1px] bg-outline-variant/30"></div>
              <p className="font-mono-tech text-[10px] text-on-surface-variant opacity-40 uppercase tracking-[0.3em]">
                PlateSense Security Orchestration Core v2.4.5
              </p>
              <p className="font-label text-[9px] text-outline">{t('panel.footer')}</p>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
