import apiClient from '../lib/axios';
import type { UserSettings, UserSettingsUpdateRequest, ProfileUpdateRequest, SystemIntegrityStats } from '../types';

/** Get current user settings */
export async function getSettings(): Promise<UserSettings> {
  const { data } = await apiClient.get<UserSettings>('/settings/');
  return data;
}

/** Update lab defaults, theme, language */
export async function updateSettings(body: UserSettingsUpdateRequest): Promise<UserSettings> {
  const { data } = await apiClient.patch<UserSettings>('/settings/', body);
  return data;
}

/** Update name, title, organization */
export async function updateProfile(body: ProfileUpdateRequest): Promise<unknown> {
  const { data } = await apiClient.patch('/settings/profile', body);
  return data;
}

/** Upload profile picture (multipart) */
export async function uploadAvatar(file: File): Promise<unknown> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post('/settings/profile/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

/** Get system integrity and health stats */
export async function getSystemIntegrity(): Promise<SystemIntegrityStats> {
  const { data } = await apiClient.get<SystemIntegrityStats>('/settings/integrity');
  return data;
}
