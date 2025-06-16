const testApiConnection = require('./src/utils/testApiConnection');
const { pool, sql } = require('./src/config/database');

// Mağaza ID'si komut satırından alınır
const storeId = process.argv[2];

if (!storeId) {
  console.log("Kullanım: node testApiConnection.js <mağaza_id>");
  process.exit(1);
}

// Önce tüm mağazaları listele
async function listStores() {
  try {
    const result = await pool.request()
      .query('SELECT id, storeName, sellerId, apiKey FROM [TrendyolFinance].[dbo].[Stores]');
    
    console.log("\nMevcut mağazalar:");
    console.table(result.recordset.map(s => ({
      ID: s.id,
      Mağaza: s.storeName,
      SellerID: s.sellerId,
      "API Key": s.apiKey ? (s.apiKey.substring(0, 4) + '...') : 'Yok'
    })));
    
    return result.recordset;
  } catch (err) {
    console.error("Mağazalar listelenemedi:", err.message);
    process.exit(1);
  }
}

async function main() {
  try {
    // Mağazaları listele
    await listStores();
    
    console.log(`\n${storeId} ID'li mağaza için API testi yapılıyor...`);
    
    const result = await testApiConnection(storeId);
    
    if (result.success) {
      console.log('\n✅ API Bağlantısı BAŞARILI');
      console.log(`Durum kodu: ${result.status}`);
      console.log(`Toplam kayıt: ${result.data.totalRecords}`);
    } else {
      console.log('\n❌ API Bağlantısı BAŞARISIZ');
      console.log(`Hata: ${result.message}`);
      
      if (result.error) {
        console.log('\nHata detayları:');
        console.log(JSON.stringify(result.error, null, 2));
      }
    }
  } catch (err) {
    console.error("Test sırasında hata oluştu:", err);
  } finally {
    // Bağlantıyı kapat
    pool.close();
  }
}

main();