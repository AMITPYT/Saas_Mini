import { Router } from 'express';
import * as searchController from '../controllers/search.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /search/{workspaceId}:
 *   get:
 *     summary: Search across workspace
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: types
 *         schema:
 *           type: string
 *         description: Comma-separated list of types (card,page,message,channel,board)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/:workspaceId', searchController.search);

/**
 * @swagger
 * /search/{workspaceId}/quick:
 *   get:
 *     summary: Quick search for command palette
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quick search results (max 10)
 */
router.get('/:workspaceId/quick', searchController.quickSearch);

/**
 * @swagger
 * /search/{workspaceId}/recent:
 *   get:
 *     summary: Get recent items for user
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Recent items
 */
router.get('/:workspaceId/recent', searchController.getRecentItems);

export default router;
