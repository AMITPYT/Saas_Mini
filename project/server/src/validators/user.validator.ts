import { z } from 'zod';

export const getUsersSchema = z.object({
  query: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 10),
    search: z.string().optional(),
    role: z.enum(['admin', 'member', 'viewer']).optional(),
    isActive: z.string().optional().transform(val => val === 'true'),
    sortBy: z.string().optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});

export const getUserByIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'User ID is required'),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'User ID is required'),
  }),
  body: z.object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name cannot exceed 50 characters')
      .trim()
      .optional(),
    avatar: z.string().url('Invalid avatar URL').optional().nullable(),
    role: z.enum(['admin', 'member', 'viewer']).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const deleteUserSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'User ID is required'),
  }),
});

export type GetUsersQuery = z.infer<typeof getUsersSchema>['query'];
export type UpdateUserInput = z.infer<typeof updateUserSchema>['body'];
