const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');

router.get('/dashboard', analyticsController.getDashboard);
router.get('/low-stock', analyticsController.getLowStock);

module.exports = router;
