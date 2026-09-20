import { z } from 'zod';

export const createBoardSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(100, 'Name cannot exceed 100 characters')
      .trim(),
    description: z
      .string()
      .max(1000, 'Description cannot exceed 1000 characters')
      .trim()
      .optional(),
    workspaceId: z.string().min(1, 'Workspace ID is required'),
    background: z
      .object({
        type: z.enum(['color', 'image']),
        value: z.string(),
      })
      .optional(),
  }),
});

export const updateBoardSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Board ID is required'),
  }),
  body: z.object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(100, 'Name cannot exceed 100 characters')
      .trim()
      .optional(),
    description: z
      .string()
      .max(1000, 'Description cannot exceed 1000 characters')
      .trim()
      .optional(),
    background: z
      .object({
        type: z.enum(['color', 'image']),
        value: z.string(),
      })
      .optional(),
    isFavorite: z.boolean().optional(),
    isArchived: z.boolean().optional(),
  }),
});

export const createListSchema = z.object({
  params: z.object({
    boardId: z.string().min(1, 'Board ID is required'),
  }),
  body: z.object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(100, 'Name cannot exceed 100 characters')
      .trim(),
    position: z.number().optional(),
  }),
});

export const updateListSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'List ID is required'),
  }),
  body: z.object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(100, 'Name cannot exceed 100 characters')
      .trim()
      .optional(),
    position: z.number().optional(),
    isArchived: z.boolean().optional(),
  }),
});

export const moveListSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'List ID is required'),
  }),
  body: z.object({
    position: z.number().min(0, 'Position must be non-negative'),
  }),
});

export type CreateBoardInput = z.infer<typeof createBoardSchema>['body'];
export type UpdateBoardInput = z.infer<typeof updateBoardSchema>['body'];
export type CreateListInput = z.infer<typeof createListSchema>['body'];
export type UpdateListInput = z.infer<typeof updateListSchema>['body'];
