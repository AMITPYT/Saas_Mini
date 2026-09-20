import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { config } from '../config';

const REFRESH_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.env === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/v1/auth',
};

const getClientInfo = (req: Request) => ({
  ipAddress: req.ip || req.socket.remoteAddress,
  userAgent: req.headers['user-agent'],
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  const { ipAddress, userAgent } = getClientInfo(req);

  const { user, tokens } = await authService.register(
    { email, password, name },
    ipAddress,
    userAgent
  );

  // Set refresh token in HTTP-only cookie
  res.cookie('refreshToken', tokens.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

  return ApiResponse.created(
    res,
    {
      user,
      accessToken: tokens.accessToken,
      expiresAt: tokens.accessTokenExpiry,
    },
    'Registration successful'
  );
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const { ipAddress, userAgent } = getClientInfo(req);

  const { user, tokens } = await authService.login(
    { email, password },
    ipAddress,
    userAgent
  );

  // Set refresh token in HTTP-only cookie
  res.cookie('refreshToken', tokens.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

  return ApiResponse.success(
    res,
    {
      user,
      accessToken: tokens.accessToken,
      expiresAt: tokens.accessTokenExpiry,
    },
    'Login successful'
  );
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
  const { ipAddress } = getClientInfo(req);

  if (userId) {
    await authService.logout(userId, refreshToken, ipAddress);
  }

  // Clear refresh token cookie
  res.clearCookie('refreshToken', {
    ...REFRESH_TOKEN_COOKIE_OPTIONS,
    maxAge: 0,
  });

  return ApiResponse.success(res, null, 'Logout successful');
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken || req.body.refreshToken;
  const { ipAddress, userAgent } = getClientInfo(req);

  if (!token) {
    return ApiResponse.error(res, 'Refresh token required', 400);
  }

  const tokens = await authService.refreshTokens(token, ipAddress, userAgent);

  // Set new refresh token in HTTP-only cookie
  res.cookie('refreshToken', tokens.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

  return ApiResponse.success(
    res,
    {
      accessToken: tokens.accessToken,
      expiresAt: tokens.accessTokenExpiry,
    },
    'Token refreshed successfully'
  );
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  const { ipAddress } = getClientInfo(req);

  const result = await authService.forgotPassword(email, ipAddress);

  // In production, don't return the token, just send email
  return ApiResponse.success(
    res,
    config.env === 'development' ? { resetToken: result } : null,
    'If the email exists, a password reset link has been sent'
  );
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body;
  const { ipAddress } = getClientInfo(req);

  await authService.resetPassword(token, password, ipAddress);

  return ApiResponse.success(res, null, 'Password reset successful');
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { currentPassword, newPassword } = req.body;
  const { ipAddress } = getClientInfo(req);

  await authService.changePassword(userId, currentPassword, newPassword, ipAddress);

  // Clear refresh token cookie to force re-login
  res.clearCookie('refreshToken', {
    ...REFRESH_TOKEN_COOKIE_OPTIONS,
    maxAge: 0,
  });

  return ApiResponse.success(res, null, 'Password changed successfully');
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const user = await authService.getProfile(userId);

  return ApiResponse.success(res, { user }, 'Profile retrieved successfully');
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { name, avatar } = req.body;
  const { ipAddress } = getClientInfo(req);

  const user = await authService.updateProfile(userId, { name, avatar }, ipAddress);

  return ApiResponse.success(res, { user }, 'Profile updated successfully');
});
