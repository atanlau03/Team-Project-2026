import apiClient from '../lib/axios';
import type { 
  AdminUserListItem, 
  PaginatedAdminUsers, 
  AdminUserCreateRequest, 
  AdminSystemStats 
} from '../types';

export async function listUsers(params?: {
  search?: string;
  role?: string;
  page?: number;
  page_size?: number;
}): Promise<PaginatedAdminUsers> {
  const { data } = await apiClient.get<PaginatedAdminUsers>('/admin/users', { params });
  return data;
}

export async function createUser(body: AdminUserCreateRequest): Promise<AdminUserListItem> {
  const { data } = await apiClient.post<AdminUserListItem>('/admin/users', body);
  return data;
}

export async function deleteUser(userId: string): Promise<void> {
  await apiClient.delete(`/admin/users/${userId}`);
}

export async function updateUserRole(userId: string, role: string): Promise<unknown> {
  const { data } = await apiClient.patch(`/admin/users/${userId}/role`, { role });
  return data;
}

export async function updateUserStatus(userId: string, is_active: boolean): Promise<unknown> {
  const { data } = await apiClient.patch(`/admin/users/${userId}/status`, { is_active });
  return data;
}

export async function assignSupervisor(userId: string, supervisorId: string | null): Promise<unknown> {
  const { data } = await apiClient.patch(`/admin/users/${userId}/supervisor`, { supervisor_id: supervisorId });
  return data;
}

export async function getSystemStats(): Promise<AdminSystemStats> {
  const { data } = await apiClient.get<AdminSystemStats>('/admin/stats');
  return data;
}
