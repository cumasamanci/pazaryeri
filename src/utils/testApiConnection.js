const axios = require('axios');
const { pool, sql } = require('../config/database');

/**
 * Trendyol API bağlantısını test eder
 * @param {number} storeId - Mağaza ID'si
 * @returns {Promise<Object>} - Test sonucu
 */
async function testApiConnection(storeId) {
  try {
    // Mağaza bilgilerini getir
    const storeResult = await pool.request()
      .input('storeId', sql.Int, storeId)
      .query('SELECT * FROM [TrendyolFinance].[dbo].[Stores] WHERE id = @storeId');
    
    if (!storeResult.recordset || storeResult.recordset.length === 0) {
      return { success: false, message: "Mağaza bulunamadı" };
    }
    
    const store = storeResult.recordset[0];
    
    // Basit bir API çağrısı yapalım (son 24 saatlik satış verileri)
    const yesterday = new Date(Date.now() - 86400000).valueOf(); // 24 saat öncesi
    const now = Date.now();
    
    const apiUrl = `https://apigw.trendyol.com/integration/finance/che/sellers/${store.sellerId}/settlements?startDate=${yesterday}&endDate=${now}&transactionType=Sale&page=0&size=1`;
    
    console.log(`API test bağlantısı yapılıyor: ${apiUrl}`);
    console.log(`Mağaza: ${store.storeName}, Seller ID: ${store.sellerId}`);
    
    // Kimlik bilgilerini hazırla (sellerId:apiKey)
    const apiCredentials = `${store.sellerId}:${store.apiKey}`;
    const encodedCredentials = Buffer.from(apiCredentials).toString('base64');
    
    console.log(`Kimlik doğrulama başlığı oluşturuldu: Basic ${encodedCredentials}`);
    
    // API çağrısı
    const response = await axios.get(apiUrl, {
      headers: {
        'Authorization': `Basic ${encodedCredentials}`,
        'Content-Type': 'application/json',
        'User-Agent': 'TrendyolFinanceIntegration/1.0'
      },
      timeout: 15000 // 15 saniye
    });
    
    return {
      success: true,
      status: response.status,
      message: 'API bağlantısı başarılı',
      data: {
        totalRecords: response.data.totalElements || 0,
        recordCount: response.data.content?.length || 0
      }
    };
  } catch (error) {
    console.error('API bağlantı hatası:', error.message);
    
    let errorMessage = 'API bağlantısı başarısız: ';
    let errorDetail = null;
    
    if (error.response) {
      errorMessage += `Hata kodu ${error.response.status}`;
      errorDetail = error.response.data;
      
      if (error.response.status === 401) {
        errorMessage = 'Kimlik doğrulama hatası: API anahtarınızı kontrol edin';
      }
    } else if (error.request) {
      errorMessage += 'Sunucudan yanıt alınamadı';
    } else {
      errorMessage += error.message;
    }
    
    return {
      success: false,
      message: errorMessage,
      error: errorDetail
    };
  }
}

// Komut satırından çağrılabilmesi için
if (require.main === module) {
  // Eğer komut satırından bir mağaza ID'si verilmişse
  const storeId = process.argv[2];
  
  if (!storeId) {
    console.error('Kullanım: node testApiConnection.js <mağaza_id>');
    process.exit(1);
  }
  
  testApiConnection(storeId)
    .then(result => {
      console.log('Test sonucu:', JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch(err => {
      console.error('Test sırasında hata oluştu:', err);
      process.exit(1);
    });
}

module.exports = testApiConnection;