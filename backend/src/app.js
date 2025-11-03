const fastify = require('fastify');
const path = require('path');
require('dotenv').config();

async function build(opts = {}) {
  const app = fastify({
    logger: opts.logger !== undefined ? opts.logger : true,
  });

  // Register plugins
  app.register(require('@fastify/postgres'), {
    connectionString: process.env.DATABASE_URL,
  });

  app.register(require('@fastify/jwt'), {
    secret: process.env.JWT_SECRET,
  });

  app.register(require('@fastify/cors'), {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  });

  app.register(require('@fastify/multipart'), {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  });

  app.register(require('@fastify/rate-limit'), {
    max: 100,
    timeWindow: '1 minute',
  });

  app.register(require('@fastify/static'), {
    root: path.join(__dirname, '../uploads'),
    prefix: '/uploads/',
  });

  // Swagger/OpenAPI Documentation
  app.register(require('@fastify/swagger'), {
    openapi: {
      info: {
        title: 'Pricelist & Offer Management API',
        description: 'API documentation for Pricelist and Offer Management System',
        version: '1.0.0',
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      tags: [
        { name: 'Auth', description: 'Authentication endpoints' },
        { name: 'Pricelists', description: 'Pricelist management' },
        { name: 'Items', description: 'Pricelist items management' },
        { name: 'Offers', description: 'Offer management' },
        { name: 'Customers', description: 'Customer management' },
        { name: 'Companies', description: 'Company management' },
        { name: 'Health', description: 'Health check endpoints' },
      ],
    },
  });

  app.register(require('@fastify/swagger-ui'), {
    routePrefix: '/api/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });

  // Register routes
  app.register(require('./routes/authRoutes'), { prefix: '/api/auth' });
  app.register(require('./routes/pricelistRoutes'), { prefix: '/api' });
  app.register(require('./routes/offerRoutes'), { prefix: '/api' });
  app.register(require('./routes/customerRoutes'), { prefix: '/api' });
  app.register(require('./routes/companyRoutes'), { prefix: '/api' });

  // Health check
  app.get('/health', {
    schema: {
      tags: ['Health'],
      summary: 'Health check',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async () => {
    return { status: 'OK', message: 'Server is running' };
  });

  // Root endpoint
  app.get('/', async () => {
    return {
      name: 'Pricelist & Offer Management API',
      version: '1.0.0',
      status: 'running',
      endpoints: {
        api: 'http://localhost:3000/api',
        documentation: 'http://localhost:3000/api/docs',
        health: 'http://localhost:3000/health',
      },
    };
  });

  return app;
}

module.exports = build;
