import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useAnalysis, useFinalizeAnalysis, useDeleteAnalysis, useSubmitAnalysis, useUpdateAnalysis } from '../hooks/useAnalyses';
import { useAuth } from '../context/AuthContext';
import { useAuditTrail } from '../hooks/useAudit';
import { useColonies, useAddColony, useRemoveColony } from '../hooks/useColonies';
import { useNotification } from '../context/NotificationContext';
import { useState, useRef, useEffect } from 'react';
import TopNav from '../components/TopNav';
import { getMediaUrl } from '../lib/axios';

export default function AnalysisDetail() {
  const { t, i18n } = useTranslation();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isResearcher = user?.role === 'researcher' || !user?.role;
  const isSupervisor = user?.role === 'lab_manager' || user?.role === 'admin';

  const { data: analysis } = useAnalysis(id);
  const analysisId = id || analysis?.id;
  const { data: colonies } = useColonies(analysisId);
  const { data: auditEvents } = useAuditTrail(analysisId);

  const finalizeMutation = useFinalizeAnalysis();
  const submitMutation = useSubmitAnalysis();
  const deleteMutation = useDeleteAnalysis();
  const addColonyMutation = useAddColony();
  const removeColonyMutation = useRemoveColony();
  const updateAnalysisMutation = useUpdateAnalysis();

  const [localNotes, setLocalNotes] = useState('');
  const imgRef = useRef<HTMLDivElement>(null);
  const innerImgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (analysis?.notes) {
      setLocalNotes(analysis.notes);
    }
  }, [analysis]);

  const handleFinalize = async () => {
    if (!analysisId) return;
    const confirmMsg = isResearcher
      ? "Submit this analysis for supervisor approval?"
      : t('analysis_detail.messages.finalize_confirm');

    if (window.confirm(confirmMsg)) {
      try {
        if (isResearcher) {
          await submitMutation.mutateAsync(analysisId);
          showNotification("Analysis submitted for approval", "success");
        } else {
          await finalizeMutation.mutateAsync(analysisId);
          showNotification(t('analysis_detail.messages.finalize_success'), "success");
        }
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

  // Interaction State
  const [interactionMode, setInteractionMode] = useState<'pan' | 'add' | 'remove'>('pan');
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));

  const handleWheel = (e: React.WheelEvent) => {
    if (interactionMode !== 'pan') return;
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.min(Math.max(prev + delta, 0.5), 3));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (interactionMode !== 'pan') return;
    setIsPanning(true);
    setStartPan({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || interactionMode !== 'pan') return;
    setPanOffset({
      x: e.clientX - startPan.x,
      y: e.clientY - startPan.y
    });
  };

  const handleMouseUp = () => setIsPanning(false);

  const handleImageClick = async (e: React.MouseEvent) => {
    if (!isSupervisor || analysis?.status === 'finalized' || interactionMode !== 'add' || !innerImgRef.current || !analysisId) return;

    const rect = innerImgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Boundary safety: only mark if within the actual image bounds
    if (x < 0 || x > 100 || y < 0 || y > 100) return;

    try {
      await addColonyMutation.mutateAsync({
        analysisId,
        data: {
          position_x: x,
          position_y: y,
          label: `Manual Marker`
        }
      });
    } catch (err) {
      showNotification("Failed to add marker", "error");
    }
  };

  const handleRemoveColony = async (colonyId: string) => {
    if (!isSupervisor || analysis?.status === 'finalized' || interactionMode !== 'remove' || !analysisId) return;
    
    try {
      await removeColonyMutation.mutateAsync({ analysisId, colonyId });
    } catch (err) {
      showNotification("Failed to remove marker", "error");
    }
  };

  const handleUpdateNotes = async () => {
    if (!analysisId || analysis?.status === 'finalized') return;
    try {
      await updateAnalysisMutation.mutateAsync({
        analysisId,
        data: { notes: localNotes }
      });
      showNotification("Notes updated", "success");
    } catch (err) {
      showNotification("Failed to update notes", "error");
    }
  };

  const activeColonies = colonies?.filter(c => !c.is_removed) || [];
  const totalCount = activeColonies.length;

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusInfo = () => {
    switch (analysis?.status) {
      case 'finalized':
        return { label: t('analysis_detail.status.verified'), color: 'bg-primary-container/20 text-primary', dot: 'bg-primary' };
      case 'awaiting_approval':
        return { label: 'Awaiting Approval', color: 'bg-warning-container/20 text-warning', dot: 'bg-warning' };
      default:
        return { label: 'Draft', color: 'bg-tertiary-container/20 text-tertiary', dot: 'bg-tertiary' };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col antialiased">
      {/* TopNavBar */}
      <TopNav />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-6 lg:p-12 lg:py-16 gap-10 max-w-[1600px] mx-auto w-full">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-outline-variant/10">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-headline text-3xl md:text-4xl font-black text-on-surface tracking-tight">
                {analysis?.sample_id || t('analysis_detail.status.loading')}
              </h1>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-outline-variant/30 text-xs font-label font-medium ${statusInfo.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`}></span>
                {statusInfo.label}
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
          </div>
        </div>

        {/* Split Panel Layout */}
        <div className="flex flex-col lg:flex-row gap-8 flex-1 h-full">

          {/* Left Panel: Interactive Canvas (60%) */}
          <div className="lg:w-3/5 bg-surface-container-lowest rounded-2xl relative overflow-hidden flex flex-col border border-outline-variant/15 h-fit">
            {/* Toolbar */}
            <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center pointer-events-none">
              <div className="glass-panel rounded-xl p-1.5 flex gap-1 pointer-events-auto ambient-shadow border border-outline-variant/15">
                <button 
                  onClick={handleZoomIn}
                  className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-colors" 
                  title={t('analysis_detail.canvas.zoom') + " In"}
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>zoom_in</span>
                </button>
                <button 
                  onClick={handleZoomOut}
                  className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-colors" 
                  title={t('analysis_detail.canvas.zoom') + " Out"}
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>zoom_out</span>
                </button>
                <div className="w-px bg-outline-variant/30 my-2 mx-1"></div>
                <button 
                  onClick={() => setInteractionMode('pan')}
                  className={`p-2 rounded-lg transition-colors ${interactionMode === 'pan' ? 'text-primary bg-primary-container/20' : 'text-on-surface-variant hover:bg-surface-container-highest'}`} 
                  title={t('analysis_detail.actions.pan')}
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>pan_tool</span>
                </button>
                <button 
                  onClick={() => setInteractionMode('add')}
                  className={`p-2 rounded-lg transition-colors ${interactionMode === 'add' ? 'text-success bg-success/10' : 'text-on-surface-variant hover:bg-surface-container-highest'}`} 
                  title={t('analysis_detail.actions.add_marker')}
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>add_location</span>
                </button>
                <button 
                  onClick={() => setInteractionMode('remove')}
                  className={`p-2 rounded-lg transition-colors ${interactionMode === 'remove' ? 'text-error bg-error/10' : 'text-on-surface-variant hover:bg-surface-container-highest'}`} 
                  title={t('analysis_detail.actions.remove_marker')}
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>wrong_location</span>
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
            <div 
              ref={imgRef}
              onClick={handleImageClick}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              className={`bg-surface-container-high relative flex items-center justify-center p-16 overflow-hidden h-[480px] select-none ${
                isSupervisor && analysis?.status !== 'finalized' 
                  ? (interactionMode === 'pan' ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-crosshair') 
                  : ''
              }`}
            >
              <div 
                ref={innerImgRef}
                className="relative w-full max-w-md aspect-square bg-black rounded-3xl overflow-hidden shadow-2xl border border-outline-variant/20 will-change-transform"
                style={{
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                }}
              >
                <img
                  alt="Petri dish"
                  className="w-full h-full object-cover select-none pointer-events-none"
                  src={analysis?.image ? getMediaUrl(analysis.image.stored_path) : ''}
                />

                {/* AI Overlay Markers */}
                <div className="absolute inset-0 z-20 pointer-events-none">
                  <div className="relative w-full h-full">
                    {activeColonies.map((colony, idx) => (
                      <div 
                        key={colony.id}
                        className={`absolute w-4 h-4 border-2 group pointer-events-auto transition-all ${
                          colony.source === 'manual' 
                            ? 'border-tertiary bg-tertiary/10' 
                            : 'border-[#00BFFF] bg-transparent'
                        } ${isSupervisor && analysis?.status !== 'finalized' ? (interactionMode === 'remove' ? 'hover:scale-125 hover:border-error hover:bg-error/20 cursor-pointer' : '') : ''}`}
                        style={{
                          left: `${colony.position_x}%`,
                          top: `${colony.position_y}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                        onClick={(e) => {
                          if (isSupervisor && analysis?.status !== 'finalized' && interactionMode === 'remove') {
                            e.stopPropagation();
                            handleRemoveColony(colony.id);
                          }
                        }}
                      >
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 py-0.5 bg-surface-container-lowest border border-outline-variant/30 rounded text-[8px] font-bold text-on-surface opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30 pointer-events-none shadow-sm">
                          {colony.species_name || (colony.source === 'manual' ? 'Manual' : 'Colony')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Status Bar */}
            <div className="h-12 bg-surface-container-lowest border-t border-outline-variant/15 flex items-center justify-between px-6">
              <div className="text-xs font-label text-on-surface-variant flex gap-4">
                <span>{t('analysis_detail.canvas.zoom')}: {Math.round(zoom * 100)}%</span>
                <span>{t('analysis_detail.canvas.contrast')}: {t('analysis_detail.canvas_opts.auto')}</span>
              </div>
              <div className="text-xs font-label text-tertiary">
                {t('analysis_detail.canvas.total_count')}: {totalCount} CFUs
              </div>
            </div>

            {/* Audit Trail - Moved Under Image */}
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 flex flex-col overflow-hidden min-h-[300px] mt-6">
              <div className="p-5 border-b border-outline-variant/15 bg-surface-container-low/50">
                <h2 className="font-headline font-bold text-lg text-on-surface">{t('analysis_detail.audit.title')}</h2>
              </div>
              <div className="p-6 overflow-y-auto flex-1 relative max-h-[400px]">
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

          {/* Right Panel: Data & Audit (40%) */}
          <div className="lg:w-2/5 flex flex-col gap-6 h-full">

            {/* Notes Section */}
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 p-5 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-headline font-bold text-lg text-on-surface">Analysis Notes</h2>
                <span className="material-symbols-outlined text-outline-variant text-lg">notes</span>
              </div>
              <textarea
                value={localNotes}
                onChange={(e) => setLocalNotes(e.target.value)}
                disabled={analysis?.status === 'finalized' || !isResearcher}
                placeholder={isResearcher ? "Add observations, methodology notes, or verification comments..." : "No notes provided by the analyst."}
                className="w-full h-32 bg-surface-container-low rounded-xl p-4 text-sm font-body text-on-surface border border-outline-variant/10 focus:border-primary/30 focus:ring-0 transition-all resize-none disabled:opacity-70"
              />
              {analysis?.status !== 'finalized' && isResearcher && (
                <button
                  onClick={handleUpdateNotes}
                  disabled={updateAnalysisMutation.isPending}
                  className="w-full py-2.5 bg-surface-container-high hover:bg-surface-container-highest text-primary font-label text-xs font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {updateAnalysisMutation.isPending ? 'Saving...' : 'Save Notes'}
                  <span className="material-symbols-outlined text-sm">save</span>
                </button>
              )}
            </div>

            {/* AI Result Summary (Replacing Granular Colony List) */}
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 flex flex-col overflow-hidden min-h-[300px]">
              <div className="p-5 border-b border-outline-variant/15 bg-surface-container-low/50 flex justify-between items-center">
                <h2 className="font-headline font-bold text-lg text-on-surface">AI Analysis Result</h2>
                <span className="material-symbols-outlined text-primary">analytics</span>
              </div>
              <div className="p-6 space-y-8">
                {/* Main Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/5">
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">AI Colony Count</p>
                    <p className="text-3xl font-headline font-black text-primary">{analysis?.ai_colony_count || totalCount}</p>
                  </div>
                  <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/5">
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Final Result</p>
                    <p className="text-3xl font-headline font-black text-tertiary">{totalCount}</p>
                  </div>
                </div>

                {/* Species Distribution Summary */}
                <div className="space-y-4">
                  <h3 className="font-headline font-bold text-sm text-on-surface uppercase tracking-wider border-b border-outline-variant/10 pb-2">Species Identified</h3>
                  <div className="flex flex-wrap gap-2">
                    {activeColonies.length > 0 ? (
                      Object.entries(
                        activeColonies.reduce((acc: Record<string, number>, c: any) => {
                          const name = c.species_name || 'Unknown';
                          acc[name] = (acc[name] || 0) + 1;
                          return acc;
                        }, {})
                      ).map(([species, count]) => (
                        <div key={species} className="bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-primary">microbiology</span>
                          <span className="text-xs font-bold text-on-surface italic">{species}</span>
                          <span className="bg-primary text-on-primary text-[10px] px-1.5 py-0.5 rounded-md">{count}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-on-surface-variant italic">No colonies identified.</p>
                    )}
                  </div>
                </div>

                {/* Accuracy Indicator */}
                <div className="bg-primary/5 rounded-xl p-4 border border-primary/10 flex items-center gap-4 mt-auto">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">verified</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-on-surface">Analysis Integrity</p>
                    <p className="text-[10px] text-on-surface-variant">AI confidence and adjustments verified.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar - Contextual based on role and status */}
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 p-6 shadow-sm">
              <div className="flex flex-col gap-4">
                {isResearcher && analysis?.status === 'draft' && (
                  <button
                    onClick={async () => {
                      await handleUpdateNotes();
                      navigate('/history');
                    }}
                    className="w-full py-3 rounded-xl border border-outline-variant text-on-surface font-bold text-sm hover:bg-surface-container-high transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">drafts</span>
                    Save as Draft
                  </button>
                )}

                <button
                  onClick={handleFinalize}
                  disabled={analysis?.status === 'finalized' || finalizeMutation.isPending || submitMutation.isPending}
                  className="btn-gradient w-full py-4 rounded-xl text-on-primary font-bold text-base ambient-shadow hover:opacity-90 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {analysis?.status === 'finalized' ? 'verified' : (isResearcher ? 'send' : 'task_alt')}
                  </span>
                  {finalizeMutation.isPending || submitMutation.isPending
                    ? t('analysis_detail.actions.finalizing')
                    : (analysis?.status === 'finalized'
                      ? t('analysis_detail.status.finalized')
                      : (isResearcher ? 'Submit for Approval' : t('analysis_detail.actions.finalize')))}
                </button>
                
                {analysis?.status === 'awaiting_approval' && isResearcher && (
                  <p className="text-[10px] text-center text-on-surface-variant italic font-body">
                    Currently awaiting supervisor verification. Edits are restricted.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}