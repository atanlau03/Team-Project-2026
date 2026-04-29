import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import TopNav from '../components/TopNav';
import { 
  useSimulatorSamples, 
  useCreateSimulatorSession, 
  useSubmitSimulatorResult, 
  useRevealAiResult,
  useUploadSimulatorSample
} from '../hooks/useSimulator';
import { getMediaUrl } from '../lib/axios';

interface ClickMarker {
  x: number;
  y: number;
  id: number;
}

export default function BattleMode() {
  const { t } = useTranslation();
  
  // Queries & Mutations
  const { data: samples, isLoading: loadingSamples } = useSimulatorSamples();
  const createSession = useCreateSimulatorSession();
  const submitResult = useSubmitSimulatorResult();
  const revealAi = useRevealAiResult();
  const uploadSample = useUploadSimulatorSample();

  // State
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [markers, setMarkers] = useState<ClickMarker[]>([]);
  const [timer, setTimer] = useState(0);
  const [isBattleStarted, setIsBattleStarted] = useState(false);
  const [isHumanFinished, setIsHumanFinished] = useState(false);
  const [isAiRevealed, setIsAiRevealed] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'overlay'>('split');

  const timerRef = useRef<number | null>(null);
  const plateRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-select first sample
  useEffect(() => {
    if (samples && samples.length > 0 && !selectedSampleId) {
      setSelectedSampleId(samples[0].id);
    }
  }, [samples, selectedSampleId]);

  // Timer logic
  useEffect(() => {
    if (isBattleStarted && !isHumanFinished) {
      timerRef.current = setInterval(() => {
        setTimer(prev => prev + 10);
      }, 10);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isBattleStarted, isHumanFinished]);

  const activeSample = samples?.find(s => s.id === selectedSampleId);

  const handleStartBattle = async () => {
    if (!selectedSampleId) return;
    
    try {
      const session = await createSession.mutateAsync({ sample_image_id: selectedSampleId });
      setCurrentSession(session);
      setMarkers([]);
      setTimer(0);
      setIsBattleStarted(true);
      setIsHumanFinished(false);
      setIsAiRevealed(false);
    } catch (error) {
      console.error('Failed to start battle:', error);
    }
  };

  const handlePlateClick = (e: React.MouseEvent) => {
    if (!isBattleStarted || isHumanFinished) return;
    if (!plateRef.current) return;

    const rect = plateRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setMarkers(prev => [...prev, { x, y, id: Date.now() }]);
  };

  const handleFinishHuman = async () => {
    if (!currentSession) return;
    setIsHumanFinished(true);
    
    try {
      const updated = await submitResult.mutateAsync({
        sessionId: currentSession.id,
        data: {
          manual_count: markers.length,
          manual_time_ms: timer
        }
      });
      setCurrentSession(updated);
      
      // Auto-reveal AI after 1.5s (simulating thinking time)
      setTimeout(async () => {
        try {
          console.log('DEBUG: Requesting AI Reveal for session:', currentSession.id);
          const revealed = await revealAi.mutateAsync(currentSession.id);
          console.log('DEBUG: AI Revealed:', revealed);
          setCurrentSession(revealed);
          setIsAiRevealed(true);
        } catch (err) {
          console.error('DEBUG: AI Reveal Failed:', err);
        }
      }, 1500);
    } catch (error) {
      console.error('Failed to finish battle:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('label', `User Upload (${new Date().toLocaleTimeString()})`);

    try {
      const newSample = await uploadSample.mutateAsync(formData);
      setSelectedSampleId(newSample.id);
    } catch (error) {
      console.error('Failed to upload sample:', error);
    }
  };

  const formatTime = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    const centis = Math.floor((ms % 1000) / 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${centis.toString().padStart(2, '0')}`;
  };

  const getAccuracy = () => {
    if (!currentSession?.ai_count || !currentSession?.manual_count) return 0;
    const diff = Math.abs(currentSession.ai_count - currentSession.manual_count);
    const accuracy = Math.max(0, 100 - (diff / currentSession.ai_count) * 100);
    return accuracy.toFixed(1);
  };

  return (
    <div className="bg-surface text-on-surface flex flex-col flex-grow w-full min-h-screen selection:bg-primary-container selection:text-on-primary-container">
      <TopNav />

      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
        accept="image/*"
      />

      <main className="flex-1 flex flex-col h-[calc(100vh-5rem)] overflow-hidden bg-surface relative">
        {/* Header */}
        <header className="flex justify-between items-center w-full px-12 py-6 bg-surface z-10 flex-shrink-0 border-b border-outline-variant/10">
          <div>
            <h2 className="font-headline font-bold text-2xl text-primary tracking-tight">{t('battle_mode.title')}</h2>
            <p className="font-body text-sm text-secondary mt-1">{t('battle_mode.subtitle')}</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center bg-surface-container-high rounded-full p-1 border border-outline-variant/30">
              <button 
                onClick={() => setViewMode('split')}
                className={`px-4 py-1.5 rounded-full font-label text-xs font-semibold uppercase tracking-wider transition-all ${viewMode === 'split' ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-secondary hover:text-primary'}`}
              >
                {t('battle_mode.view.split')}
              </button>
              <button 
                onClick={() => setViewMode('overlay')}
                className={`px-4 py-1.5 rounded-full font-label text-xs font-semibold uppercase tracking-wider transition-all ${viewMode === 'overlay' ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-secondary hover:text-primary'}`}
              >
                {t('battle_mode.view.overlay')}
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-12 pb-12 pt-6 flex flex-col gap-8 custom-scrollbar">
          {/* Sample Selection Strip */}
          <div className="bg-surface-container-low rounded-2xl p-6 relative shadow-sm border border-outline-variant/15">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-headline text-lg font-semibold text-primary">{t('battle_mode.select_sample')}</h3>
              <div className="flex items-center gap-4">
                {uploadSample.isPending && <span className="font-label text-[10px] text-primary animate-pulse uppercase tracking-widest">{t('battle_mode.uploading')}</span>}
                <span className="font-label text-xs text-secondary uppercase tracking-widest">{t('battle_mode.library')}</span>
              </div>
            </div>
            <div className="flex gap-4 overflow-x-auto sample-scroll pb-2 custom-scrollbar">
              {/* Library Samples */}
              {!loadingSamples && samples?.map(sample => (
                <button 
                  key={sample.id}
                  onClick={() => !isBattleStarted && setSelectedSampleId(sample.id)}
                  disabled={isBattleStarted}
                  className="flex-shrink-0 relative group outline-none"
                >
                  <div className={`w-24 h-24 rounded-lg overflow-hidden border-2 transition-all ${selectedSampleId === sample.id ? 'border-primary ring-2 ring-primary/20' : 'border-outline-variant/30 group-hover:border-primary/50'}`}>
                    <img
                      alt={sample.label || 'Sample'}
                      className={`w-full h-full object-cover ${selectedSampleId === sample.id ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}
                      src={getMediaUrl(sample.image_path)}
                    />
                  </div>
                  {selectedSampleId === sample.id && (
                    <span className="absolute bottom-2 right-2 bg-primary text-on-primary font-label text-[10px] px-2 py-0.5 rounded shadow-sm">{t('battle_mode.selected')}</span>
                  )}
                </button>
              ))}

              {/* Upload New Plate Button */}
              <button 
                onClick={() => !isBattleStarted && fileInputRef.current?.click()}
                disabled={isBattleStarted || uploadSample.isPending}
                className="flex-shrink-0 flex flex-col items-center justify-center w-24 h-24 rounded-lg border border-dashed border-outline-variant hover:border-primary/50 hover:bg-surface-container-highest transition-all bg-surface-container outline-none group disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-secondary group-hover:text-primary mb-1">upload</span>
                <span className="font-label text-[10px] text-secondary group-hover:text-primary uppercase tracking-wider">{t('battle_mode.upload_btn')}</span>
              </button>
            </div>
          </div>

          {/* Battle Arena */}
          {!isBattleStarted ? (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] bg-surface-container-lowest rounded-3xl border border-dashed border-outline-variant/30">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-primary text-4xl">swords</span>
              </div>
              <h3 className="font-headline text-2xl font-bold text-on-surface mb-2">{t('battle_mode.ready_title')}</h3>
              <p className="font-body text-on-surface-variant text-center max-w-md mb-8">
                {t('battle_mode.ready_desc')}
              </p>
              <button 
                onClick={handleStartBattle}
                disabled={!selectedSampleId || createSession.isPending}
                className="bg-primary text-on-primary px-10 py-4 rounded-2xl font-headline font-bold text-lg shadow-xl hover:scale-105 transition-all flex items-center gap-3 disabled:opacity-50 disabled:scale-100"
              >
                {createSession.isPending ? t('battle_mode.preparing') : t('battle_mode.start_btn')}
                <span className="material-symbols-outlined">play_arrow</span>
              </button>
            </div>
          ) : (
            <div className={`grid ${viewMode === 'split' ? 'grid-cols-2' : 'grid-cols-1'} gap-8 flex-1 min-h-[500px]`}>
              {/* Human Panel */}
              <div className="bg-surface-container-lowest rounded-2xl flex flex-col shadow-sm relative overflow-hidden border border-outline-variant/20">
                <div className="px-6 py-4 flex justify-between items-center border-b border-surface-container-high z-10 bg-surface-container-lowest">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
                      <span className="material-symbols-outlined text-sm">person</span>
                    </div>
                    <h3 className="font-headline font-semibold text-primary">{t('battle_mode.human.title')}</h3>
                  </div>
                  <div className="flex items-center gap-2 bg-surface-container p-2 rounded-lg border border-outline-variant/30">
                    <span className={`material-symbols-outlined text-lg ${!isHumanFinished ? 'text-error animate-pulse' : 'text-outline'}`}>timer</span>
                    <span className="font-label text-xl text-on-surface font-medium tabular-nums tracking-tight">{formatTime(timer)}</span>
                  </div>
                </div>

                <div className="flex-1 relative flex items-center justify-center p-6 overflow-hidden">
                  <div 
                    ref={plateRef}
                    onClick={handlePlateClick}
                    className="relative rounded-full overflow-hidden border-4 border-surface-container-highest cursor-crosshair group shadow-2xl aspect-square w-full max-w-[500px] hover:border-primary/30 transition-colors"
                  >
                    {activeSample && (
                      <img
                        alt="Plate"
                        className={`w-full h-full object-cover transition-all duration-700 ${isAiRevealed && !isHumanFinished ? 'brightness-125' : 'brightness-100'}`}
                        src={getMediaUrl(activeSample.image_path)}
                      />
                    )}
                    
                    {/* Human Markers */}
                    {markers.map(m => (
                      <div 
                        key={m.id}
                        className="absolute w-3 h-3 bg-primary border-2 border-on-primary rounded-full -translate-x-1/2 -translate-y-1/2 shadow-[0_0_8px_rgba(var(--color-primary-rgb),0.8)] pointer-events-none z-10 animate-in zoom-in-50 duration-200"
                        style={{ left: `${m.x}%`, top: `${m.y}%` }}
                      />
                    ))}

                    {/* AI Markers Overlay (in Overlay mode) */}
                    {isAiRevealed && viewMode === 'overlay' && (
                      <div className="absolute inset-0 pointer-events-none bg-tertiary/10 mix-blend-overlay"></div>
                    )}
                  </div>

                  <div className="absolute bottom-6 left-6 glass-panel px-4 py-2 rounded-lg border border-white/10 flex flex-col backdrop-blur-md">
                    <span className="font-label text-[10px] text-primary uppercase tracking-widest">{t('battle_mode.human.count_label')}</span>
                    <span className="font-headline text-3xl font-bold text-primary tabular-nums">{markers.length}</span>
                  </div>
                </div>

                {!isHumanFinished && (
                  <div className="p-6 bg-surface-container-lowest z-10 flex justify-end">
                    <button 
                      onClick={handleFinishHuman}
                      className="bg-primary text-on-primary px-8 py-3 rounded-xl font-body font-semibold text-sm shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                    >
                      {t('battle_mode.human.finish')}
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                    </button>
                  </div>
                )}
              </div>

              {/* AI Panel (Only in Split View) */}
              {viewMode === 'split' && (
                <div className="bg-surface-container-low rounded-2xl flex flex-col relative overflow-hidden border border-outline-variant/10">
                  <div className="px-6 py-4 flex justify-between items-center z-10 bg-surface-container-low">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-tertiary-container flex items-center justify-center text-on-tertiary-container">
                        <span className="material-symbols-outlined text-sm">memory</span>
                      </div>
                      <h3 className="font-headline font-semibold text-tertiary">{t('battle_mode.ai.title')}</h3>
                    </div>
                    {isAiRevealed ? (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10">
                        <span className="font-label text-xs text-primary uppercase font-bold tracking-widest">{t('battle_mode.ai.completed')}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-highest">
                        <div className="w-2 h-2 rounded-full bg-secondary-fixed-dim animate-pulse"></div>
                        <span className="font-label text-xs text-secondary uppercase tracking-widest">{t('battle_mode.ai.waiting')}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 relative flex items-center justify-center p-6 bg-[#0a0a0a]">
                    <div className={`relative w-full max-w-[420px] aspect-square rounded-full border-[10px] border-white/5 overflow-hidden transition-all duration-1000 ${!isAiRevealed ? 'blur-2xl opacity-20' : 'opacity-90'}`}>
                      {activeSample && (
                        <img
                          alt="AI Plate"
                          className="w-full h-full object-cover"
                          src={getMediaUrl(activeSample.image_path)}
                        />
                      )}
                      {/* AI Detection Visuals (Simulated) */}
                      {isAiRevealed && (
                        <div className="absolute inset-0 flex items-center justify-center">
                           <div className="w-full h-full bg-tertiary/20 mix-blend-color-dodge animate-pulse"></div>
                        </div>
                      )}
                    </div>

                    {!isAiRevealed && isHumanFinished && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-surface-container-low/40 backdrop-blur-sm">
                        <div className="w-16 h-16 rounded-full bg-tertiary-container flex items-center justify-center mb-4 shadow-lg border border-tertiary/20">
                          <span className="material-symbols-outlined text-tertiary text-2xl animate-spin">settings</span>
                        </div>
                        <h4 className="font-headline text-xl text-tertiary mb-2">{t('battle_mode.ai.thinking')}</h4>
                        <p className="font-body text-sm text-on-surface-variant text-center max-w-xs italic">{t('battle_mode.ai.thinking_desc')}</p>
                      </div>
                    )}

                    {!isAiRevealed && !isHumanFinished && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                        <div className="w-16 h-16 rounded-full bg-surface-container-lowest/80 backdrop-blur-md flex items-center justify-center mb-4 shadow-lg border border-outline-variant/20">
                          <span className="material-symbols-outlined text-primary text-2xl">lock</span>
                        </div>
                        <h4 className="font-headline text-xl text-primary mb-2">{t('battle_mode.ai.locked_title')}</h4>
                        <p className="font-body text-sm text-secondary text-center max-w-xs">{t('battle_mode.ai.locked_desc')}</p>
                      </div>
                    )}

                    {isAiRevealed && (
                      <div className="absolute bottom-6 right-6 glass-panel px-4 py-2 rounded-lg border border-white/10 flex flex-col backdrop-blur-md">
                        <span className="font-label text-[10px] text-tertiary uppercase tracking-widest">AI Count</span>
                        <span className="font-headline text-3xl font-bold text-tertiary tabular-nums">{currentSession?.ai_count}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Comparison Metrics */}
          {isAiRevealed && (
            <div className="glass-panel mt-auto rounded-3xl border border-primary/20 p-8 shadow-2xl relative overflow-hidden animate-slide-up bg-surface-container-lowest">
              <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl"></div>
              
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                <div>
                  <h4 className="font-headline text-2xl font-bold text-primary mb-1">{t('battle_mode.metrics.title')}</h4>
                  <p className="font-body text-sm text-secondary">{t('battle_mode.metrics.subtitle')}</p>
                </div>

                <div className="flex items-center gap-12">
                  <div className="flex flex-col items-end">
                    <span className="font-label text-[10px] text-tertiary uppercase tracking-widest mb-1">{t('battle_mode.metrics.ai_time')}</span>
                    <span className="font-headline text-2xl font-black text-tertiary tabular-nums">{currentSession?.ai_time_ms}ms</span>
                  </div>
                  <div className="w-px h-12 bg-outline-variant/20"></div>
                  <div className="flex flex-col items-end">
                    <span className="font-label text-[10px] text-primary uppercase tracking-widest mb-1">{t('battle_mode.metrics.accuracy')}</span>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-success text-xl">verified</span>
                      <span className="font-headline text-4xl font-black text-primary">{getAccuracy()}%</span>
                    </div>
                  </div>
                  <div className="w-px h-12 bg-outline-variant/20"></div>
                  <div className="flex flex-col items-end">
                    <span className="font-label text-[10px] text-success uppercase tracking-widest mb-1">{t('battle_mode.metrics.efficiency')}</span>
                    <span className="font-headline text-4xl font-black text-success">
                      {Math.round(((timer - (currentSession?.ai_time_ms || 0)) / timer) * 100)}%
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => setIsBattleStarted(false)}
                  className="bg-primary text-on-primary px-8 py-4 rounded-2xl font-headline font-bold text-sm shadow-xl hover:opacity-90 transition-all"
                >
                  {t('battle_mode.metrics.try_again')}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

