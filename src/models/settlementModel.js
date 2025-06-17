const { db } = require('../config/database');

// Settlement Transactions Model
const SettlementModel = {
  // Tablo adı
  tableName: 'settlement_transactions',

  // Tüm settlement işlemlerini getir (filtreyle)
  getAll: async (filters = {}) => {
    try {
      const { data, error } = await db.from(SettlementModel.tableName)
        .select('*')
        .order('transaction_date', { ascending: false })
        .limit(filters.limit || 50);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Settlement işlemleri alınırken hata:', error);
      throw error;
    }
  },

  // Settlement sayısını getir
  getCount: async (filters = {}) => {
    try {
      const { count, error } = await db.from(SettlementModel.tableName)
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Settlement sayısı alınırken hata:', error);
      throw error;
    }
  },

  // ID ile settlement getir
  getById: async (id) => {
    try {
      const { data, error } = await db.from(SettlementModel.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Settlement ID: ${id} alınırken hata:`, error);
      throw error;
    }
  },

  // Yeni settlement ekle
  create: async (settlementData) => {
    try {
      const { data, error } = await db.from(SettlementModel.tableName)
        .insert({
          ...settlementData,
          created_at: new Date(),
          updated_at: new Date()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Settlement oluşturulurken hata:', error);
      throw error;
    }
  },

  // Toplu settlement ekle
  createBatch: async (settlementDataArray) => {
    try {
      if (!Array.isArray(settlementDataArray) || settlementDataArray.length === 0) {
        return [];
      }

      const dataWithTimestamps = settlementDataArray.map(item => ({
        ...item,
        created_at: new Date(),
        updated_at: new Date()
      }));

      const { data, error } = await db.from(SettlementModel.tableName)
        .insert(dataWithTimestamps)
        .select();

      if (error) throw error;
      
      console.log(`${data.length} settlement kaydı başarıyla eklendi`);
      return data;
    } catch (error) {
      console.error('Settlement batch oluşturulurken hata:', error);
      throw error;
    }
  },

  // Settlement güncelle
  update: async (id, updateData) => {
    try {
      const { data, error } = await db.from(SettlementModel.tableName)
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
      console.error('Settlement güncellenirken hata:', error);
      throw error;
    }
  },

  // Settlement sil
  delete: async (id) => {
    try {
      const { error } = await db.from(SettlementModel.tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Settlement silinirken hata:', error);
      throw error;
    }
  },

  // Filtrelenmiş settlements getir
  getFiltered: async (filters = {}) => {
    try {
      let query = db.from(SettlementModel.tableName).select('*');

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
      console.error('Filtrelenmiş settlements alınırken hata:', error);
      throw error;
    }
  },

  // İstatistikler getir
  getStats: async (filters = {}) => {
    try {
      let query = db.from(SettlementModel.tableName).select('credit, debt, seller_revenue, commission_amount');

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
        acc.totalRevenue += parseFloat(item.seller_revenue || 0);
        acc.totalCommission += parseFloat(item.commission_amount || 0);
        acc.count += 1;
        return acc;
      }, {
        totalCredit: 0,
        totalDebt: 0,
        totalRevenue: 0,
        totalCommission: 0,
        count: 0
      });

      return stats;
    } catch (error) {
      console.error('Settlement istatistikleri alınırken hata:', error);
      throw error;
    }
  }
};

module.exports = SettlementModel;
