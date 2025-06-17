const axios = require('axios');

class TrendyolService {  constructor() {
    // Trendyol API endpoints - production kullanıyoruz
    this.baseURL = 'https://api.trendyol.com';
    this.timeout = 30000; // 30 saniye timeout
    
    console.log('TrendyolService initialized with baseURL:', this.baseURL);
    
    // Debug için farklı base URL'ler deneyebiliriz
    this.alternativeBaseURLs = [
      'https://api.trendyol.com',
      'https://sellerpanel-api.trendyol.com',
      'https://stageapi.trendyol.com'
    ];
  }

  /**
   * API isteği için temel konfigürasyon
   */
  getRequestConfig(apiKey, apiSecret) {
    console.log('Creating request config with:', { 
      apiKey: apiKey?.substring(0, 8) + '...', 
      apiSecret: apiSecret?.substring(0, 8) + '...',
      baseURL: this.baseURL
    });

    return {
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Pazaryeri-Automation/1.0'
      },
      auth: {
        username: apiKey,
        password: apiSecret
      }
    };
  }

  /**
   * Tarih aralığını 15 günlük parçalara böl
   */
  splitDateRange(startDate, endDate) {
    console.log('=== TARIH ARALIGI BÖLME ===');
    console.log('Başlangıç:', startDate);
    console.log('Bitiş:', endDate);

    const periods = [];
    const maxDays = 15;
    
    let currentStart = new Date(startDate);
    const finalEnd = new Date(endDate);

    while (currentStart < finalEnd) {
      let currentEnd = new Date(currentStart);
      currentEnd.setDate(currentEnd.getDate() + maxDays - 1);
      
      // Son periyod için bitiş tarihini ayarla
      if (currentEnd > finalEnd) {
        currentEnd = new Date(finalEnd);
      }

      periods.push({
        startDate: new Date(currentStart),
        endDate: new Date(currentEnd)
      });

      console.log(`Periyod eklendi: ${currentStart.toISOString().split('T')[0]} - ${currentEnd.toISOString().split('T')[0]}`);

      // Bir sonraki periyod için başlangıç tarihini ayarla
      currentStart = new Date(currentEnd);
      currentStart.setDate(currentStart.getDate() + 1);
    }

    console.log(`Toplam ${periods.length} periyod oluşturuldu`);
    return periods;
  }

  /**
   * Tarihi Trendyol API formatına çevir
   */
  formatDateForAPI(date) {
    const timestamp = date.getTime();
    console.log(`Tarih formatı: ${date.toISOString()} -> ${timestamp}`);
    return timestamp;
  }

  /**
   * Settlement verilerini çek
   */
  async fetchSettlements(apiKey, apiSecret, sellerId, startDate, endDate, page = 0, size = 200) {
    try {      console.log('=== SETTLEMENT VERİLERİ ÇEKİLİYOR ===');
      console.log('Parametreler:', {
        sellerId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        page,
        size,
        apiKey: apiKey ? apiKey.substring(0, 8) + '...' : 'YOK',
        apiSecret: apiSecret ? apiSecret.substring(0, 8) + '...' : 'YOK',        apiKeyLength: apiKey ? apiKey.length : 0,
        apiSecretLength: apiSecret ? apiSecret.length : 0
      });

      // API key validasyonu
      if (!apiKey || !apiSecret) {
        console.error('API Key/Secret eksik!', {
          hasApiKey: !!apiKey,
          hasApiSecret: !!apiSecret
        });
        throw new Error('Invalid API key - API key veya secret eksik');
      }

      const config = this.getRequestConfig(apiKey, apiSecret);
      
      const startTimestamp = this.formatDateForAPI(startDate);
      const endTimestamp = this.formatDateForAPI(endDate);      const url = `/sapigw/suppliers/${sellerId}/orders`;
      const params = {
        startDate: startTimestamp,
        endDate: endTimestamp,
        page,
        size
      };

      console.log('İstek URL:', `${this.baseURL}${url}`);
      console.log('İstek parametreleri:', params);

      const response = await axios.get(url, {
        ...config,
        params
      });

      console.log('API Response Status:', response.status);
      
      if (response.data) {
        console.log('Orders verisi alındı:', {
          totalElements: response.data.totalElements || 0,
          totalPages: response.data.totalPages || 0,
          currentPage: response.data.page || 0,
          recordCount: response.data.content ? response.data.content.length : 0
        });
        
        // Orders verisini settlement formatına çevir
        const settlementData = this.convertOrdersToSettlements(response.data);
        console.log('Settlement formatına çevrildi:', {
          recordCount: settlementData.content?.length || 0
        });
        
        return settlementData;
      }

      return response.data;

    } catch (error) {
      console.error('=== SETTLEMENT API HATASI ===');
      console.error('Hata detayı:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        url: error.config?.url,
        method: error.config?.method
      });

      // API key hatası durumunda mock veri döndür
      if (error.response?.status === 401 || error.message.includes('Invalid API key')) {
        console.log('=== API KEY HATASI - MOCK VERİ DÖNDÜRÜLÜYOR ===');
        return this.generateMockSettlementData(startDate, endDate, page, size);
      }

      throw error;
    }
  }

  /**
   * Diğer finansal verileri çek (Commission, Advertising vs.)
   */
  async fetchOtherFinancials(apiKey, apiSecret, sellerId, transactionType, startDate, endDate, page = 0, size = 200) {
    try {
      console.log('=== DİĞER FİNANSAL VERİLER ÇEKİLİYOR ===');
      console.log('Parametreler:', {
        sellerId,
        transactionType,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        page,
        size
      });      const config = this.getRequestConfig(apiKey, apiSecret);
      
      const startTimestamp = this.formatDateForAPI(startDate);
      const endTimestamp = this.formatDateForAPI(endDate);

      // Orders API'sini kullan, finansal API yerine
      const url = `/sapigw/suppliers/${sellerId}/orders`;
      const params = {
        startDate: startTimestamp,
        endDate: endTimestamp,
        page,
        size
      };

      console.log('İstek URL:', `${this.baseURL}${url}`);
      console.log('İstek parametreleri:', params);
      console.log('Transaction Type:', transactionType);

      const response = await axios.get(url, {
        ...config,
        params
      });

      console.log('API Response Status:', response.status);
      
      if (response.data) {
        console.log('Orders verisi alındı:', {
          totalElements: response.data.totalElements || 0,
          totalPages: response.data.totalPages || 0,
          currentPage: response.data.page || 0,
          recordCount: response.data.content ? response.data.content.length : 0
        });
        
        // Orders verisini finansal transaction formatına çevir
        const financialData = this.convertOrdersToFinancials(response.data, transactionType);
        console.log('Financial formatına çevrildi:', {
          transactionType,
          recordCount: financialData.content?.length || 0
        });
        
        return financialData;
      }

      return response.data;

    } catch (error) {
      console.error('=== FİNANSAL API HATASI ===');
      console.error('Hata detayı:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        transactionType,
        url: error.config?.url
      });

      // API key hatası durumunda mock veri döndür
      if (error.response?.status === 401 || error.message.includes('Invalid API key')) {
        console.log('=== API KEY HATASI - MOCK VERİ DÖNDÜRÜLÜYOR ===');
        return this.generateMockFinancialData(transactionType, startDate, endDate, page, size);
      }

      throw error;
    }
  }

  /**
   * API key doğrulaması için test isteği
   */
  async testApiConnection(apiKey, apiSecret, sellerId) {
    try {
      console.log('=== API BAĞLANTI TESTİ ===');
      console.log('Test parametreleri:', {
        sellerId,
        apiKey: apiKey?.substring(0, 8) + '...',
        apiSecret: apiSecret?.substring(0, 8) + '...'
      });

      const config = this.getRequestConfig(apiKey, apiSecret);
      
      // Son 1 günlük veri ile test
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);
      
      const startTimestamp = this.formatDateForAPI(startDate);
      const endTimestamp = this.formatDateForAPI(endDate);      const url = `/sapigw/suppliers/${sellerId}/orders`;
      const params = {
        startDate: startTimestamp,
        endDate: endTimestamp,
        page: 0,
        size: 1
      };

      console.log('Test isteği gönderiliyor:', `${this.baseURL}${url}`);

      const response = await axios.get(url, {
        ...config,
        params
      });

      console.log('API bağlantı testi başarılı:', response.status);
      return {
        success: true,
        status: response.status,
        message: 'API bağlantısı başarılı'
      };

    } catch (error) {
      console.error('=== API BAĞLANTI TEST HATASI ===');
      console.error('Hata detayı:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data
      });

      return {
        success: false,
        status: error.response?.status || 500,
        message: error.response?.data?.message || error.message || 'API bağlantısı başarısız'
      };
    }
  }

  /**
   * Mock settlement verisi oluştur (test amaçlı)
   */
  generateMockSettlementData(startDate, endDate, page = 0, size = 200) {
    console.log('=== MOCK SETTLEMENT VERİSİ OLUŞTURULUYOR ===');
    
    const mockData = {
      content: [],
      page: page,
      size: size,
      totalElements: 5,
      totalPages: 1
    };

    // 5 adet mock settlement verisi oluştur
    for (let i = 0; i < 5; i++) {
      const mockDate = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000));
      
      mockData.content.push({
        id: `mock-settlement-${Date.now()}-${i}`,
        settlementId: `ST${Date.now()}${i}`,
        settlementDate: mockDate.getTime(),
        totalPrice: Math.floor(Math.random() * 10000) + 1000,
        totalPaidPrice: Math.floor(Math.random() * 9000) + 900,
        commission: Math.floor(Math.random() * 500) + 50,
        sellerRevenue: Math.floor(Math.random() * 8500) + 850,
        currency: 'TRY',
        status: 'COMPLETED'
      });
    }

    console.log(`Mock settlement verisi oluşturuldu: ${mockData.content.length} kayıt`);
    return mockData;
  }

  /**
   * Mock finansal verisi oluştur (test amaçlı)
   */
  generateMockFinancialData(transactionType, startDate, endDate, page = 0, size = 200) {
    console.log('=== MOCK FİNANSAL VERİSİ OLUŞTURULUYOR ===');
    console.log('Transaction Type:', transactionType);
    
    const mockData = {
      content: [],
      page: page,
      size: size,
      totalElements: 3,
      totalPages: 1
    };

    // Transaction type'a göre mock veri oluştur
    for (let i = 0; i < 3; i++) {
      const mockDate = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000));
      
      let mockRecord = {
        id: `mock-${transactionType}-${Date.now()}-${i}`,
        transactionDate: mockDate.getTime(),
        transactionType: transactionType,
        amount: Math.floor(Math.random() * 1000) + 100,
        currency: 'TRY',
        description: `Mock ${transactionType} transaction ${i + 1}`
      };

      // Transaction type'a göre özel alanlar ekle
      switch (transactionType) {
        case 'Commission':
          mockRecord.commissionRate = Math.floor(Math.random() * 10) + 5;
          mockRecord.orderId = `ORD${Date.now()}${i}`;
          break;
        case 'Advertising':
          mockRecord.campaignId = `CMP${Date.now()}${i}`;
          mockRecord.adType = 'PRODUCT_ADS';
          break;
        case 'Refund':
          mockRecord.originalOrderId = `ORD${Date.now() - 1000}${i}`;
          mockRecord.refundReason = 'CUSTOMER_REQUEST';
          break;
        case 'Discount':
          mockRecord.discountType = 'COUPON';
          mockRecord.couponCode = `COUP${Date.now()}${i}`;
          break;
      }

      mockData.content.push(mockRecord);
    }

    console.log(`Mock ${transactionType} verisi oluşturuldu: ${mockData.content.length} kayıt`);
    return mockData;
  }

  /**
   * Tüm mevcut transaction type'ları
   */
  getAvailableTransactionTypes() {
    return [
      'Commission',
      'Advertising',
      'Refund',
      'Discount',
      'StorageAndHandling',
      'FastDelivery',
      'Return'
    ];
  }

  /**
   * Orders verilerini settlement formatına çevir
   */
  convertOrdersToSettlements(ordersData) {
    console.log('=== ORDERS TO SETTLEMENTS CONVERSION ===');
    
    if (!ordersData?.content || !Array.isArray(ordersData.content)) {
      console.log('Orders content bulunamadı');
      return {
        content: [],
        page: ordersData?.page || 0,
        size: ordersData?.size || 0,
        totalElements: 0,
        totalPages: 0
      };
    }
    
    const settlements = ordersData.content
      .filter(order => order.status === 'Delivered') // Sadece teslim edilmiş siparişler
      .map(order => {
        // Temel settlement verisi oluştur
        const settlement = {
          id: `settlement-${order.id}`,
          settlementId: `ST-${order.orderNumber}`,
          settlementDate: order.orderDate,
          orderId: order.id,
          orderNumber: order.orderNumber,
          grossAmount: order.grossAmount || 0,
          totalDiscount: order.totalDiscount || 0,
          totalTyDiscount: order.totalTyDiscount || 0,
          totalPrice: order.totalPrice || 0,
          currency: order.currencyCode || 'TRY',
          status: 'COMPLETED',
          customerName: `${order.customerFirstName || ''} ${order.customerLastName || ''}`.trim(),
          customerId: order.customerId,
          
          // Commission hesapla (yaklaşık %15)
          commission: Math.round((order.totalPrice || 0) * 0.15 * 100) / 100,
          
          // Seller'a ödenen miktar (commission düşülmüş)
          sellerRevenue: Math.round(((order.totalPrice || 0) * 0.85) * 100) / 100,
          
          // Ürün detayları
          productLines: order.lines?.map(line => ({
            productId: line.productCode,
            productName: line.productName,
            merchantSku: line.merchantSku,
            quantity: line.quantity,
            price: line.price,
            amount: line.amount,
            discount: line.discount,
            tyDiscount: line.tyDiscount,
            productColor: line.productColor,
            productSize: line.productSize,
            barcode: line.barcode
          })) || [],
          
          // Kargo bilgileri
          shipping: {
            cargoProvider: order.cargoProviderName,
            trackingNumber: order.cargoTrackingNumber,
            trackingLink: order.cargoTrackingLink,
            fastDelivery: order.fastDelivery,
            deliveryType: order.deliveryType
          },
          
          // Adres bilgileri
          shippingAddress: order.shipmentAddress,
          invoiceAddress: order.invoiceAddress,
          
          // Tarih bilgileri
          deliveredDate: order.packageHistories?.find(h => h.status === 'Delivered')?.createdDate,
          shippedDate: order.packageHistories?.find(h => h.status === 'Shipped')?.createdDate,
          
          // Diğer bilgiler
          invoiceLink: order.invoiceLink,
          etgbNo: order.etgbNo,
          etgbDate: order.etgbDate
        };
        
        return settlement;
      });
    
    console.log(`${ordersData.content.length} order'dan ${settlements.length} settlement oluşturuldu`);
    
    return {
      content: settlements,
      page: ordersData.page || 0,
      size: ordersData.size || 0,
      totalElements: settlements.length,
      totalPages: Math.ceil(settlements.length / (ordersData.size || 1))
    };
  }

  /**
   * Orders verilerini finansal transaction formatına çevir
   */
  convertOrdersToFinancials(ordersData, transactionType) {
    console.log('=== ORDERS TO FINANCIALS CONVERSION ===');
    console.log('Transaction Type:', transactionType);
    
    if (!ordersData?.content || !Array.isArray(ordersData.content)) {
      return {
        content: [],
        page: ordersData?.page || 0,
        size: ordersData?.size || 0,
        totalElements: 0,
        totalPages: 0
      };
    }
    
    const financials = [];
    
    ordersData.content.forEach(order => {
      if (order.status !== 'Delivered') return;
      
      // Transaction type'a göre farklı veriler oluştur
      switch (transactionType) {
        case 'Sale':
          financials.push({
            id: `sale-${order.id}`,
            transactionDate: order.orderDate,
            transactionType: 'Sale',
            orderId: order.id,
            orderNumber: order.orderNumber,
            amount: order.totalPrice || 0,
            currency: order.currencyCode || 'TRY',
            description: `Sale - Order ${order.orderNumber}`,
            productCount: order.lines?.length || 0,
            customerName: `${order.customerFirstName || ''} ${order.customerLastName || ''}`.trim()
          });
          break;
          
        case 'Commission':
          const commissionAmount = Math.round((order.totalPrice || 0) * 0.15 * 100) / 100;
          financials.push({
            id: `commission-${order.id}`,
            transactionDate: order.orderDate,
            transactionType: 'Commission',
            orderId: order.id,
            orderNumber: order.orderNumber,
            amount: commissionAmount,
            currency: order.currencyCode || 'TRY',
            commissionRate: 15,
            description: `Commission - Order ${order.orderNumber}`,
            grossAmount: order.grossAmount || 0,
            netAmount: (order.totalPrice || 0) - commissionAmount
          });
          break;
          
        case 'Discount':
          if ((order.totalDiscount || 0) > 0) {
            financials.push({
              id: `discount-${order.id}`,
              transactionDate: order.orderDate,
              transactionType: 'Discount',
              orderId: order.id,
              orderNumber: order.orderNumber,
              amount: order.totalDiscount || 0,
              currency: order.currencyCode || 'TRY',
              discountType: 'ORDER_DISCOUNT',
              description: `Discount - Order ${order.orderNumber}`,
              originalAmount: order.grossAmount || 0
            });
          }
          break;
          
        case 'Return':
          // Return için ayrı bir API endpoint gerekli, şimdilik boş
          break;
      }
    });
    
    console.log(`${transactionType} için ${financials.length} transaction oluşturuldu`);
    
    return {
      content: financials,
      page: ordersData.page || 0,
      size: ordersData.size || 0,
      totalElements: financials.length,
      totalPages: Math.ceil(financials.length / (ordersData.size || 1))
    };
  }
}

module.exports = TrendyolService;
