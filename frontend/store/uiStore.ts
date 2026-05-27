import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIStore {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      darkMode: false,
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
    }),
    { name: "veda-ui" }
  )
);
