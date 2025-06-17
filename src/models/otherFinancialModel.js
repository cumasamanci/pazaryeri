const { db } = require('../config/database');

// Other Financial Transactions Model  
const OtherFinancialModel = {
  // Tablo adı
  tableName: 'other_financials',

  // Tüm other financial işlemlerini getir (filtreyle)
  getAll: async (filters = {}) => {
    try {
      const { data, error } = await db.from(OtherFinancialModel.tableName)
        .select('*')
        .order('transaction_date', { ascending: false })
        .limit(filters.limit || 50);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Other Financial işlemleri alınırken hata:', error);
      throw error;
    }
  },

  // Other Financial sayısını getir
  getCount: async (filters = {}) => {
    try {
      const { count, error } = await db.from(OtherFinancialModel.tableName)
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Other Financial sayısı alınırken hata:', error);
      throw error;
    }
  },

  // ID ile other financial getir
  getById: async (id) => {
    try {
      const { data, error } = await db.from(OtherFinancialModel.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Other Financial ID: ${id} alınırken hata:`, error);
      throw error;
    }
  },

  // Yeni other financial ekle
  create: async (financialData) => {
    try {
      const { data, error } = await db.from(OtherFinancialModel.tableName)
        .insert({
          ...financialData,
          created_at: new Date(),
          updated_at: new Date()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Other Financial oluşturulurken hata:', error);
      throw error;
    }
  },

  // Toplu other financial ekle
  createBatch: async (financialDataArray) => {
    try {
      if (!Array.isArray(financialDataArray) || financialDataArray.length === 0) {
        return [];
      }

      const dataWithTimestamps = financialDataArray.map(item => ({
        ...item,
        created_at: new Date(),
        updated_at: new Date()
      }));

      const { data, error } = await db.from(OtherFinancialModel.tableName)
        .insert(dataWithTimestamps)
        .select();

      if (error) throw error;
      
      console.log(`${data.length} other financial kaydı başarıyla eklendi`);
      return data;
    } catch (error) {
      console.error('Other Financial batch oluşturulurken hata:', error);
      throw error;
    }
  },

  // Other Financial güncelle
  update: async (id, updateData) => {
    try {
      const { data, error } = await db.from(OtherFinancialModel.tableName)
        .update({
          ...updateData,
          updated_at: new Date()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Other Financial güncellenirken hata:', error);
      throw error;
    }
  },

  // Other Financial sil
  delete: async (id) => {
    try {
      const { error } = await db.from(OtherFinancialModel.tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Other Financial silinirken hata:', error);
      throw error;
    }
  },

  // Filtrelenmiş other financials getir
  getFiltered: async (filters = {}) => {
    try {
      let query = db.from(OtherFinancialModel.tableName).select('*');

      // Store ID filtresi
      if (filters.store_id) {
        query = query.eq('store_id', filters.store_id);
      }

      // Transaction type filtresi
      if (filters.transaction_type) {
        query = query.eq('transaction_type', filters.transaction_type);
      }

      // Tarih aralığı filtresi
      if (filters.start_date) {
        query = query.gte('transaction_date', filters.start_date);
      }
      if (filters.end_date) {
        query = query.lte('transaction_date', filters.end_date);
      }

      // Pagination
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      } else if (filters.limit) {
        query = query.limit(filters.limit);
      }

      // Sıralama
      query = query.order('transaction_date', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Filtrelenmiş other financials alınırken hata:', error);
      throw error;
    }
  },

  // İstatistikler getir
  getStats: async (filters = {}) => {
    try {
      let query = db.from(OtherFinancialModel.tableName).select('credit, debt');

      // Filtreleri uygula
      if (filters.store_id) {
        query = query.eq('store_id', filters.store_id);
      }
      if (filters.start_date) {
        query = query.gte('transaction_date', filters.start_date);
      }
      if (filters.end_date) {
        query = query.lte('transaction_date', filters.end_date);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Manuel hesaplama
      const stats = data.reduce((acc, item) => {
        acc.totalCredit += parseFloat(item.credit || 0);
        acc.totalDebt += parseFloat(item.debt || 0);
        acc.count += 1;
        return acc;
      }, {
        totalCredit: 0,
        totalDebt: 0,
        count: 0
      });

      return stats;
    } catch (error) {
      console.error('Other Financial istatistikleri alınırken hata:', error);
      throw error;
    }
  }
};

module.exports = OtherFinancialModel;
