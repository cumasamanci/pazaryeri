const { sql } = require('../config/database');
const trendyolService = require('../services/trendyolService');
const StoreModel = require('../models/storeModel');
const AutomationJobModel = require('../models/automationJobModel');

class AutomationController {
    async getAutomationPage(req, res) {
        try {
            // Mağazaları getir
            const stores = await StoreModel.findAll();
            
            // Son çalışan işleri getir
            const jobs = await AutomationJobModel.findLast(10);
            
            res.render('automation/index', {
                title: 'Otomasyon',
                stores: stores,
                jobs: jobs,
                apiTypes: [
                    { id: 'settlements', name: 'Settlements (Satış, İade, İndirim vb.)' },
                    { id: 'otherFinancials', name: 'Other Financials (Virman, Ödemeler, Faturalar vb.)' }
                ],
                transactionTypes: {
                    settlements: [
                        { id: 'Sale', name: 'Satış' },
                        { id: 'Return', name: 'İade' },
                        { id: 'Discount', name: 'İndirim' },
                        { id: 'DiscountCancel', name: 'İndirim İptal' },
                        { id: 'Coupon', name: 'Kupon' },
                        { id: 'CouponCancel', name: 'Kupon İptal' },
                        { id: 'ProvisionPositive', name: 'Provizyon +' },
                        { id: 'ProvisionNegative', name: 'Provizyon -' }
                    ],
                    otherFinancials: [
                        { id: 'PaymentOrder', name: 'Ödeme Emri' },
                        { id: 'SupplierFinance', name: 'Tedarikçi Finansmanı' },
                        { id: 'CommissionAgreementInvoice', name: 'Komisyon Mutabakat Faturası' },
                        { id: 'WireTransfer', name: 'Virman' }
                    ]
                }
            });
        } catch (error) {
            console.error('Otomasyon sayfası yüklenirken hata:', error);
            res.status(500).render('error', { 
                title: 'Hata', 
                error: error,
                message: 'Otomasyon sayfası yüklenirken bir hata oluştu'
            });
        }
    }

