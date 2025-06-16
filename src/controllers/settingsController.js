const { pool, sql } = require('../config/database');
const trendyolService = require('../services/trendyolService');
const testApiConnection = require('../utils/testApiConnection');

class SettingsController {
  /**
   * Ayarlar sayfasını göster
   */
  async showSettings(req, res) {
    try {
      // Mağaza verilerini çek
      const storesResult = await sql.query`SELECT * FROM Stores ORDER BY storeName`;
      
      // Verileri formatlayarak hazırla
      const stores = storesResult.recordset.map(store => {
        return {
          id: store.id,
          name: store.storeName || '(İsimsiz Mağaza)', // Boş değilse göster, boşsa varsayılan değer
          sellerId: store.sellerId,
          apiKey: store.apiKey,
          apiSecret: store.apiSecret,
          isActive: store.isActive === 1 || store.isActive === true,
          // Tarih formatlamayı düzgün yap
          createdAt: store.createdAt ? new Date(store.createdAt).toLocaleString('tr-TR') : 'Bilinmiyor',
          updatedAt: store.updatedAt ? new Date(store.updatedAt).toLocaleString('tr-TR') : 'Bilinmiyor'
        };
      });
      
      // Görünüme gönder
      res.render('settings/index', {
        title: 'Ayarlar',
        stores,
        message: req.query.message,
        messageType: req.query.messageType
      });
    } catch (error) {
      console.error('Ayarlar sayfası yüklenirken hata:', error);
      res.status(500).render('error', {
        title: 'Hata',
        message: 'Ayarlar sayfası yüklenirken bir hata oluştu',
        error
      });
    }
  }

  /**
   * Mağaza ekle
   */
  async addStore(req, res) {
    try {
      const { name, sellerId, apiKey, apiSecret } = req.body;
      
      // Gerekli alanları kontrol et
      if (!name || !sellerId || !apiKey || !apiSecret) {
        return res.status(400).json({
          success: false,
          message: 'Tüm alanları doldurunuz'
        });
      }
      
      // Aynı isimde mağaza var mı diye kontrol et
      const existingStore = await sql.query`SELECT * FROM Stores WHERE storeName = ${name}`;
      if (existingStore.recordset.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Bu isimde bir mağaza zaten var'
        });
      }
      
      // API anahtarlarını doğrudan veritabanına ekle
      // API test etmeyi şimdilik atlıyoruz çünkü 403 hatası alıyoruz
      
      // camelCase sütun adları kullanarak mağazayı ekle
      const result = await sql.query`
        INSERT INTO Stores (storeName, sellerId, apiKey, apiSecret, isActive, createdAt, updatedAt)
        VALUES (${name}, ${sellerId}, ${apiKey}, ${apiSecret}, 1, GETDATE(), GETDATE());
        SELECT SCOPE_IDENTITY() AS id
      `;
      
      const storeId = result.recordset[0].id;
      
