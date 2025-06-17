const { db } = require('../config/database');

// Tablo adı
const TABLE_NAME = 'stores';

const StoreModel = {
  // Tüm mağazaları getir
  getAll: async () => {
    try {
      return await db.getAll(TABLE_NAME);
    } catch (error) {
      console.error('Mağazalar alınırken hata:', error);
      throw error;
    }
  },
  
  // ID ile mağaza getir
  getById: async (id) => {
    try {
      return await db.getById(TABLE_NAME, id);
    } catch (error) {
      console.error(`ID: ${id} ile mağaza alınırken hata:`, error);
      throw error;
    }
  },
  
  // Mağaza getir (seller_id ile)
  getBySellerId: async (sellerId) => {
    try {
      const data = await db.getByFilter(TABLE_NAME, { seller_id: sellerId });
      return data[0] || null;
    } catch (error) {
      console.error(`SellerID: ${sellerId} ile mağaza alınırken hata:`, error);
      throw error;
    }
  },
  
  // Yeni mağaza ekle
  create: async (storeData) => {
    try {
      // Zorunlu alan kontrolü
      if (!storeData.name || !storeData.seller_id || !storeData.api_key) {
        throw new Error('Mağaza adı, seller_id ve api_key alanları zorunludur');
      }
      
      return await db.create(TABLE_NAME, {
        ...storeData,
        created_at: new Date(),
        updated_at: new Date()
      });
    } catch (error) {
      console.error('Mağaza eklenirken hata:', error);
      throw error;
    }
  },
  
  // Mağaza güncelle
  update: async (id, storeData) => {
    try {
      return await db.update(TABLE_NAME, id, {
        ...storeData,
        updated_at: new Date()
      });
    } catch (error) {
      console.error(`ID: ${id} ile mağaza güncellenirken hata:`, error);
      throw error;
    }
  },
    // Mağaza sil
  delete: async (id) => {
    try {
      return await db.delete(TABLE_NAME, id);
    } catch (error) {
      console.error(`ID: ${id} ile mağaza silinirken hata:`, error);
      throw error;
    }
  },
  
  // API durumunu kontrol et
  checkApiStatus: async (id) => {
    try {
      const store = await db.getById(TABLE_NAME, id);
      
      if (!store) {
        throw new Error('Mağaza bulunamadı');
      }
      
      // Trendyol API'sine test isteği yapılabilir
      // Bu örnekte sadece API anahtarı varlığını kontrol ediyoruz
      return {
        status: store.api_key ? 'active' : 'inactive',
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      console.error(`ID: ${id} ile API durumu kontrol edilirken hata:`, error);
      throw error;
    }
  }
};

module.exports = StoreModel;