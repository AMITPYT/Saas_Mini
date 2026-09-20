import { z } from 'zod';

export const createPageSchema = z.object({
  body: z.object({
    title: z
      .string()
      .max(500, 'Title cannot exceed 500 characters')
      .trim()
      .default('Untitled'),
    content: z.string().optional(),
    workspaceId: z.string().min(1, 'Workspace ID is required'),
    parentId: z.string().optional(),
    icon: z.string().optional(),
    cover: z.string().url().optional(),
  }),
});

export const updatePageSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Page ID is required'),
  }),
  body: z.object({
    title: z
      .string()
      .max(500, 'Title cannot exceed 500 characters')
      .trim()
      .optional(),
    content: z.string().optional(),
    icon: z.string().optional().nullable(),
    cover: z.string().url().optional().nullable(),
    isPublished: z.boolean().optional(),
    isFavorite: z.boolean().optional(),
    isArchived: z.boolean().optional(),
    parentId: z.string().optional().nullable(),
    position: z.number().optional(),
  }),
});

export const movePageSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Page ID is required'),
  }),
  body: z.object({
    parentId: z.string().optional().nullable(),
    position: z.number().min(0, 'Position must be non-negative'),
  }),
});

export const duplicatePageSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Page ID is required'),
  }),
  body: z.object({
    includeChildren: z.boolean().default(false),
  }),
});

export type CreatePageInput = z.infer<typeof createPageSchema>['body'];
export type UpdatePageInput = z.infer<typeof updatePageSchema>['body'];
export type MovePageInput = z.infer<typeof movePageSchema>['body'];
