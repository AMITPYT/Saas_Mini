import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import { User } from '../src/models/User';
import { Workspace } from '../src/models/Workspace';
import { Board } from '../src/models/Board';
import { List } from '../src/models/List';
import { Card } from '../src/models/Card';
import { RefreshToken } from '../src/models/RefreshToken';

describe('Card API', () => {
  let accessToken: string;
  let userId: string;
  let workspaceId: string;
  let boardId: string;
  let listId: string;

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

    // Create board
    const board = await Board.create({
      name: 'Test Board',
      workspace: workspaceId,
      createdBy: userId,
      members: [{ user: userId, role: 'admin' }],
    });
    boardId = board._id.toString();

    // Create list
    const list = await List.create({
      name: 'To Do',
      board: boardId,
      position: 0,
    });
    listId = list._id.toString();

    // Login
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Test123!@#',
      });

    accessToken = loginRes.body.data.accessToken;
  });

  describe('POST /api/v1/cards', () => {
    it('should create a new card', async () => {
      const res = await request(app)
        .post('/api/v1/cards')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Test Card',
          listId,
          boardId,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.card.title).toBe('Test Card');
    });

    it('should create card with description', async () => {
      const res = await request(app)
        .post('/api/v1/cards')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Test Card',
          description: 'Card description',
          listId,
          boardId,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.card.description).toBe('Card description');
    });

    it('should create card with due date', async () => {
      const dueDate = new Date(Date.now() + 86400000).toISOString();
      const res = await request(app)
        .post('/api/v1/cards')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Test Card',
          dueDate,
          listId,
          boardId,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.card.dueDate).toBeDefined();
    });

    it('should create card with labels', async () => {
      const res = await request(app)
        .post('/api/v1/cards')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Test Card',
          labels: [{ name: 'Bug', color: '#EF4444' }],
          listId,
          boardId,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.card.labels).toHaveLength(1);
    });

    it('should return error without title', async () => {
      const res = await request(app)
        .post('/api/v1/cards')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          listId,
          boardId,
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/cards/list/:listId', () => {
    beforeEach(async () => {
      await Card.create({
        title: 'Card 1',
        list: listId,
        board: boardId,
        createdBy: userId,
        position: 0,
      });
      await Card.create({
        title: 'Card 2',
        list: listId,
        board: boardId,
        createdBy: userId,
        position: 1,
      });
    });

    it('should get all cards in list', async () => {
      const res = await request(app)
        .get(`/api/v1/cards/list/${listId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.cards).toHaveLength(2);
    });
  });

  describe('GET /api/v1/cards/:id', () => {
    let cardId: string;

    beforeEach(async () => {
      const card = await Card.create({
        title: 'Test Card',
        description: 'Test description',
        list: listId,
        board: boardId,
        createdBy: userId,
        position: 0,
      });
      cardId = card._id.toString();
    });

    it('should get card by id', async () => {
      const res = await request(app)
        .get(`/api/v1/cards/${cardId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.card.title).toBe('Test Card');
    });

    it('should return 404 for non-existent card', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/v1/cards/${fakeId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/cards/:id', () => {
    let cardId: string;

    beforeEach(async () => {
      const card = await Card.create({
        title: 'Test Card',
        list: listId,
        board: boardId,
        createdBy: userId,
        position: 0,
      });
      cardId = card._id.toString();
    });

    it('should update card', async () => {
      const res = await request(app)
        .patch(`/api/v1/cards/${cardId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Updated Card',
          description: 'Updated description',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.card.title).toBe('Updated Card');
    });

    it('should add assignees', async () => {
      const res = await request(app)
        .patch(`/api/v1/cards/${cardId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          assignees: [userId],
        });

      expect(res.status).toBe(200);
      expect(res.body.data.card.assignees).toHaveLength(1);
    });

    it('should add checklist', async () => {
      const res = await request(app)
        .patch(`/api/v1/cards/${cardId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          checklists: [{
            title: 'Checklist 1',
            items: [
              { text: 'Item 1', isCompleted: false },
              { text: 'Item 2', isCompleted: true },
            ],
          }],
        });

      expect(res.status).toBe(200);
      expect(res.body.data.card.checklists).toHaveLength(1);
    });
  });

  describe('PATCH /api/v1/cards/:id/move', () => {
    let cardId: string;
    let list2Id: string;

    beforeEach(async () => {
      const card = await Card.create({
        title: 'Test Card',
        list: listId,
        board: boardId,
        createdBy: userId,
        position: 0,
      });
      cardId = card._id.toString();

      const list2 = await List.create({
        name: 'In Progress',
        board: boardId,
        position: 1,
      });
      list2Id = list2._id.toString();
    });

    it('should move card to different list', async () => {
      const res = await request(app)
        .patch(`/api/v1/cards/${cardId}/move`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          listId: list2Id,
          position: 0,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const card = await Card.findById(cardId);
      expect(card?.list.toString()).toBe(list2Id);
    });

    it('should move card within same list', async () => {
      await Card.create({
        title: 'Card 2',
        list: listId,
        board: boardId,
        createdBy: userId,
        position: 1,
      });

      const res = await request(app)
        .patch(`/api/v1/cards/${cardId}/move`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          listId,
          position: 1,
        });

      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /api/v1/cards/:id', () => {
    let cardId: string;

    beforeEach(async () => {
      const card = await Card.create({
        title: 'Test Card',
        list: listId,
        board: boardId,
        createdBy: userId,
        position: 0,
      });
      cardId = card._id.toString();
    });

    it('should delete card', async () => {
      const res = await request(app)
        .delete(`/api/v1/cards/${cardId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const card = await Card.findById(cardId);
      expect(card).toBeNull();
    });
  });

  describe('Card Comments', () => {
    let cardId: string;

    beforeEach(async () => {
      const card = await Card.create({
        title: 'Test Card',
        list: listId,
        board: boardId,
        createdBy: userId,
        position: 0,
      });
      cardId = card._id.toString();
    });

    it('should add comment to card', async () => {
      const res = await request(app)
        .post(`/api/v1/cards/${cardId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'This is a comment',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should return error without comment content', async () => {
      const res = await request(app)
        .post(`/api/v1/cards/${cardId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });
});
