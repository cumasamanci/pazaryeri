const express = require('express');
const router = express.Router();
const accountingController = require('../controllers/accountingController');
const authController = require('../controllers/authController');

// Kimlik doğrulama middleware'i
router.use(authController.authenticate);

// Hesapları listele
router.get('/accounts', accountingController.getAccounts);

// Yeni hesap oluştur
router.post('/accounts', accountingController.createAccount);

// Hesap detayını getir
router.get('/accounts/:id', accountingController.getAccountById);

// Hesap güncelle
router.put('/accounts/:id', accountingController.updateAccount);

// Hesap sil
router.delete('/accounts/:id', accountingController.deleteAccount);

module.exports = router;