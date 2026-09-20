import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface OfflineDBSchema extends DBSchema {
  pendingActions: {
    key: string;
    value: PendingAction;
    indexes: { 'by-timestamp': number };
  };
  cachedData: {
    key: string;
    value: CachedItem;
    indexes: { 'by-timestamp': number };
  };
}

interface PendingAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: any;
  timestamp: number;
  retries: number;
}

interface CachedItem {
  key: string;
  data: any;
  timestamp: number;
  expiresAt: number;
}

const DB_NAME = 'saas-app-offline';
const DB_VERSION = 1;

let db: IDBPDatabase<OfflineDBSchema> | null = null;

export async function initOfflineDB(): Promise<IDBPDatabase<OfflineDBSchema>> {
  if (db) return db;

  db = await openDB<OfflineDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(database) {
      // Pending actions store
      const pendingStore = database.createObjectStore('pendingActions', {
        keyPath: 'id',
      });
      pendingStore.createIndex('by-timestamp', 'timestamp');

      // Cached data store
      const cacheStore = database.createObjectStore('cachedData', {
        keyPath: 'key',
      });
      cacheStore.createIndex('by-timestamp', 'timestamp');
    },
  });

  return db;
}

// Pending actions management
export async function addPendingAction(action: Omit<PendingAction, 'id' | 'timestamp' | 'retries'>): Promise<string> {
  const database = await initOfflineDB();
  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  await database.add('pendingActions', {
    ...action,
    id,
    timestamp: Date.now(),
    retries: 0,
  });

  return id;
}

export async function getPendingActions(): Promise<PendingAction[]> {
  const database = await initOfflineDB();
  return database.getAllFromIndex('pendingActions', 'by-timestamp');
}

export async function removePendingAction(id: string): Promise<void> {
  const database = await initOfflineDB();
  await database.delete('pendingActions', id);
}

export async function updatePendingAction(id: string, updates: Partial<PendingAction>): Promise<void> {
  const database = await initOfflineDB();
  const action = await database.get('pendingActions', id);
  if (action) {
    await database.put('pendingActions', { ...action, ...updates });
  }
}

// Cache management
export async function cacheData(key: string, data: any, ttl: number = 3600000): Promise<void> {
  const database = await initOfflineDB();
  await database.put('cachedData', {
    key,
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + ttl,
  });
}

export async function getCachedData<T>(key: string): Promise<T | null> {
  const database = await initOfflineDB();
  const item = await database.get('cachedData', key);

  if (!item) return null;

  if (item.expiresAt < Date.now()) {
    await database.delete('cachedData', key);
    return null;
  }

  return item.data as T;
}

export async function clearExpiredCache(): Promise<void> {
  const database = await initOfflineDB();
  const items = await database.getAll('cachedData');
  const now = Date.now();

  for (const item of items) {
    if (item.expiresAt < now) {
      await database.delete('cachedData', item.key);
    }
  }
}

// Sync manager
class OfflineSyncManager {
  private isOnline: boolean = navigator.onLine;
  private isSyncing: boolean = false;
  private listeners: Set<(online: boolean) => void> = new Set();

  constructor() {
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }

  private handleOnline() {
    this.isOnline = true;
    this.notifyListeners();
    this.syncPendingActions();
  }

  private handleOffline() {
    this.isOnline = false;
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.isOnline));
  }

  onStatusChange(callback: (online: boolean) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  getStatus() {
    return this.isOnline;
  }

  async syncPendingActions() {
    if (this.isSyncing || !this.isOnline) return;

    this.isSyncing = true;
    const actions = await getPendingActions();

    for (const action of actions) {
      try {
        const response = await fetch(action.endpoint, {
          method: action.method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
          body: action.data ? JSON.stringify(action.data) : undefined,
        });

        if (response.ok) {
          await removePendingAction(action.id);
        } else if (response.status >= 400 && response.status < 500) {
          // Client error, don't retry
          await removePendingAction(action.id);
        } else {
          // Server error, increment retries
          if (action.retries >= 3) {
            await removePendingAction(action.id);
          } else {
            await updatePendingAction(action.id, { retries: action.retries + 1 });
          }
        }
      } catch (error) {
        // Network error, will retry on next sync
        if (action.retries >= 3) {
          await removePendingAction(action.id);
        } else {
          await updatePendingAction(action.id, { retries: action.retries + 1 });
        }
      }
    }

    this.isSyncing = false;
  }
}

export const offlineSyncManager = new OfflineSyncManager();

// React hook for offline status
import { useState, useEffect } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const unsubscribe = offlineSyncManager.onStatusChange(setIsOnline);
    return unsubscribe;
  }, []);

  return isOnline;
}

export function useOfflineQueue() {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const checkPending = async () => {
      const actions = await getPendingActions();
      setPendingCount(actions.length);
    };

    checkPending();
    const interval = setInterval(checkPending, 5000);

    return () => clearInterval(interval);
  }, []);

  return pendingCount;
}
