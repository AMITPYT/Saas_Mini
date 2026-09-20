import { Router } from 'express';
import * as workspaceController from '../controllers/workspace.controller';
import { validate } from '../middlewares/validate';
import { authenticate } from '../middlewares/auth';
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  addMemberSchema,
  updateMemberSchema,
  removeMemberSchema,
} from '../validators/workspace.validator';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /workspaces:
 *   post:
 *     summary: Create a new workspace
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Workspace created successfully
 */
router.post('/', validate(createWorkspaceSchema), workspaceController.createWorkspace);

/**
 * @swagger
 * /workspaces:
 *   get:
 *     summary: Get all workspaces for current user
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Workspaces retrieved successfully
 */
router.get('/', workspaceController.getUserWorkspaces);

/**
 * @swagger
 * /workspaces/{id}:
 *   get:
 *     summary: Get workspace by ID
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Workspace retrieved successfully
 */
router.get('/:id', workspaceController.getWorkspace);

/**
 * @swagger
 * /workspaces/{id}/stats:
 *   get:
 *     summary: Get workspace statistics
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id/stats', workspaceController.getWorkspaceStats);

/**
 * @swagger
 * /workspaces/{id}:
 *   patch:
 *     summary: Update workspace
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id', validate(updateWorkspaceSchema), workspaceController.updateWorkspace);

/**
 * @swagger
 * /workspaces/{id}:
 *   delete:
 *     summary: Delete workspace
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', workspaceController.deleteWorkspace);

// Member management
router.post('/:id/members', validate(addMemberSchema), workspaceController.addMember);
router.patch('/:id/members/:userId', validate(updateMemberSchema), workspaceController.updateMember);
router.delete('/:id/members/:userId', validate(removeMemberSchema), workspaceController.removeMember);

export default router;
