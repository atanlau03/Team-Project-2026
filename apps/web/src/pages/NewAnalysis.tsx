import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCreateAnalysis, useUploadImage, useRunAiInference, useFinalizeAnalysis } from '../hooks/useAnalyses';
import { useGeneratePdf } from '../hooks/useReports';
import type { AnalysisDetail as AnalysisDetailType } from '../types';
import TopNav from '../components/TopNav';
import { getMediaUrl } from '../lib/axios';
import { useNotification } from '../context/NotificationContext';

export default function NewAnalysis() {
  const { t, i18n } = useTranslation();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [maxStepReached, setMaxStepReached] = useState(1);

  // Form state (Step 1)
  const [sampleId, setSampleId] = useState('SAMP-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 900) + 100));
  const [volume, setVolume] = useState(0.1);
  const [dilution, setDilution] = useState(-4);
  const [mediaType, setMediaType] = useState('tsa');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup preview URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Analysis state (persisted across steps)
  const [analysis, setAnalysis] = useState<AnalysisDetailType | null>(null);
  const [aiResult, setAiResult] = useState<{
    colony_count: number;
    confidence: number;
    processing_time_ms: number;
  } | null>(null);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const formatScientific = (num: number) => {
    if (!num) return { base: '0', exp: '0' };
    const str = num.toExponential(2);
    const [base, exp] = str.split('e');
    return { base, exp: parseInt(exp).toString() };
  };

  const getDilutionExponent = (factor: number) => {
    if (!factor || factor <= 0) return 0;
    // factor 10000 -> 10^4 -> we want to show -4
    return -Math.log10(factor);
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '—';
      return new Intl.DateTimeFormat(i18n.language, {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(date);
    } catch {
      return '—';
    }
  };

  // Mutations
  const createAnalysis = useCreateAnalysis();
  const uploadImage = useUploadImage();
  const runAi = useRunAiInference();
  const finalizeAnalysis = useFinalizeAnalysis();
  const generatePdf = useGeneratePdf();

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleProceedToAI = async () => {
    setError('');

    if (!selectedFile && !analysis?.image) {
      setError(t('new_analysis.messages.upload_required'));
      return;
    }

    try {
      let currentAnalysis = analysis;

      // Step 1: Create analysis if not exists
      if (!currentAnalysis) {
        currentAnalysis = await createAnalysis.mutateAsync({
          sample_id: sampleId,
          media_type: mediaType,
          volume_plated_ml: volume,
          dilution_factor: Math.round(Math.pow(10, Math.abs(dilution))),
        });
        setAnalysis(currentAnalysis);
      }

      // Transition to Step 2 immediately to show loading state
      setStep(2);
      setMaxStepReached(prev => Math.max(prev, 2));

      // Step 2: Upload image if selected
      if (selectedFile) {
        await uploadImage.mutateAsync({ analysisId: currentAnalysis.id, file: selectedFile });
      }

      // Step 3: Trigger AI Inference in background while on Step 2
      const result = await runAi.mutateAsync(currentAnalysis.id) as unknown as AnalysisDetailType;
      setAnalysis(result);

      // Update stats for the hero card
      setAiResult({
        colony_count: result.ai_colony_count || 0,
        confidence: result.ai_confidence || 0,
        processing_time_ms: 0
      });
      setStep(2);
      setMaxStepReached(prev => Math.max(prev, 2));
    } catch (err: unknown) {
      setError((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || t('new_analysis.messages.process_error'));
      // If we already moved to step 2 but it failed, we might want to stay or show error there
    }
  };

  const handleFinalize = async () => {
    if (!analysis) return;
    setError('');
    try {
      if (analysis.status !== 'finalized') {
        const finalized = await finalizeAnalysis.mutateAsync(analysis.id);
        setAnalysis(finalized);
        showNotification(t('new_analysis.messages.finalize_success'), 'success');
        
        // Ensure step 3 is fully "completed" in state
        setMaxStepReached(3);

        // Reset/Reload page after a delay so user can see the notification
        setTimeout(() => {
          window.location.href = window.location.pathname; // Stronger reload
        }, 1500);
      }
      setShowSuccessModal(true);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || t('new_analysis.messages.finalize_error'));
      showNotification(t('new_analysis.messages.finalize_error'), 'error');
    }
  };

  const handleFinish = () => {
    window.location.href = window.location.pathname;
  };

  const handleGeneratePdf = async () => {
    if (!analysis) return;
    try {
      await generatePdf.mutateAsync(analysis.id);
    } catch { /* silently handle */ }
  };

  const isProcessing = createAnalysis.isPending || uploadImage.isPending || runAi.isPending;
  const isFinalizing = finalizeAnalysis.isPending;

  return (
    <div className="bg-surface flex flex-col flex-grow w-full min-h-screen selection:bg-primary-container selection:text-on-primary-container">
      {/* TopNavBar */}
      <TopNav />

      <main className="flex-grow flex flex-col items-center">
        {/* Sub-Navigation for Wizard Steps */}
        <div className="w-full bg-surface-container-lowest border-b border-outline-variant/15 px-8 py-4 flex justify-center sticky top-20 z-40 shadow-sm">
          <nav className="flex items-center gap-12">
            <button 
              onClick={() => setStep(1)} 
              className={`pb-1 font-bold font-headline text-sm tracking-wide transition-all flex items-center gap-2 ${step === 1 ? 'text-[#513825] dark:text-white border-b-2 border-[#6B4F3A] opacity-80' : 'text-stone-400 dark:text-stone-500 hover:text-[#6B4F3A]'}`}
            >
              <span className="material-symbols-outlined text-sm">cloud_upload</span>
              {t('new_analysis.steps.upload')}
            </button>
            <button 
              onClick={() => maxStepReached >= 2 && setStep(2)} 
              disabled={maxStepReached < 2}
              className={`pb-1 font-bold font-headline text-sm tracking-wide transition-all flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed ${step === 2 ? 'text-[#513825] dark:text-white border-b-2 border-[#6B4F3A] opacity-80' : 'text-stone-400 dark:text-stone-500 hover:text-[#6B4F3A]'}`}
            >
              <span className="material-symbols-outlined text-sm">psychology</span>
              {t('new_analysis.steps.ai')}
            </button>
            <button 
              onClick={() => maxStepReached >= 3 && setStep(3)} 
              disabled={maxStepReached < 3}
              className={`pb-1 font-bold font-headline text-sm tracking-wide transition-all flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed ${step === 3 ? 'text-[#513825] dark:text-white border-b-2 border-[#6B4F3A] opacity-80' : 'text-stone-400 dark:text-stone-500 hover:text-[#6B4F3A]'}`}
            >
              <span className="material-symbols-outlined text-sm">fact_check</span>
              {t('new_analysis.steps.report')}
            </button>
          </nav>
        </div>

        {step === 1 && (
          <div className="flex-1 w-full max-w-[1600px] overflow-y-auto p-6 lg:p-12 xl:p-16">
            <div className="max-w-7xl mx-auto">
              <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h2 className="font-headline text-4xl font-bold text-primary tracking-tight">{t('new_analysis.header.title')}</h2>
                  <p className="font-body text-on-surface-variant mt-2 text-lg">{t('new_analysis.header.subtitle')}</p>
                </div>
                <button
                  onClick={() => setShowHelp(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-[#5D4037]/5 text-[#5D4037] border border-[#5D4037]/20 rounded-2xl font-bold hover:bg-[#5D4037] hover:text-white transition-all duration-300 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[20px]">help</span>
                  {t('new_analysis.guidebook.how_to')}
                </button>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Left Column: Upload Area */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                  <div
                    className="bg-surface-container-lowest rounded-2xl p-8 min-h-[500px] flex flex-col items-center justify-center relative overflow-hidden group border border-outline-variant/15 transition-all duration-300 hover:bg-surface-container-low/50"
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => { e.preventDefault(); e.stopPropagation(); const file = e.dataTransfer.files[0]; if (file) handleFileSelect(file); }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png"
                      className="hidden"
                      onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileSelect(file); }}
                    />
                    {previewUrl ? (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                        <img src={previewUrl} alt="Plate preview" className="max-h-[400px] object-contain rounded-xl" />
                        <button
                          className="px-6 py-2 bg-primary/10 text-primary rounded-lg font-headline font-semibold hover:bg-primary hover:text-white transition-all"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {t('new_analysis.upload.change')}
                        </button>
                      </div>
                    ) : (
                      <div
                        className="flex flex-col items-center justify-center gap-4 text-center cursor-pointer border-2 border-dashed border-outline-variant/30 w-full h-full rounded-2xl group-hover:border-primary/50 transition-colors duration-300"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-primary mb-2">
                          <span className="material-symbols-outlined text-4xl">add_photo_alternate</span>
                        </div>
                        <div>
                          <p className="font-headline text-lg font-bold text-on-surface">{t('new_analysis.upload.title')}</p>
                          <p className="font-body text-sm text-on-surface-variant mt-1 px-8">{t('new_analysis.upload.desc')}</p>
                        </div>
                        <button className="mt-4 px-6 py-2 bg-primary/10 text-primary rounded-lg font-headline font-semibold hover:bg-primary hover:text-white transition-all">
                          {t('new_analysis.upload.select')}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between px-2">
                    <p className="font-label text-sm text-stone-400 italic">
                      {selectedFile ? `${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(1)} MB)` : t('new_analysis.upload.no_file')}
                    </p>
                  </div>
                </div>

                {/* Right Column: Setup Form */}
                <div className="lg:col-span-5 flex flex-col">
                  <div className="bg-surface-container-low rounded-2xl p-8 flex-1">
                    <h3 className="font-headline text-2xl font-bold text-primary mb-8 border-b border-outline-variant/20 pb-4">{t('new_analysis.form.title')}</h3>
                    <form className="space-y-8">
                      {/* Field */}
                      <div>
                        <label className="block font-label text-xs uppercase tracking-wider text-on-surface-variant mb-2" htmlFor="sample_id">{t('new_analysis.form.sample_id')}</label>
                        <input className="w-full bg-surface-container-low border-0 border-b border-outline-variant/15 text-on-surface font-label text-lg py-2 px-0 focus:ring-0 focus:border-outline-variant/40 focus:bg-surface-container-lowest transition-colors rounded-t-md" id="sample_id" type="text" value={sampleId} onChange={(e) => setSampleId(e.target.value)} />
                      </div>

                      {/* Media Type Selection */}
                      <div>
                        <label className="block font-label text-xs uppercase tracking-wider text-on-surface-variant mb-4">{t('new_analysis.form.media_type')}</label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { id: 'tsa', label: 'TSA', icon: 'science' },
                            { id: 'macconkey', label: 'MacConkey', icon: 'invert_colors' },
                            { id: 'blood', label: 'Blood Agar', icon: 'bloodtype' },
                            { id: 'sda', label: 'SDA', icon: 'psychology' }
                          ].map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => setMediaType(m.id)}
                              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                                mediaType === m.id 
                                  ? 'bg-primary/10 border-primary text-primary shadow-sm' 
                                  : 'bg-surface border-outline-variant/15 text-on-surface-variant hover:border-primary/30'
                              }`}
                            >
                              <span className="material-symbols-outlined text-xl">{m.icon}</span>
                              <span className="font-body text-xs font-bold uppercase tracking-tight">{m.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Volume & Dilution Row */}
                      <div className="grid grid-cols-2 gap-8 pt-4">
                        {/* Field */}
                        <div className="space-y-1">
                          <dt className="text-sm font-medium text-on-surface-variant">{t('new_analysis.form.volume')}</dt>
                          <input
                            type="number"
                            step="0.01"
                            className="input-primary w-full px-4 py-3 rounded-xl bg-surface-container text-on-surface"
                            value={volume}
                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                          />
                        </div>

                        {/* Field */}
                        <div>
                          <label className="block font-label text-xs uppercase tracking-wider text-on-surface-variant mb-2" htmlFor="dilution">{t('new_analysis.form.dilution')}</label>
                          <div className="relative flex items-center">
                            <span className="absolute left-0 text-on-surface-variant font-label text-lg">10^</span>
                            <input className="w-full bg-surface-container-low border-0 border-b border-outline-variant/15 text-on-surface font-label text-lg py-2 pl-10 pr-0 focus:ring-0 focus:border-outline-variant/40 focus:bg-surface-container-lowest transition-colors rounded-t-md text-right" id="dilution" type="number" value={dilution} onChange={(e) => setDilution(parseInt(e.target.value) || 0)} />
                          </div>
                        </div>
                      </div>

                      <div className="pt-6">
                        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/15 flex items-start gap-4">
                          <span className="material-symbols-outlined text-secondary mt-0.5">info</span>
                          <p className="font-body text-sm text-on-surface-variant leading-relaxed">{t('new_analysis.form.info')}</p>
                        </div>
                      </div>
                    </form>
                  </div>

                  {/* Actions */}
                  {error && (
                    <div className="mt-4 p-3 rounded-lg bg-error-container text-on-error-container text-sm font-body text-center">
                      {error}
                    </div>
                  )}

                  <div className="mt-8 flex justify-end gap-4">
                    <button className="px-6 py-3 font-headline font-semibold text-primary border border-outline-variant/15 rounded-xl hover:bg-surface-container-low transition-colors">
                      {t('new_analysis.form.save_draft')}
                    </button>
                    <button
                      onClick={handleProceedToAI}
                      disabled={isProcessing}
                      className="px-8 py-3 bg-gradient-to-br from-primary to-primary-container text-white rounded-xl font-headline font-semibold flex items-center gap-3 hover:opacity-90 transition-opacity shadow-[0_8px_32px_rgba(29,27,24,0.12)] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> {t('new_analysis.form.processing')}</>
                      ) : (
                        <>{t('new_analysis.form.proceed')} <span className="material-symbols-outlined text-sm">arrow_forward</span></>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex-grow flex flex-col md:flex-row max-w-screen-2xl mx-auto w-full p-8 gap-12 mt-8">
            {/* Central Workspace: Plate Gallery */}
            {/* Central Workspace: Plate Gallery */}
            <section className="flex-grow flex flex-col space-y-6">
              <header className="flex justify-between items-end">
                <div>
                  <h1 className="font-headline font-extrabold text-4xl text-on-surface tracking-tight mb-2">{analysis?.sample_id || t('new_analysis.confirm.hero.sample_id')}</h1>
                  <p className="text-on-surface-variant font-body text-sm max-w-md">{t('new_analysis.ai.desc')}</p>
                </div>
                <div className="flex space-x-4">
                  <button className="flex items-center space-x-2 px-4 py-2 rounded-xl border border-outline-variant text-primary hover:bg-surface-container transition-colors">
                    <span className="material-symbols-outlined text-sm">zoom_in</span>
                    <span className="font-label text-xs uppercase tracking-wider">{t('new_analysis.ai.zoom')}</span>
                  </button>
                </div>
              </header>

              <div className="relative w-full max-w-[500px] aspect-square mx-auto bg-surface-container-low rounded-3xl overflow-hidden flex items-center justify-center ghost-border shadow-xl group">
                {/* Main Dish Image */}
                <img
                  alt="Petri Dish"
                  className="max-w-full max-h-full object-contain transition-transform duration-700 group-hover:scale-[1.02]"
                  src={analysis?.image ? getMediaUrl(analysis.image.stored_path) : (previewUrl || '')}
                />
                {/* Real AI Overlay */}
                <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
                  <div className="relative w-full h-full">
                    {analysis?.colonies?.map((colony, idx) => (
                      <div
                        key={colony.id || idx}
                        className="absolute border-[1px] border-[#00BFFF] bg-transparent pointer-events-none"
                        style={{
                          left: `${colony.position_x}%`,
                          top: `${colony.position_y}%`,
                          width: `${colony.bbox_width || 1.5}%`,
                          height: `${colony.bbox_height || 1.5}%`,
                          transform: 'translate(-50%, -50%)',
                          zIndex: 10
                        }}
                      >
                        <span className="bg-[#00BFFF] text-white text-[7px] leading-none px-0.5 py-0.5 whitespace-nowrap absolute -top-3 left-0 font-bold shadow-sm">
                          {colony.species_name} {(colony.confidence || 0).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Floating Legend */}
                <div className="absolute bottom-6 left-6 glass-panel px-4 py-3 rounded-xl flex flex-wrap gap-4 max-w-[80%] z-30">
                  {Array.from(new Set(analysis?.colonies?.map(c => c.species_name))).slice(0, 3).map(species => (
                    <div key={species} className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                      <span className="font-label text-[10px] text-on-surface uppercase whitespace-nowrap">
                        {species} ({analysis?.colonies?.filter(c => c.species_name === species).length})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Right Sidebar: Analysis Summary */}
            <aside className="w-full md:w-[420px] flex flex-col space-y-8 flex-shrink-0">
              {/* Hero Stat Card */}
              <div className="bg-surface-container-lowest rounded-2xl p-8 ambient-shadow relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-fixed/30 rounded-bl-full -mr-8 -mt-8 pointer-events-none"></div>
                <div className="flex justify-between items-start mb-6">
                  <h2 className="font-label text-xs uppercase tracking-widest text-on-surface-variant">{t('new_analysis.ai.stat_label')}</h2>
                  <div className="flex items-center space-x-2 bg-tertiary-container text-on-tertiary px-3 py-1 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-[#A8D08D] shadow-[0_0_8px_#A8D08D]"></span>
                    <span className="font-label text-[10px] tracking-wider uppercase">{aiResult ? t('new_analysis.ai.confidence_badge', { val: (aiResult.confidence * 100).toFixed(1) }) : '—'}</span>
                  </div>
                </div>
                <div className="font-headline font-black text-6xl text-primary tracking-tighter mb-2 min-h-[80px] flex items-center">
                  {runAi.isPending ? (
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>{aiResult?.colony_count ?? '—'} <span className="text-2xl font-bold text-on-surface-variant ml-2">CFU</span></>
                  )}
                </div>
                <p className="text-sm text-secondary font-body mt-4">{t('new_analysis.ai.count_desc')}</p>
              </div>

              {/* Calculations Breakdown */}
              <div className="bg-surface-container-low rounded-2xl p-8 ghost-border">
                <h3 className="font-headline font-bold text-lg text-on-surface mb-6 flex items-center">
                  <span className="material-symbols-outlined text-secondary mr-3" style={{ fontVariationSettings: "'FILL' 1" }}>calculate</span>
                  {t('new_analysis.ai.calculations')}
                </h3>
                <div className="space-y-6">
                  <div className="flex justify-between items-end border-b border-outline-variant/30 pb-4">
                    <span className="text-on-surface-variant text-sm font-body">{t('new_analysis.form.dilution')}</span>
                    <span className="font-label text-lg text-primary">10<sup className="text-xs">{analysis ? getDilutionExponent(analysis.dilution_factor) : dilution}</sup></span>
                  </div>
                  <div className="flex justify-between items-end border-b border-outline-variant/30 pb-4">
                    <span className="text-on-surface-variant text-sm font-body">{t('new_analysis.form.volume')}</span>
                    <span className="font-label text-lg text-primary">{analysis?.volume_plated_ml || volume} ml</span>
                  </div>
                  <div className="flex justify-between items-end bg-surface-container p-4 rounded-xl -mx-4 mt-2">
                    <span className="text-on-surface font-semibold text-sm font-body">{t('new_analysis.ai.calculated_conc')}</span>
                    <span className="font-label font-bold text-xl text-primary">
                      {formatScientific(analysis?.calculated_cfu_ml || 0).base} x 10<sup className="text-sm">{formatScientific(analysis?.calculated_cfu_ml || 0).exp}</sup> <span className="text-sm text-on-surface-variant font-normal">CFU/ml</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Species Identification Breakdown */}
              <div className="bg-surface-container-low rounded-2xl p-8 ghost-border flex-grow max-h-[400px] overflow-y-auto">
                <h3 className="font-headline font-bold text-lg text-on-surface mb-6 flex items-center sticky top-0 bg-surface-container-low pb-2 z-10">
                  <span className="material-symbols-outlined text-secondary mr-3" style={{ fontVariationSettings: "'FILL' 1" }}>biotech</span>
                  {t('new_analysis.ai.species_id')}
                </h3>
                <ul className="space-y-4">
                  {runAi.isPending ? (
                    <div className="flex flex-col items-center justify-center py-8 opacity-50">
                      <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin mb-2" />
                      <p className="text-xs font-label uppercase tracking-widest text-secondary">{t('new_analysis.form.processing')}</p>
                    </div>
                  ) : (
                    Object.entries(
                      (analysis?.colonies || []).reduce((acc: Record<string, number>, c) => {
                        const name = c.species_name || 'Unknown';
                        acc[name] = (acc[name] || 0) + 1;
                        return acc;
                      }, {})
                    ).sort((a, b) => b[1] - a[1]).map(([species, count]) => (
                      <li key={species} className="flex justify-between items-center group">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-sm">microbiology</span>
                          </div>
                          <span className="text-on-surface text-sm font-medium italic">{species}</span>
                        </div>
                        <span className="font-label text-sm text-on-surface-variant font-bold">{count}</span>
                      </li>
                    ))
                  )}
                </ul>
              </div>

              {/* Action Footer */}
              <div className="flex space-x-4 pt-4">
                <button onClick={() => setStep(1)} className="flex-1 py-4 px-6 rounded-xl border border-outline-variant text-primary font-bold text-sm tracking-wide hover:bg-surface-container-low transition-colors text-center font-headline flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg mr-2">tune</span>
                  {t('new_analysis.ai.refine')}
                </button>
                <button
                  onClick={() => {
                    setStep(3);
                    setMaxStepReached(prev => Math.max(prev, 3));
                  }}
                  className="flex-[2] btn-primary py-4 px-6 rounded-xl text-on-primary font-bold text-sm tracking-wide shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow text-center font-headline flex items-center justify-center group"
                >
                  {t('new_analysis.ai.verify')} <span className="material-symbols-outlined text-lg ml-2 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </button>
              </div>
            </aside>
          </div>
        )}

        {step === 3 && (
          <div className="flex-grow flex flex-col items-center py-12 px-6 sm:px-12 w-full max-w-7xl mx-auto gap-12">
            {/* Header Section */}
            <header className="w-full text-center space-y-4 max-w-3xl">
              <h1 className="font-headline text-4xl md:text-5xl font-extrabold text-primary tracking-tight">{t('new_analysis.confirm.title')}</h1>
              <p className="font-body text-on-surface-variant text-lg">{t('new_analysis.confirm.desc')}</p>
            </header>

            {/* Bento Grid Layout */}
            <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Left Column: Primary Data (Span 8) */}
              <div className="md:col-span-8 space-y-6 flex flex-col">
                {/* Hero Data Card */}
                <article className="bg-surface-container-lowest rounded-xl p-8 flex flex-col sm:flex-row items-center justify-between gap-8 ambient-shadow relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-surface-container-low rounded-full -translate-y-1/2 translate-x-1/4 opacity-50 pointer-events-none"></div>
                  <div className="space-y-6 z-10 w-full sm:w-auto">
                    <div className="flex flex-col">
                      <span className="font-mono-tech text-[10px] text-on-surface-variant uppercase font-bold tracking-widest mb-1">{t('new_analysis.confirm.hero.sample_id')}</span>
                      <span className="font-headline text-2xl font-black text-primary uppercase">{analysis?.sample_id}</span>
                      <span className="text-xs font-body text-primary font-bold mt-1 opacity-70 uppercase tracking-tighter">{analysis?.media_type} Agar</span>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <div className="font-label text-xs text-on-surface-variant uppercase tracking-wider mb-2">{t('new_analysis.confirm.hero.total_colonies')}</div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-headline text-5xl font-black text-primary tracking-tighter">{analysis?.final_colony_count || analysis?.ai_colony_count || 0}</span>
                          <span className="font-label text-sm text-tertiary">CFU</span>
                        </div>
                      </div>
                      <div>
                        <div className="font-label text-xs text-on-surface-variant uppercase tracking-wider mb-2">{t('new_analysis.confirm.hero.concentration')}</div>
                        <div className="font-label text-2xl font-bold text-on-surface whitespace-nowrap">
                          {formatScientific(analysis?.calculated_cfu_ml || 0).base} × 10<sup className="text-xs">{formatScientific(analysis?.calculated_cfu_ml || 0).exp}</sup> <span className="text-sm font-normal text-tertiary">CFU/ml</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Plate Thumbnail with Real AI Overlay */}
                  <div className="w-56 h-56 rounded-xl overflow-hidden shrink-0 relative ghost-border bg-black/5 flex items-center justify-center p-1">
                    <img
                      src={analysis?.image ? getMediaUrl(analysis.image.stored_path) : (previewUrl || '')}
                      alt="Analyzed petri dish"
                      className="max-w-full max-h-full object-contain rounded-lg"
                    />
                    {/* Miniature AI Overlay */}
                    <div className="absolute inset-1 pointer-events-none z-10">
                      <div className="relative w-full h-full">
                        {analysis?.colonies?.map((colony, idx) => (
                          <div
                            key={colony.id || idx}
                            className="absolute border-[0.5px] border-[#00BFFF] bg-transparent opacity-60"
                            style={{
                              left: `${colony.position_x}%`,
                              top: `${colony.position_y}%`,
                              width: `${colony.bbox_width || 1}%`,
                              height: `${colony.bbox_height || 1}%`,
                              transform: 'translate(-50%, -50%)',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    {/* Success Badge */}
                    <div className="absolute top-2 right-2 bg-success-container/90 text-on-success-container p-1 rounded-full shadow-lg z-20">
                      <span className="material-symbols-outlined text-sm block">check_circle</span>
                    </div>
                  </div>
                </article>

                {/* Metadata Breakdown */}
                <section className="bg-surface-container-low rounded-xl p-8 ghost-border">
                  <h2 className="font-headline text-xl font-bold text-primary mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary">feed</span>
                    {t('new_analysis.confirm.metadata.title')}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-12">
                    <div className="space-y-1">
                      <dt className="font-label text-xs text-secondary uppercase tracking-widest">{t('new_analysis.confirm.metadata.protocol')}</dt>
                      <dd className="font-body text-on-surface font-medium">{analysis?.protocol || 'Standard Analysis v2.1'}</dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="font-label text-xs text-secondary uppercase tracking-widest">{t('new_analysis.form.dilution')}</dt>
                      <dd className="font-label text-on-surface font-medium">10<sup className="text-[10px]">{analysis ? getDilutionExponent(analysis.dilution_factor) : dilution}</sup></dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="font-label text-xs text-secondary uppercase tracking-widest">{t('new_analysis.confirm.metadata.date')}</dt>
                      <dd className="font-body text-on-surface font-medium">
                        {formatDate(analysis?.created_at)}
                      </dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="font-label text-xs text-secondary uppercase tracking-widest">{t('new_analysis.confirm.metadata.operator')}</dt>
                      <dd className="font-body text-on-surface font-medium">{analysis?.operator_name || '—'}</dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="font-label text-xs text-secondary uppercase tracking-widest">{t('new_analysis.confirm.metadata.timestamp')}</dt>
                      <dd className="font-label text-on-surface font-medium">
                        {formatDate(analysis?.updated_at)}
                      </dd>
                    </div>
                  </div>
                  {/* Species Summary Table (Step 4 Requirement) */}
                  <div className="mt-8 pt-8 border-t border-outline-variant/30">
                    <h3 className="font-headline text-lg font-bold text-primary mb-6 flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary">analytics</span>
                      {t('new_analysis.confirm.species_summary')}
                    </h3>
                    <div className="overflow-hidden rounded-xl border border-outline-variant/15">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-surface-container-low">
                          <tr>
                            <th className="px-6 py-3 font-label text-xs uppercase tracking-widest text-secondary">{t('new_analysis.confirm.table.species')}</th>
                            <th className="px-6 py-3 font-label text-xs uppercase tracking-widest text-secondary text-right">{t('new_analysis.confirm.table.count')}</th>
                            <th className="px-6 py-3 font-label text-xs uppercase tracking-widest text-secondary text-right">{t('new_analysis.confirm.table.percent')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/10">
                          {Object.entries(
                            (analysis?.colonies || []).reduce((acc: Record<string, number>, c) => {
                              const name = c.species_name || 'Unknown';
                              acc[name] = (acc[name] || 0) + 1;
                              return acc;
                            }, {})
                          ).sort((a, b) => b[1] - a[1]).map(([species, count]) => (
                            <tr key={species} className="hover:bg-surface-container-lowest/50 transition-colors">
                              <td className="px-6 py-4 font-body text-sm italic font-medium text-on-surface">{species}</td>
                              <td className="px-6 py-4 font-label text-sm text-right text-primary font-bold">{count}</td>
                              <td className="px-6 py-4 font-label text-sm text-right text-on-surface-variant">
                                {((count / (analysis?.colonies?.length || 1)) * 100).toFixed(1)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-outline-variant/30 space-y-2">
                    <label className="font-label text-xs text-secondary uppercase tracking-widest">{t('new_analysis.confirm.metadata.notes_label')}</label>
                    <p className="font-body text-sm text-on-surface-variant leading-relaxed">
                      {analysis?.notes || `Comprehensive species identification complete. AI confidence score: ${((analysis?.ai_confidence || 0) * 100).toFixed(1)}%.`}
                    </p>
                  </div>
                </section>
              </div>

              {/* Right Column: Actions & Summary (Span 4) */}
              <aside className="md:col-span-4 flex flex-col gap-6 sticky top-28">
                {/* Action Panel */}
                <div className="bg-surface-container-lowest rounded-xl p-6 ambient-shadow flex flex-col gap-4">
                  <h3 className="font-headline text-lg font-bold text-primary mb-2">{t('new_analysis.confirm.actions.title')}</h3>
                  <button 
                    onClick={handleFinalize} 
                    disabled={finalizeAnalysis.isPending}
                    className="btn-primary text-on-primary font-body font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-2 hover:opacity-95 transition-opacity shadow-[0_8px_16px_rgba(0,191,255,0.2)] active:scale-[0.98] disabled:opacity-70"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {finalizeAnalysis.isPending ? 'sync' : 'verified'}
                    </span>
                    {finalizeAnalysis.isPending ? t('common.processing') : t('new_analysis.confirm.actions.save')}
                  </button>

                  <div className="mt-4 text-center">
                    <button onClick={() => setStep(2)} className="text-secondary font-body text-sm font-medium hover:underline hover:text-primary transition-colors inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                      {t('new_analysis.confirm.actions.edit')}
                    </button>
                  </div>
                </div>

                {/* Validation Status */}
                <div className="bg-surface-container-low rounded-xl p-6 ghost-border flex items-start gap-4">
                  <div className="shrink-0 w-10 h-10 rounded-full bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed">
                    <span className="material-symbols-outlined text-lg">verified</span>
                  </div>
                  <div>
                    <h4 className="font-headline text-sm font-bold text-primary">{t('new_analysis.confirm.validation.title')}</h4>
                    <p className="font-body text-xs text-on-surface-variant mt-1 leading-snug">{t('new_analysis.confirm.validation.desc')}</p>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        )}
      </main>
      {/* Analysis Guidebook Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-md animate-in fade-in duration-500" onClick={() => setShowHelp(false)} />
          <div className="relative bg-surface-container-lowest rounded-[2.5rem] max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 fade-in duration-300 border border-outline-variant/20">
            {/* Header */}
            <header className="p-8 border-b border-outline-variant/10 flex items-center justify-between bg-stone-50/50 dark:bg-stone-900/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#5D4037] flex items-center justify-center text-white shadow-lg shadow-[#5D4037]/20">
                  <span className="material-symbols-outlined text-2xl">menu_book</span>
                </div>
                <div>
                  <h2 className="font-headline text-2xl font-black text-on-surface tracking-tight">{t('new_analysis.guidebook.title')}</h2>
                  <p className="text-sm text-on-surface-variant font-medium">{t('new_analysis.guidebook.subtitle')}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowHelp(false)}
                className="w-10 h-10 rounded-full hover:bg-surface-container-high flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-outline">close</span>
              </button>
            </header>

            {/* Content Container */}
            <div className="flex-grow overflow-y-auto p-10 space-y-12">
              {/* Introduction */}
              <section className="space-y-4">
                <h3 className="text-xl font-bold text-primary flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm">00</span>
                  {t('new_analysis.guidebook.overview.title')}
                </h3>
                <p className="text-on-surface-variant leading-relaxed font-body">
                  {t('new_analysis.guidebook.overview.desc')}
                </p>
              </section>

              {/* Step 1: Setup */}
              <section className="space-y-6">
                <h3 className="text-xl font-bold text-primary flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm">01</span>
                  {t('new_analysis.guidebook.setup.title')}
                </h3>
                <div className="grid grid-cols-1 gap-6">
                  {/* Media Types Detail */}
                  <div className="p-8 rounded-[2rem] bg-stone-50 border border-outline-variant/10 space-y-8">
                    <div className="flex items-center gap-5 text-on-surface">
                      <div className="shrink-0 w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner">
                        <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>biotech</span>
                      </div>
                      <div>
                        <h4 className="font-headline text-xl font-black text-primary leading-tight tracking-tight">{t('new_analysis.guidebook.setup.media_title')}</h4>
                        <p className="text-xs text-on-surface-variant font-medium mt-1 uppercase tracking-[0.1em]">{t('new_analysis.guidebook.setup.media_subtitle')}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="p-5 rounded-2xl bg-white dark:bg-stone-800 border border-outline-variant/15 shadow-sm group hover:border-primary/30 transition-all duration-300">
                        <p className="font-bold text-xs text-primary mb-1 uppercase tracking-wide">TSA (Tryptic Soy Agar)</p>
                        <p className="text-[11px] text-on-surface-variant leading-relaxed">{t('new_analysis.guidebook.setup.tsa_desc')}</p>
                      </div>
                      <div className="p-5 rounded-2xl bg-white dark:bg-stone-800 border border-outline-variant/15 shadow-sm group hover:border-primary/30 transition-all duration-300">
                        <p className="font-bold text-xs text-primary mb-1 uppercase tracking-wide">MacConkey Agar</p>
                        <p className="text-[11px] text-on-surface-variant leading-relaxed">{t('new_analysis.guidebook.setup.macconkey_desc')}</p>
                      </div>
                      <div className="p-5 rounded-2xl bg-white dark:bg-stone-800 border border-outline-variant/15 shadow-sm group hover:border-primary/30 transition-all duration-300">
                        <p className="font-bold text-xs text-primary mb-1 uppercase tracking-wide">Blood Agar</p>
                        <p className="text-[11px] text-on-surface-variant leading-relaxed">{t('new_analysis.guidebook.setup.blood_desc')}</p>
                      </div>
                      <div className="p-5 rounded-2xl bg-white dark:bg-stone-800 border border-outline-variant/15 shadow-sm group hover:border-primary/30 transition-all duration-300">
                        <p className="font-bold text-xs text-primary mb-1 uppercase tracking-wide">SDA (Sabouraud Dextrose)</p>
                        <p className="text-[11px] text-on-surface-variant leading-relaxed">{t('new_analysis.guidebook.setup.sda_desc')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Volume Plated Detail */}
                    <div className="p-8 rounded-[2rem] bg-stone-50 border border-outline-variant/10 space-y-5">
                      <div className="flex items-center gap-4 text-on-surface">
                        <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shadow-inner">
                          <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>colorize</span>
                        </div>
                        <h5 className="font-headline text-lg font-black text-primary">{t('new_analysis.guidebook.setup.volume_title')}</h5>
                      </div>
                      <p className="text-[13px] text-on-surface-variant leading-relaxed font-body">
                        {t('new_analysis.guidebook.setup.volume_desc')}
                      </p>
                    </div>

                    {/* Dilution Factor Detail */}
                    <div className="p-8 rounded-[2rem] bg-stone-50 border border-outline-variant/10 space-y-5">
                      <div className="flex items-center gap-4 text-on-surface">
                        <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shadow-inner">
                          <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>science</span>
                        </div>
                        <h5 className="font-headline text-lg font-black text-primary">{t('new_analysis.guidebook.setup.dilution_title')}</h5>
                      </div>
                      <p className="text-[13px] text-on-surface-variant leading-relaxed font-body">
                        {t('new_analysis.guidebook.setup.dilution_desc')}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Step 2: AI Inference */}
              <section className="space-y-6">
                <h3 className="text-xl font-bold text-primary flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm">02</span>
                  {t('new_analysis.guidebook.ai.title')}
                </h3>
                <div className="bg-[#5D4037]/5 rounded-[2.5rem] p-10 border border-[#5D4037]/10 flex flex-col md:flex-row gap-10 items-center">
                  <div className="shrink-0 w-28 h-28 rounded-3xl bg-white dark:bg-stone-800 flex items-center justify-center shadow-xl shadow-[#5D4037]/10">
                    <span className="material-symbols-outlined text-5xl text-[#5D4037] animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                  </div>
                  <div className="space-y-4">
                    <p className="font-headline text-2xl font-black text-on-surface leading-tight">{t('new_analysis.guidebook.ai.autonomous_title')}</p>
                    <p className="text-base text-on-surface-variant leading-relaxed font-body">
                      {t('new_analysis.guidebook.ai.desc')}
                    </p>
                  </div>
                </div>
              </section>

              {/* Step 3: Verification */}
              <section className="space-y-4">
                <h3 className="text-xl font-bold text-primary flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm">03</span>
                  {t('new_analysis.guidebook.verification.title')}
                </h3>
                <p className="text-on-surface-variant leading-relaxed font-body text-base">
                  {t('new_analysis.guidebook.verification.desc')}
                </p>
              </section>
            </div>

            {/* Footer */}
            <footer className="p-8 border-t border-outline-variant/10 bg-stone-50/50 dark:bg-stone-900/50 flex justify-end">
              <button 
                onClick={() => setShowHelp(false)}
                className="px-10 py-4 bg-[#5D4037] text-white rounded-2xl font-bold shadow-xl shadow-[#5D4037]/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center gap-3"
              >
                <span>{t('new_analysis.guidebook.got_it')}</span>
                <span className="material-symbols-outlined text-[20px]">play_arrow</span>
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}