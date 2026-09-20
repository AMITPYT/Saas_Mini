import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import { User } from '../src/models/User';
import { Workspace } from '../src/models/Workspace';
import { Board } from '../src/models/Board';
import { Card } from '../src/models/Card';
import { Page } from '../src/models/Page';
import { Channel } from '../src/models/Channel';
import { Message } from '../src/models/Message';
import { List } from '../src/models/List';
import { RefreshToken } from '../src/models/RefreshToken';

describe('Search API', () => {
  let accessToken: string;
  let userId: string;
  let workspaceId: string;

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
    await Card.deleteMany({});
    await Page.deleteMany({});
    await Channel.deleteMany({});
    await Message.deleteMany({});
    await List.deleteMany({});
    await RefreshToken.deleteMany({});

    // Create user
    const user = await User.create({
      email: 'test@example.com',
      password: 'Test123!@#',
      name: 'Test User',
    });
    userId = user._id.toString();

    // Create workspace
    const workspace = await Workspace.create({
      name: 'Test Workspace',
      owner: userId,
      members: [{ user: userId, role: 'admin' }],
    });
    workspaceId = workspace._id.toString();

    // Create searchable content
    const board = await Board.create({
      name: 'Project Board',
      workspace: workspaceId,
      createdBy: userId,
      members: [{ user: userId, role: 'admin' }],
    });

    const list = await List.create({
      name: 'To Do',
      board: board._id,
      position: 0,
    });

    await Card.create({
      title: 'Fix authentication bug',
      description: 'Users are unable to login',
      list: list._id,
      board: board._id,
      createdBy: userId,
      position: 0,
    });

    await Card.create({
      title: 'Implement search feature',
      description: 'Add global search functionality',
      list: list._id,
      board: board._id,
      createdBy: userId,
      position: 1,
    });

    await Page.create({
      title: 'Meeting Notes',
      content: { type: 'doc', content: [] },
      workspace: workspaceId,
      createdBy: userId,
    });

    await Page.create({
      title: 'Authentication Flow',
      content: { type: 'doc', content: [] },
      workspace: workspaceId,
      createdBy: userId,
    });

    const channel = await Channel.create({
      name: 'general',
      workspace: workspaceId,
      type: 'public',
      createdBy: userId,
      members: [userId],
    });

    await Message.create({
      content: 'Let me know about the authentication issue',
      channel: channel._id,
      sender: userId,
    });

    // Login
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Test123!@#',
      });

    accessToken = loginRes.body.data.accessToken;
  });

  describe('GET /api/v1/search/:workspaceId', () => {
    it('should search across all types', async () => {
      const res = await request(app)
        .get(`/api/v1/search/${workspaceId}?q=authentication`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.results.length).toBeGreaterThan(0);
    });

    it('should filter by type', async () => {
      const res = await request(app)
        .get(`/api/v1/search/${workspaceId}?q=authentication&types=card`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.results.every((r: any) => r.type === 'card')).toBe(true);
    });

    it('should return empty results for non-matching query', async () => {
      const res = await request(app)
        .get(`/api/v1/search/${workspaceId}?q=xyznonexistent123`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.results).toHaveLength(0);
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get(`/api/v1/search/${workspaceId}?q=test`);

      expect(res.status).toBe(401);
    });

    it('should handle pagination', async () => {
      const res = await request(app)
        .get(`/api/v1/search/${workspaceId}?q=a&limit=1&page=1`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.results.length).toBeLessThanOrEqual(1);
    });
  });

  describe('GET /api/v1/search/:workspaceId/quick', () => {
    it('should return quick search results', async () => {
      const res = await request(app)
        .get(`/api/v1/search/${workspaceId}/quick?q=authentication`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.results.length).toBeLessThanOrEqual(10);
    });

    it('should return results quickly', async () => {
      const start = Date.now();
      await request(app)
        .get(`/api/v1/search/${workspaceId}/quick?q=test`)
        .set('Authorization', `Bearer ${accessToken}`);
      const duration = Date.now() - start;

      // Quick search should be fast
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('GET /api/v1/search/:workspaceId/recent', () => {
    it('should return recent items', async () => {
      const res = await request(app)
        .get(`/api/v1/search/${workspaceId}/recent`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const res = await request(app)
        .get(`/api/v1/search/${workspaceId}/recent?limit=5`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeLessThanOrEqual(5);
    });
  });
});
