import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useWorkspaceStore } from '../workspaceStore';

// Mock localStorage
const localStorageMock = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => localStorageMock.store[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageMock.store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageMock.store[key];
  }),
  clear: vi.fn(() => {
    localStorageMock.store = {};
  }),
};

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('workspaceStore', () => {
  const mockWorkspace = {
    _id: '1',
    name: 'Test Workspace',
    description: 'A test workspace',
    owner: 'user1',
    members: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    useWorkspaceStore.setState({
      workspaces: [],
      currentWorkspace: null,
      isLoading: false,
    });
    localStorageMock.clear();
  });

  it('should have initial state', () => {
    const state = useWorkspaceStore.getState();

    expect(state.workspaces).toEqual([]);
    expect(state.currentWorkspace).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  it('should set workspaces', () => {
    useWorkspaceStore.getState().setWorkspaces([mockWorkspace]);

    const state = useWorkspaceStore.getState();
    expect(state.workspaces).toHaveLength(1);
    expect(state.workspaces[0]).toEqual(mockWorkspace);
  });

  it('should set current workspace', () => {
    useWorkspaceStore.getState().setCurrentWorkspace(mockWorkspace);

    expect(useWorkspaceStore.getState().currentWorkspace).toEqual(mockWorkspace);
  });

  it('should add workspace', () => {
    useWorkspaceStore.getState().setWorkspaces([mockWorkspace]);

    const newWorkspace = {
      ...mockWorkspace,
      _id: '2',
      name: 'New Workspace',
    };
    useWorkspaceStore.getState().addWorkspace(newWorkspace);

    const state = useWorkspaceStore.getState();
    expect(state.workspaces).toHaveLength(2);
    expect(state.workspaces[1].name).toBe('New Workspace');
  });

  it('should update workspace', () => {
    useWorkspaceStore.getState().setWorkspaces([mockWorkspace]);
    useWorkspaceStore.getState().updateWorkspace('1', { name: 'Updated Workspace' });

    const state = useWorkspaceStore.getState();
    expect(state.workspaces[0].name).toBe('Updated Workspace');
  });

  it('should update current workspace if it matches', () => {
    useWorkspaceStore.getState().setWorkspaces([mockWorkspace]);
    useWorkspaceStore.getState().setCurrentWorkspace(mockWorkspace);
    useWorkspaceStore.getState().updateWorkspace('1', { name: 'Updated Workspace' });

    expect(useWorkspaceStore.getState().currentWorkspace?.name).toBe('Updated Workspace');
  });

  it('should remove workspace', () => {
    useWorkspaceStore.getState().setWorkspaces([mockWorkspace]);
    useWorkspaceStore.getState().removeWorkspace('1');

    expect(useWorkspaceStore.getState().workspaces).toHaveLength(0);
  });

  it('should clear current workspace if removed', () => {
    useWorkspaceStore.getState().setWorkspaces([mockWorkspace]);
    useWorkspaceStore.getState().setCurrentWorkspace(mockWorkspace);
    useWorkspaceStore.getState().removeWorkspace('1');

    expect(useWorkspaceStore.getState().currentWorkspace).toBeNull();
  });

  it('should set loading state', () => {
    useWorkspaceStore.getState().setLoading(true);
    expect(useWorkspaceStore.getState().isLoading).toBe(true);

    useWorkspaceStore.getState().setLoading(false);
    expect(useWorkspaceStore.getState().isLoading).toBe(false);
  });
});
