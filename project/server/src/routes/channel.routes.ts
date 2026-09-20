import { Router } from 'express';
import * as channelController from '../controllers/channel.controller';
import { validate } from '../middlewares/validate';
import { authenticate } from '../middlewares/auth';
import {
  createChannelSchema,
  createDirectChannelSchema,
  updateChannelSchema,
  addChannelMemberSchema,
  createMessageSchema,
  updateMessageSchema,
  addReactionSchema,
} from '../validators/channel.validator';

const router = Router();

router.use(authenticate);

// Channel routes
/**
 * @swagger
 * /channels:
 *   post:
 *     summary: Create a new channel
 *     tags: [Channels]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', validate(createChannelSchema), channelController.createChannel);

/**
 * @swagger
 * /channels/direct:
 *   post:
 *     summary: Create or get direct message channel
 *     tags: [Channels]
 *     security:
 *       - bearerAuth: []
 */
router.post('/direct', validate(createDirectChannelSchema), channelController.createDirectChannel);

/**
 * @swagger
 * /channels/workspace/{workspaceId}:
 *   get:
 *     summary: Get all channels in workspace
 *     tags: [Channels]
 *     security:
 *       - bearerAuth: []
 */
router.get('/workspace/:workspaceId', channelController.getWorkspaceChannels);

/**
 * @swagger
 * /channels/{id}:
 *   get:
 *     summary: Get channel details
 *     tags: [Channels]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', channelController.getChannel);

/**
 * @swagger
 * /channels/{id}:
 *   patch:
 *     summary: Update channel
 *     tags: [Channels]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id', validate(updateChannelSchema), channelController.updateChannel);

/**
 * @swagger
 * /channels/{id}:
 *   delete:
 *     summary: Delete channel
 *     tags: [Channels]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', channelController.deleteChannel);

// Channel member routes
router.post('/:id/members', validate(addChannelMemberSchema), channelController.addChannelMember);
router.delete('/:id/members/:userId', channelController.removeChannelMember);

// Message routes
/**
 * @swagger
 * /channels/messages:
 *   post:
 *     summary: Send a message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 */
router.post('/messages', validate(createMessageSchema), channelController.createMessage);

/**
 * @swagger
 * /channels/{channelId}/messages:
 *   get:
 *     summary: Get messages in channel
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: after
 *         schema:
 *           type: string
 *           format: date-time
 */
router.get('/:channelId/messages', channelController.getMessages);

/**
 * @swagger
 * /channels/messages/{messageId}/thread:
 *   get:
 *     summary: Get thread replies
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 */
router.get('/messages/:messageId/thread', channelController.getThreadMessages);

/**
 * @swagger
 * /channels/messages/{id}:
 *   patch:
 *     summary: Update message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/messages/:id', validate(updateMessageSchema), channelController.updateMessage);

/**
 * @swagger
 * /channels/messages/{id}:
 *   delete:
 *     summary: Delete message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/messages/:id', channelController.deleteMessage);

// Reaction routes
router.post('/messages/:id/reactions', validate(addReactionSchema), channelController.addReaction);
router.delete('/messages/:id/reactions', channelController.removeReaction);

export default router;
