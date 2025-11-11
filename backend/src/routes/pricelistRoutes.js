const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

async function pricelistRoutes(fastify, options) {
  // Get all pricelists
  fastify.get('/pricelists', {
    preHandler: authMiddleware,
    schema: {
      tags: ['Pricelists'],
      summary: 'Get all pricelists',
      description: 'Retrieve all pricelists with item counts',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            pricelists: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  currency: { type: 'string' },
                  color: { type: 'string' },
                  item_count: { type: 'string' },
                  created_at: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const client = await fastify.pg.connect();
      const result = await client.query(`
        SELECT p.*, COUNT(pi.id) as item_count 
        FROM pricelists p 
        LEFT JOIN pricelist_items pi ON p.id = pi.pricelist_id 
        GROUP BY p.id 
        ORDER BY p.created_at DESC
      `);
      client.release();
      return { success: true, pricelists: result.rows };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // Get pricelist by ID with items
  fastify.get('/pricelists/:id', { preHandler: authMiddleware }, async (request, reply) => {
    try {
      const { id } = request.params;
      const client = await fastify.pg.connect();
      
      const pricelistResult = await client.query('SELECT * FROM pricelists WHERE id = $1', [id]);
      if (pricelistResult.rows.length === 0) {
        return { success: false, message: 'Pricelist not found' };
      }
      
      const itemsResult = await client.query(
        'SELECT * FROM pricelist_items WHERE pricelist_id = $1 ORDER BY created_at ASC',
        [id]
      );
      
      client.release();
      
      return {
        success: true,
        data: {
          ...pricelistResult.rows[0],
          items: itemsResult.rows
        }
      };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // Create new pricelist
  fastify.post('/pricelists', {
    preHandler: authMiddleware,
    schema: {
      tags: ['Pricelists'],
      summary: 'Create new pricelist',
      description: 'Create a new pricelist',
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', description: 'Pricelist name' },
          description: { type: 'string', description: 'Pricelist description' },
          currency: { type: 'string', default: 'EUR', description: 'Currency code' },
          color: { type: 'string', default: '#1890ff', description: 'Color in hex format' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { name, description, currency = 'EUR', color = '#1890ff' } = request.body;
      const client = await fastify.pg.connect();
      
      const result = await client.query(
        'INSERT INTO pricelists (name, description, currency, color) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, description, currency, color]
      );
      
      client.release();
      return { success: true, data: result.rows[0] };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // Update pricelist
  fastify.put('/pricelists/:id', { preHandler: authMiddleware }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { name, description, currency, color } = request.body;
      const client = await fastify.pg.connect();
      
      const result = await client.query(
        'UPDATE pricelists SET name = $1, description = $2, currency = $3, color = $4, updated_at = NOW() WHERE id = $5 RETURNING *',
        [name, description, currency, color, id]
      );
      
      client.release();
      return { success: true, data: result.rows[0] };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // Add item to pricelist
  fastify.post('/pricelists/:id/items', {
    preHandler: authMiddleware,
    schema: {
      tags: ['Items'],
      summary: 'Add item to pricelist',
      description: 'Add a new item to a pricelist',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer', description: 'Pricelist ID' }
        }
      },
      body: {
        type: 'object',
        required: ['product_id', 'name_tr', 'price'],
        properties: {
          product_id: { type: 'string', description: 'Product ID' },
          name_tr: { type: 'string', description: 'Product name (Turkish)' },
          name_en: { type: 'string', description: 'Product name (English)' },
          description_tr: { type: 'string', description: 'Description (Turkish)' },
          description_en: { type: 'string', description: 'Description (English)' },
          price: { type: 'number', description: 'Product price' },
          stock: { type: 'integer', default: 0, description: 'Stock quantity' },
          unit: { type: 'string', default: 'adet', description: 'Unit of measurement' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' }
          }
        },
        400: {
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
      const { product_id, name_tr, name_en, description_tr, description_en, price, stock = 0, unit = 'adet' } = request.body;
      const client = await fastify.pg.connect();
      
      // Duplikasyon kontrolü - tüm fiyat listelerinde product_id kontrolü
      const duplicateCheck = await client.query(
        'SELECT pi.*, p.name as pricelist_name FROM pricelist_items pi JOIN pricelists p ON pi.pricelist_id = p.id WHERE pi.product_id = $1',
        [product_id]
      );
      
      if (duplicateCheck.rows.length > 0) {
        const existingItem = duplicateCheck.rows[0];
        client.release();
        return reply.status(400).send({
          success: false,
          message: `Bu ürün zaten "${existingItem.pricelist_name}" fiyat listesinde mevcut`,
          duplicateInPricelist: existingItem.pricelist_name,
          existingItem: existingItem
        });
      }
      
      const result = await client.query(
        'INSERT INTO pricelist_items (pricelist_id, product_id, name_tr, name_en, description_tr, description_en, price, stock, unit) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
        [id, product_id, name_tr, name_en, description_tr, description_en, price, stock, unit]
      );
      
      client.release();
      return { success: true, data: result.rows[0] };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // Update pricelist item
  fastify.put('/items/:id', {
    preHandler: authMiddleware,
    schema: {
      tags: ['Items'],
      summary: 'Update pricelist item',
      description: 'Update an existing pricelist item',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer', description: 'Item ID' }
        }
      },
      body: {
        type: 'object',
        required: ['product_id', 'name_tr', 'price'],
        properties: {
          product_id: { type: 'string', description: 'Product ID' },
          name_tr: { type: 'string', description: 'Product name (Turkish)' },
          name_en: { type: 'string', description: 'Product name (English)' },
          description_tr: { type: 'string', description: 'Description (Turkish)' },
          description_en: { type: 'string', description: 'Description (English)' },
          price: { type: 'number', description: 'Product price' },
          stock: { type: 'integer', description: 'Stock quantity' },
          unit: { type: 'string', description: 'Unit of measurement' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { product_id, name_tr, name_en, description_tr, description_en, price, stock, unit } = request.body;
      const client = await fastify.pg.connect();
      
      // Duplikasyon kontrolü - diğer ürünlerle product_id kontrolü (kendi hariç)
      const duplicateCheck = await client.query(
        'SELECT pi.*, p.name as pricelist_name FROM pricelist_items pi JOIN pricelists p ON pi.pricelist_id = p.id WHERE pi.product_id = $1 AND pi.id != $2',
        [product_id, id]
      );
      
      if (duplicateCheck.rows.length > 0) {
        const existingItem = duplicateCheck.rows[0];
        client.release();
        return reply.status(400).send({
          success: false,
          message: `Bu ürün zaten "${existingItem.pricelist_name}" fiyat listesinde mevcut`,
          duplicateInPricelist: existingItem.pricelist_name
        });
      }
      
      const result = await client.query(
        'UPDATE pricelist_items SET product_id = $1, name_tr = $2, name_en = $3, description_tr = $4, description_en = $5, price = $6, stock = $7, unit = $8, updated_at = NOW() WHERE id = $9 RETURNING *',
        [product_id, name_tr, name_en, description_tr, description_en, price, stock, unit, id]
      );
      
      client.release();
      return { success: true, data: result.rows[0] };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // Delete pricelist item
  fastify.delete('/items/:id', {
    preHandler: authMiddleware,
    schema: {
      tags: ['Items'],
      summary: 'Delete pricelist item',
      description: 'Delete an item from a pricelist',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer', description: 'Item ID' }
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
      const client = await fastify.pg.connect();
      
      await client.query('DELETE FROM pricelist_items WHERE id = $1', [id]);
      
      client.release();
      return { success: true, message: 'Item deleted successfully' };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // Delete pricelist
  fastify.delete('/pricelists/:id', {
    preHandler: authMiddleware,
    schema: {
      tags: ['Pricelists'],
      summary: 'Delete pricelist',
      description: 'Delete a pricelist and all its items',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer', description: 'Pricelist ID' }
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
      const client = await fastify.pg.connect();
      
      await client.query('DELETE FROM pricelist_items WHERE pricelist_id = $1', [id]);
      await client.query('DELETE FROM pricelists WHERE id = $1', [id]);
      
      client.release();
      return { success: true, message: 'Pricelist deleted successfully' };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // Get all items from all pricelists
  fastify.get('/all-items', { preHandler: authMiddleware }, async (request, reply) => {
    try {
      const client = await fastify.pg.connect();
      const result = await client.query(`
        SELECT 
          pi.id,
          pi.product_id,
          pi.name_tr,
          pi.name_en,
          pi.description_tr,
          pi.description_en,
          pi.stock,
          pi.price,
          pi.unit,
          pi.created_at,
          p.id as pricelist_id,
          p.name as pricelist_name,
          p.currency
        FROM pricelist_items pi
        JOIN pricelists p ON pi.pricelist_id = p.id
        ORDER BY pi.created_at DESC
      `);
      
      client.release();
      return { success: true, items: result.rows };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // Dashboard statistics
  // Teklif için fiyat listeleri ve ürünleri getir (stok bilgisi ile)
  fastify.get('/pricelists-with-items', { preHandler: authMiddleware }, async (request, reply) => {
    try {
      const client = await fastify.pg.connect();
      
      // Önce fiyat listelerini getir
      const pricelistsResult = await client.query(`
        SELECT id, name, currency
        FROM pricelists 
        ORDER BY name ASC
      `);
      
      const pricelists = [];
      
      // Her fiyat listesi için ürünlerini getir
      for (const pricelist of pricelistsResult.rows) {
        const itemsResult = await client.query(`
          SELECT 
            id, product_id, name_tr, name_en, description_tr, description_en, price, unit, stock, created_at
          FROM pricelist_items 
          WHERE pricelist_id = $1 
          ORDER BY name_tr ASC, name_en ASC
        `, [pricelist.id]);
        
        pricelists.push({
          ...pricelist,
          items: itemsResult.rows
        });
      }
      
      client.release();
      return { success: true, pricelists };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  fastify.get('/dashboard/stats', { preHandler: authMiddleware }, async (request, reply) => {
    try {
      const client = await fastify.pg.connect();
      
      // Toplam fiyat listesi sayısı
      const pricelistCountResult = await client.query('SELECT COUNT(*) as count FROM pricelists');
      const totalPricelists = parseInt(pricelistCountResult.rows[0].count);

      // Toplam ürün sayısı
      const itemCountResult = await client.query('SELECT COUNT(*) as count FROM pricelist_items');
      const totalItems = parseInt(itemCountResult.rows[0].count);

      // En pahalı ürün
      const maxPriceResult = await client.query(`
        SELECT pi.name_tr, pi.name_en, pi.price, p.currency, p.name as pricelist_name 
        FROM pricelist_items pi 
        JOIN pricelists p ON pi.pricelist_id = p.id 
        ORDER BY pi.price DESC 
        LIMIT 1
      `);

      // En ucuz ürün
      const minPriceResult = await client.query(`
        SELECT pi.name_tr, pi.name_en, pi.price, p.currency, p.name as pricelist_name 
        FROM pricelist_items pi 
        JOIN pricelists p ON pi.pricelist_id = p.id 
        WHERE pi.price > 0
        ORDER BY pi.price ASC 
        LIMIT 1
      `);

      // Toplam stok değeri (sadece EUR için)
      const totalValueResult = await client.query(`
        SELECT SUM(pi.price * COALESCE(pi.stock, 0)) as total_value
        FROM pricelist_items pi 
        JOIN pricelists p ON pi.pricelist_id = p.id 
        WHERE p.currency = 'EUR'
      `);

      // Fiyat listelerine göre ürün dağılımı
      const distributionResult = await client.query(`
        SELECT p.name, p.color, COUNT(pi.id) as item_count
        FROM pricelists p
        LEFT JOIN pricelist_items pi ON p.id = pi.pricelist_id
        GROUP BY p.id, p.name, p.color
        ORDER BY item_count DESC
      `);

      // Para birimlerine göre dağılım
      const currencyDistResult = await client.query(`
        SELECT p.currency, COUNT(pi.id) as item_count
        FROM pricelists p
        LEFT JOIN pricelist_items pi ON p.id = pi.pricelist_id
        GROUP BY p.currency
        ORDER BY item_count DESC
      `);

      // Son 5 eklenen ürün
      const recentItemsResult = await client.query(`
        SELECT pi.name_tr, pi.name_en, pi.description_tr, pi.description_en, pi.price, p.currency, p.name as pricelist_name, pi.created_at
        FROM pricelist_items pi
        JOIN pricelists p ON pi.pricelist_id = p.id
        ORDER BY pi.created_at DESC
        LIMIT 5
      `);

      client.release();

      return {
        success: true,
        stats: {
          totalPricelists,
          totalItems,
          mostExpensive: maxPriceResult.rows[0] || null,
          cheapest: minPriceResult.rows[0] || null,
          totalValue: parseFloat(totalValueResult.rows[0].total_value || 0),
          pricelistDistribution: distributionResult.rows,
          currencyDistribution: currencyDistResult.rows,
          recentItems: recentItemsResult.rows
        }
      };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });
}

module.exports = pricelistRoutes;