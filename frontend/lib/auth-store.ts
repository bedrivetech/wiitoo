'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  pendingVerification: boolean;
  pendingEmail: string;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (email: string, password: string, displayName: string) => Promise<boolean>;
  verifyOtp: (otp: string) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      pendingVerification: false,
      pendingEmail: '',

      login: async (email: string, _password: string) => {
        // Mock login — accept any creds
        set({
          user: {
            id: 'user-' + Math.random().toString(36).slice(2, 8),
            email,
            displayName: email.split('@')[0],
            avatarUrl: '',
          },
          isAuthenticated: true,
          pendingVerification: false,
          pendingEmail: '',
        });
        return true;
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          pendingVerification: false,
          pendingEmail: '',
        });
      },

      register: async (email: string, _password: string, displayName: string) => {
        // Mock register — sets pending verification
        set({
          user: {
            id: 'user-' + Math.random().toString(36).slice(2, 8),
            email,
            displayName,
            avatarUrl: '',
          },
          isAuthenticated: false,
          pendingVerification: true,
          pendingEmail: email,
        });
        return true;
      },

      verifyOtp: async (_otp: string) => {
        // Mock OTP — any 6-digit code works
        set({
          isAuthenticated: true,
          pendingVerification: false,
          pendingEmail: '',
        });
        return true;
      },
    }),
    {
      name: 'wiitoo-auth',
    }
  )
);