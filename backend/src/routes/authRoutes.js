async function authRoutes(fastify, options) {
  const path = require('path');
  const fs = require('fs-extra');
  const crypto = require('crypto');
  const bcrypt = require('bcryptjs');
  const jwt = require('jsonwebtoken');

  // Helper function to generate refresh token
  const generateRefreshToken = () => {
    return crypto.randomBytes(64).toString('hex');
  };

  // Helper function to hash refresh token
  const hashRefreshToken = async (token) => {
    const saltRounds = 12;
    return await bcrypt.hash(token, saltRounds);
  };

  // Helper function to verify refresh token
  const verifyRefreshToken = async (token, hash) => {
    return await bcrypt.compare(token, hash);
  };

  // Helper function to create tokens (access + refresh)
  const createTokens = async (user, client) => {
    // Create access token (30 minutes)
    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '30m' }
    );

    // Create refresh token (30 days)
    const refreshToken = generateRefreshToken();
    const refreshTokenHash = await hashRefreshToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now

    // Save refresh token to database
    await client.query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshTokenHash, expiresAt]
    );

    return { accessToken, refreshToken };
  };

  // Cleanup expired refresh tokens (can be called periodically)
  const cleanupExpiredTokens = async (client) => {
    try {
      await client.query('DELETE FROM refresh_tokens WHERE expires_at < NOW()');
    } catch (err) {
      console.error('Error cleaning up expired tokens:', err);
    }
  };
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
    const client = await fastify.pg.connect();
    try {
      const { firstName, lastName, email, password } = request.body;
      // username'i email'den türet (ör: email'in @ öncesi kısmı)
      const username = email ? email.split('@')[0] : null;
      if (!firstName || !lastName || !email || !password || !username) {
        client.release();
        return { success: false, message: 'Tüm alanlar gereklidir' };
      }

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

      const user = result.rows[0];

      // Cleanup expired tokens before creating new ones
      await cleanupExpiredTokens(client);

      // Create access token and refresh token
      const { accessToken, refreshToken } = await createTokens(user, client);

      client.release();
      return { 
        success: true, 
        user, 
        accessToken, 
        refreshToken 
      };
    } catch (err) {
      client.release();
      console.error('Register error:', err);
      return { success: false, message: err.message };
    }
  });

  // Login user
  fastify.post('/login', async (request, reply) => {
    const client = await fastify.pg.connect();
    try {
      const { email, password } = request.body;
      
      if (!email || !password) {
        client.release();
        return { success: false, message: 'E-mail ve şifre gereklidir' };
      }

      const result = await client.query(
        'SELECT id, first_name, last_name, email, avatar_filename, role, password FROM users WHERE email = $1',
        [email]
      );
      
      if (result.rows.length === 0) {
        client.release();
        return { success: false, message: 'E-mail veya şifre hatalı' };
      }

      // Şifreyi doğrula
      const user = result.rows[0];
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        client.release();
        return { success: false, message: 'E-mail veya şifre hatalı' };
      }

      // Cleanup expired tokens before creating new ones
      await cleanupExpiredTokens(client);

      // Create access token and refresh token
      const { accessToken, refreshToken } = await createTokens(user, client);

      // Şifreyi response'dan çıkar
      delete user.password;
      
      client.release();
      return { 
        success: true, 
        user, 
        accessToken, 
        refreshToken 
      };
    } catch (err) {
      client.release();
      console.error('Login error:', err);
      return { success: false, message: err.message };
    }
  });

  // Refresh access token
  fastify.post('/refresh', async (request, reply) => {
    const client = await fastify.pg.connect();
    try {
      // Get refresh token from request body or Authorization header
      const refreshToken = request.body?.refreshToken || 
                          (request.headers.authorization?.startsWith('Bearer ') 
                            ? request.headers.authorization.substring(7) 
                            : null);

      if (!refreshToken) {
        client.release();
        return reply.code(401).send({ 
          success: false, 
          message: 'Refresh token bulunamadı' 
        });
      }

      // Find refresh token in database
      const tokenResult = await client.query(
        'SELECT rt.id, rt.user_id, rt.token_hash, rt.expires_at, u.id as user_id, u.email, u.role FROM refresh_tokens rt INNER JOIN users u ON rt.user_id = u.id WHERE rt.expires_at > NOW()'
      );

      // Try to find matching token
      let matchedToken = null;
      for (const row of tokenResult.rows) {
        const isValid = await verifyRefreshToken(refreshToken, row.token_hash);
        if (isValid) {
          matchedToken = row;
          break;
        }
      }

      if (!matchedToken) {
        client.release();
        return reply.code(401).send({ 
          success: false, 
          message: 'Geçersiz veya süresi dolmuş refresh token' 
        });
      }

      // Get user info
      const userResult = await client.query(
        'SELECT id, first_name, last_name, email, avatar_filename, role FROM users WHERE id = $1',
        [matchedToken.user_id]
      );

      if (userResult.rows.length === 0) {
        // Delete invalid token
        await client.query('DELETE FROM refresh_tokens WHERE id = $1', [matchedToken.id]);
        client.release();
        return reply.code(401).send({ 
          success: false, 
          message: 'Kullanıcı bulunamadı' 
        });
      }

      const user = userResult.rows[0];

      // Token rotation: Delete old refresh token and create new one
      await client.query('DELETE FROM refresh_tokens WHERE id = $1', [matchedToken.id]);
      
      // Create new tokens
      const { accessToken, refreshToken: newRefreshToken } = await createTokens(user, client);

      client.release();
      return { 
        success: true, 
        user, 
        accessToken, 
        refreshToken: newRefreshToken 
      };
    } catch (err) {
      client.release();
      console.error('Refresh token error:', err);
      return reply.code(500).send({ 
        success: false, 
        message: err.message 
      });
    }
  });

  // Logout user
  fastify.post('/logout', async (request, reply) => {
    const client = await fastify.pg.connect();
    try {
      // Get refresh token from request body
      const refreshToken = request.body?.refreshToken;

      if (!refreshToken) {
        client.release();
        return { 
          success: false, 
          message: 'Refresh token bulunamadı' 
        };
      }

      // Find and delete refresh token
      const tokenResult = await client.query(
        'SELECT id, token_hash FROM refresh_tokens WHERE expires_at > NOW()'
      );

      // Try to find matching token
      let matchedTokenId = null;
      for (const row of tokenResult.rows) {
        const isValid = await verifyRefreshToken(refreshToken, row.token_hash);
        if (isValid) {
          matchedTokenId = row.id;
          break;
        }
      }

      if (matchedTokenId) {
        await client.query('DELETE FROM refresh_tokens WHERE id = $1', [matchedTokenId]);
      }

      // Cleanup expired tokens
      await cleanupExpiredTokens(client);

      client.release();
      return { 
        success: true, 
        message: 'Başarıyla çıkış yapıldı' 
      };
    } catch (err) {
      client.release();
      console.error('Logout error:', err);
      return { 
        success: false, 
        message: err.message 
      };
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
      const { first_name, last_name, password } = request.body;
      
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
        query = 'UPDATE users SET first_name = $1, last_name = $2, password = $3, updated_at = NOW() WHERE id = $4 RETURNING id, first_name, last_name, email, avatar_filename, role';
        params = [first_name, last_name, hashedPassword, userId];
      } else {
        // Şifre güncellemesi yoksa
        query = 'UPDATE users SET first_name = $1, last_name = $2, updated_at = NOW() WHERE id = $3 RETURNING id, first_name, last_name, email, avatar_filename, role';
        params = [first_name, last_name, userId];
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
      
      // ✅ UPDATE DATABASE with new avatar filename
      await client.query(
        'UPDATE users SET avatar_filename = $1, updated_at = NOW() WHERE id = $2',
        [uniqueFilename, userId]
      );
      
      // Get updated user info
      const updatedUser = await client.query(
        'SELECT id, first_name, last_name, email, avatar_filename, role FROM users WHERE id = $1',
        [userId]
      );
      
      client.release();
      return { success: true, filename: uniqueFilename, user: updatedUser.rows[0] };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // Delete avatar
  fastify.delete('/avatar/:id', async (request, reply) => {
    const client = await fastify.pg.connect();
    try {
      const { id } = request.params;
      const userId = parseInt(id); // Convert to integer
      
      // Get current avatar filename
      const userResult = await client.query(
        'SELECT avatar_filename FROM users WHERE id = $1',
        [userId]
      );
      
      if (userResult.rows.length > 0 && userResult.rows[0].avatar_filename) {
        const avatarPath = path.join(__dirname, '../../uploads/avatars', userResult.rows[0].avatar_filename);
        try {
          if (await fs.pathExists(avatarPath)) {
            await fs.remove(avatarPath);
            console.log(`Avatar dosyası silindi: ${userResult.rows[0].avatar_filename}`);
          }
        } catch (fileError) {
          // Dosya silme hatası olsa bile devam et
          console.error(`Avatar dosyası silinirken hata: ${fileError.message}`);
        }
      }
      
      // ✅ UPDATE DATABASE - set avatar_filename to NULL
      await client.query(
        'UPDATE users SET avatar_filename = NULL, updated_at = NOW() WHERE id = $1',
        [userId]
      );
      
      // Get updated user info
      const updatedUser = await client.query(
        'SELECT id, first_name, last_name, email, avatar_filename, role FROM users WHERE id = $1',
        [userId]
      );
      
      client.release();
      return { success: true, message: 'Avatar silindi', user: updatedUser.rows[0] };
    } catch (err) {
      client.release();
      console.error('Avatar silme hatası:', err);
      return { success: false, message: err.message };
    }
  });

  // Cleanup orphaned avatar files (files that don't have a reference in database)
  fastify.post('/cleanup-avatars', async (request, reply) => {
    try {
      const avatarsDir = path.join(__dirname, '../../uploads/avatars');
      
      // Ensure directory exists
      if (!(await fs.pathExists(avatarsDir))) {
        return { success: false, message: 'Avatars dizini bulunamadı' };
      }

      // Get all files in avatars directory
      const files = await fs.readdir(avatarsDir);
      
      // Get all avatar filenames from database
      const client = await fastify.pg.connect();
      const dbResult = await client.query(
        'SELECT avatar_filename FROM users WHERE avatar_filename IS NOT NULL'
      );
      client.release();
      
      const validFilenames = new Set(
        dbResult.rows.map(row => row.avatar_filename).filter(Boolean)
      );
      
      // Find orphaned files (files not in database)
      const orphanedFiles = files.filter(file => {
        // Skip .gitkeep and other hidden files
        if (file.startsWith('.')) return false;
        return !validFilenames.has(file);
      });
      
      // Delete orphaned files
      let deletedCount = 0;
      let errorCount = 0;
      
      for (const file of orphanedFiles) {
        try {
          const filePath = path.join(avatarsDir, file);
          if (await fs.pathExists(filePath)) {
            await fs.remove(filePath);
            deletedCount++;
            console.log(`Orphaned avatar dosyası silindi: ${file}`);
          }
        } catch (error) {
          errorCount++;
          console.error(`Dosya silinirken hata (${file}):`, error.message);
        }
      }
      
      return {
        success: true,
        message: `Temizlik tamamlandı`,
        deletedCount,
        errorCount,
        totalOrphaned: orphanedFiles.length
      };
    } catch (err) {
      console.error('Avatar cleanup hatası:', err);
      return { success: false, message: err.message };
    }
  });
}

module.exports = authRoutes;