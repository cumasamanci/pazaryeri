const express = require('express');
const path = require('path');
const { sql, connectToMssql } = require('./config/database'); // sequelize kaldırıldı
const methodOverride = require('method-override');
const axios = require('axios');
const { setupDatabase, initializePool } = require('./db/dbUtils');

// Express uygulamasını oluştur
const app = express();

// PORT tanımı (şu an 3000 olarak tanımlı)
const PORT = process.env.PORT || 3000;

// Middleware'ler
try {
  const morgan = require('morgan');
  app.use(morgan('dev'));
} catch (error) {
  console.log('Morgan paketi bulunamadı, loglama devre dışı.');
}

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// PUT ve DELETE metotları için
app.use(methodOverride('_method'));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Debug modunu açmak için
if (process.env.DEBUG_API === 'true') {
  // Axios isteklerini logla
  axios.interceptors.request.use(request => {
    console.log('API İsteği:', request.method, request.url);
    console.log('Headers:', JSON.stringify(request.headers));
    return request;
  });

  // Axios yanıtlarını logla
  axios.interceptors.response.use(response => {
    console.log('API Yanıtı:', response.status, response.statusText);
    return response;
  }, error => {
    console.log('API Hatası:', error.message);
    return Promise.reject(error);
  });
}

// Ana başlatma fonksiyonu
async function startApp() {
  try {
    // Veritabanı havuzunu başlat ve tabloları oluştur
    await initializePool();
    await setupDatabase();
    
    // Sunucuyu başlat
    const server = app.listen(PORT, () => {
      console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor`);
      console.log("✅ Uygulama tam modunda çalışıyor");
    });
    
    // Port zaten kullanımda ise alternatif port dene
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`⚠️ Port ${PORT} zaten kullanımda, alternatif port deneniyor...`);
        const alternativePort = PORT + 1;
        app.listen(alternativePort, () => {
          console.log(`Sunucu alternatif port http://localhost:${alternativePort} adresinde çalışıyor`);
          console.log("✅ Uygulama tam modunda çalışıyor");
        });
      } else {
        console.error("❌ Sunucu başlatma hatası:", err.message);
      }
    });
    
  } catch (err) {
    console.error("❌ Uygulama başlatma hatası:", err.message);
  }
}

// Mevcut uygulamayı durdur ve yeniden başlat
function restartApp() {
  const find = require('find-process');
  
  find('port', PORT)
    .then(list => {
      if (list.length) {
        console.log(`${PORT} portunu kullanan mevcut işlem bulundu:`, list[0].name);
        
        // Windows'ta işlemi sonlandırma
        const { exec } = require('child_process');
        exec(`taskkill /F /PID ${list[0].pid}`, (err) => {
          if (err) {
            console.error(`İşlem sonlandırılamadı: ${err.message}`);
            startApp(); // Alternatif port ile başlat
          } else {
            console.log(`İşlem başarıyla sonlandırıldı, yeniden başlatılıyor...`);
            setTimeout(() => {
              startApp();
            }, 1000); // 1 saniye bekle ve yeniden başlat
          }
        });
      } else {
        startApp();
      }
    })
    .catch(err => {
      console.error('İşlem arama hatası:', err);
      startApp();
    });
}

// Uygulamayı başlat
restartApp();

// Routeları yüklemeden önce bir test sorgusu çalıştırın

// Veritabanı bağlantısı başarılı ise rotaları yükle
app.use(async (req, res, next) => {
  // İlk istek geldiğinde bağlantının hazır olup olmadığını kontrol et
  if (!global.dbChecked) {
    try {
      const { sql, pool } = require('./config/database');
      const testResult = await pool.request().query('SELECT 1 as test');
      console.log('✅ Veritabanı bağlantısı test edildi:', testResult.recordset);
      global.dbChecked = true;
    } catch (err) {
      console.error('❌ Veritabanı test sorgusu hatası:', err);
    }
  }
  next();
});

// Rotaları tanımlamadan önce middleware ekle
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Request received`);
  next();
});

// Rotalar
const indexRoutes = require('./routes/indexRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

app.use('/', indexRoutes);
app.use('/settings', settingsRoutes);
app.use('/payments', paymentRoutes);

// Henüz hazır olmayan routelar için şimdilik boş route tanımla
app.use('/reports', (req, res) => {
  res.render('maintenance', { 
    title: 'Raporlar',
    message: 'Raporlar modülü yakında hizmetinizde olacaktır.'
  });
});

app.use('/reconciliation', (req, res) => {
  res.render('maintenance', { 
    title: 'Mutabakat',
    message: 'Mutabakat modülü yakında hizmetinizde olacaktır.'
  });
});

app.use('/automation', (req, res) => {
  res.render('maintenance', { 
    title: 'Otomasyon',
    message: 'Otomasyon modülü yakında hizmetinizde olacaktır.'
  });
});

// Hata yakalama
app.use((err, req, res, next) => {
  console.error('Uygulama hatası:', err);
  res.status(500).render('error', { 
    title: 'Hata', 
    message: 'Bir hata oluştu', 
    error: err 
  });
});

// 404 sayfası
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Hata',
    message: 'İstediğiniz sayfa bulunamadı',
    error: { status: 404 }
  });
});