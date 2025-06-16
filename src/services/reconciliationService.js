const { v4: uuidv4 } = require('uuid');
const Reconciliation = require('../models/reconciliationModel');
const Settlement = require('../models/settlementModel');
const { sequelize } = require('../config/database');
const XLSX = require('xlsx');

class ReconciliationService {
  // Excel dosyasından sipariş numaralarını oku
  async processExcelFile(filePath) {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      if (data.length === 0) {
        throw new Error('Excel dosyası boş veya uyumsuz format');
      }
      
      // Sipariş numarası sütun adını tespit et
      const firstRow = data[0];
      const possibleColumnNames = ['Sipariş No', 'OrderNumber', 'Sipariş Numarası', 'Order No', 'orderNumber'];
      let orderNumberColumn = null;
      
      for (const colName of possibleColumnNames) {
        if (colName in firstRow) {
          orderNumberColumn = colName;
          break;
        }
      }
      
      if (!orderNumberColumn) {
        throw new Error('Sipariş numarası sütunu bulunamadı');
      }
      
      // Sipariş numaralarını çıkar
      const uploadId = uuidv4();
      const orderNumbers = data.map(row => row[orderNumberColumn].toString());
      
      // Yeni mutabakat kayıtları oluştur
      const reconciliations = orderNumbers.map(orderNumber => ({
        uploadId,
        orderNumber,
        isMatched: false
      }));
      
      await Reconciliation.bulkCreate(reconciliations);
      
      return {
        uploadId,
        totalOrders: orderNumbers.length
      };
    } catch (error) {
      console.error('Excel dosyası işlenirken hata:', error);
      throw error;
    }
  }
  
  // Sipariş numaralarını veritabanındaki işlemlerle eşleştir
  async matchOrders(uploadId) {
    try {
      const transaction = await sequelize.transaction();
      
      try {
        // Eşleştirilmemiş mutabakat kayıtlarını al
        const unmatched = await Reconciliation.findAll({
          where: {
            uploadId,
            isMatched: false
          },
          transaction
        });
        
        if (unmatched.length === 0) {
          await transaction.commit();
          return {
            success: true,
            matched: 0,
            unmatched: 0,
            total: 0
          };
        }
        
        const orderNumbers = unmatched.map(r => r.orderNumber);
        
        // Veritabanında eşleşen işlemleri bul
        const matchedTransactions = await Settlement.findAll({
          attributes: ['orderNumber', 'transactionId'],
          where: {
            orderNumber: orderNumbers
          },
          transaction
        });
        
        // Eşleştirme haritası oluştur
        const matchMap = {};
        matchedTransactions.forEach(tx => {
          matchMap[tx.orderNumber] = tx.transactionId;
        });
        
        // Mutabakat kayıtlarını güncelle
        let matchedCount = 0;
        
        for (const rec of unmatched) {
          if (rec.orderNumber in matchMap) {
            rec.isMatched = true;
            rec.matchedTransactionId = matchMap[rec.orderNumber];
            await rec.save({ transaction });
            matchedCount++;
          }
        }
        
        await transaction.commit();
        
        return {
          success: true,
          matched: matchedCount,
          unmatched: unmatched.length - matchedCount,
          total: unmatched.length
        };
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Siparişler eşleştirilirken hata:', error);
      throw error;
    }
  }
  
  // Mutabakat sonuçlarını getir
  async getReconciliationResults(uploadId) {
    try {
      // Toplam kayıt sayısı
      const totalCount = await Reconciliation.count({
        where: { uploadId }
      });
      
      // Eşleşen kayıt sayısı
      const matchedCount = await Reconciliation.count({
        where: { uploadId, isMatched: true }
      });
      
      // Eşleşmeyen kayıtlar
      const unmatchedRecords = await Reconciliation.findAll({
        where: { uploadId, isMatched: false },
        attributes: ['orderNumber']
      });
      
      // Eşleşen kayıtlar ve işlem detayları
      const matchedRecords = await Reconciliation.findAll({
        where: { uploadId, isMatched: true },
        attributes: ['orderNumber', 'matchedTransactionId']
      });
      
      // İşlem detaylarını al
      const transactionIds = matchedRecords.map(r => r.matchedTransactionId);
      const transactions = await Settlement.findAll({
        where: { transactionId: transactionIds },
        attributes: [
          'transactionId', 
          'orderNumber', 
          'transactionDate', 
          'transactionType', 
          'credit', 
          'debt'
        ]
      });
      
      // İşlem detaylarını eşleştirilmiş kayıtlara ekle
      const txMap = {};
      transactions.forEach(tx => {
        txMap[tx.transactionId] = tx;
      });
      
      const matchedWithDetails = matchedRecords.map(record => {
        const tx = txMap[record.matchedTransactionId] || {};
        return {
          orderNumber: record.orderNumber,
          transactionId: record.matchedTransactionId,
          transactionDate: tx.transactionDate,
          transactionType: tx.transactionType,
          amount: tx.credit > 0 ? tx.credit : tx.debt
        };
      });
      
      return {
        totalCount,
        matchedCount,
        unmatchedCount: totalCount - matchedCount,
        matchRate: totalCount > 0 ? (matchedCount / totalCount) * 100 : 0,
        unmatchedRecords: unmatchedRecords.map(r => r.orderNumber),
        matchedRecords: matchedWithDetails
      };
    } catch (error) {
      console.error('Mutabakat sonuçları alınırken hata:', error);
      throw error;
    }
  }
}

module.exports = new ReconciliationService();