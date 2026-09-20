import { z } from 'zod';

export const createWorkspaceSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name cannot exceed 100 characters')
      .trim(),
    description: z
      .string()
      .max(500, 'Description cannot exceed 500 characters')
      .trim()
      .optional(),
  }),
});

export const updateWorkspaceSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Workspace ID is required'),
  }),
  body: z.object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name cannot exceed 100 characters')
      .trim()
      .optional(),
    description: z
      .string()
      .max(500, 'Description cannot exceed 500 characters')
      .trim()
      .optional(),
    logo: z.string().url().optional().nullable(),
    settings: z
      .object({
        isPublic: z.boolean().optional(),
        allowMemberInvites: z.boolean().optional(),
      })
      .optional(),
  }),
});

export const addMemberSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Workspace ID is required'),
  }),
  body: z.object({
    email: z.string().email('Invalid email format'),
    role: z.enum(['admin', 'member', 'viewer']).default('member'),
  }),
});

export const updateMemberSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Workspace ID is required'),
    userId: z.string().min(1, 'User ID is required'),
  }),
  body: z.object({
    role: z.enum(['admin', 'member', 'viewer']),
  }),
});

export const removeMemberSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Workspace ID is required'),
    userId: z.string().min(1, 'User ID is required'),
  }),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>['body'];
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>['body'];
export type AddMemberInput = z.infer<typeof addMemberSchema>['body'];
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>['body'];
