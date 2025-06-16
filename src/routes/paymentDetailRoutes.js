const express = require('express');
const router = express.Router();
const paymentDetailController = require('../controllers/paymentDetailController');

// Ödeme detayları sayfasını göster
router.get('/:id', paymentDetailController.showDetail);

// Ödeme detaylarını filtrele
router.get('/api/:id', paymentDetailController.getDetailJson);

module.exports = router;