/**
 * Cleanup script for orphaned avatar files
 * This script removes avatar files that don't have a reference in the database
 * 
 * Usage: node cleanup_avatars.js
 */

require('dotenv').config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';

async function cleanupAvatars() {
  try {
    console.log('Avatar cleanup işlemi başlatılıyor...');
    console.log(`API URL: ${API_BASE_URL}/auth/cleanup-avatars`);
    
    const response = await fetch(`${API_BASE_URL}/auth/cleanup-avatars`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Temizlik başarıyla tamamlandı!');
      console.log(`📊 Silinen dosya sayısı: ${data.deletedCount}`);
      console.log(`⚠️  Hata sayısı: ${data.errorCount}`);
      console.log(`📁 Toplam orphaned dosya: ${data.totalOrphaned}`);
    } else {
      console.error('❌ Temizlik başarısız:', data.message);
    }
  } catch (error) {
    console.error('❌ Hata oluştu:', error.message);
  }
}

// Run cleanup
cleanupAvatars();

