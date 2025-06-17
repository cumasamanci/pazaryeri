const { createClient } = require('@supabase/supabase-js');

// Environment variables'ları yükle
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// Supabase bağlantısı
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Database config check:');
console.log('supabaseUrl:', supabaseUrl ? 'EXISTS' : 'MISSING');
console.log('supabaseKey:', supabaseKey ? 'EXISTS' : 'MISSING');
console.log('supabaseServiceKey:', supabaseServiceKey ? 'EXISTS' : 'MISSING');

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase environment variables are missing. Please check SUPABASE_URL and SUPABASE_ANON_KEY.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Admin operations için service key client (RLS bypass)
const supabaseAdmin = supabaseServiceKey ? 
  createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }) : supabase;

// Database işlemleri için yardımcı fonksiyonlar
const db = {
  /**
   * Tablodaki tüm kayıtları getirir
   * @param {string} table - Tablo adı
   * @returns {Promise} - Kayıtlar
   */
  getAll: async (table) => {
    const { data, error } = await supabase
      .from(table)
      .select('*');
    
    if (error) throw error;
    return data;
  },
  
  /**
   * Belirli bir kaydı ID ile getirir
   * @param {string} table - Tablo adı
   * @param {number|string} id - Kayıt ID'si
   * @returns {Promise} - Kayıt
   */
  getById: async (table, id) => {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },
  
  /**
   * Filtreleme ile kayıtları getirir
   * @param {string} table - Tablo adı
   * @param {Object} filters - Filtre kriterleri
   * @returns {Promise} - Kayıtlar
   */
  getByFilter: async (table, filters) => {
    let query = supabase.from(table).select('*');
    
    // Filtreleri uygula
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
  
  /**
   * Yeni kayıt ekler
   * @param {string} table - Tablo adı
   * @param {Object} data - Eklenecek veri
   * @returns {Promise} - Eklenen kayıt
   */
  create: async (table, data) => {
    const { data: result, error } = await supabase
      .from(table)
      .insert([data])
      .select();
    
    if (error) throw error;
    return result[0];
  },
  
  /**
   * Kayıt günceller
   * @param {string} table - Tablo adı
   * @param {number|string} id - Kayıt ID'si
   * @param {Object} data - Güncellenecek veri
   * @returns {Promise} - Güncellenen kayıt
   */
  update: async (table, id, data) => {
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return result[0];
  },
  
  /**
   * Kayıt siler
   * @param {string} table - Tablo adı
   * @param {number|string} id - Kayıt ID'si
   * @returns {Promise} - İşlem sonucu
   */
  delete: async (table, id) => {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  },
  
  /**
   * SQL sorgusu çalıştırır
   * @param {string} query - SQL sorgusu
   * @param {Array} params - Parametreler (Supabase'de desteklenmez, RPC kullanılmalı)
   * @returns {Promise} - Sorgu sonucu
   */
  query: async (query, params = []) => {
    // Supabase doğrudan SQL sorgularını desteklemiyor
    // Bunun yerine stored procedure kullanmamız gerekiyor
    // Şimdilik basit sorgular için alternatif yaklaşım
    throw new Error('Doğrudan SQL sorguları Supabase tarafından desteklenmemektedir. RPC kullanın.');
  },
  
  /**
   * Ham Supabase client'ı döndürür
   * Kompleks sorgular için kullanılabilir
   */
  getClient: () => supabase,

  /**
   * Admin client'ı döndürür (RLS bypass)
   */
  getAdminClient: () => supabaseAdmin
};

module.exports = { supabase, supabaseAdmin, db };