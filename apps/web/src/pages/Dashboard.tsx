import { useDashboardOverview, useLiveActivity } from '../hooks/useDashboard';
import { useAnalyses } from '../hooks/useAnalyses';
import TopNav from '../components/TopNav';
import { useState } from 'react';
import QuickViewModal from '../components/QuickViewModal';
import { getMediaUrl } from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useAdminUsers, useAdminStats } from '../hooks/useAdmin';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useCfuTrend } from '../hooks/useDashboard';

function Dashboard() {
  const { user, isAdmin } = useAuth();
  const { t, i18n } = useTranslation();
  const { data: overview } = useDashboardOverview();
  const { data: activity } = useLiveActivity(10);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<{ id: string, name: string } | null>(null);
  const [analysisPage, setAnalysisPage] = useState(1);

  const { data: trendData } = useCfuTrend({
    days: 7,
    scope: isAdmin ? 'team' : 'mine',
    target_user_id: selectedUser?.id || undefined
  });

  const { data: usersData } = useAdminUsers({ page_size: 100 });

  const { data: recentAnalyses } = useAnalyses({
    scope: isAdmin ? 'team' : 'mine',
    target_user_id: selectedUser?.id || undefined,
    status: undefined,
    page: analysisPage,
    page_size: 6
  });

  // Helpers
  const { data: adminStats } = useAdminStats();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.time.morning');
    if (hour < 18) return t('dashboard.time.afternoon');
    return t('dashboard.time.evening');
  };

  const displayName = user?.full_name?.split(' ').slice(0, 2).join(' ') || t('dashboard.researcher');

  // Locale-aware date
  const todayStr = new Intl.DateTimeFormat(i18n.language, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date());

  const formatRelativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t('dashboard.time.just_now');
    if (mins < 60) return t('dashboard.time.mins_ago', { count: mins });
    const hours = Math.floor(mins / 60);
    if (hours < 24) return t('dashboard.time.hours_ago', { count: hours });
    return t('dashboard.time.days_ago', { count: Math.floor(hours / 24) });
  };

  // Format date for chart
  const formatChartDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(i18n.language, { weekday: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-surface flex flex-col flex-grow w-full min-h-screen selection:bg-primary-container selection:text-on-primary-container">
      {/* TopNavBar */}
      <TopNav />

      {/* Main Content Canvas */}
      <main className="flex-grow max-w-[1600px] w-full mx-auto px-6 md:px-12 py-10 flex flex-col gap-8">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-2">
          <div>
            <p className="font-label text-tertiary text-sm tracking-widest uppercase mb-2">{t('dashboard.workspace_overview')}</p>
            <h1 className="font-headline text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight">
              {greeting()}, {displayName}.
            </h1>
          </div>
          <div className="flex items-center gap-4 text-sm font-label text-secondary">
            <span className="material-symbols-outlined text-[20px]">calendar_today</span>
            <span>{todayStr}</span>
            <span className="w-1 h-1 rounded-full bg-outline"></span>
            <span>{t('dashboard.system_status')}: <span className="text-tertiary-container font-medium flex items-center gap-1 inline-flex"><span className="w-2 h-2 rounded-full bg-primary inline-block"></span> {overview?.system_status || t('dashboard.optimal')}</span></span>
          </div>
        </header>

        {/* Row 1: Trend & Activity */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-min">
          {/* Contamination Trend Chart (Col Span 8) */}
          <div className="md:col-span-8 bg-surface-container-lowest rounded-[1.5rem] p-8 md:p-10 shadow-[0_32px_64px_-12px_rgba(29,27,24,0.04)] overflow-hidden relative group h-[380px] flex flex-col">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <span className="material-symbols-outlined text-[120px] -rotate-12">trending_up</span>
            </div>

            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="font-headline text-xl font-bold text-on-surface">
                  {isAdmin && !selectedUser ? t('dashboard.trends.team') : isAdmin && selectedUser ? t('dashboard.trends.user', { name: selectedUser.name }) : t('dashboard.trends.weekly')}
                </h2>
                <p className="font-body text-sm text-on-surface-variant italic">{t('dashboard.trends.subtitle')}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-primary"></span>
                  <span className="font-label text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t('dashboard.trends.avg_label')}</span>
                </div>
              </div>
            </div>

            <div className="flex-grow w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={1} />
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-outline-variant)" opacity={0.3} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatChartDate}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 10, fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 10, fontWeight: 600 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-surface-container-highest)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                      fontSize: '12px',
                      fontFamily: 'Outfit, sans-serif'
                    }}
                    itemStyle={{ color: 'var(--color-primary)', fontWeight: 'bold' }}
                    labelStyle={{ color: 'var(--color-on-surface-variant)', marginBottom: '4px' }}
                    cursor={{ fill: 'var(--color-surface-container-high)', opacity: 0.4 }}
                  />
                  <Bar
                    dataKey="value"
                    fill="url(#colorTrend)"
                    radius={[6, 6, 0, 0]}
                    barSize={32}
                    animationDuration={1500}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Live Activity (Col Span 4) */}
          <div className="md:col-span-4 bg-surface-container-lowest rounded-[1.5rem] p-6 shadow-[0_32px_64px_-12px_rgba(29,27,24,0.04)] h-[380px] flex flex-col">
            <div className="flex items-center justify-between mb-6 px-2">
              <h2 className="font-headline text-lg font-bold text-on-surface">{t('dashboard.recent_activity.title')}</h2>
              <div className="flex items-center gap-2 px-2 py-0.5 bg-surface-container-low rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
                <span className="font-label text-[9px] uppercase font-bold text-on-surface-variant tracking-wider">{t('dashboard.activity.live')}</span>
              </div>
            </div>

            <div className="flex-grow overflow-y-auto custom-scrollbar space-y-4 pr-1">
              {activity && activity.length > 0 ? activity.map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-surface-container-low/30 rounded-xl border border-outline-variant/10 hover:bg-surface-container-low transition-colors group">
                  <div className="w-8 h-8 rounded-full bg-white overflow-hidden shrink-0 shadow-sm ring-1 ring-outline-variant/10 group-hover:ring-primary/20 transition-all">
                    {item.user_avatar ? (
                      <img src={getMediaUrl(item.user_avatar)} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="w-full h-full flex items-center justify-center bg-primary text-on-primary font-bold text-[10px]">
                        {item.user_name?.charAt(0) || 'S'}
                      </span>
                    )}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-baseline gap-2">
                      <p className="font-body text-xs text-on-surface truncate">
                        {item.user_name && <span className="font-bold">{item.user_name} </span>}
                        {item.description}
                      </p>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      {item.sample_id && (
                        <p className="font-label text-[9px] text-primary bg-primary-fixed/50 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">{item.sample_id}</p>
                      )}
                      <span className="font-label text-[9px] text-outline italic">{formatRelativeTime(item.created_at)}</span>
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-on-surface-variant text-xs italic text-center py-10 opacity-50">{t('dashboard.activity.none')}</p>
              )}
            </div>
          </div>
        </div>

        {/* Bento Grid Layout (Row 2 & 3 Swapped) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-min">
          {/* Top Species Found (Col Span 4) - NOW ON THE LEFT */}
          <div className="md:col-span-4 bg-surface-container-lowest rounded-[1.5rem] p-8 flex flex-col h-[420px] shadow-[0_32px_64px_-12px_rgba(29,27,24,0.04)] relative overflow-hidden group">
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-tertiary/5 rounded-full blur-2xl group-hover:bg-tertiary/10 transition-all duration-700"></div>

            <h2 className="font-headline text-lg font-bold text-on-surface mb-8">{t('dashboard.species.title')}</h2>

            <div className="flex-grow flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-1">
              {overview?.top_species && overview.top_species.length > 0 ? overview.top_species.map((sp, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="font-body text-sm font-bold text-on-surface italic">{sp.name}</span>
                    <span className="font-label text-xs text-on-surface-variant">{sp.count} {t('dashboard.species.detected')}</span>
                  </div>
                  <div className="relative h-2 bg-surface-container rounded-full overflow-hidden">
                    <div
                      className={`absolute h-full transition-all duration-1000`}
                      style={{
                        width: `${sp.percentage}%`,
                        background: `linear-gradient(90deg, var(--color-primary) 0%, var(--color-tertiary) 100%)`
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-end">
                    <span className="font-label text-[10px] text-primary font-bold">{sp.percentage}%</span>
                  </div>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center flex-grow text-center opacity-40 grayscale">
                  <span className="material-symbols-outlined text-5xl mb-3">science</span>
                  <p className="font-body text-sm">{t('dashboard.species.none')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Analyzed Samples (Col Span 8) - NOW ON THE RIGHT */}
          <div className="md:col-span-8 bg-surface-container-low rounded-[1.5rem] p-6 flex flex-col h-[420px]">
            <div className="flex items-center justify-between mb-6 px-2">
              <div className="flex items-center gap-3">
                {isAdmin && selectedUser && (
                  <button
                    onClick={() => { setSelectedUser(null); setAnalysisPage(1); }}
                    className="p-1.5 rounded-full hover:bg-surface-container-highest text-on-surface-variant transition-colors"
                    title="Back to Users"
                  >
                    <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                  </button>
                )}
                <h2 className="font-headline text-xl font-bold text-on-surface">
                  {isAdmin && !selectedUser ? t('dashboard.samples.team_users') : isAdmin && selectedUser ? t('dashboard.samples.user_recent', { name: selectedUser.name }) : t('dashboard.samples.recent')}
                </h2>
              </div>

              {(!isAdmin || selectedUser) && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-surface-container-high rounded-lg p-1">
                    <button
                      disabled={analysisPage <= 1}
                      onClick={() => setAnalysisPage(p => p - 1)}
                      className="p-1.5 rounded-md hover:bg-surface-container-lowest text-outline disabled:opacity-30 transition-all"
                    >
                      <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                    </button>
                    <button
                      disabled={!recentAnalyses?.total_pages || analysisPage >= recentAnalyses.total_pages}
                      onClick={() => setAnalysisPage(p => p + 1)}
                      className="p-1.5 rounded-md hover:bg-surface-container-lowest text-outline disabled:opacity-30 transition-all"
                    >
                      <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    </button>
                  </div>
                  <button
                    onClick={() => window.location.href = '/history'}
                    className="text-primary font-label text-xs uppercase tracking-widest hover:underline px-2"
                  >
                    {t('dashboard.samples.view_history')}
                  </button>
                </div>
              )}
            </div>

            <div className="flex-grow overflow-y-auto custom-scrollbar pr-2">
              {isAdmin && !selectedUser ? (
                // --- USER LIST VIEW ---
                <div className="flex flex-col gap-3">
                  {usersData?.items.map(u => (
                    <button
                      key={u.id}
                      onClick={() => setSelectedUser({ id: u.id, name: u.full_name })}
                      className="flex items-center justify-between p-3 bg-surface-container-lowest rounded-2xl hover:bg-surface-container-high transition-all group border border-outline-variant/10 text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-container-high border-2 border-surface flex items-center justify-center shrink-0">
                          {u.avatar_url ? (
                            <img src={getMediaUrl(u.avatar_url)} alt={u.full_name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-headline text-lg font-bold text-primary">{u.full_name.charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <h3 className="font-headline font-bold text-sm text-on-surface">{u.full_name}</h3>
                          <p className="font-label text-xs text-on-surface-variant">{u.email}</p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors">chevron_right</span>
                    </button>
                  ))}
                </div>
              ) : (
                // --- RECENT SAMPLES VIEW ---
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {recentAnalyses?.items.map((analysis: any) => (
                    <button
                      key={analysis.id}
                      onClick={() => setSelectedAnalysisId(analysis.id)}
                      className="flex items-center gap-4 p-3 bg-surface-container-lowest rounded-2xl hover:bg-surface-container-high transition-all group border border-outline-variant/10 text-left"
                    >
                      <div className="w-16 h-16 rounded-xl bg-black overflow-hidden shrink-0 shadow-inner">
                        {analysis.image?.stored_path ? (
                          <img
                            src={getMediaUrl(analysis.image.stored_path)}
                            alt="Plate"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-surface-container text-on-surface-variant">
                            <span className="material-symbols-outlined text-xl">microbiology</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-start mb-0.5">
                          <span className="font-headline text-sm font-bold text-on-surface truncate pr-2">{analysis.sample_id}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${analysis.status === 'finalized' ? 'bg-primary/10 text-primary' : 'bg-tertiary/10 text-tertiary'
                            }`}>
                            {analysis.status === 'finalized' ? t('dashboard.samples.finalized') : t('dashboard.samples.pending')}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-label text-xs text-on-surface-variant font-medium">{analysis.media_type}</span>
                          <span className="w-1 h-1 rounded-full bg-outline-variant/40"></span>
                          <span className="font-label text-xs text-primary font-bold tracking-tight">
                            {analysis.calculated_cfu_ml ? (
                              <>
                                {(analysis.calculated_cfu_ml).toExponential(1).split('e')[0]}×10<sup>{parseInt((analysis.calculated_cfu_ml).toExponential(1).split('e')[1])}</sup>
                              </>
                            ) : '—'}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Row 3: Admin Insights (3 Cards) or Researcher Hero (2 Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-min">
          {isAdmin ? (
            <>
              {/* Card 1: System Volume */}
              <div className="md:col-span-4 bg-surface-container-lowest rounded-[1.5rem] p-8 relative overflow-hidden flex flex-col justify-between min-h-[340px] shadow-[0_32px_64px_-12px_rgba(29,27,24,0.04)] isolate group">
                <div className="absolute -right-10 -top-10 w-48 h-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-500"></div>
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                    <span className="material-symbols-outlined text-2xl">analytics</span>
                  </div>
                  <h2 className="font-body text-on-surface-variant text-base font-medium mb-1">{t('dashboard.admin.volume_title')}</h2>
                  <div className="flex items-baseline gap-2">
                    <span className="font-headline text-5xl font-black text-on-surface tracking-tighter">
                      {adminStats?.total_analyses?.toLocaleString() || '—'}
                    </span>
                  </div>
                  <p className="font-label text-xs text-outline mt-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    {adminStats?.total_finalized?.toLocaleString()} {t('dashboard.admin.finalized_label')}
                  </p>
                </div>
                <div className="mt-8 pt-6 border-t border-outline-variant/10">
                  <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-bold text-outline">
                    <span>{t('dashboard.admin.audit_integrity')}</span>
                    <span className="text-success">{t('dashboard.admin.verified')}</span>
                  </div>
                </div>
              </div>

              {/* Card 2: User Ecosystem */}
              <div className="md:col-span-4 bg-surface-container-lowest rounded-[1.5rem] p-6 flex flex-col min-h-[340px] shadow-[0_32px_64px_-12px_rgba(29,27,24,0.04)] relative overflow-hidden group">
                <h2 className="font-headline text-lg font-bold text-on-surface mb-4">{t('dashboard.admin.workforce_title')}</h2>
                <div className="flex-grow flex flex-col justify-between">
                  <div className="relative h-[160px] w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Researchers', value: adminStats?.total_researchers || 0 },
                            { name: 'Admins', value: adminStats?.total_admins || 0 }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                        >
                          <Cell fill="var(--color-primary)" />
                          <Cell fill="var(--color-tertiary)" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-headline text-3xl font-black text-on-surface">{adminStats?.total_users || 0}</span>
                      <span className="font-label text-[10px] text-outline uppercase tracking-widest font-bold">{t('dashboard.admin.total_users')}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center px-4 mb-4">
                    <div className="flex flex-col items-center">
                      <span className="font-headline text-lg font-bold text-on-surface">{adminStats?.total_researchers || 0}</span>
                      <span className="font-label text-[10px] text-tertiary uppercase font-bold tracking-wider">{t('dashboard.admin.researchers')}</span>
                    </div>
                    <div className="w-[1px] h-8 bg-outline-variant/20"></div>
                    <div className="flex flex-col items-center">
                      <span className="font-headline text-lg font-bold text-on-surface">{adminStats?.total_admins || 0}</span>
                      <span className="font-label text-[10px] text-primary uppercase font-bold tracking-wider">{t('dashboard.admin.admins')}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => window.location.href = '/admin'}
                    className="w-full bg-surface-container-high text-on-surface-variant py-3 rounded-xl font-headline font-bold text-xs hover:bg-surface-container-highest transition-colors flex items-center justify-center gap-2"
                  >
                    {t('dashboard.admin.manage_users')}
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </button>
                </div>
              </div>

              {/* Card 3: Network Operations */}
              <div className="md:col-span-4 bg-surface-container-lowest rounded-[1.5rem] p-8 relative overflow-hidden flex flex-col justify-between min-h-[340px] shadow-[0_32px_64px_-12px_rgba(29,27,24,0.04)] isolate group">
                <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-tertiary/5 rounded-full blur-3xl group-hover:bg-tertiary/10 transition-all duration-500"></div>
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-tertiary/10 flex items-center justify-center text-tertiary mb-6">
                    <span className="material-symbols-outlined text-2xl">hub</span>
                  </div>
                  <h2 className="font-body text-on-surface-variant text-base font-medium mb-1">{t('dashboard.admin.reach_title')}</h2>
                  <div className="flex items-baseline gap-2">
                    <span className="font-headline text-5xl font-black text-on-surface tracking-tighter">
                      {adminStats?.total_organizations?.toLocaleString() || '—'}
                    </span>
                  </div>
                  <p className="font-label text-xs text-outline mt-2">{t('dashboard.admin.active_orgs')}</p>
                </div>
                <div className="mt-8">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between text-[11px] font-medium p-2 bg-surface-container-low rounded-lg">
                      <span className="text-on-surface-variant">{t('dashboard.admin.system_status')}</span>
                      <span className="text-success font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-success"></span> {t('dashboard.admin.optimal')}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-medium p-2 bg-surface-container-low rounded-lg">
                      <span className="text-on-surface-variant">{t('dashboard.admin.network_load')}</span>
                      <span className="text-primary font-bold">{t('dashboard.admin.stable')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Hero Stat Banner (Researcher) */}
              <div className="md:col-span-8 bg-surface-container-lowest rounded-[1.5rem] p-8 md:p-10 relative overflow-hidden flex flex-col justify-between min-h-[320px] shadow-[0_32px_64px_-12px_rgba(29,27,24,0.04)] isolate">
                <div className="absolute -right-20 -top-20 w-96 h-96 bg-gradient-to-br from-primary-fixed to-surface-container-lowest rounded-full blur-[80px] opacity-60 -z-10 pointer-events-none"></div>
                <div className="z-10">
                  <h2 className="font-body text-on-surface-variant text-lg font-medium mb-1">{t('dashboard.stats.total_processed')}</h2>
                  <div className="flex items-baseline gap-4 mt-2">
                    <span className="font-headline text-7xl md:text-8xl font-black text-gradient-primary tracking-tighter">
                      {overview?.total_colonies_today?.toLocaleString(i18n.language) ?? '—'}
                    </span>
                    {overview && (
                      <span className="font-label text-secondary-fixed-dim bg-primary text-on-primary px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">
                          {overview.colonies_change_pct >= 0 ? 'arrow_upward' : 'arrow_downward'}
                        </span>
                        {Math.abs(overview.colonies_change_pct).toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="z-10 mt-12 flex items-end justify-between w-full">
                  <div className="flex flex-col gap-1">
                    <span className="font-label text-sm text-outline">{t('dashboard.researcher.total_plates')}</span>
                    <span className="font-label text-lg text-on-surface font-semibold">{overview?.total_analyses_today ?? '0'} {t('dashboard.researcher.plates_unit')}</span>
                  </div>
                  <div className="h-16 w-1/2 flex items-end gap-1 opacity-80">
                    <div className="w-full bg-surface-container-low h-[20%] rounded-t-sm"></div>
                    <div className="w-full bg-surface-container-low h-[35%] rounded-t-sm"></div>
                    <div className="w-full bg-surface-container-low h-[25%] rounded-t-sm"></div>
                    <div className="w-full bg-primary h-[80%] rounded-t-sm"></div>
                    <div className="w-full bg-surface-container-low h-[60%] rounded-t-sm"></div>
                    <div className="w-full bg-surface-container-low h-[45%] rounded-t-sm"></div>
                    <div className="w-full bg-primary-container h-[100%] rounded-t-sm"></div>
                    <div className="w-full bg-surface-container-low h-[70%] rounded-t-sm"></div>
                  </div>
                </div>
              </div>

              {/* Verification Progress (Researcher) */}
              <div className="md:col-span-4 bg-surface-container-lowest rounded-[1.5rem] p-6 flex flex-col min-h-[320px] shadow-[0_32px_64px_-12px_rgba(29,27,24,0.04)] relative overflow-hidden group">
                <h2 className="font-headline text-lg font-bold text-on-surface mb-4">{t('dashboard.researcher.verification_progress')}</h2>
                <div className="flex-grow flex flex-col justify-between">
                  <div className="relative h-[160px] w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Finalized', value: (overview?.total_analyses_today || 0) - (overview?.unverified_count || 0) },
                            { name: 'Pending', value: overview?.unverified_count || 0 }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                        >
                          <Cell fill="var(--color-primary)" />
                          <Cell fill="var(--color-surface-container-high)" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-headline text-3xl font-black text-on-surface">
                        {overview?.total_analyses_today ? Math.round(((overview.total_analyses_today - overview.unverified_count) / overview.total_analyses_today) * 100) : 0}%
                      </span>
                      <span className="font-label text-[10px] text-outline uppercase tracking-widest font-bold">{t('complete')}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center px-4 mb-4">
                    <div className="flex flex-col items-center">
                      <span className="font-headline text-lg font-bold text-on-surface">{overview?.unverified_count || 0}</span>
                      <span className="font-label text-[10px] text-tertiary uppercase font-bold tracking-wider">{t('dashboard.samples.pending')}</span>
                    </div>
                    <div className="w-[1px] h-8 bg-outline-variant/20"></div>
                    <div className="flex flex-col items-center">
                      <span className="font-headline text-lg font-bold text-on-surface">{(overview?.total_analyses_today || 0) - (overview?.unverified_count || 0)}</span>
                      <span className="font-label text-[10px] text-primary uppercase font-bold tracking-wider">{t('dashboard.admin.verified')}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => window.location.href = '/history?status=ai_complete'}
                    className="w-full bg-primary text-on-primary py-3 rounded-xl font-headline font-bold text-xs shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    {t('dashboard.researcher.start_verification')}
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Quick View Modal */}
      {selectedAnalysisId && (
        <QuickViewModal
          id={selectedAnalysisId}
          onClose={() => setSelectedAnalysisId(null)}
        />
      )}

      {/* Floating Action Button (FAB) - Hidden for Admin */}
      {!isAdmin && (
        <button
          onClick={() => window.location.href = '/new-analysis'}
          className="fixed bottom-8 right-8 z-50 flex items-center gap-2 bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-4 rounded-[1.5rem] shadow-[0_20px_40px_-10px_rgba(29,27,24,0.15)] hover:shadow-[0_24px_48px_-12px_rgba(29,27,24,0.2)] hover:-translate-y-1 transition-all duration-300 font-headline font-bold text-lg backdrop-blur-xl group"
        >
          <span className="material-symbols-outlined group-hover:rotate-90 transition-transform duration-300">add</span>
          {t('dashboard.researcher.new_analysis')}
        </button>
      )}
    </div>
  );
}

export default Dashboard;
