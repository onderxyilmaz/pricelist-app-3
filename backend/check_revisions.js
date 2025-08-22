const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: 'SLeeper7_*@@',
  host: 'localhost',
  port: 5432,
  database: 'pricelist-app-3'
});

async function checkRevisions() {
  try {
    const result = await pool.query('SELECT id, offer_no, revision_no, parent_offer_id, created_at FROM offers ORDER BY offer_no, revision_no');
    console.log('Teklif verileri:');
    console.table(result.rows);
    await pool.end();
  } catch (error) {
    console.error('Database error:', error);
  }
}

checkRevisions();
