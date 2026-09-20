import { Channel, IChannelDocument } from '../models/Channel';
import { Message, IMessageDocument } from '../models/Message';
import { Workspace } from '../models/Workspace';
import { AuditLog } from '../models/AuditLog';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import {
  CreateChannelInput,
  UpdateChannelInput,
  CreateMessageInput,
} from '../validators/channel.validator';

class ChannelService {
  async createChannel(
    data: CreateChannelInput,
    userId: string
  ): Promise<IChannelDocument> {
    const workspace = await Workspace.findById(data.workspaceId);
    if (!workspace || !workspace.isMember(userId)) {
      throw ApiError.forbidden('Access denied');
    }

    const role = workspace.getMemberRole(userId);
    if (role === 'viewer') {
      throw ApiError.forbidden('Viewers cannot create channels');
    }

    // Check for duplicate channel name
    const existing = await Channel.findOne({
      workspace: data.workspaceId,
      name: data.name.toLowerCase(),
      isArchived: false,
    });

    if (existing) {
      throw ApiError.conflict('Channel name already exists');
    }

    const members = [{ user: userId, role: 'admin' as const, joinedAt: new Date() }];

    // Add additional members if provided
    if (data.members) {
      for (const memberId of data.members) {
        if (memberId !== userId && workspace.isMember(memberId)) {
          members.push({ user: memberId as any, role: 'member', joinedAt: new Date() });
        }
      }
    }

    const channel = await Channel.create({
      name: data.name.toLowerCase(),
      description: data.description,
      workspace: data.workspaceId,
      type: data.type,
      members,
      createdBy: userId,
    });

    await this.logAudit(userId, 'channel.create', channel._id.toString(), data.workspaceId, {
      name: channel.name,
      type: channel.type,
    });

    return channel.populate('members.user', 'name email avatar');
  }

  async createDirectChannel(
    workspaceId: string,
    targetUserId: string,
    userId: string
  ): Promise<IChannelDocument> {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace || !workspace.isMember(userId)) {
      throw ApiError.forbidden('Access denied');
    }

    if (!workspace.isMember(targetUserId)) {
      throw ApiError.notFound('User not found in workspace');
    }

    // Check for existing direct channel between users
    const existing = await Channel.findOne({
      workspace: workspaceId,
      type: 'direct',
      'members.user': { $all: [userId, targetUserId] },
      isArchived: false,
    });

    if (existing) {
      return existing.populate('members.user', 'name email avatar');
    }

    const channel = await Channel.create({
      name: `dm-${Date.now()}`,
      workspace: workspaceId,
      type: 'direct',
      members: [
        { user: userId, role: 'member', joinedAt: new Date() },
        { user: targetUserId, role: 'member', joinedAt: new Date() },
      ],
      createdBy: userId,
    });

