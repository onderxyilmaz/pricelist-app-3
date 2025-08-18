const fastify = require('fastify');

async function offerRoutes(fastify, options) {
  // Tüm teklifleri getir
  fastify.get('/offers', async (request, reply) => {
    try {
      const client = await fastify.pg.connect();
      const result = await client.query(`
        SELECT 
          o.id, o.offer_no, o.revision_no, o.created_at, o.revised_at, 
          o.company, o.status,
          u.first_name, u.last_name,
          CONCAT(u.first_name, ' ', u.last_name) as created_by_name
        FROM offers o
        LEFT JOIN users u ON o.created_by = u.id
        ORDER BY o.created_at DESC
      `);
      client.release();
      return { success: true, offers: result.rows };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // Yeni teklif oluştur
  fastify.post('/offers', async (request, reply) => {
    try {
      const { offer_no, company, created_by } = request.body;
      
      if (!offer_no || !company || !created_by) {
        return { success: false, message: 'Teklif No, Firma ve Oluşturan gereklidir' };
      }

      const client = await fastify.pg.connect();
      
      // Teklif numarası kontrolü
      const existingOffer = await client.query('SELECT id FROM offers WHERE offer_no = $1', [offer_no]);
      if (existingOffer.rows.length > 0) {
        client.release();
        return { success: false, message: 'Bu teklif numarası zaten kullanılıyor' };
      }

      const result = await client.query(
        'INSERT INTO offers (offer_no, company, created_by) VALUES ($1, $2, $3) RETURNING *',
        [offer_no, company, created_by]
      );
      
      client.release();
      return { success: true, offer: result.rows[0] };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // Teklif güncelle
  fastify.put('/offers/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const { offer_no, company, revision_no } = request.body;
      
      if (!offer_no || !company) {
        return { success: false, message: 'Teklif No ve Firma gereklidir' };
      }

      const client = await fastify.pg.connect();
      
      // Mevcut teklifi kontrol et
      const existingOffer = await client.query('SELECT * FROM offers WHERE id = $1', [id]);
      if (existingOffer.rows.length === 0) {
        client.release();
        return { success: false, message: 'Teklif bulunamadı' };
      }

      // Teklif numarası kontrolü (kendi ID'si hariç)
      const duplicateCheck = await client.query(
        'SELECT id FROM offers WHERE offer_no = $1 AND id != $2', 
        [offer_no, id]
      );
      if (duplicateCheck.rows.length > 0) {
        client.release();
        return { success: false, message: 'Bu teklif numarası zaten kullanılıyor' };
      }

      const updateQuery = `
        UPDATE offers 
        SET offer_no = $1, company = $2, revision_no = $3, revised_at = CURRENT_TIMESTAMP
        WHERE id = $4 
        RETURNING *
      `;
      
      const result = await client.query(updateQuery, [
        offer_no, 
        company, 
        revision_no || existingOffer.rows[0].revision_no,
        id
      ]);
      
      client.release();
      return { success: true, offer: result.rows[0] };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // Teklif sil
  fastify.delete('/offers/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      
      const client = await fastify.pg.connect();
      
      const result = await client.query('DELETE FROM offers WHERE id = $1 RETURNING *', [id]);
      
      if (result.rows.length === 0) {
        client.release();
        return { success: false, message: 'Teklif bulunamadı' };
      }
      
      client.release();
      return { success: true, message: 'Teklif silindi' };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });
}

module.exports = offerRoutes;
