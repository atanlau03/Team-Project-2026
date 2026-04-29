import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as settingsApi from '../api/settings';
import type { UserSettingsUpdateRequest, ProfileUpdateRequest } from '../types';
import { userKeys } from './useAuth';

export const settingsKeys = {
  all: ['settings'] as const,
  integrity: () => [...settingsKeys.all, 'integrity'] as const,
};

/** Get current user settings */
export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.all,
    queryFn: settingsApi.getSettings,
  });
}

/** Get system integrity and health stats */
export function useSystemIntegrity() {
  return useQuery({
    queryKey: settingsKeys.integrity(),
    queryFn: settingsApi.getSystemIntegrity,
    refetchInterval: 60000, // Refresh every minute
  });
}

/** Update lab defaults, theme, language */
export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UserSettingsUpdateRequest) => settingsApi.updateSettings(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
}

/** Update name, title, organization */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: ProfileUpdateRequest) => settingsApi.updateProfile(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.me });
    },
  });
}

/** Upload profile picture */
export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => settingsApi.uploadAvatar(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.me });
    },
  });
}
