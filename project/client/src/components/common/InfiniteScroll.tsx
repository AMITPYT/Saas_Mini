import { useEffect, useRef, useCallback, useState, ReactNode } from 'react';

interface InfiniteScrollProps {
  children: ReactNode;
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  threshold?: number;
  direction?: 'down' | 'up';
  loader?: ReactNode;
  endMessage?: ReactNode;
  className?: string;
}

export const InfiniteScroll: React.FC<InfiniteScrollProps> = ({
  children,
  hasMore,
  isLoading,
  onLoadMore,
  threshold = 100,
  direction = 'down',
  loader,
  endMessage,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !isLoading) {
        onLoadMore();
      }
    },
    [hasMore, isLoading, onLoadMore]
  );

  useEffect(() => {
    observerRef.current = new IntersectionObserver(handleObserver, {
      root: containerRef.current,
      rootMargin: `${threshold}px`,
      threshold: 0,
    });

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver, threshold]);

  const defaultLoader = (
    <div className="flex justify-center py-4">
      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-600"></div>
    </div>
  );

  const defaultEndMessage = (
    <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
      No more items to load
    </div>
  );

  return (
    <div ref={containerRef} className={className}>
      {direction === 'up' && (
        <div ref={loadMoreRef}>
          {isLoading && (loader || defaultLoader)}
          {!hasMore && !isLoading && (endMessage || defaultEndMessage)}
        </div>
      )}

      {children}

      {direction === 'down' && (
        <div ref={loadMoreRef}>
          {isLoading && (loader || defaultLoader)}
          {!hasMore && !isLoading && (endMessage || defaultEndMessage)}
        </div>
      )}
    </div>
  );
};

// Hook for infinite scroll functionality
export const useInfiniteScroll = <T,>(
  fetchFn: (cursor?: string) => Promise<{ data: T[]; nextCursor?: string; hasMore: boolean }>,
  deps: any[] = []
) => {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchFn(cursor);
      setData((prev) => [...prev, ...result.data]);
      setCursor(result.nextCursor);
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more');
    } finally {
      setIsLoading(false);
    }
  }, [cursor, fetchFn, hasMore, isLoading]);

  const reset = useCallback(() => {
    setData([]);
    setCursor(undefined);
    setHasMore(true);
    setError(null);
  }, []);

  useEffect(() => {
    reset();
    loadMore();
  }, deps);

  return {
    data,
    isLoading,
    hasMore,
    error,
    loadMore,
    reset,
    setData,
  };
};
