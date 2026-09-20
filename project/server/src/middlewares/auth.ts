import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';
import { User } from '../models/User';
import { getRedisClient } from '../config/redis';
import { logger } from '../utils/logger';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Access token required');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw ApiError.unauthorized('Access token required');
    }

    // Verify token
    const payload = verifyAccessToken(token);

    // Check if user is blacklisted (logged out)
    try {
      const redis = getRedisClient();
      const isBlacklisted = await redis.get(`blacklist:user:${payload.userId}`);
      if (isBlacklisted) {
        throw ApiError.unauthorized('Token has been revoked');
      }
    } catch (error) {
      // If Redis is down, continue (fail open for auth, fail closed for security)
      if (!(error instanceof ApiError)) {
        logger.warn('Redis unavailable for token blacklist check');
      } else {
        throw error;
      }
    }

    // Verify user still exists and is active
    const user = await User.findById(payload.userId).select('isActive');
    if (!user) {
      throw ApiError.unauthorized('User not found');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Account is deactivated');
    }

    // Attach user payload to request
    req.user = payload;
    next();
  } catch (error) {
    next(error);
  }
};

// Optional authentication - doesn't fail if no token
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return next();
    }

    try {
      const payload = verifyAccessToken(token);
      req.user = payload;
    } catch {
      // Invalid token, but optional auth so continue
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Role-based access control middleware
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Access denied. Required roles: ${allowedRoles.join(', ')}`
        )
      );
    }

    next();
  };
};

// Require specific role
export const requireRole = (role: string) => authorize(role);

// Require admin role
export const requireAdmin = authorize('admin');

// Require at least member role
export const requireMember = authorize('admin', 'member');

// Check if user owns the resource or is admin
export const requireOwnerOrAdmin = (
  getOwnerId: (req: Request) => string | Promise<string>
) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(ApiError.unauthorized('Authentication required'));
      }

      // Admins can access everything
      if (req.user.role === 'admin') {
        return next();
      }

      const ownerId = await getOwnerId(req);

      if (req.user.userId !== ownerId) {
        return next(ApiError.forbidden('Access denied'));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
