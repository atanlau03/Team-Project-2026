import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as analysesApi from '../api/analyses';
import type { AnalysisCreateRequest, AnalysisUpdateRequest, AnalysisFilterParams } from '../types';

export const analysisKeys = {
  all: ['analyses'] as const,
  lists: () => [...analysisKeys.all, 'list'] as const,
  list: (params?: AnalysisFilterParams) => [...analysisKeys.lists(), params] as const,
  details: () => [...analysisKeys.all, 'detail'] as const,
  detail: (id: string) => [...analysisKeys.details(), id] as const,
};

/** List analyses with filters and pagination */
export function useAnalyses(params?: AnalysisFilterParams) {
  return useQuery({
    queryKey: analysisKeys.list(params),
    queryFn: () => analysesApi.listAnalyses(params),
  });
}

/** Get a single analysis by ID */
export function useAnalysis(id: string | undefined) {
  return useQuery({
    queryKey: analysisKeys.detail(id!),
    queryFn: () => analysesApi.getAnalysis(id!),
    enabled: !!id,
  });
}

/** Create a new draft analysis */
export function useCreateAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: AnalysisCreateRequest) => analysesApi.createAnalysis(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: analysisKeys.lists() });
    },
  });
}

/** Upload plate image for an analysis */
export function useUploadImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ analysisId, file }: { analysisId: string; file: File }) =>
      analysesApi.uploadImage(analysisId, file),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: analysisKeys.detail(variables.analysisId) });
    },
  });
}

/** Trigger AI colony detection */
export function useRunAiInference() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (analysisId: string) => analysesApi.runAiInference(analysisId),
    onSuccess: (_data, analysisId) => {
      queryClient.invalidateQueries({ queryKey: analysisKeys.detail(analysisId) });
    },
  });
}

/** Update analysis metadata */
export function useUpdateAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ analysisId, data }: { analysisId: string; data: AnalysisUpdateRequest }) =>
      analysesApi.updateAnalysis(analysisId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: analysisKeys.detail(variables.analysisId) });
      queryClient.invalidateQueries({ queryKey: analysisKeys.lists() });
    },
  });
}

/** Finalize and lock an analysis */
export function useFinalizeAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (analysisId: string) => analysesApi.finalizeAnalysis(analysisId),
    onSuccess: (_data, analysisId) => {
      queryClient.invalidateQueries({ queryKey: analysisKeys.detail(analysisId) });
      queryClient.invalidateQueries({ queryKey: analysisKeys.lists() });
    },
  });
}

/** Delete a draft analysis */
export function useDeleteAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (analysisId: string) => analysesApi.deleteAnalysis(analysisId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: analysisKeys.lists() });
    },
  });
}
