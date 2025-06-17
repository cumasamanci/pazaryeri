// Trendyol API Working Endpoints Test
const axios = require('axios');
require('dotenv').config();

async function testWorkingEndpoints() {
  console.log('=== WORKING ENDPOINTS TEST ===');
  
  const testParams = {
    apiKey: 'jwGpoSyOH28Sw2C1Vxai',
    apiSecret: '2EYQl5jRAlVLRV4ydqoY',
    sellerId: '953720'
  };
  
  const baseURL = 'https://api.trendyol.com';
  
  const config = {
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Pazaryeri-Automation/1.0'
    },
    auth: {
      username: testParams.apiKey,
      password: testParams.apiSecret
    }
  };
  
  try {
    // 1. Orders test (çalıştığını biliyoruz)
    console.log('\n1. 📦 Orders Endpoint Test...');
    const ordersResponse = await axios.get(`${baseURL}/sapigw/suppliers/${testParams.sellerId}/orders`, {
      ...config,
      params: {
        startDate: Date.now() - (30 * 24 * 60 * 60 * 1000), // 30 gün önce
        endDate: Date.now(),
        page: 0,
        size: 5
      }
    });
    
    console.log('✅ Orders Success:', {
      status: ordersResponse.status,
      totalElements: ordersResponse.data?.totalElements || 0,
      recordCount: ordersResponse.data?.content?.length || 0
    });
    
    // 2. Farklı financial endpoints deneyelim
    const financialEndpoints = [
      '/sapigw/suppliers/{sellerId}/finance/transactions',
      '/sapigw/suppliers/{sellerId}/payments',
      '/sapigw/suppliers/{sellerId}/settlement',
      '/sapigw/suppliers/{sellerId}/financial-info',
      '/sapigw/suppliers/{sellerId}/commission',
      '/sapigw/suppliers/{sellerId}/invoices'
    ];
    
    console.log('\n2. 💰 Financial Endpoints Test...');
    
    for (const endpoint of financialEndpoints) {
      const url = endpoint.replace('{sellerId}', testParams.sellerId);
      const fullURL = `${baseURL}${url}`;
      
      try {
        console.log(`   Testing: ${url}`);
        
        const response = await axios.get(fullURL, {
          ...config,
          params: {
            startDate: Date.now() - (30 * 24 * 60 * 60 * 1000),
            endDate: Date.now(),
            page: 0,
            size: 1
          }
        });
        
        console.log(`   ✅ Success (${response.status}): ${JSON.stringify(response.data).substring(0, 100)}...`);
        
      } catch (error) {
        const status = error.response?.status || 'No Response';
        const message = error.response?.data?.message || error.message || 'Unknown error';
        console.log(`   ❌ Failed (${status}): ${message}`);
      }
    }
    
    // 3. Eğer order detayında financial bilgi varsa, onu kullanabiliriz
    console.log('\n3. 🔍 Order Details Analysis...');
    if (ordersResponse.data?.content && ordersResponse.data.content.length > 0) {
      const sampleOrder = ordersResponse.data.content[0];
      console.log('Sample order structure keys:', Object.keys(sampleOrder));
      
      // Financial alanları aratalım
      const financialFields = ['price', 'commission', 'payment', 'settlement', 'paidPrice', 'totalPrice'];
      const foundFields = financialFields.filter(field => 
        JSON.stringify(sampleOrder).toLowerCase().includes(field.toLowerCase())
      );
      
      console.log('Found financial-related fields:', foundFields);
      
      if (foundFields.length > 0) {
        console.log('Sample order financial data:', JSON.stringify(sampleOrder, null, 2).substring(0, 500) + '...');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  console.log('\n=== TEST COMPLETED ===');
}

testWorkingEndpoints().catch(console.error);
