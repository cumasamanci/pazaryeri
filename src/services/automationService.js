const { v4: uuidv4 } = require('uuid');
const AutomationJob = require('../models/automationJobModel');
const trendyolService = require('./trendyolService');

class AutomationService {
  constructor() {
    this.MAX_DATE_RANGE = 15 * 24 * 60 * 60 * 1000; // 15 gün (ms cinsinden)
  }
  
  // 15 günden uzun aralıkları parçalara böler
  splitDateRange(startDate, endDate) {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const ranges = [];
    
    if (end - start <= this.MAX_DATE_RANGE) {
      ranges.push({ startDate: start, endDate: end });
      return ranges;
    }
    
    let currentStart = start;
    while (currentStart < end) {
      const currentEnd = currentStart + this.MAX_DATE_RANGE;
      const rangeEnd = currentEnd > end ? end : currentEnd;
      
      ranges.push({ startDate: currentStart, endDate: rangeEnd });
      currentStart = rangeEnd + 1;
    }
    
    return ranges;
  }
  
  // Yeni otomasyon görevi oluştur
  async createAutomationJob(sellerId, jobType, startDate, endDate) {
    try {
      const job = await AutomationJob.create({
        jobType,
        sellerId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: 'Pending'
      });
      
      // İş arka planda işlenmek üzere kuyruğa alındı
      this.processJob(job.id);
      
      return job;
    } catch (error) {
      console.error('Otomasyon görevi oluşturulurken hata:', error);
      throw error;
    }
  }
  
  // Otomasyon görevini işle
  async processJob(jobId) {
    try {
      const job = await AutomationJob.findByPk(jobId);
      
      if (!job) {
        throw new Error(`ID: ${jobId} olan iş bulunamadı`);
      }
      
      // İşin durumunu güncelleme
      job.status = 'Processing';
      await job.save();
      
      const startMs = new Date(job.startDate).getTime();
      const endMs = new Date(job.endDate).getTime();
      const dateRanges = this.splitDateRange(startMs, endMs);
      
      // Ortak batch ID
      const batchId = uuidv4();
      let totalRecords = 0;
      
      for (const range of dateRanges) {
        // API tipi ve işlem tipine göre veri çekme
        const apiType = job.jobType.split('_')[0]; // örn. "Settlements_Sale" -> "Settlements"
        const transactionType = job.jobType.split('_')[1]; // örn. "Settlements_Sale" -> "Sale"
        
        try {
          if (apiType === 'Settlements') {
            const data = await trendyolService.getSettlements(job.sellerId, {
              startDate: range.startDate,
              endDate: range.endDate,
              transactionType
            });
            
            const recordCount = await trendyolService.saveSettlements(data, job.sellerId, batchId);
            totalRecords += recordCount;
            
            // Çekme işlemini logla
            await trendyolService.logFetch({
              batchId,
              sellerId: job.sellerId,
              transactionType,
              startDate: new Date(range.startDate),
              endDate: new Date(range.endDate),
              recordCount,
              status: 'Success'
            });
          } else if (apiType === 'OtherFinancials') {
            const data = await trendyolService.getOtherFinancials(job.sellerId, {
              startDate: range.startDate,
              endDate: range.endDate,
              transactionType
            });
            
            const recordCount = await trendyolService.saveOtherFinancials(data, job.sellerId, batchId);
            totalRecords += recordCount;
            
            // Çekme işlemini logla
            await trendyolService.logFetch({
              batchId,
              sellerId: job.sellerId,
              transactionType,
              startDate: new Date(range.startDate),
              endDate: new Date(range.endDate),
              recordCount,
              status: 'Success'
            });
          }
        } catch (error) {
          console.error(`Tarih aralığı işlenirken hata: ${range.startDate} - ${range.endDate}`, error);
          
          // Çekme hatasını logla
          await trendyolService.logFetch({
            batchId,
            sellerId: job.sellerId,
            transactionType: transactionType || 'Unknown',
            startDate: new Date(range.startDate),
            endDate: new Date(range.endDate),
            recordCount: 0,
            status: 'Error',
            errorMessage: error.message
          });
        }
      }
      
      // İşi tamamla
      job.status = 'Completed';
      job.completedDate = new Date();
      job.totalRecords = totalRecords;
      await job.save();
      
      return { success: true, totalRecords };
    } catch (error) {
      console.error('Otomasyon işi işlenirken hata:', error);
      
      try {
        // İşi hata durumuna güncelle
        const job = await AutomationJob.findByPk(jobId);
        if (job) {
          job.status = 'Failed';
          await job.save();
        }
      } catch (updateError) {
        console.error('İş durumu güncellenirken hata:', updateError);
      }
      
      throw error;
    }
  }
  
  // İş durumunu kontrol et
  async getJobStatus(jobId) {
    try {
      const job = await AutomationJob.findByPk(jobId);
      
      if (!job) {
        throw new Error(`ID: ${jobId} olan iş bulunamadı`);
      }
      
      return {
        id: job.id,
        status: job.status,
        progress: job.status === 'Completed' ? 100 : job.status === 'Failed' ? 0 : 50,
        startDate: job.startDate,
        endDate: job.endDate,
        totalRecords: job.totalRecords,
        completedDate: job.completedDate
      };
    } catch (error) {
      console.error('İş durumu kontrol edilirken hata:', error);
      throw error;
    }
  }
}

module.exports = new AutomationService();