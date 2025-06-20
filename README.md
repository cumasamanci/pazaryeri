# Trendyol Pazaryeri Entegrasyonu

Bu proje, Trendyol pazaryeri platformu ile entegre çalışarak finansal verileri yönetmek, raporlamak ve mutabakat süreçlerini otomatikleştirmek için tasarlanmıştır. Netlify serverless fonksiyonları ve Supabase veritabanı kullanılarak modern bir mimari ile geliştirilmiştir.

## Özellikler

- **Mağaza Yönetimi**: Birden fazla Trendyol mağazasını tek panelden yönetme
- **Finansal Takip**: Satış, komisyon, iade ve diğer finansal verilerin detaylı takibi
- **Mutabakat Raporları**: Trendyol ve kendi verileriniz arasında otomatik mutabakat
- **Otomasyon**: Veri çekme, raporlama ve uyarı sistemleri
- **Kullanıcı Yönetimi**: Rol tabanlı yetkilendirme sistemi
- **Mobil Uyumlu**: Responsive tasarım ile her cihazdan erişim imkanı

## Proje Yapısı

```
pazaryeri-entegrasyon
 netlify/                        # Netlify serverless fonksiyonları
    functions/
        api.js                  # Ana API fonksiyonu
 src/
    app.js                      # Uygulama ana dosyası
    config/                     # Yapılandırma dosyaları
       database.js             # Supabase bağlantısı
       trendyol-api.js         # Trendyol API yapılandırması
    controllers/                # İstek yöneticileri
       accountingController.js # Muhasebe işlemleri
       authController.js       # Kimlik doğrulama
       dashboardController.js  # Gösterge paneli
       financeController.js    # Finansal işlemler
       reconciliationController.js # Mutabakat işlemleri
       reportController.js     # Raporlama
       storeController.js      # Mağaza yönetimi
    models/                     # Veri modelleri
       accountingModel.js      # Muhasebe modeli
       automationJobModel.js   # Otomasyon görevleri
       fetchLogModel.js        # Veri çekme logları
       financeModel.js         # Finansal işlemler
       orderModel.js           # Sipariş verileri
       reconciliationModel.js  # Mutabakat verileri
       storeModel.js           # Mağaza verileri
       userModel.js            # Kullanıcı modeli
    routes/                     # API rotaları
       accountingRoutes.js     # Muhasebe rotaları
       authRoutes.js           # Kimlik doğrulama rotaları
       financeRoutes.js        # Finansal rotalar
       reconciliationRoutes.js # Mutabakat rotaları
       storeRoutes.js          # Mağaza rotaları
    services/                   # İş mantığı servisleri
       authService.js          # Kimlik doğrulama servisi
       reconciliationService.js # Mutabakat servisi
       trendyolService.js      # Trendyol API servisi
    utils/                      # Yardımcı fonksiyonlar
        errorHandler.js         # Hata yönetimi
        validators.js           # Veri doğrulama
 public/                       # Statik dosyalar
    css/                       # CSS dosyaları
       style.css              # Genel stil dosyası
    js/                        # JavaScript dosyaları
       app.js                 # SPA uygulaması
       main.js                # Yardımcı fonksiyonlar
    index.html                 # Ana HTML sayfası
 .env.example                   # Örnek çevre değişkenleri
 .github/                       # GitHub iş akışları
    workflows/
        deploy.yml             # Netlify'a otomatik dağıtım
 netlify.toml                   # Netlify yapılandırması
 package.json                   # NPM yapılandırması
 README.md                      # Proje dokümantasyonu
```

## Kurulum

1. **Projeyi klonlayın:**
   ```bash
   git clone https://github.com/cumasamanci/pazaryeri.git
   cd pazaryeri
   ```

2. **Bağımlılıkları yükleyin:**
   ```bash
   npm install
   ```

3. **Çevre değişkenlerini yapılandırın:**
   - `.env.example` dosyasını `.env` olarak kopyalayın ve gerekli değerleri doldurun:
   ```bash
   cp .env.example .env
   ```

4. **Supabase Kurulumu:**
   - [Supabase](https://supabase.com) üzerinde yeni bir proje oluşturun
   - Oluşturulan URL ve anonim anahtarı `.env` dosyasındaki ilgili alanlara girin

5. **Netlify CLI ile geliştirme:**
   ```bash
   npm run dev
   ```

6. **Uygulamaya erişin:**
   - Tarayıcınızda `http://localhost:8888` adresini açın

## Dağıtım (Deployment)

### Netlify Üzerinde Dağıtım

1. **Netlify hesabı oluşturun:**
   - [Netlify](https://netlify.com) üzerinde hesap açın

2. **GitHub ile bağlantı kurun:**
   - Netlify Dashboard > "New site from Git" > GitHub'ı seçin
   - Bu repository'yi seçin
   - Deploy ayarlarını onaylayın (build komutu: `npm run build`)

3. **Çevre değişkenlerini ekleyin:**
   - Site Settings > Build & Deploy > Environment > Environment variables
   - Tüm gerekli çevre değişkenlerini buradan ekleyin (SUPABASE_URL, SUPABASE_ANON_KEY, vb.)

## Kullanım Kılavuzu

### Mağaza Yönetimi

1. Sisteme giriş yapın ve "Mağazalar" bölümüne gidin
2. "Yeni Mağaza Ekle" butonuna tıklayarak Trendyol mağazanızı ekleyin
3. API anahtarlarını ve mağaza bilgilerini doldurun
4. Mağaza kaydedildikten sonra otomatik olarak veri çekme işlemi başlayacaktır

### Mutabakat ve Raporlar

1. "Mutabakat" bölümünden tarih aralığı seçin
2. "Rapor Oluştur" butonuna tıklayarak mutabakat raporunu oluşturun
3. Detayları görüntülemek için rapor üzerine tıklayın
4. İsterseniz raporu Excel veya PDF formatında indirebilirsiniz

### Finansal İşlemler

1. "Finans" bölümünden finansal işlemlerinizi görüntüleyin
2. Filtreleri kullanarak belirli tarih aralıkları veya işlem türlerine göre listeleme yapın
3. Toplam kazanç, komisyon ve net kazanç bilgilerini gösterge panelinden takip edin

## Teknoloji Stack

- **Frontend**: HTML, CSS, JavaScript (SPA)
- **Backend**: Node.js, Express.js (Serverless Functions)
- **Veritabanı**: Supabase (PostgreSQL)
- **Hosting**: Netlify
- **CI/CD**: GitHub Actions

## Katkıda Bulunma

Katkılarınızı bekliyoruz! Geliştirmeler veya hata düzeltmeleri için lütfen bir issue açın veya pull request gönderin.

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## İletişim

Sorularınız veya önerileriniz için [issues](https://github.com/cumasamanci/pazaryeri/issues) bölümünü kullanabilirsiniz.
