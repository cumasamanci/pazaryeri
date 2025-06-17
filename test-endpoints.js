// Trendyol API Endpoint Test
const axios = require('axios');
require('dotenv').config();

async function testTrendyolEndpoints() {
  console.log('=== TRENDYOL ENDPOINT TEST ===');
  
  const testParams = {
    apiKey: 'jwGpoSyOH28Sw2C1Vxai',
    apiSecret: '2EYQl5jRAlVLRV4ydqoY',
    sellerId: '953720'
  };
  
  const baseURLs = [
    'https://api.trendyol.com',
    'https://sellerpanel-api.trendyol.com',
    'https://stageapi.trendyol.com'
  ];
  
  const endpoints = [
    '/sapigw/suppliers/{sellerId}/settlements',
    '/sapigw/suppliers/{sellerId}/finance/settlement-financial-info',
    '/sapigw/suppliers/{sellerId}/finance/transactions',
    '/sapigw/suppliers/{sellerId}/orders',
    '/sapigw/suppliers/{sellerId}'
  ];
  
  for (const baseURL of baseURLs) {
    console.log(`\n🔗 Base URL Test: ${baseURL}`);
    
    for (const endpoint of endpoints) {
      const url = endpoint.replace('{sellerId}', testParams.sellerId);
      const fullURL = `${baseURL}${url}`;
      
      try {
        console.log(`   Testing: ${fullURL}`);
        
        const response = await axios.get(fullURL, {
          timeout: 10000,
          auth: {
            username: testParams.apiKey,
            password: testParams.apiSecret
          },
          params: {
            startDate: Date.now() - (7 * 24 * 60 * 60 * 1000), // 7 gün önce
            endDate: Date.now(),
            page: 0,
            size: 1
          }
        });
        
        console.log(`   ✅ Success: ${response.status} - ${response.statusText}`);
        console.log(`   Data preview: ${JSON.stringify(response.data).substring(0, 100)}...`);
        
      } catch (error) {
        const status = error.response?.status || 'No Response';
        const message = error.response?.data?.message || error.message || 'Unknown error';
        
        if (status === 401) {
          console.log(`   🔑 Auth Error (401): ${message}`);
        } else if (status === 404) {
          console.log(`   📍 Not Found (404): ${message}`);
        } else if (status === 556) {
          console.log(`   🚫 Service Unavailable (556): ${message}`);
        } else {
          console.log(`   ❌ Error (${status}): ${message}`);
        }
      }
    }
  }
  
  console.log('\n=== ENDPOINT TEST COMPLETED ===');
}

testTrendyolEndpoints().catch(console.error);
