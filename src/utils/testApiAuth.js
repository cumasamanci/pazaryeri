const axios = require('axios');

/**
 * Trendyol API kimlik doğrulamayı test eden fonksiyon
 */
async function testApiAuth(sellerId, apiKey) {
  try {
    console.log('✅ Test başlatıldı');
    console.log(`SellerId: ${sellerId}`);
    console.log(`API Key: ${apiKey.substring(0, 4)}...`);
    
    // Kimlik bilgilerini hazırla
    const apiCredentials = `${sellerId}:${apiKey}`;
    const encodedCredentials = Buffer.from(apiCredentials).toString('base64');
    
    console.log(`Kodlanmış kimlik bilgileri: ${encodedCredentials}`);
    console.log(`Authorization header: Basic ${encodedCredentials}`);
    
    // Son 7 günlük tarih aralığı oluştur
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    const startMillis = startDate.getTime();
    const endMillis = endDate.getTime();
    
    // Test için bir API çağrısı yap (tek bir işlem tipi için)
    const apiUrl = `https://apigw.trendyol.com/integration/finance/che/sellers/${sellerId}/settlements?startDate=${startMillis}&endDate=${endMillis}&transactionType=Sale&page=0&size=1`;
    
    console.log(`API URL: ${apiUrl}`);
    
    // API isteği
    const response = await axios.get(apiUrl, {
      headers: {
        'Authorization': `Basic ${encodedCredentials}`,
        'Content-Type': 'application/json',
        'User-Agent': 'TrendyolFinanceTest/1.0'
      },
      timeout: 10000
    });
    
    console.log('✅ API çağrısı başarılı!');
    console.log(`Durum kodu: ${response.status}`);
    console.log(`Toplam kayıt sayısı: ${response.data.totalElements || 0}`);
    
    return {
      success: true,
      status: response.status,
      totalRecords: response.data.totalElements || 0,
      message: 'API kimlik doğrulama başarılı'
    };
  } catch (error) {
    console.log('❌ API çağrısı başarısız!');
    
    if (error.response) {
      console.log(`Hata kodu: ${error.response.status}`);
      console.log('Hata detayları:', error.response.data);
      
      if (error.response.status === 401) {
        return {
          success: false,
          status: 401,
          message: 'Kimlik doğrulama hatası: Developer ID ve API Key kombinasyonu geçersiz',
          error: error.response.data
        };
      }
      
      return {
        success: false,
        status: error.response.status,
        message: `API hatası: ${error.response.status} ${error.response.statusText}`,
        error: error.response.data
      };
    }
    
    return {
      success: false,
      message: `API bağlantı hatası: ${error.message}`,
      error: error
    };
  }
}

// Komut satırından çağrıldığında
if (require.main === module) {
  // Komut satırı argümanlarını al
  const sellerId = process.argv[2];
  const apiKey = process.argv[3];
  
  if (!sellerId || !apiKey) {
    console.log('Kullanım: node testApiAuth.js <sellerId> <apiKey>');
    process.exit(1);
  }
  
  // Testi çalıştır
  testApiAuth(sellerId, apiKey)
    .then(result => {
      if (result.success) {
        console.log('\n✅✅✅ TEST BAŞARILI ✅✅✅');
      } else {
        console.log('\n❌❌❌ TEST BAŞARISIZ ❌❌❌');
        console.log('Sebep:', result.message);
        
        if (result.error && result.error.errors) {
          console.log('Detay:', result.error.errors[0]?.message || JSON.stringify(result.error));
        }
      }
      
      process.exit(result.success ? 0 : 1);
    })
    .catch(err => {
      console.error('Test çalıştırılırken hata oluştu:', err);
      process.exit(1);
    });
}

module.exports = testApiAuth;