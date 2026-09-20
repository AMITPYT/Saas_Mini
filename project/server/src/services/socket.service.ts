import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import { logger } from '../utils/logger';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  workspaceId?: string;
}

class SocketService {
  private io: Server | null = null;
  private userSockets: Map<string, Set<string>> = new Map();

  initialize(io: Server): void {
    this.io = io;

    // Authentication middleware
    io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

        if (!token) {
          return next(new Error('Authentication required'));
        }

        const payload = verifyAccessToken(token);
        socket.userId = payload.userId;
        next();
      } catch (error) {
        next(new Error('Invalid token'));
      }
    });

    io.on('connection', (socket: AuthenticatedSocket) => {
      const userId = socket.userId!;
      logger.info(`User connected: ${userId}`);

      // Track user's sockets
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(socket.id);

      // Join user's personal room
      socket.join(`user:${userId}`);

      // Handle workspace joining
      socket.on('workspace:join', (workspaceId: string) => {
        socket.workspaceId = workspaceId;
        socket.join(`workspace:${workspaceId}`);
        logger.debug(`User ${userId} joined workspace ${workspaceId}`);
      });

      // Handle workspace leaving
      socket.on('workspace:leave', (workspaceId: string) => {
        socket.leave(`workspace:${workspaceId}`);
        logger.debug(`User ${userId} left workspace ${workspaceId}`);
      });

      // Handle board room
      socket.on('board:join', (boardId: string) => {
        socket.join(`board:${boardId}`);
        logger.debug(`User ${userId} joined board ${boardId}`);
      });

      socket.on('board:leave', (boardId: string) => {
        socket.leave(`board:${boardId}`);
      });

      // Handle channel room
      socket.on('channel:join', (channelId: string) => {
        socket.join(`channel:${channelId}`);
        logger.debug(`User ${userId} joined channel ${channelId}`);
      });

      socket.on('channel:leave', (channelId: string) => {
        socket.leave(`channel:${channelId}`);
      });

      // Handle page room (for collaborative editing)
      socket.on('page:join', (pageId: string) => {
        socket.join(`page:${pageId}`);
        // Notify others that someone joined
        socket.to(`page:${pageId}`).emit('page:user-joined', { userId, pageId });
      });

      socket.on('page:leave', (pageId: string) => {
        socket.leave(`page:${pageId}`);
        socket.to(`page:${pageId}`).emit('page:user-left', { userId, pageId });
      });

      // Handle typing indicators
      socket.on('typing:start', (data: { channelId: string }) => {
        socket.to(`channel:${data.channelId}`).emit('typing:started', {
          userId,
          channelId: data.channelId,
        });
      });

      socket.on('typing:stop', (data: { channelId: string }) => {
        socket.to(`channel:${data.channelId}`).emit('typing:stopped', {
          userId,
          channelId: data.channelId,
        });
      });

      // Handle cursor position for collaborative editing
      socket.on('cursor:move', (data: { pageId: string; position: any }) => {
        socket.to(`page:${data.pageId}`).emit('cursor:moved', {
          userId,
          position: data.position,
        });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        const userSocketSet = this.userSockets.get(userId);
        if (userSocketSet) {
          userSocketSet.delete(socket.id);
          if (userSocketSet.size === 0) {
            this.userSockets.delete(userId);
          }
        }
        logger.info(`User disconnected: ${userId}`);
      });
    });
  }

  // Emit to all users in a workspace
  emitToWorkspace(workspaceId: string, event: string, data: any): void {
    this.io?.to(`workspace:${workspaceId}`).emit(event, data);
  }

  // Emit to specific user
  emitToUser(userId: string, event: string, data: any): void {
    this.io?.to(`user:${userId}`).emit(event, data);
  }

  // Emit to all users in a board
  emitToBoard(boardId: string, event: string, data: any): void {
    this.io?.to(`board:${boardId}`).emit(event, data);
  }

  // Emit to all users in a channel
  emitToChannel(channelId: string, event: string, data: any): void {
    this.io?.to(`channel:${channelId}`).emit(event, data);
  }

  // Emit to all users in a page
  emitToPage(pageId: string, event: string, data: any): void {
    this.io?.to(`page:${pageId}`).emit(event, data);
  }

  // Check if user is online
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0;
  }

  // Get online users in workspace
  getOnlineUsersInWorkspace(workspaceId: string): string[] {
    const room = this.io?.sockets.adapter.rooms.get(`workspace:${workspaceId}`);
    if (!room) return [];

    const onlineUsers: Set<string> = new Set();
    room.forEach((socketId) => {
      const socket = this.io?.sockets.sockets.get(socketId) as AuthenticatedSocket;
      if (socket?.userId) {
        onlineUsers.add(socket.userId);
      }
    });

    return Array.from(onlineUsers);
  }

  // Board events
  boardCreated(workspaceId: string, board: any): void {
    this.emitToWorkspace(workspaceId, 'board:created', board);
  }

  boardUpdated(boardId: string, board: any): void {
    this.emitToBoard(boardId, 'board:updated', board);
  }

  boardDeleted(workspaceId: string, boardId: string): void {
    this.emitToWorkspace(workspaceId, 'board:deleted', { boardId });
  }

  // List events
  listCreated(boardId: string, list: any): void {
    this.emitToBoard(boardId, 'list:created', list);
  }

  listUpdated(boardId: string, list: any): void {
    this.emitToBoard(boardId, 'list:updated', list);
  }

  listDeleted(boardId: string, listId: string): void {
    this.emitToBoard(boardId, 'list:deleted', { listId });
  }

  listReordered(boardId: string, lists: any[]): void {
    this.emitToBoard(boardId, 'list:reordered', { lists });
  }

  // Card events
  cardCreated(boardId: string, card: any): void {
    this.emitToBoard(boardId, 'card:created', card);
  }

  cardUpdated(boardId: string, card: any): void {
    this.emitToBoard(boardId, 'card:updated', card);
  }

  cardDeleted(boardId: string, cardId: string): void {
    this.emitToBoard(boardId, 'card:deleted', { cardId });
  }

  cardMoved(boardId: string, data: { cardId: string; fromListId: string; toListId: string; position: number }): void {
    this.emitToBoard(boardId, 'card:moved', data);
  }

  // Channel events
  channelCreated(workspaceId: string, channel: any): void {
    this.emitToWorkspace(workspaceId, 'channel:created', channel);
  }

  channelUpdated(channelId: string, channel: any): void {
    this.emitToChannel(channelId, 'channel:updated', channel);
  }

  channelDeleted(workspaceId: string, channelId: string): void {
    this.emitToWorkspace(workspaceId, 'channel:deleted', { channelId });
  }

  // Message events
  messageSent(channelId: string, message: any): void {
    this.emitToChannel(channelId, 'message:sent', message);
  }

  messageUpdated(channelId: string, message: any): void {
    this.emitToChannel(channelId, 'message:updated', message);
  }

  messageDeleted(channelId: string, messageId: string): void {
    this.emitToChannel(channelId, 'message:deleted', { messageId });
  }

  reactionAdded(channelId: string, data: { messageId: string; reaction: any }): void {
    this.emitToChannel(channelId, 'reaction:added', data);
  }

  reactionRemoved(channelId: string, data: { messageId: string; emoji: string; userId: string }): void {
    this.emitToChannel(channelId, 'reaction:removed', data);
  }

  // Page events
  pageCreated(workspaceId: string, page: any): void {
    this.emitToWorkspace(workspaceId, 'page:created', page);
  }

  pageUpdated(pageId: string, page: any): void {
    this.emitToPage(pageId, 'page:updated', page);
  }

  pageDeleted(workspaceId: string, pageId: string): void {
    this.emitToWorkspace(workspaceId, 'page:deleted', { pageId });
  }

  // Notification events
  notificationSent(userId: string, notification: any): void {
    this.emitToUser(userId, 'notification:received', notification);
  }

  // Workspace events
  memberJoined(workspaceId: string, member: any): void {
    this.emitToWorkspace(workspaceId, 'member:joined', member);
  }

  memberLeft(workspaceId: string, userId: string): void {
    this.emitToWorkspace(workspaceId, 'member:left', { userId });
  }

  memberUpdated(workspaceId: string, member: any): void {
    this.emitToWorkspace(workspaceId, 'member:updated', member);
  }
}

export const socketService = new SocketService();
