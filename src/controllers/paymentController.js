const { pool, sql } = require('../config/database');
const axios = require('axios');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');

// Ana sayfa - Ödemeler listesi
exports.getPayments = async (req, res) => {
  try {
    console.log('Ödemeler listesi getiriliyor...');
    
    // Mağazaları getir
    const storesResult = await pool.request().query(`
      SELECT * FROM [TrendyolFinance].[dbo].[Stores] 
      WHERE isActive = 1 
      ORDER BY storeName
    `);
    
    // Varsayılan tarih aralığı - Son 30 gün
    const endDate = moment().format('DD.MM.YYYY');
    const startDate = moment().subtract(30, 'days').format('DD.MM.YYYY');
    
    // Ödemeleri veritabanından getir - Son eklenen 100 kayıt
    const paymentsResult = await pool.request().query(`
      SELECT TOP 100 s.*, st.storeName 
      FROM [TrendyolFinance].[dbo].[Settlements] s
      LEFT JOIN [TrendyolFinance].[dbo].[Stores] st ON s.storeId = st.id
      ORDER BY s.transactionDate DESC
    `);
    
    res.render('payments/index', {
      title: 'Ödemeler',
      stores: storesResult.recordset || [],
      payments: paymentsResult.recordset || [],
      selectedStore: null,
      startDate: startDate,
      endDate: endDate,
      message: req.flash ? req.flash('success') : '',
      error: req.flash ? req.flash('error') : '',
      messageType: req.flash && req.flash('success') ? 'success' : 'error'
    });
  } catch (error) {
    console.error('Ödemeler listelenirken hata:', error);
    res.render('payments/index', {
      title: 'Ödemeler',
      stores: [],
      payments: [],
      selectedStore: null,
      startDate: null,
      endDate: null,
      message: '',
      error: 'Ödemeler listelenirken bir hata oluştu: ' + error.message,
      messageType: 'error'
    });
  }
};

