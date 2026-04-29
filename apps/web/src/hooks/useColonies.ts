import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as coloniesApi from '../api/colonies';
import type { ColonyCreateRequest, ColonyUpdateRequest } from '../types';

export const colonyKeys = {
  all: ['colonies'] as const,
  list: (analysisId: string) => [...colonyKeys.all, analysisId] as const,
};

/** List all colonies for an analysis */
export function useColonies(analysisId: string | undefined) {
  return useQuery({
    queryKey: colonyKeys.list(analysisId!),
    queryFn: () => coloniesApi.listColonies(analysisId!),
    enabled: !!analysisId,
  });
}

/** Add a manually-identified colony */
export function useAddColony() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ analysisId, data }: { analysisId: string; data: ColonyCreateRequest }) =>
      coloniesApi.addColony(analysisId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: colonyKeys.list(variables.analysisId) });
    },
  });
}

/** Update colony metadata */
export function useUpdateColony() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      analysisId,
      colonyId,
      data,
    }: {
      analysisId: string;
      colonyId: string;
      data: ColonyUpdateRequest;
    }) => coloniesApi.updateColony(analysisId, colonyId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: colonyKeys.list(variables.analysisId) });
    },
  });
}

/** Soft-remove a colony marker */
export function useRemoveColony() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ analysisId, colonyId }: { analysisId: string; colonyId: string }) =>
      coloniesApi.removeColony(analysisId, colonyId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: colonyKeys.list(variables.analysisId) });
    },
  });
}
