const express = require('express');
const router = express.Router();
const financeController = require('../controllers/financeController');
const authController = require('../controllers/authController');

// Kimlik doğrulama middleware'i
router.use(authController.authenticate);

// Finans özeti rotası
router.get('/summary', financeController.getSummary);

// Diğer finansal veriler rotası
router.get('/otherfinancials', financeController.getOtherFinancials);

// Finans kaydı oluşturma rotası
router.post('/records', financeController.createFinanceRecord);

// Finans kaydı güncelleme rotası
router.put('/records/:id', financeController.updateFinanceRecord);

// Finans kaydı silme rotası
router.delete('/records/:id', financeController.deleteFinanceRecord);

module.exports = router;