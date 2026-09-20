import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import { User } from '../src/models/User';
import { Workspace } from '../src/models/Workspace';
import { RefreshToken } from '../src/models/RefreshToken';

describe('Workspace API', () => {
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
    await RefreshToken.deleteMany({});

    // Create and login user
    const user = await User.create({
      email: 'test@example.com',
      password: 'Test123!@#',
      name: 'Test User',
    });
    userId = user._id.toString();

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Test123!@#',
      });

    accessToken = loginRes.body.data.accessToken;
  });

  describe('POST /api/v1/workspaces', () => {
    it('should create a new workspace', async () => {
      const res = await request(app)
        .post('/api/v1/workspaces')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Workspace',
          description: 'A test workspace',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.workspace.name).toBe('Test Workspace');
    });

    it('should return error without authentication', async () => {
      const res = await request(app)
        .post('/api/v1/workspaces')
        .send({
          name: 'Test Workspace',
        });

      expect(res.status).toBe(401);
    });

    it('should return error without name', async () => {
      const res = await request(app)
        .post('/api/v1/workspaces')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          description: 'No name provided',
        });

      expect(res.status).toBe(400);
    });

    it('should create workspace with owner as admin member', async () => {
      const res = await request(app)
        .post('/api/v1/workspaces')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Workspace',
        });

      expect(res.status).toBe(201);
      const workspace = res.body.data.workspace;
      expect(workspace.members).toHaveLength(1);
      expect(workspace.members[0].role).toBe('admin');
    });
  });

  describe('GET /api/v1/workspaces', () => {
    beforeEach(async () => {
      await Workspace.create({
        name: 'Workspace 1',
        owner: userId,
        members: [{ user: userId, role: 'admin' }],
      });
      await Workspace.create({
        name: 'Workspace 2',
        owner: userId,
        members: [{ user: userId, role: 'admin' }],
      });
    });

    it('should get all user workspaces', async () => {
      const res = await request(app)
        .get('/api/v1/workspaces')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.workspaces).toHaveLength(2);
    });

    it('should return error without authentication', async () => {
      const res = await request(app).get('/api/v1/workspaces');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/workspaces/:id', () => {
    let workspaceId: string;

    beforeEach(async () => {
      const workspace = await Workspace.create({
        name: 'Test Workspace',
        owner: userId,
        members: [{ user: userId, role: 'admin' }],
      });
      workspaceId = workspace._id.toString();
    });

    it('should get workspace by id', async () => {
      const res = await request(app)
        .get(`/api/v1/workspaces/${workspaceId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.workspace.name).toBe('Test Workspace');
    });

    it('should return 404 for non-existent workspace', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/v1/workspaces/${fakeId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/workspaces/:id', () => {
    let workspaceId: string;

    beforeEach(async () => {
      const workspace = await Workspace.create({
        name: 'Test Workspace',
        owner: userId,
        members: [{ user: userId, role: 'admin' }],
      });
      workspaceId = workspace._id.toString();
    });

    it('should update workspace', async () => {
      const res = await request(app)
        .patch(`/api/v1/workspaces/${workspaceId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Updated Workspace',
          description: 'Updated description',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.workspace.name).toBe('Updated Workspace');
    });

    it('should return 404 for non-existent workspace', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .patch(`/api/v1/workspaces/${fakeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Updated' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/workspaces/:id', () => {
    let workspaceId: string;

    beforeEach(async () => {
      const workspace = await Workspace.create({
        name: 'Test Workspace',
        owner: userId,
        members: [{ user: userId, role: 'admin' }],
      });
      workspaceId = workspace._id.toString();
    });

    it('should delete workspace', async () => {
      const res = await request(app)
        .delete(`/api/v1/workspaces/${workspaceId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify deletion
      const workspace = await Workspace.findById(workspaceId);
      expect(workspace).toBeNull();
    });

    it('should return 404 for non-existent workspace', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/v1/workspaces/${fakeId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('Member Management', () => {
    let workspaceId: string;
    let memberId: string;

    beforeEach(async () => {
      const workspace = await Workspace.create({
        name: 'Test Workspace',
        owner: userId,
        members: [{ user: userId, role: 'admin' }],
      });
      workspaceId = workspace._id.toString();

      const member = await User.create({
        email: 'member@example.com',
        password: 'Test123!@#',
        name: 'Member User',
      });
      memberId = member._id.toString();
    });

    it('should add member to workspace', async () => {
      const res = await request(app)
        .post(`/api/v1/workspaces/${workspaceId}/members`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          userId: memberId,
          role: 'member',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should update member role', async () => {
      // First add member
      await request(app)
        .post(`/api/v1/workspaces/${workspaceId}/members`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          userId: memberId,
          role: 'member',
        });

      // Then update role
      const res = await request(app)
        .patch(`/api/v1/workspaces/${workspaceId}/members/${memberId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          role: 'admin',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should remove member from workspace', async () => {
      // First add member
      await request(app)
        .post(`/api/v1/workspaces/${workspaceId}/members`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          userId: memberId,
          role: 'member',
        });

      // Then remove
      const res = await request(app)
        .delete(`/api/v1/workspaces/${workspaceId}/members/${memberId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
