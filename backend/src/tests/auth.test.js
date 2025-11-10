const { test, describe, expect, beforeAll, afterAll } = require('@jest/globals');
const build = require('../app');

describe('Auth API Endpoints', () => {
  let app;

  beforeAll(async () => {
    // Build app for testing
    app = await build({ logger: false });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/auth/check-users', () => {
    test('should check if users exist in database', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/check-users',
      });

      expect(response.statusCode).toBe(200);
      const payload = JSON.parse(response.payload);
      expect(payload).toHaveProperty('success');
      expect(payload).toHaveProperty('hasUsers');
      expect(typeof payload.hasUsers).toBe('boolean');
    });
  });

  describe('POST /api/auth/register', () => {
    test('should reject registration with missing fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'test@example.com',
          // Missing firstName, lastName, password
        },
      });

      expect(response.statusCode).toBe(400);
    });

    test('should reject registration with invalid email', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          firstName: 'Test',
          lastName: 'User',
          email: 'invalid-email',
          password: 'password123',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    test('should reject registration with short password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          password: '123', // Too short
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    test('should reject login with missing credentials', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'test@example.com',
          // Missing password
        },
      });

      expect(response.statusCode).toBe(400);
    });

    test('should reject login with invalid email format', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'invalid-email',
          password: 'password123',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    test('should reject login with non-existent user', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'nonexistent@example.com',
          password: 'password123',
        },
      });

      expect(response.statusCode).toBe(401);
      const payload = JSON.parse(response.payload);
      expect(payload.success).toBe(false);
    });
  });

  describe('POST /api/auth/refresh', () => {
    test('should reject refresh without token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/refresh',
        payload: {},
      });

      expect(response.statusCode).toBe(400);
    });

    test('should reject refresh with invalid token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/refresh',
        payload: {
          token: 'invalid-token-string',
        },
      });

      const payload = JSON.parse(response.payload);
      expect(payload.success).toBe(false);
    });
  });

  describe('GET /api/auth/user/:id', () => {
    test('should require authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/user/1',
      });

      expect(response.statusCode).toBe(401);
    });

    test('should reject invalid user ID format', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/user/invalid',
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
