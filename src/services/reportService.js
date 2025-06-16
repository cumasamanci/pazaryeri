const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');
const Settlement = require('../models/settlementModel');
const OtherFinancial = require('../models/otherFinancialModel');
const { format } = require('date-fns');

class ReportService {
  // Günlük rapor
  async getDailyReport(sellerId, date) {
    try {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      const settlements = await Settlement.findAll({
        where: {
          sellerId,
          transactionDate: {
            [sequelize.Op.between]: [startDate, endDate]
          }
        },
        order: [['transactionDate', 'ASC']]
      });
      
      const otherFinancials = await OtherFinancial.findAll({
        where: {
          sellerId,
          transactionDate: {
            [sequelize.Op.between]: [startDate, endDate]
          }
        },
        order: [['transactionDate', 'ASC']]
      });
      
      // İşlem türüne göre gruplandırma
      const settlementsByType = this._groupByTransactionType(settlements);
      const otherFinancialsByType = this._groupByTransactionType(otherFinancials);
      
      // Toplam tutarlar hesaplanıyor
      const totalAmounts = this._calculateTotals(settlements, otherFinancials);
      
      return {
        date: format(startDate, 'yyyy-MM-dd'),
        settlementsByType,
        otherFinancialsByType,
        totalAmounts,
        totalTransactions: settlements.length + otherFinancials.length
      };
    } catch (error) {
      console.error('Günlük rapor alınırken hata:', error);
      throw error;
    }
  }
  
  // Aylık rapor
  async getMonthlyReport(sellerId, year, month) {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      
      const query = `
        SELECT 
          CONVERT(date, transactionDate) as date,
          SUM(CASE WHEN credit > 0 THEN credit ELSE 0 END) as totalCredit,
          SUM(CASE WHEN debt > 0 THEN debt ELSE 0 END) as totalDebt,
          COUNT(*) as transactionCount
        FROM Settlements
        WHERE sellerId = :sellerId
          AND transactionDate BETWEEN :startDate AND :endDate
        GROUP BY CONVERT(date, transactionDate)
        ORDER BY date
      `;
      
      const dailyTotals = await sequelize.query(query, {
        replacements: { sellerId, startDate, endDate },
        type: QueryTypes.SELECT
      });
      
      // Aylık toplamlar
      const monthlyTotal = await sequelize.query(`
        SELECT 
          SUM(CASE WHEN credit > 0 THEN credit ELSE 0 END) as totalCredit,
          SUM(CASE WHEN debt > 0 THEN debt ELSE 0 END) as totalDebt,
          COUNT(*) as transactionCount
        FROM Settlements
        WHERE sellerId = :sellerId
          AND transactionDate BETWEEN :startDate AND :endDate
      `, {
        replacements: { sellerId, startDate, endDate },
        type: QueryTypes.SELECT
      });
      
      // İşlem tipine göre dağılım
      const transactionTypeCounts = await sequelize.query(`
        SELECT 
          transactionType,
          COUNT(*) as count,
          SUM(CASE WHEN credit > 0 THEN credit ELSE debt END) as totalAmount
        FROM Settlements
        WHERE sellerId = :sellerId
          AND transactionDate BETWEEN :startDate AND :endDate
        GROUP BY transactionType
      `, {
        replacements: { sellerId, startDate, endDate },
        type: QueryTypes.SELECT
      });
      
      return {
        year,
        month,
        dailyTotals,
        monthlyTotal: monthlyTotal[0] || { totalCredit: 0, totalDebt: 0, transactionCount: 0 },
        transactionTypeCounts
      };
    } catch (error) {
      console.error('Aylık rapor alınırken hata:', error);
      throw error;
    }
  }
  
  // Ödeme dağılımı raporu
  async getPaymentDistributionReport(sellerId, startDate, endDate) {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Ödeme emirlerine göre dağılım
      const paymentOrderDistribution = await sequelize.query(`
        SELECT 
          paymentOrderId,
          COUNT(*) as transactionCount,
          SUM(credit) - SUM(debt) as netAmount,
          MIN(transactionDate) as firstTransactionDate,
          MAX(transactionDate) as lastTransactionDate
        FROM Settlements
        WHERE sellerId = :sellerId
          AND transactionDate BETWEEN :start AND :end
          AND paymentOrderId IS NOT NULL
        GROUP BY paymentOrderId
        ORDER BY paymentOrderId
      `, {
        replacements: { sellerId, start, end },
        type: QueryTypes.SELECT
      });
      
      // İşlem tiplerine göre dağılım
      const transactionTypeDistribution = await sequelize.query(`
        SELECT 
          transactionType,
          COUNT(*) as transactionCount,
          SUM(CASE WHEN credit > 0 THEN credit ELSE 0 END) as totalCredit,
          SUM(CASE WHEN debt > 0 THEN debt ELSE 0 END) as totalDebt
        FROM Settlements
        WHERE sellerId = :sellerId
          AND transactionDate BETWEEN :start AND :end
        GROUP BY transactionType
      `, {
        replacements: { sellerId, start, end },
        type: QueryTypes.SELECT
      });
      
      // Özet bilgiler
      const summary = await sequelize.query(`
        SELECT 
          COUNT(DISTINCT paymentOrderId) as uniquePaymentOrders,
          COUNT(*) as totalTransactions,
          SUM(credit) as totalCredit,
          SUM(debt) as totalDebt,
          SUM(credit) - SUM(debt) as netAmount
        FROM Settlements
        WHERE sellerId = :sellerId
          AND transactionDate BETWEEN :start AND :end
      `, {
        replacements: { sellerId, start, end },
        type: QueryTypes.SELECT
      });
      
      return {
        startDate: format(start, 'yyyy-MM-dd'),
        endDate: format(end, 'yyyy-MM-dd'),
        summary: summary[0],
        paymentOrderDistribution,
        transactionTypeDistribution
      };
    } catch (error) {
      console.error('Ödeme dağılımı raporu alınırken hata:', error);
      throw error;
    }
  }
  
  // Yardımcı fonksiyonlar
  _groupByTransactionType(transactions) {
    const result = {};
    
    transactions.forEach(tx => {
      if (!result[tx.transactionType]) {
        result[tx.transactionType] = {
          count: 0,
          totalCredit: 0,
          totalDebt: 0,
          items: []
        };
      }
      
      result[tx.transactionType].count++;
      result[tx.transactionType].totalCredit += parseFloat(tx.credit || 0);
      result[tx.transactionType].totalDebt += parseFloat(tx.debt || 0);
      result[tx.transactionType].items.push(tx);
    });
    
    return result;
  }
  
  _calculateTotals(settlements, otherFinancials) {
    let totalCredit = 0;
    let totalDebt = 0;
    
    settlements.forEach(tx => {
      totalCredit += parseFloat(tx.credit || 0);
      totalDebt += parseFloat(tx.debt || 0);
    });
    
    otherFinancials.forEach(tx => {
      totalCredit += parseFloat(tx.credit || 0);
      totalDebt += parseFloat(tx.debt || 0);
    });
    
    return {
      totalCredit,
      totalDebt,
      netAmount: totalCredit - totalDebt
    };
  }
}

module.exports = new ReportService();