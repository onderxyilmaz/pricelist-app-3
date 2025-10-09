async function authRoutes(fastify, options) {
  const path = require('path');
  const fs = require('fs-extra');
  const crypto = require('crypto');
  const bcrypt = require('bcryptjs');
  
  // Check if any users exist
  fastify.get('/check-users', async (request, reply) => {
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

  // Register new user
  fastify.post('/register', async (request, reply) => {
    try {
      const { firstName, lastName, email, password } = request.body;
      // username'i email'den türet (ör: email'in @ öncesi kısmı)
      const username = email ? email.split('@')[0] : null;
      if (!firstName || !lastName || !email || !password || !username) {
        return { success: false, message: 'Tüm alanlar gereklidir' };
      }

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
      return { success: true, user: result.rows[0] };
    } catch (err) {
      console.error('Register error:', err);
      return { success: false, message: err.message };
    }
  });

  // Login user
  fastify.post('/login', async (request, reply) => {
    try {
      const { email, password } = request.body;
      
      if (!email || !password) {
        return { success: false, message: 'E-mail ve şifre gereklidir' };
      }

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
      return { success: true, user };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // Get current user info
  fastify.get('/user/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const userId = parseInt(id); // Convert to integer
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

  // Update user profile
  fastify.put('/user/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const { firstName, lastName, avatarFilename, password } = request.body;
      
      // Convert ID to integer
      const userId = parseInt(id);
      
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

  // Upload avatar
  fastify.post('/upload-avatar/:id', async (request, reply) => {
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

  // Delete avatar
  fastify.delete('/avatar/:id', async (request, reply) => {
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