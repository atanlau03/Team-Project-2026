import apiClient, { TOKEN_KEY } from '../lib/axios';
import type { AuthTokenResponse, User, UserUpdateRequest } from '../types';

/** Login — FastAPI Users expects form-encoded username+password */
export async function login(email: string, password: string): Promise<AuthTokenResponse> {
  const params = new URLSearchParams();
  params.append('username', email);
  params.append('password', password);

  const { data } = await apiClient.post<AuthTokenResponse>('/auth/login', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return data;
}

/** Request a password-reset email */
export async function forgotPassword(email: string): Promise<void> {
  await apiClient.post('/auth/forgot-password', { email });
}

/** Reset password with token */
export async function resetPassword(token: string, password: string): Promise<void> {
  await apiClient.post('/auth/reset-password', { token, password });
}

/** Request email verification token */
export async function requestVerify(email: string): Promise<void> {
  await apiClient.post('/auth/request-verify-token', { email });
}

/** Verify email with token */
export async function verify(token: string): Promise<User> {
  const { data } = await apiClient.post<User>('/auth/verify', { token });
  return data;
}

/** Logout (invalidate token server-side) */
export async function logout(): Promise<void> {
  try {
    await apiClient.post('/auth/logout');
  } finally {
    localStorage.removeItem(TOKEN_KEY);
  }
}

/** Get current authenticated user */
export async function getMe(): Promise<User> {
  const { data } = await apiClient.get<User>('/users/me');
  return data;
}

/** Update current user */
export async function updateMe(body: UserUpdateRequest): Promise<User> {
  const { data } = await apiClient.patch<User>('/users/me', body);
  return data;
}

/** Get Google OAuth authorization URL from the backend */
export async function getGoogleOAuthUrl(): Promise<string> {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  const url = `${baseUrl}/auth/google/authorize`;
  
  const resp = await fetch(url, {
    credentials: 'include'
  });
  if (resp.status === 404) {
    throw new Error('Google OAuth is not configured on this server.');
  }

  const data = await resp.json();
  if (data.authorization_url) {
    return data.authorization_url;
  }
  
  return url;
}

/** Exchange Google OAuth callback code */
export async function googleOAuthCallback(code: string, state?: string): Promise<AuthTokenResponse> {
  const params = new URLSearchParams({ code });
  if (state) params.append('state', state);
  
  const { data } = await apiClient.get<AuthTokenResponse>(`/auth/google/callback?${params.toString()}`);
  return data;
}
