const path = require('path');
require('dotenv').config(); // Backend dizinindeki .env dosyasını kullan
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
  password: process.env.DB_PASSWORD
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

// Health check
fastify.get('/health', async (request, reply) => {
  return { status: 'OK', message: 'Server is running' };
});

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