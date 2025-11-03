const { test, describe, expect, beforeAll, afterAll } = require('@jest/globals');
const build = require('../app');

describe('Pricelist API Endpoints', () => {
  let app;
  let authToken;

  beforeAll(async () => {
    app = await build({ logger: false });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/pricelists', () => {
    test('should require authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/pricelists',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/pricelists/:id', () => {
    test('should require authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/pricelists/1',
      });

      expect(response.statusCode).toBe(401);
    });

    test('should reject invalid ID format', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/pricelists/invalid',
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /api/pricelists', () => {
    test('should require authentication', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/pricelists',
        payload: {
          name: 'Test Pricelist',
          description: 'Test Description',
          currency: 'USD',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    test('should reject missing required fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/pricelists',
        payload: {
          // Missing name
          currency: 'USD',
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('DELETE /api/pricelists/:id', () => {
    test('should require authentication', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/pricelists/1',
      });

      expect(response.statusCode).toBe(401);
    });

    test('should reject invalid ID format', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/pricelists/invalid',
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /api/pricelists/:id/items', () => {
    test('should require authentication', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/pricelists/1/items',
        payload: {
          product_code: 'TEST001',
          product_name: 'Test Product',
          unit: 'pcs',
          price: 100,
        },
      });

      expect(response.statusCode).toBe(401);
    });

    test('should reject missing required fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/pricelists/1/items',
        payload: {
          product_code: 'TEST001',
          // Missing product_name, unit, price
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('PUT /api/items/:id', () => {
    test('should require authentication', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/items/1',
        payload: {
          product_name: 'Updated Product',
          price: 150,
        },
      });

      expect(response.statusCode).toBe(401);
    });

    test('should reject invalid ID format', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/items/invalid',
        payload: {
          product_name: 'Updated Product',
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('DELETE /api/items/:id', () => {
    test('should require authentication', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/items/1',
      });

      expect(response.statusCode).toBe(401);
    });

    test('should reject invalid ID format', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/items/invalid',
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
