const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

async function customerRoutes(fastify, options) {
  // Müşteri arama endpoint'i
  fastify.get('/customers/search', { preHandler: authMiddleware }, async (request, reply) => {
    try {
      const { query } = request.query;
      
      if (!query || query.trim().length === 0) {
        return { success: true, customers: [] };
      }
      
      const client = await fastify.pg.connect();
      
      let result;
      if (query.trim().length < 2) {
        // Çok kısa aramalar için sadece başlangıç eşleşmesi
        result = await client.query(
          'SELECT name FROM customers WHERE name ILIKE $1 ORDER BY name LIMIT 20',
          [`${query.trim()}%`]
        );
      } else {
        // Uzun aramalar için içerik eşleşmesi
        result = await client.query(
          'SELECT name FROM customers WHERE name ILIKE $1 ORDER BY name LIMIT 20',
          [`%${query.trim()}%`]
        );
      }
      
      client.release();
      
      return { success: true, customers: result.rows.map(row => row.name) };
    } catch (error) {
      console.error('Customer search error:', error);
      return { success: false, message: 'Müşteri arama hatası' };
    }
  });

  // Tüm müşterileri getir
  fastify.get('/customers', { preHandler: authMiddleware }, async (request, reply) => {
    try {
      const client = await fastify.pg.connect();

      const result = await client.query(`
        SELECT
          c.id,
          c.name,
          c.created_at,
          c.updated_at,
          COUNT(o.id) as offer_count
        FROM customers c
        LEFT JOIN offers o ON c.id = o.customer_id
        GROUP BY c.id, c.name, c.created_at, c.updated_at
        ORDER BY c.name
      `);

      client.release();

      return { success: true, customers: result.rows };
    } catch (error) {
      console.error('Get customers error:', error);
      return { success: false, message: 'Müşteriler getirilemedi' };
    }
  });

  // Yeni müşteri oluştur
  fastify.post('/customers', {
    preHandler: authMiddleware,
    schema: {
      tags: ['Customers'],
      summary: 'Create new customer',
      description: 'Create a new customer',
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', description: 'Customer name' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            customer: { type: 'object' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { name } = request.body;
      
      if (!name || !name.trim()) {
        return { success: false, message: 'Müşteri adı gereklidir' };
      }
      
      const client = await fastify.pg.connect();
      
      // Mevcut müşteri kontrolü
      const existingCustomer = await client.query('SELECT id FROM customers WHERE name = $1', [name.trim()]);
      
      if (existingCustomer.rows.length > 0) {
        client.release();
        return { success: false, message: 'Bu müşteri adı zaten mevcut' };
      }
      
      const result = await client.query(
        'INSERT INTO customers (name) VALUES ($1) RETURNING *',
        [name.trim()]
      );
      
      client.release();
      
      return { success: true, customer: result.rows[0] };
    } catch (error) {
      console.error('Create customer error:', error);
      return { success: false, message: 'Müşteri oluşturulamadı' };
    }
  });

  // Müşteri güncelle
  fastify.put('/customers/:id', { preHandler: authMiddleware }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { name } = request.body;
      
      if (!name || !name.trim()) {
        return { success: false, message: 'Müşteri adı gereklidir' };
      }
      
      if (!id || isNaN(parseInt(id))) {
        return { success: false, message: 'Geçersiz müşteri ID' };
      }
      
      const client = await fastify.pg.connect();
      
      // Mevcut müşteri kontrolü
      const existingCustomer = await client.query('SELECT * FROM customers WHERE id = $1', [id]);
      
      if (existingCustomer.rows.length === 0) {
        client.release();
        return { success: false, message: 'Müşteri bulunamadı' };
      }
      
      // Aynı isimde başka müşteri var mı kontrolü
      if (existingCustomer.rows[0].name !== name.trim()) {
        const duplicateCheck = await client.query(
          'SELECT id FROM customers WHERE name = $1 AND id != $2', 
          [name.trim(), id]
        );
        
        if (duplicateCheck.rows.length > 0) {
          client.release();
          return { success: false, message: 'Bu müşteri adı zaten kullanılıyor' };
        }
      }
      
      const result = await client.query(
        `UPDATE customers 
         SET name = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2 
         RETURNING *`,
        [name.trim(), id]
      );
      
      client.release();
      
      return { success: true, customer: result.rows[0] };
    } catch (error) {
      console.error('Update customer error:', error);
      return { success: false, message: 'Müşteri güncellenemedi' };
    }
  });

  // Müşteri sil
  fastify.delete('/customers/:id', {
    preHandler: authMiddleware,
    schema: {
      tags: ['Customers'],
      summary: 'Delete customer',
      description: 'Delete a customer (removes customer references from offers)',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer', description: 'Customer ID' }
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
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      
      if (!id || isNaN(parseInt(id))) {
        return { success: false, message: 'Geçersiz müşteri ID' };
      }
      
      const client = await fastify.pg.connect();
      
      // Mevcut müşteri kontrolü
      const existingCustomer = await client.query('SELECT * FROM customers WHERE id = $1', [id]);
      
      if (existingCustomer.rows.length === 0) {
        client.release();
        return { success: false, message: 'Müşteri bulunamadı' };
      }
      
      // Tekliflerde kullanılan müşteri kontrolü
      const offersCheck = await client.query(
        'SELECT COUNT(*) as count FROM offers WHERE customer_id = $1',
        [id]
      );
      
      // Tekliflerdeki referansları temizle
      await client.query(
        'UPDATE offers SET customer_id = NULL WHERE customer_id = $1',
        [id]
      );
      
      const result = await client.query('DELETE FROM customers WHERE id = $1 RETURNING *', [id]);
      
      client.release();
      
      return { 
        success: true, 
        customer: result.rows[0],
        message: offersCheck.rows[0].count > 0 
          ? `Müşteri silindi. ${offersCheck.rows[0].count} tekliften müşteri bilgisi kaldırıldı.`
          : 'Müşteri silindi.'
      };
    } catch (error) {
      console.error('Delete customer error:', error);
      return { success: false, message: 'Müşteri silinemedi' };
    }
  });
}

module.exports = customerRoutes;