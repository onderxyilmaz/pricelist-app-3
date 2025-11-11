const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

async function companyRoutes(fastify, options) {
  // Get all companies
  fastify.get('/companies', { preHandler: authMiddleware }, async (request, reply) => {
    try {
      const client = await fastify.pg.connect();
      const result = await client.query(`
        SELECT 
          c.*,
          COUNT(o.id) as offer_count
        FROM companies c
        LEFT JOIN offers o ON c.id = o.company_id
        GROUP BY c.id, c.company_name, c.created_at, c.updated_at
        ORDER BY c.company_name ASC
      `);
      client.release();
      reply.send(result.rows);
    } catch (error) {
      console.error('Error fetching companies:', error);
      reply.status(500).send({ error: 'Database error' });
    }
  });

  // Create new company
  fastify.post('/companies', {
    preHandler: authMiddleware,
    schema: {
      tags: ['Companies'],
      summary: 'Create new company',
      description: 'Create a new company',
      body: {
        type: 'object',
        required: ['company_name'],
        properties: {
          company_name: { type: 'string', description: 'Company name' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            company_name: { type: 'string' }
          }
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { company_name } = request.body;
      
      if (!company_name || company_name.trim() === '') {
        return reply.status(400).send({ error: 'Firma adı gereklidir' });
      }

      const client = await fastify.pg.connect();
      const result = await client.query(
        'INSERT INTO companies (company_name, created_at, updated_at) VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING *',
        [company_name.trim()]
      );
      client.release();
      
      reply.status(201).send(result.rows[0]);
    } catch (error) {
      console.error('Error creating company:', error);
      if (error.code === '23505') { // Unique violation
        return reply.status(409).send({ error: 'Bu firma adı zaten kullanılıyor' });
      }
      reply.status(500).send({ error: 'Database error' });
    }
  });

  // Update company
  fastify.put('/companies/:id', { preHandler: authMiddleware }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { company_name } = request.body;
      
      if (!company_name || company_name.trim() === '') {
        return reply.status(400).send({ error: 'Firma adı gereklidir' });
      }

      const client = await fastify.pg.connect();
      const result = await client.query(
        'UPDATE companies SET company_name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [company_name.trim(), id]
      );
      client.release();
      
      if (result.rows.length === 0) {
        return reply.status(404).send({ error: 'Firma bulunamadı' });
      }

      reply.send(result.rows[0]);
    } catch (error) {
      console.error('Error updating company:', error);
      if (error.code === '23505') { // Unique violation
        return reply.status(409).send({ error: 'Bu firma adı zaten kullanılıyor' });
      }
      reply.status(500).send({ error: 'Database error' });
    }
  });

  // Delete company
  fastify.delete('/companies/:id', {
    preHandler: authMiddleware,
    schema: {
      tags: ['Companies'],
      summary: 'Delete company',
      description: 'Delete a company (only if no offers are linked)',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer', description: 'Company ID' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      
      // Check if company has any offers
      const client = await fastify.pg.connect();
      const offersCheck = await client.query(
        'SELECT COUNT(*) as count FROM offers WHERE company_id = $1',
        [id]
      );
      
      if (offersCheck.rows[0].count > 0) {
        client.release();
        return reply.status(400).send({ 
          error: 'Bu firma ile ilişkili teklifler bulunuyor. Önce teklifleri silmeniz gerekiyor.' 
        });
      }

      const result = await client.query(
        'DELETE FROM companies WHERE id = $1 RETURNING *',
        [id]
      );
      client.release();
      
      if (result.rows.length === 0) {
        return reply.status(404).send({ error: 'Firma bulunamadı' });
      }

      reply.send({ message: 'Firma başarıyla silindi' });
    } catch (error) {
      console.error('Error deleting company:', error);
      reply.status(500).send({ error: 'Database error' });
    }
  });
}

module.exports = companyRoutes;