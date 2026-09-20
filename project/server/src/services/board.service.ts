import mongoose from 'mongoose';
import { Board, IBoardDocument } from '../models/Board';
import { List, IListDocument } from '../models/List';
import { Card } from '../models/Card';
import { Workspace } from '../models/Workspace';
import { AuditLog } from '../models/AuditLog';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import {
  CreateBoardInput,
  UpdateBoardInput,
  CreateListInput,
  UpdateListInput,
} from '../validators/board.validator';

class BoardService {
  async createBoard(
    data: CreateBoardInput,
    userId: string
  ): Promise<IBoardDocument> {
    // Verify workspace access
    const workspace = await Workspace.findById(data.workspaceId);
    if (!workspace) {
      throw ApiError.notFound('Workspace not found');
    }

    if (!workspace.isMember(userId)) {
      throw ApiError.forbidden('Access denied');
    }

    const role = workspace.getMemberRole(userId);
    if (role === 'viewer') {
      throw ApiError.forbidden('Viewers cannot create boards');
    }

    // Get max position
    const lastBoard = await Board.findOne({ workspace: data.workspaceId })
      .sort({ position: -1 })
      .select('position');

    const board = await Board.create({
      name: data.name,
      description: data.description,
      workspace: data.workspaceId,
      background: data.background || { type: 'color', value: '#0079bf' },
      createdBy: userId,
      position: (lastBoard?.position ?? -1) + 1,
    });

    // Create default lists
    const defaultLists = ['To Do', 'In Progress', 'Done'];
    await List.insertMany(
      defaultLists.map((name, index) => ({
        name,
        board: board._id,
        position: index,
        createdBy: userId,
      }))
    );

    await this.logAudit(userId, 'board.create', board._id.toString(), data.workspaceId, {
      name: board.name,
    });

    return board;
  }

  async getBoard(boardId: string, userId: string): Promise<IBoardDocument> {
    const board = await Board.findById(boardId)
      .populate('createdBy', 'name email avatar')
      .populate({
        path: 'lists',
        match: { isArchived: false },
        options: { sort: { position: 1 } },
        populate: {
          path: 'cards',
          match: { isArchived: false },
          options: { sort: { position: 1 } },
          populate: [
            { path: 'assignees', select: 'name email avatar' },
            { path: 'createdBy', select: 'name email avatar' },
          ],
        },
      });

    if (!board) {
      throw ApiError.notFound('Board not found');
    }

    // Verify workspace access
    const workspace = await Workspace.findById(board.workspace);
    if (!workspace || !workspace.isMember(userId)) {
      throw ApiError.forbidden('Access denied');
    }

    return board;
  }

  async getWorkspaceBoards(
    workspaceId: string,
    userId: string
  ): Promise<IBoardDocument[]> {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace || !workspace.isMember(userId)) {
      throw ApiError.forbidden('Access denied');
    }

