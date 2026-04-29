import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAnalysis } from '../hooks/useAnalyses';
import { getMediaUrl } from '../lib/axios';

export const formatScientific = (num: number) => {
  if (!num) return { base: '0', exp: '0' };
  const str = num.toExponential(2);
  const [base, exp] = str.split('e');
  return { base, exp: parseInt(exp).toString() };
};

export const getDilutionExponent = (factor: number) => {
  if (!factor || factor <= 0) return 0;
  return Math.log10(factor);
};

interface QuickViewModalProps {
  id: string;
  onClose: () => void;
}

export default function QuickViewModal({ id, onClose }: QuickViewModalProps) {
  const { data: analysis, isLoading } = useAnalysis(id);
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-500" onClick={onClose} />
      <div className="relative bg-surface-container-lowest rounded-[2.5rem] p-0 max-w-4xl w-full overflow-hidden shadow-2xl animate-in zoom-in-95 fade-in duration-300 max-h-[90vh] flex flex-col">
        {isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="font-label text-sm uppercase tracking-widest text-primary animate-pulse">{t('quick_view.fetching')}</p>
          </div>
        ) : analysis ? (
          <>
            {/* Modal Header */}
            <div className="bg-primary px-8 py-6 text-on-primary flex justify-between items-center">
              <div>
                <h2 className="font-headline text-2xl font-black tracking-tight">{analysis.sample_id}</h2>
                <p className="text-on-primary/70 text-xs font-label uppercase tracking-widest mt-1">{t('quick_view.summary')}</p>
              </div>
              <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-grow">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Left: Image & Metrics */}
                <div className="md:col-span-5 space-y-6">
                  <div className="aspect-square bg-black rounded-2xl relative overflow-hidden ghost-border shadow-inner border border-outline-variant/30">
                    {analysis.image && (
                      <img 
                        src={getMediaUrl(analysis.image.stored_path)} 
                        alt="Plate" 
                        className="w-full h-full object-contain"
                      />
                    )}
                    {/* AI Bounding Boxes */}
                    <div className="absolute inset-0 pointer-events-none">
                      {analysis.colonies?.map((colony: any, idx: number) => (
                        <div 
                          key={colony.id || idx}
                          className="absolute border border-[#00BFFF] bg-transparent opacity-60"
                          style={{
                            left: `${colony.position_x - (colony.bbox_width || 1.5) / 2}%`,
                            top: `${colony.position_y - (colony.bbox_height || 1.5) / 2}%`,
                            width: `${colony.bbox_width || 1.5}%`,
                            height: `${colony.bbox_height || 1.5}%`
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-surface-container rounded-xl p-4">
                      <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">{t('quick_view.colony_count')}</p>
                      <p className="text-2xl font-headline font-black text-primary">{analysis.final_colony_count ?? analysis.ai_colony_count}</p>
                    </div>
                    <div className="bg-surface-container rounded-xl p-4">
                      <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">{t('quick_view.concentration')}</p>
                      <p className="text-xl font-headline font-bold text-tertiary">
                        {analysis.calculated_cfu_ml ? (
                          <>
                            {formatScientific(analysis.calculated_cfu_ml).base} × 10<sup>{formatScientific(analysis.calculated_cfu_ml).exp}</sup>
                          </>
                        ) : '—'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right: Details & Species */}
                <div className="md:col-span-7 space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-headline font-bold text-lg text-on-surface border-b border-outline-variant pb-2">{t('quick_view.archived_params')}</h4>
                    <div className="grid grid-cols-2 gap-y-4">
                      <div>
                        <p className="text-[10px] uppercase text-on-surface-variant font-bold">{t('quick_view.operator')}</p>
                        <p className="text-sm font-medium">{analysis.operator_name || t('quick_view.system')}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-on-surface-variant font-bold">{t('quick_view.archived_at')}</p>
                        <p className="text-sm font-medium">{new Date(analysis.created_at).toLocaleDateString(i18n.language)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-on-surface-variant font-bold">{t('quick_view.dilution')}</p>
                        <p className="text-sm font-medium">10<sup>{getDilutionExponent(analysis.dilution_factor)}</sup></p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-on-surface-variant font-bold">{t('quick_view.volume')}</p>
                        <p className="text-sm font-medium">{analysis.volume_plated_ml} ml</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-headline font-bold text-lg text-on-surface border-b border-outline-variant pb-2">{t('quick_view.species_identified')}</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(analysis.colonies || {}).length > 0 ? (
                        Object.entries(
                          (analysis.colonies || []).reduce((acc: Record<string, number>, c: any) => {
                            const name = c.species_name || t('quick_view.unknown');
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
                        <p className="text-sm text-on-surface-variant italic">{t('quick_view.no_colonies')}</p>
                      )}
                    </div>
                  </div>

                  {analysis.notes && (
                    <div className="space-y-2">
                      <h4 className="font-headline font-bold text-sm text-on-surface-variant uppercase tracking-wider">{t('quick_view.archivist_notes')}</h4>
                      <div className="bg-surface-container-high/50 p-4 rounded-xl italic text-sm text-on-surface border-l-4 border-primary/30">
                        "{analysis.notes}"
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-surface-container-high p-6 flex justify-end gap-3">
              <button 
                onClick={onClose}
                className="px-6 py-3 rounded-xl font-label text-xs uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors"
              >
                {t('quick_view.close')}
              </button>
              {analysis.status === 'ai_complete' && (
                <button 
                  onClick={() => navigate(`/analysis/${id}`)}
                  className="bg-primary text-on-primary px-8 py-3 rounded-xl font-headline font-bold text-sm shadow-lg hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  {t('quick_view.verify_finalize')}
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="p-20 text-center">{t('quick_view.error')}</div>
        )}
      </div>
    </div>
  );
}
