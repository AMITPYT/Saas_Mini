import { api, ApiResponse } from './api';

export interface Page {
  _id: string;
  title: string;
  content?: any;
  workspaceId: string;
  parentId?: string;
  icon?: string;
  cover?: string;
  isFavorite: boolean;
  isArchived: boolean;
  createdBy: string;
  lastEditedBy: string;
  children?: Page[];
  path: string[];
  depth: number;
  createdAt: string;
  updatedAt: string;
}

export const pageService = {
  getByWorkspace: (workspaceId: string, params?: { parentId?: string; favorites?: boolean }) =>
    api.get<ApiResponse<{ pages: Page[] }>>(`/pages/workspace/${workspaceId}`, { params }),

  getById: (id: string) =>
    api.get<ApiResponse<{ page: Page }>>(`/pages/${id}`),

  create: (data: { workspaceId: string; title?: string; parentId?: string; icon?: string }) =>
    api.post<ApiResponse<{ page: Page }>>('/pages', data),

  update: (id: string, data: Partial<Page>) =>
    api.patch<ApiResponse<{ page: Page }>>(`/pages/${id}`, data),

  delete: (id: string) =>
    api.delete(`/pages/${id}`),

  move: (id: string, data: { parentId?: string | null; position?: number }) =>
    api.patch<ApiResponse<{ page: Page }>>(`/pages/${id}/move`, data),

  duplicate: (id: string, includeChildren?: boolean) =>
    api.post<ApiResponse<{ page: Page }>>(`/pages/${id}/duplicate`, { includeChildren }),

  search: (workspaceId: string, query: string) =>
    api.get<ApiResponse<{ pages: Page[] }>>(`/pages/workspace/${workspaceId}/search`, { params: { q: query } }),

  toggleFavorite: (id: string) =>
    api.patch<ApiResponse<{ page: Page }>>(`/pages/${id}`, { isFavorite: true }),
};
