'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, apiRequest, setUnauthorizedHandler } from '@/lib/api-client';

export type RoleCode = 'BAN_THUOC' | 'QUAN_LY_KHO' | 'QUAN_LY';
export type CurrentUser = {
  accountId: number;
  employeeId: number;
  username: string;
  name: string;
  roles: RoleCode[];
};
export type AuthStatus = 'checking' | 'authenticated' | 'anonymous' | 'error';

type AuthContextValue = {
  status: AuthStatus;
  user: CurrentUser | null;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearLocalSession: () => void;
  retryMe: () => Promise<void>;
  refreshMe: () => Promise<CurrentUser | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<AuthStatus>('checking');
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshMe = useCallback(async () => {
    try {
      const response = await apiRequest<{ data: CurrentUser }>('/auth/me', {
        auth: false,
      });
      setUser(response.data);
      setStatus('authenticated');
      setError(null);
      return response.data;
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        setUser(null);
        setStatus('anonymous');
        setError(null);
        return null;
      }
      setStatus('error');
      setError(cause instanceof Error ? cause.message : 'Không thể kiểm tra phiên.');
      return null;
    }
  }, []);

  const retryMe = useCallback(async () => {
    setStatus('checking');
    await refreshMe();
  }, [refreshMe]);

  const login = useCallback(
    async (username: string, password: string) => {
      const response = await apiRequest<{ data: CurrentUser }>('/auth/login', {
        method: 'POST',
        body: { username, password },
        auth: false,
      });
      setUser(response.data);
      setStatus('authenticated');
      setError(null);
      router.replace('/');
    },
    [router],
  );

  const logout = useCallback(async () => {
    await apiRequest<{ data: { success: true } }>('/auth/logout', {
      method: 'POST',
      auth: false,
    });
    setUser(null);
    setStatus('anonymous');
    setError(null);
    router.replace('/login');
  }, [router]);

  const clearLocalSession = useCallback(() => {
    setUser(null);
    setStatus('anonymous');
    setError(null);
    router.replace('/login');
  }, [router]);

  useEffect(() => {
    let active = true;
    setUnauthorizedHandler(() => {
      setUser(null);
      setStatus('anonymous');
      setError(null);
      router.replace('/login');
    });
    queueMicrotask(() => {
      if (active) void refreshMe();
    });
    return () => {
      active = false;
      setUnauthorizedHandler(undefined);
    };
  }, [refreshMe, router]);

  const value = useMemo(
    () => ({ status, user, error, login, logout, clearLocalSession, retryMe, refreshMe }),
    [status, user, error, login, logout, clearLocalSession, retryMe, refreshMe],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth phải được dùng bên trong AuthProvider.');
  return value;
}
