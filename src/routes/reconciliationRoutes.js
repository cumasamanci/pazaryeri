const express = require('express');
const router = express.Router();
const reconciliationController = require('../controllers/reconciliationController');

router.get('/', reconciliationController.showReconciliation);
router.post('/upload', reconciliationController.uploadFile);
router.get('/results', reconciliationController.showResults);

module.exports = router;