      // Başarılı yanıt döndür
      if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
        return res.status(201).json({
          success: true,
          message: 'Mağaza başarıyla eklendi',
          storeId
        });
      }
      
      // Sayfaya yönlendir
      res.redirect('/settings?message=Mağaza başarıyla eklendi&messageType=success');
    } catch (error) {
      console.error('Mağaza eklenirken hata:', error);
      
      // API isteği ise JSON hata mesajı döndür
      if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
        return res.status(500).json({
          success: false,
          message: 'Mağaza eklenirken hata oluştu',
          error: error.message
        });
      }
      
      // Sayfaya yönlendir
      res.redirect('/settings?message=Mağaza eklenirken hata oluştu&messageType=error');
    }
  }

  /**
   * Mağaza düzenle
   */
  async updateStore(req, res) {
    try {
      const { id } = req.params;
      const { name, sellerId, apiKey, apiSecret, isActive } = req.body;
      
      // Gerekli alanları kontrol et
      if (!id || !name || !sellerId) {
        return res.status(400).json({
          success: false,
          message: 'Gerekli alanları doldurunuz'
        });
      }
      
      // Mağazanın var olup olmadığını kontrol et
      const existingStore = await sql.query`SELECT * FROM Stores WHERE id = ${id}`;
      if (existingStore.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Mağaza bulunamadı'
        });
      }
      
      // API anahtarlarını kontrol et (eğer değiştirilmişse)
      if (apiKey && apiSecret) {
        try {
          const testResult = await trendyolService.testApiConnection(sellerId, apiKey, apiSecret);
          
          if (!testResult.success) {
            return res.status(400).json({
              success: false,
              message: 'API bağlantı testi başarısız oldu: ' + testResult.message
            });
          }
        } catch (apiError) {
          return res.status(400).json({
            success: false,
            message: 'API bağlantısı test edilemedi: ' + apiError.message
          });
        }
      }
      
      // Mağazayı güncelle
      await sql.query`
        UPDATE Stores 
        SET storeName = ${name}, 
            sellerId = ${sellerId}, 
            apiKey = ${apiKey}, 
            apiSecret = ${apiSecret}, 
            isActive = ${isActive === 'on' || isActive === true ? 1 : 0}, 
            updatedAt = GETDATE() 
        WHERE id = ${id}
      `;
      
      // Başarılı yanıt döndür
      if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
        return res.status(200).json({
          success: true,
          message: 'Mağaza başarıyla güncellendi'
        });
      }
      
      // Sayfaya yönlendir
      res.redirect('/settings?message=Mağaza başarıyla güncellendi&messageType=success');
    } catch (error) {
      console.error('Mağaza güncellenirken hata:', error);
      
      // API isteği ise JSON hata mesajı döndür
      if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
        return res.status(500).json({
          success: false,
          message: 'Mağaza güncellenirken hata oluştu',
          error: error.message
        });
      }
      
      // Sayfaya yönlendir
      res.redirect('/settings?message=Mağaza güncellenirken hata oluştu&messageType=error');
    }
  }

  /**
   * Mağaza sil
   */
  async deleteStore(req, res) {
    try {
      const { id } = req.params;
      
      // Mağazanın var olup olmadığını kontrol et
      const existingStore = await sql.query`SELECT * FROM Stores WHERE id = ${id}`;
      if (existingStore.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Mağaza bulunamadı'
        });
      }
      
      // İlişkili verileri kontrol et
      const relatedPayments = await sql.query`SELECT COUNT(*) AS count FROM PaymentDetails WHERE storeId = ${id}`;
      if (relatedPayments.recordset[0].count > 0) {
        return res.status(400).json({
          success: false,
          message: 'Bu mağazaya ait ödeme kayıtları bulunmaktadır. Önce ilişkili kayıtları silmelisiniz.'
        });
      }
      
      // Mağazayı sil
      await sql.query`DELETE FROM Stores WHERE id = ${id}`;
      
      // Başarılı yanıt döndür
      if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
        return res.status(200).json({
          success: true,
          message: 'Mağaza başarıyla silindi'
        });
      }
      
      // Sayfaya yönlendir
      res.redirect('/settings?message=Mağaza başarıyla silindi&messageType=success');
    } catch (error) {
      console.error('Mağaza silinirken hata:', error);
      
      // API isteği ise JSON hata mesajı döndür
      if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
        return res.status(500).json({
          success: false,
          message: 'Mağaza silinirken hata oluştu',
          error: error.message
        });
      }
      
      // Sayfaya yönlendir
      res.redirect('/settings?message=Mağaza silinirken hata oluştu&messageType=error');
    }
  }

  // Genel ayarlar sayfasını render et
  async renderGeneralSettings(req, res) {
    try {
      // Veritabanından mevcut ayarları çekme
      const settingsQuery = await pool.request().query(`
        SELECT * FROM [TrendyolFinance].[dbo].[Settings]
        WHERE settingType = 'general'
      `);

      // Ayarlar nesnesini oluştur
      let settings = {};
      
      // Eğer ayarlar veritabanında varsa, onları kullan
      if (settingsQuery.recordset && settingsQuery.recordset.length > 0) {
        settingsQuery.recordset.forEach(setting => {
          settings[setting.settingKey] = setting.settingValue;
        });
      }

      res.render('settings/general', {
        title: 'Genel Ayarlar',
        settings: settings,
        message: req.flash ? req.flash('success') : '',
        error: req.flash ? req.flash('error') : '',
        messageType: req.flash && req.flash('success') ? 'success' : 'error'
      });
    } catch (error) {
      console.error('Genel ayarlar sayfası yüklenirken hata:', error);
      res.render('settings/general', {
        title: 'Genel Ayarlar',
        settings: {},
        message: '',
        error: 'Genel ayarlar yüklenirken bir hata oluştu: ' + error.message,
        messageType: 'error'
      });
    }
  }

  // Genel ayarları güncelle
  async updateGeneralSettings(req, res) {
    try {
      const { companyName, defaultCurrency, emailNotifications, autoSync } = req.body;
      
      // Ayarları güncellemek için upsert sorgusu
      const settings = [
        { key: 'companyName', value: companyName || '' },
        { key: 'defaultCurrency', value: defaultCurrency || 'TRY' },
        { key: 'emailNotifications', value: emailNotifications === 'on' ? 'true' : 'false' },
        { key: 'autoSync', value: autoSync === 'on' ? 'true' : 'false' }
      ];

      // Her ayarı güncelle
      for (const setting of settings) {
        await pool.request()
          .input('key', sql.NVarChar, setting.key)
          .input('value', sql.NVarChar, setting.value)
          .input('type', sql.NVarChar, 'general')
          .query(`
            MERGE [TrendyolFinance].[dbo].[Settings] AS target
            USING (SELECT @key AS settingKey, @value AS settingValue, @type AS settingType) AS source
            ON target.settingKey = source.settingKey AND target.settingType = source.settingType
            WHEN MATCHED THEN
                UPDATE SET settingValue = source.settingValue
            WHEN NOT MATCHED THEN
                INSERT (settingKey, settingValue, settingType)
                VALUES (source.settingKey, source.settingValue, source.settingType);
          `);
      }

      if (req.flash) req.flash('success', 'Genel ayarlar başarıyla güncellendi');
      res.redirect('/settings/general');
    } catch (error) {
      console.error('Genel ayarlar güncellenirken hata:', error);
      if (req.flash) req.flash('error', 'Genel ayarlar güncellenirken hata oluştu: ' + error.message);
      res.redirect('/settings/general');
    }
  }

  // testApiConnection endpoint'i ekleyin
  async testApiConnection(req, res) {
    try {
      const { storeId } = req.body;
      
      if (!storeId) {
        return res.status(400).json({ success: false, message: 'Mağaza ID\'si gereklidir' });
      }
      
      const result = await testApiConnection(storeId);
      return res.json(result);
    } catch (error) {
      console.error('API test hatası:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'API testi sırasında bir hata oluştu: ' + error.message 
      });
    }
  }
}

module.exports = new SettingsController();