// Trendyol'dan veri çek
exports.fetchData = async (req, res) => {
  try {
    console.log('Trendyol\'dan veri çekme başlatıldı');
    const startTime = Date.now();

    // Form verilerini al
    const { storeId, startDate, endDate, apiType } = req.body;
    let transactionTypes = req.body.transactionType;
    
    console.log('Tarih aralığı:', startDate, '-', endDate);
    console.log('API tipi:', apiType);
    console.log('İşlem tipleri:', transactionTypes);
    
    // Form validasyonu
    if (!storeId || !startDate || !endDate || !apiType || !transactionTypes) {
      if (req.flash) req.flash('error', 'Tüm alanları doldurunuz ve en az bir işlem tipi seçiniz');
      return res.redirect('/payments');
    }
    
    // TransactionType bir dizi değilse, tek bir değer olduğunu gösterir, diziyi oluştur
    if (!Array.isArray(transactionTypes)) {
      transactionTypes = [transactionTypes];
    }
    
    // Mağaza bilgilerini getir
    const storeResult = await pool.request()
      .input('storeId', sql.Int, storeId)
      .query('SELECT * FROM [TrendyolFinance].[dbo].[Stores] WHERE id = @storeId');
    
    // Mağaza kontrolü
    if (!storeResult.recordset || storeResult.recordset.length === 0) {
      console.error(`${storeId} ID'li mağaza bulunamadı`);
      if (req.flash) req.flash('error', 'Mağaza bulunamadı');
      return res.redirect('/payments');
    }
    
    // Mağaza bilgilerini al
    const store = storeResult.recordset[0];
    console.log(`Mağaza bilgileri alındı: ${store.storeName} (${store.sellerId})`);
    
    // Tarihleri millisaniye cinsine çevir
    const startDateTime = moment(startDate, 'DD.MM.YYYY').valueOf();
    const endDateTime = moment(endDate, 'DD.MM.YYYY').add(1, 'days').subtract(1, 'second').valueOf();
    
    console.log('Milisaniye cinsinden tarihler:', startDateTime, '-', endDateTime);
    
    // Batch işlem ID'si oluştur (bir UUID oluşturmalı)
    const batchId = require('uuid').v4();
    
    // İstatistikleri tutacak değişkenler
    let totalRecords = 0;
    let addedRecords = 0;
    let skippedRecords = 0;
    let apiErrors = [];

    // Her işlem tipi için API çağrısı yap
    for (const transactionType of transactionTypes) {
      console.log(`İşlem tipi: ${transactionType} için veriler çekiliyor...`);
      
      // Trendyol API endpoint'i
      const apiUrl = `https://apigw.trendyol.com/integration/finance/che/sellers/${store.sellerId}/${apiType}?startDate=${startDateTime}&endDate=${endDateTime}&transactionType=${transactionType}&page=0&size=1000`;
      
      try {
        console.log(`API çağrısı yapılıyor: ${apiUrl}`);
        
        // Kimlik bilgilerini apiKey:apiSecret formatında hazırla
        const apiCredentials = `${store.apiKey}:${store.apiSecret}`;
        const encodedCredentials = Buffer.from(apiCredentials).toString('base64');
        
        console.log(`Kimlik doğrulama bilgileri hazırlandı (${store.apiKey.substring(0, 4)}...)`);
        
        const response = await axios.get(apiUrl, {
          headers: {
            'Authorization': `Basic ${encodedCredentials}`,
            'Content-Type': 'application/json',
            'User-Agent': 'TrendyolFinanceIntegration/1.0'
          },
          timeout: 30000
        });
        
        // API yanıtını işle
        if (response.data && response.data.content && response.data.content.length > 0) {
          console.log(`${transactionType} için ${response.data.content.length} kayıt bulundu.`);
          totalRecords += response.data.content.length;
          
          // Verileri döngü içinde veritabanına ekle
          for (const item of response.data.content) {
            try {
              // Önce bu kayıt daha önce eklenmiş mi kontrol et
              const existingResult = await pool.request()
                .input('transactionId', sql.NVarChar, item.id)
                .query(`
                  SELECT COUNT(*) AS count FROM [TrendyolFinance].[dbo].[Settlements] 
                  WHERE transactionId = @transactionId
                `);
              
              // Eğer kayıt yoksa, ekle
              if (existingResult.recordset[0].count === 0) {
                await pool.request()
                  .input('transactionId', sql.NVarChar, item.id)
                  .input('transactionDate', sql.DateTime, new Date(parseInt(item.transactionDate)))
                  .input('barcode', sql.NVarChar, item.barcode || null)
                  .input('transactionType', sql.NVarChar, item.transactionType)
                  .input('receiptId', sql.BigInt, item.receiptId || null)
                  .input('description', sql.NVarChar, item.description || null)
                  .input('debt', sql.Decimal(18, 2), item.debt || 0)
                  .input('credit', sql.Decimal(18, 2), item.credit || 0)
                  .input('paymentPeriod', sql.Int, item.paymentPeriod || null)
                  .input('commissionRate', sql.Decimal(10, 2), item.commissionRate || null)
                  .input('commissionAmount', sql.Decimal(18, 2), item.commissionAmount || null)
                  .input('commissionInvoiceSerialNumber', sql.NVarChar, item.commissionInvoiceSerialNumber || null)
                  .input('sellerRevenue', sql.Decimal(18, 2), item.sellerRevenue || null)
                  .input('orderNumber', sql.NVarChar, item.orderNumber || null)
                  .input('paymentOrderId', sql.BigInt, item.paymentOrderId || null)
                  .input('paymentDate', sql.DateTime, item.paymentDate ? new Date(parseInt(item.paymentDate)) : null)
                  .input('sellerId', sql.NVarChar, item.sellerId ? String(item.sellerId) : null) // HATA BURADA!
                  .input('storeId', sql.Int, storeId)
                  .input('shipmentPackageId', sql.BigInt, item.shipmentPackageId || null)
                  .input('batchId', sql.NVarChar, batchId)
                  .query(`
                    INSERT INTO [TrendyolFinance].[dbo].[Settlements] (
                      transactionId, transactionDate, barcode, transactionType, 
                      receiptId, description, debt, credit, paymentPeriod,
                      commissionRate, commissionAmount, commissionInvoiceSerialNumber,
                      sellerRevenue, orderNumber, paymentOrderId, paymentDate,
                      sellerId, storeId, shipmentPackageId, batchId, createdAt
                    ) VALUES (
                      @transactionId, @transactionDate, @barcode, @transactionType,
                      @receiptId, @description, @debt, @credit, @paymentPeriod,
                      @commissionRate, @commissionAmount, @commissionInvoiceSerialNumber,
                      @sellerRevenue, @orderNumber, @paymentOrderId, @paymentDate,
                      @sellerId, @storeId, @shipmentPackageId, @batchId, GETDATE()
                    )
                  `);
                
                addedRecords++;
              } else {
                // Kayıt zaten var, atla
                skippedRecords++;
              }
            } catch (insertError) {
              console.error(`Kayıt eklenirken hata: ${insertError.message}`);
              skippedRecords++;
            }
          }
        } else {
          console.log(`${transactionType} için kayıt bulunamadı.`);
        }
      } catch (error) {
        console.error(`${transactionType} için API hatası:`, error.message);
        
        // API hata detaylarını kaydet
        let errorDetail = {
          transactionType,
          message: error.message
        };
        
        if (error.response) {
          console.error(`API hata kodu: ${error.response.status}`);
          console.error(`API hata mesajı:`, error.response.data);
          
          errorDetail.statusCode = error.response.status;
          errorDetail.detail = error.response.data;
        }
        
        apiErrors.push(errorDetail);
      }
    }
    
    // İşlem süresini hesapla
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
    
    // Hata kontrolü - hiç veri çekilmediyse
    if (totalRecords === 0 && apiErrors.length > 0) {
      // API hatalarını göster
      let errorMessage = 'API çağrısı sırasında hatalar oluştu:\n';
      
      for (const err of apiErrors) {
        if (err.statusCode === 401) {
          errorMessage = `Yetkilendirme hatası: API kimlik bilgilerinizi kontrol edin. ${err.detail || ''}`;
          break;
        } else {
          errorMessage += `• ${err.transactionType}: ${err.detail || err.message}\n`;
        }
      }
      
      if (req.flash) req.flash('error', errorMessage);
      return res.redirect('/payments');
    }
    
    // Batch kaydını ekle
    await pool.request()
      .input('batchId', sql.NVarChar, batchId)
      .input('storeId', sql.Int, storeId)
      .input('sellerId', sql.NVarChar, store.sellerId)
      .input('apiType', sql.NVarChar, apiType)
      .input('transactionType', sql.NVarChar, transactionTypes.join(','))
      .input('startDate', sql.DateTime, new Date(startDateTime))
      .input('endDate', sql.DateTime, new Date(endDateTime))
      .input('recordCount', sql.Int, totalRecords)
      .input('addedCount', sql.Int, addedRecords)
      .input('skippedCount', sql.Int, skippedRecords)
      .input('processingTime', sql.Decimal(10, 2), parseFloat(processingTime))
      .input('errorCount', sql.Int, apiErrors.length)
      .input('errorDetail', sql.NVarChar, JSON.stringify(apiErrors))
      .query(`
        INSERT INTO [TrendyolFinance].[dbo].[FetchLogs] (
          batchId, storeId, sellerId, apiType, transactionType,
          startDate, endDate, recordCount, addedCount, skippedCount,
          processingTime, errorCount, errorDetail, status, createdAt
        ) VALUES (
          @batchId, @storeId, @sellerId, @apiType, @transactionType,
          @startDate, @endDate, @recordCount, @addedCount, @skippedCount,
          @processingTime, @errorCount, @errorDetail, 'Completed', GETDATE()
        )
      `);
    
    // Eklenen tüm kayıtları getir
    const paymentsResult = await pool.request()
      .input('batchId', sql.NVarChar, batchId)
      .query(`
        SELECT s.*, st.storeName 
        FROM [TrendyolFinance].[dbo].[Settlements] s
        LEFT JOIN [TrendyolFinance].[dbo].[Stores] st ON s.storeId = st.id
        WHERE s.batchId = @batchId
        ORDER BY s.transactionDate DESC
      `);
    
    // Mağazaları getir
    const storesResult = await pool.request().query(`
      SELECT * FROM [TrendyolFinance].[dbo].[Stores] 
      WHERE isActive = 1 
      ORDER BY storeName
    `);
    
    // Kullanıcıya başarı mesajı
    let message = `Toplam ${totalRecords} kayıt işlendi. ${addedRecords} kayıt eklendi, ${skippedRecords} kayıt atlandı.`;
    
    // API hataları varsa eklenti bilgi ver
    if (apiErrors.length > 0) {
      message += ` (${apiErrors.length} işlem tipinde hata oluştu)`;
    }
    
    console.log(message);
    
    // Sonuçları göster
    res.render('payments/index', {
      title: 'Ödemeler',
      stores: storesResult.recordset || [],
      payments: paymentsResult.recordset || [],
      selectedStore: parseInt(storeId),
      startDate: startDate,
      endDate: endDate,
      apiType: apiType,
      message: message,
      messageType: 'success',
      fetchStats: {
        totalRecords,
        addedRecords,
        skippedRecords,
        processingTime,
        errorCount: apiErrors.length
      }
    });
  } catch (error) {
    console.error('Veri çekilirken hata:', error);
    
    let errorMessage = 'Veri çekilirken bir hata oluştu: ';
    
    if (error.response) {
      errorMessage += `API Hata Kodu: ${error.response.status}, ${error.response.data.message || error.message}`;
    } else {
      errorMessage += error.message;
    }
    
    if (req.flash) req.flash('error', errorMessage);
    res.redirect('/payments');
  }
};

