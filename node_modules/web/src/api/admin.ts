import apiClient from '../lib/axios';

export interface AdminUserItem {
  id: string;
  email: string;
  full_name: string;
  role: string;
  organization_name: string | null;
  is_active: boolean;
  avatar_url?: string | null;
  created_at: string;
}

export interface PaginatedAdminUsers {
  items: AdminUserItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface AdminSystemStats {
  total_users: number;
  total_researchers: number;
  total_admins: number;
  total_analyses: number;
  total_finalized: number;
  total_organizations: number;
}

export async function listUsers(params?: {
  search?: string;
  role?: string;
  page?: number;
  page_size?: number;
}): Promise<PaginatedAdminUsers> {
  const { data } = await apiClient.get<PaginatedAdminUsers>('/admin/users', { params });
  return data;
}

export async function updateUserRole(userId: string, role: string): Promise<unknown> {
  const { data } = await apiClient.patch(`/admin/users/${userId}/role`, { role });
  return data;
}

export async function updateUserStatus(userId: string, is_active: boolean): Promise<unknown> {
  const { data } = await apiClient.patch(`/admin/users/${userId}/status`, { is_active });
  return data;
}

export async function getSystemStats(): Promise<AdminSystemStats> {
  const { data } = await apiClient.get<AdminSystemStats>('/admin/stats');
  return data;
}
