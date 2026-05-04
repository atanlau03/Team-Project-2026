import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAnalyses, useAnalysis, useDeleteAnalysis } from '../hooks/useAnalyses';
import { useDownloadReport, useExportBatch, useExportCsv, useGeneratePdf } from '../hooks/useReports';
import TopNav from '../components/TopNav';
import { getMediaUrl } from '../lib/axios';
import QuickViewModal, { formatScientific } from '../components/QuickViewModal';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { useAdminUsers } from '../hooks/useAdmin';

export const formatDate = (dateStr?: string | null, lang: string = 'en-US') => {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat(lang, {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  } catch {
    return '—';
  }
};

export default function History() {
  const { t, i18n } = useTranslation();
  const { isAdmin, isLabManager } = useAuth();
  const isSupervisor = isAdmin || isLabManager;
  const { showNotification } = useNotification();
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<{id: string, name: string} | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // For Supervisor User Grid - Lab managers only see researchers
  const { data: usersData } = useAdminUsers({ 
    page_size: 100, 
    role: isLabManager ? 'researcher' : undefined 
  });

  // Fetch analyses
  const filters: any = {
    scope: isSupervisor ? 'team' : 'mine',
    target_user_id: selectedUser?.id || undefined,
    status: statusFilter || undefined,
    search: search || undefined,
    date_from: selectedDate || undefined,
    date_to: selectedDate || undefined,
    page,
    page_size: pageSize
  };
  const { data: analyses } = useAnalyses(filters);
  const generatePdf = useGeneratePdf();
  const exportCsv = useExportCsv();
  const exportBatchPdf = useExportBatch();
  const downloadReport = useDownloadReport();
  const deleteAnalysis = useDeleteAnalysis();

  const handleDelete = (id: string, sampleId: string) => {
    if (window.confirm(t('history.messages.confirm_delete', { sampleId }))) {
      deleteAnalysis.mutate(id, {
        onSuccess: () => {
          showNotification(t('history.messages.delete_success', { sampleId }), 'success');
        },
        onError: () => {
          showNotification(t('history.messages.delete_error', { sampleId }), 'error');
        }
      });
    }
  };

  const items = (analyses?.items || []).filter(a => !isSupervisor || ['finalized', 'awaiting_approval'].includes(a.status));
  const total = items.length; // Approximate total for filtered items
  const totalPages = analyses?.total_pages || 1;

  const handleExportCsv = () => {
    const analysisIds = items.map(i => i.id);
    if (analysisIds.length > 0) {
      exportCsv.mutate({ analysis_ids: analysisIds });
    }
  };

  const handleExportPdf = () => {
    const analysisIds = items.map(i => i.id);
    if (analysisIds.length > 0) {
      exportBatchPdf.mutate({ analysis_ids: analysisIds });
    }
  };

  return (
    <div className="bg-surface flex flex-col flex-grow w-full min-h-screen selection:bg-primary-container selection:text-on-primary-container">
      {/* TopNavBar */}
      <TopNav />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto min-h-screen">
        {isSupervisor && !selectedUser ? (
          // --- USER GRID VIEW (Supervisor Step 1) ---
          <div className="p-8 md:p-12 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4">
              <div>
                <h2 className="font-headline text-4xl font-extrabold text-on-surface tracking-tight mb-2">
                  {isLabManager ? "Team History" : t('history.admin.title')}
                </h2>
                <p className="font-body text-on-surface-variant text-lg">
                  {isLabManager ? "Monitor and manage the analysis records of your assigned team members." : t('history.admin.subtitle')}
                </p>
              </div>
              
              {isLabManager && (
                <button
                  onClick={handleExportCsv}
                  disabled={items.length === 0 || exportCsv.isPending}
                  className="bg-[#5D4037] text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl shadow-[#5D4037]/20 hover:bg-[#4E342E] transition-all flex items-center gap-3"
                >
                  <span className="material-symbols-outlined">download_for_offline</span>
                  Download All Team Results
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {usersData?.items.map(u => (
                <button
                  key={u.id}
                  onClick={() => setSelectedUser({ id: u.id, name: u.full_name })}
                  className="bg-surface-container-lowest rounded-2xl p-6 text-left border border-outline-variant/20 hover:bg-surface-container-low transition-colors shadow-sm group flex flex-col items-center gap-4"
                >
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-surface-container-high border-2 border-surface flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-300">
                    <div className="w-full h-full flex items-center justify-center bg-primary text-on-primary font-headline text-2xl font-bold">
                      {u.full_name.charAt(0)}
                    </div>
                  </div>
                  <div className="text-center w-full">
                    <h3 className="font-headline font-bold text-lg text-on-surface truncate px-2">{u.full_name}</h3>
                    <p className="font-label text-xs text-on-surface-variant truncate mt-1">{u.email}</p>
                    <div className="mt-4 flex justify-center">
                      <span className="text-[10px] uppercase tracking-wider font-bold bg-primary/10 text-primary px-3 py-1 rounded-full">
                        {t('history.admin.view_history')}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          // --- ANALYSIS HISTORY VIEW (User View OR Supervisor Step 2) ---
          <div className="p-8 md:p-12 space-y-12">
            {/* Page Header & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div>
                {isSupervisor && selectedUser && (
                  <button 
                    onClick={() => { setSelectedUser(null); setPage(1); setSearch(''); }}
                    className="flex items-center gap-2 text-primary hover:text-primary-fixed mb-4 font-label text-sm uppercase tracking-wider"
                  >
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                    {t('history.admin.back_to_users')}
                  </button>
                )}
                <h2 className="font-headline text-4xl font-extrabold text-on-surface tracking-tight mb-2">
                  {isSupervisor && selectedUser ? t('history.admin.user_history_title', { name: selectedUser.name }) : t('history.title')}
                </h2>
                <p className="font-body text-on-surface-variant text-lg">
                  {isSupervisor && selectedUser ? t('history.admin.user_history_desc', { name: selectedUser.name }) : t('history.subtitle')}
                </p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handleExportCsv}
                  disabled={exportCsv.isPending || items.length === 0}
                  className="btn-primary px-6 py-3 flex items-center gap-2 font-body font-medium transition-transform hover:-translate-y-0.5 ambient-shadow disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">{exportCsv.isPending ? 'sync' : 'download'}</span>
                  {t('history.data_grid.export_csv')}
                </button>
              </div>
            </div>

          {/* Simplified Single Date Filter */}
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="flex-1 w-full relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
              <input
                className="input-ghost w-full pl-12 pr-4 py-3 rounded-lg font-body text-on-surface focus:ring-0"
                placeholder={t('history.data_grid.search_placeholder')}
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>

            <div className="flex items-center bg-surface-container-high/50 rounded-xl px-4 py-2 border border-outline-variant/10 hover:border-primary/30 transition-colors h-[48px]">
              <span className="material-symbols-outlined text-outline text-lg mr-3">calendar_today</span>
              <input
                type="date"
                className="bg-transparent border-none text-on-surface font-label text-xs focus:ring-0 cursor-pointer"
                value={selectedDate}
                onChange={(e) => { setSelectedDate(e.target.value); setPage(1); }}
              />
              {selectedDate && (
                <button onClick={() => setSelectedDate('')} className="ml-2 text-outline-variant hover:text-error transition-colors">
                  <span className="material-symbols-outlined text-sm">cancel</span>
                </button>
              )}
            </div>

            <div className="flex items-center bg-surface-container-high/50 rounded-xl px-4 py-2 border border-outline-variant/10 hover:border-primary/30 transition-colors h-[48px]">
              <span className="material-symbols-outlined text-outline text-lg mr-3">filter_list</span>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="bg-transparent border-none text-on-surface font-label text-xs focus:ring-0 cursor-pointer pr-8"
              >
                <option value="">{t('history.filters.all_statuses')}</option>
                <option value="finalized">{t('history.filters.finalized')}</option>
                <option value="awaiting_approval">Awaiting Approval</option>
                {!isSupervisor && <option value="draft">{t('history.filters.draft')}</option>}
              </select>
            </div>


          </div>

          {/* Advanced Filters Panel */}
          {showAdvanced && (
            <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/20 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <p className="text-on-surface-variant font-body text-sm">{t('history.filters.additional_opts')}</p>
              </div>
            </div>
          )}

          {/* Data Table Container */}
          <div className="bg-surface-container-lowest rounded-[1.5rem] ambient-shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface border-b border-transparent">
                    <th className="font-headline font-bold text-on-surface-variant py-5 px-6 text-sm uppercase tracking-wider">{t('history.data_grid.col_date')}</th>
                    <th className="font-headline font-bold text-on-surface-variant py-5 px-6 text-sm uppercase tracking-wider">{t('history.data_grid.col_sample_id')}</th>
                    <th className="font-headline font-bold text-on-surface-variant py-5 px-6 text-sm uppercase tracking-wider">{t('history.data_grid.col_media_type')}</th>
                    <th className="font-headline font-bold text-on-surface-variant py-5 px-6 text-sm uppercase tracking-wider text-right">{t('history.data_grid.col_count')}</th>
                    <th className="font-headline font-bold text-on-surface-variant py-5 px-6 text-sm uppercase tracking-wider text-right">{t('history.data_grid.col_cfu')}</th>
                    <th className="font-headline font-bold text-on-surface-variant py-5 px-6 text-sm uppercase tracking-wider text-center">{t('history.data_grid.col_status')}</th>
                    <th className="py-5 px-6"></th>
                  </tr>
                </thead>
                <tbody className="font-body">
                  {items.length > 0 ? items.map((a) => (
                    <>
                      <tr key={a.id} className="group hover:bg-surface-container-low transition-colors duration-200">
                        <td className="py-4 px-6 text-on-surface font-label text-sm">{formatDate(a.created_at, i18n.language)}</td>
                        <td className="py-4 px-6 font-medium">
                          <button
                            onClick={() => window.location.href = `/analysis/${a.id}`}
                            className="text-primary hover:underline transition-all font-bold"
                          >
                            {a.sample_id}
                          </button>
                        </td>
                        <td className="py-4 px-6">
                           <span className="font-mono-tech text-[10px] uppercase font-bold text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-md border border-outline-variant/20">
                             {a.media_type || t('history.data_grid.unknown')}
                           </span>
                        </td>
                        <td className="py-4 px-6 text-right font-label font-bold text-on-surface">{a.final_colony_count ?? a.ai_colony_count ?? '—'}</td>
                        <td className="py-4 px-6 text-right font-label text-tertiary">
                          {a.calculated_cfu_ml ? (
                            <>
                              {formatScientific(a.calculated_cfu_ml).base} × 10<sup>{formatScientific(a.calculated_cfu_ml).exp}</sup>
                            </>
                          ) : '—'}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${a.status === 'finalized'
                            ? 'bg-primary-container/20 border-primary/20 text-primary'
                            : a.status === 'awaiting_approval'
                              ? 'bg-warning/10 border-warning/20 text-warning'
                              : 'bg-surface-container-high border-outline-variant/30 text-outline'
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${a.status === 'finalized' ? 'bg-primary' : a.status === 'awaiting_approval' ? 'bg-warning' : 'bg-outline'
                              }`}></span>
                            <span className="text-[10px] font-bold uppercase tracking-wider">
                              {a.status === 'finalized' ? 'Finalized' : a.status === 'awaiting_approval' ? 'Awaiting Approval' : 'Draft'}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              className="text-outline hover:text-primary transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
                              onClick={() => generatePdf.mutate(a.id, {
                                onSuccess: (report) => downloadReport.mutate(report.id)
                              })}
                              disabled={generatePdf.isPending}
                              title={t('history.download_pdf')}
                            >
                              <span className="material-symbols-outlined">{generatePdf.isPending ? 'sync' : 'picture_as_pdf'}</span>
                            </button>
                            <button
                              className="text-outline hover:text-error transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
                              onClick={() => handleDelete(a.id, a.sample_id)}
                              disabled={deleteAnalysis.isPending || a.status === 'finalized'}
                              title={t('history.data_grid.delete_title')}
                            >
                              <span className="material-symbols-outlined">{deleteAnalysis.isPending ? 'sync' : 'delete'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                        <tr className="bg-surface h-2">
                          {Array.from({ length: isSupervisor ? 8 : 7 }).map((_, i) => (
                            <td key={i}></td>
                          ))}
                        </tr>
                      </>
                    )) : (
                      <tr>
                        <td colSpan={isSupervisor ? 8 : 7} className="py-12 text-center text-on-surface-variant font-body">
                          {search ? t('history.data_grid.no_matching') : t('history.data_grid.no_reports')}
                        </td>
                      </tr>
                    )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-surface-container-low py-4 px-6 flex justify-between items-center rounded-b-[1.5rem]">
              <span className="font-body text-sm text-on-surface-variant">
                {t('history.data_grid.pagination_info', {
                  start: items.length > 0 ? ((page - 1) * pageSize + 1) : 0,
                  end: Math.min(page * pageSize, total),
                  total: total
                })}
              </span>
              <div className="flex gap-2">
                <button
                  className="p-2 rounded-lg hover:bg-surface-container-high text-outline transition-colors disabled:opacity-50"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button
                  className="p-2 rounded-lg hover:bg-surface-container-high text-on-surface transition-colors disabled:opacity-50"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        )}
      </main>

      {/* Quick View Modal */}
      {selectedAnalysisId && (
        <QuickViewModal
          id={selectedAnalysisId}
          onClose={() => setSelectedAnalysisId(null)}
        />
      )}
    </div>
  );
}
