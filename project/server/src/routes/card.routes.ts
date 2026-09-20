import { Router } from 'express';
import * as cardController from '../controllers/card.controller';
import { validate } from '../middlewares/validate';
import { authenticate } from '../middlewares/auth';
import {
  createCardSchema,
  updateCardSchema,
  moveCardSchema,
  addCommentSchema,
  updateCommentSchema,
  addChecklistSchema,
  updateChecklistItemSchema,
} from '../validators/card.validator';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /cards:
 *   post:
 *     summary: Create a new card
 *     tags: [Cards]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, listId]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               listId:
 *                 type: string
 *               assignees:
 *                 type: array
 *                 items:
 *                   type: string
 *               labels:
 *                 type: array
 *                 items:
 *                   type: string
 *               dueDate:
 *                 type: string
 *                 format: date-time
 */
router.post('/', validate(createCardSchema), cardController.createCard);

/**
 * @swagger
 * /cards/{id}:
 *   get:
 *     summary: Get card details
 *     tags: [Cards]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', cardController.getCard);

/**
 * @swagger
 * /cards/{id}:
 *   patch:
 *     summary: Update card
 *     tags: [Cards]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id', validate(updateCardSchema), cardController.updateCard);

/**
 * @swagger
 * /cards/{id}/move:
 *   patch:
 *     summary: Move card to different list/position
 *     tags: [Cards]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id/move', validate(moveCardSchema), cardController.moveCard);

/**
 * @swagger
 * /cards/{id}:
 *   delete:
 *     summary: Delete card
 *     tags: [Cards]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', cardController.deleteCard);

// Comment routes
router.post('/:id/comments', validate(addCommentSchema), cardController.addComment);
router.patch('/:id/comments/:commentId', validate(updateCommentSchema), cardController.updateComment);
router.delete('/:id/comments/:commentId', cardController.deleteComment);

// Checklist routes
router.post('/:id/checklists', validate(addChecklistSchema), cardController.addChecklist);
router.post('/:id/checklists/:checklistId/items', cardController.addChecklistItem);
router.patch(
  '/:id/checklists/:checklistId/items/:itemId',
  validate(updateChecklistItemSchema),
  cardController.updateChecklistItem
);
router.delete('/:id/checklists/:checklistId', cardController.deleteChecklist);

export default router;
