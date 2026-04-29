import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as adminApi from '../api/admin';

export const adminKeys = {
  all: ['admin'] as const,
  users: (params?: Record<string, unknown>) => [...adminKeys.all, 'users', params] as const,
  stats: () => [...adminKeys.all, 'stats'] as const,
};

/** List all users (admin only) */
export function useAdminUsers(params?: {
  search?: string;
  role?: string;
  page?: number;
  page_size?: number;
}) {
  return useQuery({
    queryKey: adminKeys.users(params),
    queryFn: () => adminApi.listUsers(params),
  });
}

/** Get system-wide stats (admin only) */
export function useAdminStats() {
  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: adminApi.getSystemStats,
  });
}

/** Change a user's role */
export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      adminApi.updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
}

/** Activate or deactivate a user */
export function useUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, is_active }: { userId: string; is_active: boolean }) =>
      adminApi.updateUserStatus(userId, is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
}