    async createAutomationJob(req, res) {
        try {
            const { storeId, startDate, endDate, apiType, transactionType } = req.body;
            
            // Store bilgilerini getir
            const store = await StoreModel.findById(storeId);
            if (!store) {
                return res.status(404).json({ success: false, message: 'Mağaza bulunamadı' });
            }
            
            const startDateTime = new Date(startDate);
            const endDateTime = new Date(endDate);
            
            // 15 günlük periyotlara böl
            const periods = this._splitDateIntoPeriods(startDateTime, endDateTime);
            
            // İş kaydı oluştur
            const jobId = await AutomationJobModel.create({
                storeId: storeId,
                apiType: apiType,
                transactionType: transactionType,
                startDate: startDateTime,
                endDate: endDateTime,
                status: 'created',
                totalPeriods: periods.length,
                completedPeriods: 0
            });
            
            // Arka planda işleme al
            this._processAutomationJob(jobId, store, apiType, transactionType, periods);
            
            res.json({
                success: true, 
                message: `Otomasyon işi başlatıldı. Toplam ${periods.length} periyot işlenecek.`,
                jobId: jobId
            });
        } catch (error) {
            console.error('Otomasyon işi oluşturulurken hata:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Otomasyon işi oluşturulurken hata: ' + error.message 
            });
        }
    }

    async getAutomationJob(req, res) {
        try {
            const { jobId } = req.params;
            
            const job = await AutomationJobModel.findById(jobId);
            if (!job) {
                return res.status(404).json({ success: false, message: 'İş bulunamadı' });
            }
            
            // İş detaylarını getir
            const logs = await AutomationJobModel.getJobLogs(jobId);
            
            res.json({
                success: true,
                job: job,
                logs: logs
            });
        } catch (error) {
            console.error('Otomasyon işi bilgileri alınırken hata:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Otomasyon işi bilgileri alınırken hata: ' + error.message 
            });
        }
    }

    // 15 günlük periyotlara böl
    _splitDateIntoPeriods(startDate, endDate) {
        const periods = [];
        const currentDate = new Date(startDate);
        
        while (currentDate < endDate) {
            const periodEndDate = new Date(currentDate);
            periodEndDate.setDate(periodEndDate.getDate() + 14); // 15 gün (0-14)
            
            const actualEndDate = new Date(Math.min(periodEndDate.getTime(), endDate.getTime()));
            
            periods.push({
                startDate: new Date(currentDate),
                endDate: actualEndDate
            });
            
            currentDate.setDate(currentDate.getDate() + 15);
        }
        
        return periods;
    }

    // Arka planda işleme al
    async _processAutomationJob(jobId, store, apiType, transactionType, periods) {
        try {
            // İş durumunu güncelle
            await AutomationJobModel.updateStatus(jobId, 'processing');
            
            let completedCount = 0;
            let totalRecords = 0;
            
            // Her bir periyot için veri çek
            for (const period of periods) {
                try {
                    const startMs = period.startDate.getTime();
                    const endMs = period.endDate.getTime();
                    
                    // Log kaydı ekle
                    const logId = await AutomationJobModel.addJobLog(
                        jobId, 
                        `${period.startDate.toLocaleDateString()} - ${period.endDate.toLocaleDateString()} tarih aralığı için veri çekiliyor...`,
                        'processing'
                    );
                    
                    let result;
                    if (apiType === 'settlements') {
                        result = await trendyolService.getSettlements({
                            sellerId: store.sellerId,
                            startDate: startMs,
                            endDate: endMs,
                            transactionType: transactionType,
                            page: 0,
                            size: 1000 // Maksimum veri al
                        });
                    } else {
                        result = await trendyolService.getOtherFinancials({
                            sellerId: store.sellerId,
                            startDate: startMs,
                            endDate: endMs,
                            transactionType: transactionType,
                            page: 0,
                            size: 1000 // Maksimum veri al
                        });
                    }
                    
                    // Veritabanına kaydet
                    const savedCount = await this._savePaymentsToDatabase(store.id, result.content, apiType);
                    
                    // Log güncelle
                    await AutomationJobModel.updateJobLog(
                        logId, 
                        `${period.startDate.toLocaleDateString()} - ${period.endDate.toLocaleDateString()} tarih aralığı için ${savedCount} kayıt alındı.`,
                        'completed'
                    );
                    
                    // Sayacı güncelle
                    completedCount++;
                    totalRecords += savedCount;
                    
                    // İş durumunu güncelle
                    await AutomationJobModel.update(jobId, {
                        completedPeriods: completedCount,
                        progress: Math.round((completedCount / periods.length) * 100),
                        recordCount: totalRecords
                    });
                    
                } catch (periodError) {
                    // Hata durumunda log ekle ve devam et
                    await AutomationJobModel.addJobLog(
                        jobId, 
                        `${period.startDate.toLocaleDateString()} - ${period.endDate.toLocaleDateString()} tarih aralığı için hata: ${periodError.message}`,
                        'error'
                    );
                    console.error('Periyot işlenirken hata:', periodError);
                }
            }
            
            // İş tamamlandı
            await AutomationJobModel.updateStatus(jobId, 'completed');
            await AutomationJobModel.addJobLog(
                jobId, 
                `İş tamamlandı. Toplam ${totalRecords} kayıt alındı.`,
                'info'
            );
            
        } catch (error) {
            // İş başarısız
            await AutomationJobModel.updateStatus(jobId, 'failed');
            await AutomationJobModel.addJobLog(
                jobId, 
                `İş başarısız oldu: ${error.message}`,
                'error'
            );
            console.error('Otomasyon işi işlenirken hata:', error);
        }
    }

    // Veritabanına ödemeleri kaydet
    async _savePaymentsToDatabase(storeId, payments, apiType) {
        const pool = await sql.connect();
        let savedCount = 0;
        
        for (const item of payments) {
            try {
                const request = pool.request();
                request.input('transactionId', sql.VarChar, item.transactionId);
                request.input('storeId', sql.Int, storeId);
                request.input('transactionDate', sql.DateTime, new Date(item.transactionDate));
                request.input('orderNumber', sql.VarChar, item.orderNumber || '');
                request.input('transactionType', sql.VarChar, item.transactionType);
                request.input('amount', sql.Decimal(10, 2), item.amount);
                request.input('apiType', sql.VarChar, apiType);
                
                // Önceden kaydedilmiş mi kontrol et
                const checkResult = await request.query(
                    `SELECT id FROM Payments WHERE transactionId = @transactionId AND storeId = @storeId`
                );
                
                if (checkResult.recordset.length === 0) {
                    // Yeni kayıt ekle
                    await request.query(`
                        INSERT INTO Payments (transactionId, storeId, transactionDate, orderNumber, transactionType, amount, apiType)
                        VALUES (@transactionId, @storeId, @transactionDate, @orderNumber, @transactionType, @amount, @apiType)
                    `);
                    savedCount++;
                }
            } catch (itemError) {
                console.error('Ödeme kaydı eklenirken hata:', itemError);
            }
        }
        
        return savedCount;
    }
}

module.exports = new AutomationController();