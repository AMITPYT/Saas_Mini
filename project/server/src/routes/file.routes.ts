import { Router } from 'express';
import * as fileController from '../controllers/file.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /files/upload:
 *   post:
 *     summary: Upload a single file
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               workspaceId:
 *                 type: string
 *               resourceType:
 *                 type: string
 *                 enum: [card, message, page]
 *               resourceId:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: File uploaded successfully
 */
router.post('/upload', fileController.uploadSingle);

/**
 * @swagger
 * /files/upload-multiple:
 *   post:
 *     summary: Upload multiple files (max 10)
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [files]
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               workspaceId:
 *                 type: string
 *               resourceType:
 *                 type: string
 *               resourceId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Files uploaded successfully
 */
router.post('/upload-multiple', fileController.uploadMultiple);

/**
 * @swagger
 * /files/{id}:
 *   get:
 *     summary: Get file details
 *     tags: [Files]
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
 *         description: File retrieved successfully
 */
router.get('/:id', fileController.getFile);

/**
 * @swagger
 * /files/workspace/{workspaceId}:
 *   get:
 *     summary: Get all files in a workspace
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: resourceType
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Files retrieved successfully
 */
router.get('/workspace/:workspaceId', fileController.getWorkspaceFiles);

/**
 * @swagger
 * /files/{id}:
 *   delete:
 *     summary: Delete a file
 *     tags: [Files]
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
 *         description: File deleted successfully
 */
router.delete('/:id', fileController.deleteFile);

/**
 * @swagger
 * /files/{id}/attach:
 *   post:
 *     summary: Attach file to a resource
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [resourceType, resourceId]
 *             properties:
 *               resourceType:
 *                 type: string
 *                 enum: [card, message, page]
 *               resourceId:
 *                 type: string
 *     responses:
 *       200:
 *         description: File attached successfully
 */
router.post('/:id/attach', fileController.attachFile);

export default router;
