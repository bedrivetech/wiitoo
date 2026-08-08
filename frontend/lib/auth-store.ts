'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, AuthUser, AuthTokens } from './api-client';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  pendingVerification: boolean;
  pendingEmail: string;
  loading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string, interests?: string[]) => Promise<void>;
  verifyOtp: (email: string, code: string) => Promise<void>;
  resendOtp: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  setPendingEmail: (email: string) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      pendingVerification: false,
      pendingEmail: '',
      loading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ loading: true, error: null });
        try {
          const data: AuthTokens = await api.login(email, password);
          set({
            user: data.user,
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            isAuthenticated: true,
            pendingVerification: false,
            pendingEmail: '',
            loading: false,
          });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Login failed';
          set({ loading: false, error: msg });
          throw err;
        }
      },

      register: async (email: string, password: string, username: string, interests?: string[]) => {
        set({ loading: true, error: null });
        try {
          await api.register(email, password, username, interests);
          set({
            loading: false,
            pendingVerification: true,
            pendingEmail: email,
          });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Registration failed';
          set({ loading: false, error: msg });
          throw err;
        }
      },

      verifyOtp: async (email: string, code: string) => {
        set({ loading: true, error: null });
        try {
          const data: AuthTokens = await api.verify(email, code);
          set({
            user: data.user,
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            isAuthenticated: true,
            pendingVerification: false,
            pendingEmail: '',
            loading: false,
          });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Verification failed';
          set({ loading: false, error: msg });
          throw err;
        }
      },

      resendOtp: async (email: string) => {
        set({ loading: true, error: null });
        try {
          await api.resendOtp(email);
          set({ loading: false });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Failed to resend code';
          set({ loading: false, error: msg });
          throw err;
        }
      },

      logout: async () => {
        try {
          await api.logout();
        } catch {
          // Ignore — clear local state regardless
        }
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          pendingVerification: false,
          pendingEmail: '',
        });
      },

      refreshSession: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return;
        try {
          const data = await api.refresh(refreshToken);
          set({
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
          });
        } catch {
          // Token expired — log out
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          });
        }
      },

      setPendingEmail: (email: string) => set({ pendingEmail: email }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'wiitoo-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        pendingEmail: state.pendingEmail,
      }),
    }
  )
);