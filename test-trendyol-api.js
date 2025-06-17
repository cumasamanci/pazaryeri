const TrendyolService = require('./src/services/trendyolService');
require('dotenv').config();

async function testTrendyolAPI() {
  console.log('=== TRENDYOL API TEST BAŞLATIYOR ===');
  
  const trendyolService = new TrendyolService();
    // Test parametreleri
  const testParams = {
    apiKey: process.env.TRENDYOL_API_KEY || 'jwGpoSyOH28Sw2C1Vxai',
    apiSecret: process.env.TRENDYOL_API_SECRET || '2EYQl5jRAlVLRV4ydqoY',
    sellerId: '953720' // MonalureShop seller ID
  };
  
  console.log('Test parametreleri:', {
    apiKey: testParams.apiKey?.substring(0, 8) + '...',
    apiSecret: testParams.apiSecret?.substring(0, 8) + '...',
    sellerId: testParams.sellerId
  });
  
  try {
    // API bağlantı testi
    console.log('\n1. API Bağlantı Testi...');
    const connectionTest = await trendyolService.testApiConnection(
      testParams.apiKey, 
      testParams.apiSecret, 
      testParams.sellerId
    );
    
    console.log('Bağlantı test sonucu:', connectionTest);
    
    if (connectionTest.success) {
      console.log('✅ API bağlantısı başarılı!');
      
      // Settlement test
      console.log('\n2. Settlement Verisi Testi...');
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7); // Son 7 gün
      
      const settlementData = await trendyolService.fetchSettlements(
        testParams.apiKey,
        testParams.apiSecret,
        testParams.sellerId,
        startDate,
        endDate,
        0,
        5
      );
      
      console.log('Settlement test sonucu:', {
        totalElements: settlementData?.totalElements || 0,
        recordCount: settlementData?.content?.length || 0
      });
      
      // Finansal veri testi
      console.log('\n3. Finansal Veri Testi...');
      const financialData = await trendyolService.fetchOtherFinancials(
        testParams.apiKey,
        testParams.apiSecret,
        testParams.sellerId,
        'Commission',
        startDate,
        endDate,
        0,
        5
      );
      
      console.log('Finansal test sonucu:', {
        totalElements: financialData?.totalElements || 0,
        recordCount: financialData?.content?.length || 0
      });
      
    } else {
      console.log('❌ API bağlantısı başarısız!');
      console.log('Hata:', connectionTest.message);
      
      if (connectionTest.status === 401) {
        console.log('\n🔑 API KEY ÇÖZÜM ÖNERİLERİ:');
        console.log('1. Trendyol Partner Portal\'dan yeni API key/secret oluşturun');
        console.log('2. Seller ID\'nin doğru olduğundan emin olun');
        console.log('3. API key\'in aktif ve geçerli olduğunu kontrol edin');
        console.log('4. Sandbox/Test ortamı yerine Production kullandığınızdan emin olun');
      }
    }
    
  } catch (error) {
    console.error('❌ Test sırasında hata:', error.message);
    console.error('Hata detayı:', error);
  }
  
  console.log('\n=== TEST TAMAMLANDI ===');
}

// Test'i çalıştır
testTrendyolAPI().catch(console.error);
