import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OfflineIndicator, ConnectionStatus } from '../OfflineIndicator';

// Mock the offline hooks
vi.mock('../../../lib/offline', () => ({
  useOnlineStatus: vi.fn(),
  useOfflineQueue: vi.fn(),
}));

import { useOnlineStatus, useOfflineQueue } from '../../../lib/offline';

describe('OfflineIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when online and no pending changes', () => {
    vi.mocked(useOnlineStatus).mockReturnValue(true);
    vi.mocked(useOfflineQueue).mockReturnValue(0);

    const { container } = render(<OfflineIndicator />);

    expect(container.firstChild).toBeNull();
  });

  it('should show syncing indicator when online with pending changes', () => {
    vi.mocked(useOnlineStatus).mockReturnValue(true);
    vi.mocked(useOfflineQueue).mockReturnValue(3);

    render(<OfflineIndicator />);

    expect(screen.getByText(/syncing 3 pending changes/i)).toBeInTheDocument();
  });

  it('should show singular form for single pending change', () => {
    vi.mocked(useOnlineStatus).mockReturnValue(true);
    vi.mocked(useOfflineQueue).mockReturnValue(1);

    render(<OfflineIndicator />);

    expect(screen.getByText(/syncing 1 pending change\.\.\./i)).toBeInTheDocument();
  });

  it('should show offline indicator when offline', () => {
    vi.mocked(useOnlineStatus).mockReturnValue(false);
    vi.mocked(useOfflineQueue).mockReturnValue(0);

    render(<OfflineIndicator />);

    expect(screen.getByText(/you're offline/i)).toBeInTheDocument();
  });

  it('should show pending count badge when offline with pending changes', () => {
    vi.mocked(useOnlineStatus).mockReturnValue(false);
    vi.mocked(useOfflineQueue).mockReturnValue(5);

    render(<OfflineIndicator />);

    expect(screen.getByText('5')).toBeInTheDocument();
  });
});

describe('ConnectionStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show connected status when online', () => {
    vi.mocked(useOnlineStatus).mockReturnValue(true);

    render(<ConnectionStatus />);

    const indicator = screen.getByTitle('Connected');
    expect(indicator).toBeInTheDocument();
  });

  it('should show offline status when offline', () => {
    vi.mocked(useOnlineStatus).mockReturnValue(false);

    render(<ConnectionStatus />);

    expect(screen.getByText('Offline')).toBeInTheDocument();
    expect(screen.getByTitle('Offline')).toBeInTheDocument();
  });

  it('should have green color when online', () => {
    vi.mocked(useOnlineStatus).mockReturnValue(true);

    render(<ConnectionStatus />);

    const indicator = screen.getByTitle('Connected');
    expect(indicator.className).toContain('green');
  });

  it('should have red color when offline', () => {
    vi.mocked(useOnlineStatus).mockReturnValue(false);

    render(<ConnectionStatus />);

    const indicator = screen.getByTitle('Offline');
    expect(indicator.className).toContain('red');
  });
});
