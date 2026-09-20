import { api, ApiResponse, PaginatedResponse } from './api';

export interface Channel {
  _id: string;
  name: string;
  description?: string;
  workspaceId: string;
  type: 'public' | 'private' | 'direct';
  members: string[];
  createdBy: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  content: string;
  channelId: string;
  senderId: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  attachments: Array<{
    _id: string;
    url: string;
    filename: string;
    mimeType: string;
  }>;
  reactions: Array<{
    emoji: string;
    users: string[];
  }>;
  isEdited: boolean;
  isPinned: boolean;
  threadId?: string;
  replyCount: number;
  createdAt: string;
  updatedAt: string;
}

export const channelService = {
  getByWorkspace: (workspaceId: string) =>
    api.get<ApiResponse<{ channels: Channel[] }>>(`/channels/workspace/${workspaceId}`),

  getById: (id: string) =>
    api.get<ApiResponse<{ channel: Channel }>>(`/channels/${id}`),

  create: (data: { name: string; workspaceId: string; type?: string; description?: string }) =>
    api.post<ApiResponse<{ channel: Channel }>>('/channels', data),

  update: (id: string, data: Partial<Channel>) =>
    api.patch<ApiResponse<{ channel: Channel }>>(`/channels/${id}`, data),

  delete: (id: string) =>
    api.delete(`/channels/${id}`),

  addMember: (channelId: string, userId: string) =>
    api.post(`/channels/${channelId}/members`, { userId }),

  removeMember: (channelId: string, userId: string) =>
    api.delete(`/channels/${channelId}/members/${userId}`),

  // Messages
  getMessages: (channelId: string, params?: { before?: string; limit?: number }) =>
    api.get<PaginatedResponse<Message>>(`/channels/${channelId}/messages`, { params }),

  sendMessage: (channelId: string, content: string, attachments?: string[]) =>
    api.post<ApiResponse<{ message: Message }>>(`/channels/${channelId}/messages`, { content, attachments }),

  updateMessage: (channelId: string, messageId: string, content: string) =>
    api.patch(`/channels/${channelId}/messages/${messageId}`, { content }),

  deleteMessage: (channelId: string, messageId: string) =>
    api.delete(`/channels/${channelId}/messages/${messageId}`),

  // Reactions
  addReaction: (channelId: string, messageId: string, emoji: string) =>
    api.post(`/channels/${channelId}/messages/${messageId}/reactions`, { emoji }),

  removeReaction: (channelId: string, messageId: string, emoji: string) =>
    api.delete(`/channels/${channelId}/messages/${messageId}/reactions/${emoji}`),

  // Thread
  getThreadMessages: (channelId: string, messageId: string) =>
    api.get<ApiResponse<{ messages: Message[] }>>(`/channels/${channelId}/messages/${messageId}/thread`),

  replyToThread: (channelId: string, messageId: string, content: string) =>
    api.post<ApiResponse<{ message: Message }>>(`/channels/${channelId}/messages/${messageId}/thread`, { content }),

  // Pins
  pinMessage: (channelId: string, messageId: string) =>
    api.post(`/channels/${channelId}/messages/${messageId}/pin`),

  unpinMessage: (channelId: string, messageId: string) =>
    api.delete(`/channels/${channelId}/messages/${messageId}/pin`),

  getPinnedMessages: (channelId: string) =>
    api.get<ApiResponse<{ messages: Message[] }>>(`/channels/${channelId}/pins`),
};
