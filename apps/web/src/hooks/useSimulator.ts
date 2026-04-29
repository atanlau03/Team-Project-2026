import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as simulatorApi from '../api/simulator';
import type { SimulatorSessionCreateRequest, SimulatorSessionSubmitRequest } from '../types';

export const simulatorKeys = {
  samples: ['simulator', 'samples'] as const,
  sessions: ['simulator', 'sessions'] as const,
};

/** Get sample plate library */
export function useSimulatorSamples() {
  return useQuery({
    queryKey: simulatorKeys.samples,
    queryFn: simulatorApi.listSamples,
  });
}

/** Upload a new sample to the library */
export function useUploadSimulatorSample() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => simulatorApi.uploadSample(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: simulatorKeys.samples });
    },
  });
}

/** Get user's session history */
export function useSimulatorSessions() {
  return useQuery({
    queryKey: simulatorKeys.sessions,
    queryFn: simulatorApi.listSessions,
  });
}

/** Start a battle mode session */
export function useCreateSimulatorSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: SimulatorSessionCreateRequest) => simulatorApi.createSession(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: simulatorKeys.sessions });
    },
  });
}

/** Submit manual counting result */
export function useSubmitSimulatorResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: string; data: SimulatorSessionSubmitRequest }) =>
      simulatorApi.submitResult(sessionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: simulatorKeys.sessions });
    },
  });
}

/** Reveal AI result for comparison */
export function useRevealAiResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => simulatorApi.revealAiResult(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: simulatorKeys.sessions });
    },
  });
}
