import apiClient from '../lib/axios';
import type { AuditEvent } from '../types';

/** Get the full audit trail for an analysis */
export async function getAuditTrail(analysisId: string): Promise<AuditEvent[]> {
  const { data } = await apiClient.get<AuditEvent[]>(`/analyses/${analysisId}/audit/`);
  return data;
}
