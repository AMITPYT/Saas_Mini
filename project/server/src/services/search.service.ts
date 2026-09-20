import { Card } from '../models/Card';
import { Page } from '../models/Page';
import { Message } from '../models/Message';
import { Channel } from '../models/Channel';
import { Board } from '../models/Board';
import { workspaceService } from './workspace.service';
import { ApiError } from '../utils/ApiError';
import { cacheService } from './cache.service';

interface SearchResult {
  type: 'card' | 'page' | 'message' | 'channel' | 'board';
  id: string;
  title: string;
  preview: string;
  workspaceId: string;
  parentId?: string;
  parentName?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface SearchOptions {
  types?: ('card' | 'page' | 'message' | 'channel' | 'board')[];
  limit?: number;
  page?: number;
}

class SearchService {
  async search(
    workspaceId: string,
    query: string,
    userId: string,
    options: SearchOptions = {}
  ): Promise<{ results: SearchResult[]; total: number }> {
    // Verify user has access to workspace
    await workspaceService.getWorkspace(workspaceId, userId);

    const { types = ['card', 'page', 'message', 'channel', 'board'], limit = 20, page = 1 } = options;
    const skip = (page - 1) * limit;

    // Check cache
    const cacheKey = `search:${workspaceId}:${query}:${types.join(',')}:${page}:${limit}`;
    const cached = await cacheService.get<{ results: SearchResult[]; total: number }>(cacheKey);
    if (cached) {
      return cached;
    }

    const results: SearchResult[] = [];
    const searchPromises: Promise<void>[] = [];

    // Search cards
    if (types.includes('card')) {
      searchPromises.push(
        this.searchCards(workspaceId, query).then((cards) => {
          results.push(...cards);
        })
      );
    }

    // Search pages
    if (types.includes('page')) {
      searchPromises.push(
        this.searchPages(workspaceId, query).then((pages) => {
          results.push(...pages);
        })
      );
    }

    // Search messages
    if (types.includes('message')) {
      searchPromises.push(
        this.searchMessages(workspaceId, query).then((messages) => {
          results.push(...messages);
        })
      );
    }

    // Search channels
    if (types.includes('channel')) {
      searchPromises.push(
        this.searchChannels(workspaceId, query).then((channels) => {
          results.push(...channels);
        })
      );
    }

    // Search boards
    if (types.includes('board')) {
      searchPromises.push(
        this.searchBoards(workspaceId, query).then((boards) => {
          results.push(...boards);
        })
      );
    }

    await Promise.all(searchPromises);

    // Sort by relevance (updatedAt for now) and paginate
    results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const total = results.length;
    const paginatedResults = results.slice(skip, skip + limit);

    const response = { results: paginatedResults, total };

    // Cache for 5 minutes
    await cacheService.set(cacheKey, response, 300);

    return response;
  }

  private async searchCards(workspaceId: string, query: string): Promise<SearchResult[]> {
    const cards = await Card.find({
      workspaceId,
      isArchived: false,
      $text: { $search: query },
    })
      .select('title description listId createdAt updatedAt')
      .populate('listId', 'name boardId')
      .limit(50)
      .lean();

    return cards.map((card: any) => ({
      type: 'card' as const,
      id: card._id.toString(),
      title: card.title,
      preview: card.description?.substring(0, 150) || '',
      workspaceId,
      parentId: card.listId?.boardId?.toString(),
      parentName: card.listId?.name,
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
    }));
  }

  private async searchPages(workspaceId: string, query: string): Promise<SearchResult[]> {
    const pages = await Page.find({
      workspaceId,
      isArchived: false,
      $text: { $search: query },
    })
      .select('title content parentId createdAt updatedAt')
      .populate('parentId', 'title')
      .limit(50)
      .lean();

    return pages.map((page: any) => ({
      type: 'page' as const,
      id: page._id.toString(),
      title: page.title || 'Untitled',
      preview: this.extractTextPreview(page.content),
      workspaceId,
      parentId: page.parentId?._id?.toString(),
      parentName: page.parentId?.title,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
    }));
  }

