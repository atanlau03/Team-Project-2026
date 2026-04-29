import { useQuery } from '@tanstack/react-query';
import * as auditApi from '../api/audit';

export const auditKeys = {
  trail: (analysisId: string) => ['audit', analysisId] as const,
};

/** Get the full audit trail for an analysis */
export function useAuditTrail(analysisId: string | undefined) {
  return useQuery({
    queryKey: auditKeys.trail(analysisId!),
    queryFn: () => auditApi.getAuditTrail(analysisId!),
    enabled: !!analysisId,
  });
}
