import { z } from 'zod';

export const createCardSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(1, 'Title is required')
      .max(500, 'Title cannot exceed 500 characters')
      .trim(),
    description: z
      .string()
      .max(10000, 'Description cannot exceed 10000 characters')
      .trim()
      .optional(),
    listId: z.string().min(1, 'List ID is required'),
    position: z.number().optional(),
    assignees: z.array(z.string()).optional(),
    labels: z.array(z.string()).optional(),
    dueDate: z.string().datetime().optional(),
    startDate: z.string().datetime().optional(),
  }),
});

export const updateCardSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Card ID is required'),
  }),
  body: z.object({
    title: z
      .string()
      .min(1, 'Title is required')
      .max(500, 'Title cannot exceed 500 characters')
      .trim()
      .optional(),
    description: z
      .string()
      .max(10000, 'Description cannot exceed 10000 characters')
      .trim()
      .optional()
      .nullable(),
    assignees: z.array(z.string()).optional(),
    labels: z.array(z.string()).optional(),
    dueDate: z.string().datetime().optional().nullable(),
    startDate: z.string().datetime().optional().nullable(),
    isCompleted: z.boolean().optional(),
    isArchived: z.boolean().optional(),
    cover: z
      .object({
        type: z.enum(['color', 'image']),
        value: z.string(),
      })
      .optional()
      .nullable(),
  }),
});

export const moveCardSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Card ID is required'),
  }),
  body: z.object({
    listId: z.string().min(1, 'List ID is required'),
    position: z.number().min(0, 'Position must be non-negative'),
  }),
});

export const addCommentSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Card ID is required'),
  }),
  body: z.object({
    content: z
      .string()
      .min(1, 'Comment is required')
      .max(5000, 'Comment cannot exceed 5000 characters')
      .trim(),
  }),
});

export const updateCommentSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Card ID is required'),
    commentId: z.string().min(1, 'Comment ID is required'),
  }),
  body: z.object({
    content: z
      .string()
      .min(1, 'Comment is required')
      .max(5000, 'Comment cannot exceed 5000 characters')
      .trim(),
  }),
});

export const addChecklistSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Card ID is required'),
  }),
  body: z.object({
    title: z
      .string()
      .min(1, 'Title is required')
      .max(200, 'Title cannot exceed 200 characters')
      .trim(),
  }),
});

export const updateChecklistItemSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Card ID is required'),
    checklistId: z.string().min(1, 'Checklist ID is required'),
    itemId: z.string().min(1, 'Item ID is required'),
  }),
  body: z.object({
    text: z.string().max(500).trim().optional(),
    isCompleted: z.boolean().optional(),
  }),
});

export type CreateCardInput = z.infer<typeof createCardSchema>['body'];
export type UpdateCardInput = z.infer<typeof updateCardSchema>['body'];
export type MoveCardInput = z.infer<typeof moveCardSchema>['body'];
export type AddCommentInput = z.infer<typeof addCommentSchema>['body'];
export type AddChecklistInput = z.infer<typeof addChecklistSchema>['body'];
