async function pricelistRoutes(fastify, options) {
  // Get all pricelists
  fastify.get('/pricelists', async (request, reply) => {
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
  fastify.get('/pricelists/:id', async (request, reply) => {
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
  fastify.post('/pricelists', async (request, reply) => {
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
  fastify.put('/pricelists/:id', async (request, reply) => {
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
  fastify.post('/pricelists/:id/items', async (request, reply) => {
    try {
      const { id } = request.params;
      const { product_id, name, description, price, stock = 0, unit = 'adet' } = request.body;
      const client = await fastify.pg.connect();
      
      // Duplikasyon kontrolü - tüm fiyat listelerinde product_id ve name kombinasyonu kontrol et
      const duplicateCheck = await client.query(
        'SELECT pi.*, p.name as pricelist_name FROM pricelist_items pi JOIN pricelists p ON pi.pricelist_id = p.id WHERE LOWER(TRIM(pi.name)) = LOWER(TRIM($1)) AND pi.product_id = $2',
        [name, product_id]
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
        'INSERT INTO pricelist_items (pricelist_id, product_id, name, description, price, stock, unit) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [id, product_id, name, description, price, stock, unit]
      );
      
      client.release();
      return { success: true, data: result.rows[0] };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // Update pricelist item
  fastify.put('/items/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const { product_id, name, description, price, stock, unit } = request.body;
      const client = await fastify.pg.connect();
      
      // Duplikasyon kontrolü - diğer ürünlerle product_id ve name kombinasyonu kontrol et (kendi hariç)
      const duplicateCheck = await client.query(
        'SELECT pi.*, p.name as pricelist_name FROM pricelist_items pi JOIN pricelists p ON pi.pricelist_id = p.id WHERE LOWER(TRIM(pi.name)) = LOWER(TRIM($1)) AND pi.product_id = $2 AND pi.id != $3',
        [name, product_id, id]
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
        'UPDATE pricelist_items SET product_id = $1, name = $2, description = $3, price = $4, stock = $5, unit = $6, updated_at = NOW() WHERE id = $7 RETURNING *',
        [product_id, name, description, price, stock, unit, id]
      );
      
      client.release();
      return { success: true, data: result.rows[0] };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // Delete pricelist item
  fastify.delete('/items/:id', async (request, reply) => {
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
  fastify.delete('/pricelists/:id', async (request, reply) => {
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
  fastify.get('/all-items', async (request, reply) => {
    try {
      const client = await fastify.pg.connect();
      const result = await client.query(`
        SELECT 
          pi.id,
          pi.product_id,
          pi.name,
          pi.description,
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
  fastify.get('/pricelists-with-items', async (request, reply) => {
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
            id, product_id, name, description, price, unit, stock, created_at
          FROM pricelist_items 
          WHERE pricelist_id = $1 
          ORDER BY name ASC
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

  fastify.get('/dashboard/stats', async (request, reply) => {
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
        SELECT pi.name, pi.price, p.currency, p.name as pricelist_name 
        FROM pricelist_items pi 
        JOIN pricelists p ON pi.pricelist_id = p.id 
        ORDER BY pi.price DESC 
        LIMIT 1
      `);

      // En ucuz ürün
      const minPriceResult = await client.query(`
        SELECT pi.name, pi.price, p.currency, p.name as pricelist_name 
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
        SELECT pi.name, pi.price, p.currency, p.name as pricelist_name, pi.created_at
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