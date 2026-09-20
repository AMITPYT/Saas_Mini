import { Response } from 'express';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface ApiResponseData<T> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: PaginationMeta;
}

export class ApiResponse {
  static success<T>(
    res: Response,
    data?: T,
    message = 'Success',
    statusCode = 200
  ): Response {
    const response: ApiResponseData<T> = {
      success: true,
      message,
      data,
    };
    return res.status(statusCode).json(response);
  }

  static created<T>(res: Response, data?: T, message = 'Created'): Response {
    return this.success(res, data, message, 201);
  }

  static paginated<T>(
    res: Response,
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
    },
    message = 'Success'
  ): Response {
    const totalPages = Math.ceil(pagination.total / pagination.limit);
    const meta: PaginationMeta = {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages,
      hasNextPage: pagination.page < totalPages,
      hasPrevPage: pagination.page > 1,
    };

    return res.status(200).json({
      success: true,
      message,
      data,
      meta,
    });
  }

  static noContent(res: Response): Response {
    return res.status(204).send();
  }

  static error(
    res: Response,
    message: string,
    statusCode = 500,
    errors?: Record<string, string>[]
  ): Response {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
    });
  }
}
