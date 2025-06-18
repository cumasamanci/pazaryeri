const TrendyolService = require('./trendyolService');
const SettlementModel = require('../models/settlementModel');
const OtherFinancialModel = require('../models/otherFinancialModel');
const AutomationJobModel = require('../models/automationJobModel');
const StoreModel = require('../models/storeModel');

class PaymentService {
  constructor() {
    this.trendyolService = new TrendyolService();
  }

  /**
   * Otomasyon işini başlat
   */
  async startAutomationJob(params) {
    try {
      console.log('=== OTOMASYON İŞİ BAŞLATIYOR ===');
      console.log('Gelen parametreler:', JSON.stringify(params, null, 2));
      
      const { 
        userId, 
        storeId, 
        apiType, 
        transactionTypes, 
        startDate, 
        endDate, 
        jobName 
      } = params;      console.log('=== START AUTOMATION JOB DEBUG ===');
      console.log('Gelen parametreler:', { 
        userId, storeId, apiType, transactionTypes, startDate, endDate, jobName 
      });

      // Timestamp'leri Date object'e çevir
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      
      console.log('Tarih objeleri:', {
        startDateObj: startDateObj.toISOString(),
        endDateObj: endDateObj.toISOString()
      });

      // Parametreleri validate et
      if (!userId || !storeId || !apiType || !transactionTypes || !startDate || !endDate) {
        const error = 'Eksik parametreler';
        console.error('Parametre hatası:', { userId, storeId, apiType, transactionTypes, startDate, endDate });
        throw new Error(error);
      }

      // Tarih validasyonu
      if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        const error = 'Geçersiz tarih formatı';
        console.error('Tarih formatı hatası:', { startDate, endDate });
        throw new Error(error);
      }

      console.log('Mağaza bilgileri getiriliyor, storeId:', storeId);
      
      // Mağaza bilgilerini getir
      const store = await StoreModel.getById(storeId);
      if (!store) {
        console.error('Mağaza bulunamadı, storeId:', storeId);
        throw new Error('Mağaza bulunamadı');
      }
        console.log('Mağaza bulundu:', { 
        id: store.id, 
        name: store.name, 
        seller_id: store.seller_id,
        hasApiKey: !!store.api_key,
        hasApiSecret: !!store.api_secret,
        apiKeyLength: store.api_key ? store.api_key.length : 0,
        apiSecretLength: store.api_secret ? store.api_secret.length : 0,
        apiKeyPreview: store.api_key ? store.api_key.substring(0, 8) + '...' : 'YOK',
        apiSecretPreview: store.api_secret ? store.api_secret.substring(0, 8) + '...' : 'YOK'
      });// Tarih aralığını 15 günlük parçalara böl
      const periods = this.trendyolService.splitDateRange(startDateObj, endDateObj);
      console.log('Tarih aralığı parçalara bölündü:', periods.length, 'dönem');

      // Automation job oluştur - tarihleri ISO string formatında kaydet
      const jobData = {
        user_id: userId,
        store_id: storeId,
        job_name: jobName || `${apiType} - ${new Date().toLocaleDateString()}`,
        api_type: apiType,
        transaction_types: transactionTypes,
        start_date: startDateObj.toISOString(),
        end_date: endDateObj.toISOString(),
        status: 'pending',
        total_periods: periods.length,
        completed_periods: 0,
        total_records: 0
      };

      console.log('Automation job oluşturuluyor:', jobData);
      const job = await AutomationJobModel.create(jobData);
      console.log('Automation job oluşturuldu, ID:', job.id);

      // Asenkron olarak job'ı çalıştır
      console.log('Asenkron job execution başlatılıyor...');
      this.executeAutomationJob(job.id, store, periods, apiType, transactionTypes);

      const result = {
        success: true,
        jobId: job.id,
        message: 'Otomasyon işi başlatıldı',
        totalPeriods: periods.length,
        periods: periods
      };
      
      console.log('=== OTOMASYON İŞİ BAŞLATILDI ===');
      console.log('Sonuç:', result);
      
      return result;
    } catch (error) {
      console.error('=== OTOMASYON İŞİ BAŞLATMA HATASI ===');
      console.error('Hata:', error);
      console.error('Stack:', error.stack);
      throw error;
    }
  }

  /**
   * Otomasyon işini çalıştır (asenkron)
   */
  async executeAutomationJob(jobId, store, periods, apiType, transactionTypes) {
    try {
      console.log('=== OTOMASYON JOB EXECUTION BAŞLADI ===');
      console.log('Job ID:', jobId);
      console.log('Store:', { id: store.id, name: store.name });
      console.log('Periods:', periods.length);
      console.log('API Type:', apiType);
      console.log('Transaction Types:', transactionTypes);
      
      // Job durumunu güncelle
      await AutomationJobModel.updateStatus(jobId, 'running');
      console.log('Job durumu "running" olarak güncellendi');

      let totalRecords = 0;
      let completedPeriods = 0;

      for (const period of periods) {
        try {
          console.log(`=== DÖNEM İŞLENİYOR ===`);
          console.log(`Dönem: ${period.startDateStr} - ${period.endDateStr}`);

          const apiParams = {
            sellerId: store.seller_id,
            apiKey: store.api_key,
            apiSecret: store.api_secret,
            startDate: period.startDate,
            endDate: period.endDate,
            transactionTypes: transactionTypes
          };

          console.log('API Parametreleri:', {
            sellerId: apiParams.sellerId,
            hasApiKey: !!apiParams.apiKey,
            hasApiSecret: !!apiParams.apiSecret,
            startDate: apiParams.startDate,
            endDate: apiParams.endDate,
            transactionTypes: apiParams.transactionTypes
          });          let result;
          if (apiType === 'settlements') {
            console.log('Settlements API çağrısı yapılıyor...');
            result = await this.processSettlements(apiParams);
          } else if (apiType === 'otherfinancials') {
            console.log('Other Financials API çağrısı yapılıyor...');
            result = await this.processOtherFinancials(apiParams);
          } else {
            throw new Error('Geçersiz API tipi: ' + apiType);
          }

          console.log('API çağrısı sonucu:', {
            success: result.success,
            resultsCount: result.results ? result.results.length : 0
          });

          // Verileri veritabanına kaydet
          if (result.success && result.results) {
            for (const typeResult of result.results) {
              console.log(`Transaction type işleniyor: ${typeResult.transactionType}`, {
                success: typeResult.success,
                dataCount: typeResult.data ? typeResult.data.length : 0
              });
                if (typeResult.success && typeResult.data && typeResult.data.length > 0) {
                let transformedData;
                
                if (apiType === 'settlements') {
                  // Settlement verileri için özel transform metodu kullan
                  transformedData = this.transformSettlementData(typeResult.data, store.id);
                  console.log(`${typeResult.data.length} settlement kaydı dönüştürüldü`);
                  console.log('Settlement verileri kaydediliyor...');
                  await SettlementModel.createBatch(transformedData);
                } else {
                  // Diğer finansal veriler için genel transform metodu
                  transformedData = this.transformApiData(typeResult.data, store.id, apiType);
                  console.log(`${typeResult.data.length} financial kaydı dönüştürüldü`);
                  console.log('Other Financial verileri kaydediliyor...');
                  await OtherFinancialModel.createBatch(transformedData);
                }

                totalRecords += typeResult.data.length;
                console.log(`Toplam kayıt sayısı: ${totalRecords}`);
              }
            }
          }

          completedPeriods++;
          console.log(`Dönem tamamlandı. Toplam tamamlanan: ${completedPeriods}/${periods.length}`);

          // Progress güncelle
          await AutomationJobModel.update(jobId, {
            completed_periods: completedPeriods,
            total_records: totalRecords
          });

          // API rate limiting için kısa bekleme
          await this.sleep(1000);

        } catch (periodError) {
          console.error(`=== DÖNEM HATASI ===`);
          console.error(`Dönem: ${period.startDateStr} - ${period.endDateStr}`);
          console.error('Hata:', periodError);
          console.error('Stack:', periodError.stack);
          // Bu dönem hata verdi ama diğer dönemlere devam et
        }
      }

      // Job tamamlandı
      console.log('=== JOB TAMAMLANDI ===');
      console.log(`Toplam ${totalRecords} kayıt işlendi`);
      console.log(`${completedPeriods}/${periods.length} dönem tamamlandı`);
      
      await AutomationJobModel.updateStatus(jobId, 'completed', {
        total_records: totalRecords,
        completed_periods: completedPeriods
      });

      console.log(`Otomasyon job ${jobId} başarıyla tamamlandı.`);

    } catch (error) {
      console.error('=== OTOMASYON JOB EXECUTION HATASI ===');
      console.error(`Job ID: ${jobId}`);
      console.error('Hata:', error);
      console.error('Stack:', error.stack);
      
      // Job başarısız oldu
      await AutomationJobModel.updateStatus(jobId, 'failed', {
        error_message: error.message
      });
    }
  }

  /**
   * API verilerini veritabanı formatına dönüştür
   */  transformApiData(apiData, storeId, apiType) {
    return apiData.map(item => {
      const baseData = {
        store_id: storeId,
        transaction_id: (item.id || item.settlementId || `${Date.now()}_${Math.random()}`).toString(),
        transaction_date: new Date(item.transactionDate || item.settlementDate || item.orderDate || Date.now()),
        barcode: item.barcode,
        transaction_type: item.transactionType,
        receipt_id: item.receiptId,
        description: item.description,
        debt: parseFloat(item.debt || 0),
        credit: parseFloat(item.credit || 0),
        payment_period: item.paymentPeriod,
        commission_rate: parseFloat(item.commissionRate || 0),
        commission_amount: parseFloat(item.commissionAmount || item.commission || 0),
        commission_invoice_serial_number: item.commissionInvoiceSerialNumber,
        seller_revenue: parseFloat(item.sellerRevenue || 0),
        order_number: item.orderNumber,
        payment_order_id: item.paymentOrderId,
        payment_date: item.paymentDate ? new Date(item.paymentDate) : null,
        seller_id: parseInt(item.sellerId || 0),
        store_name: item.storeName,
        store_address: item.storeAddress,
        country: item.country || 'Türkiye',
        order_date: item.orderDate ? new Date(item.orderDate) : null,
        affiliate: item.affiliate,
        shipment_package_id: item.shipmentPackageId
      };

      return baseData;
    });
  }

  /**
   * Ödemeleri filtrelerle getir
   */
  async getPayments(filters = {}) {
    try {
      const { apiType = 'settlements', ...otherFilters } = filters;

      if (apiType === 'settlements') {
        const payments = await SettlementModel.getAll(otherFilters);
        const count = await SettlementModel.getCount(otherFilters);
        const stats = await SettlementModel.getStats(otherFilters);
        
        return {
          success: true,
          data: payments,
          count: count,
          stats: stats,
          type: 'settlements'
        };
      } else {
        const payments = await OtherFinancialModel.getAll(otherFilters);
        const count = await OtherFinancialModel.getCount(otherFilters);
        const stats = await OtherFinancialModel.getStats(otherFilters);
        
        return {
          success: true,
          data: payments,
          count: count,
          stats: stats,
          type: 'otherfinancials'
        };
      }
    } catch (error) {
      console.error('Ödemeler alınırken hata:', error);
      throw error;
    }
  }

  /**
   * Otomasyon job'larını getir
   */
  async getAutomationJobs(filters = {}) {
    try {
      const jobs = await AutomationJobModel.getAll(filters);
      const count = await AutomationJobModel.getCount(filters);
      const stats = await AutomationJobModel.getStats(filters);

      return {
        success: true,
        data: jobs,
        count: count,
        stats: stats
      };
    } catch (error) {
      console.error('Otomasyon jobları alınırken hata:', error);
      throw error;
    }
  }

  /**
   * Mağaza API'sini test et
   */
  async testStoreApi(storeId) {
    try {
      const store = await StoreModel.getById(storeId);
      if (!store) {
        throw new Error('Mağaza bulunamadı');
      }

      const credentials = {
        sellerId: store.seller_id,
        apiKey: store.api_key,
        apiSecret: store.api_secret
      };

      const result = await this.trendyolService.testConnection(credentials);
      
      return result;
    } catch (error) {
      console.error('API test hatası:', error);
      throw error;
    }
  }

  /**
   * Excel export için veri hazırla
   */
  async prepareExcelData(filters = {}) {
    try {
      const result = await this.getPayments({
        ...filters,
        limit: 10000 // Excel için maksimum limit
      });

      if (!result.success || !result.data) {
        throw new Error('Veri bulunamadı');
      }

      // Excel formatına uygun veri yapısı
      const excelData = result.data.map(item => ({
        'İşlem ID': item.transaction_id,
        'İşlem Tarihi': item.transaction_date ? new Date(item.transaction_date).toLocaleDateString('tr-TR') : '',
        'İşlem Tipi': item.transaction_type,
        'Barkod': item.barcode || '',
        'Açıklama': item.description || '',
        'Borç': item.debt || 0,
        'Alacak': item.credit || 0,
        'Komisyon Oranı': item.commission_rate || 0,
        'Komisyon Tutarı': item.commission_amount || 0,
        'Satıcı Hakediş': item.seller_revenue || 0,
        'Sipariş No': item.order_number || '',
        'Ödeme ID': item.payment_order_id || '',
        'Ödeme Tarihi': item.payment_date ? new Date(item.payment_date).toLocaleDateString('tr-TR') : '',
        'Satıcı ID': item.seller_id,
        'Mağaza': item.store_name || '',
        'Ülke': item.country || '',
        'Sipariş Tarihi': item.order_date ? new Date(item.order_date).toLocaleDateString('tr-TR') : '',
        'Affiliate': item.affiliate || ''
      }));

      return {
        success: true,
        data: excelData,
        filename: `odemeler_${new Date().toISOString().split('T')[0]}.xlsx`,
        stats: result.stats
      };
    } catch (error) {
      console.error('Excel verisi hazırlanırken hata:', error);
      throw error;
    }
  }

  /**
   * Transaction tipi seçeneklerini getir
   */
  getTransactionTypeOptions(apiType) {
    const descriptions = this.trendyolService.getTransactionTypeDescriptions();
    
    let types;
    if (apiType === 'settlements') {
      types = this.trendyolService.getSettlementTransactionTypes();
    } else {
      types = this.trendyolService.getOtherFinancialsTransactionTypes();
    }

    return types.map(type => ({
      value: type,
      label: type,
      description: descriptions[type] || type
    }));
  }

  /**
   * Settlement verilerini işle
   */
  async processSettlements(apiParams) {
    try {
      console.log('=== SETTLEMENT VERİLERİ İŞLENİYOR ===');
      
      const { sellerId, apiKey, apiSecret, startDate, endDate, transactionTypes } = apiParams;
      
      // TrendyolService'den settlement verilerini çek
      const apiData = await this.trendyolService.fetchSettlements(
        apiKey, 
        apiSecret, 
        sellerId, 
        startDate, 
        endDate
      );
      
      console.log('Settlement API yanıtı:', {
        totalElements: apiData?.totalElements || 0,
        contentLength: apiData?.content?.length || 0
      });
        // Verileri settlement formatına dönüştür
      const results = [];
      
      if (apiData && apiData.content && apiData.content.length > 0) {
        // Tüm settlement verilerini transaction type'larına göre ayır
        for (const transactionType of transactionTypes) {
          console.log(`İşlenen transaction type: ${transactionType}`);
          
          let filteredData = [];
          
          // Transaction type'a göre verileri filtrele
          switch (transactionType) {
            case 'Sale':
              // Normal satışlar
              filteredData = apiData.content.filter(item => 
                item.status === 'COMPLETED' && 
                !item.isReturn && 
                !item.isRefund &&
                (item.totalPrice || 0) > 0
              );
              break;
              
            case 'Return':
              // İadeler
              filteredData = apiData.content.filter(item => 
                item.isReturn || item.status === 'RETURNED'
              );
              break;
              
            case 'Discount':
              // İndirimler - totalDiscount > 0 olanlar
              filteredData = apiData.content.filter(item => 
                (item.totalDiscount || 0) > 0 || (item.totalTyDiscount || 0) > 0
              );
              break;
              
            case 'DiscountCancel':
              // İndirim iptalleri - genelde negatif değerler
              filteredData = apiData.content.filter(item => 
                (item.totalDiscount || 0) < 0
              );
              break;
              
            case 'Coupon':
            case 'CouponCancel':
              // Kupon kullanımları - couponDiscount alanı varsa
              filteredData = apiData.content.filter(item => 
                item.couponDiscount && (transactionType === 'Coupon' ? 
                  item.couponDiscount > 0 : item.couponDiscount < 0)
              );
              break;
              
            case 'ProvisionPositive':
              // Pozitif komisyon işlemleri
              filteredData = apiData.content.filter(item => 
                (item.commission || 0) > 0
              );
              break;
              
            case 'ProvisionNegative':
              // Negatif komisyon işlemleri
              filteredData = apiData.content.filter(item => 
                (item.commission || 0) < 0
              );
              break;
              
            default:
              // Bilinmeyen tip için tüm verileri kullan
              filteredData = apiData.content;
          }
          
          if (filteredData.length > 0) {
            // Transaction type'ı her veri elemanına ekle
            const dataWithType = filteredData.map(item => ({
              ...item,
              transactionType: transactionType
            }));
            
            const transformedData = this.transformSettlementData(dataWithType, apiParams.storeId);
            
            results.push({
              transactionType,
              success: true,
              data: transformedData
            });
            
            console.log(`Settlement ${transactionType}: ${transformedData.length} kayıt`);
          } else {
            console.log(`Settlement ${transactionType}: Veri bulunamadı`);
          }
        }
      }
      
      return {
        success: true,
        results
      };
      
    } catch (error) {
      console.error('Settlement işleme hatası:', error);
      throw error;
    }
  }

  /**
   * Diğer finansal verileri işle
   */
  async processOtherFinancials(apiParams) {
    try {
      console.log('=== DİĞER FİNANSAL VERİLER İŞLENİYOR ===');
      
      const { sellerId, apiKey, apiSecret, startDate, endDate, transactionTypes } = apiParams;
      const results = [];
      
      // Her transaction type için ayrı API çağrısı yap
      for (const transactionType of transactionTypes) {
        try {
          console.log(`Transaction type işleniyor: ${transactionType}`);
          
          const apiData = await this.trendyolService.fetchOtherFinancials(
            apiKey, 
            apiSecret, 
            sellerId, 
            transactionType,
            startDate, 
            endDate
          );
          
          console.log(`${transactionType} API yanıtı:`, {
            totalElements: apiData?.totalElements || 0,
            contentLength: apiData?.content?.length || 0
          });
          
          if (apiData && apiData.content && apiData.content.length > 0) {
            const transformedData = this.transformFinancialData(apiData.content, apiParams.storeId);
            
            results.push({
              transactionType,
              success: true,
              data: transformedData
            });
            
            console.log(`Financial ${transactionType}: ${transformedData.length} kayıt`);
          } else {
            console.log(`Financial ${transactionType}: Veri bulunamadı`);
            results.push({
              transactionType,
              success: true,
              data: []
            });
          }
          
          // API rate limiting için kısa bekleme
          await this.sleep(500);
          
        } catch (typeError) {
          console.error(`Transaction type ${transactionType} hatası:`, typeError);
          results.push({
            transactionType,
            success: false,
            error: typeError.message
          });
        }
      }
      
      return {
        success: true,
        results
      };
      
    } catch (error) {
      console.error('Financial işleme hatası:', error);
      throw error;
    }
  }  /**
   * Settlement verilerini dönüştür - settlement_transactions şemasına uygun
   */  transformSettlementData(apiData, storeId) {
    return apiData.map(item => ({
      store_id: storeId,
      transaction_id: item.settlementId || item.id || `ST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      transaction_date: new Date(item.settlementDate || item.transactionDate || item.orderDate || Date.now()),
      transaction_type: item.transactionType || 'Sale',
      debt: parseFloat(item.debt || 0),
      credit: parseFloat(item.credit || item.totalPrice || item.sellerRevenue || 0),
      seller_revenue: parseFloat(item.sellerRevenue || item.sellerPrice || 0),
      commission_amount: parseFloat(item.commissionAmount || item.commission || 0),
      order_number: item.orderNumber || null,
      seller_id: parseInt(item.sellerId || storeId),
      status: item.status || 'COMPLETED',
      total_price: parseFloat(item.totalPrice || item.amount || 0),
      payment_date: item.paymentDate ? new Date(item.paymentDate) : null,
      created_at: new Date(),
      updated_at: new Date()
    }));
  }

  /**
   * Finansal verileri dönüştür
   */
  transformFinancialData(apiData, storeId) {
    return apiData.map(item => ({
      store_id: storeId,
      transaction_id: item.id || `${Date.now()}_${Math.random()}`,
      transaction_date: new Date(item.transactionDate),
      transaction_type: item.transactionType,
      amount: parseFloat(item.amount || item.debt || item.credit || 0),
      description: item.description || `${item.transactionType} transaction`,
      currency: item.currency || 'TRY',
      order_number: item.orderNumber,
      receipt_id: item.receiptId,
      commission_rate: parseFloat(item.commissionRate || 0),
      payment_period: item.paymentPeriod,
      created_at: new Date(),
      updated_at: new Date()
    }));
  }

  /**
   * Transaction type mapping
   */
  mapTransactionType(item) {
    // API'den gelen veriyi frontend transaction type'ına map et
    const typeMapping = {
      'SALE': 'Sale',
      'RETURN': 'Return',
      'DISCOUNT': 'Discount',
      'COMMISSION': 'Commission',
      'REFUND': 'Return'
    };
    
    return typeMapping[item.transactionType?.toUpperCase()] || item.transactionType;
  }

  /**
   * Bekleme fonksiyonu
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = PaymentService;
