// Dosya yolu: c:\Users\PC\Desktop\trendyol-finance-integration\src\services\integrationService.js
const trendyolService = require('./trendyolService');
const Finance = require('../models/financeModel');
const { Op } = require('sequelize');

class IntegrationService {
  /**
   * Belirli bir tarih aralığındaki tüm finansal verileri senkronize et
   */
  async syncFinancialData(params) {
    const { sellerId, startDate, endDate } = params;
    const transactionTypes = [
      'Sale', 'Return', 'Discount', 'DiscountCancel', 
      'Coupon', 'CouponCancel', 'ProvisionPositive', 'ProvisionNegative'
    ];
    
    const results = {
      success: [],
      errors: []
    };
    
    // Her işlem türü için veri çek
    for (const transactionType of transactionTypes) {
      try {
        let page = 0;
        let hasMoreData = true;
        
        while (hasMoreData) {
          const response = await trendyolService.getSettlements({
            sellerId,
            startDate,
            endDate,
            transactionType,
            page,
            size: 500
          });
          
          if (response.content && response.content.length > 0) {
            // Verileri veritabanına kaydet
            await Promise.all(response.content.map(async (item) => {
              await Finance.findOrCreate({
                where: { transactionId: item.id },
                defaults: {
                  transactionId: item.id,
                  transactionDate: new Date(item.transactionDate),
                  barcode: item.barcode,
                  transactionType: item.transactionType,
                  receiptId: item.receiptId,
                  description: item.description,
                  debt: item.debt,
                  credit: item.credit,
                  paymentPeriod: item.paymentPeriod,
                  commissionRate: item.commissionRate,
                  commissionAmount: item.commissionAmount,
                  sellerRevenue: item.sellerRevenue,
                  orderNumber: item.orderNumber,
                  paymentOrderId: item.paymentOrderId,
                  paymentDate: item.paymentDate ? new Date(item.paymentDate) : null,
                  sellerId: item.sellerId,
                  shipmentPackageId: item.shipmentPackageId,
                  affiliate: item.affiliate
                }
              });
            }));
            
            results.success.push(`${transactionType}: ${response.content.length} kayıt alındı (Sayfa: ${page})`);
            
            // Daha fazla sayfa var mı kontrol et
            page++;
            hasMoreData = page < response.totalPages;
          } else {
            hasMoreData = false;
          }
        }
      } catch (error) {
        results.errors.push(`${transactionType}: Hata - ${error.message}`);
        console.error(`${transactionType} verileri senkronize edilirken hata:`, error);
      }
    }
    
    return results;
  }

  /**
   * Diğer finansal verileri senkronize et
   */
  async syncOtherFinancials(params) {
    const { sellerId, startDate, endDate } = params;
    const transactionTypes = [
      'Stoppage', 'CashAdvance', 'WireTransfer', 'IncomingTransfer', 
      'ReturnInvoice', 'CommissionAgreementInvoice', 'PaymentOrder', 'DeductionInvoices'
    ];
    
    const results = {
      success: [],
      errors: []
    };
    
    // Her işlem türü için veri çek
    for (const transactionType of transactionTypes) {
      try {
        const response = await trendyolService.getOtherFinancials({
          sellerId,
          startDate,
          endDate,
          transactionType
        });
        
        if (response.content && response.content.length > 0) {
          results.success.push(`${transactionType}: ${response.content.length} kayıt alındı`);
        } else {
          results.success.push(`${transactionType}: Kayıt bulunamadı`);
        }
      } catch (error) {
        results.errors.push(`${transactionType}: Hata - ${error.message}`);
        console.error(`${transactionType} verileri senkronize edilirken hata:`, error);
      }
    }
    
    return results;
  }
}

module.exports = new IntegrationService();