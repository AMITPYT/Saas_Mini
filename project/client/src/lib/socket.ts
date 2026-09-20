import { io, Socket } from 'socket.io-client';
import { useEffect, useCallback, useState } from 'react';
import { useAuthStore } from '../store/authStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function initSocket(token: string): Socket {
  if (socket?.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// React hook for socket connection
export function useSocket() {
  const { accessToken, isAuthenticated } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      const s = initSocket(accessToken);

      const handleConnect = () => setIsConnected(true);
      const handleDisconnect = () => setIsConnected(false);

      s.on('connect', handleConnect);
      s.on('disconnect', handleDisconnect);

      if (s.connected) {
        setIsConnected(true);
      }

      return () => {
        s.off('connect', handleConnect);
        s.off('disconnect', handleDisconnect);
      };
    } else {
      disconnectSocket();
      setIsConnected(false);
    }
  }, [isAuthenticated, accessToken]);

  return { socket: getSocket(), isConnected };
}

// Hook for joining/leaving rooms
export function useSocketRoom(roomType: 'workspace' | 'board' | 'channel' | 'page', roomId: string | undefined) {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket || !isConnected || !roomId) return;

    socket.emit(`${roomType}:join`, roomId);

    return () => {
      socket.emit(`${roomType}:leave`, roomId);
    };
  }, [socket, isConnected, roomType, roomId]);
}

// Hook for real-time events
export function useSocketEvent<T>(event: string, callback: (data: T) => void) {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.on(event, callback);

    return () => {
      socket.off(event, callback);
    };
  }, [socket, isConnected, event, callback]);
}

// Hook for typing indicators
export function useTypingIndicator(channelId: string | undefined) {
  const { socket, isConnected } = useSocket();
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!socket || !isConnected || !channelId) return;

    const handleTypingStarted = (data: { userId: string; channelId: string }) => {
      if (data.channelId === channelId) {
        setTypingUsers((prev) => new Set([...prev, data.userId]));
      }
    };

    const handleTypingStopped = (data: { userId: string; channelId: string }) => {
      if (data.channelId === channelId) {
        setTypingUsers((prev) => {
          const next = new Set(prev);
          next.delete(data.userId);
          return next;
        });
      }
    };

    socket.on('typing:started', handleTypingStarted);
    socket.on('typing:stopped', handleTypingStopped);

    return () => {
      socket.off('typing:started', handleTypingStarted);
      socket.off('typing:stopped', handleTypingStopped);
    };
  }, [socket, isConnected, channelId]);

  const startTyping = useCallback(() => {
    if (socket && channelId) {
      socket.emit('typing:start', { channelId });
    }
  }, [socket, channelId]);

  const stopTyping = useCallback(() => {
    if (socket && channelId) {
      socket.emit('typing:stop', { channelId });
    }
  }, [socket, channelId]);

  return { typingUsers: Array.from(typingUsers), startTyping, stopTyping };
}

// Board-specific hooks
export function useBoardEvents(boardId: string | undefined, handlers: {
  onCardCreated?: (card: any) => void;
  onCardUpdated?: (card: any) => void;
  onCardDeleted?: (data: { cardId: string }) => void;
  onCardMoved?: (data: { cardId: string; fromListId: string; toListId: string; position: number }) => void;
  onListCreated?: (list: any) => void;
  onListUpdated?: (list: any) => void;
  onListDeleted?: (data: { listId: string }) => void;
  onListReordered?: (data: { lists: any[] }) => void;
}) {
  useSocketRoom('board', boardId);

  useSocketEvent('card:created', handlers.onCardCreated || (() => {}));
  useSocketEvent('card:updated', handlers.onCardUpdated || (() => {}));
  useSocketEvent('card:deleted', handlers.onCardDeleted || (() => {}));
  useSocketEvent('card:moved', handlers.onCardMoved || (() => {}));
  useSocketEvent('list:created', handlers.onListCreated || (() => {}));
  useSocketEvent('list:updated', handlers.onListUpdated || (() => {}));
  useSocketEvent('list:deleted', handlers.onListDeleted || (() => {}));
  useSocketEvent('list:reordered', handlers.onListReordered || (() => {}));
}

// Channel-specific hooks
export function useChannelEvents(channelId: string | undefined, handlers: {
  onMessageSent?: (message: any) => void;
  onMessageUpdated?: (message: any) => void;
  onMessageDeleted?: (data: { messageId: string }) => void;
  onReactionAdded?: (data: { messageId: string; reaction: any }) => void;
  onReactionRemoved?: (data: { messageId: string; emoji: string; userId: string }) => void;
}) {
  useSocketRoom('channel', channelId);

  useSocketEvent('message:sent', handlers.onMessageSent || (() => {}));
  useSocketEvent('message:updated', handlers.onMessageUpdated || (() => {}));
  useSocketEvent('message:deleted', handlers.onMessageDeleted || (() => {}));
  useSocketEvent('reaction:added', handlers.onReactionAdded || (() => {}));
  useSocketEvent('reaction:removed', handlers.onReactionRemoved || (() => {}));
}

// Page-specific hooks for collaborative editing
export function usePageEvents(pageId: string | undefined, handlers: {
  onPageUpdated?: (page: any) => void;
  onUserJoined?: (data: { userId: string; pageId: string }) => void;
  onUserLeft?: (data: { userId: string; pageId: string }) => void;
  onCursorMoved?: (data: { userId: string; position: any }) => void;
}) {
  useSocketRoom('page', pageId);

  useSocketEvent('page:updated', handlers.onPageUpdated || (() => {}));
  useSocketEvent('page:user-joined', handlers.onUserJoined || (() => {}));
  useSocketEvent('page:user-left', handlers.onUserLeft || (() => {}));
  useSocketEvent('cursor:moved', handlers.onCursorMoved || (() => {}));
}

// Notification events
export function useNotificationEvents(handlers: {
  onNotification?: (notification: any) => void;
}) {
  useSocketEvent('notification:received', handlers.onNotification || (() => {}));
}
