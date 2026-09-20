import { v4 as uuidv4 } from 'uuid';
import { Card, ICardDocument } from '../models/Card';
import { List } from '../models/List';
import { Board } from '../models/Board';
import { Workspace } from '../models/Workspace';
import { AuditLog } from '../models/AuditLog';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import {
  CreateCardInput,
  UpdateCardInput,
  MoveCardInput,
  AddCommentInput,
  AddChecklistInput,
} from '../validators/card.validator';

class CardService {
  async createCard(data: CreateCardInput, userId: string): Promise<ICardDocument> {
    const list = await List.findById(data.listId);
    if (!list || list.isArchived) {
      throw ApiError.notFound('List not found');
    }

    const board = await Board.findById(list.board);
    if (!board || board.isArchived) {
      throw ApiError.notFound('Board not found');
    }

    const workspace = await Workspace.findById(board.workspace);
    if (!workspace || !workspace.isMember(userId)) {
      throw ApiError.forbidden('Access denied');
    }

    const role = workspace.getMemberRole(userId);
    if (role === 'viewer') {
      throw ApiError.forbidden('Viewers cannot create cards');
    }

    // Get max position
    const lastCard = await Card.findOne({ list: data.listId })
      .sort({ position: -1 })
      .select('position');

    const card = await Card.create({
      title: data.title,
      description: data.description,
      list: data.listId,
      board: list.board,
      position: data.position ?? (lastCard?.position ?? -1) + 1,
      assignees: data.assignees || [],
      labels: data.labels || [],
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      createdBy: userId,
    });

    await this.logAudit(userId, 'card.create', card._id.toString(), board.workspace.toString(), {
      title: card.title,
      listId: data.listId,
    });

    return card.populate([
      { path: 'assignees', select: 'name email avatar' },
      { path: 'createdBy', select: 'name email avatar' },
    ]);
  }

