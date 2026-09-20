import { getRedisClient } from '../config/redis';
import { logger } from '../utils/logger';

const DEFAULT_TTL = 300; // 5 minutes

class CacheService {
  private getClient() {
    try {
      return getRedisClient();
    } catch {
      return null;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const client = this.getClient();
    if (!client) return null;

    try {
      const data = await client.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: unknown, ttl: number = DEFAULT_TTL): Promise<void> {
    const client = this.getClient();
    if (!client) return;

    try {
      await client.setEx(key, ttl, JSON.stringify(value));
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    const client = this.getClient();
    if (!client) return;

    try {
      await client.del(key);
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    const client = this.getClient();
    if (!client) return;

    try {
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(keys);
      }
    } catch (error) {
      logger.error(`Cache delete pattern error for ${pattern}:`, error);
    }
  }

  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = DEFAULT_TTL
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetchFn();
    await this.set(key, data, ttl);
    return data;
  }

  // Workspace cache helpers
  workspaceKey(id: string): string {
    return `workspace:${id}`;
  }

  workspaceListKey(userId: string): string {
    return `workspaces:user:${userId}`;
  }

  async invalidateWorkspace(workspaceId: string): Promise<void> {
    await this.del(this.workspaceKey(workspaceId));
    await this.delPattern('workspaces:user:*');
  }

  // Board cache helpers
  boardKey(id: string): string {
    return `board:${id}`;
  }

  boardListKey(workspaceId: string): string {
    return `boards:workspace:${workspaceId}`;
  }

  async invalidateBoard(boardId: string, workspaceId: string): Promise<void> {
    await this.del(this.boardKey(boardId));
    await this.del(this.boardListKey(workspaceId));
  }

  // Channel cache helpers
  channelKey(id: string): string {
    return `channel:${id}`;
  }

  channelListKey(workspaceId: string): string {
    return `channels:workspace:${workspaceId}`;
  }

  async invalidateChannel(channelId: string, workspaceId: string): Promise<void> {
    await this.del(this.channelKey(channelId));
    await this.del(this.channelListKey(workspaceId));
  }

  // User cache helpers
  userKey(id: string): string {
    return `user:${id}`;
  }

  async invalidateUser(userId: string): Promise<void> {
    await this.del(this.userKey(userId));
  }

  // Session/Auth cache helpers
  async blacklistToken(userId: string, ttl: number = 900): Promise<void> {
    const client = this.getClient();
    if (!client) return;

    try {
      await client.setEx(`blacklist:user:${userId}`, ttl, 'true');
    } catch (error) {
      logger.error('Failed to blacklist token:', error);
    }
  }

  async isTokenBlacklisted(userId: string): Promise<boolean> {
    const client = this.getClient();
    if (!client) return false;

    try {
      const result = await client.get(`blacklist:user:${userId}`);
      return result === 'true';
    } catch (error) {
      logger.error('Failed to check token blacklist:', error);
      return false;
    }
  }

  // Rate limiting helpers
  async incrementRateLimit(key: string, windowMs: number): Promise<number> {
    const client = this.getClient();
    if (!client) return 0;

    try {
      const current = await client.incr(key);
      if (current === 1) {
        await client.pExpire(key, windowMs);
      }
      return current;
    } catch (error) {
      logger.error('Rate limit increment error:', error);
      return 0;
    }
  }

  // Online users tracking
  async setUserOnline(userId: string, socketId: string): Promise<void> {
    const client = this.getClient();
    if (!client) return;

    try {
      await client.hSet('online_users', userId, socketId);
    } catch (error) {
      logger.error('Failed to set user online:', error);
    }
  }

  async setUserOffline(userId: string): Promise<void> {
    const client = this.getClient();
    if (!client) return;

    try {
      await client.hDel('online_users', userId);
    } catch (error) {
      logger.error('Failed to set user offline:', error);
    }
  }

  async getOnlineUsers(): Promise<Record<string, string>> {
    const client = this.getClient();
    if (!client) return {};

    try {
      return await client.hGetAll('online_users');
    } catch (error) {
      logger.error('Failed to get online users:', error);
      return {};
    }
  }

  async isUserOnline(userId: string): Promise<boolean> {
    const client = this.getClient();
    if (!client) return false;

    try {
      const result = await client.hGet('online_users', userId);
      return !!result;
    } catch (error) {
      logger.error('Failed to check user online status:', error);
      return false;
    }
  }
}

export const cacheService = new CacheService();
