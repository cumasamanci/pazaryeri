// Final test - sadece kısa bir test
require('dotenv').config();
const PaymentService = require('./src/services/paymentService');

async function quickTest() {
  const paymentService = new PaymentService();
  
  const params = {
    userId: 'af91f595-39f5-4f42-8e60-33a9e10cc189',
    storeId: 2,
    apiType: 'settlements',
    transactionTypes: ['Sale'],
    startDate: 1750032000000, // 2025-06-16
    endDate: 1750118399999,   // 2025-06-16 end
    jobName: 'Quick Test'
  };
  
  try {
    console.log('=== QUICK TEST ===');
    const result = await paymentService.startAutomationJob(params);
    console.log('Sonuç:', result.success ? 'BAŞARILI' : 'BAŞARISIZ');
    
    // 10 saniye bekle
    await new Promise(resolve => setTimeout(resolve, 10000));
    console.log('Test tamamlandı');
    
  } catch (error) {
    console.error('Test hatası:', error.message);
  }
}

quickTest();