  async getCard(cardId: string, userId: string): Promise<ICardDocument> {
    const card = await Card.findById(cardId)
      .populate('assignees', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('comments.author', 'name email avatar')
      .populate('attachments.uploadedBy', 'name email avatar');

    if (!card || card.isArchived) {
      throw ApiError.notFound('Card not found');
    }

    const board = await Board.findById(card.board);
    if (!board) {
      throw ApiError.notFound('Board not found');
    }

    const workspace = await Workspace.findById(board.workspace);
    if (!workspace || !workspace.isMember(userId)) {
      throw ApiError.forbidden('Access denied');
    }

    return card;
  }

  async updateCard(
    cardId: string,
    data: UpdateCardInput,
    userId: string
  ): Promise<ICardDocument> {
    const card = await Card.findById(cardId);
    if (!card || card.isArchived) {
      throw ApiError.notFound('Card not found');
    }

    const board = await Board.findById(card.board);
    if (!board) {
      throw ApiError.notFound('Board not found');
    }

    const workspace = await Workspace.findById(board.workspace);
    if (!workspace || !workspace.isMember(userId)) {
      throw ApiError.forbidden('Access denied');
    }

    const role = workspace.getMemberRole(userId);
    if (role === 'viewer') {
      throw ApiError.forbidden('Viewers cannot update cards');
    }

    // Handle date conversions
    const updateData: Record<string, unknown> = { ...data };
    if (data.dueDate) {
      updateData.dueDate = new Date(data.dueDate);
    }
    if (data.startDate) {
      updateData.startDate = new Date(data.startDate);
    }

    const updatedCard = await Card.findByIdAndUpdate(
      cardId,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('assignees', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    if (!updatedCard) {
      throw ApiError.notFound('Card not found');
    }

    await this.logAudit(userId, 'card.update', cardId, board.workspace.toString(), {
      updatedFields: Object.keys(data),
    });

    return updatedCard;
  }

  async moveCard(
    cardId: string,
    data: MoveCardInput,
    userId: string
  ): Promise<ICardDocument> {
    const card = await Card.findById(cardId);
    if (!card || card.isArchived) {
      throw ApiError.notFound('Card not found');
    }

    const targetList = await List.findById(data.listId);
    if (!targetList || targetList.isArchived) {
      throw ApiError.notFound('Target list not found');
    }

    const board = await Board.findById(card.board);
    if (!board) {
      throw ApiError.notFound('Board not found');
    }

    // Verify target list is in same board
    if (targetList.board.toString() !== card.board.toString()) {
      throw ApiError.badRequest('Cannot move card to different board');
    }

    const workspace = await Workspace.findById(board.workspace);
    if (!workspace || !workspace.isMember(userId)) {
      throw ApiError.forbidden('Access denied');
    }

    const role = workspace.getMemberRole(userId);
    if (role === 'viewer') {
      throw ApiError.forbidden('Viewers cannot move cards');
    }

    const oldListId = card.list.toString();
    const newListId = data.listId;
    const oldPosition = card.position;
    const newPosition = data.position;

    if (oldListId === newListId) {
      // Moving within same list
      if (newPosition > oldPosition) {
        await Card.updateMany(
          {
            list: oldListId,
            position: { $gt: oldPosition, $lte: newPosition },
            isArchived: false,
          },
          { $inc: { position: -1 } }
        );
      } else if (newPosition < oldPosition) {
        await Card.updateMany(
          {
            list: oldListId,
            position: { $gte: newPosition, $lt: oldPosition },
            isArchived: false,
          },
          { $inc: { position: 1 } }
        );
      }
    } else {
      // Moving to different list
      // Update positions in old list
      await Card.updateMany(
        {
          list: oldListId,
          position: { $gt: oldPosition },
          isArchived: false,
        },
        { $inc: { position: -1 } }
      );

      // Update positions in new list
      await Card.updateMany(
        {
          list: newListId,
          position: { $gte: newPosition },
          isArchived: false,
        },
        { $inc: { position: 1 } }
      );

      card.list = targetList._id;
    }

    card.position = newPosition;
    await card.save();

    await this.logAudit(userId, 'card.move', cardId, board.workspace.toString(), {
      fromList: oldListId,
      toList: newListId,
      position: newPosition,
    });

    return card.populate([
      { path: 'assignees', select: 'name email avatar' },
      { path: 'createdBy', select: 'name email avatar' },
    ]);
  }

  async deleteCard(cardId: string, userId: string): Promise<void> {
    const card = await Card.findById(cardId);
    if (!card) {
      throw ApiError.notFound('Card not found');
    }

    const board = await Board.findById(card.board);
    if (!board) {
      throw ApiError.notFound('Board not found');
    }

    const workspace = await Workspace.findById(board.workspace);
    if (!workspace || !workspace.isMember(userId)) {
      throw ApiError.forbidden('Access denied');
    }

    const role = workspace.getMemberRole(userId);
    if (role === 'viewer') {
      throw ApiError.forbidden('Viewers cannot delete cards');
    }

    card.isArchived = true;
    await card.save();

    await this.logAudit(userId, 'card.delete', cardId, board.workspace.toString(), {
      title: card.title,
    });
  }

  // Comment operations
  async addComment(
    cardId: string,
    data: AddCommentInput,
    userId: string
  ): Promise<ICardDocument> {
    const card = await Card.findById(cardId);
    if (!card || card.isArchived) {
      throw ApiError.notFound('Card not found');
    }

    const board = await Board.findById(card.board);
    if (!board) {
      throw ApiError.notFound('Board not found');
    }

    const workspace = await Workspace.findById(board.workspace);
    if (!workspace || !workspace.isMember(userId)) {
      throw ApiError.forbidden('Access denied');
    }

    card.comments.push({
      id: uuidv4(),
      content: data.content,
      author: userId as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await card.save();

    return card.populate('comments.author', 'name email avatar');
  }

  async updateComment(
    cardId: string,
    commentId: string,
    content: string,
    userId: string
  ): Promise<ICardDocument> {
    const card = await Card.findById(cardId);
    if (!card || card.isArchived) {
      throw ApiError.notFound('Card not found');
    }

    const comment = card.comments.find((c) => c.id === commentId);
    if (!comment) {
      throw ApiError.notFound('Comment not found');
    }

    if (comment.author.toString() !== userId) {
      throw ApiError.forbidden('Cannot edit another user\'s comment');
    }

    comment.content = content;
    comment.updatedAt = new Date();

    await card.save();

    return card.populate('comments.author', 'name email avatar');
  }

  async deleteComment(
    cardId: string,
    commentId: string,
    userId: string
  ): Promise<ICardDocument> {
    const card = await Card.findById(cardId);
    if (!card || card.isArchived) {
      throw ApiError.notFound('Card not found');
    }

    const commentIndex = card.comments.findIndex((c) => c.id === commentId);
    if (commentIndex === -1) {
      throw ApiError.notFound('Comment not found');
    }

    const comment = card.comments[commentIndex];
    if (comment.author.toString() !== userId) {
      // Check if user is admin
      const board = await Board.findById(card.board);
      const workspace = await Workspace.findById(board?.workspace);
      const role = workspace?.getMemberRole(userId);
      if (role !== 'owner' && role !== 'admin') {
        throw ApiError.forbidden('Cannot delete another user\'s comment');
      }
    }

    card.comments.splice(commentIndex, 1);
    await card.save();

    return card;
  }

  // Checklist operations
  async addChecklist(
    cardId: string,
    data: AddChecklistInput,
    userId: string
  ): Promise<ICardDocument> {
    const card = await Card.findById(cardId);
    if (!card || card.isArchived) {
      throw ApiError.notFound('Card not found');
    }

    const board = await Board.findById(card.board);
    if (!board) {
      throw ApiError.notFound('Board not found');
    }

    const workspace = await Workspace.findById(board.workspace);
    if (!workspace || !workspace.isMember(userId)) {
      throw ApiError.forbidden('Access denied');
    }

    const role = workspace.getMemberRole(userId);
    if (role === 'viewer') {
      throw ApiError.forbidden('Viewers cannot add checklists');
    }

    card.checklists.push({
      id: uuidv4(),
      title: data.title,
      items: [],
    });

    await card.save();

    return card;
  }

  async addChecklistItem(
    cardId: string,
    checklistId: string,
    text: string,
    userId: string
  ): Promise<ICardDocument> {
    const card = await Card.findById(cardId);
    if (!card || card.isArchived) {
      throw ApiError.notFound('Card not found');
    }

    const checklist = card.checklists.find((c) => c.id === checklistId);
    if (!checklist) {
      throw ApiError.notFound('Checklist not found');
    }

    checklist.items.push({
      id: uuidv4(),
      text,
      isCompleted: false,
    });

    await card.save();

    return card;
  }

  async updateChecklistItem(
    cardId: string,
    checklistId: string,
    itemId: string,
    data: { text?: string; isCompleted?: boolean },
    userId: string
  ): Promise<ICardDocument> {
    const card = await Card.findById(cardId);
    if (!card || card.isArchived) {
      throw ApiError.notFound('Card not found');
    }

    const checklist = card.checklists.find((c) => c.id === checklistId);
    if (!checklist) {
      throw ApiError.notFound('Checklist not found');
    }

    const item = checklist.items.find((i) => i.id === itemId);
    if (!item) {
      throw ApiError.notFound('Checklist item not found');
    }

    if (data.text !== undefined) {
      item.text = data.text;
    }
    if (data.isCompleted !== undefined) {
      item.isCompleted = data.isCompleted;
    }

    await card.save();

    return card;
  }

  async deleteChecklist(
    cardId: string,
    checklistId: string,
    userId: string
  ): Promise<ICardDocument> {
    const card = await Card.findById(cardId);
    if (!card || card.isArchived) {
      throw ApiError.notFound('Card not found');
    }

    card.checklists = card.checklists.filter((c) => c.id !== checklistId);
    await card.save();

    return card;
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
        resource: 'Card',
        resourceId,
        workspace: workspaceId,
        details,
      });
    } catch (error) {
      logger.error('Failed to create audit log:', error);
    }
  }
}

export const cardService = new CardService();
