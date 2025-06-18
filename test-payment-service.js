// PaymentService direkt test
require('dotenv').config();
const PaymentService = require('./src/services/paymentService');

async function testPaymentService() {
  console.log('=== PAYMENT SERVICE DIRECT TEST ===');
  
  const paymentService = new PaymentService();
  
  const params = {
    userId: 'af91f595-39f5-4f42-8e60-33a9e10cc189',
    storeId: 2,
    apiType: 'settlements',
    transactionTypes: ['Sale', 'Return', 'Discount'],
    startDate: 1748736000000, // 2025-06-01
    endDate: 1750204799999,   // 2025-06-17
    jobName: 'Test Job'
  };
  
  try {
    console.log('startAutomationJob çağrılıyor...');
    const result = await paymentService.startAutomationJob(params);
    
    console.log('PaymentService test sonucu:', {
      success: result.success,
      jobId: result.jobId,
      message: result.message
    });
    
  } catch (error) {
    console.error('PaymentService test hatası:', {
      message: error.message,
      stack: error.stack
    });
  }
}

testPaymentService();
