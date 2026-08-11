import { create } from "zustand";
import { persist } from "zustand/middleware";

interface IUseDashboardSidebarStore {
  collapsed: boolean;
  toggle: () => void;
  setCollapsed: (collapsed: boolean) => void;
}

const useDashboardSidebarStore = create<IUseDashboardSidebarStore>()(
  persist(
    (set) => ({
      collapsed: false,
      toggle: () => set((state) => ({ collapsed: !state.collapsed })),
      setCollapsed: (collapsed) => set({ collapsed }),
    }),
    { name: "dashboard-sidebar" },
  ),
);

export default useDashboardSidebarStore;
