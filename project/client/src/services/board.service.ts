import { api, ApiResponse } from './api';

export interface Board {
  _id: string;
  name: string;
  description?: string;
  workspaceId: string;
  background?: {
    type: 'color' | 'gradient' | 'image';
    value: string;
  };
  isStarred: boolean;
  isArchived: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface List {
  _id: string;
  name: string;
  boardId: string;
  position: number;
  isArchived: boolean;
}

export interface Card {
  _id: string;
  title: string;
  description?: string;
  listId: string;
  boardId: string;
  workspaceId: string;
  position: number;
  labels: Array<{ color: string; name: string }>;
  dueDate?: string;
  assignees: string[];
  attachments: any[];
  checklists: Array<{
    _id: string;
    name: string;
    items: Array<{
      _id: string;
      text: string;
      isCompleted: boolean;
    }>;
  }>;
  comments: Array<{
    _id: string;
    content: string;
    userId: any;
    createdAt: string;
  }>;
  isArchived: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export const boardService = {
  getByWorkspace: (workspaceId: string) =>
    api.get<ApiResponse<{ boards: Board[] }>>(`/boards/workspace/${workspaceId}`),

  getById: (id: string) =>
    api.get<ApiResponse<{ board: Board; lists: List[] }>>(`/boards/${id}`),

  create: (data: { name: string; workspaceId: string; description?: string }) =>
    api.post<ApiResponse<{ board: Board }>>('/boards', data),

  update: (id: string, data: Partial<Board>) =>
    api.patch<ApiResponse<{ board: Board }>>(`/boards/${id}`, data),

  delete: (id: string) =>
    api.delete(`/boards/${id}`),

  // Lists
  createList: (boardId: string, data: { name: string }) =>
    api.post<ApiResponse<{ list: List }>>(`/boards/${boardId}/lists`, data),

  updateList: (boardId: string, listId: string, data: Partial<List>) =>
    api.patch<ApiResponse<{ list: List }>>(`/boards/${boardId}/lists/${listId}`, data),

  deleteList: (boardId: string, listId: string) =>
    api.delete(`/boards/${boardId}/lists/${listId}`),

  reorderLists: (boardId: string, listIds: string[]) =>
    api.patch(`/boards/${boardId}/lists/reorder`, { listIds }),
};

export const cardService = {
  getByList: (listId: string) =>
    api.get<ApiResponse<{ cards: Card[] }>>(`/cards/list/${listId}`),

  getById: (id: string) =>
    api.get<ApiResponse<{ card: Card }>>(`/cards/${id}`),

  create: (data: { title: string; listId: string; description?: string }) =>
    api.post<ApiResponse<{ card: Card }>>('/cards', data),

  update: (id: string, data: Partial<Card>) =>
    api.patch<ApiResponse<{ card: Card }>>(`/cards/${id}`, data),

  delete: (id: string) =>
    api.delete(`/cards/${id}`),

  move: (id: string, data: { listId: string; position: number }) =>
    api.patch<ApiResponse<{ card: Card }>>(`/cards/${id}/move`, data),

  // Comments
  addComment: (cardId: string, content: string) =>
    api.post(`/cards/${cardId}/comments`, { content }),

  deleteComment: (cardId: string, commentId: string) =>
    api.delete(`/cards/${cardId}/comments/${commentId}`),

  // Checklists
  addChecklist: (cardId: string, name: string) =>
    api.post(`/cards/${cardId}/checklists`, { name }),

  addChecklistItem: (cardId: string, checklistId: string, text: string) =>
    api.post(`/cards/${cardId}/checklists/${checklistId}/items`, { text }),

  updateChecklistItem: (cardId: string, checklistId: string, itemId: string, data: { isCompleted?: boolean; text?: string }) =>
    api.patch(`/cards/${cardId}/checklists/${checklistId}/items/${itemId}`, data),

  deleteChecklistItem: (cardId: string, checklistId: string, itemId: string) =>
    api.delete(`/cards/${cardId}/checklists/${checklistId}/items/${itemId}`),

  deleteChecklist: (cardId: string, checklistId: string) =>
    api.delete(`/cards/${cardId}/checklists/${checklistId}`),
};
