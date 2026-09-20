import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import { User } from '../src/models/User';
import { Workspace } from '../src/models/Workspace';
import { Channel } from '../src/models/Channel';
import { Message } from '../src/models/Message';
import { RefreshToken } from '../src/models/RefreshToken';

describe('Channel API', () => {
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
    await Channel.deleteMany({});
    await Message.deleteMany({});
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

  describe('POST /api/v1/channels', () => {
    it('should create a public channel', async () => {
      const res = await request(app)
        .post('/api/v1/channels')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'general',
          workspaceId,
          type: 'public',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.channel.name).toBe('general');
      expect(res.body.data.channel.type).toBe('public');
    });

    it('should create a private channel', async () => {
      const res = await request(app)
        .post('/api/v1/channels')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'secret-channel',
          workspaceId,
          type: 'private',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.channel.type).toBe('private');
    });

    it('should create channel with description', async () => {
      const res = await request(app)
        .post('/api/v1/channels')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'general',
          description: 'General discussion',
          workspaceId,
          type: 'public',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.channel.description).toBe('General discussion');
    });

    it('should return error without name', async () => {
      const res = await request(app)
        .post('/api/v1/channels')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          workspaceId,
          type: 'public',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/channels/workspace/:workspaceId', () => {
    beforeEach(async () => {
      await Channel.create({
        name: 'general',
        workspace: workspaceId,
        type: 'public',
        createdBy: userId,
        members: [userId],
      });
      await Channel.create({
        name: 'random',
        workspace: workspaceId,
        type: 'public',
        createdBy: userId,
        members: [userId],
      });
    });

    it('should get all channels in workspace', async () => {
      const res = await request(app)
        .get(`/api/v1/channels/workspace/${workspaceId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.channels).toHaveLength(2);
    });
  });

  describe('GET /api/v1/channels/:id', () => {
    let channelId: string;

    beforeEach(async () => {
      const channel = await Channel.create({
        name: 'general',
        workspace: workspaceId,
        type: 'public',
        createdBy: userId,
        members: [userId],
      });
      channelId = channel._id.toString();
    });

    it('should get channel by id', async () => {
      const res = await request(app)
        .get(`/api/v1/channels/${channelId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.channel.name).toBe('general');
    });

    it('should return 404 for non-existent channel', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/v1/channels/${fakeId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/channels/:id', () => {
    let channelId: string;

    beforeEach(async () => {
      const channel = await Channel.create({
        name: 'general',
        workspace: workspaceId,
        type: 'public',
        createdBy: userId,
        members: [userId],
      });
      channelId = channel._id.toString();
    });

    it('should update channel', async () => {
      const res = await request(app)
        .patch(`/api/v1/channels/${channelId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'updated-general',
          description: 'Updated description',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.channel.name).toBe('updated-general');
    });
  });

  describe('DELETE /api/v1/channels/:id', () => {
    let channelId: string;

    beforeEach(async () => {
      const channel = await Channel.create({
        name: 'general',
        workspace: workspaceId,
        type: 'public',
        createdBy: userId,
        members: [userId],
      });
      channelId = channel._id.toString();
    });

    it('should delete channel', async () => {
      const res = await request(app)
        .delete(`/api/v1/channels/${channelId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);

      const channel = await Channel.findById(channelId);
      expect(channel).toBeNull();
    });
  });

  describe('Channel Messages', () => {
    let channelId: string;

    beforeEach(async () => {
      const channel = await Channel.create({
        name: 'general',
        workspace: workspaceId,
        type: 'public',
        createdBy: userId,
        members: [userId],
      });
      channelId = channel._id.toString();
    });

    it('should send message to channel', async () => {
      const res = await request(app)
        .post(`/api/v1/channels/${channelId}/messages`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'Hello, world!',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message.content).toBe('Hello, world!');
    });

    it('should get channel messages', async () => {
      await Message.create({
        content: 'Message 1',
        channel: channelId,
        sender: userId,
      });
      await Message.create({
        content: 'Message 2',
        channel: channelId,
        sender: userId,
      });

      const res = await request(app)
        .get(`/api/v1/channels/${channelId}/messages`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.messages).toHaveLength(2);
    });

    it('should get messages with pagination', async () => {
      for (let i = 0; i < 25; i++) {
        await Message.create({
          content: `Message ${i}`,
          channel: channelId,
          sender: userId,
        });
      }

      const res = await request(app)
        .get(`/api/v1/channels/${channelId}/messages?limit=10`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.messages).toHaveLength(10);
      expect(res.body.data.hasMore).toBe(true);
    });
  });

  describe('Channel Members', () => {
    let channelId: string;
    let member2Id: string;

    beforeEach(async () => {
      const channel = await Channel.create({
        name: 'private-channel',
        workspace: workspaceId,
        type: 'private',
        createdBy: userId,
        members: [userId],
      });
      channelId = channel._id.toString();

      const member2 = await User.create({
        email: 'member2@example.com',
        password: 'Test123!@#',
        name: 'Member 2',
      });
      member2Id = member2._id.toString();

      // Add member to workspace first
      await Workspace.findByIdAndUpdate(workspaceId, {
        $push: { members: { user: member2Id, role: 'member' } },
      });
    });

    it('should add member to channel', async () => {
      const res = await request(app)
        .post(`/api/v1/channels/${channelId}/members`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          userId: member2Id,
        });

      expect(res.status).toBe(200);
    });

    it('should remove member from channel', async () => {
      // First add member
      await Channel.findByIdAndUpdate(channelId, {
        $push: { members: member2Id },
      });

      const res = await request(app)
        .delete(`/api/v1/channels/${channelId}/members/${member2Id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
    });
  });
});
