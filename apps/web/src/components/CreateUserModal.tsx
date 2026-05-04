import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCreateUser } from '../hooks/useAdmin';
import type { AdminUserCreateRequest } from '../types';
import { useNotification } from '../context/NotificationContext';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  labManagers: { id: string, full_name: string }[];
}

export default function CreateUserModal({ isOpen, onClose, labManagers }: CreateUserModalProps) {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const createUser = useCreateUser();
  
  const [formData, setFormData] = useState<AdminUserCreateRequest>({
    email: '',
    full_name: '',
    password: '',
    role: 'researcher',
    organization_name: '',
    supervisor_id: undefined,
  });

  const [error, setError] = useState<string | null>(null);

  const validatePassword = (pass: string) => {
    if (pass.length < 8) return "Password must be at least 8 characters.";
    if (!/[A-Z]/.test(pass)) return "Must contain an uppercase letter.";
    if (!/[a-z]/.test(pass)) return "Must contain a lowercase letter.";
    if (!/\d/.test(pass)) return "Must contain a digit.";
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(pass)) return "Must contain a special character.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const passError = validatePassword(formData.password);
    if (passError) {
      setError(passError);
      return;
    }

    try {
      await createUser.mutateAsync(formData);
      showNotification('User account created successfully', 'success');
      onClose();
      setFormData({
        email: '',
        full_name: '',
        password: '',
        role: 'researcher',
        organization_name: '',
        supervisor_id: undefined,
      });
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to create user.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" onClick={onClose}></div>
      
      <div className="relative w-full max-w-xl bg-surface rounded-[2.5rem] shadow-2xl border border-outline-variant/10 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 md:p-10">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-black text-on-surface tracking-tight">Register New Account</h2>
            <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-surface-container-high flex items-center justify-center transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-error/10 border border-error/20 text-error text-sm font-bold flex items-center gap-3">
              <span className="material-symbols-outlined text-[20px]">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-outline ml-1">Full Name</label>
                <input
                  required
                  className="w-full bg-surface-container-low rounded-2xl px-5 py-3.5 border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none text-sm"
                  placeholder="Andi Perdana"
                  value={formData.full_name}
                  onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-outline ml-1">Email Address</label>
                <input
                  required
                  type="email"
                  className="w-full bg-surface-container-low rounded-2xl px-5 py-3.5 border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none text-sm"
                  placeholder="andi@lab.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-outline ml-1">Temporary Password</label>
              <div className="relative">
                <input
                  required
                  type="password"
                  className="w-full bg-surface-container-low rounded-2xl px-5 py-3.5 border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none text-sm"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                />
                <p className="mt-1.5 text-[10px] text-outline px-1">Must be 8+ characters with uppercase, number & symbol.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-outline ml-1">Account Role</label>
                <div className="relative">
                  <select
                    className="w-full bg-surface-container-low rounded-2xl px-5 py-3.5 border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none text-sm appearance-none"
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value, supervisor_id: e.target.value === 'lab_manager' ? undefined : formData.supervisor_id })}
                  >
                    <option value="researcher">Researcher / Analyst</option>
                    <option value="lab_manager">Lab Manager / Supervisor</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
                </div>
              </div>
              
              {formData.role === 'researcher' && (
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-outline ml-1">Assign Supervisor</label>
                  <div className="relative">
                    <select
                      className="w-full bg-surface-container-low rounded-2xl px-5 py-3.5 border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none text-sm appearance-none"
                      value={formData.supervisor_id || ''}
                      onChange={e => setFormData({ ...formData, supervisor_id: e.target.value || undefined })}
                    >
                      <option value="">No Supervisor (Unassigned)</option>
                      {labManagers.map(lm => (
                        <option key={lm.id} value={lm.id}>{lm.full_name}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={createUser.isPending}
                className="w-full py-4 rounded-2xl bg-[#5D4037] text-white font-bold text-lg hover:bg-[#4E342E] transition-all shadow-xl shadow-[#5D4037]/20 disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {createUser.isPending ? "Creating..." : "Create Account"}
                {!createUser.isPending && <span className="material-symbols-outlined text-[20px]">person_add</span>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
