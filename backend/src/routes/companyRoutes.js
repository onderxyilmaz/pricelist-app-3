const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs-extra');

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
        GROUP BY c.id, c.company_name, c.logo_filename, c.created_at, c.updated_at
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

      // Get company logo filename before deleting
      const companyResult = await client.query(
        'SELECT logo_filename FROM companies WHERE id = $1',
        [id]
      );
      
      const result = await client.query(
        'DELETE FROM companies WHERE id = $1 RETURNING *',
        [id]
      );
      client.release();
      
      if (result.rows.length === 0) {
        return reply.status(404).send({ error: 'Firma bulunamadı' });
      }

      // Delete logo file if exists
      if (companyResult.rows.length > 0 && companyResult.rows[0].logo_filename) {
        const logoPath = path.join(__dirname, '../../uploads/company_logos', companyResult.rows[0].logo_filename);
        if (await fs.pathExists(logoPath)) {
          await fs.remove(logoPath);
        }
      }

      reply.send({ message: 'Firma başarıyla silindi' });
    } catch (error) {
      console.error('Error deleting company:', error);
      reply.status(500).send({ error: 'Database error' });
    }
  });

  // Upload company logo
  fastify.post('/companies/upload-logo/:id', { preHandler: authMiddleware }, async (request, reply) => {
    try {
      const { id } = request.params;
      const companyId = parseInt(id);
      const data = await request.file();
      
      if (!data) {
        return reply.status(400).send({ success: false, message: 'Dosya bulunamadı' });
      }

      // Check file type (only jpg and png)
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(data.mimetype)) {
        return reply.status(400).send({ success: false, message: 'Sadece JPG ve PNG dosyaları yüklenebilir' });
      }

      // Generate unique filename
      const fileExtension = path.extname(data.filename);
      const uniqueFilename = `logo_${companyId}_${crypto.randomUUID()}${fileExtension}`;
      const uploadPath = path.join(__dirname, '../../uploads/company_logos', uniqueFilename);
      
      // Ensure directory exists
      await fs.ensureDir(path.join(__dirname, '../../uploads/company_logos'));
      
      // Get current company to check for existing logo
      const client = await fastify.pg.connect();
      const companyResult = await client.query(
        'SELECT logo_filename FROM companies WHERE id = $1',
        [companyId]
      );
      
      if (companyResult.rows.length === 0) {
        client.release();
        return reply.status(404).send({ success: false, message: 'Firma bulunamadı' });
      }
      
      // Delete old logo if exists
      if (companyResult.rows[0].logo_filename) {
        const oldLogoPath = path.join(__dirname, '../../uploads/company_logos', companyResult.rows[0].logo_filename);
        if (await fs.pathExists(oldLogoPath)) {
          await fs.remove(oldLogoPath);
        }
      }
      
      // Save new file
      await data.file.pipe(fs.createWriteStream(uploadPath));
      
      // Update database with new logo filename
      await client.query(
        'UPDATE companies SET logo_filename = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [uniqueFilename, companyId]
      );
      
      // Get updated company info
      const updatedCompany = await client.query(
        'SELECT id, company_name, logo_filename, created_at, updated_at FROM companies WHERE id = $1',
        [companyId]
      );
      
      client.release();
      return reply.send({ success: true, filename: uniqueFilename, company: updatedCompany.rows[0] });
    } catch (err) {
      console.error('Error uploading company logo:', err);
      return reply.status(500).send({ success: false, message: err.message });
    }
  });

  // Delete company logo
  fastify.delete('/companies/logo/:id', { preHandler: authMiddleware }, async (request, reply) => {
    try {
      const { id } = request.params;
      const companyId = parseInt(id);
      
      const client = await fastify.pg.connect();
      const companyResult = await client.query(
        'SELECT logo_filename FROM companies WHERE id = $1',
        [companyId]
      );
      
      if (companyResult.rows.length === 0) {
        client.release();
        return reply.status(404).send({ success: false, message: 'Firma bulunamadı' });
      }
      
      const logoFilename = companyResult.rows[0].logo_filename;
      
      if (!logoFilename) {
        client.release();
        return reply.status(400).send({ success: false, message: 'Firmada logo bulunmuyor' });
      }
      
      // Delete logo file
      const logoPath = path.join(__dirname, '../../uploads/company_logos', logoFilename);
      if (await fs.pathExists(logoPath)) {
        await fs.remove(logoPath);
      }
      
      // Update database
      await client.query(
        'UPDATE companies SET logo_filename = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [companyId]
      );
      
      // Get updated company info
      const updatedCompany = await client.query(
        'SELECT id, company_name, logo_filename, created_at, updated_at FROM companies WHERE id = $1',
        [companyId]
      );
      
      client.release();
      return reply.send({ success: true, company: updatedCompany.rows[0] });
    } catch (err) {
      console.error('Error deleting company logo:', err);
      return reply.status(500).send({ success: false, message: err.message });
    }
  });
}

module.exports = companyRoutes;