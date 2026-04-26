import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { zustandMMKVStorage } from '@/lib/mmkv';

export type UserRole = 'TEACHER' | 'STUDENT';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  batchIds: string[];
  // UPI payment fields (optional – populated after teacher sets up QR)
  upi_id?: string;
  upi_qr_url?: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  failedAttempts: number;
  lockedUntil: number | null;
  setUser: (user: AuthUser) => void;
  clearAuth: () => void;
  incrementFailedAttempts: () => void;
  lockAccount: (until: number) => void;
  clearLock: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    immer((set) => ({
      user: null,
      isAuthenticated: false,
      failedAttempts: 0,
      lockedUntil: null,
      setUser: (user) => set((s) => { s.user = user; s.isAuthenticated = true; s.failedAttempts = 0; s.lockedUntil = null; }),
      clearAuth: () => set((s) => { s.user = null; s.isAuthenticated = false; }),
      incrementFailedAttempts: () => set((s) => { s.failedAttempts += 1; }),
      lockAccount: (until) => set((s) => { s.lockedUntil = until; }),
      clearLock: () => set((s) => { s.lockedUntil = null; s.failedAttempts = 0; }),
    })),
    {
      name: 'auth',
      storage: createJSONStorage(() => zustandMMKVStorage),
      partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }),
    }
  )
);
