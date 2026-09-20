import { User, IUserDocument } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';
import { AuditLog } from '../models/AuditLog';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { GetUsersQuery, UpdateUserInput } from '../validators/user.validator';

export interface PaginatedUsers {
  users: IUserDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class UserService {
  async getUsers(query: GetUsersQuery): Promise<PaginatedUsers> {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const filter: Record<string, unknown> = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (role) {
      filter.role = role;
    }

    if (typeof isActive === 'boolean') {
      filter.isActive = isActive;
    }

    const skip = (page - 1) * limit;
    const sortOptions: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const [users, total] = await Promise.all([
      User.find(filter).sort(sortOptions).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserById(userId: string): Promise<IUserDocument> {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return user;
  }

  async updateUser(
    userId: string,
    data: UpdateUserInput,
    updatedBy: string
  ): Promise<IUserDocument> {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Prevent changing own role
    if (data.role && userId === updatedBy) {
      throw ApiError.forbidden('Cannot change your own role');
    }

    // Prevent deactivating own account
    if (data.isActive === false && userId === updatedBy) {
      throw ApiError.forbidden('Cannot deactivate your own account');
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      throw ApiError.notFound('User not found');
    }

    // Log the update
    await this.logAudit(updatedBy, 'user.profile_update', 'User', userId, {
      updatedFields: Object.keys(data),
      updatedBy,
    });

    return updatedUser;
  }

  async deleteUser(userId: string, deletedBy: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Prevent self-deletion
    if (userId === deletedBy) {
      throw ApiError.forbidden('Cannot delete your own account');
    }

    // Soft delete - just deactivate
    await User.findByIdAndUpdate(userId, { isActive: false });

    // Revoke all refresh tokens
    await RefreshToken.updateMany(
      { user: userId },
      { isRevoked: true, revokedAt: new Date() }
    );

    await this.logAudit(deletedBy, 'user.delete', 'User', userId, {
      deletedUser: user.email,
    });
  }

  async getUserStats(): Promise<{
    total: number;
    active: number;
    byRole: Record<string, number>;
  }> {
    const [total, active, roleStats] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
    ]);

    const byRole: Record<string, number> = {};
    roleStats.forEach((stat: { _id: string; count: number }) => {
      byRole[stat._id] = stat.count;
    });

    return { total, active, byRole };
  }

  private async logAudit(
    userId: string,
    action: string,
    resource: string,
    resourceId?: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    try {
      await AuditLog.create({
        user: userId,
        action,
        resource,
        resourceId,
        details,
      });
    } catch (error) {
      logger.error('Failed to create audit log:', error);
    }
  }
}

export const userService = new UserService();
