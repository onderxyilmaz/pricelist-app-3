require('dotenv').config();
const fastify = require('fastify')({ logger: true });
const path = require('path');
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

// PostgreSQL plugin
fastify.register(require('@fastify/postgres'), {
  connectionString: `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`
});

// Static files
fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, 'uploads'),
  prefix: '/uploads/'
});

// Routes
fastify.register(require('./src/routes/authRoutes'), { prefix: '/api/auth' });
fastify.register(require('./src/routes/pricelistRoutes'), { prefix: '/api' });
fastify.register(require('./src/routes/adminRoutes'), { prefix: '/api/admin' });

// Health check
fastify.get('/health', async (request, reply) => {
  return { status: 'OK', message: 'Server is running' };
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

// Start server
const start = async () => {
  try {
    const port = process.env.PORT || 3001;
    await fastify.listen({ port, host: '0.0.0.0' });
    fastify.log.info(`Server listening on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();