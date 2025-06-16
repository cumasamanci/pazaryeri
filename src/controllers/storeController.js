const { pool, sql } = require('../config/database');

// Tüm mağazaları getir - DÜZELTME
exports.getStores = async (req, res) => {
  try {
    console.log('Mağaza listesi alınıyor...');
    
    // Sorgu basitleştirildi ve tablo ismi düzeltildi
    const query = `
      SELECT id, storeName, sellerId, apiKey, apiSecret, isActive, CreatedAt, UpdatedAt
      FROM [TrendyolFinance].[dbo].[Stores]`;
    
    console.log('Çalıştırılacak sorgu:', query);
    
    // Sorguyu çalıştır
    const result = await pool.request().query(query);
    
    console.log('Sorgu sonucu:', JSON.stringify(result, null, 2));
    console.log('Bulunan kayıt sayısı:', result.recordset ? result.recordset.length : 0);
    
    if (result.recordset && result.recordset.length > 0) {
      console.log('İlk mağaza:', JSON.stringify(result.recordset[0], null, 2));
    }
    
    // View'a veriyi gönder
    res.render('settings/index', {
      title: 'Ayarlar',
      stores: result.recordset || [],
      message: req.flash ? req.flash('success') : '',
      error: req.flash ? req.flash('error') : '',
      messageType: req.flash && req.flash('success') ? 'success' : 'error'
    });
    
    console.log('Mağaza listesi view\'a gönderildi');
  } catch (error) {
    console.error('Mağaza listesi alınırken hata:', error);
    res.render('settings/index', {
      title: 'Ayarlar',
      stores: [],
      message: '',
      error: 'Mağaza listesi alınırken bir hata oluştu: ' + error.message,
      messageType: 'error'
    });
  }
};

// Mağaza ekleme formunu render et
exports.renderAddStore = (req, res) => {
  res.render('settings/store-form', {
    title: 'Yeni Mağaza Ekle',
    store: null,
    isEdit: false, // Bu satırı ekleyin! isEdit değişkeni eklendi
    message: req.flash ? req.flash('success') : '',
    error: req.flash ? req.flash('error') : '',
    messageType: req.flash && req.flash('success') ? 'success' : 'error'
  });
};

// Mağaza oluştur - Düzeltilmiş versiyon
exports.createStore = async (req, res) => {
  try {
    console.log('Mağaza ekleme isteği alındı:', req.body);
    
    const { storeName, sellerId, apiKey, apiSecret } = req.body;

    // Gerekli alanlar kontrolü
    if (!storeName || !sellerId || !apiKey || !apiSecret) {
      if (req.flash) req.flash('error', 'Tüm alanları doldurmanız gerekiyor');
      return res.redirect('/settings/store');
    }

    // Şimdiki tarih
    const currentDateTime = new Date().toISOString();

    console.log('Mağaza ekleme sorgusu hazırlanıyor...');
    
    // Mağazayı oluştur - TAM TABLO YOLU İLE
    const result = await pool.request()
      .input('storeName', sql.NVarChar, storeName)
      .input('sellerId', sql.NVarChar, sellerId)
      .input('apiKey', sql.NVarChar, apiKey)
      .input('apiSecret', sql.NVarChar, apiSecret)
      .input('currentDateTime', sql.DateTime, currentDateTime)
      .query(`
        INSERT INTO [TrendyolFinance].[dbo].[Stores] (
          storeName, sellerId, apiKey, apiSecret, isActive, CreatedAt, UpdatedAt
        )
        VALUES (
          @storeName, @sellerId, @apiKey, @apiSecret, 1, @currentDateTime, @currentDateTime
        );
        SELECT SCOPE_IDENTITY() AS id;
      `);
    
    // Eklenen mağaza ID'sini logla
    const newStoreId = result.recordset[0]?.id;
    console.log('Yeni mağaza ID:', newStoreId);
    console.log('Mağaza başarıyla eklendi:', { storeName, sellerId });
    
    if (req.flash) req.flash('success', 'Mağaza başarıyla eklendi');
    res.redirect('/settings');
  } catch (error) {
    console.error('Mağaza eklenirken hata:', error);
    if (req.flash) req.flash('error', 'Mağaza eklenirken hata oluştu: ' + error.message);
    res.redirect('/settings/store');
  }
};

