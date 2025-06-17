// Trendyol Orders Financial Data Analysis
const axios = require('axios');
require('dotenv').config();

async function analyzeOrdersFinancialData() {
  console.log('=== ORDERS FINANCIAL DATA ANALYSIS ===');
  
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
    console.log('\n📦 Getting detailed order data...');
    
    const response = await axios.get(`${baseURL}/sapigw/suppliers/${testParams.sellerId}/orders`, {
      ...config,
      params: {
        startDate: Date.now() - (30 * 24 * 60 * 60 * 1000), // 30 gün önce
        endDate: Date.now(),
        page: 0,
        size: 3 // 3 sipariş alalım detay için
      }
    });
    
    console.log('📊 Response Summary:', {
      status: response.status,
      totalElements: response.data?.totalElements || 0,
      totalPages: response.data?.totalPages || 0,
      currentPage: response.data?.page || 0,
      recordCount: response.data?.content?.length || 0
    });
    
    if (response.data?.content && response.data.content.length > 0) {
      console.log('\n🔍 Analyzing order structure...');
      
      response.data.content.forEach((order, index) => {
        console.log(`\n--- Order ${index + 1} ---`);
        console.log('Basic Info:', {
          orderNumber: order.orderNumber,
          orderDate: new Date(order.orderDate).toISOString(),
          status: order.status,
          currencyCode: order.currencyCode
        });
        
        console.log('Financial Info:', {
          grossAmount: order.grossAmount,
          totalDiscount: order.totalDiscount,
          totalTyDiscount: order.totalTyDiscount,
          totalPrice: order.totalPrice
        });
        
        // Lines (ürün satırları) finansal bilgilerini incele
        if (order.lines && order.lines.length > 0) {
          console.log('Product Lines Financial Data:');
          order.lines.forEach((line, lineIndex) => {
            console.log(`  Line ${lineIndex + 1}:`, {
              productId: line.productId || 'N/A',
              productName: line.productName || 'N/A',
              quantity: line.quantity || 0,
              price: line.price || 0,
              totalPrice: line.totalPrice || 0,
              discount: line.discount || 0,
              tyDiscount: line.tyDiscount || 0,
              currencyCode: line.currencyCode || 'N/A'
            });
            
            // Eğer commission bilgisi varsa
            if (line.commission !== undefined) {
              console.log(`    Commission: ${line.commission}`);
            }
            
            // Eğer settlement bilgisi varsa
            if (line.settlement !== undefined) {
              console.log(`    Settlement: ${line.settlement}`);
            }
          });
        }
        
        // Kargo ve diğer maliyetler
        if (order.cargoProviderName) {
          console.log('Shipping Info:', {
            cargoProvider: order.cargoProviderName,
            fastDelivery: order.fastDelivery || false,
            deliveryType: order.deliveryType || 'N/A'
          });
        }
      });
      
      // Tüm order'ın JSON yapısını da gösterelim
      console.log('\n📋 Complete Order Structure (First Order):');
      console.log(JSON.stringify(response.data.content[0], null, 2));
      
    } else {
      console.log('❌ No order data found');
    }
    
  } catch (error) {
    console.error('❌ Analysis failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
  
  console.log('\n=== ANALYSIS COMPLETED ===');
}

analyzeOrdersFinancialData().catch(console.error);
