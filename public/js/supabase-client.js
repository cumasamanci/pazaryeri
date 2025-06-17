// Supabase Client Tanımı - Environment variables from window object or fallback
const supabaseUrl = window.SUPABASE_URL || 'https://kbbpoywbqrmucjrrefcq.supabase.co';
const supabaseAnonKey = window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiYnBveXdicXJtdWNqcnJlZmNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNTUzNDMsImV4cCI6MjA2NTYzMTM0M30.fN9-h7ouV6YJir_hAEauGA97tLH3m78svw86ET4OGZE';

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase CDN object:', window.supabase);

// Supabase client oluştur
let supabase;
try {
  // CDN'den gelen supabase object'ini kontrol et
  if (window.supabase && window.supabase.createClient) {
    supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
    console.log('Supabase client oluşturuldu (CDN)');
  } else if (typeof createClient !== 'undefined') {
    // Global createClient fonksiyonu varsa
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('Supabase client oluşturuldu (global createClient)');
  } else {
    throw new Error('Supabase createClient fonksiyonu bulunamadı');
  }
  
  // Global window.supabase objesini oluştur
  window.supabase = supabase;
  console.log('Supabase client window.supabase olarak atandı');
  
} catch (error) {
  console.error('Supabase client oluşturma hatası:', error);
  alert('Supabase bağlantısı kurulamadı. Lütfen sayfayı yenileyin.');
}

// Auth fonksiyonları
const auth = {
  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  },
  
  register: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });
    if (error) throw error;
    return data;
  },
  
  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return true;
  },
  
  getCurrentUser: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data?.user;
  }
};
