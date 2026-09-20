import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { config } from '../config';
import mongoose from 'mongoose';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let error = err;

  if (!(error instanceof ApiError)) {
    let statusCode = 500;
    let message = error.message || 'Internal Server Error';

    // Handle Mongoose CastError
    if (error instanceof mongoose.Error.CastError) {
      statusCode = 400;
      message = `Invalid ${error.path}: ${error.value}`;
      error = new ApiError(statusCode, message);
    }

    // Handle Mongoose ValidationError
    if (error instanceof mongoose.Error.ValidationError) {
      statusCode = 400;
      const errors = Object.values(error.errors).map((e) => e.message);
      message = `Validation Error: ${errors.join(', ')}`;
      error = new ApiError(statusCode, message);
    }

    // Handle Mongoose Duplicate Key Error
    const mongoError = error as unknown as {
      code?: number;
      keyValue?: Record<string, string>;
    };
    if (mongoError.code === 11000) {
      statusCode = 409;
      const field = Object.keys(mongoError.keyValue || {})[0] || 'Field';
      message = `${field} already exists`;
      error = new ApiError(statusCode, message);
    }

    // Handle JWT Errors
    if (error.name === 'JsonWebTokenError') {
      statusCode = 401;
      message = 'Invalid token';
      error = new ApiError(statusCode, message);
    }

    if (error.name === 'TokenExpiredError') {
      statusCode = 401;
      message = 'Token expired';
      error = new ApiError(statusCode, message);
    }

    if (!(error instanceof ApiError)) {
      error = new ApiError(statusCode, message, false);
    }
  }

  const apiError = error as ApiError;

  logger.error({
    message: apiError.message,
    statusCode: apiError.statusCode,
    stack: apiError.stack,
    path: req.path,
    method: req.method,
  });

  res.status(apiError.statusCode).json({
    success: false,
    message: apiError.message,
    ...(apiError.errors && { errors: apiError.errors }),
    ...(config.env === 'development' && { stack: apiError.stack }),
  });
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  next(ApiError.notFound(`Route ${req.originalUrl} not found`));
};
