async function authRoutes(fastify, options) {
  const path = require('path');
  const fs = require('fs-extra');
  const crypto = require('crypto');
  const bcrypt = require('bcryptjs');
  const { authenticate } = require('../middleware/auth');
  const { validate } = require('../middleware/validation');
  const authValidators = require('../validators/authValidators');

  // Stricter rate limit for auth endpoints (prevent brute force attacks)
  const authRateLimitConfig = {
    max: 5, // Maximum 5 login/register attempts
    timeWindow: '15 minutes',
    errorResponseBuilder: (request, context) => {
      return {
        success: false,
        statusCode: 429,
        error: 'Too Many Requests',
        message: 'Çok fazla deneme yaptınız. Lütfen 15 dakika sonra tekrar deneyin.'
      };
    }
  };

  // Check if any users exist
  fastify.get('/check-users', {
    schema: {
      tags: ['Auth'],
      summary: 'Check if any users exist',
      description: 'Checks if there are any registered users in the system',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            hasUsers: { type: 'boolean' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const client = await fastify.pg.connect();
      const result = await client.query('SELECT COUNT(*) FROM users');
      client.release();
      
      const hasUsers = parseInt(result.rows[0].count) > 0;
      return { success: true, hasUsers };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // Register new user (with rate limiting and validation)
  fastify.post('/register', {
    schema: {
      tags: ['Auth'],
      summary: 'Register new user',
      description: 'Register a new user account. First user becomes super admin. Rate limited to 5 attempts per 15 minutes.',
      body: {
        type: 'object',
        required: ['firstName', 'lastName', 'email', 'password'],
        properties: {
          firstName: { type: 'string', description: 'First name' },
          lastName: { type: 'string', description: 'Last name' },
          email: { type: 'string', format: 'email', description: 'Email address' },
          password: { type: 'string', minLength: 6, description: 'Password (min 6 characters)' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                username: { type: 'string' },
                first_name: { type: 'string' },
                last_name: { type: 'string' },
                email: { type: 'string' },
                avatar_filename: { type: 'string', nullable: true },
                role: { type: 'string', enum: ['user', 'admin', 'super_admin'] }
              }
            },
            token: { type: 'string', description: 'JWT token' }
          }
        }
      }
    },
    config: {
      rateLimit: authRateLimitConfig
    },
    preHandler: validate(authValidators.register, 'body')
  }, async (request, reply) => {
    try {
      // Validation is done by preHandler middleware
      const { firstName, lastName, email, password } = request.body;
      // username'i email'den türet (ör: email'in @ öncesi kısmı)
      const username = email.split('@')[0];

      const client = await fastify.pg.connect();

      // Check if email or username already exists
      const existingUser = await client.query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
      if (existingUser.rows.length > 0) {
        client.release();
        return { success: false, message: 'Bu e-mail veya kullanıcı adı zaten kullanımda' };
      }

      // Check if this is the first user (will be super admin)
      const userCount = await client.query('SELECT COUNT(*) FROM users');
      const isFirstUser = parseInt(userCount.rows[0].count) === 0;
      const role = isFirstUser ? 'super_admin' : 'user';

      // Şifreyi güvenli şekilde hashle
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Insert new user
      const result = await client.query(
        'INSERT INTO users (username, first_name, last_name, email, password, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, first_name, last_name, email, avatar_filename, role',
        [username, firstName, lastName, email, hashedPassword, role]
      );

      client.release();

      const user = result.rows[0];

      // Generate JWT token
      const token = fastify.jwt.sign({
        id: user.id,
        email: user.email,
        role: user.role
      });

      return {
        success: true,
        user,
        token
      };
    } catch (err) {
      console.error('Register error:', err);
      return { success: false, message: err.message };
    }
  });

  // Login user (with rate limiting and validation)
  fastify.post('/login', {
    schema: {
      tags: ['Auth'],
      summary: 'User login',
      description: 'Authenticate user and receive JWT token. Rate limited to 5 attempts per 15 minutes.',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', description: 'Email address' },
          password: { type: 'string', description: 'Password' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                first_name: { type: 'string' },
                last_name: { type: 'string' },
                email: { type: 'string' },
                avatar_filename: { type: 'string', nullable: true },
                role: { type: 'string' }
              }
            },
            token: { type: 'string', description: 'JWT token' }
          }
        }
      }
    },
    config: {
      rateLimit: authRateLimitConfig
    },
    preHandler: validate(authValidators.login, 'body')
  }, async (request, reply) => {
    try {
      // Validation is done by preHandler middleware
      const { email, password } = request.body;

      const client = await fastify.pg.connect();
      const result = await client.query(
        'SELECT id, first_name, last_name, email, avatar_filename, role, password FROM users WHERE email = $1',
        [email]
      );

      client.release();

      if (result.rows.length === 0) {
        return { success: false, message: 'E-mail veya şifre hatalı' };
      }

      // Şifreyi doğrula
      const user = result.rows[0];
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return { success: false, message: 'E-mail veya şifre hatalı' };
      }

      // Şifreyi response'dan çıkar
      delete user.password;

      // Generate JWT token
      const token = fastify.jwt.sign({
        id: user.id,
        email: user.email,
        role: user.role
      });

      return {
        success: true,
        user,
        token
      };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // Token refresh endpoint
  fastify.post('/refresh', {
    schema: {
      tags: ['Auth'],
      summary: 'Refresh JWT token',
      description: 'Generate a new JWT token using existing valid token',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            user: { type: 'object' },
            token: { type: 'string', description: 'New JWT token' }
          }
        },
        401: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    },
    preHandler: authenticate
  }, async (request, reply) => {
    try {
      const { id, email, role } = request.user;

      // Verify user still exists in database
      const client = await fastify.pg.connect();
      const result = await client.query(
        'SELECT id, first_name, last_name, email, avatar_filename, role FROM users WHERE id = $1',
        [id]
      );
      client.release();

      if (result.rows.length === 0) {
        return reply.code(401).send({
          success: false,
          message: 'Kullanıcı bulunamadı'
        });
      }

      const user = result.rows[0];

      // Generate new token
      const token = fastify.jwt.sign({
        id: user.id,
        email: user.email,
        role: user.role
      });

      return {
        success: true,
        user,
        token
      };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // Get current user info (protected)
  fastify.get('/user/:id', {
    schema: {
      tags: ['Auth'],
      summary: 'Get user by ID',
      description: 'Retrieve user information. Users can access their own profile, admins can access any profile.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer', description: 'User ID' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                first_name: { type: 'string' },
                last_name: { type: 'string' },
                email: { type: 'string' },
                avatar_filename: { type: 'string', nullable: true },
                role: { type: 'string' }
              }
            }
          }
        },
        403: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    },
    preHandler: authenticate
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const userId = parseInt(id); // Convert to integer

      // Check if user is accessing their own profile or is admin
      if (request.user.id !== userId && request.user.role !== 'admin' && request.user.role !== 'super_admin') {
        return reply.code(403).send({
          success: false,
          message: 'Bu profili görüntüleme yetkiniz yok'
        });
      }

      const client = await fastify.pg.connect();
      const result = await client.query(
        'SELECT id, first_name, last_name, email, avatar_filename, role FROM users WHERE id = $1',
        [userId]
      );
      client.release();

      if (result.rows.length === 0) {
        return { success: false, message: 'Kullanıcı bulunamadı' };
      }

      return { success: true, user: result.rows[0] };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // Update user profile (protected)
  fastify.put('/user/:id', {
    schema: {
      tags: ['Auth'],
      summary: 'Update user profile',
      description: 'Update user information. Users can update their own profile, admins can update any profile.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer', description: 'User ID' }
        }
      },
      body: {
        type: 'object',
        required: ['firstName', 'lastName'],
        properties: {
          firstName: { type: 'string', description: 'First name' },
          lastName: { type: 'string', description: 'Last name' },
          avatarFilename: { type: 'string', nullable: true, description: 'Avatar filename' },
          password: { type: 'string', minLength: 6, description: 'New password (optional)' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            user: { type: 'object' }
          }
        },
        403: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    },
    preHandler: authenticate
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { firstName, lastName, avatarFilename, password } = request.body;

      // Convert ID to integer
      const userId = parseInt(id);

      // Check if user is updating their own profile or is admin
      if (request.user.id !== userId && request.user.role !== 'admin' && request.user.role !== 'super_admin') {
        return reply.code(403).send({
          success: false,
          message: 'Bu profili düzenleme yetkiniz yok'
        });
      }

      const client = await fastify.pg.connect();

      // Check if user exists first
      const checkUser = await client.query('SELECT * FROM users WHERE id = $1', [userId]);

      if (checkUser.rows.length === 0) {
        client.release();
        return { success: false, message: 'Kullanıcı bulunamadı' };
      }

      let query, params;
      if (password) {
        // Şifre güncellemesi varsa - hash'le
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        query = 'UPDATE users SET first_name = $1, last_name = $2, avatar_filename = $3, password = $4, updated_at = NOW() WHERE id = $5 RETURNING id, first_name, last_name, email, avatar_filename, role';
        params = [firstName, lastName, avatarFilename, hashedPassword, userId];
      } else {
        // Şifre güncellemesi yoksa
        query = 'UPDATE users SET first_name = $1, last_name = $2, avatar_filename = $3, updated_at = NOW() WHERE id = $4 RETURNING id, first_name, last_name, email, avatar_filename, role';
        params = [firstName, lastName, avatarFilename, userId];
      }

      const result = await client.query(query, params);
      client.release();

      if (result.rows.length === 0) {
        return { success: false, message: 'Kullanıcı bulunamadı' };
      }

      return { success: true, user: result.rows[0] };
    } catch (err) {
      console.error('Update user error:', err);
      return { success: false, message: err.message };
    }
  });

  // Upload avatar (protected)
  fastify.post('/upload-avatar/:id', {
    schema: {
      tags: ['Auth'],
      summary: 'Upload user avatar',
      description: 'Upload an avatar image for a user. Only image files are allowed.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer', description: 'User ID' }
        }
      },
      consumes: ['multipart/form-data'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            filename: { type: 'string', description: 'Uploaded filename' }
          }
        }
      }
    },
    preHandler: authenticate
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const userId = parseInt(id); // Convert to integer
      const data = await request.file();
      
      if (!data) {
        return { success: false, message: 'Dosya bulunamadı' };
      }

      // Check file type
      if (!data.mimetype.startsWith('image/')) {
        return { success: false, message: 'Sadece resim dosyaları yüklenebilir' };
      }

      // Generate unique filename
      const fileExtension = path.extname(data.filename);
      const uniqueFilename = `avatar_${userId}_${crypto.randomUUID()}${fileExtension}`;
      const uploadPath = path.join(__dirname, '../../uploads/avatars', uniqueFilename);
      
      // Get current user to check for existing avatar
      const client = await fastify.pg.connect();
      const userResult = await client.query(
        'SELECT avatar_filename FROM users WHERE id = $1',
        [userId]
      );
      
      // Delete old avatar if exists
      if (userResult.rows.length > 0 && userResult.rows[0].avatar_filename) {
        const oldAvatarPath = path.join(__dirname, '../../uploads/avatars', userResult.rows[0].avatar_filename);
        if (await fs.pathExists(oldAvatarPath)) {
          await fs.remove(oldAvatarPath);
        }
      }
      
      // Save new file
      await data.file.pipe(fs.createWriteStream(uploadPath));
      
      // Update database with new avatar filename
      await client.query(
        'UPDATE users SET avatar_filename = $1 WHERE id = $2',
        [uniqueFilename, userId]
      );
      
      client.release();
      return { success: true, filename: uniqueFilename };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // Delete avatar (protected)
  fastify.delete('/avatar/:id', {
    schema: {
      tags: ['Auth'],
      summary: 'Delete user avatar',
      description: 'Delete the avatar image for a user',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer', description: 'User ID' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    },
    preHandler: authenticate
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const userId = parseInt(id); // Convert to integer
      const client = await fastify.pg.connect();
      
      // Get current avatar filename
      const userResult = await client.query(
        'SELECT avatar_filename FROM users WHERE id = $1',
        [userId]
      );
      
      if (userResult.rows.length > 0 && userResult.rows[0].avatar_filename) {
        const avatarPath = path.join(__dirname, '../../uploads/avatars', userResult.rows[0].avatar_filename);
        if (await fs.pathExists(avatarPath)) {
          await fs.remove(avatarPath);
        }
        
        // Update database to remove avatar filename
        await client.query(
          'UPDATE users SET avatar_filename = NULL WHERE id = $1',
          [userId]
        );
      }
      
      client.release();
      return { success: true, message: 'Avatar silindi' };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });
}

module.exports = authRoutes;