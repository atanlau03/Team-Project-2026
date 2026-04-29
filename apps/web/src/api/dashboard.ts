import apiClient from '../lib/axios';
import type { DashboardOverview, ActivityItem, TrendPoint, DayCount } from '../types';

/** Get aggregated dashboard stats */
export async function getOverview(): Promise<DashboardOverview> {
  const { data } = await apiClient.get<DashboardOverview>('/dashboard/');
  return data;
}

/** Get recent activity stream */
export async function getLiveActivity(limit?: number): Promise<ActivityItem[]> {
  const { data } = await apiClient.get<ActivityItem[]>('/dashboard/activity', {
    params: limit ? { limit } : undefined,
  });
  return data;
}

/** Get CFU/ml trend data */
export async function getCfuTrend(params?: { days?: number; scope?: string; target_user_id?: string }): Promise<TrendPoint[]> {
  const { data } = await apiClient.get<TrendPoint[]>('/dashboard/charts/cfu-trend', {
    params: params ? params : undefined,
  });
  return data;
}

/** Get analyses per day */
export async function getAnalysesPerDay(days?: number): Promise<DayCount[]> {
  const { data } = await apiClient.get<DayCount[]>('/dashboard/charts/analyses-per-day', {
    params: days ? { days } : undefined,
  });
  return data;
}
