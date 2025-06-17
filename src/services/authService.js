const { supabase } = require('../config/database');

/**
 * Supabase Auth kullanarak kimlik doğrulama servisi
 */
const AuthService = {
  /**
   * Kullanıcı girişi
   * @param {string} email - Kullanıcı e-posta adresi
   * @param {string} password - Kullanıcı şifresi
   * @returns {Promise} - Oturum bilgileri
   */
  login: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      // Kullanıcı profilini getir
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', data.user.id)
        .single();
      
      return {
        ...data,
        profile
      };
    } catch (error) {
      console.error('Giriş yapılırken hata:', error.message);
      throw error;
    }
  },
  
  /**
   * Kullanıcı kaydı
   * @param {string} email - Kullanıcı e-posta adresi
   * @param {string} password - Kullanıcı şifresi
   * @param {Object} userData - Kullanıcı profil bilgileri
   * @returns {Promise} - Kayıt sonucu
   */
  register: async (email, password, userData = {}) => {
    try {
      // Kullanıcıyı kaydet
      const { data: authData, error: authError } = await supabase.auth.signUp({
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