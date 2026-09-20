import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

// Increase timeout for integration tests
jest.setTimeout(30000);

// Mock logger to reduce noise in tests
jest.mock('../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));
