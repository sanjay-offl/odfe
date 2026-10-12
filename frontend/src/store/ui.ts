import { create } from 'zustand';

interface UiState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  toggleCollapsed: () => void;
}

export const useUi = create<UiState>((set) => ({
  sidebarOpen: false,
  sidebarCollapsed: typeof localStorage !== 'undefined' && localStorage.getItem('odfe-sidebar-collapsed') === '1',
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),
  toggleCollapsed: () =>
    set((s) => {
      const next = !s.sidebarCollapsed;
      if (typeof localStorage !== 'undefined') localStorage.setItem('odfe-sidebar-collapsed', next ? '1' : '0');
      return { sidebarCollapsed: next };
    }),
}));
