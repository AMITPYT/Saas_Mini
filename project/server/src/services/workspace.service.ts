import mongoose from 'mongoose';
import { Workspace, IWorkspaceDocument } from '../models/Workspace';
import { User } from '../models/User';
import { Board } from '../models/Board';
import { Channel } from '../models/Channel';
import { Page } from '../models/Page';
import { AuditLog } from '../models/AuditLog';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  AddMemberInput,
} from '../validators/workspace.validator';

class WorkspaceService {
  async create(
    data: CreateWorkspaceInput,
    userId: string
  ): Promise<IWorkspaceDocument> {
    const workspace = await Workspace.create({
      name: data.name,
      description: data.description,
      owner: userId,
      members: [{ user: userId, role: 'admin', joinedAt: new Date() }],
    });

    // Create default general channel
    await Channel.create({
      name: 'general',
      description: 'General discussion',
      workspace: workspace._id,
      type: 'public',
      members: [{ user: userId, role: 'admin', joinedAt: new Date() }],
      createdBy: userId,
    });

    await this.logAudit(userId, 'workspace.create', workspace._id.toString(), {
      name: workspace.name,
    });

    return workspace;
  }

  async getById(workspaceId: string, userId: string): Promise<IWorkspaceDocument> {
    const workspace = await Workspace.findById(workspaceId)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    if (!workspace) {
      throw ApiError.notFound('Workspace not found');
    }

    if (!workspace.isMember(userId) && !workspace.settings.isPublic) {
      throw ApiError.forbidden('Access denied');
    }

    return workspace;
  }

  async getUserWorkspaces(userId: string): Promise<IWorkspaceDocument[]> {
    return Workspace.find({
      $or: [{ owner: userId }, { 'members.user': userId }],
      isArchived: false,
    })
      .populate('owner', 'name email avatar')
      .sort({ updatedAt: -1 });
  }

  async update(
    workspaceId: string,
    data: UpdateWorkspaceInput,
    userId: string
  ): Promise<IWorkspaceDocument> {
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      throw ApiError.notFound('Workspace not found');
    }

    const memberRole = workspace.getMemberRole(userId);
    if (memberRole !== 'owner' && memberRole !== 'admin') {
      throw ApiError.forbidden('Only workspace admins can update workspace');
    }

    const updatedWorkspace = await Workspace.findByIdAndUpdate(
      workspaceId,
      { $set: data },
      { new: true, runValidators: true }
    )
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    if (!updatedWorkspace) {
      throw ApiError.notFound('Workspace not found');
    }

    await this.logAudit(userId, 'workspace.update', workspaceId, {
      updatedFields: Object.keys(data),
    });

    return updatedWorkspace;
  }

  async delete(workspaceId: string, userId: string): Promise<void> {
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      throw ApiError.notFound('Workspace not found');
    }

    if (workspace.owner.toString() !== userId) {
      throw ApiError.forbidden('Only workspace owner can delete workspace');
    }

    // Soft delete - archive the workspace
    workspace.isArchived = true;
    await workspace.save();

    // Archive all related data
    await Promise.all([
      Board.updateMany({ workspace: workspaceId }, { isArchived: true }),
      Channel.updateMany({ workspace: workspaceId }, { isArchived: true }),
      Page.updateMany({ workspace: workspaceId }, { isArchived: true }),
    ]);

    await this.logAudit(userId, 'workspace.delete', workspaceId, {
      name: workspace.name,
    });
  }

  async addMember(
    workspaceId: string,
    data: AddMemberInput,
    addedBy: string
  ): Promise<IWorkspaceDocument> {
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      throw ApiError.notFound('Workspace not found');
    }

    const memberRole = workspace.getMemberRole(addedBy);
    if (memberRole !== 'owner' && memberRole !== 'admin') {
      if (!workspace.settings.allowMemberInvites || memberRole !== 'member') {
        throw ApiError.forbidden('Not allowed to add members');
      }
    }

    // Find user by email
    const user = await User.findOne({ email: data.email.toLowerCase() });
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Check if already a member
    if (workspace.isMember(user._id.toString())) {
      throw ApiError.conflict('User is already a member');
    }

    workspace.members.push({
      user: user._id,
      role: data.role,
      joinedAt: new Date(),
    });

    await workspace.save();

    // Add to public channels
    await Channel.updateMany(
      { workspace: workspaceId, type: 'public' },
      {
        $push: {
          members: { user: user._id, role: 'member', joinedAt: new Date() },
        },
      }
    );

    await this.logAudit(addedBy, 'workspace.member_add', workspaceId, {
      addedUser: user.email,
      role: data.role,
    });

    return workspace.populate('members.user', 'name email avatar');
  }

  async updateMember(
    workspaceId: string,
    memberId: string,
    role: 'admin' | 'member' | 'viewer',
    updatedBy: string
  ): Promise<IWorkspaceDocument> {
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      throw ApiError.notFound('Workspace not found');
    }

    const updaterRole = workspace.getMemberRole(updatedBy);
    if (updaterRole !== 'owner' && updaterRole !== 'admin') {
      throw ApiError.forbidden('Only admins can update member roles');
    }

    // Cannot change owner's role
    if (workspace.owner.toString() === memberId) {
      throw ApiError.forbidden('Cannot change owner role');
    }

    const memberIndex = workspace.members.findIndex(
      (m) => m.user.toString() === memberId
    );

    if (memberIndex === -1) {
      throw ApiError.notFound('Member not found');
    }

    workspace.members[memberIndex].role = role;
    await workspace.save();

    return workspace.populate('members.user', 'name email avatar');
  }

  async removeMember(
    workspaceId: string,
    memberId: string,
    removedBy: string
  ): Promise<void> {
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      throw ApiError.notFound('Workspace not found');
    }

    // Owner cannot be removed
    if (workspace.owner.toString() === memberId) {
      throw ApiError.forbidden('Cannot remove workspace owner');
    }

    const removerRole = workspace.getMemberRole(removedBy);

    // Self-removal is allowed
    if (memberId !== removedBy) {
      if (removerRole !== 'owner' && removerRole !== 'admin') {
        throw ApiError.forbidden('Only admins can remove members');
      }
    }

    workspace.members = workspace.members.filter(
      (m) => m.user.toString() !== memberId
    );

    await workspace.save();

    // Remove from all channels
    await Channel.updateMany(
      { workspace: workspaceId },
      { $pull: { members: { user: memberId } } }
    );

    await this.logAudit(removedBy, 'workspace.member_remove', workspaceId, {
      removedUser: memberId,
    });
  }

  async getWorkspaceStats(workspaceId: string, userId: string) {
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      throw ApiError.notFound('Workspace not found');
    }

    if (!workspace.isMember(userId)) {
      throw ApiError.forbidden('Access denied');
    }

    const [boardCount, channelCount, pageCount, memberCount] = await Promise.all([
      Board.countDocuments({ workspace: workspaceId, isArchived: false }),
      Channel.countDocuments({ workspace: workspaceId, isArchived: false }),
      Page.countDocuments({ workspace: workspaceId, isArchived: false }),
      Promise.resolve(workspace.members.length),
    ]);

    return {
      totalBoards: boardCount,
      totalChannels: channelCount,
      totalPages: pageCount,
      totalMembers: memberCount,
    };
  }

  private async logAudit(
    userId: string,
    action: string,
    resourceId: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    try {
      await AuditLog.create({
        user: userId,
        action,
        resource: 'Workspace',
        resourceId,
        workspace: resourceId,
        details,
      });
    } catch (error) {
      logger.error('Failed to create audit log:', error);
    }
  }
}

export const workspaceService = new WorkspaceService();
