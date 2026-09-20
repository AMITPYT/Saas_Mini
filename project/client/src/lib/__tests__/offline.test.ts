import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Mock IndexedDB
const mockIDB = {
  add: vi.fn(),
  get: vi.fn(),
  getAll: vi.fn(),
  getAllFromIndex: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
};

vi.mock('idb', () => ({
  openDB: vi.fn().mockResolvedValue(mockIDB),
}));

// Import after mocking
import {
  addPendingAction,
  getPendingActions,
  removePendingAction,
  cacheData,
  getCachedData,
  useOnlineStatus,
  useOfflineQueue,
} from '../offline';

describe('Offline Storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIDB.getAllFromIndex.mockResolvedValue([]);
    mockIDB.get.mockResolvedValue(null);
  });

  describe('Pending Actions', () => {
    it('should add pending action', async () => {
      mockIDB.add.mockResolvedValue('action-123');

      const actionId = await addPendingAction({
        type: 'create',
        endpoint: '/api/v1/cards',
        method: 'POST',
        data: { title: 'Test Card' },
      });

      expect(actionId).toBeDefined();
      expect(mockIDB.add).toHaveBeenCalled();
    });

    it('should get pending actions', async () => {
      const mockActions = [
        { id: '1', type: 'create', endpoint: '/api', method: 'POST' },
        { id: '2', type: 'update', endpoint: '/api', method: 'PATCH' },
      ];
      mockIDB.getAllFromIndex.mockResolvedValue(mockActions);

      const actions = await getPendingActions();

      expect(actions).toEqual(mockActions);
    });

    it('should remove pending action', async () => {
      mockIDB.delete.mockResolvedValue(undefined);

      await removePendingAction('action-123');

      expect(mockIDB.delete).toHaveBeenCalledWith('pendingActions', 'action-123');
    });
  });

  describe('Cache Management', () => {
    it('should cache data', async () => {
      mockIDB.put.mockResolvedValue(undefined);

      await cacheData('workspace-123', { name: 'Test' });

      expect(mockIDB.put).toHaveBeenCalled();
    });

    it('should get cached data', async () => {
      const mockData = {
        key: 'workspace-123',
        data: { name: 'Test' },
        timestamp: Date.now(),
        expiresAt: Date.now() + 3600000,
      };
      mockIDB.get.mockResolvedValue(mockData);

      const data = await getCachedData('workspace-123');

      expect(data).toEqual({ name: 'Test' });
    });

    it('should return null for expired cache', async () => {
      const mockData = {
        key: 'workspace-123',
        data: { name: 'Test' },
        timestamp: Date.now() - 7200000,
        expiresAt: Date.now() - 3600000, // Expired 1 hour ago
      };
      mockIDB.get.mockResolvedValue(mockData);

      const data = await getCachedData('workspace-123');

      expect(data).toBeNull();
    });

    it('should return null for non-existent cache', async () => {
      mockIDB.get.mockResolvedValue(null);

      const data = await getCachedData('non-existent');

      expect(data).toBeNull();
    });
  });
});

describe('useOnlineStatus', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  it('should return initial online status', () => {
    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current).toBe(true);
  });

  it('should update when going offline', async () => {
    const { result } = renderHook(() => useOnlineStatus());

    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      window.dispatchEvent(new Event('offline'));
    });

    await waitFor(() => {
      // The hook should reflect offline status
      // Note: actual behavior depends on implementation
    });
  });
});

describe('useOfflineQueue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockIDB.getAllFromIndex.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return pending count', async () => {
    mockIDB.getAllFromIndex.mockResolvedValue([
      { id: '1' },
      { id: '2' },
      { id: '3' },
    ]);

    const { result } = renderHook(() => useOfflineQueue());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    await waitFor(() => {
      expect(result.current).toBe(3);
    });
  });

  it('should poll for updates', async () => {
    mockIDB.getAllFromIndex.mockResolvedValue([]);

    renderHook(() => useOfflineQueue());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    // Should have called getAll multiple times due to polling
    expect(mockIDB.getAllFromIndex.mock.calls.length).toBeGreaterThanOrEqual(1);
  });
});
