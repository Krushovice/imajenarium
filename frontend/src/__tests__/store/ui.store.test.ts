import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "@/store/ui.store";

beforeEach(() => {
  useUIStore.setState({ theme: "dark", sidebarOpen: false, moodFilter: null });
});

describe("useUIStore", () => {
  it("initial state: dark theme, sidebar closed, no mood filter", () => {
    const s = useUIStore.getState();
    expect(s.theme).toBe("dark");
    expect(s.sidebarOpen).toBe(false);
    expect(s.moodFilter).toBeNull();
  });

  it("setTheme switches theme", () => {
    useUIStore.getState().setTheme("light");
    expect(useUIStore.getState().theme).toBe("light");
  });

  it("setSidebarOpen sets sidebar state", () => {
    useUIStore.getState().setSidebarOpen(true);
    expect(useUIStore.getState().sidebarOpen).toBe(true);
  });

  it("toggleSidebar flips sidebar state", () => {
    expect(useUIStore.getState().sidebarOpen).toBe(false);
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarOpen).toBe(true);
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarOpen).toBe(false);
  });

  it("setMoodFilter sets filter string", () => {
    useUIStore.getState().setMoodFilter("melancholic");
    expect(useUIStore.getState().moodFilter).toBe("melancholic");
  });

  it("setMoodFilter(null) clears filter", () => {
    useUIStore.getState().setMoodFilter("dark");
    useUIStore.getState().setMoodFilter(null);
    expect(useUIStore.getState().moodFilter).toBeNull();
  });

  it("setTheme does not affect sidebar", () => {
    useUIStore.getState().setSidebarOpen(true);
    useUIStore.getState().setTheme("light");
    expect(useUIStore.getState().sidebarOpen).toBe(true);
  });
});
