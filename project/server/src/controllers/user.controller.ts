import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const query = {
    page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
    search: req.query.search as string | undefined,
    role: req.query.role as 'admin' | 'member' | 'viewer' | undefined,
    isActive: req.query.isActive === 'true',
    sortBy: (req.query.sortBy as string) || 'createdAt',
    sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
  };

  const result = await userService.getUsers(query);

  return ApiResponse.paginated(
    res,
    result.users,
    {
      page: result.page,
      limit: result.limit,
      total: result.total,
    },
    'Users retrieved successfully'
  );
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await userService.getUserById(id);

  return ApiResponse.success(res, { user }, 'User retrieved successfully');
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updatedBy = req.user!.userId;
  const data = req.body;

  const user = await userService.updateUser(id, data, updatedBy);

  return ApiResponse.success(res, { user }, 'User updated successfully');
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const deletedBy = req.user!.userId;

  await userService.deleteUser(id, deletedBy);

  return ApiResponse.success(res, null, 'User deleted successfully');
});

export const getUserStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await userService.getUserStats();

  return ApiResponse.success(res, { stats }, 'User statistics retrieved successfully');
});
