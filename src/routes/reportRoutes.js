const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// Raporları göster
router.get('/', reportController.showReports);

// Rapor oluşturma formunu göster
router.get('/create', reportController.showCreateForm);

// Rapor oluştur
router.post('/create', reportController.createReport);

// Belirli bir rapor detayını göster
router.get('/:id', reportController.showReportDetail);

// Raporu indir
router.get('/download/:id', reportController.downloadReport);

module.exports = router;