// Ödemeleri filtrele
exports.filterPayments = async (req, res) => {
  try {
    const { storeId, startDate, endDate, transactionType } = req.body;
    
    let query = `
      SELECT s.*, st.storeName 
      FROM [TrendyolFinance].[dbo].[Settlements] s
      LEFT JOIN [TrendyolFinance].[dbo].[Stores] st ON s.storeId = st.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    
    if (storeId) {
      query += ` AND s.storeId = @storeId`;
      queryParams.push({ name: 'storeId', type: sql.Int, value: parseInt(storeId) });
    }
    
    if (startDate) {
      const startDateTime = moment(startDate, 'DD.MM.YYYY').toDate();
      query += ` AND s.transactionDate >= @startDate`;
      queryParams.push({ name: 'startDate', type: sql.DateTime, value: startDateTime });
    }
    
    if (endDate) {
      const endDateTime = moment(endDate, 'DD.MM.YYYY').add(1, 'days').toDate();
      query += ` AND s.transactionDate < @endDate`;
      queryParams.push({ name: 'endDate', type: sql.DateTime, value: endDateTime });
    }
    
    if (transactionType) {
      query += ` AND s.transactionType = @transactionType`;
      queryParams.push({ name: 'transactionType', type: sql.NVarChar, value: transactionType });
    }
    
    query += ` ORDER BY s.transactionDate DESC`;
    
    // Sorguyu hazırla
    const request = pool.request();
    
    // Parametreleri ekle
    queryParams.forEach(param => {
      request.input(param.name, param.type, param.value);
    });
    
    // Sorguyu çalıştır
    const result = await request.query(query);
    
    // Mağazaları getir
    const storesResult = await pool.request().query(`
      SELECT * FROM [TrendyolFinance].[dbo].[Stores] 
      WHERE isActive = 1 
      ORDER BY storeName
    `);
    
    res.render('payments/index', {
      title: 'Ödemeler',
      stores: storesResult.recordset || [],
      payments: result.recordset || [],
      selectedStore: storeId ? parseInt(storeId) : null,
      startDate: startDate,
      endDate: endDate,
      message: `${result.recordset.length} kayıt bulundu.`,
      messageType: 'success'
    });
  } catch (error) {
    console.error('Ödemeler filtrelenirken hata:', error);
    if (req.flash) req.flash('error', 'Ödemeler filtrelenirken bir hata oluştu: ' + error.message);
    res.redirect('/payments');
  }
};

// Excel'e aktar
exports.exportExcel = async (req, res) => {
  try {
    const { storeId, startDate, endDate, transactionType } = req.query;
    
    let query = `
      SELECT s.*, st.storeName 
      FROM [TrendyolFinance].[dbo].[Settlements] s
      LEFT JOIN [TrendyolFinance].[dbo].[Stores] st ON s.storeId = st.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    
    if (storeId) {
      query += ` AND s.storeId = @storeId`;
      queryParams.push({ name: 'storeId', type: sql.Int, value: parseInt(storeId) });
    }
    
    if (startDate) {
      const startDateTime = moment(startDate, 'DD.MM.YYYY').toDate();
      query += ` AND s.transactionDate >= @startDate`;
      queryParams.push({ name: 'startDate', type: sql.DateTime, value: startDateTime });
    }
    
    if (endDate) {
      const endDateTime = moment(endDate, 'DD.MM.YYYY').add(1, 'days').toDate();
      query += ` AND s.transactionDate < @endDate`;
      queryParams.push({ name: 'endDate', type: sql.DateTime, value: endDateTime });
    }
    
    if (transactionType) {
      query += ` AND s.transactionType = @transactionType`;
      queryParams.push({ name: 'transactionType', type: sql.NVarChar, value: transactionType });
    }
    
    query += ` ORDER BY s.transactionDate DESC`;
    
    // Sorguyu hazırla
    const request = pool.request();
    
    // Parametreleri ekle
    queryParams.forEach(param => {
      request.input(param.name, param.type, param.value);
    });
    
    // Sorguyu çalıştır
    const result = await request.query(query);
    
    // JSON formatında veri döndür (frontend Excel oluşturacak)
    res.json(result.recordset);
  } catch (error) {
    console.error('Excel export hatası:', error);
    res.status(500).json({ error: error.message });
  }
};

