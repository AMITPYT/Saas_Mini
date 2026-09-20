import crypto from 'crypto';
import { User, IUserDocument } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';
import { AuditLog, AuditAction } from '../models/AuditLog';
import { ApiError } from '../utils/ApiError';
import {
  generateTokenPair,
  verifyRefreshToken,
  TokenPair,
  getRefreshTokenExpiry,
} from '../utils/jwt';
import { getRedisClient } from '../config/redis';
import { logger } from '../utils/logger';

export interface AuthResult {
  user: IUserDocument;
  tokens: TokenPair;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface LoginData {
  email: string;
  password: string;
}

class AuthService {
  async register(
    data: RegisterData,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthResult> {
    const existingUser = await User.findByEmail(data.email);
    if (existingUser) {
      throw ApiError.conflict('Email already registered');
    }

    const user = await User.create({
      email: data.email,
      password: data.password,
      name: data.name,
    });

    const tokens = await this.createSession(user, ipAddress, userAgent);

    await this.logAudit(user._id.toString(), 'user.register', 'User', user._id, {
      email: user.email,
      ipAddress,
    });

    return { user, tokens };
  }

  async login(
    data: LoginData,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthResult> {
    const user = await User.findOne({ email: data.email.toLowerCase() }).select(
      '+password'
    );

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Account is deactivated');
    }

    const isPasswordValid = await user.comparePassword(data.password);
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    const tokens = await this.createSession(user, ipAddress, userAgent);

    await this.logAudit(user._id.toString(), 'user.login', 'User', user._id, {
      ipAddress,
      userAgent,
    });

    return { user, tokens };
  }

  async logout(
    userId: string,
    refreshToken?: string,
    ipAddress?: string
  ): Promise<void> {
    if (refreshToken) {
      // Revoke specific refresh token
      await RefreshToken.findOneAndUpdate(
        { token: refreshToken, user: userId },
        { isRevoked: true, revokedAt: new Date() }
      );
    } else {
      // Revoke all refresh tokens for user
      await RefreshToken.updateMany(
        { user: userId, isRevoked: false },
        { isRevoked: true, revokedAt: new Date() }
      );
    }

    // Invalidate access token in Redis blacklist
    try {
      const redis = getRedisClient();
      await redis.setEx(`blacklist:user:${userId}`, 900, 'true'); // 15 min
    } catch (error) {
      logger.error('Failed to blacklist token in Redis:', error);
    }

    await this.logAudit(userId, 'user.logout', 'User', undefined, { ipAddress });
  }

  async refreshTokens(
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<TokenPair> {
    // Verify the refresh token
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw ApiError.unauthorized('Invalid refresh token');
    }

    // Find the token in database
    const storedToken = await RefreshToken.findOne({
      token: refreshToken,
      user: payload.userId,
    });

    if (!storedToken) {
      throw ApiError.unauthorized('Refresh token not found');
    }

    if (storedToken.isRevoked) {
      // Token reuse detected - revoke all tokens for user
      await RefreshToken.updateMany(
        { user: payload.userId },
        { isRevoked: true, revokedAt: new Date() }
      );
      throw ApiError.unauthorized('Token reuse detected. All sessions revoked.');
    }

    if (storedToken.isExpired) {
      throw ApiError.unauthorized('Refresh token expired');
    }

    // Get user
    const user = await User.findById(payload.userId);
    if (!user || !user.isActive) {
      throw ApiError.unauthorized('User not found or inactive');
    }

    // Revoke old token
    storedToken.isRevoked = true;
    storedToken.revokedAt = new Date();

    // Generate new token pair
    const tokens = generateTokenPair({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Store new refresh token
    storedToken.replacedByToken = tokens.refreshToken;
    await storedToken.save();

    await RefreshToken.create({
      token: tokens.refreshToken,
      user: user._id,
      expiresAt: tokens.refreshTokenExpiry,
      createdByIp: ipAddress,
      userAgent,
    });

    return tokens;
  }

  async forgotPassword(email: string, ipAddress?: string): Promise<string> {
    const user = await User.findByEmail(email);
    if (!user) {
      // Return success even if user not found (security)
      return 'If the email exists, a reset link has been sent';
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Save hashed token to user
    await User.findByIdAndUpdate(user._id, {
      passwordResetToken: hashedToken,
      passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });

    await this.logAudit(
      user._id.toString(),
      'user.password_reset_request',
      'User',
      user._id,
      { ipAddress }
    );

    // In production, send email with resetToken
    // For now, return the token (remove in production)
    logger.info(`Password reset token for ${email}: ${resetToken}`);

    return resetToken; // Remove this in production, just send email
  }

  async resetPassword(
    token: string,
    newPassword: string,
    ipAddress?: string
  ): Promise<void> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      throw ApiError.badRequest('Invalid or expired reset token');
    }

    // Update password and clear reset token
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Revoke all refresh tokens
    await RefreshToken.updateMany(
      { user: user._id },
      { isRevoked: true, revokedAt: new Date() }
    );

    await this.logAudit(
      user._id.toString(),
      'user.password_reset',
      'User',
      user._id,
      { ipAddress }
    );
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    ipAddress?: string
  ): Promise<void> {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw ApiError.badRequest('Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    // Revoke all refresh tokens except current session
    await RefreshToken.updateMany(
      { user: userId },
      { isRevoked: true, revokedAt: new Date() }
    );

    await this.logAudit(userId, 'user.password_reset', 'User', user._id, {
      ipAddress,
    });
  }

  async getProfile(userId: string): Promise<IUserDocument> {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return user;
  }

  async updateProfile(
    userId: string,
    data: { name?: string; avatar?: string },
    ipAddress?: string
  ): Promise<IUserDocument> {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    await this.logAudit(userId, 'user.profile_update', 'User', user._id, {
      updatedFields: Object.keys(data),
      ipAddress,
    });

    return user;
  }

  private async createSession(
    user: IUserDocument,
    ipAddress?: string,
    userAgent?: string
  ): Promise<TokenPair> {
    const tokens = generateTokenPair({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    await RefreshToken.create({
      token: tokens.refreshToken,
      user: user._id,
      expiresAt: getRefreshTokenExpiry(),
      createdByIp: ipAddress,
      userAgent,
    });

    return tokens;
  }

  private async logAudit(
    userId: string,
    action: AuditAction,
    resource: string,
    resourceId?: unknown,
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

export const authService = new AuthService();
