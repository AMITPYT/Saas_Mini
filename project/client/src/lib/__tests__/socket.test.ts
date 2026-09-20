import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Mock socket.io-client
const mockSocket = {
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  connected: true,
  id: 'test-socket-id',
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

// Mock auth store
vi.mock('../../store/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    accessToken: 'test-token',
    isAuthenticated: true,
  })),
}));

// Import after mocking
import {
  initSocket,
  disconnectSocket,
  getSocket,
  useSocket,
  useSocketRoom,
  useSocketEvent,
  useTypingIndicator,
} from '../socket';

describe('Socket Library', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initSocket', () => {
    it('should initialize socket with token', () => {
      const socket = initSocket('test-token');

      expect(socket).toBeDefined();
    });

    it('should return existing socket if connected', () => {
      const socket1 = initSocket('test-token');
      const socket2 = initSocket('test-token');

      expect(socket1).toBe(socket2);
    });
  });

  describe('disconnectSocket', () => {
    it('should disconnect socket', () => {
      initSocket('test-token');
      disconnectSocket();

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('getSocket', () => {
    it('should return socket instance', () => {
      initSocket('test-token');
      const socket = getSocket();

      expect(socket).toBeDefined();
    });
  });
});

describe('useSocket', () => {
  it('should return socket and connection status', () => {
    const { result } = renderHook(() => useSocket());

    expect(result.current).toHaveProperty('socket');
    expect(result.current).toHaveProperty('isConnected');
  });
});

describe('useSocketRoom', () => {
  it('should join room on mount', () => {
    renderHook(() => useSocketRoom('workspace', 'workspace-123'));

    // Should emit join event
    expect(mockSocket.emit).toHaveBeenCalledWith('workspace:join', 'workspace-123');
  });

  it('should leave room on unmount', () => {
    const { unmount } = renderHook(() => useSocketRoom('board', 'board-456'));

    unmount();

    expect(mockSocket.emit).toHaveBeenCalledWith('board:leave', 'board-456');
  });

  it('should not join if roomId is undefined', () => {
    renderHook(() => useSocketRoom('channel', undefined));

    expect(mockSocket.emit).not.toHaveBeenCalled();
  });
});

describe('useSocketEvent', () => {
  it('should subscribe to event', () => {
    const callback = vi.fn();
    renderHook(() => useSocketEvent('test:event', callback));

    expect(mockSocket.on).toHaveBeenCalledWith('test:event', callback);
  });

  it('should unsubscribe on unmount', () => {
    const callback = vi.fn();
    const { unmount } = renderHook(() => useSocketEvent('test:event', callback));

    unmount();

    expect(mockSocket.off).toHaveBeenCalledWith('test:event', callback);
  });
});

describe('useTypingIndicator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return typing users array', () => {
    const { result } = renderHook(() => useTypingIndicator('channel-123'));

    expect(result.current.typingUsers).toEqual([]);
  });

  it('should provide startTyping function', () => {
    const { result } = renderHook(() => useTypingIndicator('channel-123'));

    expect(typeof result.current.startTyping).toBe('function');
  });

  it('should provide stopTyping function', () => {
    const { result } = renderHook(() => useTypingIndicator('channel-123'));

    expect(typeof result.current.stopTyping).toBe('function');
  });

  it('should emit typing:start event', () => {
    const { result } = renderHook(() => useTypingIndicator('channel-123'));

    act(() => {
      result.current.startTyping();
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('typing:start', { channelId: 'channel-123' });
  });

  it('should emit typing:stop event', () => {
    const { result } = renderHook(() => useTypingIndicator('channel-123'));

    act(() => {
      result.current.stopTyping();
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('typing:stop', { channelId: 'channel-123' });
  });
});
