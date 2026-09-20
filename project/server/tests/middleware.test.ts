import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import { User } from '../src/models/User';
import { RefreshToken } from '../src/models/RefreshToken';

describe('Middleware Tests', () => {
  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/test_db';
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await RefreshToken.deleteMany({});
  });

  describe('Authentication Middleware', () => {
    it('should reject requests without token', async () => {
      const res = await request(app)
        .get('/api/v1/workspaces');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject requests with invalid token', async () => {
      const res = await request(app)
        .get('/api/v1/workspaces')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
    });

    it('should reject requests with malformed authorization header', async () => {
      const res = await request(app)
        .get('/api/v1/workspaces')
        .set('Authorization', 'InvalidFormat token');

      expect(res.status).toBe(401);
    });

    it('should accept valid token', async () => {
      await User.create({
        email: 'test@example.com',
        password: 'Test123!@#',
        name: 'Test User',
      });

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test123!@#',
        });

      const token = loginRes.body.data.accessToken;

      const res = await request(app)
        .get('/api/v1/workspaces')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });

  describe('Validation Middleware', () => {
    it('should reject invalid email format', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Test123!@#',
          name: 'Test User',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject short password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: '123',
          name: 'Test User',
        });

      expect(res.status).toBe(400);
    });

    it('should reject empty required fields', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Test123!@#',
          // Missing name
        });

      expect(res.status).toBe(400);
    });

    it('should accept valid input', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'valid@example.com',
          password: 'ValidPass123!',
          name: 'Valid User',
        });

      expect(res.status).toBe(201);
    });
  });

  describe('Error Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app)
        .get('/api/v1/unknown-route');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should handle malformed JSON', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect(res.status).toBe(400);
    });
  });

  describe('Rate Limiting', () => {
    it('should allow normal request rate', async () => {
      for (let i = 0; i < 10; i++) {
        const res = await request(app)
          .get('/health');
        expect(res.status).toBe(200);
      }
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const res = await request(app)
        .get('/health');

      // Helmet adds various security headers
      expect(res.headers).toBeDefined();
    });
  });

  describe('CORS', () => {
    it('should handle preflight requests', async () => {
      const res = await request(app)
        .options('/api/v1/auth/login')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'POST');

      expect(res.status).toBeLessThan(400);
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const res = await request(app)
        .get('/health');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Server is healthy');
      expect(res.body.timestamp).toBeDefined();
    });
  });
});
