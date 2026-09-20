import { z } from 'zod';

export const createChannelSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(80, 'Name cannot exceed 80 characters')
      .trim()
      .regex(/^[a-z0-9-]+$/, 'Name can only contain lowercase letters, numbers, and hyphens'),
    description: z
      .string()
      .max(500, 'Description cannot exceed 500 characters')
      .trim()
      .optional(),
    workspaceId: z.string().min(1, 'Workspace ID is required'),
    type: z.enum(['public', 'private']).default('public'),
    members: z.array(z.string()).optional(),
  }),
});

export const createDirectChannelSchema = z.object({
  body: z.object({
    workspaceId: z.string().min(1, 'Workspace ID is required'),
    userId: z.string().min(1, 'User ID is required'),
  }),
});

export const updateChannelSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Channel ID is required'),
  }),
  body: z.object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(80, 'Name cannot exceed 80 characters')
      .trim()
      .regex(/^[a-z0-9-]+$/, 'Name can only contain lowercase letters, numbers, and hyphens')
      .optional(),
    description: z
      .string()
      .max(500, 'Description cannot exceed 500 characters')
      .trim()
      .optional(),
    isArchived: z.boolean().optional(),
  }),
});

export const addChannelMemberSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Channel ID is required'),
  }),
  body: z.object({
    userId: z.string().min(1, 'User ID is required'),
    role: z.enum(['admin', 'member']).default('member'),
  }),
});

export const createMessageSchema = z.object({
  body: z.object({
    content: z
      .string()
      .min(1, 'Message is required')
      .max(10000, 'Message cannot exceed 10000 characters')
      .trim(),
    channelId: z.string().min(1, 'Channel ID is required'),
    parentMessageId: z.string().optional(),
    mentions: z.array(z.string()).optional(),
  }),
});

export const updateMessageSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Message ID is required'),
  }),
  body: z.object({
    content: z
      .string()
      .min(1, 'Message is required')
      .max(10000, 'Message cannot exceed 10000 characters')
      .trim(),
  }),
});

export const addReactionSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Message ID is required'),
  }),
  body: z.object({
    emoji: z.string().min(1, 'Emoji is required'),
  }),
});

export type CreateChannelInput = z.infer<typeof createChannelSchema>['body'];
export type UpdateChannelInput = z.infer<typeof updateChannelSchema>['body'];
export type CreateMessageInput = z.infer<typeof createMessageSchema>['body'];
export type UpdateMessageInput = z.infer<typeof updateMessageSchema>['body'];
