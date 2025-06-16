const { supabase } = require('../config/database');

const StoreModel = {
  // Tüm mağazaları getir
  getAll: async () => {
    const { data, error } = await supabase
      .from('Stores')
      .select('*');
    
    if (error) throw error;
    return data;
  },
  
  // ID ile mağaza getir
  getById: async (id) => {
    const { data, error } = await supabase
      .from('Stores')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },
  
  // Yeni mağaza ekle
  create: async (storeData) => {
    const { data, error } = await supabase
      .from('Stores')
      .insert([storeData])
      .select();
    
    if (error) throw error;
    return data[0];
  },
  
  // Mağaza güncelle
  update: async (id, storeData) => {
    const { data, error } = await supabase
      .from('Stores')
      .update(storeData)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  },
  
  // Mağaza sil
  delete: async (id) => {
    const { error } = await supabase
      .from('Stores')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
};

module.exports = StoreModel;