    return Board.find({ workspace: workspaceId, isArchived: false })
      .populate('createdBy', 'name email avatar')
      .sort({ isFavorite: -1, position: 1 });
  }

  async updateBoard(
    boardId: string,
    data: UpdateBoardInput,
    userId: string
  ): Promise<IBoardDocument> {
    const board = await Board.findById(boardId);
    if (!board) {
      throw ApiError.notFound('Board not found');
    }

    const workspace = await Workspace.findById(board.workspace);
    if (!workspace || !workspace.isMember(userId)) {
      throw ApiError.forbidden('Access denied');
    }

    const role = workspace.getMemberRole(userId);
    if (role === 'viewer') {
      throw ApiError.forbidden('Viewers cannot update boards');
    }

    const updatedBoard = await Board.findByIdAndUpdate(
      boardId,
      { $set: data },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email avatar');

    if (!updatedBoard) {
      throw ApiError.notFound('Board not found');
    }

    await this.logAudit(userId, 'board.update', boardId, board.workspace.toString(), {
      updatedFields: Object.keys(data),
    });

    return updatedBoard;
  }

  async deleteBoard(boardId: string, userId: string): Promise<void> {
    const board = await Board.findById(boardId);
    if (!board) {
      throw ApiError.notFound('Board not found');
    }

    const workspace = await Workspace.findById(board.workspace);
    if (!workspace) {
      throw ApiError.notFound('Workspace not found');
    }

    const role = workspace.getMemberRole(userId);
    if (role !== 'owner' && role !== 'admin' && board.createdBy.toString() !== userId) {
      throw ApiError.forbidden('Not authorized to delete this board');
    }

    // Soft delete
    board.isArchived = true;
    await board.save();

    // Archive all lists and cards
    await List.updateMany({ board: boardId }, { isArchived: true });
    await Card.updateMany({ board: boardId }, { isArchived: true });

    await this.logAudit(userId, 'board.delete', boardId, board.workspace.toString(), {
      name: board.name,
    });
  }

  // List operations
  async createList(data: CreateListInput, userId: string): Promise<IListDocument> {
    const board = await Board.findById(data.boardId);
    if (!board) {
      throw ApiError.notFound('Board not found');
    }

    const workspace = await Workspace.findById(board.workspace);
    if (!workspace || !workspace.isMember(userId)) {
      throw ApiError.forbidden('Access denied');
    }

    const role = workspace.getMemberRole(userId);
    if (role === 'viewer') {
      throw ApiError.forbidden('Viewers cannot create lists');
    }

    // Get max position
    const lastList = await List.findOne({ board: data.boardId })
      .sort({ position: -1 })
      .select('position');

    const list = await List.create({
      name: data.name,
      board: data.boardId,
      position: data.position ?? (lastList?.position ?? -1) + 1,
      createdBy: userId,
    });

    await this.logAudit(userId, 'list.create', list._id.toString(), board.workspace.toString(), {
      name: list.name,
      boardId: data.boardId,
    });

    return list;
  }

  async updateList(
    listId: string,
    data: UpdateListInput,
    userId: string
  ): Promise<IListDocument> {
    const list = await List.findById(listId);
    if (!list) {
      throw ApiError.notFound('List not found');
    }

    const board = await Board.findById(list.board);
    if (!board) {
      throw ApiError.notFound('Board not found');
    }

    const workspace = await Workspace.findById(board.workspace);
    if (!workspace || !workspace.isMember(userId)) {
      throw ApiError.forbidden('Access denied');
    }

    const role = workspace.getMemberRole(userId);
    if (role === 'viewer') {
      throw ApiError.forbidden('Viewers cannot update lists');
    }

    const updatedList = await List.findByIdAndUpdate(
      listId,
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!updatedList) {
      throw ApiError.notFound('List not found');
    }

    return updatedList;
  }

  async deleteList(listId: string, userId: string): Promise<void> {
    const list = await List.findById(listId);
    if (!list) {
      throw ApiError.notFound('List not found');
    }

    const board = await Board.findById(list.board);
    if (!board) {
      throw ApiError.notFound('Board not found');
    }

    const workspace = await Workspace.findById(board.workspace);
    if (!workspace || !workspace.isMember(userId)) {
      throw ApiError.forbidden('Access denied');
    }

    const role = workspace.getMemberRole(userId);
    if (role === 'viewer') {
      throw ApiError.forbidden('Viewers cannot delete lists');
    }

    // Soft delete
    list.isArchived = true;
    await list.save();

    // Archive all cards in list
    await Card.updateMany({ list: listId }, { isArchived: true });

    await this.logAudit(userId, 'list.delete', listId, board.workspace.toString(), {
      name: list.name,
    });
  }

  async moveList(
    listId: string,
    newPosition: number,
    userId: string
  ): Promise<IListDocument> {
    const list = await List.findById(listId);
    if (!list) {
      throw ApiError.notFound('List not found');
    }

    const board = await Board.findById(list.board);
    if (!board) {
      throw ApiError.notFound('Board not found');
    }

    const workspace = await Workspace.findById(board.workspace);
    if (!workspace || !workspace.isMember(userId)) {
      throw ApiError.forbidden('Access denied');
    }

    const oldPosition = list.position;

    // Update positions of other lists
    if (newPosition > oldPosition) {
      await List.updateMany(
        {
          board: list.board,
          position: { $gt: oldPosition, $lte: newPosition },
          isArchived: false,
        },
        { $inc: { position: -1 } }
      );
    } else if (newPosition < oldPosition) {
      await List.updateMany(
        {
          board: list.board,
          position: { $gte: newPosition, $lt: oldPosition },
          isArchived: false,
        },
        { $inc: { position: 1 } }
      );
    }

    list.position = newPosition;
    await list.save();

    return list;
  }

  async reorderLists(
    boardId: string,
    listIds: string[],
    userId: string
  ): Promise<void> {
    const board = await Board.findById(boardId);
    if (!board) {
      throw ApiError.notFound('Board not found');
    }

    const workspace = await Workspace.findById(board.workspace);
    if (!workspace || !workspace.isMember(userId)) {
      throw ApiError.forbidden('Access denied');
    }

    const role = workspace.getMemberRole(userId);
    if (role === 'viewer') {
      throw ApiError.forbidden('Viewers cannot reorder lists');
    }

    // Update each list's position based on its index in the array
    const updates = listIds.map((listId, index) =>
      List.findByIdAndUpdate(listId, { position: index })
    );
    await Promise.all(updates);
  }

  private async logAudit(
    userId: string,
    action: string,
    resourceId: string,
    workspaceId: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    try {
      await AuditLog.create({
        user: userId,
        action,
        resource: 'Board',
        resourceId,
        workspace: workspaceId,
        details,
      });
    } catch (error) {
      logger.error('Failed to create audit log:', error);
    }
  }
}

export const boardService = new BoardService();
