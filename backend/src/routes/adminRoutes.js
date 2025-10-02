const bcrypt = require('bcryptjs');
const crypto = require('crypto');

module.exports = async function (fastify, opts) {
  // Tüm kullanıcıları listele
  fastify.get('/users', async (request, reply) => {
    try {
      const client = await fastify.pg.connect();
      const result = await client.query(
        'SELECT id, first_name, last_name, email, role, created_at FROM users ORDER BY created_at DESC'
      );
      client.release();
      
      return {
        success: true,
        users: result.rows
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        message: 'Kullanıcılar yüklenirken hata oluştu'
      });
    }
  });

  // Yeni kullanıcı oluştur
  fastify.post('/users', async (request, reply) => {
    const { first_name, last_name, email, password, role } = request.body;

    try {
      const client = await fastify.pg.connect();
      
      // E-mail kontrolü
      const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existingUser.rows.length > 0) {
        client.release();
        return reply.status(400).send({
          success: false,
          message: 'Bu e-mail adresi zaten kullanılıyor'
        });
      }

      // Şifreyi güvenli şekilde hashle
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Kullanıcıyı oluştur
      const result = await client.query(
        'INSERT INTO users (username, first_name, last_name, email, password, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, first_name, last_name, email, role, created_at',
        [email, first_name, last_name, email, hashedPassword, role]
      );
      
      client.release();
      
      return {
        success: true,
        user: result.rows[0]
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        message: 'Kullanıcı oluşturulurken hata oluştu'
      });
    }
  });

  // Kullanıcı güncelle
  fastify.put('/users/:id', async (request, reply) => {
    const { id } = request.params;
    const { first_name, last_name, role } = request.body;

    try {
      const client = await fastify.pg.connect();
      
      const result = await client.query(
        'UPDATE users SET first_name = $1, last_name = $2, role = $3 WHERE id = $4 RETURNING id, first_name, last_name, email, role, created_at',
        [first_name, last_name, role, id]
      );
      
      client.release();
      
      if (result.rows.length === 0) {
        return reply.status(404).send({
          success: false,
          message: 'Kullanıcı bulunamadı'
        });
      }
      
      return {
        success: true,
        user: result.rows[0]
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        message: 'Kullanıcı güncellenirken hata oluştu'
      });
    }
  });

  // Kullanıcı sil
  fastify.delete('/users/:id', async (request, reply) => {
    const { id } = request.params;

    try {
      const client = await fastify.pg.connect();
      
      const result = await client.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
      
      client.release();
      
      if (result.rows.length === 0) {
        return reply.status(404).send({
          success: false,
          message: 'Kullanıcı bulunamadı'
        });
      }
      
      return {
        success: true,
        message: 'Kullanıcı silindi'
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        message: 'Kullanıcı silinirken hata oluştu'
      });
    }
  });


};