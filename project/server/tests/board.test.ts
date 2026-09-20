import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import { User } from '../src/models/User';
import { Workspace } from '../src/models/Workspace';
import { Board } from '../src/models/Board';
import { List } from '../src/models/List';
import { RefreshToken } from '../src/models/RefreshToken';

describe('Board API', () => {
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

    // Login
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Test123!@#',
      });

    accessToken = loginRes.body.data.accessToken;
  });

  describe('POST /api/v1/boards', () => {
    it('should create a new board', async () => {
      const res = await request(app)
        .post('/api/v1/boards')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Board',
          workspaceId,
          description: 'A test board',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.board.name).toBe('Test Board');
    });

    it('should create board with background', async () => {
      const res = await request(app)
        .post('/api/v1/boards')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Board',
          workspaceId,
          background: {
            type: 'color',
            value: '#3B82F6',
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.data.board.background.type).toBe('color');
      expect(res.body.data.board.background.value).toBe('#3B82F6');
    });

    it('should return error without workspace', async () => {
      const res = await request(app)
        .post('/api/v1/boards')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Board',
        });

      expect(res.status).toBe(400);
    });

    it('should return error without name', async () => {
      const res = await request(app)
        .post('/api/v1/boards')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          workspaceId,
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/boards/workspace/:workspaceId', () => {
    beforeEach(async () => {
      await Board.create({
        name: 'Board 1',
        workspace: workspaceId,
        createdBy: userId,
        members: [{ user: userId, role: 'admin' }],
      });
      await Board.create({
        name: 'Board 2',
        workspace: workspaceId,
        createdBy: userId,
        members: [{ user: userId, role: 'admin' }],
      });
    });

    it('should get all boards in workspace', async () => {
      const res = await request(app)
        .get(`/api/v1/boards/workspace/${workspaceId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.boards).toHaveLength(2);
    });
  });

  describe('GET /api/v1/boards/:id', () => {
    let boardId: string;

    beforeEach(async () => {
      const board = await Board.create({
        name: 'Test Board',
        workspace: workspaceId,
        createdBy: userId,
        members: [{ user: userId, role: 'admin' }],
      });
      boardId = board._id.toString();

      // Create lists
      await List.create({
        name: 'To Do',
        board: boardId,
        position: 0,
      });
      await List.create({
        name: 'In Progress',
        board: boardId,
        position: 1,
      });
    });

    it('should get board with lists', async () => {
      const res = await request(app)
        .get(`/api/v1/boards/${boardId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.board.name).toBe('Test Board');
      expect(res.body.data.lists).toHaveLength(2);
    });

    it('should return 404 for non-existent board', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/v1/boards/${fakeId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/boards/:id', () => {
    let boardId: string;

    beforeEach(async () => {
      const board = await Board.create({
        name: 'Test Board',
        workspace: workspaceId,
        createdBy: userId,
        members: [{ user: userId, role: 'admin' }],
      });
      boardId = board._id.toString();
    });

    it('should update board', async () => {
      const res = await request(app)
        .patch(`/api/v1/boards/${boardId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Updated Board',
          description: 'Updated description',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.board.name).toBe('Updated Board');
    });

    it('should star board', async () => {
      const res = await request(app)
        .patch(`/api/v1/boards/${boardId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          isStarred: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.board.isStarred).toBe(true);
    });
  });

  describe('DELETE /api/v1/boards/:id', () => {
    let boardId: string;

    beforeEach(async () => {
      const board = await Board.create({
        name: 'Test Board',
        workspace: workspaceId,
        createdBy: userId,
        members: [{ user: userId, role: 'admin' }],
      });
      boardId = board._id.toString();
    });

    it('should delete board', async () => {
      const res = await request(app)
        .delete(`/api/v1/boards/${boardId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const board = await Board.findById(boardId);
      expect(board).toBeNull();
    });
  });

  describe('List Operations', () => {
    let boardId: string;
    let listId: string;

    beforeEach(async () => {
      const board = await Board.create({
        name: 'Test Board',
        workspace: workspaceId,
        createdBy: userId,
        members: [{ user: userId, role: 'admin' }],
      });
      boardId = board._id.toString();
    });

    it('should create a list', async () => {
      const res = await request(app)
        .post('/api/v1/boards/lists')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'New List',
          boardId,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.list.name).toBe('New List');
      listId = res.body.data.list._id;
    });

    it('should update a list', async () => {
      const list = await List.create({
        name: 'Test List',
        board: boardId,
        position: 0,
      });
      listId = list._id.toString();

      const res = await request(app)
        .patch(`/api/v1/boards/lists/${listId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Updated List',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.list.name).toBe('Updated List');
    });

    it('should delete a list', async () => {
      const list = await List.create({
        name: 'Test List',
        board: boardId,
        position: 0,
      });
      listId = list._id.toString();

      const res = await request(app)
        .delete(`/api/v1/boards/lists/${listId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);

      const deletedList = await List.findById(listId);
      expect(deletedList).toBeNull();
    });

    it('should move list to new position', async () => {
      await List.create({ name: 'List 1', board: boardId, position: 0 });
      const list2 = await List.create({ name: 'List 2', board: boardId, position: 1 });
      await List.create({ name: 'List 3', board: boardId, position: 2 });

      const res = await request(app)
        .patch(`/api/v1/boards/lists/${list2._id}/move`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          position: 0,
        });

      expect(res.status).toBe(200);
    });
  });
});
