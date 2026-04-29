import apiClient from '../lib/axios';
import type {
  SimulatorSample,
  SimulatorSession,
  SimulatorSessionCreateRequest,
  SimulatorSessionSubmitRequest,
} from '../types';

/** Get sample plate library */
export async function listSamples(): Promise<SimulatorSample[]> {
  const { data } = await apiClient.get<SimulatorSample[]>('/simulator/samples');
  return data;
}

/** Upload a new simulator sample */
export async function uploadSample(formData: FormData): Promise<SimulatorSample> {
  const { data } = await apiClient.post<SimulatorSample>('/simulator/samples', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

/** Start a battle mode session */
export async function createSession(body: SimulatorSessionCreateRequest): Promise<SimulatorSession> {
  const { data } = await apiClient.post<SimulatorSession>('/simulator/sessions', body);
  return data;
}

/** Submit manual counting result */
export async function submitResult(
  sessionId: string,
  body: SimulatorSessionSubmitRequest,
): Promise<SimulatorSession> {
  const { data } = await apiClient.patch<SimulatorSession>(
    `/simulator/sessions/${sessionId}`,
    body,
  );
  return data;
}

/** Unlock AI result for comparison */
export async function revealAiResult(sessionId: string): Promise<SimulatorSession> {
  const { data } = await apiClient.get<SimulatorSession>(
    `/simulator/sessions/${sessionId}/reveal`,
  );
  return data;
}

/** Get user's session history */
export async function listSessions(): Promise<SimulatorSession[]> {
  const { data } = await apiClient.get<SimulatorSession[]>('/simulator/sessions');
  return data;
}
