import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import { User } from '../src/models/User';
import { Workspace } from '../src/models/Workspace';
import { Page } from '../src/models/Page';
import { RefreshToken } from '../src/models/RefreshToken';

describe('Page API', () => {
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
    await Page.deleteMany({});
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

    // Login
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Test123!@#',
      });

    accessToken = loginRes.body.data.accessToken;
  });

  describe('POST /api/v1/pages', () => {
    it('should create a new page', async () => {
      const res = await request(app)
        .post('/api/v1/pages')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Test Page',
          workspaceId,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.page.title).toBe('Test Page');
    });

    it('should create page with content', async () => {
      const content = {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: 'Hello World' }],
          },
        ],
      };

      const res = await request(app)
        .post('/api/v1/pages')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Test Page',
          content,
          workspaceId,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.page.content).toEqual(content);
    });

    it('should create page with icon and cover', async () => {
      const res = await request(app)
        .post('/api/v1/pages')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Test Page',
          icon: '📄',
          coverImage: 'https://example.com/cover.jpg',
          workspaceId,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.page.icon).toBe('📄');
      expect(res.body.data.page.coverImage).toBe('https://example.com/cover.jpg');
    });

    it('should create child page', async () => {
      const parentPage = await Page.create({
        title: 'Parent Page',
        workspace: workspaceId,
        createdBy: userId,
      });

      const res = await request(app)
        .post('/api/v1/pages')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Child Page',
          workspaceId,
          parentId: parentPage._id.toString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.data.page.parent).toBe(parentPage._id.toString());
    });

    it('should return error without title', async () => {
      const res = await request(app)
        .post('/api/v1/pages')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          workspaceId,
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/pages/workspace/:workspaceId', () => {
    beforeEach(async () => {
      await Page.create({
        title: 'Page 1',
        workspace: workspaceId,
        createdBy: userId,
      });
      await Page.create({
        title: 'Page 2',
        workspace: workspaceId,
        createdBy: userId,
      });
    });

    it('should get all pages in workspace', async () => {
      const res = await request(app)
        .get(`/api/v1/pages/workspace/${workspaceId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.pages).toHaveLength(2);
    });

    it('should return only root pages', async () => {
      const parentPage = await Page.findOne({ title: 'Page 1' });
      await Page.create({
        title: 'Child Page',
        workspace: workspaceId,
        createdBy: userId,
        parent: parentPage?._id,
      });

      const res = await request(app)
        .get(`/api/v1/pages/workspace/${workspaceId}?rootOnly=true`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pages).toHaveLength(2);
    });
  });

  describe('GET /api/v1/pages/:id', () => {
    let pageId: string;

    beforeEach(async () => {
      const page = await Page.create({
        title: 'Test Page',
        content: { type: 'doc', content: [] },
        workspace: workspaceId,
        createdBy: userId,
      });
      pageId = page._id.toString();
    });

    it('should get page by id', async () => {
      const res = await request(app)
        .get(`/api/v1/pages/${pageId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.page.title).toBe('Test Page');
    });

    it('should return 404 for non-existent page', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/v1/pages/${fakeId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/pages/:id', () => {
    let pageId: string;

    beforeEach(async () => {
      const page = await Page.create({
        title: 'Test Page',
        workspace: workspaceId,
        createdBy: userId,
      });
      pageId = page._id.toString();
    });

    it('should update page title', async () => {
      const res = await request(app)
        .patch(`/api/v1/pages/${pageId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Updated Page Title',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.page.title).toBe('Updated Page Title');
    });

    it('should update page content', async () => {
      const newContent = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Updated content' }],
          },
        ],
      };

      const res = await request(app)
        .patch(`/api/v1/pages/${pageId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: newContent,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.page.content).toEqual(newContent);
    });

    it('should favorite page', async () => {
      const res = await request(app)
        .patch(`/api/v1/pages/${pageId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          isFavorite: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.page.isFavorite).toBe(true);
    });
  });

  describe('DELETE /api/v1/pages/:id', () => {
    let pageId: string;

    beforeEach(async () => {
      const page = await Page.create({
        title: 'Test Page',
        workspace: workspaceId,
        createdBy: userId,
      });
      pageId = page._id.toString();
    });

    it('should delete page', async () => {
      const res = await request(app)
        .delete(`/api/v1/pages/${pageId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);

      const page = await Page.findById(pageId);
      expect(page).toBeNull();
    });

    it('should delete page and its children', async () => {
      const childPage = await Page.create({
        title: 'Child Page',
        workspace: workspaceId,
        createdBy: userId,
        parent: pageId,
      });

      const res = await request(app)
        .delete(`/api/v1/pages/${pageId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);

      const deletedChild = await Page.findById(childPage._id);
      expect(deletedChild).toBeNull();
    });
  });

  describe('Page Tree', () => {
    it('should get page tree', async () => {
      const parent = await Page.create({
        title: 'Parent',
        workspace: workspaceId,
        createdBy: userId,
      });

      await Page.create({
        title: 'Child 1',
        workspace: workspaceId,
        createdBy: userId,
        parent: parent._id,
      });

      await Page.create({
        title: 'Child 2',
        workspace: workspaceId,
        createdBy: userId,
        parent: parent._id,
      });

      const res = await request(app)
        .get(`/api/v1/pages/${parent._id}/children`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.children).toHaveLength(2);
    });
  });

  describe('Page Search', () => {
    beforeEach(async () => {
      await Page.create({
        title: 'Meeting Notes',
        workspace: workspaceId,
        createdBy: userId,
      });
      await Page.create({
        title: 'Project Plan',
        workspace: workspaceId,
        createdBy: userId,
      });
      await Page.create({
        title: 'Design Meeting',
        workspace: workspaceId,
        createdBy: userId,
      });
    });

    it('should search pages by title', async () => {
      const res = await request(app)
        .get(`/api/v1/pages/workspace/${workspaceId}?search=Meeting`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pages.length).toBeGreaterThanOrEqual(2);
    });
  });
});
