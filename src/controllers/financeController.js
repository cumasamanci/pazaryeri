const Finance = require('../models/financeModel');
const trendyolService = require('../services/trendyolService');
const { validators } = require('../utils/validators');

class FinanceController {
  async getSummary(req, res) {
    try {
      // For demo purposes, use a hardcoded sellerId if not in request
      const sellerId = req.user?.sellerId || process.env.DEFAULT_SELLER_ID || '123456';
      
      let financeData = [];
      
      // Check if API parameters are provided
      const { startDate, endDate, page = 0, size = 500 } = req.query;
      
      if (startDate && endDate) {
        // Convert dates to milliseconds if they're not already
        const startMs = new Date(startDate).getTime();
        const endMs = new Date(endDate).getTime();
        
        // Validate date range
        if (!validators.isDateRangeValid(startMs, endMs)) {
          return res.status(400).json({ 
            message: 'Invalid date range. Maximum period is 15 days.' 
          });
        }
        
        try {
          // Get data from Trendyol API
          const salesData = await trendyolService.getSales(sellerId, startMs, endMs, page, size);
          
          if (salesData && salesData.content) {
            financeData = salesData.content;
          }
        } catch (apiError) {
          console.error('Trendyol API error:', apiError);
          // Fall back to database records if API fails
          financeData = await Finance.find({ sellerId }, { date: -1 }, size);
        }
      } else {
        // If no date range specified, get recent records from database
        financeData = await Finance.find({ sellerId }, { date: -1 }, size);
      }
      
      // For API requests, return JSON
      if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
        return res.status(200).json(financeData);
      }
      
      // For browser requests, render view
      res.render('finance/summary', { 
        title: 'Finance Summary', 
        financeData: financeData || [] 
      });
    } catch (error) {
      console.error('Error in getSummary:', error);
      res.status(500).json({ 
        message: 'Error retrieving finance summary', 
        error: error.message 
      });
    }
  }

  async getOtherFinancials(req, res) {
    try {
      const sellerId = req.user.sellerId;
      const { startDate, endDate, page = 0, size = 50, transactionType } = req.query;
      
      if (!startDate || !endDate || !transactionType) {
        return res.status(400).json({ 
          message: 'Başlangıç tarihi, bitiş tarihi ve işlem türü zorunludur' 
        });
      }
      
      const otherFinancials = await trendyolService.getOtherFinancials({
        sellerId,
        startDate,
        endDate,
        page,
        size,
        transactionType
      });
      
      res.status(200).json(otherFinancials);
    } catch (error) {
      res.status(500).json({ 
        message: 'Diğer finansal veriler alınırken hata oluştu', 
        error: error.message 
      });
    }
  }

  async createFinanceRecord(req, res) {
    try {
      const recordData = {
        ...req.body,
        sellerId: req.user.sellerId
      };
      
      const newRecord = await Finance.create(recordData);
      res.status(201).json(newRecord);
    } catch (error) {
      res.status(500).json({ 
        message: 'Finans kaydı oluşturulurken hata oluştu', 
        error: error.message 
      });
    }
  }

  async updateFinanceRecord(req, res) {
    try {
      const recordId = req.params.id;
      const sellerId = req.user.sellerId;
      
      const record = await Finance.findOne({
        where: {
          transactionId: recordId,
          sellerId
        }
      });
      
      if (!record) {
        return res.status(404).json({ message: 'Finans kaydı bulunamadı' });
      }
      
      const updatedRecord = await record.update(req.body);
      res.status(200).json(updatedRecord);
    } catch (error) {
      res.status(500).json({ 
        message: 'Finans kaydı güncellenirken hata oluştu', 
        error: error.message 
      });
    }
  }

  async deleteFinanceRecord(req, res) {
    try {
      const recordId = req.params.id;
      const sellerId = req.user.sellerId;
      
      const record = await Finance.findOne({
        where: {
          transactionId: recordId,
          sellerId
        }
      });
      
      if (!record) {
        return res.status(404).json({ message: 'Finans kaydı bulunamadı' });
      }
      
      await record.destroy();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ 
        message: 'Finans kaydı silinirken hata oluştu', 
        error: error.message 
      });
    }
  }
}

module.exports = new FinanceController();