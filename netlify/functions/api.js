const express = require('express');
const serverless = require('serverless-http');
const app = express();
const cors = require('cors');

// Environment variables'ları yükle - Netlify Functions için
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

console.log('Environment check in Netlify Function:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'EXISTS' : 'MISSING');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'EXISTS' : 'MISSING');
console.log('NODE_ENV:', process.env.NODE_ENV);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Routes
app.use('/api/stores', require('../../src/routes/storeRoutes'));
app.use('/api/payments', require('../../src/routes/paymentRoutes'));
app.use('/api/reports', require('../../src/routes/reportRoutes'));
app.use('/api/settings', require('../../src/routes/settingsRoutes'));
// ...diğer route'larınızı buraya ekleyin

// Test endpoint
app.get('/api', (req, res) => {
  res.json({ message: 'API çalışıyor!' });
});

// Hata yönetimi
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Sunucu hatası!' });
});

// 404 yönlendirmesi
app.use((req, res) => {
  res.status(404).json({ error: 'Sayfa bulunamadı!' });
});

// Serverless handler
module.exports.handler = serverless(app);