// Ödeme detayını göster
exports.getPaymentDetail = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Ödeme detayını getir
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT s.*, st.storeName 
        FROM [TrendyolFinance].[dbo].[Settlements] s
        LEFT JOIN [TrendyolFinance].[dbo].[Stores] st ON s.storeId = st.id
        WHERE s.id = @id
      `);
    
    if (!result.recordset || result.recordset.length === 0) {
      if (req.flash) req.flash('error', 'Ödeme bulunamadı');
      return res.redirect('/payments');
    }
    
    const payment = result.recordset[0];
    
    // İlişkili ödemeleri getir (aynı sipariş numarasına sahip)
    let relatedPayments = [];
    
    if (payment.orderNumber) {
      const relatedResult = await pool.request()
        .input('orderNumber', sql.NVarChar, payment.orderNumber)
        .input('id', sql.Int, payment.id)
        .query(`
          SELECT s.*, st.storeName 
          FROM [TrendyolFinance].[dbo].[Settlements] s
          LEFT JOIN [TrendyolFinance].[dbo].[Stores] st ON s.storeId = st.id
          WHERE s.orderNumber = @orderNumber AND s.id != @id
        `);
      
      relatedPayments = relatedResult.recordset || [];
    }
    
    res.render('payments/detail', {
      title: 'Ödeme Detayı',
      payment,
      relatedPayments,
      message: req.flash ? req.flash('success') : '',
      error: req.flash ? req.flash('error') : '',
      messageType: req.flash && req.flash('success') ? 'success' : 'error'
    });
  } catch (error) {
    console.error('Ödeme detayı görüntülenirken hata:', error);
    if (req.flash) req.flash('error', 'Ödeme detayı görüntülenirken bir hata oluştu: ' + error.message);
    res.redirect('/payments');
  }
};