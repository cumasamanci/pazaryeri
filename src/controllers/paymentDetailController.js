const { sql } = require('../config/database');
const trendyolService = require('../services/trendyolService');

class PaymentDetailController {
  /**
   * Ödeme detayları sayfasını göster
   */
  async showPaymentDetails(req, res) {
    try {
      // Veritabanından mağaza listesini al
      const storeResult = await sql.query`SELECT id, name FROM Stores`;
      const stores = storeResult.recordset;
      
      // Varsayılan veriler (ekran yüklendiğinde boş tablo göstermek için)
      const paymentDetails = [];
      
      res.render('payments/details', {
        title: 'Ödeme Detayları',
        stores,
        paymentDetails,
        selectedStore: null,
        startDate: null,
        endDate: null,
        query: {}
      });
    } catch (error) {
      console.error('Ödeme detayları sayfası yüklenirken hata:', error);
      res.status(500).render('error', {
        title: 'Hata',
        message: 'Ödeme detayları sayfası yüklenirken bir hata oluştu',
        error
      });
    }
  }

  /**
   * Ödeme detaylarını getir
   */
  async getPaymentDetails(req, res) {
    try {
      const { storeId, startDate, endDate, transactionType, orderNumber } = req.body;
      
      if (!storeId || !startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Mağaza, başlangıç tarihi ve bitiş tarihi zorunludur'
        });
      }
      
      // Mağaza bilgilerini al
      const storeResult = await sql.query`SELECT * FROM Stores WHERE id = ${storeId}`;
      const store = storeResult.recordset[0];
      
      if (!store) {
        return res.status(404).json({
          success: false,
          message: 'Mağaza bulunamadı'
        });
      }
      
      // Tarihleri milisaniye cinsinden çevir
      const startDateMs = new Date(startDate).getTime();
      const endDateMs = new Date(endDate).getTime();
      
      let paymentDetails = [];
      
      // Sipariş numarası belirtilmişse sadece o siparişin detaylarını getir
      if (orderNumber) {
        const detailsResult = await sql.query`
          SELECT * FROM PaymentDetails 
          WHERE storeId = ${storeId} 
          AND orderNumber = ${orderNumber}
          AND transactionDate BETWEEN ${new Date(startDateMs)} AND ${new Date(endDateMs)}
        `;
        paymentDetails = detailsResult.recordset;
      } 
      // Yoksa tüm ödeme detaylarını getir
      else {
        // Önce veritabanından kontrol et
        const detailsResult = await sql.query`
          SELECT * FROM PaymentDetails 
          WHERE storeId = ${storeId} 
          AND transactionDate BETWEEN ${new Date(startDateMs)} AND ${new Date(endDateMs)}
          ${transactionType ? sql`AND transactionType = ${transactionType}` : sql``}
          ORDER BY transactionDate DESC
        `;
        
        // Veritabanında veri yoksa API'den çek
        if (detailsResult.recordset.length === 0) {
          try {
            // transactionType değerini API için uygun formata dönüştür
            const apiTransactionType = this._convertTransactionType(transactionType);
            
            // Ödeme türüne göre doğru API'yi çağır
            let apiData;
            if (this._isSettlementType(apiTransactionType)) {
              apiData = await trendyolService.getSettlements({
                sellerId: store.sellerId,
                startDate: startDateMs,
                endDate: endDateMs,
                transactionType: apiTransactionType,
                page: 0,
                size: 500
              });
            } else {
              apiData = await trendyolService.getOtherFinancials({
                sellerId: store.sellerId,
                startDate: startDateMs,
                endDate: endDateMs,
                transactionType: apiTransactionType,
                page: 0,
                size: 500
              });
            }
            
            if (apiData && apiData.content) {
              paymentDetails = apiData.content;
              
              // Verileri veritabanına kaydet
              await this._savePaymentDetailsToDb(paymentDetails, store.id);
            }
          } catch (apiError) {
            console.error('Trendyol API hatası:', apiError);
            return res.status(500).json({
              success: false,
              message: 'Trendyol API\'den veri çekilirken hata oluştu',
              error: apiError.message
            });
          }
        } else {
          paymentDetails = detailsResult.recordset;
        }
      }
      
