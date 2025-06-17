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
        hasApiSecret: !!store.api_secret
      });      // Tarih aralığını 15 günlük parçalara böl
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
          });

          let result;
          if (apiType === 'settlements') {
            console.log('Settlements API çağrısı yapılıyor...');
            result = await this.trendyolService.getSettlements(apiParams);
          } else if (apiType === 'otherfinancials') {
            console.log('Other Financials API çağrısı yapılıyor...');
            result = await this.trendyolService.getOtherFinancials(apiParams);
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
                const transformedData = this.transformApiData(typeResult.data, store.id, apiType);
                console.log(`${typeResult.data.length} kayıt dönüştürüldü`);
                
                if (apiType === 'settlements') {
                  console.log('Settlement verileri kaydediliyor...');
                  await SettlementModel.createBatch(transformedData);
                } else {
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
   */
  transformApiData(apiData, storeId, apiType) {
    return apiData.map(item => {
      const baseData = {
        store_id: storeId,
        transaction_id: item.id.toString(),
        transaction_date: new Date(item.transactionDate),
        barcode: item.barcode,
        transaction_type: item.transactionType,
        receipt_id: item.receiptId,
        description: item.description,
        debt: parseFloat(item.debt || 0),
        credit: parseFloat(item.credit || 0),
        payment_period: item.paymentPeriod,
        commission_rate: parseFloat(item.commissionRate || 0),
        commission_amount: parseFloat(item.commissionAmount || 0),
        commission_invoice_serial_number: item.commissionInvoiceSerialNumber,
        seller_revenue: parseFloat(item.sellerRevenue || 0),
        order_number: item.orderNumber,
        payment_order_id: item.paymentOrderId,
        payment_date: item.paymentDate ? new Date(item.paymentDate) : null,
        seller_id: parseInt(item.sellerId),
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
   * Yardımcı fonksiyon: Sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = PaymentService;
