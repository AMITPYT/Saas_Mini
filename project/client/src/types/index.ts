// User types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'member' | 'viewer';
  createdAt: string;
  updatedAt: string;
}

// Workspace types
export interface Workspace {
  id: string;
  name: string;
  description?: string;
  owner: User;
  members: WorkspaceMember[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  user: User;
  role: 'admin' | 'member' | 'viewer';
  joinedAt: string;
}

// Board types (Trello-like)
export interface Board {
  id: string;
  name: string;
  description?: string;
  workspace: string;
  background?: string;
  isArchived: boolean;
  createdBy: User;
  lists: List[];
  createdAt: string;
  updatedAt: string;
}

export interface List {
  id: string;
  name: string;
  board: string;
  position: number;
  cards: Card[];
  createdAt: string;
  updatedAt: string;
}

export interface Card {
  id: string;
  title: string;
  description?: string;
  list: string;
  board: string;
  position: number;
  assignees: User[];
  labels: Label[];
  dueDate?: string;
  attachments: Attachment[];
  comments: Comment[];
  isArchived: boolean;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

// Channel types (Slack-like)
export interface Channel {
  id: string;
  name: string;
  description?: string;
  workspace: string;
  type: 'public' | 'private' | 'direct';
  members: ChannelMember[];
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

export interface ChannelMember {
  user: User;
  role: 'admin' | 'member';
  joinedAt: string;
}

export interface Message {
  id: string;
  content: string;
  channel: string;
  sender: User;
  parentMessage?: string;
  reactions: Reaction[];
  attachments: Attachment[];
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Reaction {
  emoji: string;
  users: string[];
}

// Page types (Notion-like)
export interface Page {
  id: string;
  title: string;
  content: string;
  workspace: string;
  parent?: string;
  icon?: string;
  cover?: string;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

// Common types
export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedBy: User;
  createdAt: string;
}

export interface Comment {
  id: string;
  content: string;
  author: User;
  createdAt: string;
  updatedAt: string;
}

// API types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
