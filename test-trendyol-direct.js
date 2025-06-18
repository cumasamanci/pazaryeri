// TrendyolService direkt test
require('dotenv').config();
const TrendyolService = require('./src/services/trendyolService');

async function testTrendyolService() {
  console.log('=== TRENDYOL SERVICE DIRECT TEST ===');
  
  const trendyolService = new TrendyolService();
  
  // Test parametreleri
  const apiKey = 'jwGpoSyOH28Sw2C1Vxai';
  const apiSecret = '2EYQl5jRAlVLRV4ydqoY';
  const sellerId = '953720';
  
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);
  
  try {
    console.log('fetchSettlements çağrılıyor...');
    const result = await trendyolService.fetchSettlements(
      apiKey,
      apiSecret,
      sellerId,
      startDate,
      endDate,
      0,
      5
    );
    
    console.log('Test sonucu:', {
      success: !!result,
      hasContent: !!result?.content,
      contentLength: result?.content?.length || 0
    });
    
  } catch (error) {
    console.error('TrendyolService test hatası:', {
      message: error.message,
      stack: error.stack
    });
  }
}

testTrendyolService();
