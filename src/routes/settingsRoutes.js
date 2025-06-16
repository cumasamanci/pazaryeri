const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const settingsController = require('../controllers/settingsController'); // Yeni kontrolcü import edin

// Ana ayarlar sayfası
router.get('/', storeController.getStores);

// Mağaza işlemleri
router.get('/store', storeController.renderAddStore);
router.post('/store', storeController.createStore); // POST isteğinin doğru tanımlandığından emin olun

// Mağaza düzenleme
router.get('/store/:id', storeController.renderEditStore);
router.post('/store/:id', storeController.updateStore);

// Mağaza silme
router.get('/store/delete/:id', storeController.deleteStore);

// Test mağazası ekle
router.get('/add-test-store', storeController.addTestStore);

// Genel ayarlar sayfası
router.get('/general', settingsController.renderGeneralSettings); // Yeni rota
router.post('/general', settingsController.updateGeneralSettings); // Ayarları güncellemek için

// Test API route ekleyin
router.post('/test-api', settingsController.testApiConnection);

module.exports = router;