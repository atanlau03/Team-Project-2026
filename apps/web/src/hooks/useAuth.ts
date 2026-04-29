import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as authApi from '../api/auth';
import { TOKEN_KEY } from '../lib/axios';
import type { RegisterRequest, UserUpdateRequest } from '../types';

export const userKeys = {
  me: ['user'] as const,
};

/** Fetch the currently authenticated user */
export function useCurrentUser() {
  return useQuery({
    queryKey: userKeys.me,
    queryFn: authApi.getMe,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/** Login mutation — stores JWT and refetches user */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
    onSuccess: (data) => {
      localStorage.setItem(TOKEN_KEY, data.access_token);
      queryClient.invalidateQueries({ queryKey: userKeys.me });
    },
  });
}

/** Register mutation */
export function useRegister() {
  return useMutation({
    mutationFn: (body: RegisterRequest) => authApi.register(body),
  });
}

/** Logout mutation — clears token and all cached queries */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      localStorage.removeItem(TOKEN_KEY);
      queryClient.clear();
    },
  });
}

/** Forgot password mutation */
export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
  });
}

/** Reset password mutation */
export function useResetPassword() {
  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      authApi.resetPassword(token, password),
  });
}

/** Update current user profile via /users/me */
export function useUpdateMe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UserUpdateRequest) => authApi.updateMe(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.me });
    },
  });
}
