import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useSettings, useUpdateProfile, useUploadAvatar, useUpdateSettings, useSystemIntegrity } from '../hooks/useSettings';
import { useExportAuditLog } from '../hooks/useReports';
import TopNav from '../components/TopNav';
import { getMediaUrl } from '../lib/axios';
import { useNotification } from '../context/NotificationContext';

export default function Settings() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const { data: settings } = useSettings(); 
  const { data: integrity } = useSystemIntegrity();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const updateSettings = useUpdateSettings();
  const exportAuditLog = useExportAuditLog();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [lab, setLab] = useState('');
  const [defaultVolume, setDefaultVolume] = useState<number>(1);
  const [defaultDilution, setDefaultDilution] = useState<number>(0);
  const [profileSaved, setProfileSaved] = useState(false);

  // Sync state with user data on load
  useEffect(() => {
    if (user) {
      setName(user.full_name || '');
      setLab(user.organization_name || '');
    }
  }, [user]);

  // Sync defaults with settings
  useEffect(() => {
    if (settings) {
      setDefaultVolume(settings.default_volume_ul / 1000);
      setDefaultDilution(settings.default_dilution_exp);
    }
  }, [settings]);

  const handleThemeChange = (theme: 'light' | 'dark') => {
    updateSettings.mutate({ theme }, {
      onSuccess: () => showNotification(t('settings.messages.settings_success'), 'success'),
      onError: () => showNotification(t('settings.messages.settings_error'), 'error')
    });
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const language = e.target.value as 'en' | 'id';
    updateSettings.mutate({ language }, {
      onSuccess: () => showNotification(t('settings.messages.settings_success'), 'success'),
      onError: () => showNotification(t('settings.messages.settings_error'), 'error')
    });
  };

  const handleSaveLabDefaults = async () => {
    try {
      await updateSettings.mutateAsync({
        default_volume_ul: defaultVolume * 1000,
        default_dilution_exp: defaultDilution
      });
      showNotification(t('settings.messages.settings_success'), 'success');
    } catch {
      showNotification(t('settings.messages.settings_error'), 'error');
    }
  };

  const handleAuditExport = () => {
    exportAuditLog.mutate(undefined, {
      onSuccess: () => showNotification(t('settings.messages.export_success'), 'success'),
      onError: () => showNotification(t('settings.messages.export_error'), 'error')
    });
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile.mutateAsync({ 
        full_name: name || undefined,
        organization_name: lab || undefined 
      });
      setProfileSaved(true);
      showNotification(t('settings.messages.profile_success'), 'success');
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || t('settings.messages.profile_error');
      showNotification(msg, 'error');
    }
  };

  const handleAvatarChange = async (file: File) => {
    try {
      await uploadAvatar.mutateAsync(file);
      showNotification(t('settings.messages.avatar_success'), 'success');
    } catch {
      showNotification(t('settings.messages.avatar_error'), 'error');
    }
  };
  return (
    <div className="bg-surface flex flex-col flex-grow w-full min-h-screen selection:bg-primary-container selection:text-on-primary-container">
      {/* TopNavBar */}
      <TopNav />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto min-h-screen relative">
        {/* Settings Content Area */}
        <div className="p-10 max-w-7xl mx-auto w-full">
          <header className="mb-12 mt-6">
            <h2 className="font-headline text-4xl font-bold text-on-surface tracking-tight mb-2">{t('settings.title')}</h2>
            <p className="font-body text-on-surface-variant text-lg max-w-2xl">{t('settings.subtitle')}</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Section 1: Researcher Profile Card */}
            <section className="lg:col-span-8 bg-surface-container-lowest rounded-[32px] p-10 shadow-ambient relative overflow-hidden group border border-outline-variant/10">
              {/* Animated background accent */}
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-[100px] group-hover:bg-primary/10 transition-all duration-1000 pointer-events-none"></div>
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-secondary/5 rounded-full blur-[80px] pointer-events-none"></div>

              <div className="flex flex-col md:flex-row gap-12 items-center md:items-start relative z-10">
                {/* Avatar Column */}
                <div className="flex-shrink-0 relative">
                  <div className="w-40 h-40 rounded-[28px] overflow-hidden border-2 border-surface-container-high shadow-lg relative group/avatar">
                    <input 
                      ref={avatarInputRef} 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarChange(f); }} 
                    />
                    {user?.avatar_url ? (
                      <img alt="Avatar" className="w-full h-full object-cover transition-transform duration-700 group-hover/avatar:scale-110" src={getMediaUrl(user.avatar_url)} />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                        <span className="font-headline text-5xl font-bold text-primary opacity-40">{user?.full_name?.charAt(0) || 'U'}</span>
                      </div>
                    )}
                    {/* Hover Overlay */}
                    <div 
                      onClick={() => avatarInputRef.current?.click()}
                      className="absolute inset-0 bg-primary/40 backdrop-blur-[2px] opacity-0 group-hover/avatar:opacity-100 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-white text-3xl mb-1">photo_camera</span>
                      <span className="text-[10px] text-white font-bold uppercase tracking-widest">{t('settings.profile.change_photo')}</span>
                    </div>
                  </div>
                  {/* Status Indicator */}
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-success rounded-full border-4 border-surface flex items-center justify-center shadow-lg">
                    <span className="material-symbols-outlined text-white text-[14px] icon-filled">verified</span>
                  </div>
                </div>

                {/* Form Column */}
                <div className="flex-1 w-full space-y-8">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                      <h3 className="font-headline text-2xl font-black text-on-surface tracking-tight uppercase">{t('settings.profile.title')}</h3>
                    </div>
                    <p className="text-sm text-on-surface-variant font-body">{t('settings.profile.subtitle')}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Name Input */}
                    <div className="space-y-2.5">
                      <label className="flex items-center gap-2 font-mono-tech text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-black">
                        <span className="material-symbols-outlined text-[14px]">person</span>
                        {t('settings.profile.full_name')}
                      </label>
                      <div className="relative group/field">
                        <input 
                          className="w-full bg-surface-container-low text-on-surface font-headline font-bold text-lg px-5 py-4 rounded-2xl border-2 border-transparent focus:border-primary/30 focus:bg-surface-container-lowest focus:shadow-sm focus:outline-none transition-all duration-300" 
                          type="text" 
                          placeholder={t('settings.profile.name_placeholder')}
                          value={name} 
                          onChange={(e) => setName(e.target.value)} 
                        />
                        <div className="absolute inset-x-5 bottom-0 h-0.5 bg-primary scale-x-0 group-focus-within/field:scale-x-100 transition-transform duration-500 rounded-full"></div>
                      </div>
                    </div>

                    {/* Lab Input */}
                    <div className="space-y-2.5">
                      <label className="flex items-center gap-2 font-mono-tech text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-black">
                        <span className="material-symbols-outlined text-[14px]">science</span>
                        {t('settings.profile.lab')}
                      </label>
                      <div className="relative group/field">
                        <input 
                          className="w-full bg-surface-container-low text-on-surface font-body font-semibold px-5 py-4 rounded-2xl border-2 border-transparent focus:border-primary/30 focus:bg-surface-container-lowest focus:shadow-sm focus:outline-none transition-all duration-300" 
                          type="text" 
                          placeholder={t('settings.profile.lab_placeholder')}
                          value={lab} 
                          onChange={(e) => setLab(e.target.value)} 
                        />
                        <div className="absolute inset-x-5 bottom-0 h-0.5 bg-primary scale-x-0 group-focus-within/field:scale-x-100 transition-transform duration-500 rounded-full"></div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Email (Read Only) */}
                    <div className="space-y-2.5">
                      <label className="flex items-center gap-2 font-mono-tech text-[10px] uppercase tracking-[0.2em] text-on-surface-variant/40 font-black">
                        <span className="material-symbols-outlined text-[14px]">alternate_email</span>
                        {t('settings.profile.email')}
                      </label>
                      <div className="relative">
                        <input 
                          className="w-full bg-surface-container-highest/20 text-on-surface-variant/40 font-body px-5 py-4 rounded-2xl border-2 border-dashed border-outline-variant/30 cursor-not-allowed italic" 
                          disabled 
                          type="email" 
                          value={user?.email || ''} 
                        />
                      </div>
                    </div>
                    
                    {/* Save Action */}
                    <div className="flex flex-col justify-end">
                      <button
                        onClick={handleSaveProfile}
                        disabled={updateProfile.isPending}
                        className="group/btn relative h-14 bg-on-surface rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-on-surface/10 disabled:opacity-50"
                      >
                        <div className="absolute inset-0 bg-primary opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative flex items-center justify-center gap-3 px-8">
                          {updateProfile.isPending ? (
                            <span className="material-symbols-outlined animate-spin text-surface">sync</span>
                          ) : (
                            <span className="material-symbols-outlined text-surface transition-transform group-hover/btn:scale-110">save_as</span>
                          )}
                          <span className="text-surface font-headline font-bold uppercase tracking-widest text-sm">
                            {updateProfile.isPending ? t('settings.profile.saving') : t('settings.profile.save')}
                          </span>
                        </div>
                      </button>
                      {profileSaved && (
                        <p className="text-[10px] text-success font-black uppercase tracking-widest text-center mt-3 animate-bounce">
                          {t('settings.profile.saved')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: AI Recognition Library */}
            <section className="lg:col-span-4 bg-surface-container-low rounded-2xl p-8 flex flex-col relative overflow-hidden group">
              <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all duration-700"></div>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-on-primary-container">
                  <span className="material-symbols-outlined">biotech</span>
                </div>
                <div>
                  <h3 className="font-headline text-xl font-bold text-on-surface leading-tight">{t('settings.defaults.title')}</h3>
                  <p className="text-[10px] text-on-surface-variant font-mono-tech uppercase tracking-widest">{t('settings.defaults.subtitle')}</p>
                </div>
              </div>

              <div className="bg-surface-container-highest/30 rounded-xl p-4 mb-6 border border-primary/10">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-mono-tech text-primary font-bold uppercase">{t('settings.defaults.model_info')}</span>
                  <span className="px-1.5 py-0.5 rounded bg-primary text-[9px] text-on-primary font-bold uppercase tracking-tighter">{t('settings.defaults.ready')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-primary">verified</span>
                  <span className="text-xs font-body text-on-surface">{t('settings.defaults.classes')}</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[180px] custom-scrollbar pr-2 space-y-1 mb-6">
                {[
                  'Actinobacillus equuli', 'Aeromonas hydrophila', 'Bacillus cereus', 
                  'Bordetella bronchiseptica', 'Clostridium perfringens', 'Enterococcus faecalis',
                  'Escherichia coli', 'Klebsiella pneumoniae', 'Pseudomonas aeruginosa',
                  'Staphylococcus aureus', 'Staphylococcus epidermidis', 'Streptococcus suis',
                  'Salmonella spp.', 'Pasteurella multocida', 'Listeria monocytogenes'
                ].map((species, i) => (
                  <div key={i} className="flex items-center gap-3 py-1.5 px-3 rounded-lg hover:bg-surface-container transition-colors">
                    <span className="w-1 h-1 rounded-full bg-primary/40"></span>
                    <span className="text-xs font-body italic text-on-surface-variant">{species}</span>
                  </div>
                ))}
                <div className="text-[10px] text-on-surface-variant italic pt-2 opacity-50 px-3">{t('settings.defaults.additional_classes')}</div>
              </div>

              <div className="pt-4 border-t border-outline-variant/20">
                <label className="block font-mono-tech text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-3">{t('settings.defaults.agar')}</label>
                <div className="flex flex-wrap gap-2 mb-8">
                  {['TSA', 'MacConkey', 'Blood Agar', 'SDA'].map(agar => (
                    <span key={agar} className="px-3 py-1.5 rounded-full bg-surface-container text-[10px] font-bold text-on-surface-variant ghost-border">{agar}</span>
                  ))}
                </div>

                <div className="space-y-6 pt-6 border-t border-outline-variant/10">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="material-symbols-outlined text-primary text-lg">tune</span>
                    <h4 className="font-headline font-bold text-on-surface text-sm uppercase tracking-wider">{t('settings.defaults.lab_config_title')}</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono-tech uppercase tracking-widest text-on-surface-variant">{t('settings.defaults.volume_label')}</label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={defaultVolume}
                        onChange={(e) => setDefaultVolume(parseFloat(e.target.value))}
                        className="w-full bg-surface-container-highest/20 border border-outline-variant/20 rounded-xl px-4 py-2.5 text-sm font-body text-on-surface focus:border-primary/40 focus:outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono-tech uppercase tracking-widest text-on-surface-variant">{t('settings.defaults.dilution_label')}</label>
                      <input 
                        type="number" 
                        value={defaultDilution}
                        onChange={(e) => setDefaultDilution(parseInt(e.target.value))}
                        className="w-full bg-surface-container-highest/20 border border-outline-variant/20 rounded-xl px-4 py-2.5 text-sm font-body text-on-surface focus:border-primary/40 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={handleSaveLabDefaults}
                    disabled={updateSettings.isPending}
                    className="w-full mt-2 py-3 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl font-headline font-bold text-[10px] uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    {updateSettings.isPending ? (
                      <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                    ) : (
                      <span className="material-symbols-outlined text-sm">save</span>
                    )}
                    {t('settings.defaults.save_btn')}
                  </button>
                </div>
              </div>
            </section>

            {/* Section 3: System Aesthetics (Appearance) */}
            <section className="lg:col-span-5 bg-surface-container-low rounded-[32px] p-10 shadow-sm relative overflow-hidden group border border-outline-variant/10">
              {/* Subtle accent */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-secondary/5 rounded-full blur-[60px] pointer-events-none"></div>

              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-2xl bg-secondary-container flex items-center justify-center text-secondary shadow-inner">
                  <span className="material-symbols-outlined text-2xl">palette</span>
                </div>
                <div>
                  <h3 className="font-headline text-xl font-bold text-on-surface uppercase tracking-tight">{t('settings.appearance.title')}</h3>
                  <p className="text-[10px] text-on-surface-variant font-mono-tech uppercase tracking-widest">{t('settings.appearance.interface_customization')}</p>
                </div>
              </div>

              <div className="space-y-10">
                {/* Theme Selection */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-headline font-bold text-on-surface">{t('settings.appearance.theme_title')}</h4>
                      <p className="font-body text-xs text-on-surface-variant">{t('settings.appearance.theme_desc')}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 p-1.5 bg-surface-container-high rounded-2xl border border-outline-variant/10">
                    <button 
                      onClick={() => handleThemeChange('light')}
                      className={`relative flex items-center justify-center gap-3 py-4 rounded-xl font-headline font-bold text-sm transition-all duration-300 ${settings?.theme !== 'dark' ? 'bg-surface text-on-surface shadow-md' : 'text-on-surface-variant hover:bg-surface/50 hover:text-on-surface'}`}
                    >
                      <span className={`material-symbols-outlined text-lg ${settings?.theme !== 'dark' ? 'icon-filled text-primary' : ''}`}>light_mode</span>
                      {t('settings.appearance.light')}
                      {settings?.theme !== 'dark' && <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-primary"></span>}
                    </button>
                    <button 
                      onClick={() => handleThemeChange('dark')}
                      className={`relative flex items-center justify-center gap-3 py-4 rounded-xl font-headline font-bold text-sm transition-all duration-300 ${settings?.theme === 'dark' ? 'bg-surface text-on-surface shadow-md' : 'text-on-surface-variant hover:bg-surface/50 hover:text-on-surface'}`}
                    >
                      <span className={`material-symbols-outlined text-lg ${settings?.theme === 'dark' ? 'icon-filled text-primary' : ''}`}>dark_mode</span>
                      {t('settings.appearance.dark')}
                      {settings?.theme === 'dark' && <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-primary"></span>}
                    </button>
                  </div>
                </div>

                <div className="w-full h-px bg-gradient-to-r from-transparent via-outline-variant/20 to-transparent"></div>

                {/* Language Selection */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-headline font-bold text-on-surface">{t('settings.appearance.lang_title')}</h4>
                      <p className="font-body text-xs text-on-surface-variant">{t('settings.appearance.lang_desc')}</p>
                    </div>
                  </div>
                  
                  <div className="relative group/lang">
                    <select 
                      className="w-full bg-surface-container-low text-on-surface font-body font-bold px-5 py-4 rounded-2xl border-2 border-transparent group-hover/lang:border-outline-variant/30 focus:border-primary/30 focus:bg-surface-container-lowest focus:shadow-sm focus:outline-none transition-all duration-300 appearance-none cursor-pointer" 
                      value={settings?.language || 'en'}
                      onChange={handleLanguageChange}
                    >
                      <option value="en">English (US)</option>
                      <option value="id">Bahasa Indonesia (ID)</option>
                    </select>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
                      <span className="material-symbols-outlined text-lg">unfold_more</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4: Quality Control & Data Integrity */}
            <section className="lg:col-span-7 bg-surface-container-lowest rounded-2xl p-8 shadow-ambient border border-outline-variant/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <span className="material-symbols-outlined text-8xl text-primary">verified_user</span>
              </div>

              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-tertiary-container/30 flex items-center justify-center text-tertiary">
                  <span className="material-symbols-outlined">security</span>
                </div>
                <h3 className="font-headline text-xl font-bold text-on-surface">{t('settings.storage.title')}</h3>
              </div>

              <div className="space-y-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/20">
                    <span className="font-mono-tech text-[10px] text-tertiary uppercase font-bold tracking-widest block mb-1">{t('settings.storage.health')}</span>
                    <span className="font-headline text-2xl font-bold text-on-surface">{integrity?.system_health || 99.8}%</span>
                  </div>
                  <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/20">
                    <span className="font-mono-tech text-[10px] text-primary uppercase font-bold tracking-widest block mb-1">{t('settings.storage.integrity')}</span>
                    <span className="font-headline text-2xl font-bold text-on-surface">{integrity?.integrity_score || 0}%</span>
                  </div>
                  <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/20">
                    <span className="font-mono-tech text-[10px] text-secondary uppercase font-bold tracking-widest block mb-1">{t('settings.storage.audit_status')}</span>
                    <span className="font-headline text-2xl font-bold text-on-surface">{integrity?.audit_status || t('settings.storage.current')}</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="font-mono-tech text-xs uppercase tracking-wider text-on-surface-variant font-bold">{t('settings.storage.validation_progress')}</span>
                    <span className="font-body text-sm text-on-surface font-semibold">{integrity?.verified_records}/{integrity?.total_records}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden">
                    <div className="h-full bg-tertiary rounded-full transition-all duration-1000" style={{ width: `${integrity?.integrity_score || 0}%` }}></div>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-2 font-mono-tech italic">{t('settings.storage.archived_desc')}</p>
                </div>
                
                <div className="mt-8">
                  <div 
                    onClick={handleAuditExport}
                    className="p-8 rounded-2xl bg-surface border border-outline-variant/20 hover:border-primary/30 transition-all group cursor-pointer shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                          <span className="material-symbols-outlined text-2xl">{exportAuditLog.isPending ? 'sync' : 'history_edu'}</span>
                        </div>
                        <div>
                          <h4 className="font-headline font-bold text-on-surface text-lg">{t('settings.storage.export_audit_title')}</h4>
                          <p className="text-xs text-on-surface-variant leading-relaxed">{t('settings.storage.export_audit_desc')}</p>
                        </div>
                      </div>
                      <button className="bg-primary/10 text-primary px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition-all flex items-center gap-2">
                        {exportAuditLog.isPending ? t('settings.storage.exporting') : t('settings.storage.download_csv')}
                        <span className="material-symbols-outlined text-sm">download</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <footer className="mt-16 text-center pb-8">
            <p className="font-mono-tech text-xs text-on-surface-variant opacity-60 uppercase tracking-widest">{t('settings.footer')} v2.4.1 • Build 8910</p>
          </footer>
        </div>
      </main>
    </div>
  );
}
