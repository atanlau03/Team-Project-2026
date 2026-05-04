import { useDashboardOverview, useLiveActivity } from '../hooks/useDashboard';
import { useAnalyses } from '../hooks/useAnalyses';
import TopNav from '../components/TopNav';
import { useState, useEffect } from 'react';
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
  const { user, isAdmin, isLabManager } = useAuth();
  const { t, i18n } = useTranslation();
  const isSupervisor = isAdmin || isLabManager;

  const { data: overview } = useDashboardOverview();
  const { data: activity } = useLiveActivity(10);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<{ id: string, name: string } | null>(null);
  const [analysisPage, setAnalysisPage] = useState(1);

  const { data: trendData } = useCfuTrend({
    days: 7,
    scope: isSupervisor ? 'team' : 'mine',
    target_user_id: selectedUser?.id || undefined
  });

  const { data: usersData } = useAdminUsers({
    page_size: 100,
    role: isLabManager ? 'researcher' : undefined // Lab managers only see analysts
  });

  const { data: recentAnalyses } = useAnalyses({
    scope: isSupervisor ? 'team' : 'mine',
    target_user_id: selectedUser?.id || undefined,
    status: isSupervisor ? ['finalized', 'awaiting_approval'] : undefined,
    page: analysisPage,
    page_size: 6
  });

  const { data: pendingApprovals } = useAnalyses({
    status: 'awaiting_approval',
    scope: 'team',
    page_size: 5
  });

  const { data: finalizedAnalyses } = useAnalyses({
    status: 'finalized',
    scope: 'mine',
    page_size: 5
  });

  const [alertDismissed, setAlertDismissed] = useState(false);
  const [finalizedAlertDismissed, setFinalizedAlertDismissed] = useState(() => {
    const lastCount = localStorage.getItem('last_seen_finalized_count');
    return lastCount !== null;
  });

  useEffect(() => {
    if (finalizedAnalyses?.total) {
      const lastCount = localStorage.getItem('last_seen_finalized_count');
      if (lastCount === null || parseInt(lastCount) < finalizedAnalyses.total) {
        setFinalizedAlertDismissed(false);
      } else {
        setFinalizedAlertDismissed(true);
      }
    }
  }, [finalizedAnalyses?.total]);

  const handleDismissFinalized = () => {
    if (finalizedAnalyses?.total !== undefined) {
      localStorage.setItem('last_seen_finalized_count', finalizedAnalyses.total.toString());
      setFinalizedAlertDismissed(true);
    }
  };

  const handleViewFinalized = () => {
    handleDismissFinalized();
    window.location.href = '/history?status=finalized';
  };

  // Helpers
  const { data: adminStats } = useAdminStats();

  const isResearcher = !isAdmin && !isLabManager;

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

      {/* Floating Pending Approval Alert for Lab Managers */}
      {isLabManager && pendingApprovals?.total && pendingApprovals.total > 0 && !alertDismissed && (
        <div className="fixed top-24 right-8 z-[60] animate-in slide-in-from-right-8 duration-500">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-tertiary to-primary-container rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative glass-panel rounded-[2rem] p-6 pr-12 shadow-[0_32px_64px_-12px_rgba(29,27,24,0.1)] border border-white/20 flex items-center gap-5 min-w-[320px]">
              <div className="w-14 h-14 rounded-2xl bg-tertiary/10 flex items-center justify-center text-tertiary relative">
                <span className="material-symbols-outlined text-3xl animate-pulse">pending_actions</span>
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-tertiary text-on-tertiary text-[10px] font-black rounded-full flex items-center justify-center shadow-lg">
                  {pendingApprovals.total}
                </span>
              </div>
              <div>
                <h3 className="font-headline font-bold text-on-surface leading-tight">Action Required</h3>
                <p className="font-body text-xs text-on-surface-variant mt-1">
                  You have <span className="font-bold text-tertiary">{pendingApprovals.total} analyses</span> awaiting your final review.
                </p>
                <button 
                  onClick={() => window.location.href = '/history?status=awaiting_approval'}
                  className="mt-3 text-primary font-label text-[10px] uppercase tracking-widest font-bold flex items-center gap-1.5 hover:underline"
                >
                  Review Now
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
              <button 
                onClick={() => setAlertDismissed(true)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-surface-container-high flex items-center justify-center text-outline-variant transition-colors"
                title="Dismiss"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Finalized Alert for Analysts */}
      {isResearcher && finalizedAnalyses?.total && finalizedAnalyses.total > 0 && !finalizedAlertDismissed && (
        <div className="fixed top-24 right-8 z-[60] animate-in slide-in-from-right-8 duration-500">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-success/50 to-primary-container rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative glass-panel rounded-[2rem] p-6 pr-12 shadow-[0_32px_64px_-12px_rgba(29,27,24,0.1)] border border-white/20 flex items-center gap-5 min-w-[320px]">
              <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center text-success relative">
                <span className="material-symbols-outlined text-3xl">check_circle</span>
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-success text-on-primary text-[10px] font-black rounded-full flex items-center justify-center shadow-lg">
                  {finalizedAnalyses.total}
                </span>
              </div>
              <div>
                <h3 className="font-headline font-bold text-on-surface leading-tight">Analyses Approved</h3>
                <p className="font-body text-xs text-on-surface-variant mt-1">
                  <span className="font-bold text-success">{finalizedAnalyses.total} of your analyses</span> have been verified and finalized.
                </p>
                <button 
                  onClick={handleViewFinalized}
                  className="mt-3 text-primary font-label text-[10px] uppercase tracking-widest font-bold flex items-center gap-1.5 hover:underline"
                >
                  View Results
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
              <button 
                onClick={handleDismissFinalized}
                className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-surface-container-high flex items-center justify-center text-outline-variant transition-colors"
                title="Dismiss"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Canvas */}
      <main className="flex-grow max-w-[1600px] w-full mx-auto px-6 md:px-12 py-10 flex flex-col gap-8">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-2">
          <div>
            <p className="font-label text-tertiary text-sm tracking-widest uppercase mb-2">
              {isLabManager ? "Team Overview" : t('dashboard.workspace_overview')}
            </p>
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
                  {isSupervisor && !selectedUser ? t('dashboard.trends.team') : isSupervisor && selectedUser ? t('dashboard.trends.user', { name: selectedUser.name }) : t('dashboard.trends.weekly')}
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
                {isSupervisor && selectedUser && (
                  <button
                    onClick={() => { setSelectedUser(null); setAnalysisPage(1); }}
                    className="p-1.5 rounded-full hover:bg-surface-container-highest text-on-surface-variant transition-colors"
                    title="Back to Users"
                  >
                    <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                  </button>
                )}
                <h2 className="font-headline text-xl font-bold text-on-surface">
                  {isSupervisor && !selectedUser ? t('dashboard.samples.team_users') : isSupervisor && selectedUser ? t('dashboard.samples.user_recent', { name: selectedUser.name }) : t('dashboard.samples.recent')}
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
              {isSupervisor && !selectedUser ? (
                // --- USER LIST VIEW ---
                <div className="flex flex-col gap-3">
                  {usersData?.items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                      <div className="w-16 h-16 rounded-3xl bg-surface-container-high flex items-center justify-center text-outline mb-4">
                        <span className="material-symbols-outlined text-3xl">group_off</span>
                      </div>
                      <h3 className="font-headline font-bold text-on-surface mb-2">No Analysts Assigned</h3>
                      <p className="font-body text-xs text-on-surface-variant max-w-[280px]">
                        Your team directory is currently empty. Please contact the Lab Admin to register and link analysts to your supervision.
                      </p>
                    </div>
                  ) : (
                    usersData?.items.map(u => (
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
                    ))
                  )}
                </div>
              ) : (
                // --- RECENT SAMPLES VIEW ---
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(recentAnalyses?.items || [])
                    .filter((a: any) => !isSupervisor || ['finalized', 'awaiting_approval'].includes(a.status))
                    .map((analysis: any) => (
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
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            analysis.status === 'finalized' 
                              ? 'bg-primary/10 text-primary' 
                              : analysis.status === 'awaiting_approval' 
                                ? 'bg-warning/10 text-warning'
                                : 'bg-surface-container-high text-outline'
                            }`}>
                            {analysis.status === 'finalized' ? 'Finalized' : analysis.status === 'awaiting_approval' ? 'Awaiting Approval' : 'Draft'}
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

        {/* Row 3: Admin Insights or Supervisor/Researcher View */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-min">
          {isAdmin ? (
            <>
              {/* Admin Cards remain as they are... */}
              {/* (Assuming they are system-wide) */}
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
                            { name: 'Managers', value: adminStats?.total_lab_managers || 0 },
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
                          <Cell fill="var(--color-secondary)" />
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
                      <span className="font-headline text-sm font-bold text-on-surface">{adminStats?.total_researchers || 0}</span>
                      <span className="font-label text-[8px] text-tertiary uppercase font-bold tracking-wider">Analysts</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="font-headline text-sm font-bold text-on-surface">{adminStats?.total_lab_managers || 0}</span>
                      <span className="font-label text-[8px] text-secondary uppercase font-bold tracking-wider">Managers</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="font-headline text-sm font-bold text-on-surface">{adminStats?.total_admins || 0}</span>
                      <span className="font-label text-[8px] text-primary uppercase font-bold tracking-wider">Admins</span>
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
              {isLabManager && (
                <div className="md:col-span-12 bg-surface-container-lowest rounded-[1.5rem] p-8 shadow-[0_32px_64px_-12px_rgba(29,27,24,0.04)]">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-tertiary/10 flex items-center justify-center text-tertiary">
                        <span className="material-symbols-outlined text-2xl">fact_check</span>
                      </div>
                      <div>
                        <h2 className="font-headline text-xl font-bold text-on-surface">Awaiting Approval</h2>
                        <p className="font-body text-xs text-on-surface-variant">Analyses submitted for your final review and verification</p>
                      </div>
                    </div>
                    {pendingApprovals?.total && pendingApprovals.total > 0 ? (
                      <span className="px-4 py-1.5 bg-tertiary text-on-tertiary rounded-full text-xs font-bold font-headline animate-pulse">
                        {pendingApprovals.total} Actions Required
                      </span>
                    ) : null}
                  </div>

                  {pendingApprovals?.items && pendingApprovals.items.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {pendingApprovals.items.map((analysis: any) => (
                        <button
                          key={analysis.id}
                          onClick={() => window.location.href = `/analysis/${analysis.id}`}
                          className="flex items-center gap-4 p-4 bg-surface-container-low rounded-2xl hover:bg-surface-container-high transition-all border border-outline-variant/10 text-left group"
                        >
                          <div className="w-14 h-14 rounded-xl bg-black overflow-hidden shrink-0 shadow-sm">
                            {analysis.image?.stored_path ? (
                              <img src={getMediaUrl(analysis.image.stored_path)} alt="Plate" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-surface-container text-on-surface-variant">
                                <span className="material-symbols-outlined">microbiology</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-grow min-w-0">
                            <h4 className="font-headline font-bold text-sm text-on-surface truncate">{analysis.sample_id}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="font-label text-[10px] text-outline uppercase font-bold">{analysis.media_type}</span>
                              <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                              <span className="font-label text-[10px] text-primary font-bold">By {analysis.operator_name || 'Researcher'}</span>
                            </div>
                          </div>
                          <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors">arrow_forward</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-16 h-16 rounded-3xl bg-surface-container-high flex items-center justify-center text-outline/30 mb-4">
                        <span className="material-symbols-outlined text-4xl">check_circle</span>
                      </div>
                      <h3 className="font-headline font-bold text-on-surface-variant">No Analyses Awaiting Approval</h3>
                      <p className="font-body text-xs text-on-surface-variant/60 max-w-sm mt-2">All team results have been finalized. You're all caught up!</p>
                    </div>
                  )}
                  
                  <div className="mt-8 pt-6 border-t border-outline-variant/10 flex justify-center">
                    <button 
                      onClick={() => window.location.href = '/history?status=awaiting_approval'}
                      className="text-primary font-label text-xs uppercase tracking-widest font-bold flex items-center gap-2 hover:underline"
                    >
                      View All Approvals Queue
                      <span className="material-symbols-outlined text-sm">open_in_new</span>
                    </button>
                  </div>
                </div>
              )}
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

      {/* FAB - Hidden for Admin & Lab Manager */}
      {!isSupervisor && (
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
