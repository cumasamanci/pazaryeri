const { db } = require('../config/database');

/**
 * Settlement Transactions Model - Supabase uyumlu
 * Pazaryeri settlement/finansal işlemlerini yönetir
 */
const SettlementModel = {
  // Tablo adı
  tableName: 'settlement_transactions',

  /**
   * Tüm settlement işlemlerini getir (filtreyle)
   */
  getAll: async (filters = {}) => {
    try {
      let query = db.getClient().from(SettlementModel.tableName).select('*');

      // Store ID filtresi
      if (filters.store_id) {
        query = query.eq('store_id', filters.store_id);
      }

      // Transaction type filtresi
      if (filters.transaction_type) {
        query = query.eq('transaction_type', filters.transaction_type);
      }

      // Tarih aralığı filtreleri
      if (filters.start_date) {
        query = query.gte('transaction_date', filters.start_date);
      }
      if (filters.end_date) {
        query = query.lte('transaction_date', filters.end_date);
      }

      // Sıralama
      query = query.order('transaction_date', { ascending: false });

      // Pagination
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Settlement getAll hatası:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Settlement işlemleri alınırken hata:', error);
      throw error;
    }
  },

  /**
   * Settlement sayısını getir
   */
  getCount: async (filters = {}) => {
    try {
      let query = db.getClient()
        .from(SettlementModel.tableName)
        .select('*', { count: 'exact', head: true });

      // Filtreleri uygula
      if (filters.store_id) {
        query = query.eq('store_id', filters.store_id);
      }
      if (filters.transaction_type) {
        query = query.eq('transaction_type', filters.transaction_type);
      }
      if (filters.start_date) {
        query = query.gte('transaction_date', filters.start_date);
      }
      if (filters.end_date) {
        query = query.lte('transaction_date', filters.end_date);
      }

      const { count, error } = await query;
      
      if (error) {
        console.error('Settlement getCount hatası:', error);
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('Settlement sayısı alınırken hata:', error);
      throw error;
    }
  },

  /**
   * ID ile settlement getir
   */
  getById: async (id) => {
    try {
      const { data, error } = await db.getClient()
        .from(SettlementModel.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error(`Settlement getById hatası (ID: ${id}):`, error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error(`Settlement ID: ${id} alınırken hata:`, error);
      throw error;
    }
  },

  /**
   * Yeni settlement ekle
   */
  create: async (settlementData) => {
    try {
      const dataWithTimestamps = {
        ...settlementData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await db.getClient()
        .from(SettlementModel.tableName)
        .insert(dataWithTimestamps)
        .select()
        .single();

      if (error) {
        console.error('Settlement create hatası:', error);
        throw error;
      }

      console.log('Settlement kaydı oluşturuldu:', data.id);
      return data;
    } catch (error) {
      console.error('Settlement oluşturulurken hata:', error);
      throw error;
    }
  },

  /**
   * Toplu settlement ekle (duplicate kontrolü ile)
   */
  createBatch: async (settlementDataArray) => {
    try {
      console.log(`=== SETTLEMENT BATCH CREATE ===`);
      console.log(`${settlementDataArray.length} settlement kaydı ekleniyor...`);

      if (!Array.isArray(settlementDataArray) || settlementDataArray.length === 0) {
        console.log('Eklenecek settlement verisi yok');
        return [];
      }

      // Duplicate kontrolü için mevcut transaction_id'leri al
      const transactionIds = settlementDataArray
        .map(item => item.transaction_id)
        .filter(Boolean);
      
      let filteredData = settlementDataArray;

      if (transactionIds.length > 0) {
        console.log(`${transactionIds.length} transaction ID kontrolü yapılıyor...`);
        
        const { data: existingRecords, error: selectError } = await db.getClient()
          .from(SettlementModel.tableName)
          .select('transaction_id')
          .in('transaction_id', transactionIds);
        
        if (selectError) {
          console.error('Mevcut kayıt kontrolü hatası:', selectError);
          // Hata durumunda duplicate kontrolü olmadan devam et
        } else {
          const existingIds = new Set(existingRecords?.map(r => r.transaction_id) || []);
          
          // Sadece yeni kayıtları filtrele
          filteredData = settlementDataArray.filter(item => 
            !existingIds.has(item.transaction_id)
          );
          
          console.log(`${settlementDataArray.length} kayıttan ${existingIds.size} tanesi zaten mevcut`);
          console.log(`${filteredData.length} yeni kayıt eklenecek`);
        }
      }

      if (filteredData.length === 0) {
        console.log('Eklenecek yeni settlement kaydı yok');
        return [];
      }

      // Timestamp'leri ekle
      const dataWithTimestamps = filteredData.map(item => ({
        ...item,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      console.log('Supabase\'e insert işlemi başlıyor...');
      
      const { data, error } = await db.getClient()
        .from(SettlementModel.tableName)
        .insert(dataWithTimestamps)
        .select();

      if (error) {
        console.error('Settlement batch insert hatası:', error);
        throw error;
      }
      
      console.log(`✅ ${data.length} settlement kaydı başarıyla eklendi`);
      return data;
    } catch (error) {
      console.error('Settlement batch oluşturulurken hata:', error);
      throw error;
    }
  },

  /**
   * Settlement güncelle
   */
  update: async (id, updateData) => {
    try {
      const dataWithTimestamp = {
        ...updateData,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await db.getClient()
        .from(SettlementModel.tableName)
        .update(dataWithTimestamp)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Settlement update hatası:', error);
        throw error;
      }

      console.log('Settlement kaydı güncellendi:', id);
      return data;
    } catch (error) {
      console.error('Settlement güncellenirken hata:', error);
      throw error;
    }
  },

  /**
   * Settlement sil
   */
  delete: async (id) => {
    try {
      const { error } = await db.getClient()
        .from(SettlementModel.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Settlement delete hatası:', error);
        throw error;
      }

      console.log('Settlement kaydı silindi:', id);
      return true;
    } catch (error) {
      console.error('Settlement silinirken hata:', error);
      throw error;
    }
  },

  /**
   * Filtrelenmiş settlements getir (gelişmiş filtreleme)
   */
  getFiltered: async (filters = {}) => {
    try {
      let query = db.getClient().from(SettlementModel.tableName).select('*');

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

      // Order number filtresi
      if (filters.order_number) {
        query = query.eq('order_number', filters.order_number);
      }

      // Barcode filtresi
      if (filters.barcode) {
        query = query.eq('barcode', filters.barcode);
      }

      // Tutar aralığı filtreleri
      if (filters.min_amount) {
        query = query.gte('seller_revenue', filters.min_amount);
      }
      if (filters.max_amount) {
        query = query.lte('seller_revenue', filters.max_amount);
      }

      // Sıralama
      const orderField = filters.order_by || 'transaction_date';
      const orderDirection = filters.order_direction === 'asc' ? true : false;
      query = query.order(orderField, { ascending: orderDirection });

      // Pagination
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      } else if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Settlement getFiltered hatası:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Filtrelenmiş settlements alınırken hata:', error);
      throw error;
    }
  },

  /**
   * Settlement istatistiklerini getir
   */
  getStats: async (filters = {}) => {
    try {
      let query = db.getClient()
        .from(SettlementModel.tableName)
        .select('credit, debt, seller_revenue, commission_amount');

      // Filtreleri uygula
      if (filters.store_id) {
        query = query.eq('store_id', filters.store_id);
      }
      if (filters.transaction_type) {
        query = query.eq('transaction_type', filters.transaction_type);
      }
      if (filters.start_date) {
        query = query.gte('transaction_date', filters.start_date);
      }
      if (filters.end_date) {
        query = query.lte('transaction_date', filters.end_date);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Settlement getStats hatası:', error);
        throw error;
      }

      // Manuel hesaplama ile istatistikler
      const stats = (data || []).reduce((acc, item) => {
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

      // Ortalama hesaplamaları
      if (stats.count > 0) {
        stats.averageRevenue = stats.totalRevenue / stats.count;
        stats.averageCommission = stats.totalCommission / stats.count;
        stats.netAmount = stats.totalRevenue - stats.totalCommission;
      } else {
        stats.averageRevenue = 0;
        stats.averageCommission = 0;
        stats.netAmount = 0;
      }

      return stats;
    } catch (error) {
      console.error('Settlement istatistikleri alınırken hata:', error);
      return {
        totalCredit: 0,
        totalDebt: 0,
        totalRevenue: 0,
        totalCommission: 0,
        count: 0,
        averageRevenue: 0,
        averageCommission: 0,
        netAmount: 0
      };
    }
  }
};

module.exports = SettlementModel;
