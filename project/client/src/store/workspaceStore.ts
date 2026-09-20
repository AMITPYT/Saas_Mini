import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Workspace } from '../services/workspace.service';
import { getEntityId, normalizeEntity } from '../lib/entity';

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setWorkspaces: (workspaces: Workspace[]) => void;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  addWorkspace: (workspace: Workspace) => void;
  updateWorkspace: (id: string, updates: Partial<Workspace>) => void;
  removeWorkspace: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  workspaces: [],
  currentWorkspace: null,
  isLoading: false,
  error: null,
};

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setWorkspaces: (workspaces) =>
        set({
          workspaces: workspaces.map(normalizeEntity),
          isLoading: false,
          error: null,
        }),

      setCurrentWorkspace: (workspace) =>
        set({ currentWorkspace: workspace ? normalizeEntity(workspace) : null }),

      addWorkspace: (workspace) =>
        set((state) => ({
          workspaces: [...state.workspaces, normalizeEntity(workspace)],
        })),

      updateWorkspace: (id, updates) =>
        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            getEntityId(w) === id ? normalizeEntity({ ...w, ...updates }) : w
          ),
          currentWorkspace:
            state.currentWorkspace && getEntityId(state.currentWorkspace) === id
              ? normalizeEntity({ ...state.currentWorkspace, ...updates })
              : state.currentWorkspace,
        })),

      removeWorkspace: (id) =>
        set((state) => ({
          workspaces: state.workspaces.filter((w) => getEntityId(w) !== id),
          currentWorkspace:
            state.currentWorkspace && getEntityId(state.currentWorkspace) === id
              ? null
              : state.currentWorkspace,
        })),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error, isLoading: false }),

      reset: () => set(initialState),
    }),
    {
      name: 'workspace-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentWorkspace: state.currentWorkspace,
      }),
    }
  )
);
