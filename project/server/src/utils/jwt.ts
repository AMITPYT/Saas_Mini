import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { config } from '../config';
import { v4 as uuidv4 } from 'uuid';

export interface TokenPayload extends JwtPayload {
  userId: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiry: Date;
  refreshTokenExpiry: Date;
}

const parseExpiry = (expiry: string): number => {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Invalid expiry format: ${expiry}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 60 * 60 * 24;
    default:
      throw new Error(`Invalid expiry unit: ${unit}`);
  }
};

export const generateAccessToken = (payload: {
  userId: string;
  email: string;
  role: string;
}): string => {
  const tokenPayload: Omit<TokenPayload, 'iat' | 'exp'> = {
    ...payload,
    type: 'access',
  };

  const options: SignOptions = {
    expiresIn: config.jwt.accessExpiry,
    issuer: 'saas-app',
    audience: 'saas-app-users',
  };

  return jwt.sign(tokenPayload, config.jwt.accessSecret, options);
};

export const generateRefreshToken = (payload: {
  userId: string;
  email: string;
  role: string;
}): string => {
  const tokenPayload: Omit<TokenPayload, 'iat' | 'exp'> = {
    ...payload,
    type: 'refresh',
    jti: uuidv4(), // Unique token ID for revocation
  };

  const options: SignOptions = {
    expiresIn: config.jwt.refreshExpiry,
    issuer: 'saas-app',
    audience: 'saas-app-users',
  };

  return jwt.sign(tokenPayload, config.jwt.refreshSecret, options);
};

export const generateTokenPair = (payload: {
  userId: string;
  email: string;
  role: string;
}): TokenPair => {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  const accessExpirySeconds = parseExpiry(config.jwt.accessExpiry);
  const refreshExpirySeconds = parseExpiry(config.jwt.refreshExpiry);

  return {
    accessToken,
    refreshToken,
    accessTokenExpiry: new Date(Date.now() + accessExpirySeconds * 1000),
    refreshTokenExpiry: new Date(Date.now() + refreshExpirySeconds * 1000),
  };
};

export const verifyAccessToken = (token: string): TokenPayload => {
  const payload = jwt.verify(token, config.jwt.accessSecret, {
    issuer: 'saas-app',
    audience: 'saas-app-users',
  }) as TokenPayload;

  if (payload.type !== 'access') {
    throw new Error('Invalid token type');
  }

  return payload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  const payload = jwt.verify(token, config.jwt.refreshSecret, {
    issuer: 'saas-app',
    audience: 'saas-app-users',
  }) as TokenPayload;

  if (payload.type !== 'refresh') {
    throw new Error('Invalid token type');
  }

  return payload;
};

export const decodeToken = (token: string): TokenPayload | null => {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch {
    return null;
  }
};

export const getRefreshTokenExpiry = (): Date => {
  const expirySeconds = parseExpiry(config.jwt.refreshExpiry);
  return new Date(Date.now() + expirySeconds * 1000);
};
