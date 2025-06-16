const { supabase } = require('../config/database');

const AuthService = {
  // Kullanıcı girişi
  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  },
  
  // Kullanıcı kaydı
  register: async (email, password, userData = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
    
    if (error) throw error;
    return data;
  },
  
  // Kullanıcı çıkışı
  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return true;
  },
  
  // Mevcut kullanıcıyı getir
  getCurrentUser: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data?.user || null;
  },
  
  // Oturum bilgilerini getir
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data?.session || null;
  }
};

module.exports = AuthService;