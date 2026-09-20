import { describe, it, expect, vi, beforeEach } from 'vitest';
import { workspaceService } from '../workspace.service';
import api from '../../lib/axios';

// Mock axios
vi.mock('../../lib/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Workspace Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getWorkspaces', () => {
    it('should fetch all workspaces', async () => {
      const mockWorkspaces = [
        { _id: '1', name: 'Workspace 1' },
        { _id: '2', name: 'Workspace 2' },
      ];
      vi.mocked(api.get).mockResolvedValue({ data: { data: { workspaces: mockWorkspaces } } });

      const result = await workspaceService.getWorkspaces();

      expect(api.get).toHaveBeenCalledWith('/workspaces');
      expect(result).toEqual(mockWorkspaces);
    });
  });

  describe('getWorkspace', () => {
    it('should fetch workspace by id', async () => {
      const mockWorkspace = { _id: '1', name: 'Test Workspace' };
      vi.mocked(api.get).mockResolvedValue({ data: { data: { workspace: mockWorkspace } } });

      const result = await workspaceService.getWorkspace('1');

      expect(api.get).toHaveBeenCalledWith('/workspaces/1');
      expect(result).toEqual(mockWorkspace);
    });
  });

  describe('createWorkspace', () => {
    it('should create workspace', async () => {
      const newWorkspace = { name: 'New Workspace', description: 'Description' };
      const mockResponse = { _id: '1', ...newWorkspace };
      vi.mocked(api.post).mockResolvedValue({ data: { data: { workspace: mockResponse } } });

      const result = await workspaceService.createWorkspace(newWorkspace);

      expect(api.post).toHaveBeenCalledWith('/workspaces', newWorkspace);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateWorkspace', () => {
    it('should update workspace', async () => {
      const updates = { name: 'Updated Name' };
      const mockResponse = { _id: '1', name: 'Updated Name' };
      vi.mocked(api.patch).mockResolvedValue({ data: { data: { workspace: mockResponse } } });

      const result = await workspaceService.updateWorkspace('1', updates);

      expect(api.patch).toHaveBeenCalledWith('/workspaces/1', updates);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteWorkspace', () => {
    it('should delete workspace', async () => {
      vi.mocked(api.delete).mockResolvedValue({ data: { success: true } });

      await workspaceService.deleteWorkspace('1');

      expect(api.delete).toHaveBeenCalledWith('/workspaces/1');
    });
  });

  describe('getWorkspaceStats', () => {
    it('should fetch workspace stats', async () => {
      const mockStats = { boards: 5, pages: 10, channels: 3, members: 4 };
      vi.mocked(api.get).mockResolvedValue({ data: { data: { stats: mockStats } } });

      const result = await workspaceService.getWorkspaceStats('1');

      expect(api.get).toHaveBeenCalledWith('/workspaces/1/stats');
      expect(result).toEqual(mockStats);
    });
  });

  describe('addMember', () => {
    it('should add member to workspace', async () => {
      vi.mocked(api.post).mockResolvedValue({ data: { success: true } });

      await workspaceService.addMember('1', 'user-123', 'member');

      expect(api.post).toHaveBeenCalledWith('/workspaces/1/members', {
        userId: 'user-123',
        role: 'member',
      });
    });
  });

  describe('updateMember', () => {
    it('should update member role', async () => {
      vi.mocked(api.patch).mockResolvedValue({ data: { success: true } });

      await workspaceService.updateMember('1', 'user-123', 'admin');

      expect(api.patch).toHaveBeenCalledWith('/workspaces/1/members/user-123', {
        role: 'admin',
      });
    });
  });

  describe('removeMember', () => {
    it('should remove member from workspace', async () => {
      vi.mocked(api.delete).mockResolvedValue({ data: { success: true } });

      await workspaceService.removeMember('1', 'user-123');

      expect(api.delete).toHaveBeenCalledWith('/workspaces/1/members/user-123');
    });
  });

  describe('Error handling', () => {
    it('should propagate errors', async () => {
      const error = new Error('Network error');
      vi.mocked(api.get).mockRejectedValue(error);

      await expect(workspaceService.getWorkspaces()).rejects.toThrow('Network error');
    });
  });
});