    return channel.populate('members.user', 'name email avatar');
  }

  async getChannel(channelId: string, userId: string): Promise<IChannelDocument> {
    const channel = await Channel.findById(channelId)
      .populate('members.user', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    if (!channel || channel.isArchived) {
      throw ApiError.notFound('Channel not found');
    }

    const workspace = await Workspace.findById(channel.workspace);
    if (!workspace || !workspace.isMember(userId)) {
      throw ApiError.forbidden('Access denied');
    }

    // Private/direct channels require membership
    if (channel.type !== 'public' && !channel.isMember(userId)) {
      throw ApiError.forbidden('Access denied');
    }

    return channel;
  }

  async getWorkspaceChannels(
    workspaceId: string,
    userId: string
  ): Promise<IChannelDocument[]> {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace || !workspace.isMember(userId)) {
      throw ApiError.forbidden('Access denied');
    }

    // Get public channels and channels user is member of
    return Channel.find({
      workspace: workspaceId,
      isArchived: false,
      $or: [{ type: 'public' }, { 'members.user': userId }],
    })
      .populate('members.user', 'name email avatar')
      .sort({ type: 1, name: 1 });
  }

  async updateChannel(
    channelId: string,
    data: UpdateChannelInput,
    userId: string
  ): Promise<IChannelDocument> {
    const channel = await Channel.findById(channelId);
    if (!channel || channel.isArchived) {
      throw ApiError.notFound('Channel not found');
    }

    if (!channel.isAdmin(userId)) {
      throw ApiError.forbidden('Only channel admins can update channel');
    }

    if (data.name) {
      // Check for duplicate name
      const existing = await Channel.findOne({
        workspace: channel.workspace,
        name: data.name.toLowerCase(),
        _id: { $ne: channelId },
        isArchived: false,
      });

      if (existing) {
        throw ApiError.conflict('Channel name already exists');
      }

      data.name = data.name.toLowerCase();
    }

    const updatedChannel = await Channel.findByIdAndUpdate(
      channelId,
      { $set: data },
      { new: true, runValidators: true }
    ).populate('members.user', 'name email avatar');

    if (!updatedChannel) {
      throw ApiError.notFound('Channel not found');
    }

    await this.logAudit(userId, 'channel.update', channelId, channel.workspace.toString(), {
      updatedFields: Object.keys(data),
    });

    return updatedChannel;
  }

  async deleteChannel(channelId: string, userId: string): Promise<void> {
    const channel = await Channel.findById(channelId);
    if (!channel || channel.isArchived) {
      throw ApiError.notFound('Channel not found');
    }

    if (!channel.isAdmin(userId)) {
      throw ApiError.forbidden('Only channel admins can delete channel');
    }

    channel.isArchived = true;
    await channel.save();

    await this.logAudit(userId, 'channel.delete', channelId, channel.workspace.toString(), {
      name: channel.name,
    });
  }

  async addMember(
    channelId: string,
    targetUserId: string,
    role: 'admin' | 'member',
    userId: string
  ): Promise<IChannelDocument> {
    const channel = await Channel.findById(channelId);
    if (!channel || channel.isArchived) {
      throw ApiError.notFound('Channel not found');
    }

    if (channel.type === 'direct') {
      throw ApiError.badRequest('Cannot add members to direct messages');
    }

    if (!channel.isAdmin(userId)) {
      throw ApiError.forbidden('Only channel admins can add members');
    }

    const workspace = await Workspace.findById(channel.workspace);
    if (!workspace || !workspace.isMember(targetUserId)) {
      throw ApiError.notFound('User not found in workspace');
    }

    if (channel.isMember(targetUserId)) {
      throw ApiError.conflict('User is already a member');
    }

    channel.members.push({
      user: targetUserId as any,
      role,
      joinedAt: new Date(),
    });

    await channel.save();

    return channel.populate('members.user', 'name email avatar');
  }

  async removeMember(
    channelId: string,
    targetUserId: string,
    userId: string
  ): Promise<void> {
    const channel = await Channel.findById(channelId);
    if (!channel || channel.isArchived) {
      throw ApiError.notFound('Channel not found');
    }

    if (channel.type === 'direct') {
      throw ApiError.badRequest('Cannot remove members from direct messages');
    }

    // Self-removal is allowed, otherwise need admin
    if (targetUserId !== userId && !channel.isAdmin(userId)) {
      throw ApiError.forbidden('Only channel admins can remove members');
    }

    channel.members = channel.members.filter(
      (m) => m.user.toString() !== targetUserId
    );

    await channel.save();
  }

  // Message operations
  async createMessage(
    data: CreateMessageInput,
    userId: string
  ): Promise<IMessageDocument> {
    const channel = await Channel.findById(data.channelId);
    if (!channel || channel.isArchived) {
      throw ApiError.notFound('Channel not found');
    }

    // For private/direct channels, user must be member
    if (channel.type !== 'public' && !channel.isMember(userId)) {
      throw ApiError.forbidden('Access denied');
    }

    // For public channels, verify workspace membership
    if (channel.type === 'public') {
      const workspace = await Workspace.findById(channel.workspace);
      if (!workspace || !workspace.isMember(userId)) {
        throw ApiError.forbidden('Access denied');
      }
    }

    // If it's a reply, verify parent message exists
    if (data.parentMessageId) {
      const parentMessage = await Message.findById(data.parentMessageId);
      if (!parentMessage || parentMessage.channel.toString() !== data.channelId) {
        throw ApiError.notFound('Parent message not found');
      }

      // Increment reply count on parent
      await Message.findByIdAndUpdate(data.parentMessageId, {
        $inc: { replyCount: 1 },
      });
    }

    const message = await Message.create({
      content: data.content,
      channel: data.channelId,
      sender: userId,
      parentMessage: data.parentMessageId,
      mentions: data.mentions || [],
    });

    // Update channel's last message time
    channel.lastMessageAt = new Date();
    await channel.save();

    await this.logAudit(userId, 'message.create', message._id.toString(), channel.workspace.toString());

    return message.populate('sender', 'name email avatar');
  }

  async getMessages(
    channelId: string,
    userId: string,
    options: { limit?: number; before?: string; after?: string } = {}
  ): Promise<{ messages: IMessageDocument[]; hasMore: boolean }> {
    const channel = await Channel.findById(channelId);
    if (!channel || channel.isArchived) {
      throw ApiError.notFound('Channel not found');
    }

    if (channel.type !== 'public' && !channel.isMember(userId)) {
      throw ApiError.forbidden('Access denied');
    }

    const limit = options.limit || 50;
    const query: Record<string, unknown> = {
      channel: channelId,
      parentMessage: null, // Only top-level messages
      isDeleted: false,
    };

    if (options.before) {
      query.createdAt = { $lt: new Date(options.before) };
    } else if (options.after) {
      query.createdAt = { $gt: new Date(options.after) };
    }

    const messages = await Message.find(query)
      .populate('sender', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(limit + 1);

    const hasMore = messages.length > limit;
    if (hasMore) {
      messages.pop();
    }

    // Update last read for user
    const memberIndex = channel.members.findIndex(
      (m) => m.user.toString() === userId
    );
    if (memberIndex !== -1) {
      channel.members[memberIndex].lastReadAt = new Date();
      await channel.save();
    }

    return { messages: messages.reverse(), hasMore };
  }

  async getThreadMessages(
    messageId: string,
    userId: string
  ): Promise<IMessageDocument[]> {
    const parentMessage = await Message.findById(messageId);
    if (!parentMessage) {
      throw ApiError.notFound('Message not found');
    }

    const channel = await Channel.findById(parentMessage.channel);
    if (!channel || channel.isArchived) {
      throw ApiError.notFound('Channel not found');
    }

    if (channel.type !== 'public' && !channel.isMember(userId)) {
      throw ApiError.forbidden('Access denied');
    }

    return Message.find({
      parentMessage: messageId,
      isDeleted: false,
    })
      .populate('sender', 'name email avatar')
      .sort({ createdAt: 1 });
  }

  async updateMessage(
    messageId: string,
    content: string,
    userId: string
  ): Promise<IMessageDocument> {
    const message = await Message.findById(messageId);
    if (!message || message.isDeleted) {
      throw ApiError.notFound('Message not found');
    }

    if (message.sender.toString() !== userId) {
      throw ApiError.forbidden('Cannot edit another user\'s message');
    }

    message.content = content;
    message.isEdited = true;
    await message.save();

    await this.logAudit(userId, 'message.update', messageId, '');

    return message.populate('sender', 'name email avatar');
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const message = await Message.findById(messageId);
    if (!message) {
      throw ApiError.notFound('Message not found');
    }

    if (message.sender.toString() !== userId) {
      // Check if user is channel admin
      const channel = await Channel.findById(message.channel);
      if (!channel?.isAdmin(userId)) {
        throw ApiError.forbidden('Cannot delete another user\'s message');
      }
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    await message.save();

    // Decrement reply count on parent if this is a reply
    if (message.parentMessage) {
      await Message.findByIdAndUpdate(message.parentMessage, {
        $inc: { replyCount: -1 },
      });
    }

    await this.logAudit(userId, 'message.delete', messageId, '');
  }

  async addReaction(
    messageId: string,
    emoji: string,
    userId: string
  ): Promise<IMessageDocument> {
    const message = await Message.findById(messageId);
    if (!message || message.isDeleted) {
      throw ApiError.notFound('Message not found');
    }

    const existingReaction = message.reactions.find((r) => r.emoji === emoji);

    if (existingReaction) {
      if (!existingReaction.users.some((u) => u.toString() === userId)) {
        existingReaction.users.push(userId as any);
      }
    } else {
      message.reactions.push({ emoji, users: [userId as any] });
    }

    await message.save();

    return message.populate('sender', 'name email avatar');
  }

  async removeReaction(
    messageId: string,
    emoji: string,
    userId: string
  ): Promise<IMessageDocument> {
    const message = await Message.findById(messageId);
    if (!message || message.isDeleted) {
      throw ApiError.notFound('Message not found');
    }

    const reaction = message.reactions.find((r) => r.emoji === emoji);
    if (reaction) {
      reaction.users = reaction.users.filter((u) => u.toString() !== userId);
      if (reaction.users.length === 0) {
        message.reactions = message.reactions.filter((r) => r.emoji !== emoji);
      }
    }

    await message.save();

    return message.populate('sender', 'name email avatar');
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
        resource: 'Channel',
        resourceId,
        workspace: workspaceId || undefined,
        details,
      });
    } catch (error) {
      logger.error('Failed to create audit log:', error);
    }
  }
}

export const channelService = new ChannelService();
