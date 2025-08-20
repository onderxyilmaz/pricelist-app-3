const fastify = require('fastify');

async function offerRoutes(fastify, options) {
  // Otomatik teklif numarası endpointi kaldırıldı

  // Firma arama (autocomplete için)
  fastify.get('/companies/search', async (request, reply) => {
    try {
      const { query } = request.query;
      const client = await fastify.pg.connect();
      
      let searchQuery;
      let params;
      
      if (query && query.trim() !== '') {
        // Arama terimi varsa filtrele
        searchQuery = `
          SELECT name FROM companies 
          WHERE name ILIKE $1 
          ORDER BY name ASC 
          LIMIT 10
        `;
        params = [`%${query.trim()}%`];
      } else {
        // Arama terimi yoksa en son kullanılanları getir
        searchQuery = `
          SELECT name FROM companies 
          ORDER BY updated_at DESC 
          LIMIT 10
        `;
        params = [];
      }
      
      const result = await client.query(searchQuery, params);
      client.release();
      
      return { success: true, companies: result.rows.map(row => row.name) };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // Tüm firmaları getir (teklif sayısı ile birlikte)
  fastify.get('/companies', async (request, reply) => {
    try {
      const client = await fastify.pg.connect();
      const result = await client.query(`
        SELECT 
          c.id, 
          c.name, 
          c.created_at, 
          c.updated_at,
          COUNT(o.id) as offer_count
        FROM companies c
        LEFT JOIN offers o ON o.company = c.name
        GROUP BY c.id, c.name, c.created_at, c.updated_at
        ORDER BY c.name ASC
      `);
      client.release();
      return { success: true, companies: result.rows };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // Firma ekle (yeni firma varsa)
  fastify.post('/companies', async (request, reply) => {
    try {
      const { name } = request.body;
      
      if (!name || name.trim() === '') {
        return { success: false, message: 'Firma adı gereklidir' };
      }
      
      const client = await fastify.pg.connect();
      
      // Firma varsa hata ver, yoksa ekle (CRUD sayfası için)
      const existingCompany = await client.query('SELECT id FROM companies WHERE name = $1', [name.trim()]);
      if (existingCompany.rows.length > 0) {
        client.release();
        return { success: false, message: 'Bu firma adı zaten kullanılıyor' };
      }

      const result = await client.query(`
        INSERT INTO companies (name) VALUES ($1) RETURNING *
      `, [name.trim()]);
      
      client.release();
      return { success: true, company: result.rows[0] };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // Firma güncelle
  fastify.put('/companies/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const { name } = request.body;
      
      if (!name || name.trim() === '') {
        return { success: false, message: 'Firma adı gereklidir' };
      }

      const client = await fastify.pg.connect();
      
      try {
        // Transaction başlat
        await client.query('BEGIN');
        
        // Mevcut firmayı kontrol et
        const existingCompany = await client.query('SELECT * FROM companies WHERE id = $1', [id]);
        if (existingCompany.rows.length === 0) {
          await client.query('ROLLBACK');
          client.release();
          return { success: false, message: 'Firma bulunamadı' };
        }

        const oldName = existingCompany.rows[0].name;

        // Aynı isimde başka firma var mı kontrol et
        const duplicateCheck = await client.query(
          'SELECT id FROM companies WHERE name = $1 AND id != $2', 
          [name.trim(), id]
        );
        if (duplicateCheck.rows.length > 0) {
          await client.query('ROLLBACK');
          client.release();
          return { success: false, message: 'Bu firma adı zaten kullanılıyor' };
        }

        // Firmayı güncelle
        const result = await client.query(`
          UPDATE companies 
          SET name = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2 
          RETURNING *
        `, [name.trim(), id]);

        // Tekliflerdeki firma adını da güncelle
        await client.query(`
          UPDATE offers 
          SET company = $1 
          WHERE company = $2
        `, [name.trim(), oldName]);
        
        await client.query('COMMIT');
        client.release();
        return { success: true, company: result.rows[0] };
      } catch (err) {
        await client.query('ROLLBACK');
        client.release();
        throw err;
      }
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // Firma sil
  fastify.delete('/companies/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      
      const client = await fastify.pg.connect();
      
      try {
        // Transaction başlat
        await client.query('BEGIN');
        
        // Mevcut firmayı kontrol et
        const existingCompany = await client.query('SELECT * FROM companies WHERE id = $1', [id]);
        if (existingCompany.rows.length === 0) {
          await client.query('ROLLBACK');
          client.release();
          return { success: false, message: 'Firma bulunamadı' };
        }

        const companyName = existingCompany.rows[0].name;
        
        // Bu firmayı kullanan teklifleri temizle (company field'ini NULL yap)
        await client.query(`
          UPDATE offers 
          SET company = NULL 
          WHERE company = $1
        `, [companyName]);
        
        // Firmayı sil
        const result = await client.query('DELETE FROM companies WHERE id = $1 RETURNING *', [id]);
        
        await client.query('COMMIT');
        client.release();
        return { success: true, message: 'Firma silindi ve tekliflerden kaldırıldı' };
      } catch (err) {
        await client.query('ROLLBACK');
        client.release();
        throw err;
      }
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // Bu yıl için boş (silinmiş) teklif numaralarını getir
  fastify.get('/offers/available-numbers', async (request, reply) => {
    try {
      const client = await fastify.pg.connect();
      const currentYear = new Date().getFullYear();
      
      // Bu yıl için mevcut tüm teklif numaralarını al
      const existingResult = await client.query(`
        SELECT offer_no FROM offers 
        WHERE offer_no LIKE $1 
        ORDER BY offer_no ASC
      `, [`${currentYear}-%`]);
      
      const existingNumbers = existingResult.rows.map(row => {
        return parseInt(row.offer_no.split('-')[1]);
      });
      
      // En yüksek numarayı bul
      const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
      
      // Boş numaraları bul (1'den maxNumber'a kadar)
      const availableNumbers = [];
      for (let i = 1; i <= maxNumber; i++) {
        if (!existingNumbers.includes(i)) {
          availableNumbers.push(`${currentYear}-${String(i).padStart(4, '0')}`);
        }
      }
      
      client.release();
      return { success: true, availableNumbers };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

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
      
      if (!offer_no || !created_by) {
        return { success: false, message: 'Teklif No ve Oluşturan gereklidir' };
      }

      const client = await fastify.pg.connect();
      
      try {
        // Transaction başlat
        await client.query('BEGIN');
        
        // Teklif numarası kontrolü
        const existingOffer = await client.query('SELECT id FROM offers WHERE offer_no = $1', [offer_no]);
        if (existingOffer.rows.length > 0) {
          await client.query('ROLLBACK');
          client.release();
          return { success: false, message: 'Bu teklif numarası zaten kullanılıyor' };
        }

        // Firma adı varsa companies tablosuna ekle
        if (company && company.trim() !== '') {
          await client.query(`
            INSERT INTO companies (name) VALUES ($1)
            ON CONFLICT (name) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
          `, [company.trim()]);
        }

        // Teklif oluştur
        const result = await client.query(
          'INSERT INTO offers (offer_no, company, created_by) VALUES ($1, $2, $3) RETURNING *',
          [offer_no, company || null, created_by]
        );
        
        await client.query('COMMIT');
        client.release();
        return { success: true, offer: result.rows[0] };
      } catch (err) {
        await client.query('ROLLBACK');
        client.release();
        throw err;
      }
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // Teklif güncelle
  fastify.put('/offers/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const { offer_no, company, revision_no } = request.body;
      
      if (!offer_no) {
        return { success: false, message: 'Teklif No gereklidir' };
      }

      const client = await fastify.pg.connect();
      
      try {
        // Transaction başlat
        await client.query('BEGIN');
        
        // Mevcut teklifi kontrol et
        const existingOffer = await client.query('SELECT * FROM offers WHERE id = $1', [id]);
        if (existingOffer.rows.length === 0) {
          await client.query('ROLLBACK');
          client.release();
          return { success: false, message: 'Teklif bulunamadı' };
        }

        // Teklif numarası kontrolü (kendi ID'si hariç)
        const duplicateCheck = await client.query(
          'SELECT id FROM offers WHERE offer_no = $1 AND id != $2', 
          [offer_no, id]
        );
        if (duplicateCheck.rows.length > 0) {
          await client.query('ROLLBACK');
          client.release();
          return { success: false, message: 'Bu teklif numarası zaten kullanılıyor' };
        }

        // Firma adı varsa companies tablosuna ekle
        if (company && company.trim() !== '') {
          await client.query(`
            INSERT INTO companies (name) VALUES ($1)
            ON CONFLICT (name) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
          `, [company.trim()]);
        }

        const updateQuery = `
          UPDATE offers 
          SET offer_no = $1, company = $2, revision_no = $3, revised_at = CURRENT_TIMESTAMP
          WHERE id = $4 
          RETURNING *
        `;
        
        const result = await client.query(updateQuery, [
          offer_no, 
          company || null, 
          revision_no || existingOffer.rows[0].revision_no,
          id
        ]);
        
        await client.query('COMMIT');
        client.release();
        return { success: true, offer: result.rows[0] };
      } catch (err) {
        await client.query('ROLLBACK');
        client.release();
        throw err;
      }
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // Teklife ürün ekleme
  fastify.post('/offers/:id/items', async (request, reply) => {
    try {
      const { id } = request.params;
      const { items } = request.body; // [{pricelist_item_id, quantity, price, ...}, ...]
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return { success: false, message: 'Ürün listesi gereklidir' };
      }

      const client = await fastify.pg.connect();
      
      try {
        await client.query('BEGIN');
        
        // Teklif var mı kontrol et
        const offerCheck = await client.query('SELECT id FROM offers WHERE id = $1', [id]);
        if (offerCheck.rows.length === 0) {
          await client.query('ROLLBACK');
          client.release();
          return { success: false, message: 'Teklif bulunamadı' };
        }

        // Mevcut teklif kalemlerini sil
        await client.query('DELETE FROM offer_items WHERE offer_id = $1', [id]);

        // Yeni kalemleri ekle
        for (const item of items) {
          const {
            pricelist_item_id,
            quantity,
            price,
            total_price,
            product_id,
            product_name,
            description,
            unit,
            currency,
            pricelist_id
          } = item;

          await client.query(`
            INSERT INTO offer_items (
              offer_id, pricelist_item_id, quantity, price, total_price,
              product_id, product_name, description, unit, currency, pricelist_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          `, [
            id, pricelist_item_id, quantity, price, total_price,
            product_id, product_name, description, unit, currency, pricelist_id
          ]);
        }
        
        await client.query('COMMIT');
        client.release();
        return { success: true, message: 'Teklif kalemleri kaydedildi' };
      } catch (err) {
        await client.query('ROLLBACK');
        client.release();
        throw err;
      }
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // Teklif kalemlerini getir
  fastify.get('/offers/:id/items', async (request, reply) => {
    try {
      const { id } = request.params;
      
      const client = await fastify.pg.connect();
      const result = await client.query(`
        SELECT 
          oi.*,
          p.name as pricelist_name
        FROM offer_items oi
        LEFT JOIN pricelists p ON oi.pricelist_id = p.id
        WHERE oi.offer_id = $1
        ORDER BY oi.created_at ASC
      `, [id]);
      
      client.release();
      return { success: true, items: result.rows };
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
