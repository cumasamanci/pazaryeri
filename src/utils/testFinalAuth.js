const axios = require('axios');

async function testApiAuth() {
  try {
    const apiKey = 'jwGpoSyOH28Sw2C1Vxai';
    const apiSecret = '2EYQl5jRAlVLRV4ydqoY';
    const sellerId = '953720';
    
    // Kimlik bilgilerini doğru formatta hazırla (apiKey:apiSecret)
    const apiCredentials = `${apiKey}:${apiSecret}`;
    const encodedCredentials = Buffer.from(apiCredentials).toString('base64');
    
    console.log('Kimlik bilgileri:', apiCredentials);
    console.log('Base64 kodlanmış:', encodedCredentials);
    
    // Son 7 günlük tarih aralığı
    const endDate = Date.now();
    const startDate = endDate - (7 * 24 * 60 * 60 * 1000);
    
    const apiUrl = `https://apigw.trendyol.com/integration/finance/che/sellers/${sellerId}/settlements?startDate=${startDate}&endDate=${endDate}&transactionType=Sale&page=0&size=500`;
    
    console.log('API URL:', apiUrl);
    
    const response = await axios.get(apiUrl, {
      headers: {
        'Authorization': `Basic ${encodedCredentials}`,
        'Content-Type': 'application/json',
        'User-Agent': 'TrendyolFinanceIntegration/1.0'
      },
      timeout: 15000
    });
    
    console.log('✅ Başarılı!', response.status);
    console.log('Toplam kayıt:', response.data.totalElements || 0);
    return true;
  } catch (error) {
    console.log('❌ Hata:', error.message);
    if (error.response) {
      console.log('Durum kodu:', error.response.status);
      console.log('Detaylar:', error.response.data);
    }
    return false;
  }
}

testApiAuth();