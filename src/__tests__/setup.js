/**
 * Test Setup
 * Configures test environment following Kent C. Dodds' best practices
 */

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

// Setup before all tests
beforeAll(async () => {
  // Use in-memory MongoDB for tests
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri);
  
  // Set environment variables for tests
  process.env.NODE_ENV = 'test';
  process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-for-testing-only';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-only';
});

// Cleanup after all tests
afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

// Clear database after each test
// Kent C. Dodds: "Each test should be independent"
afterEach(async () => {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany();
    }
  }
});

// Global test helpers
global.createTestUser = async (overrides = {}) => {
  const User = require('../models/User');
  return User.create({
    email: overrides.email || 'test@example.com',
    password: overrides.password || 'TestPassword123!',
    name: overrides.name || 'Test User',
    ...overrides,
  });
};

// Silence console during tests (optional)
if (process.env.SILENT_TESTS) {
  global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };
}
