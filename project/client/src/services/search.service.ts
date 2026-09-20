import { api, ApiResponse } from './api';

export interface SearchResult {
  type: 'card' | 'page' | 'message' | 'channel' | 'board';
  id: string;
  title: string;
  preview: string;
  workspaceId: string;
  parentId?: string;
  parentName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
}

export const searchService = {
  search: (workspaceId: string, query: string, options?: { types?: string[]; page?: number; limit?: number }) =>
    api.get<ApiResponse<SearchResponse>>(`/search/${workspaceId}`, {
      params: {
        q: query,
        types: options?.types?.join(','),
        page: options?.page,
        limit: options?.limit,
      },
    }),

  quickSearch: (workspaceId: string, query: string) =>
    api.get<ApiResponse<{ results: SearchResult[] }>>(`/search/${workspaceId}/quick`, {
      params: { q: query },
    }),

  getRecent: (workspaceId: string, limit?: number) =>
    api.get<ApiResponse<{ results: SearchResult[] }>>(`/search/${workspaceId}/recent`, {
      params: { limit },
    }),
};
