import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import { User } from '../src/models/User';
import { Notification } from '../src/models/Notification';
import { RefreshToken } from '../src/models/RefreshToken';

describe('Notification API', () => {
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
    await Notification.deleteMany({});
    await RefreshToken.deleteMany({});

    // Create user
    const user = await User.create({
      email: 'test@example.com',
      password: 'Test123!@#',
      name: 'Test User',
    });
    userId = user._id.toString();

    // Create notifications
    await Notification.create({
      user: userId,
      type: 'mention',
      title: 'You were mentioned',
      body: 'Test User mentioned you in a comment',
      isRead: false,
    });

    await Notification.create({
      user: userId,
      type: 'assignment',
      title: 'New assignment',
      body: 'You were assigned to a card',
      isRead: false,
    });

    await Notification.create({
      user: userId,
      type: 'comment',
      title: 'New comment',
      body: 'Someone commented on your card',
      isRead: true,
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

  describe('GET /api/v1/notifications', () => {
    it('should get all notifications', async () => {
      const res = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.notifications).toHaveLength(3);
    });

    it('should filter by read status', async () => {
      const res = await request(app)
        .get('/api/v1/notifications?isRead=false')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notifications).toHaveLength(2);
    });

    it('should filter by type', async () => {
      const res = await request(app)
        .get('/api/v1/notifications?type=mention')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notifications.every((n: any) => n.type === 'mention')).toBe(true);
    });

    it('should paginate results', async () => {
      const res = await request(app)
        .get('/api/v1/notifications?limit=2&page=1')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notifications.length).toBeLessThanOrEqual(2);
    });

    it('should require authentication', async () => {
      const res = await request(app).get('/api/v1/notifications');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/notifications/unread-count', () => {
    it('should return unread count', async () => {
      const res = await request(app)
        .get('/api/v1/notifications/unread-count')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.count).toBe(2);
    });
  });

  describe('POST /api/v1/notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      const notifications = await Notification.find({ user: userId, isRead: false });
      const notificationId = notifications[0]._id.toString();

      const res = await request(app)
        .post(`/api/v1/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);

      const updated = await Notification.findById(notificationId);
      expect(updated?.isRead).toBe(true);
    });

    it('should return 404 for non-existent notification', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/v1/notifications/${fakeId}/read`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/v1/notifications/mark-all-read', () => {
    it('should mark all notifications as read', async () => {
      const res = await request(app)
        .post('/api/v1/notifications/mark-all-read')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);

      const unread = await Notification.countDocuments({ user: userId, isRead: false });
      expect(unread).toBe(0);
    });
  });

  describe('DELETE /api/v1/notifications/:id', () => {
    it('should delete notification', async () => {
      const notification = await Notification.findOne({ user: userId });
      const notificationId = notification?._id.toString();

      const res = await request(app)
        .delete(`/api/v1/notifications/${notificationId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);

      const deleted = await Notification.findById(notificationId);
      expect(deleted).toBeNull();
    });
  });

  describe('DELETE /api/v1/notifications/delete-all', () => {
    it('should delete all notifications', async () => {
      const res = await request(app)
        .delete('/api/v1/notifications/delete-all')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);

      const count = await Notification.countDocuments({ user: userId });
      expect(count).toBe(0);
    });
  });
});
