import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { InfiniteScroll, useInfiniteScroll } from '../InfiniteScroll';
import { renderHook, act } from '@testing-library/react';

describe('InfiniteScroll', () => {
  const mockOnLoadMore = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children', () => {
    render(
      <InfiniteScroll
        hasMore={true}
        isLoading={false}
        onLoadMore={mockOnLoadMore}
      >
        <div data-testid="child">Child content</div>
      </InfiniteScroll>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('should show loader when loading', () => {
    render(
      <InfiniteScroll
        hasMore={true}
        isLoading={true}
        onLoadMore={mockOnLoadMore}
      >
        <div>Content</div>
      </InfiniteScroll>
    );

    expect(screen.getByRole('status', { hidden: true }) || document.querySelector('.animate-spin')).toBeTruthy();
  });

  it('should show end message when no more items', () => {
    render(
      <InfiniteScroll
        hasMore={false}
        isLoading={false}
        onLoadMore={mockOnLoadMore}
      >
        <div>Content</div>
      </InfiniteScroll>
    );

    expect(screen.getByText(/no more items/i)).toBeInTheDocument();
  });

  it('should show custom loader', () => {
    render(
      <InfiniteScroll
        hasMore={true}
        isLoading={true}
        onLoadMore={mockOnLoadMore}
        loader={<div data-testid="custom-loader">Loading...</div>}
      >
        <div>Content</div>
      </InfiniteScroll>
    );

    expect(screen.getByTestId('custom-loader')).toBeInTheDocument();
  });

  it('should show custom end message', () => {
    render(
      <InfiniteScroll
        hasMore={false}
        isLoading={false}
        onLoadMore={mockOnLoadMore}
        endMessage={<div data-testid="custom-end">That's all!</div>}
      >
        <div>Content</div>
      </InfiniteScroll>
    );

    expect(screen.getByTestId('custom-end')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <InfiniteScroll
        hasMore={true}
        isLoading={false}
        onLoadMore={mockOnLoadMore}
        className="custom-class"
      >
        <div>Content</div>
      </InfiniteScroll>
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});

describe('useInfiniteScroll', () => {
  it('should initialize with empty data', () => {
    const fetchFn = vi.fn().mockResolvedValue({
      data: [],
      hasMore: false,
    });

    const { result } = renderHook(() => useInfiniteScroll(fetchFn, []));

    expect(result.current.data).toEqual([]);
    expect(result.current.hasMore).toBe(true);
  });

  it('should load data on mount', async () => {
    const mockData = [{ id: 1 }, { id: 2 }];
    const fetchFn = vi.fn().mockResolvedValue({
      data: mockData,
      hasMore: true,
      nextCursor: 'cursor123',
    });

    const { result } = renderHook(() => useInfiniteScroll(fetchFn, []));

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData);
    });

    expect(fetchFn).toHaveBeenCalledWith(undefined);
  });

  it('should handle errors', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useInfiniteScroll(fetchFn, []));

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
  });

  it('should reset data', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      data: [{ id: 1 }],
      hasMore: false,
    });

    const { result } = renderHook(() => useInfiniteScroll(fetchFn, []));

    await waitFor(() => {
      expect(result.current.data).toHaveLength(1);
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toEqual([]);
  });
});
