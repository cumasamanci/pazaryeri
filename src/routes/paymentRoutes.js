const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Ana sayfa - Ödemeler listesi
router.get('/', paymentController.getPayments);

// Trendyol'dan veri çek
router.post('/fetch', paymentController.fetchData);

// Verileri filtrele
router.post('/filter', paymentController.filterPayments);

// Excel export
router.get('/export', paymentController.exportExcel);

// Ödeme detayı
router.get('/:id', paymentController.getPaymentDetail);

module.exports = router;