import { Router } from 'express';
import * as pageController from '../controllers/page.controller';
import { validate } from '../middlewares/validate';
import { authenticate } from '../middlewares/auth';
import {
  createPageSchema,
  updatePageSchema,
  movePageSchema,
  duplicatePageSchema,
} from '../validators/page.validator';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /pages:
 *   post:
 *     summary: Create a new page
 *     tags: [Pages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [workspaceId]
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               workspaceId:
 *                 type: string
 *               parentId:
 *                 type: string
 *               icon:
 *                 type: string
 *               cover:
 *                 type: string
 */
router.post('/', validate(createPageSchema), pageController.createPage);

/**
 * @swagger
 * /pages/workspace/{workspaceId}:
 *   get:
 *     summary: Get pages in workspace
 *     tags: [Pages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: parentId
 *         schema:
 *           type: string
 *       - in: query
 *         name: favorites
 *         schema:
 *           type: boolean
 */
router.get('/workspace/:workspaceId', pageController.getWorkspacePages);

/**
 * @swagger
 * /pages/workspace/{workspaceId}/search:
 *   get:
 *     summary: Search pages in workspace
 *     tags: [Pages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/workspace/:workspaceId/search', pageController.searchPages);

/**
 * @swagger
 * /pages/{id}:
 *   get:
 *     summary: Get page details
 *     tags: [Pages]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', pageController.getPage);

/**
 * @swagger
 * /pages/{id}:
 *   patch:
 *     summary: Update page
 *     tags: [Pages]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id', validate(updatePageSchema), pageController.updatePage);

/**
 * @swagger
 * /pages/{id}/move:
 *   patch:
 *     summary: Move page to different parent/position
 *     tags: [Pages]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id/move', validate(movePageSchema), pageController.movePage);

/**
 * @swagger
 * /pages/{id}/duplicate:
 *   post:
 *     summary: Duplicate page
 *     tags: [Pages]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/duplicate', validate(duplicatePageSchema), pageController.duplicatePage);

/**
 * @swagger
 * /pages/{id}:
 *   delete:
 *     summary: Delete page
 *     tags: [Pages]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', pageController.deletePage);

export default router;
