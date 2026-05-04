import { createContext, useContext, useCallback, useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentUser, useLogin, useLogout } from '../hooks/useAuth';
import { TOKEN_KEY } from '../lib/axios';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null | undefined;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLabManager: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loginError: string | null;
  isLoginPending: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const token = localStorage.getItem(TOKEN_KEY);

  const {
    data: user,
    isLoading: isUserLoading,
  } = useCurrentUser();

  const loginMutation = useLogin();
  const logoutMutation = useLogout();

  const login = useCallback(
    async (email: string, password: string) => {
      await loginMutation.mutateAsync({ email, password });
    },
    [loginMutation],
  );

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  const friendlyError = (detail: string | undefined): string => {
    if (!detail) return '';
    const map: Record<string, string> = {
      'LOGIN_BAD_CREDENTIALS': t('auth.login.errors.bad_credentials'),
      'LOGIN_USER_NOT_VERIFIED': t('auth.login.errors.user_not_verified'),
      'RESET_PASSWORD_BAD_TOKEN': t('auth.reset.bad_token'),
      'VERIFY_USER_BAD_TOKEN': t('auth.verify.bad_token'),
    };
    return map[detail] || detail;
  };

  const loginError = loginMutation.error
    ? friendlyError(
        (loginMutation.error as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      ) || t('auth.login.errors.generic')
    : null;

  const value = useMemo<AuthContextValue>(
    () => ({
      user: user ?? null,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
      isLabManager: user?.role === 'lab_manager',
      isLoading: !!token && isUserLoading,
      login,
      logout,
      loginError,
      isLoginPending: loginMutation.isPending,
    }),
    [user, token, isUserLoading, login, logout, loginError, loginMutation.isPending],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
