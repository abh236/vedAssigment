import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole = "school" | "student";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  schoolName?: string;
  location?: string;
  className?: string;
  rollNumber?: string;
  avatar: string;
  photoUrl?: string;
}

interface AuthStore {
  user: AuthUser | null;
  isLoggedIn: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isLoggedIn: false,
      login: (user) => set({ user, isLoggedIn: true }),
      logout: () => set({ user: null, isLoggedIn: false }),
      updateUser: (updates) =>
        set((s) => ({ user: s.user ? { ...s.user, ...updates } : null })),
    }),
    { name: "veda-auth" }
  )
);

export function getInitials(name: string) {
  return name.split(" ").map((w) => w[0] || "").join("").toUpperCase().slice(0, 2);
}
