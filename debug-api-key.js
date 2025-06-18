// Local test - API key'lerin doğru gelip gelmediğini kontrol et
require('dotenv').config();

console.log('=== ENVIRONMENT VARIABLES TEST ===');
console.log('TRENDYOL_API_KEY:', process.env.TRENDYOL_API_KEY || 'YOK');
console.log('TRENDYOL_API_SECRET:', process.env.TRENDYOL_API_SECRET || 'YOK');

// Supabase bağlantısını test et ve mağaza verilerini kontrol et
const { db } = require('./src/config/database');

async function testStore() {
  try {
    console.log('\n=== MAĞAZA VERİLERİ TEST ===');
    
    const store = await db.getById('stores', 2);
    console.log('Mağaza 2 bilgileri:', {
      id: store?.id,
      name: store?.name,
      seller_id: store?.seller_id,
      hasApiKey: !!store?.api_key,
      hasApiSecret: !!store?.api_secret,
      apiKey: store?.api_key || 'YOK',
      apiSecret: store?.api_secret || 'YOK'
    });
    
  } catch (error) {
    console.error('Mağaza test hatası:', error);
  }
}

testStore();
