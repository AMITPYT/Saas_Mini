import { useOnlineStatus, useOfflineQueue } from '../../lib/offline';
import { WifiIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const pendingCount = useOfflineQueue();

  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <div
      className={clsx(
        'fixed bottom-4 left-4 z-50 flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg',
        isOnline
          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200'
          : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'
      )}
    >
      {isOnline ? (
        <>
          <CloudArrowUpIcon className="w-5 h-5 animate-pulse" />
          <span className="text-sm font-medium">
            Syncing {pendingCount} pending {pendingCount === 1 ? 'change' : 'changes'}...
          </span>
        </>
      ) : (
        <>
          <ExclamationTriangleIcon className="w-5 h-5" />
          <span className="text-sm font-medium">
            You're offline. Changes will sync when you reconnect.
          </span>
          {pendingCount > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-red-200 dark:bg-red-800 rounded-full text-xs font-bold">
              {pendingCount}
            </span>
          )}
        </>
      )}
    </div>
  );
};

// Connection status indicator for header
export const ConnectionStatus: React.FC = () => {
  const isOnline = useOnlineStatus();

  return (
    <div
      className={clsx(
        'flex items-center gap-1 px-2 py-1 rounded-full text-xs',
        isOnline
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      )}
      title={isOnline ? 'Connected' : 'Offline'}
    >
      <span
        className={clsx(
          'w-2 h-2 rounded-full',
          isOnline ? 'bg-green-500' : 'bg-red-500',
          isOnline && 'animate-pulse'
        )}
      />
      {!isOnline && <span>Offline</span>}
    </div>
  );
};