// Mağaza düzenleme formunu render et
exports.renderEditStore = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM [TrendyolFinance].[dbo].[Stores] WHERE id = @id');
    
    const store = result.recordset[0];
    
    if (!store) {
      if (req.flash) req.flash('error', 'Mağaza bulunamadı');
      return res.redirect('/settings');
    }
    
    res.render('settings/store-form', {
      title: 'Mağaza Düzenle',
      store,
      isEdit: true, // Bu satırı ekleyin! isEdit değişkeni eklendi
      message: req.flash ? req.flash('success') : '',
      error: req.flash ? req.flash('error') : '',
      messageType: req.flash && req.flash('success') ? 'success' : 'error'
    });
  } catch (error) {
    console.error('Mağaza düzenleme hatası:', error);
    if (req.flash) req.flash('error', 'Mağaza düzenlenirken bir hata oluştu');
    res.redirect('/settings');
  }
};

// Mağaza güncelle
exports.updateStore = async (req, res) => {
  try {
    const { id } = req.params;
    const { storeName, sellerId, apiKey, apiSecret } = req.body;
    
    // Gerekli alanlar kontrolü
    if (!storeName || !sellerId || !apiKey || !apiSecret) {
      if (req.flash) req.flash('error', 'Tüm alanları doldurmanız gerekiyor');
      return res.redirect(`/settings/store/${id}`);
    }
    
    await pool.request()
      .input('id', sql.Int, id)
      .input('storeName', sql.NVarChar, storeName)
      .input('sellerId', sql.NVarChar, sellerId)
      .input('apiKey', sql.NVarChar, apiKey)
      .input('apiSecret', sql.NVarChar, apiSecret)
      .query(`
        UPDATE Stores 
        SET storeName = @storeName, 
            sellerId = @sellerId, 
            apiKey = @apiKey, 
            apiSecret = @apiSecret
        WHERE id = @id
      `);
    
    if (req.flash) req.flash('success', 'Mağaza başarıyla güncellendi');
    res.redirect('/settings');
  } catch (error) {
    console.error('Mağaza güncelleme hatası:', error);
    if (req.flash) req.flash('error', 'Mağaza güncellenirken bir hata oluştu');
    res.redirect('/settings');
  }
};

// Mağaza sil
exports.deleteStore = async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Stores WHERE id = @id');
    
    if (req.flash) req.flash('success', 'Mağaza başarıyla silindi');
  } catch (error) {
    console.error('Mağaza silme hatası:', error);
    if (req.flash) req.flash('error', 'Mağaza silinirken bir hata oluştu');
  }
  
  res.redirect('/settings');
};

// Test için mağaza ekleme
exports.addTestStore = async (req, res) => {
  try {
    console.log('Test mağazası ekleniyor...');
    
    const result = await pool.request()
      .input('storeName', sql.NVarChar, 'Test Mağaza ' + new Date().toISOString())
      .input('sellerId', sql.NVarChar, Math.floor(100000 + Math.random() * 900000).toString())
      .input('apiKey', sql.NVarChar, 'test-api-key-' + Date.now())
      .input('apiSecret', sql.NVarChar, 'test-api-secret-' + Date.now())
      .query(`
        INSERT INTO Stores (storeName, sellerId, apiKey, apiSecret, isActive)
        VALUES (@storeName, @sellerId, @apiKey, @apiSecret, 1);
        SELECT SCOPE_IDENTITY() as id;
      `);
      
    console.log('Test mağazası eklendi, ID:', result.recordset[0]?.id);
    
    if (req.flash) req.flash('success', 'Test mağaza başarıyla eklendi');
    res.redirect('/settings');
  } catch (error) {
    console.error('Test mağaza eklenirken hata:', error);
    if (req.flash) req.flash('error', 'Test mağaza eklenirken hata oluştu');
    res.redirect('/settings');
  }
};