import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  activeOrgSlug: string | null;
  setSession: (payload: { user: AuthUser; accessToken: string; refreshToken: string }) => void;
  setTokens: (payload: { accessToken: string; refreshToken: string }) => void;
  setActiveOrgSlug: (slug: string) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      activeOrgSlug: null,
      setSession: ({ user, accessToken, refreshToken }) => set({ user, accessToken, refreshToken }),
      setTokens: ({ accessToken, refreshToken }) => set({ accessToken, refreshToken }),
      setActiveOrgSlug: (slug) => set({ activeOrgSlug: slug }),
      clear: () => set({ user: null, accessToken: null, refreshToken: null, activeOrgSlug: null }),
    }),
    { name: 'taskflow-auth' },
  ),
);
