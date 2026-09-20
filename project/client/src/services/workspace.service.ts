import { api, ApiResponse } from './api';
import { normalizeEntity } from '../lib/entity';

export interface User {
  _id?: string;
  id?: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface WorkspaceMember {
  userId?: string | User;
  user?: string | User;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joinedAt: string;
}

export interface Workspace {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  icon?: string;
  members: WorkspaceMember[];
  settings: {
    defaultRole: string;
    isPublic: boolean;
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceStats {
  totalMembers: number;
  totalBoards: number;
  totalChannels: number;
  totalPages: number;
  totalCards: number;
  totalMessages: number;
}

const normalizeWorkspace = (workspace: Workspace): Workspace =>
  normalizeEntity(workspace);

export const workspaceService = {
  getAll: async () => {
    const response = await api.get<ApiResponse<{ workspaces: Workspace[] }>>('/workspaces');
    const workspaces = response.data.data.workspaces.map(normalizeWorkspace);
    response.data.data.workspaces = workspaces;
    return response;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<{ workspace: Workspace }>>(`/workspaces/${id}`);
    response.data.data.workspace = normalizeWorkspace(response.data.data.workspace);
    return response;
  },

  create: async (data: { name: string; description?: string }) => {
    const response = await api.post<ApiResponse<{ workspace: Workspace }>>('/workspaces', data);
    response.data.data.workspace = normalizeWorkspace(response.data.data.workspace);
    return response;
  },

  update: async (id: string, data: Partial<Workspace>) => {
    const response = await api.patch<ApiResponse<{ workspace: Workspace }>>(
      `/workspaces/${id}`,
      data
    );
    response.data.data.workspace = normalizeWorkspace(response.data.data.workspace);
    return response;
  },

  delete: (id: string) =>
    api.delete(`/workspaces/${id}`),

  getStats: (id: string) =>
    api.get<ApiResponse<{ stats: WorkspaceStats }>>(`/workspaces/${id}/stats`),

  addMember: (id: string, data: { email: string; role: string }) =>
    api.post(`/workspaces/${id}/members`, data),

  updateMember: (id: string, userId: string, data: { role: string }) =>
    api.patch(`/workspaces/${id}/members/${userId}`, data),

  removeMember: (id: string, userId: string) =>
    api.delete(`/workspaces/${id}/members/${userId}`),
};
