import { ApiError } from '../src/utils/ApiError';
import { ApiResponse } from '../src/utils/ApiResponse';
import { Response } from 'express';

describe('Utility Classes', () => {
  describe('ApiError', () => {
    it('should create bad request error', () => {
      const error = ApiError.badRequest('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Invalid input');
    });

    it('should create unauthorized error', () => {
      const error = ApiError.unauthorized('Not authenticated');
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Not authenticated');
    });

    it('should create forbidden error', () => {
      const error = ApiError.forbidden('Access denied');
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Access denied');
    });

    it('should create not found error', () => {
      const error = ApiError.notFound('Resource not found');
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Resource not found');
    });

    it('should create conflict error', () => {
      const error = ApiError.conflict('Resource already exists');
      expect(error.statusCode).toBe(409);
      expect(error.message).toBe('Resource already exists');
    });

    it('should create internal error', () => {
      const error = ApiError.internal('Server error');
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Server error');
    });

    it('should default to Bad Request for invalid status code', () => {
      const error = new ApiError(999, 'Invalid');
      expect(error.statusCode).toBe(999);
    });

    it('should be instance of Error', () => {
      const error = ApiError.badRequest('Test');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiError);
    });
  });

  describe('ApiResponse', () => {
    let mockRes: Partial<Response>;

    beforeEach(() => {
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
    });

    it('should send success response', () => {
      ApiResponse.success(mockRes as Response, { data: 'test' }, 'Success');

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success',
        data: { data: 'test' },
      });
    });

    it('should send created response', () => {
      ApiResponse.created(mockRes as Response, { id: '123' }, 'Created');

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Created',
        data: { id: '123' },
      });
    });

    it('should send error response', () => {
      ApiResponse.error(mockRes as Response, 'Error occurred', 400);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error occurred',
      });
    });

    it('should send paginated response', () => {
      const paginationData = {
        data: [1, 2, 3],
        total: 10,
        page: 1,
        limit: 3,
        totalPages: 4,
        hasMore: true,
      };

      ApiResponse.paginated(mockRes as Response, paginationData, 'Items retrieved');

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Items retrieved',
        data: [1, 2, 3],
        pagination: {
          total: 10,
          page: 1,
          limit: 3,
          totalPages: 4,
          hasMore: true,
        },
      });
    });
  });
});

describe('Validation Utils', () => {
  describe('Email validation', () => {
    const emailRegex = /^\S+@\S+\.\S+$/;

    it('should validate correct emails', () => {
      expect(emailRegex.test('test@example.com')).toBe(true);
      expect(emailRegex.test('user.name@domain.org')).toBe(true);
      expect(emailRegex.test('user+tag@example.com')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(emailRegex.test('invalid')).toBe(false);
      expect(emailRegex.test('invalid@')).toBe(false);
      expect(emailRegex.test('@domain.com')).toBe(false);
      expect(emailRegex.test('test@domain')).toBe(false);
    });
  });

  describe('Password strength', () => {
    const isStrongPassword = (password: string): boolean => {
      return password.length >= 8;
    };

    it('should accept strong passwords', () => {
      expect(isStrongPassword('Test123!@#')).toBe(true);
      expect(isStrongPassword('SecurePass1!')).toBe(true);
    });

    it('should reject weak passwords', () => {
      expect(isStrongPassword('short')).toBe(false);
      expect(isStrongPassword('123')).toBe(false);
    });
  });
});

describe('ObjectId validation', () => {
  const isValidObjectId = (id: string): boolean => {
    return /^[a-f\d]{24}$/i.test(id);
  };

  it('should validate correct ObjectIds', () => {
    expect(isValidObjectId('507f1f77bcf86cd799439011')).toBe(true);
    expect(isValidObjectId('5f5b5cf65a7eb52f7c9e3b9a')).toBe(true);
  });

  it('should reject invalid ObjectIds', () => {
    expect(isValidObjectId('invalid')).toBe(false);
    expect(isValidObjectId('123')).toBe(false);
    expect(isValidObjectId('')).toBe(false);
  });
});

describe('Date utils', () => {
  describe('isExpired', () => {
    const isExpired = (date: Date): boolean => {
      return date.getTime() < Date.now();
    };

    it('should return true for past dates', () => {
      const pastDate = new Date(Date.now() - 86400000);
      expect(isExpired(pastDate)).toBe(true);
    });

    it('should return false for future dates', () => {
      const futureDate = new Date(Date.now() + 86400000);
      expect(isExpired(futureDate)).toBe(false);
    });
  });

  describe('formatDate', () => {
    const formatDate = (date: Date): string => {
      return date.toISOString().split('T')[0];
    };

    it('should format date correctly', () => {
      const date = new Date('2024-03-15T12:00:00Z');
      expect(formatDate(date)).toBe('2024-03-15');
    });
  });
});

describe('String utils', () => {
  describe('slugify', () => {
    const slugify = (str: string): string => {
      return str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    };

    it('should convert string to slug', () => {
      expect(slugify('Hello World')).toBe('hello-world');
      expect(slugify('Test Page Title')).toBe('test-page-title');
      expect(slugify('Special @#$ Characters!')).toBe('special-characters');
    });

    it('should handle edge cases', () => {
      expect(slugify('  spaces  ')).toBe('spaces');
      expect(slugify('multiple---dashes')).toBe('multiple-dashes');
    });
  });

  describe('truncate', () => {
    const truncate = (str: string, length: number): string => {
      if (str.length <= length) return str;
      return str.slice(0, length) + '...';
    };

    it('should truncate long strings', () => {
      expect(truncate('This is a long string', 10)).toBe('This is a ...');
    });

    it('should not truncate short strings', () => {
      expect(truncate('Short', 10)).toBe('Short');
    });
  });
});

describe('Array utils', () => {
  describe('unique', () => {
    const unique = <T>(arr: T[]): T[] => {
      return [...new Set(arr)];
    };

    it('should remove duplicates', () => {
      expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
      expect(unique(['a', 'b', 'a'])).toEqual(['a', 'b']);
    });
  });

  describe('groupBy', () => {
    const groupBy = <T>(arr: T[], key: keyof T): Record<string, T[]> => {
      return arr.reduce((acc, item) => {
        const groupKey = String(item[key]);
        if (!acc[groupKey]) {
          acc[groupKey] = [];
        }
        acc[groupKey].push(item);
        return acc;
      }, {} as Record<string, T[]>);
    };

    it('should group items by key', () => {
      const items = [
        { category: 'a', value: 1 },
        { category: 'b', value: 2 },
        { category: 'a', value: 3 },
      ];

      const grouped = groupBy(items, 'category');
      expect(grouped.a).toHaveLength(2);
      expect(grouped.b).toHaveLength(1);
    });
  });
});
