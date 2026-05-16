import { create } from "zustand";

type Theme = "dark" | "light";
type MoodFilter = string | null;

interface UIState {
  theme: Theme;
  sidebarOpen: boolean;
  moodFilter: MoodFilter;
  setTheme: (theme: Theme) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setMoodFilter: (mood: MoodFilter) => void;
}

export const useUIStore = create<UIState>((set) => ({
  theme: "dark",
  sidebarOpen: false,
  moodFilter: null,
  setTheme: (theme) => set({ theme }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setMoodFilter: (moodFilter) => set({ moodFilter }),
}));
