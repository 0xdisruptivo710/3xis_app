import { create } from 'zustand';

export interface UserProfile {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  role: string;
  storeId: string | null;
  xpTotal: number;
  currentLevel: number;
  streakDays: number;
}

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  updateXP: (xp: number, level: number) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  updateXP: (xpTotal, currentLevel) =>
    set((state) => ({
      user: state.user ? { ...state.user, xpTotal, currentLevel } : null,
    })),
}));
