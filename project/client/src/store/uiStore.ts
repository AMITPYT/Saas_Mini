import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface Modal {
  id: string;
  type: string;
  props?: Record<string, any>;
}

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;

  // Theme
  theme: 'light' | 'dark' | 'system';

  // Modals
  modals: Modal[];

  // Command palette
  commandPaletteOpen: boolean;

  // Search
  searchOpen: boolean;

  // Notifications panel
  notificationsPanelOpen: boolean;

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapse: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  setTheme: (theme: 'light' | 'dark' | 'system') => void;

  openModal: (modal: Modal) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;

  toggleCommandPalette: () => void;
  setCommandPaletteOpen: (open: boolean) => void;

  toggleSearch: () => void;
  setSearchOpen: (open: boolean) => void;

  toggleNotificationsPanel: () => void;
  setNotificationsPanelOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Initial state
      sidebarOpen: true,
      sidebarCollapsed: false,
      theme: 'system',
      modals: [],
      commandPaletteOpen: false,
      searchOpen: false,
      notificationsPanelOpen: false,

      // Sidebar actions
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      setSidebarOpen: (sidebarOpen) =>
        set({ sidebarOpen }),

      toggleSidebarCollapse: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setSidebarCollapsed: (sidebarCollapsed) =>
        set({ sidebarCollapsed }),

      // Theme actions
      setTheme: (theme) => set({ theme }),

      // Modal actions
      openModal: (modal) =>
        set((state) => ({
          modals: [...state.modals, modal],
        })),

      closeModal: (id) =>
        set((state) => ({
          modals: state.modals.filter((m) => m.id !== id),
        })),

      closeAllModals: () => set({ modals: [] }),

      // Command palette actions
      toggleCommandPalette: () =>
        set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),

      setCommandPaletteOpen: (commandPaletteOpen) =>
        set({ commandPaletteOpen }),

      // Search actions
      toggleSearch: () =>
        set((state) => ({ searchOpen: !state.searchOpen })),

      setSearchOpen: (searchOpen) =>
        set({ searchOpen }),

      // Notifications panel actions
      toggleNotificationsPanel: () =>
        set((state) => ({ notificationsPanelOpen: !state.notificationsPanelOpen })),

      setNotificationsPanelOpen: (notificationsPanelOpen) =>
        set({ notificationsPanelOpen }),
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    }
  )
);
