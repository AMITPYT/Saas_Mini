import { Router } from 'express';
import * as boardController from '../controllers/board.controller';
import { validate } from '../middlewares/validate';
import { authenticate } from '../middlewares/auth';
import {
  createBoardSchema,
  updateBoardSchema,
  createListSchema,
  updateListSchema,
  moveListSchema,
} from '../validators/board.validator';

const router = Router();

router.use(authenticate);

// Board routes
/**
 * @swagger
 * /boards:
 *   post:
 *     summary: Create a new board
 *     tags: [Boards]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, workspaceId]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               workspaceId:
 *                 type: string
 *               background:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [color, image]
 *                   value:
 *                     type: string
 *     responses:
 *       201:
 *         description: Board created successfully
 */
router.post('/', validate(createBoardSchema), boardController.createBoard);

/**
 * @swagger
 * /boards/workspace/{workspaceId}:
 *   get:
 *     summary: Get all boards in a workspace
 *     tags: [Boards]
 *     security:
 *       - bearerAuth: []
 */
router.get('/workspace/:workspaceId', boardController.getWorkspaceBoards);

/**
 * @swagger
 * /boards/{id}:
 *   get:
 *     summary: Get board with lists and cards
 *     tags: [Boards]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', boardController.getBoard);

/**
 * @swagger
 * /boards/{id}:
 *   patch:
 *     summary: Update board
 *     tags: [Boards]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id', validate(updateBoardSchema), boardController.updateBoard);

/**
 * @swagger
 * /boards/{id}:
 *   delete:
 *     summary: Delete board
 *     tags: [Boards]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', boardController.deleteBoard);

// List routes
/**
 * @swagger
 * /boards/{boardId}/lists:
 *   post:
 *     summary: Create a new list
 *     tags: [Lists]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:boardId/lists', validate(createListSchema), boardController.createList);

/**
 * @swagger
 * /boards/{boardId}/lists/{id}:
 *   patch:
 *     summary: Update list
 *     tags: [Lists]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:boardId/lists/:id', validate(updateListSchema), boardController.updateList);

/**
 * @swagger
 * /boards/{boardId}/lists/{id}/move:
 *   patch:
 *     summary: Move list to new position
 *     tags: [Lists]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:boardId/lists/:id/move', validate(moveListSchema), boardController.moveList);

/**
 * @swagger
 * /boards/{boardId}/lists/reorder:
 *   patch:
 *     summary: Reorder lists in a board
 *     tags: [Lists]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:boardId/lists/reorder', boardController.reorderLists);

/**
 * @swagger
 * /boards/{boardId}/lists/{id}:
 *   delete:
 *     summary: Delete list
 *     tags: [Lists]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:boardId/lists/:id', boardController.deleteList);

export default router;
