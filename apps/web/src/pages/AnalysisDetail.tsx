import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useAnalysis, useFinalizeAnalysis, useDeleteAnalysis } from '../hooks/useAnalyses';
import { useAuditTrail } from '../hooks/useAudit';
import { useColonies } from '../hooks/useColonies';
import { useNotification } from '../context/NotificationContext';
import TopNav from '../components/TopNav';
import { getMediaUrl } from '../lib/axios';

export default function AnalysisDetail() {
  const { t, i18n } = useTranslation();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // If we have an ID from URL, fetch that specific analysis
  const { data: analysis } = useAnalysis(id);
  // Also fetch analyses list for the history sidebar (when no ID)
  // Fetch colonies and audit if we have an analysis
  const analysisId = id || analysis?.id;
  const { data: colonies } = useColonies(analysisId);
  const { data: auditEvents } = useAuditTrail(analysisId);

  const finalizeMutation = useFinalizeAnalysis();
  const deleteMutation = useDeleteAnalysis();

  const handleFinalize = async () => {
    if (!analysisId) return;
    if (window.confirm(t('analysis_detail.messages.finalize_confirm'))) {
      try {
        await finalizeMutation.mutateAsync(analysisId);
        showNotification(t('analysis_detail.messages.finalize_success'), "success");
        navigate('/history');
      } catch (err) {
        showNotification(t('analysis_detail.messages.finalize_error'), "error");
      }
    }
  };

  const handleDelete = async () => {
    if (!analysisId) return;
    if (window.confirm(t('analysis_detail.messages.delete_confirm'))) {
      try {
        await deleteMutation.mutateAsync(analysisId);
        showNotification(t('analysis_detail.messages.delete_success'), "success");
        navigate('/history');
      } catch (err) {
        showNotification(t('analysis_detail.messages.delete_error'), "error");
      }
    }
  };

  const activeColonies = colonies?.filter(c => !c.is_removed) || [];
  const totalCount = activeColonies.length;

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col antialiased">
      {/* TopNavBar */}
      <TopNav />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-6 lg:p-10 gap-6 max-w-[1600px] mx-auto w-full">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight">
                {analysis?.sample_id || t('analysis_detail.status.loading')}
              </h1>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-outline-variant/30 text-xs font-label font-medium ${
                analysis?.status === 'finalized' ? 'bg-primary-container/20 text-primary' : 'bg-tertiary-container/20 text-tertiary'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  analysis?.status === 'finalized' ? 'bg-primary' : 'bg-tertiary'
                }`}></span>
                {analysis?.status === 'finalized' ? t('analysis_detail.status.verified') : t('analysis_detail.status.pending')}
              </span>
            </div>
            <p className="text-on-surface-variant text-sm font-body">{t('analysis_detail.subtitle')}</p>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={handleDelete}
              disabled={analysis?.status === 'finalized' || deleteMutation.isPending}
              className="px-5 py-2.5 rounded-xl border border-error/20 text-error font-semibold text-sm hover:bg-error/5 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg">delete</span>
              {t('analysis_detail.actions.delete')}
            </button>
            <button 
              onClick={handleFinalize}
              disabled={analysis?.status === 'finalized' || finalizeMutation.isPending}
              className="btn-gradient px-6 py-2.5 rounded-xl text-on-primary font-semibold text-sm ambient-shadow hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
            >
              {finalizeMutation.isPending ? t('analysis_detail.actions.finalizing') : (analysis?.status === 'finalized' ? t('analysis_detail.status.finalized') : t('analysis_detail.actions.finalize'))}
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </button>
          </div>
        </div>

        {/* Split Panel Layout */}
        <div className="flex flex-col lg:flex-row gap-8 flex-1 h-full min-h-[600px]">

          {/* Left Panel: Interactive Canvas (60%) */}
          <div className="lg:w-3/5 bg-surface-container-lowest rounded-2xl relative overflow-hidden flex flex-col border border-outline-variant/15">
            {/* Toolbar */}
            <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center pointer-events-none">
              <div className="glass-panel rounded-xl p-1.5 flex gap-1 pointer-events-auto ambient-shadow border border-outline-variant/15">
                <button className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-colors" title={t('analysis_detail.canvas.zoom') + " In"}>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>zoom_in</span>
                </button>
                <button className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-colors" title={t('analysis_detail.canvas.zoom') + " Out"}>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>zoom_out</span>
                </button>
                <div className="w-px bg-outline-variant/30 my-2 mx-1"></div>
                <button className="p-2 rounded-lg text-primary bg-primary-container/10 hover:bg-primary-container/20 transition-colors" title={t('analysis_detail.actions.pan')}>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>pan_tool</span>
                </button>
                <button className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-colors" title={t('analysis_detail.actions.add_marker')}>
                  <span className="material-symbols-outlined text-success" style={{ fontVariationSettings: "'FILL' 0" }}>add_location</span>
                </button>
                <button className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-colors" title={t('analysis_detail.actions.remove_marker')}>
                  <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 0" }}>wrong_location</span>
                </button>
              </div>

              <div className="glass-panel rounded-xl px-4 py-2 flex items-center gap-3 pointer-events-auto ambient-shadow border border-outline-variant/15">
                <span className="text-sm font-semibold text-on-surface">{t('analysis_detail.canvas.heatmap')}</span>
                <button className="w-10 h-6 bg-surface-container-high rounded-full relative transition-colors focus:outline-none">
                  <span className="absolute left-1 top-1 w-4 h-4 bg-outline rounded-full transition-transform"></span>
                </button>
              </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 bg-surface-container-high relative flex items-center justify-center overflow-hidden">
              <img
                alt="Petri dish"
                className="max-w-full max-h-full object-contain rounded-xl shadow-xl"
                src={analysis?.image ? getMediaUrl(analysis.image.stored_path) : ''}
              />

              {/* AI Overlay Markers */}
              <div className="absolute inset-0 z-20 pointer-events-none">
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="relative w-full h-full">
                    {activeColonies.map((colony, idx) => (
                      <div 
                        key={colony.id}
                        className="absolute border-[1px] border-[#00BFFF] bg-transparent"
                        style={{
                          left: `${colony.position_x}%`,
                          top: `${colony.position_y}%`,
                          width: `${colony.bbox_width || 1.5}%`,
                          height: `${colony.bbox_height || 1.5}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        <span className="bg-[#00BFFF] text-white text-[6px] leading-none px-0.5 py-0.5 whitespace-nowrap absolute -top-2.5 left-0 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                          {colony.species_name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Status Bar */}
            <div className="h-12 bg-surface-container-lowest border-t border-outline-variant/15 flex items-center justify-between px-6">
              <div className="text-xs font-label text-on-surface-variant flex gap-4">
                <span>{t('analysis_detail.canvas.zoom')}: 145%</span>
                <span>{t('analysis_detail.canvas.contrast')}: {t('analysis_detail.canvas_opts.auto')}</span>
              </div>
              <div className="text-xs font-label text-tertiary">
                {t('analysis_detail.canvas.total_count')}: {totalCount} CFUs
              </div>
            </div>
          </div>

          {/* Right Panel: Data & Audit (40%) */}
          <div className="lg:w-2/5 flex flex-col gap-6 h-full">

            {/* Colony List */}
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 flex-1 flex flex-col overflow-hidden min-h-[300px]">
              <div className="p-5 border-b border-outline-variant/15 flex justify-between items-center bg-surface-container-low/50">
                <h2 className="font-headline font-bold text-lg text-on-surface">{t('analysis_detail.colonies.title')}</h2>
                <span className="px-2.5 py-1 bg-tertiary-container text-on-tertiary-container rounded-full text-xs font-label">{t('analysis_detail.colonies.top_conf')}</span>
              </div>

              <div className="overflow-y-auto flex-1 p-2">
                {activeColonies.length > 0 ? activeColonies.slice(0, 10).map((colony, idx) => (
                  <div key={colony.id} className={`flex items-center justify-between p-3 hover:bg-surface-container-low transition-colors rounded-xl group cursor-pointer ${idx > 0 ? 'mt-1' : ''} ${colony.source === 'manual' ? 'bg-surface-bright border border-outline-variant/10' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-label ${colony.source === 'manual' ? 'bg-primary-container/10 border-primary/20 text-primary' : 'bg-surface-container-high border-outline-variant/30 text-on-surface-variant'}`}>
                        {colony.source === 'manual' ? t('analysis_detail.colonies.manual_short') : String(idx + 1).padStart(2, '0')}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-on-surface font-body flex items-center gap-2">
                          {colony.label || t('analysis_detail.colonies.default_label', { index: idx + 1 })}
                          {colony.source === 'manual' && <span className="material-symbols-outlined text-[14px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>}
                        </div>
                        <div className="text-xs text-on-surface-variant font-label mt-0.5">
                          Pos: [{colony.position_x.toFixed(0)}, {colony.position_y.toFixed(0)}]{colony.area_px ? ` • Area: ${colony.area_px.toFixed(0)}px²` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold font-label ${colony.confidence && colony.confidence > 0.95 ? 'text-success' : 'text-primary'}`}>
                        {colony.confidence ? `${(colony.confidence * 100).toFixed(1)}%` : '100%'}
                      </div>
                      <div className="text-[10px] text-on-surface-variant uppercase tracking-wider mt-0.5">
                        {colony.source === 'manual' ? t('analysis_detail.status.status_verified') : t('analysis_detail.colonies.confidence_label')}
                      </div>
                    </div>
                  </div>
                )) : (
                  // Fallback static items
                  <>
                    <div className="flex items-center justify-between p-3 hover:bg-surface-container-low transition-colors rounded-xl group cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant/30 flex items-center justify-center text-xs font-label text-on-surface-variant">01</div>
                        <div>
                          <div className="text-sm font-semibold text-on-surface font-body">{t('analysis_detail.colonies.fallback_cluster')}</div>
                          <div className="text-xs text-on-surface-variant font-label mt-0.5">Pos: [124, 452] • Area: 12px²</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-success font-label">99.8%</div>
                        <div className="text-[10px] text-on-surface-variant uppercase tracking-wider mt-0.5">{t('analysis_detail.colonies.confidence_label')}</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Audit Trail */}
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 flex-1 flex flex-col overflow-hidden min-h-[250px]">
              <div className="p-5 border-b border-outline-variant/15 bg-surface-container-low/50">
                <h2 className="font-headline font-bold text-lg text-on-surface">{t('analysis_detail.audit.title')}</h2>
              </div>
              <div className="p-6 overflow-y-auto flex-1 relative">
                {/* Vertical Line */}
                <div className="absolute left-[39px] top-8 bottom-8 w-px bg-outline-variant/30"></div>

                <div className="flex flex-col gap-6">
                  {auditEvents && auditEvents.length > 0 ? auditEvents.map((event) => (
                    <div key={event.id} className="flex gap-4 relative z-10">
                      <div className="w-8 h-8 rounded-full bg-surface-container-highest border-2 border-surface flex items-center justify-center shrink-0 mt-1">
                        {event.user_name ? (
                          <span className="font-headline font-bold text-xs text-on-surface">
                            {event.user_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </span>
                        ) : (
                          <span className="material-symbols-outlined text-[16px] text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-on-surface">{event.description}</div>
                        <div className="text-xs text-on-surface-variant font-label mt-1">
                          {formatTime(event.created_at)}{event.user_name ? ` • ${event.user_name}` : ` • ${t('analysis_detail.audit.system')}`}
                        </div>
                      </div>
                    </div>
                  )) : (
                    // Fallback static audit events
                    <>
                      <div className="flex gap-4 relative z-10">
                        <div className="w-8 h-8 rounded-full bg-surface-container-highest border-2 border-surface flex items-center justify-center shrink-0 mt-1">
                          <span className="material-symbols-outlined text-[16px] text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-on-surface">{t('analysis_detail.audit.ai_complete')}</div>
                          <div className="text-xs text-on-surface-variant font-label mt-1">10:42 AM • {t('analysis_detail.audit.system')} {t('analysis_detail.audit.auto_run')}</div>
                          <p className="text-sm text-on-surface-variant mt-2 font-body leading-relaxed bg-surface-container-low p-3 rounded-lg border border-outline-variant/10">Identified 233 potential CFUs with average confidence of 96.4%.</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}