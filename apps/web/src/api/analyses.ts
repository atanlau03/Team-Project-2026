import apiClient from '../lib/axios';
import type {
  AnalysisCreateRequest,
  AnalysisUpdateRequest,
  AnalysisDetail,
  AnalysisImage,
  PaginatedAnalyses,
  AnalysisFilterParams,
  AiInferenceResult,
} from '../types';

/** Create a new draft analysis */
export async function createAnalysis(body: AnalysisCreateRequest): Promise<AnalysisDetail> {
  const { data } = await apiClient.post<AnalysisDetail>('/analyses/', body);
  return data;
}

/** Upload plate image for an analysis (multipart) */
export async function uploadImage(analysisId: string, file: File): Promise<AnalysisImage> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post<AnalysisImage>(
    `/analyses/${analysisId}/upload`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data;
}

/** Trigger AI colony detection */
export async function runAiInference(analysisId: string): Promise<AnalysisDetail> {
  const { data } = await apiClient.post<AnalysisDetail>(`/analyses/${analysisId}/run-ai`);
  return data;
}

/** Get full analysis detail */
export async function getAnalysis(analysisId: string): Promise<AnalysisDetail> {
  const { data } = await apiClient.get<AnalysisDetail>(`/analyses/${analysisId}`);
  return data;
}

/** Update analysis metadata */
export async function updateAnalysis(analysisId: string, body: AnalysisUpdateRequest): Promise<AnalysisDetail> {
  const { data } = await apiClient.patch<AnalysisDetail>(`/analyses/${analysisId}`, body);
  return data;
}

/** Finalize and lock an analysis */
export async function finalizeAnalysis(analysisId: string): Promise<AnalysisDetail> {
  const { data } = await apiClient.post<AnalysisDetail>(`/analyses/${analysisId}/finalize`);
  return data;
}

/** List analyses with filters and pagination */
export async function listAnalyses(params?: AnalysisFilterParams): Promise<PaginatedAnalyses> {
  const { data } = await apiClient.get<PaginatedAnalyses>('/analyses/', { params });
  return data;
}

/** Delete a draft analysis */
export async function deleteAnalysis(analysisId: string): Promise<void> {
  await apiClient.delete(`/analyses/${analysisId}`);
}
