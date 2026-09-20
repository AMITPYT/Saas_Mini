import { useState, useCallback, useRef } from 'react';

interface OptimisticState<T> {
  data: T;
  isPending: boolean;
  error: Error | null;
}

interface OptimisticOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error, rollback: T) => void;
  onSettled?: () => void;
}

/**
 * Hook for optimistic updates
 * Updates UI immediately, then syncs with server
 */
export function useOptimistic<T>(
  initialData: T,
  options: OptimisticOptions<T> = {}
) {
  const [state, setState] = useState<OptimisticState<T>>({
    data: initialData,
    isPending: false,
    error: null,
  });

  const rollbackRef = useRef<T>(initialData);

  const update = useCallback(
    async (
      optimisticUpdate: T | ((prev: T) => T),
      serverUpdate: () => Promise<T>
    ) => {
      // Store current state for rollback
      rollbackRef.current = state.data;

      // Apply optimistic update immediately
      const newData =
        typeof optimisticUpdate === 'function'
          ? (optimisticUpdate as (prev: T) => T)(state.data)
          : optimisticUpdate;

      setState((prev) => ({
        ...prev,
        data: newData,
        isPending: true,
        error: null,
      }));

      try {
        // Sync with server
        const serverData = await serverUpdate();

        setState((prev) => ({
          ...prev,
          data: serverData,
          isPending: false,
        }));

        options.onSuccess?.(serverData);
        return serverData;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        // Rollback on error
        setState((prev) => ({
          ...prev,
          data: rollbackRef.current,
          isPending: false,
          error: err,
        }));

        options.onError?.(err, rollbackRef.current);
        throw error;
      } finally {
        options.onSettled?.();
      }
    },
    [state.data, options]
  );

  const reset = useCallback((newData?: T) => {
    setState({
      data: newData ?? initialData,
      isPending: false,
      error: null,
    });
  }, [initialData]);

  return {
    data: state.data,
    isPending: state.isPending,
    error: state.error,
    update,
    reset,
    setData: (data: T) => setState((prev) => ({ ...prev, data })),
  };
}

/**
 * Hook for optimistic list operations (add, remove, update)
 */
export function useOptimisticList<T extends { _id: string }>(
  initialItems: T[],
  options: OptimisticOptions<T[]> = {}
) {
  const { data, isPending, error, update, reset, setData } = useOptimistic(
    initialItems,
    options
  );

  const addItem = useCallback(
    async (
      item: T,
      serverAdd: () => Promise<T>
    ) => {
      return update(
        (prev) => [...prev, item],
        async () => {
          const serverItem = await serverAdd();
          return data.map((i) => (i._id === item._id ? serverItem : i));
        }
      );
    },
    [data, update]
  );

  const removeItem = useCallback(
    async (
      itemId: string,
      serverRemove: () => Promise<void>
    ) => {
      return update(
        (prev) => prev.filter((item) => item._id !== itemId),
        async () => {
          await serverRemove();
          return data.filter((item) => item._id !== itemId);
        }
      );
    },
    [data, update]
  );

  const updateItem = useCallback(
    async (
      itemId: string,
      updates: Partial<T>,
      serverUpdate: () => Promise<T>
    ) => {
      return update(
        (prev) =>
          prev.map((item) =>
            item._id === itemId ? { ...item, ...updates } : item
          ),
        async () => {
          const serverItem = await serverUpdate();
          return data.map((item) =>
            item._id === itemId ? serverItem : item
          );
        }
      );
    },
    [data, update]
  );

  const reorderItems = useCallback(
    async (
      newOrder: T[],
      serverReorder: () => Promise<void>
    ) => {
      return update(
        newOrder,
        async () => {
          await serverReorder();
          return newOrder;
        }
      );
    },
    [update]
  );

  return {
    items: data,
    isPending,
    error,
    addItem,
    removeItem,
    updateItem,
    reorderItems,
    reset,
    setItems: setData,
  };
}

/**
 * Hook for debounced updates (useful for autosave)
 */
export function useDebouncedUpdate<T>(
  initialData: T,
  saveFunction: (data: T) => Promise<void>,
  delay: number = 1000
) {
  const [data, setData] = useState(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const update = useCallback(
    (newData: T | ((prev: T) => T)) => {
      const updatedData =
        typeof newData === 'function'
          ? (newData as (prev: T) => T)(data)
          : newData;

      setData(updatedData);
      setError(null);

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout for save
      timeoutRef.current = setTimeout(async () => {
        setIsSaving(true);
        try {
          await saveFunction(updatedData);
          setLastSaved(new Date());
        } catch (err) {
          setError(err instanceof Error ? err : new Error(String(err)));
        } finally {
          setIsSaving(false);
        }
      }, delay);
    },
    [data, delay, saveFunction]
  );

  const saveNow = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsSaving(true);
    try {
      await saveFunction(data);
      setLastSaved(new Date());
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [data, saveFunction]);

  return {
    data,
    update,
    saveNow,
    isSaving,
    lastSaved,
    error,
  };
}
