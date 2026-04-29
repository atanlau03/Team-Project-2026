import apiClient from '../lib/axios';
import type { Colony, ColonyCreateRequest, ColonyUpdateRequest } from '../types';

/** List all colonies for an analysis */
export async function listColonies(analysisId: string): Promise<Colony[]> {
  const { data } = await apiClient.get<Colony[]>(`/analyses/${analysisId}/colonies/`);
  return data;
}

/** Add a manually-identified colony */
export async function addColony(analysisId: string, body: ColonyCreateRequest): Promise<Colony> {
  const { data } = await apiClient.post<Colony>(`/analyses/${analysisId}/colonies/`, body);
  return data;
}

/** Edit colony metadata */
export async function updateColony(
  analysisId: string,
  colonyId: string,
  body: ColonyUpdateRequest,
): Promise<Colony> {
  const { data } = await apiClient.patch<Colony>(
    `/analyses/${analysisId}/colonies/${colonyId}`,
    body,
  );
  return data;
}

/** Soft-remove a colony marker */
export async function removeColony(analysisId: string, colonyId: string): Promise<Colony> {
  const { data } = await apiClient.delete<Colony>(
    `/analyses/${analysisId}/colonies/${colonyId}`,
  );
  return data;
}
