const fastify = require('fastify');

async function offerRoutes(fastify, options) {
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
          c.name as customer, 
          o.status, o.customer_response, o.parent_offer_id, o.customer_id, o.company_id,
          u.first_name, u.last_name,
          CONCAT(u.first_name, ' ', u.last_name) as created_by_name,
          co.company_name
        FROM offers o
        LEFT JOIN users u ON o.created_by = u.id
        LEFT JOIN customers c ON o.customer_id = c.id
        LEFT JOIN companies co ON o.company_id = co.id
        ORDER BY o.created_at DESC
      `);
      client.release();
      return { success: true, offers: result.rows };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // Tek teklifi detayları ile getir
  fastify.get('/offers/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      
      const client = await fastify.pg.connect();
      
      // Ana teklif bilgileri
      const offerResult = await client.query(`
        SELECT 
          o.id, o.offer_no, o.revision_no, o.created_at, o.revised_at, 
          c.name as customer, 
          o.status, o.customer_response, o.parent_offer_id, o.created_by, o.customer_id,
          u.first_name, u.last_name,
          CONCAT(u.first_name, ' ', u.last_name) as created_by_name
        FROM offers o
        LEFT JOIN users u ON o.created_by = u.id
        LEFT JOIN customers c ON o.customer_id = c.id
        WHERE o.id = $1
      `, [id]);

      if (offerResult.rows.length === 0) {
        client.release();
        return { success: false, message: 'Teklif bulunamadı' };
      }

      const offer = offerResult.rows[0];

      // Teklif kalemleri
      const itemsResult = await client.query(`
        SELECT 
          oi.*,
          p.name as pricelist_name,
          p.currency as pricelist_currency
        FROM offer_items oi
        LEFT JOIN pricelists p ON oi.pricelist_id = p.id
        WHERE oi.offer_id = $1
        ORDER BY oi.created_at ASC
      `, [id]);

      client.release();
      
      return { 
        success: true, 
        offer: {
          ...offer,
          items: itemsResult.rows
        }
      };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // Excel export için teklif detaylarını gruplu olarak getir
  fastify.get('/offers/:id/details', async (request, reply) => {
    try {
      const { id } = request.params;
      
      const client = await fastify.pg.connect();
      
      // Ana teklif bilgileri
      const offerResult = await client.query(`
        SELECT 
          o.id, o.offer_no, o.revision_no, o.created_at, o.revised_at, 
          c.name as customer, 
          o.status, o.parent_offer_id, o.created_by, o.customer_id,
          u.first_name, u.last_name,
          CONCAT(u.first_name, ' ', u.last_name) as created_by_name
        FROM offers o
        LEFT JOIN users u ON o.created_by = u.id
        LEFT JOIN customers c ON o.customer_id = c.id
        WHERE o.id = $1
      `, [id]);

      if (offerResult.rows.length === 0) {
        client.release();
        return { success: false, message: 'Teklif bulunamadı' };
      }

      const offer = offerResult.rows[0];

      // Teklif kalemleri ile ürün bilgileri
      const itemsResult = await client.query(`
        SELECT 
          oi.*,
          p.name as pricelist_name,
          p.currency as pricelist_currency,
          oi.product_name_tr,
          oi.product_name_en,
          oi.product_id as product_code,
          oi.description,
          pi.description_tr as original_description_tr,
          pi.description_en as original_description_en,
          oi.price as unit_price,
          oi.price as net_price,
          oi.price as list_price,
          oi.total_price as net_total
        FROM offer_items oi
        LEFT JOIN pricelists p ON oi.pricelist_id = p.id
        LEFT JOIN pricelist_items pi ON oi.pricelist_item_id = pi.id
        WHERE oi.offer_id = $1
        ORDER BY p.name, oi.product_name_tr, oi.product_name_en
      `, [id]);

      // Verileri fiyat listesi ismine göre grupla
      const groupedItems = {};
      itemsResult.rows.forEach(item => {
        const groupName = item.pricelist_name || 'Diğer';
        if (!groupedItems[groupName]) {
          groupedItems[groupName] = [];
        }
        groupedItems[groupName].push(item);
      });

      client.release();
      
      return { 
        success: true, 
        offer: {
          ...offer,
          items: groupedItems
        }
      };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // Yeni teklif oluştur
  fastify.post('/offers', async (request, reply) => {
    try {
      const { offer_no, customer, company_id, created_by, parent_offer_id, revision_no } = request.body;
      
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

        // Müşteri adı varsa customers tablosuna ekle ve customer_id'yi al
        let customerId = null;
        if (customer && customer.trim() !== '') {
          await client.query(`
            INSERT INTO customers (name) VALUES ($1)
            ON CONFLICT (name) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
          `, [customer.trim()]);
          
          // Customer ID'yi al
          const customerResult = await client.query('SELECT id FROM customers WHERE name = $1', [customer.trim()]);
          if (customerResult.rows.length > 0) {
            customerId = customerResult.rows[0].id;
          }
        }

        // Teklif oluştur
        const result = await client.query(
          'INSERT INTO offers (offer_no, customer_id, company_id, created_by, parent_offer_id, revision_no) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
          [offer_no, customerId, company_id || null, created_by, parent_offer_id || null, revision_no || 0]
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
      const { offer_no, customer, company_id, revision_no, status, parent_offer_id, customer_response } = request.body;
      
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

        // Müşteri adı varsa customers tablosuna ekle ve customer_id'yi al
        let customerId = null;
        if (customer && customer.trim() !== '') {
          await client.query(`
            INSERT INTO customers (name) VALUES ($1)
            ON CONFLICT (name) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
          `, [customer.trim()]);
          
          // Customer ID'yi al
          const customerResult = await client.query('SELECT id FROM customers WHERE name = $1', [customer.trim()]);
          if (customerResult.rows.length > 0) {
            customerId = customerResult.rows[0].id;
          }
        }

        // Eğer status 'draft'a döndürülüyorsa customer_response'u sıfırla
        let finalCustomerResponse = customer_response !== undefined ? customer_response : existingOffer.rows[0].customer_response;
        if (status === 'draft' && existingOffer.rows[0].status === 'sent') {
          finalCustomerResponse = null;
        }

        const updateQuery = `
          UPDATE offers 
          SET offer_no = $1, customer_id = $2, company_id = $3, revision_no = $4, status = $5, parent_offer_id = $6, customer_response = $7, revised_at = CURRENT_TIMESTAMP
          WHERE id = $8 
          RETURNING *
        `;
        
        const result = await client.query(updateQuery, [
          offer_no, 
          customerId, 
          company_id || null,
          revision_no || existingOffer.rows[0].revision_no,
          status || existingOffer.rows[0].status || 'draft',
          parent_offer_id || existingOffer.rows[0].parent_offer_id,
          finalCustomerResponse,
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
            product_name_tr,
            product_name_en,
            description,
            unit,
            currency,
            pricelist_id
          } = item;

          await client.query(`
            INSERT INTO offer_items (
              offer_id, pricelist_item_id, quantity, price, total_price,
              product_id, product_name_tr, product_name_en, description, unit, currency, pricelist_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          `, [
            id, pricelist_item_id, quantity, price, total_price,
            product_id, product_name_tr, product_name_en, description, unit, currency, pricelist_id
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

  // ====================================
  // OFFER TEMPLATES ENDPOINTS
  // ====================================

  // Get all offer templates
  fastify.get('/offer-templates', async (request, reply) => {
    try {
      const client = await fastify.pg.connect();
      
      const result = await client.query(`
        SELECT 
          ot.id,
          ot.name,
          ot.description,
          ot.created_at,
          ot.updated_at,
          ot.created_by,
          ot.updated_by,
          creator.first_name as creator_first_name,
          creator.last_name as creator_last_name,
          updater.first_name as updater_first_name,
          updater.last_name as updater_last_name,
          COUNT(pi.id) as item_count
        FROM offer_templates ot
        LEFT JOIN offer_template_items oti ON ot.id = oti.template_id
        LEFT JOIN pricelist_items pi ON oti.product_id = pi.product_id AND oti.pricelist_id = pi.pricelist_id
        LEFT JOIN users creator ON ot.created_by = creator.id
        LEFT JOIN users updater ON ot.updated_by = updater.id
        GROUP BY ot.id, ot.name, ot.description, ot.created_at, ot.updated_at, ot.created_by, ot.updated_by,
                 creator.first_name, creator.last_name, updater.first_name, updater.last_name
        ORDER BY ot.created_at DESC
      `);
      
      client.release();
      return { success: true, templates: result.rows };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // Get template items
  fastify.get('/offer-templates/:id/items', async (request, reply) => {
    try {
      const { id } = request.params;
      const client = await fastify.pg.connect();
      
      const result = await client.query(`
        SELECT 
          oti.id,
          oti.product_id,
          oti.pricelist_id,
          oti.name_tr,
          oti.name_en,
          oti.description_tr,
          oti.description_en,
          oti.quantity,
          oti.price,
          oti.total_price,
          oti.currency,
          oti.unit,
          oti.note,
          pi.id as original_item_id,
          pi.name_tr as original_name_tr,
          pi.name_en as original_name_en,
          pi.description_tr as original_description_tr,
          pi.description_en as original_description_en
        FROM offer_template_items oti
        LEFT JOIN pricelist_items pi ON oti.product_id = pi.product_id AND oti.pricelist_id = pi.pricelist_id
        WHERE oti.template_id = $1
        ORDER BY oti.created_at ASC
      `, [id]);
      
      client.release();
      return { success: true, items: result.rows };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // Create new offer template
  fastify.post('/offer-templates', async (request, reply) => {
    try {
      const { name, description, items, created_by } = request.body;
      
      if (!name || !items || items.length === 0) {
        return { success: false, message: 'Template adı ve en az bir ürün gereklidir' };
      }

      if (!created_by) {
        return { success: false, message: 'Kullanıcı kimliği gereklidir' };
      }

      const client = await fastify.pg.connect();
      
      // Start transaction
      await client.query('BEGIN');
      
      try {
        // Insert template
        const templateResult = await client.query(
          'INSERT INTO offer_templates (name, description, created_by) VALUES ($1, $2, $3) RETURNING id',
          [name, description, created_by]
        );
        
        const templateId = templateResult.rows[0].id;
        
        // Insert template items
        for (const item of items) {
          await client.query(`
            INSERT INTO offer_template_items (
              template_id, product_id, pricelist_id, name_tr, name_en, 
              description_tr, description_en, quantity, price, total_price, 
              currency, unit, note
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          `, [
            templateId,
            item.product_id,
            item.pricelist_id,
            item.name_tr,
            item.name_en,
            item.description_tr,
            item.description_en,
            item.quantity,
            item.price,
            item.total_price,
            item.currency,
            item.unit || 'adet',
            item.note || ''
          ]);
        }
        
        await client.query('COMMIT');
        client.release();
        
        return { success: true, message: 'Template başarıyla oluşturuldu', templateId };
      } catch (err) {
        await client.query('ROLLBACK');
        client.release();
        throw err;
      }
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // Update offer template
  fastify.put('/offer-templates/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const { name, description, items, updated_by } = request.body;
      
      if (!name || !items || items.length === 0) {
        return { success: false, message: 'Template adı ve en az bir ürün gereklidir' };
      }

      if (!updated_by) {
        return { success: false, message: 'Kullanıcı kimliği gereklidir' };
      }

      const client = await fastify.pg.connect();
      
      // Start transaction
      await client.query('BEGIN');
      
      try {
        // Update template
        const templateResult = await client.query(
          'UPDATE offer_templates SET name = $1, description = $2, updated_by = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING id',
          [name, description, updated_by, id]
        );
        
        if (templateResult.rows.length === 0) {
          await client.query('ROLLBACK');
          client.release();
          return { success: false, message: 'Template bulunamadı' };
        }
        
        // Delete existing items
        await client.query('DELETE FROM offer_template_items WHERE template_id = $1', [id]);
        
        // Insert new items
        for (const item of items) {
          await client.query(`
            INSERT INTO offer_template_items (
              template_id, product_id, pricelist_id, name_tr, name_en, 
              description_tr, description_en, quantity, price, total_price, 
              currency, unit, note
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          `, [
            id,
            item.product_id,
            item.pricelist_id,
            item.name_tr,
            item.name_en,
            item.description_tr,
            item.description_en,
            item.quantity,
            item.price,
            item.total_price,
            item.currency,
            item.unit || 'adet',
            item.note || ''
          ]);
        }
        
        await client.query('COMMIT');
        client.release();
        
        return { success: true, message: 'Template başarıyla güncellendi' };
      } catch (err) {
        await client.query('ROLLBACK');
        client.release();
        throw err;
      }
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // Delete offer template
  fastify.delete('/offer-templates/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      
      const client = await fastify.pg.connect();
      
      const result = await client.query('DELETE FROM offer_templates WHERE id = $1 RETURNING *', [id]);
      
      if (result.rows.length === 0) {
        client.release();
        return { success: false, message: 'Template bulunamadı' };
      }
      
      client.release();
      return { success: true, message: 'Template silindi' };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });
}

module.exports = offerRoutes;