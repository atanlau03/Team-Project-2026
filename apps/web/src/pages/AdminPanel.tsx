import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import TopNav from '../components/TopNav';
import { 
  useAdminUsers, 
  useAdminStats, 
  useUpdateUserRole, 
  useUpdateUserStatus,
  useDeleteUser,
  useAssignSupervisor 
} from '../hooks/useAdmin';
import { getMediaUrl } from '../lib/axios';
import type { AdminUserListItem } from '../types';
import CreateUserModal from '../components/CreateUserModal';
import { useNotification } from '../context/NotificationContext';

export default function AdminPanel() {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const { data: users, isLoading } = useAdminUsers({
    search: debouncedSearch || undefined,
    role: roleFilter,
    page,
    page_size: 10,
  });
  const { data: stats } = useAdminStats();
  const updateRole = useUpdateUserRole();
  const updateStatus = useUpdateUserStatus();
  const deleteUser = useDeleteUser();
  const assignSupervisor = useAssignSupervisor();

  // Helper to find all lab managers for supervisor selection
  const { data: allLabManagersResp } = useAdminUsers({ role: 'lab_manager', page_size: 100 });
  const labManagers = allLabManagersResp?.items || [];

  const handleRoleChange = (userId: string, newRole: string) => {
    updateRole.mutate({ userId, role: newRole }, {
      onSuccess: () => showNotification('User role updated successfully', 'success'),
      onError: () => showNotification('Failed to update user role', 'error')
    });
  };

  const handleStatusToggle = (user: AdminUserListItem) => {
    updateStatus.mutate({ userId: user.id, is_active: !user.is_active }, {
      onSuccess: () => showNotification(`User ${!user.is_active ? 'activated' : 'deactivated'} successfully`, 'success'),
      onError: () => showNotification('Failed to update user status', 'error')
    });
  };

  const handleDelete = (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      deleteUser.mutate(userId, {
        onSuccess: () => showNotification('User deleted successfully', 'success'),
        onError: () => showNotification('Failed to delete user', 'error')
      });
    }
  };

  const handleSupervisorChange = (userId: string, supervisorId: string) => {
    assignSupervisor.mutate({ userId, supervisorId: supervisorId || null }, {
      onSuccess: () => showNotification('Supervisor assigned successfully', 'success'),
      onError: () => showNotification('Failed to assign supervisor', 'error')
    });
  };

  return (
    <div className="bg-surface flex flex-col flex-grow w-full min-h-screen selection:bg-primary-container selection:text-on-primary-container overflow-x-hidden">
      <TopNav />

      <main className="flex-1 w-full max-w-[1600px] mx-auto min-h-screen relative py-12 px-6 md:px-12">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -z-10 pointer-events-none translate-x-1/2 -translate-y-1/4 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-tertiary/5 rounded-full blur-[100px] -z-10 pointer-events-none -translate-x-1/4 translate-y-1/4"></div>

        <div className="max-w-7xl mx-auto w-full">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-16">
            {[
              { label: "Total Users", value: stats?.total_users ?? 0, icon: 'groups', color: 'primary' },
              { label: "Analysts", value: stats?.total_researchers ?? 0, icon: 'biotech', color: 'secondary' },
              { label: "Managers", value: stats?.total_lab_managers ?? 0, icon: 'supervisor_account', color: 'tertiary' },
              { label: "Admins", value: stats?.total_admins ?? 0, icon: 'admin_panel_settings', color: 'primary' },
              { label: "Analyses", value: stats?.total_analyses ?? 0, icon: 'analytics', color: 'secondary' },
              { label: "Verified", value: stats?.total_finalized ?? 0, icon: 'verified', color: 'success' },
              { label: "Labs", value: stats?.total_organizations ?? 0, icon: 'hub', color: 'primary' },
            ].map((stat, idx) => (
              <div
                key={stat.label}
                className="bg-surface-container-lowest rounded-[1.5rem] p-5 shadow-sm border border-outline-variant/10 group hover:shadow-md transition-all duration-300"
              >
                <div className={`w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <span className={`material-symbols-outlined text-primary text-xl`}>{stat.icon}</span>
                </div>
                <div className="space-y-0.5">
                  <p className="font-headline text-2xl font-black text-on-surface tracking-tighter">{stat.value.toLocaleString()}</p>
                  <p className="font-label text-[9px] text-outline uppercase tracking-widest font-bold">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* User Management Section */}
          <section className="bg-surface-container-lowest rounded-[2.5rem] p-8 md:p-10 shadow-[0_32px_64px_-24px_rgba(29,27,24,0.06)] border border-outline-variant/10 relative overflow-hidden">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/2 rounded-full blur-[100px] pointer-events-none"></div>

            {/* Controls Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12 relative z-10">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="btn-primary px-8 py-4 flex items-center gap-3 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all"
              >
                <span className="material-symbols-outlined">person_add</span>
                <span className="font-bold">Register New User</span>
              </button>

              <div className="flex flex-wrap items-center gap-4">
                {/* Modern Search */}
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl group-focus-within:text-primary transition-colors">search</span>
                  <input
                    className="bg-surface-container-low text-on-surface font-body pl-12 pr-6 py-3.5 rounded-2xl border-2 border-transparent focus:border-primary/20 focus:bg-white focus:outline-none transition-all w-full md:w-80 text-sm shadow-inner"
                    placeholder="Search users by name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                {/* Styled Select */}
                <div className="relative">
                  <select
                    className="bg-surface-container-low text-on-surface font-body pl-6 pr-12 py-3.5 rounded-2xl border-2 border-transparent focus:border-primary/20 focus:bg-white focus:outline-none transition-all text-sm appearance-none cursor-pointer shadow-inner min-w-[160px]"
                    value={roleFilter || ''}
                    onChange={(e) => { setRoleFilter(e.target.value || undefined); setPage(1); }}
                  >
                    <option value="">All Roles</option>
                    <option value="researcher">Analysts</option>
                    <option value="lab_manager">Managers</option>
                    <option value="admin">Admins</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
                </div>
              </div>
            </div>

            {/* Table */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 border-4 border-primary/10 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
                </div>
                <p className="font-label text-sm text-outline animate-pulse">Syncing Directory...</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-2">
                <table className="w-full border-separate border-spacing-y-3">
                  <thead>
                    <tr>
                      <th className="text-left font-mono-tech text-[10px] uppercase tracking-widest text-outline font-black py-4 px-6">User Identity</th>
                      <th className="text-left font-mono-tech text-[10px] uppercase tracking-widest text-outline font-black py-4 px-6">Affiliation / Supervisor</th>
                      <th className="text-center font-mono-tech text-[10px] uppercase tracking-widest text-outline font-black py-4 px-6">Access Level</th>
                      <th className="text-center font-mono-tech text-[10px] uppercase tracking-widest text-outline font-black py-4 px-6">Account Status</th>
                      <th className="text-right font-mono-tech text-[10px] uppercase tracking-widest text-outline font-black py-4 px-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users?.items.map((user) => (
                      <tr key={user.id} className="group/row">
                        {/* User Info */}
                        <td className="py-4 px-6 bg-surface-container-low/30 first:rounded-l-[1.5rem] group-hover/row:bg-surface-container-low transition-colors duration-300">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white overflow-hidden shadow-sm ring-1 ring-outline-variant/10 group-hover/row:ring-primary/20 transition-all">
                              <div className="w-full h-full flex items-center justify-center bg-primary-container text-primary font-black text-lg">
                                {user.full_name.charAt(0)}
                              </div>
                            </div>
                            <div className="min-w-0">
                              <p className="font-headline font-bold text-on-surface text-base truncate">{user.full_name}</p>
                              <p className="font-body text-xs text-on-surface-variant truncate">{user.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Org / Supervisor */}
                        <td className="py-4 px-6 bg-surface-container-low/30 group-hover/row:bg-surface-container-low transition-colors duration-300">
                          <div className="flex flex-col gap-1">
                            <span className="font-body font-bold text-sm text-on-surface">{user.organization_name || "Private Sector"}</span>
                            
                            {user.role === 'researcher' ? (
                              <div className="relative mt-1">
                                <select
                                  className="bg-white/50 border border-outline-variant/20 rounded-lg px-2 py-1 text-[10px] font-bold text-primary outline-none focus:border-primary/40 appearance-none pr-6 max-w-[150px]"
                                  value={user.supervisor_id || ''}
                                  onChange={(e) => handleSupervisorChange(user.id, e.target.value)}
                                >
                                  <option value="">No Supervisor</option>
                                  {labManagers.map(lm => (
                                    <option key={lm.id} value={lm.id}>Manager: {lm.full_name}</option>
                                  ))}
                                </select>
                                <span className="material-symbols-outlined absolute right-1 top-1/2 -translate-y-1/2 text-[12px] pointer-events-none opacity-50">expand_more</span>
                              </div>
                            ) : (
                              <span className="font-label text-[10px] text-outline uppercase tracking-tight">Joined {new Date(user.created_at).toLocaleDateString()}</span>
                            )}
                          </div>
                        </td>

                        {/* Role */}
                        <td className="py-4 px-6 bg-surface-container-low/30 text-center group-hover/row:bg-surface-container-low transition-colors duration-300">
                          <div className="relative inline-block">
                            <select
                              className={`appearance-none inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm outline-none cursor-pointer pr-8 ${user.role === 'admin'
                                ? 'bg-primary text-on-primary'
                                : user.role === 'lab_manager'
                                  ? 'bg-tertiary text-on-tertiary'
                                  : 'bg-surface-container-high text-on-surface-variant ring-1 ring-outline-variant/10'
                              }`}
                              value={user.role}
                              onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            >
                              <option value="researcher">Analyst</option>
                              <option value="lab_manager">Manager</option>
                              <option value="admin">Admin</option>
                            </select>
                            <span className={`material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[14px] pointer-events-none ${user.role === 'admin' ? 'text-on-primary' : user.role === 'lab_manager' ? 'text-on-tertiary' : 'text-on-surface-variant'}`}>expand_more</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-6 bg-surface-container-low/30 text-center group-hover/row:bg-surface-container-low transition-colors duration-300">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${user.is_active
                              ? 'bg-success/10 text-success'
                              : 'bg-error/10 text-error'
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full bg-current ${user.is_active ? 'animate-pulse' : ''}`}></span>
                            {user.is_active ? "Active" : "Revoked"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 bg-surface-container-low/30 last:rounded-r-[1.5rem] text-right group-hover/row:bg-surface-container-low transition-colors duration-300">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleStatusToggle(user)}
                              disabled={updateStatus.isPending}
                              className={`p-2 rounded-xl border-2 transition-all duration-300 ${user.is_active
                                  ? 'border-transparent bg-surface-container-high text-on-surface-variant hover:bg-error/10 hover:text-error'
                                  : 'border-transparent bg-success/10 text-success hover:bg-success/20'
                                }`}
                              title={user.is_active ? "Deactivate" : "Activate"}
                            >
                              <span className="material-symbols-outlined text-lg">
                                {user.is_active ? 'block' : 'check_circle'}
                              </span>
                            </button>
                            
                            <button
                              onClick={() => handleDelete(user.id)}
                              disabled={deleteUser.isPending}
                              className="p-2 rounded-xl bg-surface-container-high text-on-surface-variant hover:bg-error/10 hover:text-error transition-all"
                              title="Delete User"
                            >
                              <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Pagination remains same... */}
            {users && users.total_pages > 1 && (
              <div className="flex flex-col md:flex-row items-center justify-between mt-10 px-4 gap-6">
                <p className="font-label text-xs text-outline uppercase tracking-widest font-bold">
                  Viewing page <span className="text-on-surface">{users.page}</span> of <span className="text-on-surface">{users.total_pages}</span>
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high transition-all disabled:opacity-20 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-lg">chevron_left</span>
                    Prev
                  </button>
                  <button
                    onClick={() => setPage(Math.min(users.total_pages, page + 1))}
                    disabled={page === users.total_pages}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold bg-primary text-on-primary shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-20"
                  >
                    Next
                    <span className="material-symbols-outlined text-lg">chevron_right</span>
                  </button>
                </div>
              </div>
            )}
          </section>

          <CreateUserModal 
            isOpen={isCreateModalOpen} 
            onClose={() => setIsCreateModalOpen(false)} 
            labManagers={labManagers}
          />

          <footer className="mt-24 text-center pb-12">
            <div className="inline-flex flex-col items-center gap-4">
              <div className="w-12 h-[1px] bg-outline-variant/30"></div>
              <p className="font-mono-tech text-[10px] text-on-surface-variant opacity-40 uppercase tracking-[0.3em]">
                PlateSense Security Orchestration Core v2.4.5
              </p>
              <p className="font-label text-[9px] text-outline">{t('panel.footer')}</p>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