  private async searchMessages(workspaceId: string, query: string): Promise<SearchResult[]> {
    // First get channels in workspace
    const channels = await Channel.find({ workspaceId, isArchived: false }).select('_id name').lean();
    const channelIds = channels.map((c) => c._id);
    const channelMap = new Map(channels.map((c) => [c._id.toString(), c.name]));

    const messages = await Message.find({
      channelId: { $in: channelIds },
      isDeleted: false,
      $text: { $search: query },
    })
      .select('content channelId createdAt updatedAt')
      .populate('senderId', 'firstName lastName')
      .limit(50)
      .lean();

    return messages.map((message: any) => ({
      type: 'message' as const,
      id: message._id.toString(),
      title: `Message from ${message.senderId?.firstName || 'Unknown'} ${message.senderId?.lastName || ''}`.trim(),
      preview: message.content?.substring(0, 150) || '',
      workspaceId,
      parentId: message.channelId?.toString(),
      parentName: channelMap.get(message.channelId?.toString()) || 'Unknown Channel',
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    }));
  }

  private async searchChannels(workspaceId: string, query: string): Promise<SearchResult[]> {
    const channels = await Channel.find({
      workspaceId,
      isArchived: false,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
      ],
    })
      .select('name description createdAt updatedAt')
      .limit(20)
      .lean();

    return channels.map((channel) => ({
      type: 'channel' as const,
      id: channel._id.toString(),
      title: channel.name,
      preview: channel.description || '',
      workspaceId,
      createdAt: channel.createdAt,
      updatedAt: channel.updatedAt,
    }));
  }

  private async searchBoards(workspaceId: string, query: string): Promise<SearchResult[]> {
    const boards = await Board.find({
      workspaceId,
      isArchived: false,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
      ],
    })
      .select('name description createdAt updatedAt')
      .limit(20)
      .lean();

    return boards.map((board) => ({
      type: 'board' as const,
      id: board._id.toString(),
      title: board.name,
      preview: board.description || '',
      workspaceId,
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
    }));
  }

  private extractTextPreview(content: any): string {
    if (!content) return '';

    // If content is a string (plain text or HTML)
    if (typeof content === 'string') {
      return content.replace(/<[^>]*>/g, '').substring(0, 150);
    }

    // If content is JSON (like from a rich text editor)
    if (typeof content === 'object') {
      try {
        const text = this.extractTextFromBlocks(content);
        return text.substring(0, 150);
      } catch {
        return '';
      }
    }

    return '';
  }

  private extractTextFromBlocks(blocks: any): string {
    if (!blocks || !Array.isArray(blocks.content)) {
      return '';
    }

    let text = '';
    for (const block of blocks.content) {
      if (block.type === 'paragraph' && block.content) {
        for (const node of block.content) {
          if (node.type === 'text') {
            text += node.text + ' ';
          }
        }
      }
    }
    return text.trim();
  }

  // Quick search for command palette / search bar
  async quickSearch(
    workspaceId: string,
    query: string,
    userId: string
  ): Promise<SearchResult[]> {
    const { results } = await this.search(workspaceId, query, userId, {
      limit: 10,
      types: ['page', 'board', 'channel'],
    });
    return results;
  }

  // Recent items for a user in workspace
  async getRecentItems(
    workspaceId: string,
    userId: string,
    limit: number = 10
  ): Promise<SearchResult[]> {
    await workspaceService.getWorkspace(workspaceId, userId);

    const cacheKey = `recent:${workspaceId}:${userId}`;
    const cached = await cacheService.get<SearchResult[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const results: SearchResult[] = [];

    // Get recent pages
    const recentPages = await Page.find({
      workspaceId,
      isArchived: false,
      $or: [{ createdBy: userId }, { lastEditedBy: userId }],
    })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .select('title content updatedAt createdAt')
      .lean();

    results.push(
      ...recentPages.map((page) => ({
        type: 'page' as const,
        id: page._id.toString(),
        title: page.title || 'Untitled',
        preview: this.extractTextPreview(page.content),
        workspaceId,
        createdAt: page.createdAt,
        updatedAt: page.updatedAt,
      }))
    );

    // Get recent boards
    const recentBoards = await Board.find({
      workspaceId,
      isArchived: false,
    })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .select('name description updatedAt createdAt')
      .lean();

    results.push(
      ...recentBoards.map((board) => ({
        type: 'board' as const,
        id: board._id.toString(),
        title: board.name,
        preview: board.description || '',
        workspaceId,
        createdAt: board.createdAt,
        updatedAt: board.updatedAt,
      }))
    );

    // Sort by updatedAt and limit
    results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    const limitedResults = results.slice(0, limit);

    // Cache for 2 minutes
    await cacheService.set(cacheKey, limitedResults, 120);

    return limitedResults;
  }
}

export const searchService = new SearchService();
