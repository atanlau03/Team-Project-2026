import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Landing() {
  const { t } = useTranslation();

  return (
    <div className="bg-surface text-on-surface font-body antialiased selection:bg-primary-container selection:text-on-primary-container min-h-screen flex flex-col">
      {/* TopNavBar Component */}
      <nav className="fixed top-0 w-full z-50 bg-stone-50/80 dark:bg-stone-950/80 backdrop-blur-xl shadow-2xl shadow-stone-900/5 transition-all duration-300">
        <div className="flex justify-between items-center max-w-7xl mx-auto px-8 h-20">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>biotech</span>
            <span className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-50 font-headline">PlateSense</span>
          </div>

          {/* Navigation Links (Web) */}
          <div className="hidden md:flex space-x-8 items-center h-full">
            <a className="text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-all duration-300 font-body text-sm hover:bg-stone-200/50 dark:hover:bg-stone-800/50 px-3 py-2 rounded-lg backdrop-blur-sm" href="#features">{t('landing.nav.features')}</a>
            <a className="text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-all duration-300 font-body text-sm hover:bg-stone-200/50 dark:hover:bg-stone-800/50 px-3 py-2 rounded-lg backdrop-blur-sm" href="#solutions">{t('landing.nav.solutions')}</a>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Link className="btn-primary px-6 py-2.5 font-body text-sm font-semibold" to="/login">{t('landing.nav.login')}</Link>
          </div>
        </div>
      </nav>

      <main className="pt-28 pb-20 flex-grow">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-8 pt-16 pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            {/* Hero Content */}
            <div className="lg:col-span-6 space-y-8 pr-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-low border border-outline-variant/20">
                <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                <span className="data-label text-xs font-semibold text-tertiary uppercase tracking-wider">{t('landing.hero.tag')}</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-extrabold text-on-surface leading-tight tracking-tight">
                {t('landing.hero.title').split(' ').slice(0, 3).join(' ')} <br />
                <span className="text-primary">{t('landing.hero.title').split(' ').slice(3).join(' ')}</span>
              </h1>
              <p className="text-lg lg:text-xl text-on-surface-variant font-body leading-relaxed max-w-xl">
                {t('landing.hero.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link className="btn-primary px-8 py-4 text-center font-body font-semibold text-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform duration-300 shadow-lg shadow-primary/20" to="/login">
                  {t('landing.hero.cta_deploy')}
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>
            </div>

            {/* Hero Image / Visual */}
            <div className="lg:col-span-6 relative">
              {/* Decorative background element */}
              <div className="absolute inset-0 bg-surface-container-low rounded-[2rem] transform translate-x-4 translate-y-4 -z-10"></div>

              {/* Main visual container */}
              <div className="relative layer-lowest rounded-[2rem] p-4 ambient-shadow overflow-hidden">
                <img alt="Laboratory petri dish scanning interface" className="w-full h-auto rounded-xl object-cover" data-alt="Macro close-up of an illuminated agar petri dish in a high-tech laboratory setting, warm lighting contrasting with precise industrial scanning lasers" src="/hero.jpg" />

                {/* Floating Data Card */}
                <div className="absolute bottom-8 right-8 glass-panel p-5 w-64 shadow-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-body text-xs text-on-surface-variant font-semibold">{t('landing.hero.scan_complete')}</span>
                    <span className="material-symbols-outlined text-tertiary text-sm">check_circle</span>
                  </div>
                  <div className="space-y-1">
                    <p className="data-label text-sm text-on-surface-variant">Colony Count (CFU)</p>
                    <p className="font-headline text-3xl font-bold text-on-surface tracking-tight">1,482</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-outline-variant/20 flex justify-between items-center">
                    <span className="data-label text-xs text-on-surface-variant">{t('landing.hero.confidence')}</span>
                    <span className="data-label text-xs font-bold text-tertiary">99.4%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Key Value Props (Bento Grid Redesign) */}
        <section id="features" className="py-32 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-surface-container-low/30 -z-10"></div>
          <div className="max-w-7xl mx-auto px-8 relative z-10">
            <div className="mb-20 text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full mb-6 ring-1 ring-primary/20 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                <span className="font-label text-[10px] uppercase font-bold text-primary tracking-widest">Capabilities</span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-black text-on-surface mb-6 tracking-tight">{t('landing.features.title')}</h2>
              <p className="font-body text-on-surface-variant text-lg leading-relaxed">{t('landing.features.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Feature 1: AI Accuracy - Large Card */}
              <div className="md:col-span-7 layer-lowest p-10 rounded-[2.5rem] ambient-shadow group hover:shadow-2xl transition-all duration-700 hover:-translate-y-2 border border-outline-variant/10 relative overflow-hidden">
                <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-primary/5 rounded-full blur-[80px] group-hover:bg-primary/10 transition-colors duration-700"></div>
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-8 group-hover:bg-primary group-hover:text-on-primary transition-all duration-500">
                    <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
                  </div>
                  <h3 className="text-2xl font-bold text-on-surface mb-4">{t('landing.features.accuracy_title')}</h3>
                  <p className="font-body text-on-surface-variant text-base leading-relaxed max-w-md">{t('landing.features.accuracy_desc')}</p>
                </div>
              </div>

              {/* Feature 2: Speed - Square Card */}
              <div className="md:col-span-5 layer-lowest p-10 rounded-[2.5rem] ambient-shadow group hover:shadow-2xl transition-all duration-700 hover:-translate-y-2 border border-outline-variant/10 bg-gradient-to-br from-surface to-surface-container-low">
                <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mb-8 group-hover:bg-secondary group-hover:text-on-secondary transition-all duration-500">
                  <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>timer</span>
                </div>
                <h3 className="text-2xl font-bold text-on-surface mb-4">{t('landing.features.speed_title')}</h3>
                <p className="font-body text-on-surface-variant text-base leading-relaxed">{t('landing.features.speed_desc')}</p>
              </div>

              {/* Feature 3: Battle Mode - Small Card */}
              <div className="md:col-span-4 layer-lowest p-10 rounded-[2.5rem] ambient-shadow group hover:shadow-2xl transition-all duration-700 hover:-translate-y-2 border border-outline-variant/10">
                <div className="w-14 h-14 rounded-xl bg-tertiary/10 flex items-center justify-center mb-8 group-hover:bg-tertiary group-hover:text-on-tertiary transition-all duration-500">
                  <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>sports_esports</span>
                </div>
                <h3 className="text-xl font-bold text-on-surface mb-3">{t('landing.features.battle_mode_title')}</h3>
                <p className="font-body text-on-surface-variant text-sm leading-relaxed">{t('landing.features.battle_mode_desc')}</p>
              </div>

              {/* Feature 4: Human-in-the-Loop - Small Card */}
              <div className="md:col-span-4 layer-lowest p-10 rounded-[2.5rem] ambient-shadow group hover:shadow-2xl transition-all duration-700 hover:-translate-y-2 border border-outline-variant/10">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-8 group-hover:bg-primary group-hover:text-on-primary transition-all duration-500">
                  <span className="material-symbols-outlined text-3xl">psychology</span>
                </div>
                <h3 className="text-xl font-bold text-on-surface mb-3">{t('landing.features.human_loop_title')}</h3>
                <p className="font-body text-on-surface-variant text-sm leading-relaxed">{t('landing.features.human_loop_desc')}</p>
              </div>

              {/* Feature 5: Explainable AI - Small Card */}
              <div className="md:col-span-4 layer-lowest p-10 rounded-[2.5rem] ambient-shadow group hover:shadow-2xl transition-all duration-700 hover:-translate-y-2 border border-outline-variant/10">
                <div className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center mb-8 group-hover:bg-secondary group-hover:text-on-secondary transition-all duration-500">
                  <span className="material-symbols-outlined text-3xl">visibility</span>
                </div>
                <h3 className="text-xl font-bold text-on-surface mb-3">{t('landing.features.explainable_title')}</h3>
                <p className="font-body text-on-surface-variant text-sm leading-relaxed">{t('landing.features.explainable_desc')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Analysis Workflow Section (Steps) */}
        <section id="solutions" className="py-32 bg-stone-50 dark:bg-stone-950 transition-colors">
          <div className="max-w-7xl mx-auto px-8">
            <div className="mb-20 text-center">
              <h2 className="text-4xl lg:text-5xl font-black text-on-surface mb-6 tracking-tight">{t('landing.workflow.title')}</h2>
              <p className="font-body text-on-surface-variant text-lg">{t('landing.workflow.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative">
              {/* Connecting Line (Desktop) */}
              <div className="hidden lg:block absolute top-24 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-outline-variant/30 to-transparent -z-10"></div>

              {/* Step 1 */}
              <div className="flex flex-col items-center text-center group">
                <div className="w-20 h-20 rounded-full bg-surface-container-high border-4 border-surface flex items-center justify-center mb-8 shadow-xl group-hover:scale-110 group-hover:border-primary transition-all duration-500 relative">
                  <span className="text-3xl font-black text-primary">1</span>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg">
                    <span className="material-symbols-outlined text-on-primary text-sm">upload</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-on-surface mb-4">{t('landing.workflow.step1_title')}</h3>
                <p className="font-body text-on-surface-variant leading-relaxed px-4">{t('landing.workflow.step1_desc')}</p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center group">
                <div className="w-20 h-20 rounded-full bg-surface-container-high border-4 border-surface flex items-center justify-center mb-8 shadow-xl group-hover:scale-110 group-hover:border-primary transition-all duration-500 relative">
                  <span className="text-3xl font-black text-primary">2</span>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg">
                    <span className="material-symbols-outlined text-on-primary text-sm">psychology</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-on-surface mb-4">{t('landing.workflow.step2_title')}</h3>
                <p className="font-body text-on-surface-variant leading-relaxed px-4">{t('landing.workflow.step2_desc')}</p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center group">
                <div className="w-20 h-20 rounded-full bg-surface-container-high border-4 border-surface flex items-center justify-center mb-8 shadow-xl group-hover:scale-110 group-hover:border-primary transition-all duration-500 relative">
                  <span className="text-3xl font-black text-primary">3</span>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg">
                    <span className="material-symbols-outlined text-on-primary text-sm">verified_user</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-on-surface mb-4">{t('landing.workflow.step3_title')}</h3>
                <p className="font-body text-on-surface-variant leading-relaxed px-4">{t('landing.workflow.step3_desc')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-5xl mx-auto px-8 mt-32 mb-20">
          <div className="layer-lowest rounded-[2rem] p-12 lg:p-16 ambient-shadow text-center relative overflow-hidden">
            {/* Subtle background radial gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-surface-container-low to-transparent opacity-50 pointer-events-none"></div>
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-3xl lg:text-4xl font-extrabold text-on-surface mb-6">{t('landing.cta.title')}</h2>
              <p className="font-body text-on-surface-variant text-lg mb-10">{t('landing.cta.subtitle')}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link className="btn-primary px-8 py-4 font-body font-semibold text-lg hover:scale-[1.02] active:scale-[0.98] transition-transform duration-300 shadow-lg shadow-primary/20" to="/login">
                  {t('landing.cta.get_started')}
                </Link>
              </div>
              <p className="mt-6 data-label text-xs text-on-surface-variant">{t('landing.cta.footer')}</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Shared Component */}
      <footer className="w-full py-12 px-8 bg-stone-100 dark:bg-stone-900 transition-colors">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Brand & Copyright */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>biotech</span>
              <span className="text-lg font-bold text-stone-800 dark:text-stone-200 font-headline">PlateSense</span>
            </div>
            <p className="text-stone-600 dark:text-stone-400 font-body text-sm">
              {t('landing.footer.copyright')}
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col md:items-end justify-center space-y-2">
            <nav className="flex flex-wrap gap-x-6 gap-y-2">
              <a className="text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors font-label text-[12px] uppercase tracking-wider" href="#">{t('landing.footer.privacy')}</a>
              <a className="text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors font-label text-[12px] uppercase tracking-wider" href="#">{t('landing.footer.terms')}</a>
              <a className="text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors font-label text-[12px] uppercase tracking-wider" href="#">{t('landing.footer.iso')}</a>
              <a className="text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors font-label text-[12px] uppercase tracking-wider" href="#">{t('landing.footer.support')}</a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
