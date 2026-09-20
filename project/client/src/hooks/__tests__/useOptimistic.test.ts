import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useOptimistic, useOptimisticList, useDebouncedUpdate } from '../useOptimistic';

describe('useOptimistic', () => {
  it('should initialize with initial data', () => {
    const { result } = renderHook(() => useOptimistic({ count: 0 }));

    expect(result.current.data).toEqual({ count: 0 });
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should apply optimistic update immediately', async () => {
    const { result } = renderHook(() => useOptimistic({ count: 0 }));

    act(() => {
      result.current.update(
        { count: 1 },
        () => Promise.resolve({ count: 1 })
      );
    });

    expect(result.current.data.count).toBe(1);
    expect(result.current.isPending).toBe(true);
  });

  it('should update with server response', async () => {
    const { result } = renderHook(() => useOptimistic({ count: 0 }));

    await act(async () => {
      await result.current.update(
        { count: 1 },
        () => Promise.resolve({ count: 5 })
      );
    });

    expect(result.current.data.count).toBe(5);
    expect(result.current.isPending).toBe(false);
  });

  it('should rollback on error', async () => {
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useOptimistic({ count: 0 }, { onError })
    );

    await act(async () => {
      try {
        await result.current.update(
          { count: 1 },
          () => Promise.reject(new Error('Failed'))
        );
      } catch {
        // Expected error
      }
    });

    expect(result.current.data.count).toBe(0);
    expect(result.current.error).toBeTruthy();
    expect(onError).toHaveBeenCalled();
  });

  it('should support function updates', async () => {
    const { result } = renderHook(() => useOptimistic({ count: 0 }));

    await act(async () => {
      await result.current.update(
        (prev) => ({ count: prev.count + 1 }),
        () => Promise.resolve({ count: 1 })
      );
    });

    expect(result.current.data.count).toBe(1);
  });

  it('should reset data', () => {
    const { result } = renderHook(() => useOptimistic({ count: 0 }));

    act(() => {
      result.current.setData({ count: 10 });
    });

    expect(result.current.data.count).toBe(10);

    act(() => {
      result.current.reset();
    });

    expect(result.current.data.count).toBe(0);
  });

  it('should reset to new data', () => {
    const { result } = renderHook(() => useOptimistic({ count: 0 }));

    act(() => {
      result.current.reset({ count: 100 });
    });

    expect(result.current.data.count).toBe(100);
  });

  it('should call onSuccess callback', async () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(() =>
      useOptimistic({ count: 0 }, { onSuccess })
    );

    await act(async () => {
      await result.current.update(
        { count: 1 },
        () => Promise.resolve({ count: 1 })
      );
    });

    expect(onSuccess).toHaveBeenCalledWith({ count: 1 });
  });

  it('should call onSettled callback', async () => {
    const onSettled = vi.fn();
    const { result } = renderHook(() =>
      useOptimistic({ count: 0 }, { onSettled })
    );

    await act(async () => {
      await result.current.update(
        { count: 1 },
        () => Promise.resolve({ count: 1 })
      );
    });

    expect(onSettled).toHaveBeenCalled();
  });
});

describe('useOptimisticList', () => {
  const initialItems = [
    { _id: '1', name: 'Item 1' },
    { _id: '2', name: 'Item 2' },
  ];

  it('should initialize with initial items', () => {
    const { result } = renderHook(() => useOptimisticList(initialItems));

    expect(result.current.items).toEqual(initialItems);
    expect(result.current.isPending).toBe(false);
  });

  it('should add item optimistically', async () => {
    const { result } = renderHook(() => useOptimisticList(initialItems));
    const newItem = { _id: '3', name: 'Item 3' };

    act(() => {
      result.current.addItem(newItem, () => Promise.resolve(newItem));
    });

    expect(result.current.items).toHaveLength(3);
    expect(result.current.items[2]).toEqual(newItem);
  });

  it('should remove item optimistically', async () => {
    const { result } = renderHook(() => useOptimisticList(initialItems));

    act(() => {
      result.current.removeItem('1', () => Promise.resolve());
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]._id).toBe('2');
  });

  it('should update item optimistically', async () => {
    const { result } = renderHook(() => useOptimisticList(initialItems));

    act(() => {
      result.current.updateItem(
        '1',
        { name: 'Updated Item' },
        () => Promise.resolve({ _id: '1', name: 'Updated Item' })
      );
    });

    expect(result.current.items[0].name).toBe('Updated Item');
  });

  it('should reorder items optimistically', async () => {
    const { result } = renderHook(() => useOptimisticList(initialItems));
    const newOrder = [initialItems[1], initialItems[0]];

    act(() => {
      result.current.reorderItems(newOrder, () => Promise.resolve());
    });

    expect(result.current.items[0]._id).toBe('2');
    expect(result.current.items[1]._id).toBe('1');
  });
});

describe('useDebouncedUpdate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with initial data', () => {
    const saveFunction = vi.fn();
    const { result } = renderHook(() =>
      useDebouncedUpdate('initial', saveFunction)
    );

    expect(result.current.data).toBe('initial');
    expect(result.current.isSaving).toBe(false);
  });

  it('should update data immediately', () => {
    const saveFunction = vi.fn();
    const { result } = renderHook(() =>
      useDebouncedUpdate('initial', saveFunction)
    );

    act(() => {
      result.current.update('updated');
    });

    expect(result.current.data).toBe('updated');
  });

  it('should debounce save function', async () => {
    const saveFunction = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useDebouncedUpdate('initial', saveFunction, 1000)
    );

    act(() => {
      result.current.update('update1');
      result.current.update('update2');
      result.current.update('update3');
    });

    expect(saveFunction).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(saveFunction).toHaveBeenCalledTimes(1);
    expect(saveFunction).toHaveBeenCalledWith('update3');
  });

  it('should save immediately with saveNow', async () => {
    const saveFunction = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useDebouncedUpdate('initial', saveFunction, 1000)
    );

    act(() => {
      result.current.update('updated');
    });

    await act(async () => {
      await result.current.saveNow();
    });

    expect(saveFunction).toHaveBeenCalledWith('updated');
  });

  it('should track lastSaved timestamp', async () => {
    const saveFunction = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useDebouncedUpdate('initial', saveFunction, 1000)
    );

    expect(result.current.lastSaved).toBeNull();

    act(() => {
      result.current.update('updated');
    });

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(result.current.lastSaved).toBeInstanceOf(Date);
    });
  });

  it('should handle save errors', async () => {
    const saveFunction = vi.fn().mockRejectedValue(new Error('Save failed'));
    const { result } = renderHook(() =>
      useDebouncedUpdate('initial', saveFunction, 1000)
    );

    act(() => {
      result.current.update('updated');
    });

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
  });
});
