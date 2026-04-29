import { useQuery } from '@tanstack/react-query';
import * as dashboardApi from '../api/dashboard';

export const dashboardKeys = {
  overview: ['dashboard', 'overview'] as const,
  activity: (limit?: number) => ['dashboard', 'activity', limit] as const,
  cfuTrend: (params?: any) => ['dashboard', 'cfuTrend', params] as const,
  analysesPerDay: (days?: number) => ['dashboard', 'analysesPerDay', days] as const,
};

/** Get aggregated dashboard stats */
export function useDashboardOverview() {
  return useQuery({
    queryKey: dashboardKeys.overview,
    queryFn: dashboardApi.getOverview,
  });
}

/** Get recent activity stream — auto-refreshes every 30s */
export function useLiveActivity(limit?: number) {
  return useQuery({
    queryKey: dashboardKeys.activity(limit),
    queryFn: () => dashboardApi.getLiveActivity(limit),
    refetchInterval: 30_000,
  });
}

/** Get CFU/ml trend data */
export function useCfuTrend(params?: { days?: number; scope?: string; target_user_id?: string }) {
  return useQuery({
    queryKey: dashboardKeys.cfuTrend(params),
    queryFn: () => dashboardApi.getCfuTrend(params),
  });
}

/** Get analyses per day */
export function useAnalysesPerDay(days?: number) {
  return useQuery({
    queryKey: dashboardKeys.analysesPerDay(days),
    queryFn: () => dashboardApi.getAnalysesPerDay(days),
  });
}
