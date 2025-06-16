/**
 * Hata işleme fonksiyonu
 * Bu fonksiyon Express tarafından yakalanan hataları işler ve uygun yanıtı döndürür
 */
module.exports = (err, req, res, next) => {
  // Hata durumunu ve mesajını al
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Beklenmeyen bir hata oluştu';
  
  console.error('Hata yakalandı:', err);
  
  // API istekleri için JSON yanıtı
  if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
    return res.status(statusCode).json({
      status: 'error',
      message,
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  }
  
  // Normal sayfa istekleri için hata sayfası
  try {
    res.status(statusCode).render('error', {
      title: 'Hata',
      message,
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  } catch (renderError) {
    // Eğer render işlemi başarısız olursa basit HTML yanıtı gönder
    res.status(statusCode).send(`
      <html>
        <head><title>Hata</title></head>
        <body>
          <h1>Hata</h1>
          <p>${message}</p>
          <a href="/">Ana Sayfaya Dön</a>
        </body>
      </html>
    `);
  }
};