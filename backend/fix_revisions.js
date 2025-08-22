const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: 'SLeeper7_*@@',
  host: 'localhost',
  port: 5432,
  database: 'pricelist-app-3'
});

async function fixRevisions() {
  try {
    // q-R1'i q'nun revizyonu yap
    await pool.query(`
      UPDATE offers 
      SET parent_offer_id = 36, revision_no = 1 
      WHERE id = 37
    `);
    
    console.log('Revizyon bilgileri düzeltildi');
    
    // Kontrol et
    const result = await pool.query('SELECT id, offer_no, revision_no, parent_offer_id, created_at FROM offers ORDER BY offer_no, revision_no');
    console.log('Güncellenmiş veriler:');
    console.table(result.rows);
    
    await pool.end();
  } catch (error) {
    console.error('Database error:', error);
  }
}

fixRevisions();
