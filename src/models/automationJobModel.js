const { db } = require('../config/database');

// Automation Jobs Model - Supabase uyumlu
const AutomationJobModel = {
  // Tablo adı
  tableName: 'automation_jobs',

  // Tüm automation job'ları getir (filtreyle)
  getAll: async (filters = {}) => {
    try {
      let query = db.getClient().from(AutomationJobModel.tableName).select('*');

      // User ID filtresi
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }

      // Store ID filtresi
      if (filters.store_id) {
        query = query.eq('store_id', filters.store_id);
      }

      // Status filtresi
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      // API tipi filtresi
      if (filters.api_type) {
        query = query.eq('api_type', filters.api_type);
      }

      // Sıralama
      query = query.order('created_at', { ascending: false });

      // Limit ve offset
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Automation Jobs alınırken hata:', error);
      throw error;
    }
  },
  // Automation Job sayısını getir
  getCount: async (filters = {}) => {
    try {
      let query = db.getClient().from(AutomationJobModel.tableName).select('*', { count: 'exact', head: true });

      // Filtreleri ekle
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      if (filters.store_id) {
        query = query.eq('store_id', filters.store_id);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.api_type) {
        query = query.eq('api_type', filters.api_type);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Automation Job sayısı alınırken hata:', error);
      throw error;
    }
  },

  // İstatistik verilerini getir
  getStats: async (filters = {}) => {
    try {
      let query = db.getClient().from(AutomationJobModel.tableName).select('status');

      // Filtreleri ekle
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      if (filters.store_id) {
        query = query.eq('store_id', filters.store_id);
      }
      if (filters.api_type) {
        query = query.eq('api_type', filters.api_type);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Status'lara göre grupla
      const stats = {
        total: data.length,
        completed: 0,
        running: 0,
        pending: 0,
        failed: 0
      };

      data.forEach(job => {
        if (stats.hasOwnProperty(job.status)) {
          stats[job.status]++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Automation Job stats alınırken hata:', error);
      return {
        total: 0,
        completed: 0,
        running: 0,
        pending: 0,
        failed: 0
      };
    }
  },

  // ID ile automation job getir
  getById: async (id) => {
    try {
      const { data, error } = await db.getClient()
        .from(AutomationJobModel.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Automation Job ID: ${id} alınırken hata:`, error);
      throw error;
    }
  },  // Yeni automation job ekle
  create: async (jobData) => {
    try {
      console.log('=== AUTOMATION JOB CREATE DEBUG ===');
      console.log('Job Data:', JSON.stringify(jobData, null, 2));

      // Zorunlu alan kontrolü
      if (!jobData.user_id || !jobData.store_id || !jobData.job_name || !jobData.api_type) {
        throw new Error('user_id, store_id, job_name ve api_type alanları zorunludur');
      }      // Normal client kullan (service key geçersiz olduğu için)
      const client = db.getClient();
      console.log('Kullanılan client türü: Normal (service key placeholder)');

      const insertData = {
        ...jobData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Insert edilecek data:', JSON.stringify(insertData, null, 2));

      const { data, error } = await client
        .from(AutomationJobModel.tableName)
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Insert hatası detayı:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // RLS hatası özel mesajı
        if (error.message.includes('row-level security')) {
          throw new Error('Veritabanı güvenlik hatası: Lütfen sistem yöneticisi ile iletişime geçin. (RLS Policy)');
        }
        
        throw error;
      }
      
      console.log('Automation Job başarıyla oluşturuldu:', data);
      return data;
    } catch (error) {
      console.error('Automation Job oluşturulurken hata:', error);
      throw error;
    }
  },

  // Automation Job güncelle
  update: async (id, updateData) => {
    try {
      const { data, error } = await db.getClient()
        .from(AutomationJobModel.tableName)
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
      console.error(`Automation Job ID: ${id} güncellenirken hata:`, error);
      throw error;
    }
  },

  // Automation Job sil
  delete: async (id) => {
    try {
      const { error } = await db.getClient()
        .from(AutomationJobModel.tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error(`Automation Job ID: ${id} silinirken hata:`, error);
      throw error;
    }
  },

  // Aktif job'ları getir
  getActiveJobs: async () => {
    try {
      const { data, error } = await db.getClient()
        .from(AutomationJobModel.tableName)
        .select('*')
        .in('status', ['pending', 'running'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Aktif automation job\'lar alınırken hata:', error);
      throw error;
    }
  },

  // Job durumunu güncelle
  updateStatus: async (id, status, additionalData = {}) => {
    try {
      const updateData = {
        status,
        ...additionalData,
        updated_at: new Date()
      };

      const { data, error } = await db.getClient()
        .from(AutomationJobModel.tableName)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Automation Job status güncellenirken hata (ID: ${id}):`, error);
      throw error;
    }
  },
  // Son job'ları getir
  getRecentJobs: async (userId, limit = 10) => {
    try {
      const { data, error } = await db.getClient()
        .from(AutomationJobModel.tableName)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Son automation job\'lar alınırken hata:', error);
      throw error;
    }
  },

  // Automation job sil
  delete: async (id) => {
    try {
      const { error } = await db.getClient()
        .from(AutomationJobModel.tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error(`Automation Job silinirken hata (ID: ${id}):`, error);
      throw error;
    }
  }
};

module.exports = AutomationJobModel;