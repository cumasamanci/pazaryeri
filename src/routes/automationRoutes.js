const express = require('express');
const router = express.Router();
const automationController = require('../controllers/automationController');

router.get('/', automationController.showAutomation);
router.post('/schedule', automationController.scheduleTask);
router.post('/run-now', automationController.runTaskNow);
router.delete('/task/:id', automationController.deleteTask);

module.exports = router;