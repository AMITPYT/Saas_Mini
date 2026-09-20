import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import { User } from '../src/models/User';
import { Workspace } from '../src/models/Workspace';
import { Board } from '../src/models/Board';
import { List } from '../src/models/List';
import { Card } from '../src/models/Card';
import { Channel } from '../src/models/Channel';
import { Page } from '../src/models/Page';
import { RefreshToken } from '../src/models/RefreshToken';

describe('Integration Tests', () => {
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/test_db';
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Workspace.deleteMany({});
    await Board.deleteMany({});
    await List.deleteMany({});
    await Card.deleteMany({});
    await Channel.deleteMany({});
    await Page.deleteMany({});
    await RefreshToken.deleteMany({});
  });

  describe('Full User Workflow', () => {
    it('should complete full registration to workspace creation flow', async () => {
      // 1. Register user
      const registerRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'SecurePass123!',
          name: 'New User',
        });

      expect(registerRes.status).toBe(201);
      accessToken = registerRes.body.data.accessToken;
      userId = registerRes.body.data.user.id;

      // 2. Create workspace
      const workspaceRes = await request(app)
        .post('/api/v1/workspaces')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'My Workspace',
          description: 'My first workspace',
        });

      expect(workspaceRes.status).toBe(201);
      const workspaceId = workspaceRes.body.data.workspace._id;

      // 3. Create board
      const boardRes = await request(app)
        .post('/api/v1/boards')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Project Board',
          workspaceId,
        });

      expect(boardRes.status).toBe(201);
      const boardId = boardRes.body.data.board._id;

      // 4. Create list
      const listRes = await request(app)
        .post('/api/v1/boards/lists')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'To Do',
          boardId,
        });

      expect(listRes.status).toBe(201);
      const listId = listRes.body.data.list._id;

      // 5. Create card
      const cardRes = await request(app)
        .post('/api/v1/cards')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'First Task',
          description: 'Complete this task',
          listId,
          boardId,
        });

      expect(cardRes.status).toBe(201);

      // 6. Verify all data exists
      const verifyRes = await request(app)
        .get(`/api/v1/boards/${boardId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.data.board.name).toBe('Project Board');
      expect(verifyRes.body.data.lists).toHaveLength(1);
    });

    it('should handle channel creation and messaging flow', async () => {
      // Setup user
      const registerRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'chatuser@example.com',
          password: 'SecurePass123!',
          name: 'Chat User',
        });

      accessToken = registerRes.body.data.accessToken;

      // Create workspace
      const workspaceRes = await request(app)
        .post('/api/v1/workspaces')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Chat Workspace' });

      const workspaceId = workspaceRes.body.data.workspace._id;

      // Create channel
      const channelRes = await request(app)
        .post('/api/v1/channels')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'general',
          workspaceId,
          type: 'public',
        });

      expect(channelRes.status).toBe(201);
      const channelId = channelRes.body.data.channel._id;

      // Send message
      const messageRes = await request(app)
        .post(`/api/v1/channels/${channelId}/messages`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'Hello, world!',
        });

      expect(messageRes.status).toBe(201);

      // Get messages
      const messagesRes = await request(app)
        .get(`/api/v1/channels/${channelId}/messages`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(messagesRes.status).toBe(200);
      expect(messagesRes.body.data.messages).toHaveLength(1);
    });

    it('should handle page creation and hierarchy', async () => {
      // Setup user
      const registerRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'pageuser@example.com',
          password: 'SecurePass123!',
          name: 'Page User',
        });

      accessToken = registerRes.body.data.accessToken;

      // Create workspace
      const workspaceRes = await request(app)
        .post('/api/v1/workspaces')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Docs Workspace' });

      const workspaceId = workspaceRes.body.data.workspace._id;

      // Create parent page
      const parentRes = await request(app)
        .post('/api/v1/pages')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Parent Page',
          workspaceId,
        });

      expect(parentRes.status).toBe(201);
      const parentId = parentRes.body.data.page._id;

      // Create child page
      const childRes = await request(app)
        .post('/api/v1/pages')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Child Page',
          workspaceId,
          parentId,
        });

      expect(childRes.status).toBe(201);
      expect(childRes.body.data.page.parent).toBe(parentId);

      // Get workspace pages
      const pagesRes = await request(app)
        .get(`/api/v1/pages/workspace/${workspaceId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(pagesRes.status).toBe(200);
      expect(pagesRes.body.data.pages).toHaveLength(2);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple simultaneous card creations', async () => {
      // Setup
      const registerRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'concurrent@example.com',
          password: 'SecurePass123!',
          name: 'Concurrent User',
        });

      accessToken = registerRes.body.data.accessToken;

      const workspaceRes = await request(app)
        .post('/api/v1/workspaces')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Concurrent Workspace' });

      const workspaceId = workspaceRes.body.data.workspace._id;

      const boardRes = await request(app)
        .post('/api/v1/boards')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Concurrent Board', workspaceId });

      const boardId = boardRes.body.data.board._id;

      const listRes = await request(app)
        .post('/api/v1/boards/lists')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Concurrent List', boardId });

      const listId = listRes.body.data.list._id;

      // Create multiple cards concurrently
      const cardPromises = Array.from({ length: 5 }, (_, i) =>
        request(app)
          .post('/api/v1/cards')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            title: `Card ${i + 1}`,
            listId,
            boardId,
          })
      );

      const results = await Promise.all(cardPromises);

      // All should succeed
      results.forEach((res) => {
        expect(res.status).toBe(201);
      });

      // Verify all cards exist
      const cards = await Card.find({ board: boardId });
      expect(cards).toHaveLength(5);
    });
  });

  describe('Data Consistency', () => {
    it('should maintain referential integrity on workspace deletion', async () => {
      // Setup
      const registerRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'integrity@example.com',
          password: 'SecurePass123!',
          name: 'Integrity User',
        });

      accessToken = registerRes.body.data.accessToken;

      const workspaceRes = await request(app)
        .post('/api/v1/workspaces')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Delete Test Workspace' });

      const workspaceId = workspaceRes.body.data.workspace._id;

      // Create related entities
      await request(app)
        .post('/api/v1/boards')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Board', workspaceId });

      await request(app)
        .post('/api/v1/channels')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'channel', workspaceId, type: 'public' });

      await request(app)
        .post('/api/v1/pages')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Page', workspaceId });

      // Delete workspace
      await request(app)
        .delete(`/api/v1/workspaces/${workspaceId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      // Verify related entities are handled
      const workspace = await Workspace.findById(workspaceId);
      expect(workspace).toBeNull();
    });
  });

  describe('Error Recovery', () => {
    it('should handle invalid MongoDB ObjectId gracefully', async () => {
      const registerRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'error@example.com',
          password: 'SecurePass123!',
          name: 'Error User',
        });

      accessToken = registerRes.body.data.accessToken;

      const res = await request(app)
        .get('/api/v1/workspaces/invalid-id')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
    });
  });
});
