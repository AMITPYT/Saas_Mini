import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import workspaceRoutes from './workspace.routes';
import boardRoutes from './board.routes';
import cardRoutes from './card.routes';
import channelRoutes from './channel.routes';
import pageRoutes from './page.routes';
import fileRoutes from './file.routes';
import searchRoutes from './search.routes';
import notificationRoutes from './notification.routes';

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: API Health Check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is healthy
 */
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// Auth routes (register, login, logout, refresh, forgot/reset password)
router.use('/auth', authRoutes);

// User management routes (admin only)
router.use('/users', userRoutes);

// Workspace routes
router.use('/workspaces', workspaceRoutes);

// Board & List routes (Trello-like)
router.use('/boards', boardRoutes);

// Card routes (Trello-like)
router.use('/cards', cardRoutes);

// Channel & Message routes (Slack-like)
router.use('/channels', channelRoutes);

// Page routes (Notion-like)
router.use('/pages', pageRoutes);

// File upload routes
router.use('/files', fileRoutes);

// Search routes
router.use('/search', searchRoutes);

// Notification routes
router.use('/notifications', notificationRoutes);

export default router;
