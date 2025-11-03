const path = require('path');
require('dotenv').config(); // Backend dizinindeki .env dosyasını kullan

// Initialize Sentry FIRST (before any other code)
const { initSentry, sentryErrorHandler } = require('./src/utils/sentry');
initSentry();

const fastify = require('fastify')({ logger: true });
const fs = require('fs-extra');

// CORS plugin
fastify.register(require('@fastify/cors'), {
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
});

// Multipart plugin for file uploads
fastify.register(require('@fastify/multipart'), {
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Rate limiting plugin - Global rate limit
fastify.register(require('@fastify/rate-limit'), {
  global: true,
  max: 100, // Maximum 100 requests
  timeWindow: '15 minutes', // Per 15 minutes
  cache: 10000, // Cache up to 10,000 different client IPs
  // allowList: ['127.0.0.1'], // Remove for testing - in production, add trusted IPs here
  redis: null, // Can be configured with Redis for distributed systems
  skipOnError: true, // Skip rate limiting if there's an error
  keyGenerator: (request) => {
    // Use IP address as key
    return request.ip || request.headers['x-forwarded-for'] || request.socket.remoteAddress;
  },
  errorResponseBuilder: (request, context) => {
    return {
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded. You have made ${context.max} requests in ${context.after}. Please try again later.`
    };
  }
});

// JWT plugin
fastify.register(require('@fastify/jwt'), {
  secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  sign: {
    expiresIn: '7d' // Access token expires in 7 days
  }
});

// Swagger/OpenAPI Documentation
fastify.register(require('@fastify/swagger'), {
  openapi: {
    info: {
      title: 'Pricelist & Offer Management API',
      description: 'API documentation for Pricelist and Offer Management System',
      version: '1.0.0',
      contact: {
        name: 'API Support',
        email: 'support@pricelist-app.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token'
        }
      }
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Pricelists', description: 'Pricelist management' },
      { name: 'Items', description: 'Pricelist items management' },
      { name: 'Offers', description: 'Offer management' },
      { name: 'Customers', description: 'Customer management' },
      { name: 'Companies', description: 'Company management' },
      { name: 'Admin', description: 'Admin endpoints (requires admin role)' },
      { name: 'Health', description: 'Health check endpoints' }
    ]
  }
});

// Swagger UI
fastify.register(require('@fastify/swagger-ui'), {
  routePrefix: '/api/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: true,
    displayRequestDuration: true
  },
  staticCSP: true,
  transformStaticCSP: (header) => header,
  transformSpecification: (swaggerObject, request, reply) => { return swaggerObject },
  transformSpecificationClone: true
});

// PostgreSQL plugin
console.log('Environment variables:', {
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD ? '[SET]' : '[NOT SET]',
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_NAME: process.env.DB_NAME
});

// Object config yerine connection string kullanmayı dene
fastify.register(require('@fastify/postgres'), {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // maximum connection pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

// Static files for frontend (built React app)
fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, 'public'),
  prefix: '/',
  wildcard: false
});

// Static files for uploads (separate registration with decorateReply: false)
fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, 'uploads'),
  prefix: '/uploads/',
  decorateReply: false
});

// Routes
fastify.register(require('./src/routes/authRoutes'), { prefix: '/api/auth' });
fastify.register(require('./src/routes/pricelistRoutes'), { prefix: '/api' });
fastify.register(require('./src/routes/adminRoutes'), { prefix: '/api/admin' });
fastify.register(require('./src/routes/offerRoutes'), { prefix: '/api' });
fastify.register(require('./src/routes/customerRoutes'), { prefix: '/api' });
fastify.register(require('./src/routes/companyRoutes'), { prefix: '/api' });

// Root endpoint - API information
fastify.get('/', async (request, reply) => {
  return {
    name: 'Pricelist & Offer Management API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      api: 'http://localhost:3000/api',
      documentation: 'http://localhost:3000/api/docs',
      health: 'http://localhost:3000/health'
    },
    message: 'Welcome to Pricelist API! Visit /api/docs for Swagger documentation.'
  };
});

// Health check
fastify.get('/health', {
  schema: {
    tags: ['Health'],
    summary: 'Health check',
    description: 'Check if the server is running',
    response: {
      200: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          message: { type: 'string' }
        }
      }
    }
  }
}, async (request, reply) => {
  return { status: 'OK', message: 'Server is running' };
});

// Sentry error handler (should be registered AFTER all routes)
sentryErrorHandler(fastify);

// SPA fallback handler
fastify.setNotFoundHandler(async (request, reply) => {
  // API routes should return 404
  if (request.url.startsWith('/api/')) {
    reply.code(404).send({ error: 'Not found' });
    return;
  }

  // For all other routes, serve index.html (SPA fallback)
  return reply.sendFile('index.html');
});

// Database test endpoint
fastify.get('/api/test-db', async (request, reply) => {
  try {
    const client = await fastify.pg.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    return { status: 'success', time: result.rows[0].now };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
});

// Ensure required directories exist
const ensureDirectories = async () => {
  const uploadsDir = path.join(__dirname, 'uploads');
  const avatarsDir = path.join(__dirname, 'uploads', 'avatars');
  
  try {
    await fs.ensureDir(uploadsDir);
    await fs.ensureDir(avatarsDir);
    fastify.log.info('Upload directories created/verified');
  } catch (err) {
    fastify.log.error('Failed to create upload directories:', err);
    throw err;
  }
};

// Start server
const start = async () => {
  try {
    // Ensure upload directories exist before starting server
    await ensureDirectories();
    
    const port = process.env.PORT || 3001;
    await fastify.listen({ port, host: '0.0.0.0' });
    fastify.log.info(`Server listening on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();