      // API isteği ise JSON döndür
      if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
        return res.status(200).json({
          success: true,
          data: paymentDetails
        });
      }
      
      // Tüm mağazaları getir (dropdown için)
      const storesResult = await sql.query`SELECT id, name FROM Stores`;
      
      // Normal sayfa isteği ise sayfayı render et
      res.render('payments/details', {
        title: 'Ödeme Detayları',
        stores: storesResult.recordset,
        paymentDetails,
        selectedStore: storeId,
        startDate,
        endDate,
        transactionType,
        orderNumber,
        query: req.body
      });
    } catch (error) {
      console.error('Ödeme detayları getirilirken hata:', error);
      
      // API isteği ise JSON hata mesajı döndür
      if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
        return res.status(500).json({
          success: false,
          message: 'Ödeme detayları getirilirken hata oluştu',
          error: error.message
        });
      }
      
      // Normal sayfa isteği ise hata sayfası göster
      res.status(500).render('error', {
        title: 'Hata',
        message: 'Ödeme detayları getirilirken bir hata oluştu',
        error
      });
    }
  }

  /**
   * İşlem türünü API formatına dönüştür
   * @private
   */
  _convertTransactionType(uiType) {
    const typeMap = {
      'Satış': 'Sale',
      'İade': 'Return',
      'İndirim': 'Discount',
      'İndirim İptal': 'DiscountCancel',
      'Kupon': 'Coupon',
      'Kupon İptal': 'CouponCancel',
      'Provizyon +': 'ProvisionPositive',
      'Provizyon -': 'ProvisionNegative',
      'TY İndirim': 'TYDiscount',
      'TY İndirim İptal': 'TYDiscountCancel',
      'TY Kupon': 'TYCoupon',
      'TY Kupon İptal': 'TYCouponCancel',
      'İndirim İptal': 'DiscountCancel',
      'Manuel İade': 'ManualRefund',
      'Manuel İade İptal': 'ManualRefundCancel',
      'Komisyon +': 'CommissionPositive',
      'Komisyon -': 'CommissionNegative',
      'Tedarikçi Finansmanı': 'CashAdvance',
      'Virman': 'WireTransfer',
      'Gelen Havale': 'IncomingTransfer',
      'İade Faturası': 'ReturnInvoice',
      'Komisyon Mutabakat Faturası': 'CommissionAgreementInvoice',
      'Ödeme Emri': 'PaymentOrder',
      'Kesinti Faturası': 'DeductionInvoices',
      'Stopaj': 'Stoppage'
    };
    
    return uiType ? (typeMap[uiType] || uiType) : null;
  }

  /**
   * İşlem türünün Settlements API'sine mi ait olduğunu kontrol et
   * @private
   */
  _isSettlementType(apiType) {
    const settlementTypes = [
      'Sale', 'Return', 'Discount', 'DiscountCancel', 
      'Coupon', 'CouponCancel', 'ProvisionPositive', 'ProvisionNegative',
      'TYDiscount', 'TYDiscountCancel', 'TYCoupon', 'TYCouponCancel',
      'ManualRefund', 'ManualRefundCancel'
    ];
    
    return settlementTypes.includes(apiType);
  }

  /**
   * Ödeme detaylarını veritabanına kaydet
   * @private
   */
  async _savePaymentDetailsToDb(paymentDetails, storeId) {
    try {
      // Toplu ekleme için transaction kullan
      const transaction = new sql.Transaction();
      await transaction.begin();
      
      for (const detail of paymentDetails) {
        // Her bir detayı veritabanına ekle
        await transaction.request()
          .input('id', sql.VarChar, detail.id)
          .input('transactionDate', sql.DateTime, new Date(detail.transactionDate))
          .input('barcode', sql.VarChar, detail.barcode)
          .input('transactionType', sql.VarChar, detail.transactionType)
          .input('receiptId', sql.BigInt, detail.receiptId)
          .input('description', sql.NVarChar, detail.description)
          .input('debt', sql.Decimal(18, 2), detail.debt)
          .input('credit', sql.Decimal(18, 2), detail.credit)
          .input('paymentPeriod', sql.Int, detail.paymentPeriod)
          .input('commissionRate', sql.Decimal(5, 2), detail.commissionRate)
          .input('commissionAmount', sql.Decimal(18, 2), detail.commissionAmount)
          .input('commissionInvoiceSerialNumber', sql.VarChar, detail.commissionInvoiceSerialNumber)
          .input('sellerRevenue', sql.Decimal(18, 2), detail.sellerRevenue)
          .input('orderNumber', sql.VarChar, detail.orderNumber)
          .input('paymentOrderId', sql.BigInt, detail.paymentOrderId)
          .input('paymentDate', sql.DateTime, detail.paymentDate ? new Date(detail.paymentDate) : null)
          .input('storeId', sql.Int, storeId)
          .input('shipmentPackageId', sql.BigInt, detail.shipmentPackageId)
          .query(`
            IF NOT EXISTS (SELECT 1 FROM PaymentDetails WHERE id = @id)
            BEGIN
              INSERT INTO PaymentDetails (
                id, transactionDate, barcode, transactionType, receiptId, 
                description, debt, credit, paymentPeriod, commissionRate, 
                commissionAmount, commissionInvoiceSerialNumber, sellerRevenue, 
                orderNumber, paymentOrderId, paymentDate, storeId, shipmentPackageId
              )
              VALUES (
                @id, @transactionDate, @barcode, @transactionType, @receiptId, 
                @description, @debt, @credit, @paymentPeriod, @commissionRate, 
                @commissionAmount, @commissionInvoiceSerialNumber, @sellerRevenue, 
                @orderNumber, @paymentOrderId, @paymentDate, @storeId, @shipmentPackageId
              )
            END
          `);
      }
      
      await transaction.commit();
    } catch (error) {
      console.error('Ödeme detayları veritabanına kaydedilirken hata:', error);
      throw error;
    }
  }

  /**
   * Ödeme detayı sayfasını göster
   */
  async showDetail(req, res) {
    try {
      const { id } = req.params;
      
      const paymentResult = await sql.query`
        SELECT s.*, st.storeName
        FROM Settlements s
        LEFT JOIN Stores st ON s.sellerId = st.sellerId
        WHERE s.id = ${id}
      `;
      
      if (paymentResult.recordset.length === 0) {
        return res.status(404).render('error', {
          title: 'Hata',
          message: 'Ödeme detayı bulunamadı',
          error: { status: 404 }
        });
      }
      
      const payment = paymentResult.recordset[0];
      
      res.render('payments/detail', {
        title: 'Ödeme Detayı',
        payment
      });
    } catch (error) {
      console.error('Ödeme detayı yüklenirken hata:', error);
      res.status(500).render('error', {
        title: 'Hata',
        message: 'Ödeme detayı yüklenirken bir hata oluştu',
        error
      });
    }
  }
  
  /**
   * Ödeme detayı JSON olarak getir
   */
  async getDetailJson(req, res) {
    try {
      const { id } = req.params;
      
      const paymentResult = await sql.query`
        SELECT s.*, st.storeName
        FROM Settlements s
        LEFT JOIN Stores st ON s.sellerId = st.sellerId
        WHERE s.id = ${id}
      `;
      
      if (paymentResult.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Ödeme detayı bulunamadı'
        });
      }
      
      const payment = paymentResult.recordset[0];
      
      res.json({
        success: true,
        data: payment
      });
    } catch (error) {
      console.error('Ödeme detayı getirilirken hata:', error);
      res.status(500).json({
        success: false,
        message: 'Ödeme detayı getirilirken hata oluştu'
      });
    }
  }
}

module.exports = new PaymentDetailController();