const express = require('express');
const router = express.Router();
const PaymentService = require('../services/paymentService');
const { createClient } = require('@supabase/supabase-js');

const paymentService = new PaymentService();

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Auth middleware - Supabase JWT token kontrolü
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Header yoksa, giriş yapmış kullanıcı ID'sini kullan (test için)
      req.user = { id: 'af91f595-39f5-4f42-8e60-33a9e10cc189' }; // Console'dan gelen gerçek kullanıcı ID
      return next();
    }

    const token = authHeader.substring(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.error('Auth error:', error);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    req.user = { id: user.id };
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    // Hata durumunda da test kullanıcısını kullan
    req.user = { id: 'af91f595-39f5-4f42-8e60-33a9e10cc189' };
    next();
  }
};

// Ödemeleri listele
router.get('/', authenticateUser, async (req, res) => {
  try {
    const {
      store_id,
      api_type = 'settlements',
      start_date,
      end_date,
      transaction_type,
      page = 0,
      limit = 50
    } = req.query;

    const filters = {
      store_id,
      api_type,
      start_date,
      end_date,
      transaction_type,
      limit: parseInt(limit),
      offset: parseInt(page) * parseInt(limit)
    };

    const result = await paymentService.getPayments(filters);
    
    res.json({
      success: true,
      data: result.data,
      count: result.count,
      stats: result.stats,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Ödemeler listelenirken hata:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Otomasyon işini başlat
router.post('/automation/start', authenticateUser, async (req, res) => {
  try {
    console.log('=== AUTOMATION START ENDPOINT ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User:', req.user);
    
    const {
      storeId,
      apiType,
      transactionTypes,
      startDate,
      endDate,
      jobName
    } = req.body;

    if (!storeId || !apiType || !transactionTypes || !startDate || !endDate) {
      const error = 'Eksik parametreler';
      console.error('Parametre validation hatası:', {
        storeId: !!storeId,
        apiType: !!apiType,
        transactionTypes: !!transactionTypes,
        startDate: !!startDate,
        endDate: !!endDate
      });
      
      return res.status(400).json({
        success: false,
        error
      });
    }

    const params = {
      userId: req.user.id,
      storeId,
      apiType,
      transactionTypes,
      startDate,
      endDate,
      jobName
    };

    console.log('PaymentService.startAutomationJob çağrılıyor...');
    const result = await paymentService.startAutomationJob(params);
    
    console.log('PaymentService sonucu:', result);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('=== AUTOMATION START ENDPOINT HATASI ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Otomasyon işlerini listele
router.get('/automation/jobs', authenticateUser, async (req, res) => {
  try {
    const {
      store_id,
      status,
      page = 0,
      limit = 20
    } = req.query;

    const filters = {
      user_id: req.user.id,
      store_id,
      status,
      limit: parseInt(limit),
      offset: parseInt(page) * parseInt(limit)
    };

    const result = await paymentService.getAutomationJobs(filters);
    
    res.json({
      success: true,
      data: result.data,
      count: result.count,
      stats: result.stats,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Otomasyon işleri listelenirken hata:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Tek bir otomasyon işinin durumunu getir
router.get('/automation/jobs/:jobId', authenticateUser, async (req, res) => {
  try {
    const { jobId } = req.params;
    
    console.log('Job durumu istendi:', jobId);
    
    const result = await paymentService.getAutomationJobById(jobId, req.user.id);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Otomasyon işi bulunamadı'
      });
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Otomasyon işi durumu alınırken hata:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Otomasyon işini sil
router.delete('/automation/jobs/:jobId', authenticateUser, async (req, res) => {
  try {
    const { jobId } = req.params;
    
    console.log('Job siliniyor:', jobId);
    
    const result = await paymentService.deleteAutomationJob(jobId, req.user.id);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Otomasyon işi bulunamadı'
      });
    }
    
    res.json({
      success: true,
      message: 'Otomasyon işi silindi'
    });
  } catch (error) {
    console.error('Otomasyon işi silinirken hata:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Mağaza API'sini test et
router.post('/test-api/:storeId', authenticateUser, async (req, res) => {
  try {
    const { storeId } = req.params;
    
    const result = await paymentService.testStoreApi(storeId);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('API test hatası:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Transaction type seçeneklerini getir
router.get('/transaction-types/:apiType', authenticateUser, async (req, res) => {
  try {
    const { apiType } = req.params;
    
    const options = paymentService.getTransactionTypeOptions(apiType);
    
    res.json({
      success: true,
      data: options
    });
  } catch (error) {
    console.error('Transaction types alınırken hata:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Excel export
router.get('/export/excel', authenticateUser, async (req, res) => {
  try {
    const {
      store_id,
      api_type = 'settlements',
      start_date,
      end_date,
      transaction_type
    } = req.query;

    const filters = {
      store_id,
      api_type,
      start_date,
      end_date,
      transaction_type
    };

    const result = await paymentService.prepareExcelData(filters);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Excel verisi hazırlanamadı'
      });
    }

    // Basit CSV response (Excel kütüphanesi eklenecek)
    const csvContent = result.data.map(row => 
      Object.values(row).map(value => `"${value}"`).join(',')
    ).join('\n');
    
    const headers = Object.keys(result.data[0] || {}).map(key => `"${key}"`).join(',');
    const fullCsv = headers + '\n' + csvContent;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename.replace('.xlsx', '.csv')}"`);
    res.send(fullCsv);
    
  } catch (error) {
    console.error('Excel export hatası:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;