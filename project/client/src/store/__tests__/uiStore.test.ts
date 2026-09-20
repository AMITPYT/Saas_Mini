import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useUIStore } from '../uiStore';

// Mock localStorage
const localStorageMock = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => localStorageMock.store[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageMock.store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageMock.store[key];
  }),
  clear: vi.fn(() => {
    localStorageMock.store = {};
  }),
};

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('uiStore', () => {
  beforeEach(() => {
    useUIStore.setState({
      sidebarOpen: true,
      sidebarCollapsed: false,
      theme: 'system',
      commandPaletteOpen: false,
      activeModal: null,
      modalData: null,
    });
    localStorageMock.clear();
  });

  describe('Sidebar', () => {
    it('should toggle sidebar open state', () => {
      expect(useUIStore.getState().sidebarOpen).toBe(true);

      useUIStore.getState().toggleSidebar();
      expect(useUIStore.getState().sidebarOpen).toBe(false);

      useUIStore.getState().toggleSidebar();
      expect(useUIStore.getState().sidebarOpen).toBe(true);
    });

    it('should set sidebar open state', () => {
      useUIStore.getState().setSidebarOpen(false);
      expect(useUIStore.getState().sidebarOpen).toBe(false);

      useUIStore.getState().setSidebarOpen(true);
      expect(useUIStore.getState().sidebarOpen).toBe(true);
    });

    it('should toggle sidebar collapsed state', () => {
      expect(useUIStore.getState().sidebarCollapsed).toBe(false);

      useUIStore.getState().toggleSidebarCollapsed();
      expect(useUIStore.getState().sidebarCollapsed).toBe(true);
    });
  });

  describe('Theme', () => {
    it('should set theme', () => {
      useUIStore.getState().setTheme('dark');
      expect(useUIStore.getState().theme).toBe('dark');

      useUIStore.getState().setTheme('light');
      expect(useUIStore.getState().theme).toBe('light');

      useUIStore.getState().setTheme('system');
      expect(useUIStore.getState().theme).toBe('system');
    });
  });

  describe('Command Palette', () => {
    it('should toggle command palette', () => {
      expect(useUIStore.getState().commandPaletteOpen).toBe(false);

      useUIStore.getState().toggleCommandPalette();
      expect(useUIStore.getState().commandPaletteOpen).toBe(true);

      useUIStore.getState().toggleCommandPalette();
      expect(useUIStore.getState().commandPaletteOpen).toBe(false);
    });

    it('should set command palette open state', () => {
      useUIStore.getState().setCommandPaletteOpen(true);
      expect(useUIStore.getState().commandPaletteOpen).toBe(true);
    });
  });

  describe('Modal', () => {
    it('should open modal with data', () => {
      useUIStore.getState().openModal('createWorkspace', { defaultName: 'Test' });

      const state = useUIStore.getState();
      expect(state.activeModal).toBe('createWorkspace');
      expect(state.modalData).toEqual({ defaultName: 'Test' });
    });

    it('should close modal', () => {
      useUIStore.getState().openModal('createWorkspace');
      useUIStore.getState().closeModal();

      const state = useUIStore.getState();
      expect(state.activeModal).toBeNull();
      expect(state.modalData).toBeNull();
    });
  });
});
